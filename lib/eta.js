const { Eta } = require('eta');
const path = require('path');

const eta = new Eta({
  views: path.join(__dirname, '..', 'views'),
  cache: process.env.NODE_ENV === 'production',
});

module.exports = eta;