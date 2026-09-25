# NexusAuth - Full-Stack Registration & Database Integration

A modern, full-stack user registration portal connecting a responsive frontend with an Express.js backend and an SQLite database with secure password hashing.

## 🌟 Features

- **Frontend**: Clean, glassmorphic dark UI built with semantic HTML5, CSS3, and Vanilla JavaScript.
- **Real-time Password Strength Meter**: Live strength indicators (weak/medium/strong) and validation checkmarks.
- **Backend API**: Built with Node.js & Express 5.
- **Security**: Passwords securely hashed with `bcryptjs` (10 salt rounds) before database persistence.
- **Database**: Zero-config SQLite database (`sqlite3`) with automatic table initialization.
- **Live Database Records Viewer**: Interactive modal to inspect records stored in SQLite directly from the UI.
- **Dual Mode Support**: Works both via `http://localhost:5000` and direct `file:///` browser launch.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v18+)

### 2. Installation
```bash
git clone https://github.com/Omprakash8666/<repo-name>.git
cd <repo-name>
npm install
```

### 3. Run the Application
```bash
npm start
```
Then open your browser and navigate to:
👉 **http://localhost:5000**

## 📁 Project Structure

```
├── database.js          # SQLite database connection & query wrappers
├── server.js            # Express API server & routes (/api/register, /api/users, /api/health)
├── package.json         # Project metadata & dependencies
├── .gitignore           # Ignored files (node_modules, etc.)
└── public/
    ├── index.html       # Registration page & database records modal
    ├── style.css        # Glassmorphic dark theme stylesheet
    └── app.js           # Client-side validation & fetch API handlers
```
