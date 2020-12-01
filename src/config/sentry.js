const Sentry = require('@sentry/node');
const services = require('./services');

Sentry.init({
  dsn: services.sentry.dsn
});
