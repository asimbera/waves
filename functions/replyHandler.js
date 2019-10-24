const Media = require('./mediaHandler');
const Metadata = require('../models/mdModel');
const Template = require('./templateHandler');
const Downloader = require('./fileHandler');
const media = require('../loader/cookieLoader');

const ENTITIES_REGEX = /(&quot;)/gi;

const welcomeHandler = bot => (msg, _) => {
  const chatId = msg.chat.id;
  bot
    .sendMessage(chatId, 'Hello There!'.toString())
    .then(res => {})
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
    e_songid,
    url
  }) => {
    return JSON.parse(
      JSON.stringify({
        e_songid,
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
    Metadata.findOne({ e_songid }, async (err, data) => {
      if (err) {
        console.log(err);
        return;
      }
      if (data) {
        const template = Template(data, msg.chat.id, waitMsg.message_id);
        bot.editMessageText(template.text, {
          chat_id: chatId,
          message_id: waitMsg.message_id,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
          reply_markup: template.markup()
        });
      } else {
        const metaData = await Media.getMetaData(absoluteUrl);
        const filteredMetadata = filteredMeta(metaData);
        const doc = await Metadata.create(filteredMetadata);
        const template = Template(doc, msg.chat.id, waitMsg.message_id);
        await bot.editMessageText(template.text, {
          chat_id: chatId,
          message_id: waitMsg.message_id,
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
          reply_markup: template.markup()
        });
      }
    });
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
  const br = 128;
  if (download) {
    bot.sendChatAction(chatId, 'upload_audio');
    Metadata.findOne({ e_songid: download[1] }, async (err, data) => {
      try {
        let filename = data.e_songid + '_' + br + '.mp3';
        const savename = `${data.title} - ${data.album} (${data.year}).mp3`;
        // console.log(`Download Requested: ${data.title}\nFile: ${filename}`);
        const ifExists = await Downloader.checkExists(filename);
        if (ifExists) {
          // TODO
          // console.log(await Downloader.getUrl(filename, savename));
          const publicUrl = await Downloader.getUrl(filename, savename);
          bot.editMessageReplyMarkup(markupBuilder(publicUrl), {
            chat_id: chatId,
            message_id: message_id
          });
        } else {
          const cdn_res = await media.getMediaInfo(data.url, br);
          // console.log(`auth_url: ${cdn_res.auth_url}`);
          Downloader.fetchMedia(cdn_res.auth_url, filename, async () => {
            // TODO
            console.log(`Downloaded: ${filename}`);
            const publicUrl = await Downloader.getUrl(filename, savename);
            bot.editMessageReplyMarkup(markupBuilder(publicUrl), {
              chat_id: chatId,
              message_id: message_id
            });
          });
        }
      } catch (e) {
        console.log(e.message);
      }
    });
  } else if (cancel) {
    bot.deleteMessage(chatId, message_id);
  }
};

module.exports = {
  welcomeHandler,
  linkHandler,
  callbackHandler
};
