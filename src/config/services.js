module.exports = {
  discord: {
    token: process.env.DISCORD_TOKEN,
    supportServerInvite: process.env.SUPPORT_SERVER_INVITE,
    owners: process.env.BOT_OWNERS,
    newGuildChannel: process.env.GUILDS_CHANNEL,
    botRestartChannel: process.env.BOT_RESTART_CHANNEL,
  },
  dbl: {
    token: process.env.DBL_TOKEN,
  },
  avwx: {
    token: process.env.AVWX_TOKEN,
  },
  avbrief3: {
    token: process.env.AVBRIEF3_TOKEN,
  },
  mongodb: {
    uri: process.env.MONGODB_URI,
  },
  sentry: {
    dsn: process.env.SENTRY_DSN,
  },
};
