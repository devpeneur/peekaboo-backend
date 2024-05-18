const mongoose = require('mongoose');
const { Schema } = mongoose;

const userActivitySchema = new Schema({
  domainId: { type: Schema.Types.ObjectId, ref: 'Domain', required: true },
  userId: { type: String, required: true },
  active: { type: Boolean, default: false },
  servedCachedVersion: { type: Boolean, default: false },
  servedFallbackVersion: { type: Boolean, default: false },
  transferredToClient: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

const UserActivity = mongoose.model('UserActivity', userActivitySchema);
module.exports = UserActivity;
