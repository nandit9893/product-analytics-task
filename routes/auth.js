const { Hono } = require('hono');
const { deleteCookie } = require('hono/cookie');
const { showSignupForm, signup, showSigninForm, signin } = require('../controllers/authController');
const { validateSignup, signupSchema, signinSchema, validateSignin } = require('../middleware/validate');
const { verifyTurnstile } = require('../middleware/verifyTurnstile');

const auth = new Hono();

auth.get('/signup', showSignupForm);
auth.post('/signup', verifyTurnstile, validateSignup(signupSchema), signup);

auth.get('/signin', showSigninForm);
auth.post('/signin', verifyTurnstile, validateSignin(signinSchema), signin);

auth.post('/logout', (c) => {
	deleteCookie(c, 'auth_token', { path: '/' });
	return c.redirect('/');
});

module.exports = auth;