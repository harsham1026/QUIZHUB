# QuizHub – Setup & Execution Guide

## Requirements
- Node.js 18+ (tested with v24)
- Python 3.10+ (tested with 3.14)
- MySQL 8.0+ or compatible (Fallback SQLite development mode supported)

---

## 1. Backend Setup
1. Open terminal and navigate to `backend/`:
   ```bash
   cd backend
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Linux/Mac:
   source venv/bin/activate
   pip install -r requirements.txt
   ```
2. Configure `.env` in the root or `backend/` directory:
   ```env
   FLASK_APP=run.py
   FLASK_ENV=development
   SECRET_KEY=super-secret-quizhub-jwt-key-2026
   JWT_SECRET_KEY=super-secret-jwt-key-change-in-prod
   DATABASE_URL=mysql+pymysql://root:password@localhost:3306/quizhub
   # Or for local development without active MySQL service:
   # DATABASE_URL=sqlite:///quizhub.db
   GEMINI_API_KEY=
   CORS_ORIGINS=http://localhost:5173
   ```
3. Initialize and seed the database:
   ```bash
   python -m database.seed
   ```
4. Start backend server:
   ```bash
   python run.py
   ```
   *Runs at `http://127.0.0.1:5000` with WebSocket support.*

---

## 2. Frontend Setup
1. In another terminal, navigate to `frontend/`:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```
2. Open your browser at `http://localhost:5173`.

---

## 3. Pre-seeded Test Accounts
- **Admin**: `admin@quizhub.com` / `Admin@123456`
- **Teacher**: `teacher@quizhub.com` / `Teacher@123456`
- **Student**: `student@quizhub.com` / `Student@123456`

