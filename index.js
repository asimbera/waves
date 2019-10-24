const Telegram = require('node-telegram-bot-api');
const Handler = require('./functions/replyHandler');
const config = require('./config');

const URL_REGEX = /((http|https):\/\/)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,6}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/;

// create bot, stats client
const bot = new Telegram(config.BOT_TOKEN, config.BOT_OPTIONS);
// run loaders
require('./loader/hookLoader')(bot);
require('./loader/cookieLoader');
require('./loader/mongoLoader');

bot.onText(/\/start/, Handler.welcomeHandler(bot));
bot.onText(URL_REGEX, Handler.linkHandler(bot));
// bot.on('polling_error', console.log);
bot.on('callback_query', Handler.callbackHandler(bot));

process.on('SIGINT', () => {
  console.log('[-] Recieved SIGINT. Exiting cleanly....');
  process.exit(0);
});
