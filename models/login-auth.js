const mongoose = require('mongoose');
const { Schema } = mongoose;

const loginAuthSchema = new Schema({
  domainId: { type: Schema.Types.ObjectId, ref: 'Domain', required: true },
  userId: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  lastLogin: { type: Date, default: Date.now }
});

const LoginAuth = mongoose.model('LoginAuth', loginAuthSchema);
module.exports = LoginAuth;