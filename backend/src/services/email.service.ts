import nodemailer from 'nodemailer';
import { config } from '../config/index.js';

/**
 * Email Service
 * Handles sending emails for OTP, notifications, etc.
 */

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private initializeTransporter() {
    if (!config.email.host || !config.email.user || !config.email.pass) {
      console.warn('⚠️  Email service not configured. OTP emails will not be sent.');
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: config.email.host,
      port: config.email.port,
      secure: config.email.secure, // true for 465, false for other ports
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    // Verify connection
    this.transporter.verify((error) => {
      if (error) {
        console.error('❌ Email service error:', error.message);
        this.transporter = null;
      } else {
        console.log('✅ Email service ready');
      }
    });
  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    if (!this.transporter) {
      console.warn('⚠️  Email service not configured. Cannot send email to:', options.to);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({
        from: `"${config.email.fromName}" <${config.email.fromEmail}>`,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
      });

      console.log('✅ Email sent:', info.messageId);
      return true;
    } catch (error: any) {
      console.error('❌ Failed to send email:', error.message);
      return false;
    }
  }

  async sendOTP(email: string, otp: string, name?: string): Promise<boolean> {
    const subject = 'StockMaster - Password Reset OTP';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .otp-box {
      background-color: #fff;
      border: 2px solid #2563eb;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      margin: 30px 0;
    }
    .otp-code {
      font-size: 36px;
      font-weight: bold;
      color: #2563eb;
      letter-spacing: 8px;
      margin: 10px 0;
    }
    .warning {
      background-color: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 15px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📦 StockMaster</div>
      <p>Inventory Management System</p>
    </div>
    
    <h2>Password Reset Request</h2>
    
    <p>Hello${name ? ` ${name}` : ''},</p>
    
    <p>We received a request to reset your password for your StockMaster account. Use the One-Time Password (OTP) below to complete the password reset process:</p>
    
    <div class="otp-box">
      <div>Your OTP Code:</div>
      <div class="otp-code">${otp}</div>
      <div style="color: #666; font-size: 14px; margin-top: 10px;">Valid for 10 minutes</div>
    </div>
    
    <div class="warning">
      <strong>⚠️ Security Notice:</strong>
      <ul style="margin: 10px 0 0 0; padding-left: 20px;">
        <li>Never share this OTP with anyone</li>
        <li>StockMaster staff will never ask for your OTP</li>
        <li>This OTP expires in 10 minutes</li>
      </ul>
    </div>
    
    <p>If you didn't request a password reset, please ignore this email or contact support if you have concerns.</p>
    
    <div class="footer">
      <p>This is an automated email from StockMaster. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} StockMaster. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    const text = `
StockMaster - Password Reset OTP

Hello${name ? ` ${name}` : ''},

We received a request to reset your password for your StockMaster account.

Your OTP Code: ${otp}
Valid for 10 minutes

If you didn't request a password reset, please ignore this email.

This is an automated email. Please do not reply.

© ${new Date().getFullYear()} StockMaster. All rights reserved.
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
      text,
    });
  }

  async sendWelcomeEmail(email: string, name: string, loginId: string): Promise<boolean> {
    const subject = 'Welcome to StockMaster!';
    
    const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body {
      font-family: Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      background-color: #f9f9f9;
      border-radius: 8px;
      padding: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo {
      font-size: 28px;
      font-weight: bold;
      color: #2563eb;
      margin-bottom: 10px;
    }
    .info-box {
      background-color: #fff;
      border-radius: 8px;
      padding: 20px;
      margin: 20px 0;
    }
    .footer {
      text-align: center;
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #ddd;
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">📦 StockMaster</div>
      <p>Inventory Management System</p>
    </div>
    
    <h2>Welcome to StockMaster!</h2>
    
    <p>Hello ${name},</p>
    
    <p>Your account has been successfully created. You can now start managing your inventory with StockMaster.</p>
    
    <div class="info-box">
      <strong>Your Login Details:</strong>
      <p style="margin: 10px 0;">Login ID: <strong>${loginId}</strong></p>
      <p style="margin: 10px 0;">Email: <strong>${email}</strong></p>
    </div>
    
    <p>Get started by:</p>
    <ul>
      <li>Adding your warehouses and locations</li>
      <li>Creating product categories</li>
      <li>Managing your inventory operations</li>
      <li>Tracking stock movements in real-time</li>
    </ul>
    
    <p>If you have any questions or need assistance, please don't hesitate to contact our support team.</p>
    
    <div class="footer">
      <p>This is an automated email from StockMaster. Please do not reply to this email.</p>
      <p>&copy; ${new Date().getFullYear()} StockMaster. All rights reserved.</p>
    </div>
  </div>
</body>
</html>
    `;

    return this.sendEmail({
      to: email,
      subject,
      html,
    });
  }
}

export const emailService = new EmailService();

