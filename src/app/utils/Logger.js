const { createLogger, format, transports } = require('winston');

const services = require('../../config/services');

const { combine, splat, timestamp, printf } = format;

const httpTransportOptions = {
  host: 'http-intake.logs.datadoghq.com',
  path: `/v1/input/${services.datadog.apiKey}?ddsource=nodejs&service=avbot`,
  ssl: true
};

const myFormat = printf(({ level: l, message: m, timestamp: t, ...metadata }) => {
  let msg = `⚡ ${t} [${l}] : ${m} `;
  if (metadata && JSON.stringify(metadata) !== '{}') {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

const logger = createLogger({
  level: 'debug',
  format: combine(format.colorize(), splat(), timestamp(), myFormat),
  transports: [
    new transports.Console(),
    new transports.File({
      filename: `${process.cwd()}/combined.log`
    }),
    new transports.Http(httpTransportOptions)
  ]
});

module.exports = logger;
