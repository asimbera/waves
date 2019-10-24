const mongoose = require('mongoose');
const config = require('../config');

mongoose.connect(config.DB_URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
});
const db = mongoose.connection;

db.on('error', console.log.bind(console, 'Error: '));
db.once('open', () => console.log('[+] Database Connected'));
