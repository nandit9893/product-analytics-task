const { serve } = require('@hono/node-server');
const { serveStatic } = require('@hono/node-server/serve-static');
const { Hono } = require('hono');
const auth = require('./routes/auth');
const index = require('./routes/index');
const config = require('./config/env');

const app = new Hono();

app.use('/public/*', serveStatic({ root: './' }));
app.use('/vendor/*', serveStatic({ root: './node_modules/chart.js/dist' }));

app.route('/auth', auth);
app.route('/', index);

serve({ fetch: app.fetch, port: config.port });
console.log(`Server running on http://localhost:${config.port}`);