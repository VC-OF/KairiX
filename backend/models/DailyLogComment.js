const mongoose = require('mongoose');

const DailyLogCommentSchema = new mongoose.Schema({
  logId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyLog', required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyLogComment', default: null },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  score: { type: Number, default: 1 },
  upvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  downvotedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

module.exports = mongoose.model('DailyLogComment', DailyLogCommentSchema);
