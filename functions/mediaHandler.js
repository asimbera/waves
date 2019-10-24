const rp = require('request-promise');
const cheerio = require('cheerio');

const userAgent =
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/77.0.3865.90 Safari/537.36';
const agent = rp.defaults({
  baseUrl: 'https://www.jiosaavn.com/',
  followRedirect: false,
  headers: {
    'user-agent': userAgent
  }
});

/**
 * @callback URLCallback
 * @param {(Error|null)} err Error Object
 * @param {(string|null)} path Path String
 */

class Media {
  constructor(cookie) {
    this.cookie = cookie;
  }
  /**
   * Update Cookies in Object Scope
   */
  async updateCookies() {
    try {
      let cookies = ['L=hindi', 'jwplayer.volume=75'];
      const primary = await agent('/', {
        resolveWithFullResponse: true,
        simple: false
      });
      const primaryCookies = primary.headers['set-cookie'].map(
        v => String(v).split(';')[0]
      );
      // console.log(primaryCookies);
      cookies.push(...primaryCookies);
      const fp = Math.random()
        .toString(12)
        .split('.')
        .pop();
      const secondary = await agent('/stats.php', {
        resolveWithFullResponse: true,
        simple: false,
        headers: {
          cookie: [...new Set(cookies)].join('; ')
        },
        qs: {
          ev: 'site:browser:fp',
          fp,
          _t: Date.now(),
          ct: Math.random()
            .toFixed(10)
            .split('.')
            .pop()
        }
      });
      const secondaryCookies = secondary.headers['set-cookie'].map(
        v => String(v).split(';')[0]
      );
      // console.log(secondaryCookies);
      cookies.push(...secondaryCookies);
      cookies.push(`_fp=${fp}`);
      this.cookie = [...new Set(cookies)].join('; ');
    } catch (error) {
      console.error(error);
    }
  }
  /**
   * Extract absolute path of a media URL
   * @param {string} url URL to extract path from
   * @param {?URLCallback} cb Callback function returning path
   * @returns {(Promise<string>|null)}
   */
  static async getAbsoluteUrl(url, cb) {
    const link = new URL(url);
    if (link.hostname === 'www.jiosaavn.com') {
      if (cb) return cb(null, link.pathname);
      return link.pathname;
    } else if (link.hostname === 'www.saavn.com') {
      try {
        const redir = await rp.get(link.href, {
          followRedirect: false,
          simple: false,
          resolveWithFullResponse: true
        });
        const location = new URL(redir.headers.location).pathname;
        if (cb) return cb(null, location);
        return location;
      } catch (err) {
        if (cb) return cb(err, null);
        throw err;
      }
    } else {
      const UNSUPPORTED_LINK_MSG = new Error('Uh-oh! Unsuppoted Link');
      if (cb) return cb(UNSUPPORTED_LINK_MSG, null);
      throw UNSUPPORTED_LINK_MSG;
    }
  }
  /**
   * Fetch metadata of requested media URL
   * @param {string} url URL Path returned from getAbsoluteUrl Function
   * @param {URLCallback} cb Callback to handle metadata
   * @return {Promise<String>}
   */
  static async getMetaData(url, cb) {
    try {
      const doc = await agent.get(url);
      const $ = cheerio.load(doc);
      const song_json = $('div.meta-info div.hide.song-json').text();
      if (cb) return cb(null, JSON.parse(song_json));
      return JSON.parse(song_json);
    } catch (_) {
      const err = new Error('Opps! Something Went Wrong.');
      if (cb) return cb(err, null);
      throw err;
    }
  }
  /**
   * Fetch media content from CDN
   * @param {String} url URL to fetch from CDN
   * @param {Number} br Bit Rate of requested media
   * @param {URLCallback} cb Callback function
   */
  async getMediaInfo(url, br = 128, cb) {
    try {
      const cdnInfo = await agent.post('/api.php', {
        headers: {
          cookie: this.cookie
        },
        form: {
          url,
          __call: 'song.generateAuthToken',
          _marker: false,
          _format: 'json',
          bitrate: br
        }
      });
      if (cb) return cb(null, cdnInfo);
      return JSON.parse(cdnInfo);
    } catch (error) {
      const ERROR_MSG = new Error('Uh-oh! Something Went Wrong.');
      if (cb) return cb(ERROR_MSG, null);
      throw ERROR_MSG;
    }
  }
}

module.exports = Media;
