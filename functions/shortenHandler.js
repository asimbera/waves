const rp = require('request-promise');

module.exports.shorten = async url => {
  const res = await rp.post('https://asim.space/shorten', {
    body: {
      longurl: url
    },
    json: true
  });
  if (res.error) throw new Error(res.error);
  return res.shorturl;
};
