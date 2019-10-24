const config = require('../config');

module.exports = bot => {
  if (config.isProduction) {
    bot.setWebHook(config.PUBLIC_URL).then(_ => console.log('[+] Webhook Set'));
  } else {
    bot
      .deleteWebHook()
      .then(val =>
        console.log(
          val ? '[+] Webhook Deleted' : '[-] Unable to delete Webhook'
        )
      );
  }
};
