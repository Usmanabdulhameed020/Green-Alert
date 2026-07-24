const mongoose = require('mongoose');

const pollSchema = new mongoose.Schema(
  {
    question: {
      type: String,
      required: [true, 'Poll question is required'],
      trim: true,
      maxlength: [300, 'Question cannot exceed 300 characters'],
    },
    options: [
      {
        text: { type: String, required: true, trim: true, maxlength: 200 },
        voters: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
      },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    community: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Community',
      required: true,
    },
    expiresAt: {
      type: Date,
    },
  },
  { timestamps: true }
);

pollSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

pollSchema.set('toJSON', { virtuals: true });
pollSchema.set('toObject', { virtuals: true });

const Poll = mongoose.model('Poll', pollSchema);
module.exports = Poll;
