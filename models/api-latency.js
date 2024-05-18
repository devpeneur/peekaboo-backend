const mongoose = require('mongoose');
const { Schema } = mongoose;

const apiLatencySchema = new Schema({
  domainId: { type: Schema.Types.ObjectId, ref: 'Domain', required: true },
  timestamp: { type: Date, default: Date.now },
  latencyP95: { type: Number, required: true }, // p95 latency in milliseconds
  currentLatency: { type: Number, required: true } // current latency in milliseconds
});

const ApiLatency = mongoose.model('ApiLatency', apiLatencySchema);
module.exports = ApiLatency;
