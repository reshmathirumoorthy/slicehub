# SliceHub

Production-oriented **Pizza Delivery Platform** built with the MERN stack.

> **Phase 1 complete:** project architecture, tooling, and configuration only.  
> No authentication, models, or business APIs yet.

---

## Tech Stack

| Layer | Technologies |
| --- | --- |
| Frontend | React (Vite), React Router DOM, Axios, Tailwind CSS, React Icons, React Hot Toast, Framer Motion |
| Backend | Node.js, Express.js, MongoDB, Mongoose, JWT, bcrypt, Multer, Nodemailer, node-cron |
| Tooling | ESLint, Prettier |

---

## Folder Structure

```text
slicehub/
├── client/                     # React (Vite) frontend
│   ├── public/
│   ├── src/
│   │   ├── assets/             # Static images / icons
│   │   ├── components/         # Reusable UI components
│   │   ├── context/            # React context providers
│   │   ├── hooks/              # Custom React hooks
│   │   ├── layouts/            # Shared page shells
│   │   ├── pages/              # Route-level screens
│   │   ├── routes/             # React Router registry
│   │   ├── services/           # API clients (Axios)
│   │   ├── styles/             # Global CSS + Tailwind entry
│   │   ├── utils/              # Pure helpers
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── .env.example
│   ├── eslint.config.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
│
├── server/                     # Express API backend
│   ├── config/                 # Env + DB connection
│   ├── controllers/            # Route handlers (Phase 2+)
│   ├── jobs/                   # Cron jobs (Phase 2+)
│   ├── middleware/             # Express middleware
│   ├── models/                 # Mongoose models (Phase 2+)
│   ├── routes/                 # API route mounts
│   ├── services/               # Domain / external services
│   ├── uploads/                # Multer file storage
│   ├── utils/                  # Shared helpers
│   ├── .env.example
│   ├── app.js                  # Express app factory
│   ├── eslint.config.js
│   ├── package.json
│   └── server.js               # Process entry point
│
├── .gitignore
├── .prettierrc
├── .prettierignore
└── README.md
```

---

## Prerequisites

- Node.js **18+** (recommended 20+)
- npm **9+**
- MongoDB running locally (or a MongoDB Atlas URI)

---

## Environment Variables

### Client (`client/.env`)

Copy from `client/.env.example`:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | Axios base URL for API calls |
| `VITE_APP_NAME` | Display name used in the UI shell |

### Server (`server/.env`)

Copy from `server/.env.example`:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development` / `production` |
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Frontend origin for CORS |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | JWT signing secret |
| `JWT_EXPIRES_IN` | Token lifetime |
| `EMAIL_*` | Nodemailer SMTP settings (used later) |
| `UPLOAD_DIR` | Upload folder name |
| `MAX_FILE_SIZE_MB` | Upload size limit |

---

## How to Run Frontend

```bash
cd client
cp .env.example .env   # if .env does not exist yet
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)

---

## How to Run Backend

```bash
cd server
cp .env.example .env   # if .env does not exist yet
npm install
npm run dev
```

API health check: [http://localhost:5000/api/health](http://localhost:5000/api/health)

> MongoDB must be reachable at `MONGODB_URI` before the server will stay up.

---

## Architecture Decisions (Phase 1)

1. **Separate `client/` and `server/` packages** — clear ownership, independent deploy pipelines, and simpler onboarding than a forced monorepo for Phase 1.
2. **ES modules everywhere (`"type": "module"`)** — modern Node + Vite consistency; easier shared mental model.
3. **`app.js` vs `server.js`** — Express app is testable without binding a port; `server.js` owns process bootstrapping (DB, listen, future cron).
4. **Central `config/env.js`** — single place for environment reads; validation can be added later without touching every file.
5. **Axios singleton in `services/api.js`** — one place for base URL, credentials, interceptors, and timeouts.
6. **React Router in `routes/AppRouter.jsx`** — keeps routing out of `App.jsx` so providers can wrap the router cleanly later.
7. **Tailwind CSS v4 via `@tailwindcss/vite`** — native Vite integration, less PostCSS boilerplate.
8. **ESLint flat config + Prettier** — ESLint 9 flat config is current standard; Prettier owns formatting via `eslint-config-prettier`.
9. **Infrastructure-only `/api/health`** — verifies Express boots; no business APIs yet.
10. **Dependencies pre-installed** — JWT, bcrypt, Multer, Nodemailer, node-cron are present so Phase 2+ can start without rewiring package setup.

---

## Scripts

| Location | Command | Description |
| --- | --- | --- |
| `client` | `npm run dev` | Start Vite dev server |
| `client` | `npm run build` | Production build |
| `client` | `npm run lint` | Run ESLint |
| `client` | `npm run format` | Format with Prettier |
| `server` | `npm run dev` | Start API with Nodemon |
| `server` | `npm start` | Start API (production style) |
| `server` | `npm run lint` | Run ESLint |
| `server` | `npm run format` | Format with Prettier |

---

## Phase Boundary

Phase 1 intentionally stops at scaffolding.  
**Not included yet:** auth, Mongoose models, business controllers, email/cron logic, payment, admin UI.
