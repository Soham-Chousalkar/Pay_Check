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

  async sendPasswordResetEmail(email, name, newPassword) {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: 'Pay Check - Your New Password',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Password Reset - Pay Check</h2>
          <p>Hello ${name},</p>
          <p>You requested a password reset. Here is your new password:</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
            <p><strong>New Password:</strong> ${newPassword}</p>
          </div>
          <p>Please use this password to log in and consider changing it to something more memorable.</p>
          <p>Best regards,<br>The Pay Check Team</p>
        </div>
      `
    }

    await transporter.sendMail(mailOptions)
  }
}
