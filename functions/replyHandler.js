const Media = require('./mediaHandler');
const { collection } = require('./firebaseHandler');
const { Template } = require('./templateHandler');
const Downloader = require('./fileHandler');
const media = require('../loader/cookieLoader');
const { shorten } = require('./shortenHandler');

const ENTITIES_REGEX = /(&quot;)/gi;
const welcomeText = `
Hi There!

Just share me a song from JioSaavn app and I will get back to you with the mp3 in original quality.

It's simple as it sounds.
`.trim();

const welcomeHandler = bot => (msg, _) => {
  const chatId = msg.chat.id;
  bot
    .sendMessage(chatId, welcomeText)
    .then(_ => {})
    .catch(err => console.log(err));
};

const linkHandler = bot => async (msg, match) => {
  const chatId = msg.chat.id;
  const waitMsg = await bot.sendMessage(chatId, 'Processing your request ....');
  const filteredMeta = ({
    title,
    album,
    singers,
    year,
    image_url,
    album_url,
    url
  }) => {
    return JSON.parse(
      JSON.stringify({
        title,
        album,
        singers,
        year,
        image_url,
        album_url,
        url
      }).replace(ENTITIES_REGEX, '')
    );
  };
  try {
    const absoluteUrl = await Media.getAbsoluteUrl(match[0]);
    const e_songid = absoluteUrl.split('/').pop();
    collection
      .doc(e_songid)
      .get()
      .then(async doc => {
        if (doc.exists) {
          console.log('found!');
          const template = Template(doc.data());
          bot.editMessageText(template.text, {
            chat_id: chatId,
            message_id: waitMsg.message_id,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: template.markup(e_songid)
          });
        } else {
          console.log('not found');
          const metaData = await Media.getMetaData(absoluteUrl);
          const filteredMetadata = filteredMeta(metaData);
          collection.doc(e_songid).set(filteredMetadata);
          const template = Template(filteredMetadata);
          await bot.editMessageText(template.text, {
            chat_id: chatId,
            message_id: waitMsg.message_id,
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
            reply_markup: template.markup(e_songid)
          });
        }
      })
      .catch(console.log);
  } catch (err) {
    bot.editMessageText(err.message, {
      chat_id: chatId,
      message_id: waitMsg.message_id
    });
  }
};

const markupBuilder = url => {
  return JSON.stringify({
    inline_keyboard: [[{ text: '🎶 Download', url }]]
  });
};

const callbackHandler = bot => query => {
  const downloadRegex = /\/download (.+)/;
  const cancelRegex = /\/cancel/;
  const download = query.data.match(downloadRegex);
  const cancel = query.data.match(cancelRegex);
  const chatId = query.from.id;
  const message_id = query.message.message_id;
  const envelope = { chatId, message_id };
  if (download) {
    const br = 128;
    const e_songid = download[1];
    const filename = `${e_songid}_${br}.mp3`;
    bot.sendChatAction(chatId, 'upload_audio');
    collection
      .doc(e_songid)
      .get()
      .then(doc => {
        sendMedia(bot)(doc, envelope, filename);
      })
      .catch(err => console.log(err));
  } else if (cancel) {
    bot.deleteMessage(chatId, message_id);
  }
};

const sendMedia = bot => async (doc, envelope, filename) => {
  if (doc.exists) {
    const { title, album, year } = doc.data();
    const savename = `${title} - ${album} (${year}).mp3`;
    const fileExist = await Downloader.checkExists(filename);
    if (fileExist) {
      const url = await Downloader.getUrl(filename, savename);
      const shorturl = await shorten(url);
      bot.editMessageReplyMarkup(markupBuilder(shorturl), {
        chat_id: envelope.chatId,
        message_id: envelope.message_id
      });
    } else {
      const url = await media.getMediaInfo(doc.data().url, 128);
      Downloader.fetchMedia(url.auth_url, filename, async () => {
        const url = await Downloader.getUrl(filename, savename);
        const shorturl = await shorten(url);
        bot.editMessageReplyMarkup(markupBuilder(shorturl), {
          chat_id: envelope.chatId,
          message_id: envelope.message_id
        });
      });
    }
  }
};

module.exports = {
  welcomeHandler,
  linkHandler,
  callbackHandler
};
