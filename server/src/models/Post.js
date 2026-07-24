const mongoose = require('mongoose');

const postSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      required: [true, 'Post content is required'],
      trim: true,
      maxlength: [2000, 'Content cannot exceed 2000 characters'],
    },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
    tags: [
      {
        type: String,
        enum: ['Alert', 'Cleanup', 'Discussion', 'Event', 'Question'],
      },
    ],
    reactions: [
      {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        type: { type: String, enum: ['like', 'heart', 'fire'] },
      },
    ],
  },
  { timestamps: true }
);

postSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

postSchema.set('toJSON', { virtuals: true });
postSchema.set('toObject', { virtuals: true });

const Post = mongoose.model('Post', postSchema);
module.exports = Post;
