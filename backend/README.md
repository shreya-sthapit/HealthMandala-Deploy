# HealthMandala — Backend

REST API for the HealthMandala doctor appointment booking system.

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- JWT authentication
- Nodemailer (email verification)
- Twilio (SMS OTP)
- Multer (file uploads)
- bcryptjs (password hashing)

## Getting Started

```bash
npm install
# Add your credentials to .env (see .env.example)
npm run dev
```

## Environment Variables

```
PORT=5001
MONGODB_URI=your_mongodb_uri
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_brevo_smtp_login
EMAIL_PASS=your_brevo_smtp_key
EMAIL_FROM=HealthMandala <verified_sender@example.com>
FRONTEND_URL=http://localhost:3000
TWILIO_ACCOUNT_SID=your_sid
TWILIO_AUTH_TOKEN=your_token
TWILIO_VERIFY_SERVICE_SID=your_service_sid
```

Email OTPs are sent through Brevo SMTP (`smtp-relay.brevo.com`). In production, add the same `EMAIL_USER`, `EMAIL_PASS`, and `EMAIL_FROM` values to your Render backend environment variables. `EMAIL_FROM` must use a sender address that is verified in Brevo.

## API Endpoints

| Method | Route | Description |
|--------|-------|-------------|
| POST | /api/auth/send-verification | Send JWT email verification |
| GET | /api/auth/verify-email | Verify email token |
| POST | /api/auth/login | Login user |
| POST | /api/otp/send | Send SMS OTP |
| POST | /api/otp/verify | Verify SMS OTP |
| GET | /api/doctor/approved | Get all approved doctors |
| PUT | /api/doctor/schedule/:userId | Update doctor schedule |
| GET | /api/appointments/available-tokens/:doctorId/:date | Get available tokens |
| POST | /api/appointments/book | Book appointment |

## Middleware
- `authMiddleware` — JWT verification for protected routes
- `optionalAuth` — attaches user if token present, doesn't block
- `roleCheck` — role-based access control (patient/doctor/admin)
- `validate` — request body field validation
- `rateLimiter` — in-memory rate limiting for auth endpoints

## Utilities
- `timeUtils` — token calculation from working hours
- `dateUtils` — timezone-safe date parsing and leave checking
- `responseUtils` — consistent API response format
