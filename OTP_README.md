# 📧 Nodemailer OTP Email Verification

Complete OTP (One-Time Password) email verification system using **Nodemailer** with Gmail SMTP service.

## 🚀 Features

✅ Email-based OTP verification during signup
✅ Uses Nodemailer with Gmail (100% FREE - 500 emails/day)
✅ 6-digit OTP with 2-minute expiration
✅ Beautiful bilingual email templates (English + Gujarati)
✅ Resend OTP functionality
✅ Proper validation and error handling
✅ Secure password storage in Firestore (temporary)

## 📁 Project Structure

```
v2/
├── src/
│   ├── contexts/
│   │   └── AuthContext.tsx          # Frontend auth logic
│   ├── pages/
│   │   └── Auth.tsx                 # Login/Signup UI with OTP
│   └── lib/
│       └── otp-service.ts           # OTP service (now calls backend API)
│
└── server/                          # Backend API
    ├── index.js                     # Express server with Nodemailer
    ├── package.json                 # Backend dependencies
    ├── .env.example                 # Environment template
    └── SETUP_GUIDE.md              # Detailed setup instructions
```

## ⚡ Quick Start

### 1. Install Dependencies

```bash
# Frontend is already set up
# Install backend dependencies
cd server
npm install
```

### 2. Configure Environment Variables

**Backend (`server/.env`):**
```bash
# Copy the example file
cp .env.example .env

# Edit .env and add your credentials:
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx-xxxx-xxxx-xxxx  # From Gmail App Passwords
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
```

**Frontend (`.env`):**
```bash
VITE_BACKEND_URL=http://localhost:3001
```

### 3. Get Gmail App Password

📖 See detailed instructions in: [`server/SETUP_GUIDE.md`](./server/SETUP_GUIDE.md)

**Quick steps:**
1. Enable 2FA on Gmail: https://myaccount.google.com/security
2. Generate App Password: https://myaccount.google.com/apppasswords
3. Copy the 16-character password to `server/.env`

### 4. Run the Application

**Option 1: Two Terminals**

```bash
# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend
npm run server
```

**Option 2: Check Services**

- Frontend: http://localhost:5173
- Backend Health: http://localhost:3001/api/health

## 🔄 How It Works

### Signup Flow:

1. User fills signup form (name, email, password)
2. Frontend calls `sendSignupOTP()`
3. Backend generates 6-digit OTP
4. Backend stores OTP + user data in Firestore (2-min expiry)
5. Backend sends email via Nodemailer
6. User receives email and enters OTP
7. Frontend calls `verifyOTPAndSignup()` 
8. Backend verifies OTP
9. Backend returns user data
10. Frontend creates Firebase account
11. User is logged in

### API Endpoints:

```
POST /api/send-otp
  Body: { email, displayName, password }
  Returns: { success, message, email }

POST /api/verify-otp
  Body: { email, otp }
  Returns: { success, valid, displayName, password }

GET /api/health
  Returns: { status, message, timestamp }
```

## 🧪 Testing

1. Navigate to: http://localhost:5173/auth
2. Click **Sign Up** tab
3. Enter:
   - Display Name: Test User
   - Email: your-email@gmail.com
   - Password: test123
4. Click **Continue**
5. Check email inbox (should arrive in 5-10 seconds)
6. Enter the 6-digit OTP
7. Click **Verify & Create Account**
8. ✅ Account created!

## 🛡️ Validation

The system includes comprehensive validation:

### Backend Validation:
- ✅ Email format validation
- ✅ Display name minimum length (2 chars)
- ✅ Password minimum length (6 chars)
- ✅ OTP format validation (6 digits)
- ✅ OTP expiration check (2 minutes)
- ✅ Missing field validation

### Frontend Validation:
- ✅ Zod schema validation
- ✅ Real-time form validation
- ✅ Password visibility toggle
- ✅ OTP countdown timer
- ✅ Resend OTP with cooldown

## 📧 Email Template

The OTP email includes:
- Professional HTML design
- Gradient header
- Large, readable OTP code
- Bilingual content (English + Gujarati)
- Expiration warning
- Security notice

## 🐛 Troubleshooting

### Backend won't start?
- Check `server/.env` has all variables
- Verify port 3001 is available
- Check console for errors

### Email not received?
- Check spam/junk folder
- Verify Gmail App Password is correct
- Check backend console logs
- Ensure 2FA is enabled on Gmail

### "Invalid credentials" error?
- Double-check `GMAIL_APP_PASSWORD`
- Make sure it's the App Password, not Gmail password
- Regenerate App Password

### Firebase errors?
- Verify Firebase credentials in `server/.env`
- Check Firestore database exists
- Ensure service account has permissions

## 📊 Free Tier Limits

### Gmail:
- **500 emails/day** (Free)
- Perfect for development & small apps

### Alternatives:
- Outlook: 300/day
- SendGrid: 100/day (free tier)
- Mailgun: 100/day (free tier)

## 🔒 Security

- ✅ Environment variables for secrets
- ✅ `.env` in `.gitignore`
- ✅ OTP auto-deletion after use
- ✅ 2-minute OTP expiration
- ✅ Secure password hashing by Firebase
- ✅ CORS protection

## 📝 Environment Variables

### Required Backend Variables:
```env
GMAIL_USER                # Gmail address
GMAIL_APP_PASSWORD         # 16-char App Password
FIREBASE_PROJECT_ID        # From Firebase Console
FIREBASE_CLIENT_EMAIL      # Service account email
FIREBASE_PRIVATE_KEY       # Private key (keep \n)
PORT                       # Server port (default: 3001)
CORS_ORIGIN               # Frontend URL
```

### Required Frontend Variables:
```env
VITE_BACKEND_URL          # Backend API URL
```

## 🚀 Production Deployment

Before deploying:
- [ ] Update `VITE_BACKEND_URL` to production URL
- [ ] Update `CORS_ORIGIN` to production frontend
- [ ] Consider dedicated SMTP service (SendGrid, AWS SES)
- [ ] Set up rate limiting
- [ ] Enable HTTPS for backend
- [ ] Monitor email sending logs
- [ ] Set up error alerting

## 📚 Documentation

- **Setup Guide**: [`server/SETUP_GUIDE.md`](./server/SETUP_GUIDE.md)
- **Implementation Plan**: See artifacts directory
- **API Docs**: See `server/index.js` inline comments

## 🎯 Next Steps

Potential enhancements:
- [ ] Rate limiting middleware
- [ ] Email template customization
- [ ] Multiple SMTP provider support
- [ ] OTP attempt limiting (max 3 tries)
- [ ] Admin dashboard for email stats
- [ ] Email queue system
- [ ] SMS OTP fallback

---

**Need Help?**
Check the detailed setup guide: [`server/SETUP_GUIDE.md`](./server/SETUP_GUIDE.md)
