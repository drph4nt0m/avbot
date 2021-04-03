const Sentry = require('@sentry/node');
const services = require('./services');

if (services.environment === 'production') {
  Sentry.init({
    dsn: services.sentry.dsn
  });
}
