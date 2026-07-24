const mongoose = require('mongoose');

const replySchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true },
}, { timestamps: true });

const commentSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true, trim: true, maxlength: 2000 },
  replies: [replySchema],
}, { timestamps: true });

const reportSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a report title'],
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Please provide a description'],
    },
    location: {
      type: String,
      required: [true, 'Please provide a location description'],
    },
    latitude: {
      type: Number,
    },
    longitude: {
      type: Number,
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
    },
    status: {
      type: String,
      enum: ['Submitted', 'Under Review', 'Assigned', 'In Progress', 'Resolved', 'Closed'],
      default: 'Submitted',
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical'],
      default: 'Medium',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'A report must belong to a user'],
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    imageUrl: {
      type: String,
      default: '',
    },
    images: {
      type: [String],
      default: [],
    },
    aiCategory: {
      type: String,
    },
    aiSummary: {
      type: String,
    },
    aiSeverity: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Critical', ''],
    },
    aiDuplicateOf: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
    aiSuggestedOrg: {
      type: String,
    },
    aiAnalyzed: {
      type: Boolean,
      default: false,
    },
    comments: [commentSchema],
    resolutionImages: {
      type: [String],
      default: [],
    },
    resolutionNotes: {
      type: String,
      default: '',
    },
    resolvedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual field for 'id' to map to '_id' for frontend compatibility
reportSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

const Report = mongoose.model('Report', reportSchema);
module.exports = Report;
