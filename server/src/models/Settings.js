const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema({
  maintenanceMode: { type: Boolean, default: false },
  maintenanceMessage: { type: String, default: 'System is currently under maintenance. Please check back later.' },
  announcementEnabled: { type: Boolean, default: false },
  announcementMessage: { type: String, default: '' },
}, { timestamps: true });

const Settings = mongoose.model('Settings', settingsSchema);

const getSettings = async () => {
  let settings = await Settings.findOne();
  if (!settings) {
    settings = await Settings.create({});
  }
  return settings;
};

module.exports = { Settings, getSettings };