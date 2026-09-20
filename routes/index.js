const { Hono } = require("hono");
const { showLanding, showDashboard, showProducts } = require("../controllers/frontController");
const { requireAuth } = require("../lib/auth");

const index = new Hono();

index.get("/", (c) => {
	return showLanding(c);
});

index.get("/dashboard", requireAuth, showDashboard);
index.get("/products", requireAuth, showProducts);

module.exports = index;
