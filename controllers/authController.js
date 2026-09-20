const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { setCookie } = require("hono/cookie");
const { getUserByEmail, createUser } = require("../models/userModel");
const eta = require("../lib/eta");
const config = require("../config/env");

async function showSignupForm(c) {
  return c.html(
    eta.render("signup", {
      error: null,
      turnstileSiteKey: config.turnstileSiteKey,
      fullName: "",
      email: "",
    })
  );
}

async function showSigninForm(c) {
  return c.html(
    eta.render("signin", {
      error: null,
      success: c.req.query("success") || null,
      turnstileSiteKey: config.turnstileSiteKey,
      email: "",
    })
  );
}

async function signup(c) {
  const { fullName, email, password } = c.get("validated");

  try {
    const existing = await getUserByEmail(email);
    if (existing) {
      return c.html(
        eta.render("signup", {
          error: "Email already registered",
          turnstileSiteKey: config.turnstileSiteKey,
          fullName,
          email,
        })
      );
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await createUser(fullName, email, passwordHash);

    return c.redirect(
      `/auth/signin?success=${encodeURIComponent("Account created successfully. Please sign in.")}`
    );
  } catch (err) {
    console.error("Signup error:", err);
    return c.html(
      eta.render("signup", {
        error: "An unexpected error occurred. Please try again.",
        turnstileSiteKey: config.turnstileSiteKey,
        fullName,
        email,
      })
    );
  }
}

async function signin(c) {
  const { email, password } = c.get("validated");

  try {
    const user = await getUserByEmail(email);
    if (!user) {
      return c.html(
        eta.render("signin", {
          error: "Account not registered",
          turnstileSiteKey: config.turnstileSiteKey,
          email,
        })
      );
    }

    const hash = user.Password;
    const isValidPassword = await bcrypt.compare(password, hash);

    if (!isValidPassword) {
      return c.html(
        eta.render("signin", {
          error: "Password is incorrect",
          turnstileSiteKey: config.turnstileSiteKey,
          email,
        })
      );
    }

    const token = jwt.sign(
      { email: user.Email, fullName: user["Full Name"] },
      config.sessionSecret,
      { expiresIn: "1d" }
    );

    setCookie(c, "auth_token", token, {
      httpOnly: true,
      secure: config.nodeEnv === "production",
      sameSite: "Lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return c.redirect("/dashboard");
  } catch (err) {
    console.error("Signin error:", err);
    return c.html(
      eta.render("signin", {
        error: "An unexpected error occurred. Please try again.",
        turnstileSiteKey: config.turnstileSiteKey,
        email,
      })
    );
  }
}

module.exports = {
  showSignupForm,
  signup,
  showSigninForm,
  signin,
};