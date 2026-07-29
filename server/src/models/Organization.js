const mongoose = require('mongoose');

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Organization name is required'],
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    email: {
      type: String,
      required: [true, 'Contact email is required'],
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: [true, 'Contact phone is required'],
    },
    address: {
      type: String,
      required: [true, 'Physical address is required'],
    },
    website: {
      type: String,
    },
    category: {
      type: String,
      required: [true, 'Service category is required'],
      enum: [
        'Waste Management',
        'Drainage & Flood Control',
        'Oil & Chemical Spill Response',
        'Air Quality Management',
        'Water Treatment',
        'Parks & Forestry',
        'Roads & Infrastructure',
        'Multi-Purpose',
      ],
    },
    licenseNumber: {
      type: String,
    },
    licenseDocument: {
      type: String,
    },
    verified: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Suspended'],
      default: 'Inactive',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  { timestamps: true }
);

organizationSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

organizationSchema.set('toJSON', { virtuals: true });
organizationSchema.set('toObject', { virtuals: true });

const Organization = mongoose.model('Organization', organizationSchema);
module.exports = Organization;
