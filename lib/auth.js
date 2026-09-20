const jwt = require("jsonwebtoken");
const { getCookie } = require("hono/cookie");
const config = require("../config/env");

function getAuthUser(c) {
  const token = getCookie(c, "auth_token");

  if (!token) {
    return null;
  }

  try {
    return jwt.verify(token, config.sessionSecret);
  } catch {
    return null;
  }
}

async function requireAuth(c, next) {
  const user = getAuthUser(c);

  if (!user) {
    return c.redirect("/auth/signin");
  }

  c.set("user", user);
  await next();
}

module.exports = { getAuthUser, requireAuth };
