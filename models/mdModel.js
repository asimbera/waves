const { Schema, model } = require('mongoose');

const mdSchema = new Schema({
  e_songid: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  album: String,
  singers: String,
  year: String,
  image_url: String,
  album_url: String,
  url: {
    type: String,
    required: true
  }
});

module.exports = model('Metadata', mdSchema);
