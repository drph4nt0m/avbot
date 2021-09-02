const { createLogger, format, transports } = require('winston');

const { combine, splat, timestamp, printf } = format;

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
    })
  ]
});

module.exports = logger;
