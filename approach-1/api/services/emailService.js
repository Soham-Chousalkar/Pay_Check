import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
})

export const emailService = {
  async sendWelcomeEmail(email, name) {
    console.log('Email service config check:', {
      hasEmailUser: !!process.env.EMAIL_USER,
      hasEmailPass: !!process.env.EMAIL_PASS,
      emailUser: process.env.EMAIL_USER
    })
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Welcome to Pay Check!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome to Pay Check, ${name}!</h2>
          <p>Your account has been created successfully. You can now log in with your email and password.</p>
          <p>If you forget your password, you can use the "Forgot Password" feature on the login page.</p>
          <p>Best regards,<br>The Pay Check Team</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
  },

  async sendPasswordResetEmail(email, name, resetToken) {
    console.log('Password reset email attempt:', {
      hasEmailUser: !!process.env.EMAIL_USER,
      hasEmailPass: !!process.env.EMAIL_PASS,
      emailUser: process.env.EMAIL_USER,
      targetEmail: email
    })
    
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${resetToken}`
    
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Pay Check - Password Reset',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset - Pay Check</h2>
          <p>Hello ${name},</p>
          <p>You requested a password reset. Click the link below to reset your password:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0; text-align: center;">
            <a href="${resetLink}" style="background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Password</a>
          </div>
          <p><strong>This link expires in 1 hour.</strong></p>
          <p>If you didn't request this reset, please ignore this email.</p>
          <p>Best regards,<br>The Pay Check Team</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
  }
}
