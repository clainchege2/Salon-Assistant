const User = require('../models/User');
const Tenant = require('../models/Tenant');
const emailService = require('../services/emailService');
const logger = require('../config/logger');

exports.sendSlugToEmail = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email address is required'
      });
    }

    // Find user by email
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
      // Don't reveal if email exists or not (security)
      return res.json({
        success: true,
        message: 'If an account exists with this email, the salon slug has been sent.'
      });
    }

    // Get tenant
    const tenant = await Tenant.findById(user.tenantId);

    if (!tenant) {
      return res.json({
        success: true,
        message: 'If an account exists with this email, the salon slug has been sent.'
      });
    }

    // Send email with slug
    const emailContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #667eea;">🎨 HairVia - Your Salon Slug</h2>
        
        <p>Hi ${user.firstName},</p>
        
        <p>You requested your salon login information. Here are your details:</p>
        
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0 0 10px 0;"><strong>Salon Name:</strong> ${tenant.businessName}</p>
          <p style="margin: 0 0 10px 0;"><strong>Your Slug:</strong> <code style="background: #e5e7eb; padding: 4px 8px; border-radius: 4px; font-size: 16px;">${tenant.slug}</code></p>
          <p style="margin: 0;"><strong>Your Email:</strong> ${user.email}</p>
        </div>
        
        <p>Use this slug to log in at: <a href="http://localhost:3000/login">http://localhost:3000/login</a></p>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
          If you didn't request this information, please ignore this email or contact support.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        
        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
          HairVia - Professional Salon Management<br>
          This is an automated message, please do not reply.
        </p>
      </div>
    `;

    await emailService.sendEmail({
      to: user.email,
      subject: 'Your HairVia Salon Slug',
      html: emailContent
    });

    logger.info(`Slug recovery email sent to: ${email}`);

    res.json({
      success: true,
      message: 'If an account exists with this email, the salon slug has been sent.'
    });
  } catch (error) {
    logger.error(`Slug recovery error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error. Please try again later.'
    });
  }
};
