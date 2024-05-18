const mongoose = require('mongoose');

const domainSchema = new mongoose.Schema({
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const Domain = mongoose.model('Domain', domainSchema);
module.exports = Domain;
