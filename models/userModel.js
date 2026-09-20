const db = require("../db/db");

async function getUserByEmail(email) {
  const [rows] = await db.query("SELECT * FROM users WHERE `Email` = ?", [
    email,
  ]);
  return rows[0] || null;
}

async function createUser(fullName, email, passwordHash) {
  const [result] = await db.query(
    "INSERT INTO users (`Full Name`, `Email`, `Password`) VALUES (?, ?, ?)",
    [fullName, email, passwordHash],
  );
  return result;
}

module.exports = { getUserByEmail, createUser };
