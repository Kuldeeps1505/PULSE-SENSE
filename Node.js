const crypto = require('crypto');
const SESSION_SECRET = crypto.randomBytes(32).toString('hex');
console.log(SESSION_SECRET);