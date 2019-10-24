const Media = require('../functions/mediaHandler');

const media = new Media();
media.updateCookies().then(_ => {
  console.log('[+] Cookies Updated');
});

module.exports = media;
