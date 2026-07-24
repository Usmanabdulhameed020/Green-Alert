const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: [true, 'Please provide your full name'],
      trim: true,
    },
    email: {
      type: String,
      required: [true, 'Please provide your email'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
      default: '',
    },
    password: {
      type: String,
      required: [true, 'Please provide a password'],
      minlength: 6,
      select: false,
    },
    role: {
      type: String,
      enum: ['citizen', 'agency', 'admin'],
      default: 'citizen',
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    avatar: {
      type: String,
      default: '',
    },
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
    },
    passwordChangeCode: {
      type: String,
      default: '',
    },
    passwordChangeCodeExpires: {
      type: Date,
    },
    emailVerificationCode: {
      type: String,
      default: '',
    },
    emailVerificationCodeExpires: {
      type: Date,
    },
    status: {
      type: String,
      enum: ['active', 'banned'],
      default: 'active',
    },
    banReason: {
      type: String,
      default: '',
    },
    bannedAt: {
      type: Date,
    },
    bannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    xp: {
      type: Number,
      default: 120,
    },
    unlockedAchievements: {
      type: [String],
      default: [],
    },
    settings: {
      emailNotif: { type: Boolean, default: true },
      statusUpdates: { type: Boolean, default: true },
      weeklyDigest: { type: Boolean, default: true },
      publicReports: { type: Boolean, default: true },
      allowContact: { type: Boolean, default: true },
      language: { type: String, default: 'English' },
      defaultCategory: { type: String, default: 'Illegal Dumping' },
      newUserAlerts: { type: Boolean, default: true },
      newOrgAlerts: { type: Boolean, default: true },
      reportAssignedNotif: { type: Boolean, default: true },
    },
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS, 10) || 12;
  this.password = await bcrypt.hash(this.password, saltRounds);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model('User', userSchema);
module.exports = User;
