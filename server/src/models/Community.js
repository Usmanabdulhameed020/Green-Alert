const mongoose = require('mongoose');

const communitySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Please provide a community name'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      default: '',
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    rules: [
      {
        type: String,
        trim: true,
        maxlength: [500, 'Rule cannot exceed 500 characters'],
      },
    ],
  },
  { timestamps: true }
);

const Community = mongoose.model('Community', communitySchema);
module.exports = Community;
