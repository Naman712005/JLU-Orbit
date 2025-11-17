# 📧 Email/OTP Setup Guide - Fix "OTP Not Sending" Issue

## 🔧 Problem: OTP Emails Not Arriving

You're getting a **502 error** and **OTP emails are not being sent** because of email configuration issues on Render.

---

## ✅ SOLUTION: Setup Gmail App Password

### Step 1: Enable 2-Step Verification on Gmail

1. Go to: https://myaccount.google.com/security
2. Click **"2-Step Verification"**
3. If not enabled, **click "Get Started"** and follow the steps
4. **Enable 2-Step Verification**

### Step 2: Generate App Password

1. Go back to: https://myaccount.google.com/security
2. Click **"2-Step Verification"** again
3. Scroll down to **"App passwords"** (at the bottom)
4. Click **"App passwords"**
5. In the "App name" field, type: **FastConnect**
6. Click **"Create"**
7. **Copy the 16-character password** (format: `xxxx xxxx xxxx xxxx`)

⚠️ **IMPORTANT:** This is NOT your regular Gmail password! It's a special app-specific password.

---

## 🚀 Update Environment Variables on Render

### Go to Your Render Dashboard:

1. Open: https://dashboard.render.com
2. Click on your **FastConnect** service
3. Go to **"Environment"** tab
4. Update/Add these variables:

| Variable | Value | Example |
|----------|-------|---------|
| `EMAIL_USER` | Your Gmail address | `yourname@gmail.com` |
| `EMAIL_PASS` | App password from Step 2 | `abcd efgh ijkl mnop` (remove spaces: `abcdefghijklmnop`) |
| `EMAIL_HOST` | `smtp.gmail.com` | `smtp.gmail.com` |
| `EMAIL_PORT` | `587` | `587` |
| `EMAIL_SECURE` | `false` | `false` |

### Important Notes:

- ✅ **Remove spaces** from the app password before adding it
- ✅ Use the **App Password**, NOT your regular Gmail password
- ✅ Make sure `EMAIL_USER` is the FULL email address (with @gmail.com)
- ✅ Set `EMAIL_SECURE` to `false` (lowercase)

---

## 🔄 After Updating Variables

1. **Save** the environment variables
2. Go to **"Manual Deploy"** tab
3. Click **"Clear build cache & deploy"**
4. Wait for deployment (2-3 minutes)
5. **Test signup** again

---

## 🧪 Test Your Email Configuration

### Method 1: Check Render Logs

1. Go to Render Dashboard → Your Service
2. Click **"Logs"** tab
3. Try to signup on your app
4. Look for these messages in logs:

**✅ SUCCESS:**
```
✅ Email server is ready to send messages
✅ OTP email sent successfully: <message-id>
📧 Sent to: user@example.com
```

**❌ ERRORS:**

```
❌ Email credentials not configured
```
→ **Fix:** Add EMAIL_USER and EMAIL_PASS to environment variables

```
❌ Error sending OTP email: Invalid login
```
→ **Fix:** Use Gmail App Password (not regular password)

```
❌ Failed to send OTP email: EAUTH
```
→ **Fix:** Wrong app password or 2-step verification not enabled

### Method 2: Test Locally

Create a test file `test-email.js`:

```javascript
require('dotenv').config();
const sendOTP = require('./utils/sendOTP');

async function testEmail() {
  try {
    await sendOTP('YOUR_EMAIL@gmail.com', '123456');
    console.log('✅ Email sent successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testEmail();
```

Run:
```bash
node test-email.js
```

---

## 🔍 Common Issues & Solutions

### Issue 1: "Email authentication failed"
**Cause:** Wrong password or not using App Password  
**Solution:** 
- Generate new App Password from Google Account
- Make sure 2-Step Verification is enabled
- Use App Password, not regular Gmail password

### Issue 2: "Cannot connect to email server"
**Cause:** Firewall or network issue  
**Solution:**
- Check if Render can access external SMTP servers
- Verify EMAIL_HOST is `smtp.gmail.com`
- Verify EMAIL_PORT is `587`

### Issue 3: "Email credentials not configured"
**Cause:** Environment variables not set on Render  
**Solution:**
- Add EMAIL_USER and EMAIL_PASS in Render environment variables
- Redeploy after adding

### Issue 4: OTP arrives but in spam folder
**Cause:** Gmail spam filter  
**Solution:**
- Check spam/junk folder
- Mark as "Not Spam"
- Add sender to contacts

### Issue 5: 502 Error when signing up
**Cause:** Server crashes when email sending fails  
**Solution:** 
- ✅ This is now fixed with the updated code!
- Server will return proper error message instead of crashing

---

## 📋 Checklist Before Testing

Before testing signup:

- [ ] 2-Step Verification enabled on Gmail
- [ ] App Password generated (16 characters)
- [ ] `EMAIL_USER` set on Render (full email with @gmail.com)
- [ ] `EMAIL_PASS` set on Render (App Password without spaces)
- [ ] `EMAIL_HOST` = `smtp.gmail.com`
- [ ] `EMAIL_PORT` = `587`
- [ ] `EMAIL_SECURE` = `false`
- [ ] Deployed after updating environment variables
- [ ] Checked Render logs for errors

---

## 🎯 Expected Behavior After Fix

### On Signup:
1. User fills signup form
2. Server creates user account
3. Server generates 6-digit OTP
4. **Email is sent to user's inbox** ✅
5. Server responds: "Signup successful. Please verify OTP sent to your email."
6. User receives email with OTP
7. User enters OTP
8. Account verified → Redirects to feed

### Error Handling:
- If email fails, user gets clear error message
- Server doesn't crash (no more 502 errors)
- User account is deleted if OTP can't be sent
- Logs show exact error for debugging

---

## 🔐 Security Best Practices

1. **Never commit** `.env` file to GitHub
2. **Use App Passwords** - more secure than regular password
3. **Rotate passwords** regularly
4. **Check Render logs** for suspicious activity
5. **Monitor email sending limits** (Gmail: 500 emails/day for free accounts)

---

## 📊 Gmail Sending Limits

**Free Gmail Account:**
- 500 emails per day
- 100-150 recipients per email
- Rate limit: ~2-3 emails per second

**If you need more:**
- Use SendGrid (Free tier: 100 emails/day)
- Use Mailgun (Free tier: 100 emails/day)
- Upgrade to Google Workspace

---

## 🆘 Still Not Working?

### Check These:

1. **Gmail Account Status:**
   - Not suspended or limited
   - Can send regular emails normally
   - No unusual activity warnings

2. **Render Logs:**
   - Check for exact error messages
   - Look for "EAUTH", "ESOCKET", or other error codes

3. **Environment Variables:**
   - No extra spaces in values
   - Correct capitalization
   - All required vars present

4. **Alternative Email Providers:**
   If Gmail continues to fail, consider:
   - **SendGrid**: https://sendgrid.com (easier for production)
   - **Mailgun**: https://mailgun.com
   - **AWS SES**: https://aws.amazon.com/ses

---

## 🎉 Success Indicators

You'll know it's working when:

- ✅ No 502 errors on signup
- ✅ Server logs show "OTP email sent successfully"
- ✅ Email arrives in inbox (check spam if not)
- ✅ User can verify OTP and login
- ✅ Data stored in database after verification

---

## 📞 Need Help?

1. Check Render logs for specific error messages
2. Verify Gmail app password setup
3. Test locally first with `test-email.js`
4. Check spam folder for emails

---

**Your OTP emails will now work!** Just follow the steps above. 🚀
