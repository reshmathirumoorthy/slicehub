# SliceHub

Full-stack **pizza delivery and customization** platform (MERN).

Customers can browse the menu, build a custom pizza with a live 3D preview, manage addresses, checkout with COD or Razorpay (test mode), and track orders. Admins manage menu, categories, orders, users, and inventory.

---

## Features

### Customer

- Registration, login, logout (JWT)
- Email verification + resend
- Forgot / reset password
- Profile view and update
- Address management
- Pizza catalog (search, category filter, price filter, sort)
- Pizza details
- Custom pizza builder (size, base, sauce, cheese, vegetables, extras)
- Procedural 3D pizza preview (React Three Fiber / Three.js / Drei)
- Cart (guest + authenticated)
- Guest cart merge on login
- Checkout with saved addresses
- Cash on delivery (COD)
- Razorpay online payment (test keys required)
- Order history, details, and status tracking
- Home “latest order” from the live API
- Reviews and in-app notifications (where enabled)

### Admin

- Admin login / authorization
- Dashboard overview and analytics
- Pizza CRUD with image upload
- Category management
- Order list and status updates
- User management
- Inventory and stock alerts
- Reviews and notifications moderation

> Admin coupon CRUD UI is a placeholder. Customer cart coupon apply is supported when a coupon is seeded.

---

## Tech stack

| Layer | Technologies |
| --- | --- |
| Frontend | React (Vite), React Router, Axios, Tailwind CSS, Framer Motion, React Hot Toast, Three.js, React Three Fiber, Drei |
| Backend | Node.js, Express, MongoDB, Mongoose, JWT, bcrypt, Multer, Nodemailer, Razorpay, Helmet, CORS, express-rate-limit, node-cron |
| Tooling | ESLint, Prettier |

---

## Project structure

```text
slicehub/
├── client/                 # React (Vite) app
│   ├── src/pages/          # Customer + admin screens
│   ├── src/components/     # UI + 3D pizza components
│   ├── src/services/       # Axios API clients
│   └── .env.example
├── server/                 # Express API
│   ├── routes/             # REST mounts under /api
│   ├── controllers/
│   ├── services/
│   ├── models/
│   ├── middleware/
│   ├── utils/              # Seeds + smoke tests
│   ├── docs/               # Feature notes
│   └── .env.example
└── README.md
```

---

## Prerequisites

- Node.js **18+** (20+ recommended)
- npm **9+**
- MongoDB (local, Docker, or Atlas)

---

## Environment

### Client (`client/.env`)

Copy from `client/.env.example`:

| Variable | Purpose |
| --- | --- |
| `VITE_API_BASE_URL` | API base (e.g. `http://localhost:5000/api`) |
| `VITE_APP_NAME` | App display name |

### Server (`server/.env`)

Copy from `server/.env.example`. Important variables:

| Variable | Purpose |
| --- | --- |
| `NODE_ENV` | `development` / `production` |
| `PORT` | API port (default `5000`) |
| `CLIENT_URL` | Frontend origin for CORS + email links |
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | **Required strong secret in production** |
| `JWT_EXPIRES_IN` | Token lifetime |
| `EMAIL_HOST` / `EMAIL_PORT` / `EMAIL_USER` / `EMAIL_PASS` / `EMAIL_FROM` | SMTP for verify/reset emails |
| `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` | Razorpay **test** keys (optional for COD-only demos) |
| `CART_DELIVERY_FEE` / `CART_FREE_DELIVERY_MIN` / `CART_TAX_RATE` | Server cart pricing |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Optional overrides for `npm run seed:admin` |

Never commit real `.env` files or live payment/email secrets.

---

## Database

Set `MONGODB_URI` (default in example: `mongodb://127.0.0.1:27017/slicehub`).

Example with Docker:

```bash
docker run -d --name slicehub-mongo -p 27017:27017 mongo:7
```

---

## Seed data

From `server/`:

```bash
npm run seed:admin      # creates default admin (override ADMIN_* env vars)
npm run seed:menu       # categories + ~25 pizzas
npm run seed:inventory  # inventory SKUs for builder/menu options
npm run seed:coupon     # optional sample coupon for cart apply
```

---

## Run locally

### Backend

```bash
cd server
cp .env.example .env   # then edit values
npm install
npm run seed:admin
npm run seed:menu
npm run seed:inventory
npm run dev
```

Health: [http://localhost:5000/api/health](http://localhost:5000/api/health)

### Frontend

```bash
cd client
cp .env.example .env
npm install
npm run dev
```

App: [http://localhost:5173](http://localhost:5173)  
Vite is configured with `host: true` so `localhost` and `127.0.0.1` both work for email links.

---

## Email verification & password reset

1. Configure real SMTP in `server/.env` (Gmail App Password works with `smtp.gmail.com` / port `587`).
2. Set `CLIENT_URL` to the **exact** frontend origin (default `http://localhost:5173`).
3. Verification and reset emails use links like:
   - `{CLIENT_URL}/verify-email?token=…`
   - `{CLIENT_URL}/reset-password?token=…`
4. `localhost` links only work on the machine running the app. For a phone/other PC, use a LAN URL in `CLIENT_URL` (and open the firewall).

See also: `server/docs/EMAIL_VERIFICATION.md`.

---

## Payments

- **COD** works without Razorpay keys.
- **UPI/Card** create a Razorpay checkout after the order is placed; payment is marked paid only after **server signature verification**.
- If keys are missing, online pay returns a clear “unavailable” message; COD remains available.
- Use Razorpay **test** keys only. Never commit secrets.

See: `server/docs/RAZORPAY_TEST_MODE.md`.

---

## 3D builder

Build Your Pizza uses **procedural** React Three Fiber / Three.js geometry and canvas-generated textures (crust, sauce, cheese, toppings). There is no photogrammetry/GLB asset pipeline. The preview follows the live builder customization state.

---

## Testing & quality

From `server/`:

| Command | Description |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run test:menu` | Menu API smoke |
| `npm run test:builder` | Builder quote smoke |
| `npm run test:cart` | Cart API smoke |
| `npm run test:orders` | Order/address smoke |
| `npm run test:payments` | Payment signature helpers |
| `npm run test:phase13` | Security-oriented checks |
| `npm run test:inventory` | Inventory smoke |
| `npm run test:notifications` | Notifications smoke |
| `npm run test:tracking` | Tracking smoke |

From `client/`:

| Command | Description |
| --- | --- |
| `npm run lint` | ESLint |
| `npm run build` | Production build |
| `npm run format` | Prettier |

There is no separate frontend unit/E2E test suite.

---

## Default admin (development)

After `npm run seed:admin`, if `ADMIN_EMAIL` / `ADMIN_PASSWORD` are unset, the seed uses development defaults and logs a warning. Change credentials before any shared deploy.

Admin UI: [http://localhost:5173/admin/login](http://localhost:5173/admin/login)

---

## License / coursework

Built as a full-stack internship / coursework pizza delivery project. Adapt env and secrets for your environment before any public deploy.
