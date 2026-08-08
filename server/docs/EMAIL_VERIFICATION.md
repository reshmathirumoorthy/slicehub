# Email verification (SliceHub)

## Flow

1. `POST /api/auth/register` creates the user with `isEmailVerified: false`, stores a **hashed** verification token (24h expiry), and attempts SMTP delivery.
2. Frontend navigates to `/verify-email?email=…`.
3. User opens the link from email → `/verify-email?token=…` → `GET /api/auth/verify-email/:token`.
4. Token is validated, user marked verified, token cleared.
5. `POST /api/auth/login` succeeds only when `isEmailVerified` is true.
6. `POST /api/auth/resend-verification` issues a new token (invalidates the previous), with a 60s per-user cooldown and route rate limiting.

## Why mail might not arrive

If `EMAIL_HOST` / `EMAIL_USER` / `EMAIL_PASS` are missing or still set to placeholders (`smtp.example.com`, `your_email@example.com`, etc.), Nodemailer **does not send**. The API returns `emailSent: false` / `emailDelivery: "not_configured"` (or `503` on resend). Verification itself is **not** disabled.

## Required environment variables

| Variable | Purpose |
|----------|---------|
| `EMAIL_HOST` | SMTP host (`smtp.gmail.com` for Gmail) |
| `EMAIL_PORT` | Usually `587` (STARTTLS) or `465` (SSL) |
| `EMAIL_SECURE` | `true` for 465; `false` for 587 |
| `EMAIL_USER` | SMTP username (full Gmail address) |
| `EMAIL_PASS` | SMTP password (**Gmail App Password**, not the normal password) |
| `EMAIL_FROM` | From header, e.g. `"SliceHub <you@gmail.com>"` |
| `CLIENT_URL` | Used to build verify links (`http://localhost:5173`) |

Copy from `server/.env.example` into `server/.env` and replace placeholders. Restart the API after changes.

## Localhost / “This site can’t be reached”

Verification emails use `CLIENT_URL` (default `http://localhost:5173/verify-email?token=…`).

- Open the link on the **same PC** that is running `npm run dev` in `client/`.
- Opening the link on a **phone** fails: `localhost` means the phone, not your laptop.
- The Vite dev server must be running (`http://localhost:5173`). If it is stopped, the browser shows “This site can’t be reached.”
- Vite is configured with `server.host: true` so both `localhost` and `127.0.0.1` reach the app.

To test from another device on your Wi‑Fi, set `CLIENT_URL` to your PC’s LAN URL (e.g. `http://192.168.x.x:5173`) and keep the frontend listening with `--host` / `host: true`.

## Gmail App Password

1. Enable 2-Step Verification on the Google account.
2. Google Account → Security → App passwords → generate one for Mail.
3. Set `EMAIL_PASS` to that 16-character value (no spaces).
4. Set `EMAIL_HOST=smtp.gmail.com`, `EMAIL_PORT=587`, `EMAIL_SECURE=false`.

## Endpoints

| Method | Path | Notes |
|--------|------|-------|
| `POST` | `/api/auth/register` | Returns `requiresEmailVerification`, `emailSent`, `emailDelivery` |
| `GET` | `/api/auth/verify-email/:token` | Marks email verified |
| `POST` | `/api/auth/resend-verification` | Body: `{ email }` — cooldown + SMTP required |
| `POST` | `/api/auth/login` | `403` + `code: EMAIL_NOT_VERIFIED` if unverified |
