const eta = require("../lib/eta");
const { getAuthUser } = require("../lib/auth");

async function showLanding(c) {
  return c.html(eta.render("landing", { user: getAuthUser(c) }));
}

module.exports = { showLanding };
