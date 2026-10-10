# VERITY — Digital Document Verification Platform

> Trust, verified.

A full-stack MERN application for issuing, managing, and publicly verifying digital documents using unique IDs and QR codes.

---

## Architecture

```
verity/
├── client/          React + TypeScript + Vite frontend
├── server/          Node.js + Express + TypeScript backend
└── README.md
```

---

## Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)
- npm

---

## Quick Start

### 1. Configure the Backend

```bash
cd server
cp .env.example .env
```

Edit `.env` and set:
```
MONGODB_URI=mongodb+srv://<user>:<password>@<cluster>.mongodb.net/verity?retryWrites=true&w=majority
JWT_SECRET=your-long-random-secret-here
PORT=5000
CLIENT_URL=http://localhost:5173
```

### 2. Install & Run Backend

```bash
cd server
npm install
npm run dev
```

The API will start on http://localhost:5000  
Swagger docs: http://localhost:5000/api-docs

### 3. Seed the Database

```bash
cd server
npm run seed
```

This creates:
- Admin user: `admin@verity.dev` / `Verity@Admin2024!`
- 8 sample documents (valid, revoked, expired)

### 4. Configure & Run Frontend

```bash
cd client
npm install
npm run dev
```

The app will start on http://localhost:5173

---

## Usage

### Admin Dashboard
- Navigate to http://localhost:5173
- Log in with the seeded admin credentials
- Use the dashboard to issue, manage, and revoke documents

### Public Verification
- Every issued document gets a unique QR code
- Scan or visit: `http://localhost:5173/verify/{VERIFICATION_ID}`
- Works without login — safe for sharing

### Demo Flow
1. Log in → Dashboard
2. Issue a document → get QR code
3. Open `/verify/{id}` → shows **VALID**
4. Revoke the document from the dashboard
5. Open same URL again → shows **REVOKED** (immediate)

---

## Running Tests

### Backend
```bash
cd server
npm run typecheck
npm test
```

### Frontend
```bash
cd client
npm run typecheck
npm test
```

---

## API Endpoints

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/login` | No | Login |
| GET | `/api/auth/me` | Yes | Current user |
| GET | `/api/documents` | Yes | List/search documents |
| POST | `/api/documents` | Admin | Issue document |
| GET | `/api/documents/:id` | Yes | Document detail |
| PATCH | `/api/documents/:id` | Admin | Update document |
| POST | `/api/documents/:id/revoke` | Admin | Revoke document |
| DELETE | `/api/documents/:id` | Admin | Delete document |
| GET | `/api/documents/:id/history` | Yes | Verification logs |
| GET | `/api/verify/:verificationId` | No | Public verify |
| GET | `/api/stats/dashboard` | Yes | Dashboard stats |

Full docs at `/api-docs` (Swagger UI).

---

## Security Notes

- Passwords hashed with bcrypt (12 rounds)
- JWT authentication with configurable expiry
- SHA-256 integrity hash over protected document fields
- Server-side expiration detection (never trust client status)
- Rate limiting on all routes, stricter on auth and verification
- CORS restricted to configured `CLIENT_URL`
- Input validation on every endpoint
- Public verification endpoint exposes no sensitive data (no email, no internal IDs)

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGODB_URI` | ✅ | MongoDB connection string |
| `JWT_SECRET` | ✅ | JWT signing secret |
| `PORT` | No | Server port (default: 5000) |
| `CLIENT_URL` | No | Frontend URL for CORS + QR links (default: http://localhost:5173) |
| `JWT_EXPIRES_IN` | No | Token expiry (default: 7d) |
| `NODE_ENV` | No | development / production / test |
