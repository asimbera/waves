const request = require('request');
const day = require('dayjs');
const { bucket } = require('./firebaseHandler');

module.exports = {
  fetchMedia: async (url, filename, cb) => {
    try {
      const file = bucket.file(filename);
      const stream = file.createWriteStream({ public: true });
      request(url)
        .pipe(stream)
        .on('error', console.log)
        .on('finish', () => cb());
    } catch (err) {
      console.log(err);
    }
  },
  checkExists: async filename => {
    try {
      const file = bucket.file(filename);
      const exists = await file.exists();
      return exists[0];
    } catch (err) {
      console.log(err);
    }
  },
  getUrl: async (filename, saveName) => {
    try {
      const file = bucket.file(filename);
      const signedUrl = await file.getSignedUrl({
        action: 'read',
        expires: day()
          .add(3, 'day')
          .valueOf(),
        promptSaveAs: saveName
      });
      return signedUrl[0];
    } catch (error) {
      console.log(error);
    }
  }
};
