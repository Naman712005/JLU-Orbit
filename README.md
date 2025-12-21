<!-- ============================== -->
<!--        JLU ORBIT README        -->
<!-- ============================== -->

# 🚀 JLU Orbit
### Social Networking Platform for JLU Engineering Department

---

## 📌 Overview

**JLU Orbit** is a modern, feature-rich **social networking and academic collaboration platform** built exclusively for the  
**FAST (Faculty of Science & Technology)** community at **JLU**.

The platform enables **students, faculty, and staff** to:

- Connect and collaborate in a closed academic ecosystem  
- Share knowledge, research, and project work  
- Stay updated with departmental activities in real time  

Unlike generic social networks, **JLU Orbit is purpose-built for academics**.

---

## ✨ Core Features

---

### 🔐 Authentication & Security

- Secure **Login / Signup** workflow  
- **OTP-based email verification**  
- **JWT-based authentication**  
- Password hashing using **Bcrypt**

---

### 📝 Feed & Post System

Create and interact with multiple post types:

- 💬 Discussions  
- ❓ Questions  
- 📢 Announcements  
- 🚀 Project Work  
- 📅 Events  

Additional capabilities:

- Image upload support  
- Like, comment, and share functionality  
- Tag-based filtering & search  
- **Real-time feed updates**

---

### 👥 Groups & Communities

- Create **Public / Private groups**  
- Group categories:
  - Project  
  - Hackathon  
  - Research  
  - Study  
  - Club  
- Membership management  
- Dedicated collaboration spaces for teams

---

### 🔬 Research Hub

- Share **research papers & academic projects**  
- Keyword-based search  
- Original work verification  
- Supports academic collaboration and discovery

---

### 👤 User Profiles

- Customizable profile information  
- Course, specialization, and semester details  
- Bio and profile image  
- JLU ID integration

---

### 🔔 Notifications

- Real-time notifications using **Socket.io**  
- Activity tracking  
- Interactive notification drawer

---

### 🔍 Global Search

- Search across:
  - Posts  
  - Users  
  - Groups  
- Advanced filtering  
- Optimized and relevant results

---

## 🛠️ Technology Stack

---

### 🎨 Frontend

- HTML5  
- Tailwind CSS  
- Vanilla JavaScript  
- Font Awesome Icons  

---

### ⚙️ Backend

- Node.js  
- Express.js  
- MongoDB (Mongoose ODM)  
- Socket.io (real-time features)  
- JWT (authentication)  
- Bcrypt (password hashing)  
- Cloudinary (media uploads)  
- Brevo (email & OTP service)

---

## 🚀 Getting Started

---

### ✅ Prerequisites

- Node.js **v18+**  
- MongoDB (Local or Atlas)  
- Email account for OTP services  

---

### 📦 Installation

```bash
# Clone the repository
git clone <repository-url>

# Navigate into the project directory
cd 3

# Install dependencies
npm install

# Create environment configuration
cp .env.example .env

# Update .env with your credentials

# Run in development mode
npm run dev

# Run in production mode
npm start

📁 Project Structure
.
├── html/                  # Frontend files
│   ├── js/                # JavaScript modules
│   ├── auth.html          # Authentication page
│   ├── index.html         # Main application
│   └── ...                # Other UI pages
│
├── models/                # MongoDB schemas
│   ├── User.js
│   ├── Post.js
│   ├── Group.js
│   └── ...
│
├── routes/                # API routes
│   ├── auth.js
│   ├── posts.js
│   ├── groups.js
│   └── ...
│
├── middleware/            # Express middleware
├── uploads/               # Uploaded files
├── utils/                 # Helper utilities
│
├── server.js              # Main server entry point
└── package.json

```

### 🧠 Design Philosophy

Academic-first social networking

Clean UI with minimal distractions

Secure, scalable backend

Real-time interaction where it matters