const { Hono } = require("hono");
const { showLanding } = require("../controllers/landingController");
const { showDashboard } = require("../controllers/dashboardController");
const { showProducts } = require("../controllers/productsController");
const { requireAuth } = require("../lib/auth");

const index = new Hono();

index.get("/", showLanding);
index.get("/dashboard", requireAuth, showDashboard);
index.get("/products", requireAuth, showProducts);

module.exports = index;
