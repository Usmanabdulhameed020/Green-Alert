const mongoose = require('mongoose');

const replySchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Reply content is required'],
      trim: true,
      maxlength: [1000, 'Reply cannot exceed 1000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    post: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Post',
      required: true,
    },
  },
  { timestamps: true }
);

replySchema.virtual('id').get(function () {
  return this._id.toHexString();
});

replySchema.set('toJSON', { virtuals: true });
replySchema.set('toObject', { virtuals: true });

const Reply = mongoose.model('Reply', replySchema);
module.exports = Reply;
