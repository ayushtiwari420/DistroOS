import nodemailer from 'nodemailer'
import { ApiError, StatusCode } from './apiError.utils.js'

let transporter

const getEmailConfig = () => {
  const user = process.env.EMAIL_USER?.trim()
  const pass = process.env.EMAIL_PASS?.trim()

  if (!user || !pass) {
    throw new ApiError(
      StatusCode.INTERNAL_SERVER_ERROR,
      'Email service is not configured. Please set EMAIL_USER and EMAIL_PASS.'
    )
  }

  return { user, pass }
}

const getTransporter = () => {
  if (!transporter) {
    const { user, pass } = getEmailConfig()
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user, pass },
    })
  }

  return transporter
}

export const sendOtpEmail = async (toEmail, otp, name) => {
  const recipient = toEmail?.trim().toLowerCase()
  const { user } = getEmailConfig()

  if (!recipient) {
    throw new ApiError(StatusCode.BAD_REQUEST, 'OTP recipient email is required.')
  }

  const text = [
    `Hi ${name || 'there'},`,
    '',
    'We received a request to reset your DistroOS account password.',
    `Your OTP is: ${otp}`,
    '',
    'This OTP is valid for 10 minutes. If you did not request a password reset, please ignore this email.',
    '',
    'Team DistroOS',
  ].join('\n')

  const html = `
  <!DOCTYPE html>
  <html>
  <head>
    <meta charset="UTF-8" />
    <style>
      body { margin: 0; padding: 0; background: #f4f4f4; font-family: 'Segoe UI', sans-serif; }
      .wrapper { max-width: 520px; margin: 40px auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
      .header { background: #1A56DB; padding: 28px 32px; text-align: center; }
      .header h1 { margin: 0; color: #fff; font-size: 1.4rem; letter-spacing: 0.5px; }
      .header p { margin: 6px 0 0; color: rgba(255,255,255,0.8); font-size: 0.85rem; }
      .body { padding: 32px; }
      .greeting { font-size: 1rem; color: #111827; font-weight: 600; margin-bottom: 10px; }
      .text { font-size: 0.875rem; color: #6B7280; line-height: 1.6; margin-bottom: 24px; }
      .otp-box { background: #EFF6FF; border: 1.5px dashed #93C5FD; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 24px; }
      .otp { font-size: 2.4rem; font-weight: 800; letter-spacing: 10px; color: #1A56DB; }
      .otp-label { font-size: 0.75rem; color: #6B7280; margin-top: 6px; }
      .warning { background: #FFFBEB; border-left: 3px solid #F59E0B; padding: 10px 14px; border-radius: 6px; font-size: 0.8rem; color: #92400E; margin-bottom: 20px; }
      .footer { background: #F9FAFB; padding: 18px 32px; text-align: center; font-size: 0.75rem; color: #9CA3AF; border-top: 1px solid #E5E7EB; }
    </style>
  </head>
  <body>
    <div class="wrapper">
      <div class="header">
        <h1>DistroOS</h1>
        <p>Distribution Management Platform</p>
      </div>
      <div class="body">
        <div class="greeting">Hi ${name || 'there'},</div>
        <div class="text">
          We received a request to reset your DistroOS account password.
          Use the OTP below to verify your identity. Do not share this OTP with anyone.
        </div>
        <div class="otp-box">
          <div class="otp">${otp}</div>
          <div class="otp-label">Your One-Time Password</div>
        </div>
        <div class="warning">
          This OTP is valid for <strong>10 minutes</strong> only. If you did not request a password reset, please ignore this email.
        </div>
        <div class="text" style="margin-bottom:0">
          Team DistroOS
        </div>
      </div>
      <div class="footer">
        &copy; ${new Date().getFullYear()} DistroOS &middot; This is an automated email, please do not reply.
      </div>
    </div>
  </body>
  </html>
  `

  const info = await getTransporter().sendMail({
    from:    `"DistroOS" <${user}>`,
    to:      recipient,
    subject: 'Your DistroOS Password Reset OTP',
    text,
    html,
  })

  if (Array.isArray(info.accepted) && !info.accepted.includes(recipient)) {
    throw new ApiError(StatusCode.BAD_GATEWAY, 'OTP email was not accepted by the mail service.')
  }

  return info
}
