# CertVerify — Full-Stack Certificate Verification System

A production-ready MERN application for issuing, managing, and verifying academic certificates. Admins bulk-import via Excel, students verify and download certificates instantly.

---

## Architecture

```
cert-verify/
├── backend/               # Node.js + Express + MongoDB
│   ├── models/
│   │   ├── Admin.js       # Admin user schema (bcrypt passwords)
│   │   └── Certificate.js # Certificate schema (auto-ID, SHA-256 hash)
│   ├── routes/
│   │   ├── auth.js        # /api/auth — register, login, me
│   │   ├── certificates.js # /api/certificates — public verify + PDF download
│   │   └── admin.js       # /api/admin — protected CRUD + Excel upload
│   ├── middleware/
│   │   └── auth.js        # JWT verification middleware
│   ├── server.js          # Express app entry point
│   ├── Dockerfile
│   └── package.json
│
├── frontend/              # React 18 + React Router v6
│   ├── src/
│   │   ├── pages/
│   │   │   ├── HomePage.js         # Landing page
│   │   │   ├── VerifyPage.js       # Public certificate verification
│   │   │   ├── AdminLogin.js       # Admin login
│   │   │   ├── AdminRegister.js    # Admin registration (code-gated)
│   │   │   ├── AdminDashboard.js   # Stats + charts
│   │   │   ├── AdminCertificates.js # CRUD table with modals
│   │   │   └── AdminUpload.js      # Drag-drop Excel importer
│   │   ├── components/
│   │   │   ├── AdminLayout.js      # Collapsible sidebar shell
│   │   │   └── LoadingScreen.js
│   │   ├── context/
│   │   │   └── AuthContext.js      # JWT auth state
│   │   └── utils/
│   │       └── api.js              # Axios instance + API calls
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
│
└── docker-compose.yml
```

---

## Features

### Public (Students)
- **Verify by Certificate ID** — instant lookup with cryptographic integrity check
- **Verify by Roll Number** — find all certificates for a student
- **Download PDF** — beautifully designed certificate with embedded QR code
- **QR Code Re-verification** — QR on every PDF links back to verify page

### Admin
- **Secure Login** — JWT-based authentication with bcrypt password hashing
- **Dashboard** — live stats, monthly bar chart, most-verified certificates
- **Excel Import** — drag & drop bulk upload with row-level error reporting
- **Template Download** — pre-formatted Excel template with sample data
- **CRUD Management** — create, edit, revoke, activate, delete certificates
- **Search & Filter** — by name, ID, roll, status, type with pagination
- **Rate Limiting** — brute-force protection on auth endpoints

### Security
- SHA-256 hash per certificate for tamper detection
- Auto-generated unique Certificate IDs (`CERT-XXXXX-XXXX`)
- JWT authentication with configurable expiry
- Helmet.js security headers
- Admin registration requires a secret code
- Rate limiting on all API routes

---

## Quick Start (Local)

### Prerequisites
- Node.js 18+
- MongoDB running locally (or MongoDB Atlas URI)

### 1. Clone & Install

```bash
# Backend
cd backend
cp .env.example .env          # Edit values
npm install
npm run dev                   # Starts on :5000

# Frontend (new terminal)
cd frontend
npm install
npm start                     # Starts on :3000
```

### 2. Configure `.env`

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/cert-verify
JWT_SECRET=your_super_secret_key_here
JWT_EXPIRE=7d
ADMIN_REGISTRATION_CODE=ADMIN2024SECRET
FRONTEND_URL=http://localhost:3000
```

### 3. Create Your First Admin

Visit `http://localhost:3000/admin/register` and use the registration code from your `.env` (`ADMIN2024SECRET` by default).

---

## Docker Deployment

```bash
# Copy and configure environment
cp backend/.env.example .env

# Start everything
docker-compose up -d

# View logs
docker-compose logs -f backend

# Stop
docker-compose down
```

Services:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000`
- MongoDB: `localhost:27017`

---

## Excel Upload Format

Download the template from Admin → Upload, or use these column headers:

| Column | Required | Description |
|--------|----------|-------------|
| `studentName` | ✅ | Full name |
| `studentEmail` | ✅ | Email address |
| `rollNumber` | ✅ | Unique roll/enrollment number |
| `courseName` | ✅ | Course/program name |
| `issueDate` | ✅ | YYYY-MM-DD format |
| `institution` | ✅ | Institution name |
| `courseCode` | ○ | Short code (CS501) |
| `grade` | ○ | Letter grade (A, B+) |
| `percentage` | ○ | Numeric score |
| `department` | ○ | Department name |
| `expiryDate` | ○ | YYYY-MM-DD, if applicable |
| `certificateType` | ○ | `completion` \| `achievement` \| `participation` \| `merit` \| `degree` |

---

## API Reference

### Public Endpoints
```
GET  /api/certificates/verify/:certificateId     — Verify by cert ID
GET  /api/certificates/verify-by-roll/:rollNo    — Find by roll number  
GET  /api/certificates/download/:certificateId   — Download PDF
GET  /api/health                                 — Health check
```

### Auth Endpoints
```
POST /api/auth/register    — Create admin (requires adminCode)
POST /api/auth/login       — Login → JWT token
GET  /api/auth/me          — Current admin (protected)
```

### Admin Endpoints (all require Bearer token)
```
GET    /api/admin/dashboard                    — Stats + charts
POST   /api/admin/upload                       — Excel bulk import
GET    /api/admin/certificates                 — List (search/filter/paginate)
POST   /api/admin/certificates                 — Create one
GET    /api/admin/certificates/:id             — Get one
PUT    /api/admin/certificates/:id             — Update
PATCH  /api/admin/certificates/:id/revoke      — Revoke
PATCH  /api/admin/certificates/:id/activate    — Activate
DELETE /api/admin/certificates/:id             — Delete
GET    /api/admin/template                     — Download Excel template
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, React Router v6, Recharts, react-dropzone, react-hot-toast |
| Backend | Node.js, Express.js, Helmet, express-rate-limit |
| Database | MongoDB with Mongoose ODM |
| Auth | JWT (jsonwebtoken), bcryptjs |
| PDF | PDFKit with embedded QR codes |
| Excel | SheetJS (xlsx) |
| QR Codes | qrcode library |
| Containers | Docker + Docker Compose + Nginx |

---

## License

MIT — free to use and adapt for your institution.
