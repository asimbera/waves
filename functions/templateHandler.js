module.exports = {
  Template: (doc, e_songid) => {
    return {
      text: `*${doc.title}*\n${'-'.repeat(35)}\n*Album:* [${doc.album}](${
        doc.album_url
      })\n*Singers:* ${doc.singers}\n*Year:* ${doc.year}`,
      markup: () =>
        JSON.stringify({
          inline_keyboard: [
            [
              { text: '🎶 Proceed', callback_data: `/download ${e_songid}` },
              { text: '❌ Cancel', callback_data: `/cancel` }
            ]
          ]
        })
    };
  }
};
