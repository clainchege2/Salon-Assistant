const twoFactorService = require('../services/twoFactorService');
const User = require('../models/User');
const Client = require('../models/Client');
const logger = require('../config/logger');

/**
 * Send 2FA code
 * @route POST /api/v1/auth/2fa/send
 */
exports.send2FACode = async (req, res) => {
  try {
    const { userId, userModel, method, purpose } = req.body;

    if (!userId || !userModel || !method || !purpose) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields'
      });
    }

    // Get user/client
    const Model = userModel === 'User' ? User : Client;
    const user = await Model.findById(userId);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Get contact based on method
    const contact = method === 'email' ? user.email : user.phone;

    if (!contact) {
      return res.status(400).json({
        success: false,
        message: `No ${method === 'email' ? 'email' : 'phone'} on file`
      });
    }

    // Send code
    const result = await twoFactorService.sendCode({
      userId: user._id,
      userModel,
      tenantId: user.tenantId,
      method,
      contact,
      purpose,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    });

    res.json(result);

  } catch (error) {
    logger.error('Send 2FA code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send verification code'
    });
  }
};

/**
 * Verify 2FA code
 * @route POST /api/v1/auth/2fa/verify
 */
exports.verify2FACode = async (req, res) => {
  try {
    const { twoFactorId, code } = req.body;

    if (!twoFactorId || !code) {
      return res.status(400).json({
        success: false,
        message: 'Verification code required'
      });
    }

    const result = await twoFactorService.verifyCode(twoFactorId, code);

    if (!result.success) {
      return res.status(400).json(result);
    }

    // Update user verification status if this was for registration
    if (result.purpose === 'registration') {
      const Model = result.userModel === 'User' ? User : Client;
      const user = await Model.findById(result.userId);

      if (user) {
        if (user.twoFactorMethod === 'email') {
          user.emailVerified = true;
        } else {
          user.phoneVerified = true;
        }
        user.verifiedAt = new Date();
        user.accountStatus = 'active';
        user.status = 'active';
        await user.save();
      }
    }

    res.json(result);

  } catch (error) {
    logger.error('Verify 2FA code error:', error);
    res.status(500).json({
      success: false,
      message: 'Verification failed'
    });
  }
};

/**
 * Resend 2FA code
 * @route POST /api/v1/auth/2fa/resend
 */
exports.resend2FACode = async (req, res) => {
  try {
    const { twoFactorId } = req.body;

    if (!twoFactorId) {
      return res.status(400).json({
        success: false,
        message: 'Two-factor ID required'
      });
    }

    const result = await twoFactorService.resendCode(twoFactorId);

    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);

  } catch (error) {
    logger.error('Resend 2FA code error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend code'
    });
  }
};

/**
 * Update 2FA settings
 * @route PUT /api/v1/auth/2fa/settings
 */
exports.update2FASettings = async (req, res) => {
  try {
    const { enabled, method } = req.body;
    const user = req.user;

    if (enabled !== undefined) {
      user.twoFactorEnabled = enabled;
    }

    if (method && ['sms', 'email', 'whatsapp'].includes(method)) {
      user.twoFactorMethod = method;
    }

    await user.save();

    logger.info('2FA settings updated', {
      userId: user._id,
      enabled: user.twoFactorEnabled,
      method: user.twoFactorMethod
    });

    res.json({
      success: true,
      message: '2FA settings updated',
      settings: {
        enabled: user.twoFactorEnabled,
        method: user.twoFactorMethod
      }
    });

  } catch (error) {
    logger.error('Update 2FA settings error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update settings'
    });
  }
};

/**
 * Get 2FA statistics (Admin only)
 * @route GET /api/v1/admin/2fa/stats
 */
exports.get2FAStats = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const tenantId = req.tenantId;

    const stats = await twoFactorService.getTenantStats(tenantId, parseInt(days));

    res.json({
      success: true,
      data: stats
    });

  } catch (error) {
    logger.error('Get 2FA stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get statistics'
    });
  }
};
