module.exports = {
  PUBLIC_URL: process.env.PUBLIC_URL + '/bot' + process.env.BOT_TOKEN,
  BOT_TOKEN: process.env.BOT_TOKEN,
  BOT_OPTIONS:
    process.env.NODE_ENV === 'production'
      ? {
          webHook: {
            port: process.env.PORT
          }
        }
      : {
          polling: true
        },
  DB_URL: process.env.DB_URL,
  isProduction: process.env.NODE_ENV === 'production'
};
