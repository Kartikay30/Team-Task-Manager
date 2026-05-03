# 🚀 TaskFlow — Team Task Manager

A full-stack team task management app with role-based access control.

**Live Demo:** [https://your-frontend.up.railway.app](optimistic-wholeness-production-86d8.up.railway.app)

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React + Vite (JavaScript) |
| Backend | Node.js + Express |
| Database | MongoDB Atlas |
| Auth | JWT + bcryptjs |
| Deployment | Railway |

## ✨ Features

- 🔐 Authentication (Signup / Login) with JWT
- 👥 Role-based access control (Admin / Member)
- 📁 Project creation and team management
- ✅ Task creation, assignment & status tracking (Todo / In-Progress / Done / Overdue)
- 📊 Dashboard with stats, completion rate, overdue alerts
- 🔴 Auto overdue detection when due date passes

---

## 📁 Folder Structure

```
Assingment_fullstack/
├── backend/        # Node.js + Express REST API
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── utils/
│   ├── server.js
│   └── .env.example
└── frontend/       # React + Vite SPA
    ├── src/
    │   ├── api/
    │   ├── context/
    │   ├── components/
    │   └── pages/
    └── server.js   # Production server for Railway
```

---

## 🔧 Local Development

### Prerequisites
- Node.js v18+
- MongoDB Atlas account (free tier)

### Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret
npm run dev
# Runs on http://localhost:5000
```

### Frontend Setup
```bash
cd frontend
npm install
# .env is already configured for local dev
npm run dev
# Runs on http://localhost:5173
```

---

## 🚀 Railway Deployment

### Step 1 — Push to GitHub
```bash
# From the root folder
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/yourusername/team-task-manager.git
git push -u origin main
```

### Step 2 — Deploy Backend on Railway
1. Go to [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo**
2. Select your repo → Choose the **`backend`** folder as root directory
3. Add these **Environment Variables** in Railway:

| Variable | Value |
|----------|-------|
| `MONGO_URI` | `mongodb+srv://...` (Atlas connection string) |
| `JWT_SECRET` | Any long random string |
| `JWT_EXPIRES_IN` | `7d` |
| `NODE_ENV` | `production` |
| `CLIENT_URL` | _(set after frontend deploys)_ |

4. Railway auto-detects Node.js and runs `npm start`
5. Copy the backend URL: `https://your-backend.up.railway.app`

### Step 3 — Deploy Frontend on Railway
1. In same Railway project → **New Service** → **GitHub Repo**
2. Choose **`frontend`** folder as root directory
3. Add these **Environment Variables**:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.up.railway.app/api/v1` |

4. Railway runs `npm install && npm run build` then `npm start`
5. Copy the frontend URL: `https://your-frontend.up.railway.app`

### Step 4 — Update Backend CORS
Go back to backend service → Environment Variables → Add:
```
CLIENT_URL = https://your-frontend.up.railway.app
```

---

## 🔑 API Endpoints

### Auth
| Method | Endpoint | Access |
|--------|----------|--------|
| POST | `/api/v1/auth/register` | Public |
| POST | `/api/v1/auth/login` | Public |
| GET  | `/api/v1/auth/me` | Protected |
| POST | `/api/v1/auth/logout` | Protected |

### Projects
| Method | Endpoint | Access |
|--------|----------|--------|
| GET  | `/api/v1/projects` | Protected |
| POST | `/api/v1/projects` | Admin |
| GET  | `/api/v1/projects/:id` | Member |
| POST | `/api/v1/projects/:id/members` | Admin |
| DELETE | `/api/v1/projects/:id/members/:userId` | Admin |

### Tasks
| Method | Endpoint | Access |
|--------|----------|--------|
| GET  | `/api/v1/tasks` | Protected |
| POST | `/api/v1/tasks` | Admin |
| PATCH | `/api/v1/tasks/:id/status` | Admin/Assignee |
| PATCH | `/api/v1/tasks/:id/assign` | Admin |

### Dashboard
| Method | Endpoint | Access |
|--------|----------|--------|
| GET | `/api/v1/dashboard/stats` | Protected |
