# 🚀 JLU Orbit

**Social Networking Platform for JLU Engineering Department**

## 📖 Overview

JLU Orbit is a modern, feature-rich social networking and blogging platform designed specifically for the FAST (Faculty of Applied Sciences & Technology) community at JLU. It enables students, faculty, and staff to connect, collaborate, share knowledge, and stay updated with department activities.

## ✨ Features

### 🔐 Authentication
- Secure login/signup with email verification
- OTP-based email verification
- JWT token-based authentication
- Role-based access control

### 📝 Feed & Posts
- Create posts with multiple types:
  - 💬 Discussions
  - ❓ Questions
  - 📢 Announcements
  - 🚀 Project Work
  - 📅 Events
- Image upload support
- Like, comment, and share functionality
- Tag-based filtering and search
- Real-time updates

### 👥 Groups
- Create public/private groups
- Categories: Project, Hackathon, Research, Study, Club
- Group membership management
- Collaborative spaces for teams

### 🔬 Research Hub
- Share research papers and projects
- Keyword-based search
- Original work verification
- Academic collaboration

### 👤 User Profiles
- Customizable profiles
- Course, specialization, semester info
- Bio and profile image
- JLU ID integration

### 🔔 Notifications
- Real-time notifications via Socket.io
- Activity tracking
- Interactive notification drawer

### 🔍 Search
- Search posts, users, groups
- Advanced filtering
- Relevant results

## 🛠️ Tech Stack

### Frontend
- HTML5
- Tailwind CSS
- Vanilla JavaScript
- Font Awesome icons

### Backend
- Node.js
- Express.js
- MongoDB with Mongoose
- Socket.io (real-time features)
- JWT (authentication)
- Bcrypt (password hashing)
- Cloudinary (file uploads)
- Brevo (email service)

## 🚀 Getting Started

### Prerequisites
- Node.js v18+ installed
- MongoDB (local or Atlas)
- Email account for OTP

### Installation

```bash
# Clone repository
git clone <your-repo-url>
cd 3

# Install dependencies
npm install

# Create .env file (see .env.example)
cp .env.example .env
# Edit .env with your credentials

# Run development server
npm run dev

# Or run production
npm start
```

Visit: https://jlu-orbit-production.up.railway.app/

## 📁 Project Structure

```
.
├── html/               # Frontend files
│   ├── js/            # JavaScript modules
│   ├── auth.html      # Authentication page
│   ├── index.html     # Main app
│   └── ...            # Other pages
├── models/            # MongoDB schemas
│   ├── User.js
│   ├── Post.js
│   ├── Group.js
│   └── ...
├── routes/            # API endpoints
│   ├── auth.js
│   ├── posts.js
│   ├── groups.js
│   └── ...
├── middleware/        # Express middleware
├── uploads/          # User uploaded files
├── utils/            # Helper functions
├── server.js         # Main server file
└── package.json
```
