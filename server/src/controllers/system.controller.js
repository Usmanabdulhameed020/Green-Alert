const { Settings, getSettings } = require('../models/Settings');
const logger = require('../utils/logger');

exports.getSettings = async (req, res) => {
  try {
    const settings = await getSettings();
    return res.status(200).json({
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage,
      announcementEnabled: settings.announcementEnabled,
      announcementMessage: settings.announcementMessage,
    });
  } catch (error) {
    logger.error('Get system settings error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateMaintenance = async (req, res) => {
  try {
    const { maintenanceMode, maintenanceMessage } = req.body;
    const settings = await getSettings();
    if (typeof maintenanceMode === 'boolean') settings.maintenanceMode = maintenanceMode;
    if (typeof maintenanceMessage === 'string') settings.maintenanceMessage = maintenanceMessage;
    await settings.save();
    return res.status(200).json({
      success: true,
      maintenanceMode: settings.maintenanceMode,
      maintenanceMessage: settings.maintenanceMessage,
    });
  } catch (error) {
    logger.error('Update maintenance error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

exports.updateAnnouncement = async (req, res) => {
  try {
    const { announcementEnabled, announcementMessage } = req.body;
    const settings = await getSettings();
    if (typeof announcementEnabled === 'boolean') settings.announcementEnabled = announcementEnabled;
    if (typeof announcementMessage === 'string') settings.announcementMessage = announcementMessage;
    await settings.save();
    return res.status(200).json({
      success: true,
      announcementEnabled: settings.announcementEnabled,
      announcementMessage: settings.announcementMessage,
    });
  } catch (error) {
    logger.error('Update announcement error:', error);
    return res.status(500).json({ success: false, message: 'Internal server error' });
  }
};