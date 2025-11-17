# FastConnect Deployment Guide

## Prerequisites
- Node.js 18+ installed
- MongoDB Atlas account (or local MongoDB)
- Email account for OTP (Gmail recommended)

## Environment Variables

Create a `.env` file with the following variables:

```env
# Server Configuration
PORT=4000
NODE_ENV=production

# Database
MONGO_URI=your_mongodb_connection_string

# Authentication
JWT_SECRET=your_jwt_secret_key_here

# Email Configuration (for OTP)
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_app_password

# Deployment URLs (optional)
FRONTEND_URL=https://your-deployed-url.com
API_BASE=https://your-deployed-url.com/api
```

## Deployment Options

### Option 1: Render.com (Recommended - Free Tier)

1. **Create account** at [render.com](https://render.com)
2. **New Web Service** → Connect your GitHub repository
3. **Build Command**: `npm install`
4. **Start Command**: `npm start`
5. **Add Environment Variables** from your .env file
6. **Deploy!**

### Option 2: Railway.app (Alternative - Free Tier)

1. **Create account** at [railway.app](https://railway.app)
2. **New Project** → Deploy from GitHub
3. **Add variables** from .env
4. Railway auto-detects Node.js and deploys

### Option 3: Vercel (Frontend + Serverless)

Good for static hosting but requires serverless function setup for backend.

## Local Testing Before Deployment

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Or run in production mode
npm start
```

Visit: http://localhost:4000

## Post-Deployment Checklist

- [ ] MongoDB connection working
- [ ] Authentication (Login/Signup) working
- [ ] OTP email delivery working
- [ ] File uploads working
- [ ] Socket.io real-time features working
- [ ] All CRUD operations working
- [ ] CORS configured properly

## Common Issues

### Issue: MongoDB connection fails
**Solution**: Check MONGO_URI format and whitelist IP (0.0.0.0/0 for production)

### Issue: Uploads not working
**Solution**: Use cloud storage (Cloudinary) instead of local filesystem for production

### Issue: Socket.io not connecting
**Solution**: Ensure FRONTEND_URL is correctly set in environment variables

## Security Notes

⚠️ **NEVER** commit `.env` file to GitHub
⚠️ Use strong JWT_SECRET (64+ characters random string)
⚠️ Enable MongoDB IP whitelist or use MongoDB Atlas
⚠️ Use app passwords for Gmail (not regular password)
