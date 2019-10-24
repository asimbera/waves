const admin = require('firebase-admin');
const crypto = require('crypto');
const fs = require('fs');

const algo = 'aes-256-cbc';
const key = process.env.ENC_KEY;

function decrypt(text) {
  let iv = Buffer.from(text.iv, 'hex');
  let encryptedText = Buffer.from(text.encryptedData, 'hex');
  let decipher = crypto.createDecipheriv(algo, Buffer.from(key, 'hex'), iv);
  let decrypted = decipher.update(encryptedText);
  decrypted = Buffer.concat([decrypted, decipher.final()]);
  return decrypted.toString();
}
const buffer = fs.readFileSync('./waves.enc');
const decrypted = decrypt(JSON.parse(buffer.toString()));

const serviceAccount = JSON.parse(decrypted);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: 'waves-b5645.appspot.com'
});

module.exports = admin.storage().bucket();
