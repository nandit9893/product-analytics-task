const config = require('../config/env');

async function verifyTurnstile(c, next) {
  if (config.nodeEnv !== 'production') {
    await next();
    return;
  }

  const body = await c.req.parseBody();
  const token = body['cf-turnstile-response'];

  const result = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: config.turnstileSecretKey,
      response: token,
    }),
  });

  const data = await result.json();
  if (!data.success) {
    return c.html('Verification failed', 400);
  }

  await next();
}

module.exports = { verifyTurnstile };