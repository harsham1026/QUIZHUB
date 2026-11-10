# QuizHub – Online Multiplayer Quiz Competition Platform

> **Tagline:** Think Fast. Play Smart. Win Big.

**QuizHub** is a production-quality, real-time multiplayer esports and educational competition platform. Built with high-performance WebSockets, a dark cyber-gaming design aesthetic, server-authoritative scoring and anti-cheat, dynamic streak multipliers, championship tournament brackets, and AI-powered quiz generation.

---

## ⚡ Tech Stack

- **Frontend:** React 18, Vite, Tailwind CSS, Framer Motion, Lucide Icons, Recharts, Canvas Confetti, Socket.IO Client, Axios.
- **Backend:** Python 3, Flask, Flask-SocketIO, Flask-JWT-Extended, Flask-SQLAlchemy, PyMySQL, Cryptography, Google GenAI SDK.
- **Database:** MySQL 8.0+ (with SQLite zero-config development fallback).
- **Architecture:** 21 normalized relational tables, transactional question validation, server-authoritative game state loop.

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js** 18+ (tested on Node v24)
- **Python** 3.10+ (tested on Python 3.14)
- **MySQL** 8.0+ (or use local SQLite mode out-of-the-box)

---

### 2. Backend Setup & Run

1. Open a terminal in the project root:
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate

   pip install -r requirements.txt
   ```

2. Seed database tables and pre-loaded trivia competitions:
   ```bash
   python -m database.seed
   # Or from root:
   backend\venv\Scripts\python.exe database\seed.py
   ```

3. Launch the Backend API & WebSocket Server:
   ```bash
   python run.py
   # Or from root:
   backend\venv\Scripts\python.exe backend\run.py
   ```
   *Runs authoritatively on `http://127.0.0.1:5000` with WebSocket support.*

---

### 3. Frontend Setup & Run

1. In a second terminal:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open your browser at `http://localhost:5173`.

---

## 👥 Pre-seeded Test Accounts

You can log in instantly using the demo switcher buttons on the `/login` page or with these credentials:

| Role | Email | Password | Access Level |
|---|---|---|---|
| **Admin** | `admin@quizhub.com` | `Admin@123456` | Full platform analytics, user moderation, audit logs |
| **Teacher / Host** | `teacher@quizhub.com` | `Teacher@123456` | Quiz creation, AI generator, live room hosting |
| **Student** | `student@quizhub.com` | `Student@123456` | Multiplayer competitions, solo practice, leaderboards |

---

## 🎮 Core Gameplay Flow

1. **Host Launches Game**: Teacher logs in, selects or creates a quiz, and clicks **Start Live Competition**. A 6-character game PIN is generated and the room enters `lobby` mode.
2. **Players Join**: Any student opens `/play` (or enters the PIN on the landing page) with their nickname.
3. **Synchronized Broadcast**: The host clicks **Start Game**. Questions are broadcast with server-side countdown timers. (Correct answers are strictly kept on the server to prevent cheating).
4. **Authoritative Scoring**:
   - Correct answers earn base points + up to 50% speed bonus based on response time.
   - Hot streaks award +50 bonus points per consecutive correct answer.
   - Wrong answers earn 0 points and reset active streaks.
5. **Leaderboard & 3D Podium**: Between questions, round standings animate. When the final question concludes, the top 3 contenders ascend the 3D winner podium amidst celebratory confetti cannons.

---

## 📂 Project Directory Structure

```
QUIZHUB/
├── frontend/
│   ├── src/
│   │   ├── components/      # GlassCard, NeonButton, TimerRing, Podium, Navbar, Footer
│   │   ├── contexts/        # AuthContext, GameContext
│   │   ├── pages/           # Landing, Login, Register, Dashboards, Host, Play, Practice, etc.
│   │   ├── services/        # Axios API client, Socket.IO client
│   │   ├── styles/          # Tailwind, esports neon glow variables
│   │   ├── App.jsx          # Route guard & application tree
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── backend/
│   ├── app/
│   │   ├── models/          # 21 Normalized SQLAlchemy models
│   │   ├── routes/          # Blueprints (auth, quizzes, sessions, tournaments, ai, admin)
│   │   ├── services/        # Authoritative GameManager, ScoringEngine
│   │   ├── sockets/         # Socket.IO game events
│   │   ├── middleware/      # JWT RBAC decorators
│   │   ├── config.py
│   │   ├── extensions.py
│   │   └── __init__.py
│   ├── tests/               # Backend unit test suite
│   ├── requirements.txt
│   └── run.py
├── database/
│   ├── schema.sql           # Native MySQL DDL definitions (21 tables)
│   ├── seed.py              # Seeder script
│   └── er_diagram.md        # Database ER diagram & documentation
├── docs/
│   ├── architecture.md
│   ├── api_documentation.md
│   └── setup_guide.md
├── .env.example
├── .gitignore
└── README.md
```

