const logger = require('../config/logger');

/**
 * Email Service
 * Handles sending emails using nodemailer
 */
class EmailService {
  /**
   * Generate staff welcome email HTML
   */
  generateWelcomeEmail({ firstName, salonName, tenantSlug, email, tempPassword }) {
    const loginUrl = process.env.ADMIN_PORTAL_URL || 'http://localhost:3001';
    
    return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
    .credentials-box { background: white; border: 2px solid #667eea; border-radius: 8px; padding: 20px; margin: 20px 0; }
    .credential-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
    .credential-label { font-weight: bold; color: #666; }
    .credential-value { color: #333; font-family: monospace; }
    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
    .warning-box { background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
    .footer { text-align: center; color: #666; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🎉 Welcome to the Team!</h1>
    </div>
    <div class="content">
      <p>Hi ${firstName},</p>
      
      <p>Welcome to the team at <strong>${salonName}</strong>! Your admin account has been created and you're all set to get started.</p>
      
      <div class="credentials-box">
        <h3 style="margin-top: 0; color: #667eea;">🔐 Your Login Credentials</h3>
        
        <div class="credential-row">
          <span class="credential-label">🏢 Salon:</span>
          <span class="credential-value">${salonName}</span>
        </div>
        
        <div class="credential-row">
          <span class="credential-label">🔑 Tenant Slug:</span>
          <span class="credential-value">${tenantSlug}</span>
        </div>
        
        <div class="credential-row">
          <span class="credential-label">📧 Email:</span>
          <span class="credential-value">${email}</span>
        </div>
        
        <div class="credential-row" style="border-bottom: none;">
          <span class="credential-label">🔒 Temporary Password:</span>
          <span class="credential-value">${tempPassword}</span>
        </div>
      </div>
      
      <div style="text-align: center;">
        <a href="${loginUrl}/login" class="button">Login to Your Account</a>
      </div>
      
      <div class="warning-box">
        <h4 style="margin-top: 0;">⚠️ Important Security Notes:</h4>
        <ul style="margin: 10px 0;">
          <li>You will be required to <strong>change your password</strong> on first login</li>
          <li>Never share your password with anyone</li>
          <li>Enable 2FA for additional security</li>
          <li><strong>Delete this email</strong> after saving your credentials securely</li>
        </ul>
      </div>
      
      <p>If you have any questions or need help getting started, please contact your salon owner.</p>
      
      <p>Best regards,<br>The HairVia Team</p>
      
      <div class="footer">
        <p>⚠️ This email contains sensitive information. Please delete it after reading.</p>
        <p>If you didn't expect this email, please contact your salon owner immediately.</p>
      </div>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Send staff welcome email with login credentials
   */
  async sendStaffWelcomeEmail({ to, firstName, salonName, tenantSlug, email, tempPassword }) {
    const html = this.generateWelcomeEmail({ firstName, salonName, tenantSlug, email, tempPassword });
    
    return await this.sendEmail({
      to,
      subject: `Welcome to ${salonName} - Your Staff Account`,
      html
    });
  }

  /**
   * Send an email
   * @param {Object} options - Email options
   * @param {string} options.to - Recipient email
   * @param {string} options.subject - Email subject
   * @param {string} options.text - Plain text content (optional)
   * @param {string} options.html - HTML content
   * @returns {Promise<boolean>}
   */
  async sendEmail({ to, subject, text, html }) {
    logger.info('Sending email', { to, subject });

    // Always log to console for development
    console.log('\n=== EMAIL ===');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    if (text) console.log(`Text: ${text}`);
    console.log('=============\n');

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
          to,
          subject,
          text: text || '',
          html: html || text || ''
        });

        logger.info('Email sent successfully', { to });
        return true;
      } catch (error) {
        logger.error('Email sending failed', { error: error.message, to });
        // Don't fail the whole process if email fails
        return false;
      }
    } else {
      logger.warn('Email credentials not configured - email not sent', { to });
      return true; // Return true in development to not block the flow
    }
  }
}

module.exports = new EmailService();
