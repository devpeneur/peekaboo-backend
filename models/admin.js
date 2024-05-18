const mongoose = require('mongoose');
const { Schema } = mongoose;

const adminSchema = new Schema({
  domainId: { type: Schema.Types.ObjectId, ref: 'Domain', required: true },
  adminId: { type: String, required: true, unique: true },
  apiKey: { type: String, required: true }
});

const Admin = mongoose.model('Admin', adminSchema);
module.exports = Admin;