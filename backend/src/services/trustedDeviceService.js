const crypto = require('crypto');
const TrustedDevice = require('../models/TrustedDevice');
const logger = require('../config/logger');

// Generate device fingerprint from request
const generateDeviceFingerprint = (req) => {
  const userAgent = req.get('user-agent') || '';
  const acceptLanguage = req.get('accept-language') || '';
  const acceptEncoding = req.get('accept-encoding') || '';
  
  // Create a hash of device characteristics
  const fingerprintData = `${userAgent}|${acceptLanguage}|${acceptEncoding}`;
  return crypto.createHash('sha256').update(fingerprintData).digest('hex');
};

// Get device name from user agent
const getDeviceName = (userAgent) => {
  if (!userAgent) return 'Unknown Device';
  
  // Mobile devices
  if (/iPhone/i.test(userAgent)) return 'iPhone';
  if (/iPad/i.test(userAgent)) return 'iPad';
  if (/Android/i.test(userAgent)) return 'Android Device';
  
  // Browsers
  if (/Chrome/i.test(userAgent)) return 'Chrome Browser';
  if (/Firefox/i.test(userAgent)) return 'Firefox Browser';
  if (/Safari/i.test(userAgent)) return 'Safari Browser';
  if (/Edge/i.test(userAgent)) return 'Edge Browser';
  
  return 'Web Browser';
};

// Check if device is trusted
exports.isDeviceTrusted = async (userId, userModel, tenantId, req) => {
  try {
    const deviceFingerprint = generateDeviceFingerprint(req);
    
    const trustedDevice = await TrustedDevice.findOne({
      userId,
      userModel,
      tenantId,
      deviceFingerprint,
      expiresAt: { $gt: new Date() }
    });

    if (trustedDevice) {
      // Update last used timestamp
      trustedDevice.lastUsed = new Date();
      await trustedDevice.save();
      return true;
    }

    return false;
  } catch (error) {
    logger.error('Error checking trusted device:', error);
    return false;
  }
};

// Add device to trusted list
exports.trustDevice = async (userId, userModel, tenantId, req, daysValid = 30) => {
  try {
    const deviceFingerprint = generateDeviceFingerprint(req);
    const deviceName = getDeviceName(req.get('user-agent'));
    const ipAddress = req.ip || req.connection?.remoteAddress || 'unknown';
    const userAgent = req.get('user-agent') || 'unknown';

    // Check if device already exists
    let trustedDevice = await TrustedDevice.findOne({
      userId,
      userModel,
      tenantId,
      deviceFingerprint
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + daysValid);

    if (trustedDevice) {
      // Update existing device
      trustedDevice.lastUsed = new Date();
      trustedDevice.expiresAt = expiresAt;
      trustedDevice.ipAddress = ipAddress;
      await trustedDevice.save();
    } else {
      // Create new trusted device
      trustedDevice = await TrustedDevice.create({
        userId,
        userModel,
        tenantId,
        deviceFingerprint,
        deviceName,
        ipAddress,
        userAgent,
        expiresAt
      });
    }

    logger.info('Device trusted', { userId, deviceName, expiresAt });
    return trustedDevice;
  } catch (error) {
    logger.error('Error trusting device:', error);
    throw error;
  }
};

// Remove device from trusted list
exports.removeTrustedDevice = async (userId, deviceId) => {
  try {
    await TrustedDevice.findOneAndDelete({
      _id: deviceId,
      userId
    });
    logger.info('Trusted device removed', { userId, deviceId });
  } catch (error) {
    logger.error('Error removing trusted device:', error);
    throw error;
  }
};

// Get all trusted devices for user
exports.getTrustedDevices = async (userId, userModel, tenantId) => {
  try {
    const devices = await TrustedDevice.find({
      userId,
      userModel,
      tenantId,
      expiresAt: { $gt: new Date() }
    }).sort({ lastUsed: -1 });

    return devices;
  } catch (error) {
    logger.error('Error getting trusted devices:', error);
    return [];
  }
};

// Remove all trusted devices for user
exports.removeAllTrustedDevices = async (userId, userModel, tenantId) => {
  try {
    const result = await TrustedDevice.deleteMany({
      userId,
      userModel,
      tenantId
    });
    logger.info('All trusted devices removed', { userId, count: result.deletedCount });
    return result.deletedCount;
  } catch (error) {
    logger.error('Error removing all trusted devices:', error);
    throw error;
  }
};

module.exports = exports;
