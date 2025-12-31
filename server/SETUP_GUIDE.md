# 📧 Gmail OTP Setup Guide / Gmail OTP સેટઅપ ગાઇડ

## Quick Start / ઝડપી શરૂઆત

### Step 1: Configure Backend Environment Variables

1. Navigate to the `server` folder
2. Copy `.env.example` to `.env`:
   ```bash
   cd server
   cp .env.example .env
   ```

3. Open `server/.env` and configure the following:

#### Gmail Configuration:
```env
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx  # 16-character app password
```

#### Firebase Configuration:
Get these from Firebase Console → Project Settings → Service Accounts:
```env
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
```

---

## 🔐 How to Get Gmail App Password / Gmail App Password કેવી રીતે મેળવવો

### Prerequisites / પૂર્વશરતો:
- Gmail account / Gmail એકાઉન્ટ
- 2-Factor Authentication enabled / 2-ફેક્ટર ઓથેન્ટિકેશન enabled

### Steps / સ્ટેપ્સ:

#### 1. Enable 2-Factor Authentication (if not already enabled)
**English:**
1. Go to: https://myaccount.google.com/security
2. Under "How you sign in to Google", click "2-Step Verification"
3. Follow the steps to enable it

**ગુજરાતી:**
1. આ link પર જાઓ: https://myaccount.google.com/security
2. "How you sign in to Google" માં "2-Step Verification" પર click કરો
3. enable કરવા માટે steps follow કરો

#### 2. Generate App Password
**English:**
1. Go to: https://myaccount.google.com/apppasswords
2. In the "App name" field, type: `Portfolio OTP Service`
3. Click "Create"
4. **Copy the 16-character password** (format: `xxxx xxxx xxxx xxxx`)
5. Paste it in your `server/.env` file as `GMAIL_APP_PASSWORD`

**ગુજરાતી:**
1. આ link પર જાઓ: https://myaccount.google.com/apppasswords
2. "App name" field માં લખો: `Portfolio OTP Service`
3. "Create" પર click કરો
4. **16-character password copy કરો** (format: `xxxx xxxx xxxx xxxx`)
5. તમારી `server/.env` file માં `GMAIL_APP_PASSWORD` તરીકે paste કરો

> **⚠️ Important / મહત્વપૂર્ણ:**
> - This password is shown only once / આ password એક જ વાર બતાવવામાં આવે છે
> - Keep it secure / તેને સુરક્ષિત રાખો
> - Don't share it with anyone / કોઈ સાથે share ન કરો

---

## 🔥 How to Get Firebase Credentials / Firebase Credentials કેવી રીતે મેળવવી

**English:**
1. Go to Firebase Console: https://console.firebase.google.com
2. Select your project
3. Click the gear icon ⚙️ → "Project settings"
4. Go to "Service accounts" tab
5. Click "Generate new private key"
6. A JSON file will download with all credentials
7. Open the JSON file and copy:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (keep the quotes and \n)

**ગુજરાતી:**
1. Firebase Console પર જાઓ: https://console.firebase.google.com
2. તમારો project select કરો
3. Gear icon ⚙️ → "Project settings" પર click કરો
4. "Service accounts" tab પર જાઓ
5. "Generate new private key" પર click કરો
6. JSON file download થશે
7. JSON file ખોલો અને copy કરો:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`
   - `private_key` → `FIREBASE_PRIVATE_KEY` (quotes અને \n રાખો)

---

## 🚀 Running the Application / Application ચલાવવી

### Option 1: Run Separately (Recommended for Development)

**Terminal 1 - Frontend:**
```bash
npm run dev
```
This runs on: http://localhost:5173

**Terminal 2 - Backend:**
```bash
npm run server
```
This runs on: http://localhost:3001

### Option 2: Check Backend Health
```bash
# Open in browser or use curl
http://localhost:3001/api/health
```

---

## 🧪 Testing the OTP System / OTP System ટેસ્ટ કરવી

### Test Flow / ટેસ્ટ Flow:

1. **Open your app**: http://localhost:5173
2. **Navigate to Signup page**
3. **Fill in the form**:
   - Display Name: Test User
   - Email: your-testing-email@gmail.com
   - Password: test123456
4. **Click "Continue"**
5. **Check your email inbox** (the email you entered)
6. **Copy the 6-digit OTP** from the email
7. **Enter OTP** in the verification screen
8. **Click "Verify & Create Account"**

### Expected Results / અપેક્ષિત પરિણામો:

✅ Email received within 5-10 seconds
✅ Email contains 6-digit OTP code
✅ Email template displays correctly (HTML formatted)
✅ OTP verification succeeds
✅ Account is created in Firebase
✅ User is redirected to homepage

---

## 🐛 Troubleshooting / સમસ્યા નિવારણ

### Issue: Backend server not starting
**Solution:**
- Make sure all environment variables are set in `server/.env`
- Check if port 3001 is available: `netstat -ano | findstr :3001`
- Check console for error messages

### Issue: Email not received
**Solutions:**
1. Check spam/junk folder
2. Verify Gmail credentials in `server/.env`
3. Check backend console for errors
4. Make sure Gmail App Password is correct (no spaces)
5. Verify 2FA is enabled on Gmail account

### Issue: "Invalid credentials" error
**Solutions:**
- Double-check `GMAIL_APP_PASSWORD` (should be 16 characters)
- Make sure you're using App Password, not regular Gmail password
- Regenerate App Password if needed

### Issue: Firebase errors
**Solutions:**
- Verify Firebase credentials are correct
- Check if Firestore database is created
- Ensure service account has proper permissions

---

## 📊 Gmail Free Tier Limits / Gmail મફત Tier મર્યાદાઓ

- **500 emails per day** (Free)
- Perfect for development and small applications
- Resets every 24 hours

**Alternative Free Services:**
- Outlook/Hotmail: 300 emails/day
- SendGrid: 100 emails/day (free tier)
- Mailgun: 100 emails/day (free tier)

---

## 🔒 Security Best Practices / સુરક્ષા Best Practices

1. **Never commit `.env` file to Git**
   - Already added to `.gitignore`
   
2. **Use environment variables for all secrets**
   - Never hardcode passwords or keys

3. **Rotate App Passwords regularly**
   - Change every 3-6 months

4. **Monitor email usage**
   - Stay within Gmail limits

5. **Rate limiting** (Future enhancement)
   - Prevent spam/abuse
   - Limit OTP requests per IP/email

---

## 📝 Environment Variables Reference

### Frontend (.env)
```env
VITE_BACKEND_URL=http://localhost:3001
```

### Backend (server/.env)
```env
# Gmail
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=xxxxxxxxxxxx

# Firebase
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Server
PORT=3001
CORS_ORIGIN=http://localhost:5173
```

---

## ✅ Production Deployment Checklist

When deploying to production:

- [ ] Update `VITE_BACKEND_URL` to production backend URL
- [ ] Update `CORS_ORIGIN` to production frontend URL
- [ ] Use production Gmail account (or dedicated SMTP service)
- [ ] Set up proper rate limiting
- [ ] Enable HTTPS for backend
- [ ] Monitor email sending logs
- [ ] Set up error alerting
- [ ] Consider using dedicated email service (SendGrid, AWS SES)

---

**Need Help? / મદદ જોઈએ છે?**
Check backend console for detailed error messages and logs.
