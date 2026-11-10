# QuizHub API Documentation

## Base URL
`/api`

All authenticated endpoints require an `Authorization: Bearer <JWT_ACCESS_TOKEN>` header.

---

## 1. Authentication (`/api/auth`)
- `POST /api/auth/register`
  - Body: `{ email, password, full_name, role ("student"|"teacher") }`
  - Returns: `{ message, user, access_token, refresh_token }`
- `POST /api/auth/login`
  - Body: `{ email, password, remember_me }`
  - Returns: `{ message, user, access_token, refresh_token }`
- `POST /api/auth/refresh`
  - Header: `Authorization: Bearer <REFRESH_TOKEN>`
  - Returns: `{ access_token }`
- `GET /api/auth/me`
  - Header: `Authorization: Bearer <ACCESS_TOKEN>`
  - Returns: `{ user, profile }`
- `POST /api/auth/forgot-password`
  - Body: `{ email }`
- `POST /api/auth/reset-password`
  - Body: `{ token, new_password }`

---

## 2. Quizzes (`/api/quizzes`)
- `GET /api/quizzes` (Query: `category, difficulty, search, page, limit`)
- `GET /api/quizzes/my` (Authenticated Teacher/Student)
- `POST /api/quizzes` (Teacher/Admin only)
  - Body: `{ title, description, category, difficulty, time_limit_per_question, is_public, questions: [...] }`
- `GET /api/quizzes/:id`
- `PUT /api/quizzes/:id`
- `DELETE /api/quizzes/:id`
- `POST /api/quizzes/:id/duplicate`
- `POST /api/quizzes/:id/publish`
- `GET /api/quizzes/:id/practice` (Generates a solo practice session)

---

## 3. Live Game Sessions (`/api/sessions`)
- `POST /api/sessions/create`
  - Body: `{ quiz_id, session_type: "live_multiplayer"|"duel_1v1"|"tournament" }`
  - Returns: `{ pin, session_id, status }`
- `GET /api/sessions/verify/:pin`
  - Returns: `{ valid: true, quiz_title, total_questions }`
- `GET /api/sessions/:id/results`
  - Returns: `{ results: [...], podium: [...] }`

---

## 4. Tournaments (`/api/tournaments`)
- `GET /api/tournaments`
- `POST /api/tournaments` (Teacher/Admin only)
- `GET /api/tournaments/:id`
- `POST /api/tournaments/:id/register`
- `GET /api/tournaments/:id/leaderboard`

---

## 5. Duels & Challenges (`/api/challenges`)
- `GET /api/challenges`
- `POST /api/challenges/create` (Invite friend or random match)
- `POST /api/challenges/:id/accept`

---

## 6. AI Quiz Generator (`/api/ai`)
- `POST /api/ai/generate`
  - Body: `{ topic, category, difficulty, num_questions }`
  - Returns: `{ questions: [{ question_text, question_type, points, time_limit, options: [...] }] }`

---

## 7. Leaderboards & Analytics (`/api/leaderboard`)
- `GET /api/leaderboard/global` (Query: `period=all|weekly|monthly`)
- `GET /api/leaderboard/user/:id/stats`

---

## 8. Admin (`/api/admin`)
- `GET /api/admin/metrics` (User counts, quizzes, active sessions)
- `GET /api/admin/users` (Paginated list with filter)
- `PATCH /api/admin/users/:id/status` (Activate/Deactivate)
- `GET /api/admin/quizzes`
- `DELETE /api/admin/quizzes/:id`
- `GET /api/admin/logs`

