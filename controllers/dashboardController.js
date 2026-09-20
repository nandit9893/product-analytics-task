const eta = require("../lib/eta");
const { getDashboardStats } = require("../services/productService");

async function showDashboard(c) {
  const productStats = await getDashboardStats();

  return c.html(
    eta.render("dashboard", {
      title: "Dashboard",
      user: c.get("user"),
      productStats,
    })
  );
}

module.exports = { showDashboard };
