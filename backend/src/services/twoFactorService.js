const TwoFactorAuth = require('../models/TwoFactorAuth');
const logger = require('../config/logger');
const crypto = require('crypto');

/**
 * Two-Factor Authentication Service
 * Handles code generation, delivery, and verification
 */

class TwoFactorService {
  
  /**
   * Send 2FA code to user
   * @param {Object} options - Configuration options
   * @returns {Object} Result with masked contact info
   */
  async sendCode(options) {
    const {
      userId,
      userModel, // 'User' or 'Client'
      tenantId,
      method, // 'sms', 'email', 'whatsapp'
      contact, // phone or email
      purpose, // 'registration', 'login', etc.
      ipAddress,
      userAgent,
      expiryMinutes = 10
    } = options;

    try {
      // Generate 6-digit code
      const code = TwoFactorAuth.generateCode();
      const codeHash = crypto.createHash('sha256').update(code).digest('hex');

      // Calculate expiry
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + expiryMinutes);

      // Mask contact info for storage
      const maskedContact = method === 'email' 
        ? TwoFactorAuth.maskEmail(contact)
        : TwoFactorAuth.maskPhone(contact);

      // Invalidate any existing unverified codes for this purpose
      await TwoFactorAuth.updateMany(
        {
          userId,
          userModel,
          purpose,
          verified: false
        },
        {
          $set: { expiresAt: new Date() } // Expire immediately
        }
      );

      // Create new 2FA record
      const twoFactorAuth = await TwoFactorAuth.create({
        userId,
        userModel,
        tenantId,
        code, // Store plain code temporarily for sending
        codeHash,
        method,
        sentTo: maskedContact,
        purpose,
        expiresAt,
        ipAddress,
        userAgent
      });

      // Send the code via chosen method
      const sent = await this.deliverCode(method, contact, code, purpose);

      if (!sent) {
        throw new Error(`Failed to send ${method} code`);
      }

      // Remove plain code from database after sending
      twoFactorAuth.code = undefined;
      await twoFactorAuth.save();

      logger.info('2FA code sent', {
        userId,
        userModel,
        method,
        purpose,
        maskedContact
      });

      return {
        success: true,
        twoFactorId: twoFactorAuth._id,
        method,
        sentTo: maskedContact,
        expiresAt,
        expiryMinutes
      };

    } catch (error) {
      logger.error('2FA send code error:', error);
      throw error;
    }
  }

  /**
   * Verify 2FA code
   * @param {String} twoFactorId - 2FA record ID
   * @param {String} code - User-provided code
   * @returns {Object} Verification result
   */
  async verifyCode(twoFactorId, code) {
    try {
      const twoFactorAuth = await TwoFactorAuth.findById(twoFactorId).select('+codeHash');

      if (!twoFactorAuth) {
        return {
          success: false,
          error: 'INVALID_CODE',
          message: 'Invalid or expired verification code'
        };
      }

      // Check if already verified
      if (twoFactorAuth.verified) {
        return {
          success: false,
          error: 'ALREADY_VERIFIED',
          message: 'This code has already been used'
        };
      }

      // Check if expired
      if (twoFactorAuth.isExpired()) {
        return {
          success: false,
          error: 'EXPIRED',
          message: 'Verification code has expired. Please request a new one.'
        };
      }

      // Check if locked due to too many attempts
      if (twoFactorAuth.isLocked()) {
        return {
          success: false,
          error: 'LOCKED',
          message: 'Too many failed attempts. Please request a new code.'
        };
      }

      // Verify the code
      const isValid = twoFactorAuth.verifyCode(code);

      if (!isValid) {
        // Increment attempts
        twoFactorAuth.attempts += 1;
        await twoFactorAuth.save();

        const remainingAttempts = twoFactorAuth.maxAttempts - twoFactorAuth.attempts;

        logger.warn('2FA verification failed', {
          twoFactorId,
          attempts: twoFactorAuth.attempts,
          remainingAttempts
        });

        return {
          success: false,
          error: 'INVALID_CODE',
          message: `Invalid code. ${remainingAttempts} attempts remaining.`,
          remainingAttempts
        };
      }

      // Mark as verified
      twoFactorAuth.verified = true;
      twoFactorAuth.verifiedAt = new Date();
      await twoFactorAuth.save();

      logger.info('2FA verification successful', {
        twoFactorId,
        userId: twoFactorAuth.userId,
        purpose: twoFactorAuth.purpose
      });

      return {
        success: true,
        userId: twoFactorAuth.userId,
        userModel: twoFactorAuth.userModel,
        tenantId: twoFactorAuth.tenantId,
        purpose: twoFactorAuth.purpose,
        message: 'Verification successful'
      };

    } catch (error) {
      logger.error('2FA verify code error:', error);
      throw error;
    }
  }

  /**
   * Resend 2FA code
   * @param {String} twoFactorId - Original 2FA record ID
   * @returns {Object} New 2FA record
   */
  async resendCode(twoFactorId) {
    try {
      const originalAuth = await TwoFactorAuth.findById(twoFactorId);

      if (!originalAuth) {
        throw new Error('Original verification not found');
      }

      if (originalAuth.verified) {
        throw new Error('Code already verified');
      }

      // Check rate limiting - don't allow resend within 1 minute
      const oneMinuteAgo = new Date(Date.now() - 60000);
      if (originalAuth.createdAt > oneMinuteAgo) {
        return {
          success: false,
          error: 'RATE_LIMITED',
          message: 'Please wait before requesting a new code',
          retryAfter: 60 - Math.floor((Date.now() - originalAuth.createdAt) / 1000)
        };
      }

      // Get original contact from User/Client model
      const Model = originalAuth.userModel === 'User' 
        ? require('../models/User')
        : require('../models/Client');
      
      const user = await Model.findById(originalAuth.userId);
      if (!user) {
        throw new Error('User not found');
      }

      const contact = originalAuth.method === 'email' ? user.email : user.phone;

      // Send new code
      return await this.sendCode({
        userId: originalAuth.userId,
        userModel: originalAuth.userModel,
        tenantId: originalAuth.tenantId,
        method: originalAuth.method,
        contact,
        purpose: originalAuth.purpose,
        ipAddress: originalAuth.ipAddress,
        userAgent: originalAuth.userAgent
      });

    } catch (error) {
      logger.error('2FA resend code error:', error);
      throw error;
    }
  }

  /**
   * Deliver code via chosen method
   * @private
   */
  async deliverCode(method, contact, code, purpose) {
    try {
      const message = this.formatMessage(code, purpose);

      switch (method) {
        case 'sms':
          return await this.sendSMS(contact, message);
        
        case 'email':
          return await this.sendEmail(contact, message, purpose);
        
        case 'whatsapp':
          return await this.sendWhatsApp(contact, message);
        
        default:
          throw new Error(`Unsupported delivery method: ${method}`);
      }
    } catch (error) {
      logger.error(`Failed to deliver code via ${method}:`, error);
      return false;
    }
  }

  /**
   * Format verification message
   * @private
   */
  formatMessage(code, purpose) {
    const purposeText = {
      'registration': 'complete your registration',
      'login': 'log in to your account',
      'password-reset': 'reset your password',
      'email-change': 'verify your new email',
      'phone-change': 'verify your new phone number'
    };

    return `Your verification code is: ${code}\n\nUse this code to ${purposeText[purpose] || 'verify your identity'}.\n\nThis code expires in 10 minutes.\n\nIf you didn't request this, please ignore this message.`;
  }

  /**
   * Send SMS (placeholder - integrate with SMS provider)
   * @private
   */
  async sendSMS(phone, message) {
    // TODO: Integrate with SMS provider (Twilio, Africa's Talking, etc.)
    logger.info('SMS would be sent', { phone, message });
    
    // For development, just log
    if (process.env.NODE_ENV === 'development') {
      console.log('\n=== 2FA SMS ===');
      console.log(`To: ${phone}`);
      console.log(`Message: ${message}`);
      console.log('===============\n');
      return true;
    }

    // Production: Implement actual SMS sending
    // Example with Africa's Talking:
    // const africastalking = require('africastalking')({
    //   apiKey: process.env.AFRICASTALKING_API_KEY,
    //   username: process.env.AFRICASTALKING_USERNAME
    // });
    // const sms = africastalking.SMS;
    // const result = await sms.send({ to: [phone], message });
    // return result.SMSMessageData.Recipients[0].status === 'Success';

    return true;
  }

  /**
   * Send Email (placeholder - integrate with email provider)
   * @private
   */
  async sendEmail(email, message, purpose) {
    logger.info('Sending email', { email, purpose });
    
    // Always log to console for development
    console.log('\n=== 2FA EMAIL ===');
    console.log(`To: ${email}`);
    console.log(`Subject: Your Verification Code`);
    console.log(`Message: ${message}`);
    console.log('=================\n');

    // If email credentials are configured, send actual email
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
      try {
        const nodemailer = require('nodemailer');
        
        // Create transporter
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
          }
        });

        // Send email
        await transporter.sendMail({
          from: `"HairVia" <${process.env.EMAIL_USER}>`,
          to: email,
          subject: 'Your HairVia Verification Code',
          text: message,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #667eea;">🎨 HairVia</h2>
              <p style="font-size: 16px; line-height: 1.6;">
                ${message.replace(/\n/g, '<br>')}
              </p>
              <p style="color: #666; font-size: 14px; margin-top: 30px;">
                This code will expire in 10 minutes.
              </p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="color: #999; font-size: 12px;">
                If you didn't request this code, please ignore this email.
              </p>
            </div>
          `
        });

        logger.info('Email sent successfully', { email });
        return true;
      } catch (error) {
        logger.error('Email sending failed', { error: error.message, email });
        // Don't fail the whole process if email fails
        return true;
      }
    }

    return true;
  }

  /**
   * Send WhatsApp (placeholder - integrate with WhatsApp Business API)
   * @private
   */
  async sendWhatsApp(phone, message) {
    // TODO: Integrate with WhatsApp Business API
    logger.info('WhatsApp would be sent', { phone, message });
    
    // For development, just log
    if (process.env.NODE_ENV === 'development') {
      console.log('\n=== 2FA WHATSAPP ===');
      console.log(`To: ${phone}`);
      console.log(`Message: ${message}`);
      console.log('====================\n');
      return true;
    }

    return true;
  }

  /**
   * Clean up expired codes (run periodically)
   */
  async cleanupExpired() {
    try {
      const result = await TwoFactorAuth.deleteMany({
        expiresAt: { $lt: new Date() },
        verified: false
      });

      logger.info(`Cleaned up ${result.deletedCount} expired 2FA codes`);
      return result.deletedCount;
    } catch (error) {
      logger.error('2FA cleanup error:', error);
      return 0;
    }
  }

  /**
   * Get 2FA statistics for a tenant
   */
  async getTenantStats(tenantId, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await TwoFactorAuth.aggregate([
        {
          $match: {
            tenantId: tenantId,
            createdAt: { $gte: startDate }
          }
        },
        {
          $group: {
            _id: {
              purpose: '$purpose',
              method: '$method'
            },
            total: { $sum: 1 },
            verified: {
              $sum: { $cond: ['$verified', 1, 0] }
            },
            failed: {
              $sum: { $cond: [{ $gte: ['$attempts', '$maxAttempts'] }, 1, 0] }
            }
          }
        }
      ]);

      return stats;
    } catch (error) {
      logger.error('2FA stats error:', error);
      return [];
    }
  }
}

module.exports = new TwoFactorService();
