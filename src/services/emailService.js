import nodemailer from 'nodemailer'

// Email configuration - you'll need to set these environment variables
const EMAIL_CONFIG = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: process.env.SMTP_PORT || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password'
  }
}

const transporter = nodemailer.createTransport(EMAIL_CONFIG)

export const emailService = {
  // Send welcome email with login credentials
  async sendWelcomeEmail(email, name, password) {
    try {
      const mailOptions = {
        from: `"Pay Check App" <${EMAIL_CONFIG.auth.user}>`,
        to: email,
        subject: 'Welcome to Pay Check - Your Account Details',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Welcome to Pay Check, ${name}!</h2>
            <p>Your account has been successfully created. Here are your login credentials:</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #333;">Login Details:</h3>
              <p><strong>Email:</strong> ${email}</p>
              <p><strong>Password:</strong> ${password}</p>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              <strong>Important:</strong> Please save this password securely. For security reasons, 
              we recommend changing it after your first login.
            </p>
            
            <p>You can now access your Pay Check dashboard and start managing your earnings!</p>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="color: #999; font-size: 12px;">
                If you didn't create this account, please ignore this email.
              </p>
            </div>
          </div>
        `
      }

      await transporter.sendMail(mailOptions)
      return { success: true }
    } catch (error) {
      console.error('Email sending failed:', error)
      throw new Error('Failed to send welcome email')
    }
  },

  // Send password reset email
  async sendPasswordResetEmail(email, resetToken) {
    try {
      const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
      
      const mailOptions = {
        from: `"Pay Check App" <${EMAIL_CONFIG.auth.user}>`,
        to: email,
        subject: 'Reset Your Pay Check Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333;">Password Reset Request</h2>
            <p>You requested to reset your password for your Pay Check account.</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; 
                        text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; font-size: 14px;">
              This link will expire in 1 hour. If you didn't request this reset, 
              please ignore this email.
            </p>
            
            <p style="color: #999; font-size: 12px; margin-top: 30px;">
              If the button doesn't work, copy and paste this link: ${resetUrl}
            </p>
          </div>
        `
      }

      await transporter.sendMail(mailOptions)
      return { success: true }
    } catch (error) {
      console.error('Password reset email failed:', error)
      throw new Error('Failed to send password reset email')
    }
  },

  // Test email configuration
  async testConnection() {
    try {
      await transporter.verify()
      return { success: true, message: 'Email configuration is valid' }
    } catch (error) {
      return { success: false, message: 'Email configuration failed: ' + error.message }
    }
  }
}
