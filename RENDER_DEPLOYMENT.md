# 🚀 Deploy FastConnect to Render.com

## Prerequisites Checklist

Before deployment, ensure you have:

- ✅ MongoDB Atlas account with connection string
- ✅ Cloudinary account (free tier) - https://cloudinary.com
- ✅ Gmail with App Password enabled
- ✅ GitHub repository with your code

---

## Step 1: Setup Cloudinary (REQUIRED for Render)

1. **Sign up** at https://cloudinary.com (free tier is enough)
2. Go to **Dashboard** → You'll see:
   - Cloud Name
   - API Key
   - API Secret
3. **Copy these 3 values** - you'll need them for Render environment variables

---

## Step 2: Prepare MongoDB Atlas

1. Go to MongoDB Atlas → **Database** → **Connect**
2. **Whitelist IP**: Click **Network Access** → Add IP Address → **Allow Access from Anywhere** (`0.0.0.0/0`)
   - This is necessary for Render to connect
3. Copy your connection string (format: `mongodb+srv://username:password@cluster.mongodb.net/...`)

---

## Step 3: Push to GitHub

```bash
# Initialize git if not done already
git init
git add .
git commit -m "Initial commit"

# Create a GitHub repo and push
git remote add origin https://github.com/yourusername/fastconnect.git
git branch -M main
git push -u origin main
```

---

## Step 4: Deploy on Render

### A. Create New Web Service

1. Go to https://render.com and **Sign Up/Login**
2. Click **New** → **Web Service**
3. **Connect your GitHub repository**
4. Select your FastConnect repository

### B. Configure Build Settings

- **Name**: `fastconnect` (or any name you like)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: Leave blank (or set to your project folder)
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `npm start`
- **Instance Type**: Free

### C. Add Environment Variables

Click **Add Environment Variable** and add ALL of these:

| Key | Value | Notes |
|-----|-------|-------|
| `PORT` | `4000` | Or leave default (Render auto-assigns) |
| `NODE_ENV` | `production` | Important for production mode |
| `MONGO_URI` | `your_mongodb_connection_string` | From MongoDB Atlas |
| `JWT_SECRET` | `your_jwt_secret_here` | Long random string (64+ chars) |
| `EMAIL_USER` | `your_email@gmail.com` | Your Gmail |
| `EMAIL_PASS` | `your_app_password` | Gmail App Password (NOT regular password) |
| `EMAIL_HOST` | `smtp.gmail.com` | Gmail SMTP |
| `EMAIL_PORT` | `587` | SMTP port |
| `EMAIL_SECURE` | `false` | TLS setting |
| `CLOUDINARY_CLOUD_NAME` | `your_cloud_name` | From Cloudinary dashboard |
| `CLOUDINARY_API_KEY` | `your_api_key` | From Cloudinary dashboard |
| `CLOUDINARY_API_SECRET` | `your_api_secret` | From Cloudinary dashboard |

**Note:** Leave `FRONTEND_URL` and `API_BASE` EMPTY - they auto-detect!

### D. Deploy!

1. Click **Create Web Service**
2. Wait for deployment (5-10 minutes first time)
3. Once deployed, you'll get a URL like: `https://fastconnect-xyz.onrender.com`

---

## Step 5: Test Your Deployment

1. **Open the URL** in your browser
2. **Try to register** a new account
3. **Check if OTP email arrives**
4. **Login and create a post with image**
5. **Verify image uploads to Cloudinary** (check Cloudinary dashboard)

---

## Common Issues & Solutions

### ❌ Issue: "MongoDB connection error"
**Solution:** 
- Check MONGO_URI is correct
- Ensure MongoDB Atlas has `0.0.0.0/0` whitelisted
- Verify database user has read/write permissions

### ❌ Issue: "Image upload fails"
**Solution:** 
- Verify all 3 Cloudinary variables are set correctly
- Check Cloudinary dashboard for uploaded images
- Local uploads won't work on Render (use Cloudinary)

### ❌ Issue: "OTP email not sending"
**Solution:** 
- Use Gmail **App Password**, not regular password
- Go to: Google Account → Security → 2-Step Verification → App Passwords
- Generate new app password and use that

### ❌ Issue: "Application error / Won't start"
**Solution:** 
- Check Render logs (Logs tab in dashboard)
- Ensure all REQUIRED environment variables are set
- Verify `npm start` works locally first

### ❌ Issue: "CORS errors in browser"
**Solution:** 
- This is now auto-handled
- If persists, add `FRONTEND_URL=https://your-app.onrender.com` to env vars

---

## Local Development Setup

To run locally after changes:

1. **Copy `.env.example` to `.env`**
2. **Fill in your local/test values**
3. **For local dev, Cloudinary is OPTIONAL** (will use local uploads folder)
4. **Run:**

```bash
npm install
npm start
# Or for development with auto-reload:
npm run dev
```

Visit: http://localhost:4000

---

## Post-Deployment Checklist

- [ ] Application loads without errors
- [ ] User registration works
- [ ] OTP email arrives
- [ ] Login works
- [ ] Can create posts
- [ ] Image upload works (check Cloudinary)
- [ ] Comments and likes work
- [ ] Groups functionality works
- [ ] Research hub works
- [ ] Notifications work
- [ ] Mobile responsive

---

## Performance Tips

1. **Free Tier Limitations:**
   - Render free tier sleeps after 15 min of inactivity
   - First load after sleep takes ~30-60 seconds
   - Upgrade to paid tier ($7/mo) for always-on service

2. **Speed Up Loading:**
   - Enable Render's CDN in settings
   - Optimize images before upload (< 500KB)
   - Use Cloudinary transformations

---

## Need Help?

- **Render Docs:** https://render.com/docs
- **Cloudinary Docs:** https://cloudinary.com/documentation
- **MongoDB Atlas:** https://docs.atlas.mongodb.com

---

## 🎉 Your App is Live!

Share your deployed URL: `https://your-app.onrender.com`

**Next Steps:**
- Custom domain (optional)
- SSL certificate (automatic on Render)
- Monitor performance in Render dashboard
- Check Cloudinary usage in their dashboard

Good luck! 🚀
