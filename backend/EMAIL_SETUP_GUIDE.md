# Email Setup Guide for StockMaster

## Overview
StockMaster uses Nodemailer to send OTP emails for password reset. You need to configure an SMTP server to enable email sending.

---

## Option 1: Gmail (Recommended for Development)

### Step 1: Enable 2-Factor Authentication
1. Go to your Google Account settings
2. Navigate to Security
3. Enable 2-Step Verification

### Step 2: Generate App Password
1. Go to https://myaccount.google.com/apppasswords
2. Select "Mail" and "Other (Custom name)"
3. Enter "StockMaster" as the name
4. Click "Generate"
5. Copy the 16-character password

### Step 3: Configure .env
Add these lines to `backend/.env`:

```env
# Email Configuration (Gmail)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-16-char-app-password
EMAIL_FROM=your-email@gmail.com
EMAIL_FROM_NAME=StockMaster
```

---

## Option 2: Outlook/Hotmail

Add these lines to `backend/.env`:

```env
# Email Configuration (Outlook)
EMAIL_HOST=smtp-mail.outlook.com
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=your-email@outlook.com
EMAIL_PASS=your-outlook-password
EMAIL_FROM=your-email@outlook.com
EMAIL_FROM_NAME=StockMaster
```

---

## Option 3: SendGrid (Recommended for Production)

### Step 1: Create SendGrid Account
1. Sign up at https://sendgrid.com/
2. Verify your email
3. Create an API key

### Step 2: Configure .env
```env
# Email Configuration (SendGrid)
EMAIL_HOST=smtp.sendgrid.net
EMAIL_PORT=587
EMAIL_SECURE=false
EMAIL_USER=apikey
EMAIL_PASS=your-sendgrid-api-key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=StockMaster
```

---

## Option 4: Mailtrap (For Testing)

Perfect for development/testing without sending real emails.

### Step 1: Create Mailtrap Account
1. Sign up at https://mailtrap.io/
2. Go to Email Testing → Inboxes
3. Copy SMTP credentials

### Step 2: Configure .env
```env
# Email Configuration (Mailtrap - Testing Only)
EMAIL_HOST=smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_SECURE=false
EMAIL_USER=your-mailtrap-username
EMAIL_PASS=your-mailtrap-password
EMAIL_FROM=noreply@stockmaster.com
EMAIL_FROM_NAME=StockMaster
```

---

## Testing the Setup

### Method 1: Request OTP
1. Start your backend server
2. Go to http://localhost:5173
3. Click "Forgot Password?"
4. Enter your email
5. Check your email inbox for OTP

### Method 2: Console Check
When backend starts, you should see:
```
✅ Email service ready
```

If you see:
```
⚠️  Email service not configured
```
Then check your .env file.

---

## Troubleshooting

### Issue: "Email service not configured"
**Solution**: Add EMAIL_* variables to your .env file

### Issue: "Email service error: Invalid login"
**Solution**: 
- Gmail: Make sure you're using an App Password, not your regular password
- Outlook: Check if 2FA is enabled
- SendGrid: Verify your API key is correct

### Issue: "Email service error: connect ETIMEDOUT"
**Solution**: 
- Check your internet connection
- Verify EMAIL_HOST and EMAIL_PORT are correct
- Check if your firewall is blocking port 587

### Issue: Emails go to spam
**Solution**: 
- For production, use a custom domain
- Set up SPF, DKIM, and DMARC records
- Use a reputable email service like SendGrid

---

## Development Mode

If EMAIL_HOST is not configured, the system will:
- ✅ Still generate OTPs
- ✅ Store them in database
- ✅ Return OTP in API response (for testing)
- ⚠️  Not send actual emails

Console output:
```
⚠️  Email service not configured. OTP emails will not be sent.
```

This allows you to test the password reset flow without setting up email.

---

## Production Recommendations

1. **Use SendGrid or AWS SES** for reliability
2. **Set up custom domain** for professional appearance
3. **Enable email analytics** to track delivery
4. **Set up email templates** for branding
5. **Implement rate limiting** to prevent abuse
6. **Log email send failures** for monitoring

---

## Environment Variables Reference

```env
# Required for email sending
EMAIL_HOST=smtp.gmail.com           # SMTP server host
EMAIL_PORT=587                      # SMTP port (587 for TLS, 465 for SSL)
EMAIL_SECURE=false                  # true for 465, false for other ports
EMAIL_USER=your-email@gmail.com     # SMTP username
EMAIL_PASS=your-app-password        # SMTP password

# Optional
EMAIL_FROM=noreply@stockmaster.com  # From email address
EMAIL_FROM_NAME=StockMaster         # From name
```

---

## Security Notes

1. **Never commit .env file** to version control
2. **Use App Passwords** instead of account passwords
3. **Rotate credentials** regularly
4. **Monitor for suspicious activity**
5. **Use different credentials** for development and production

---

## Need Help?

If you're still having issues:
1. Check the backend console for detailed error messages
2. Verify your .env file is in the `backend/` directory
3. Restart the backend server after changing .env
4. Test with Mailtrap first (easiest to set up)

---

**Happy Emailing! 📧**

