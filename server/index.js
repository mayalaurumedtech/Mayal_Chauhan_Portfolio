import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';

// Load environment variables
dotenv.config();

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
// app.use(cors({
//     origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
//     credentials: true
// }));
app.use(express.json());

// Initialize Firebase Admin SDK
if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: process.env.FIREBASE_PROJECT_ID,
            clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
            privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        })
    });
}

const db = admin.firestore();

// Create Nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
    },
});

// Verify email configuration on startup
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ Email configuration error:', error);
        console.log('⚠️  Please check your Gmail credentials in .env file');
    } else {
        console.log('✅ Email server is ready to send messages');
    }
});

// Generate 6-digit OTP
const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Validation helper
const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

// API Routes

/**
 * POST /api/send-otp
 * Send OTP via email and store in Firestore
 */
app.post('/api/send-otp', async (req, res) => {
    try {
        const { email, displayName, password } = req.body;

        // Validation
        if (!email || !displayName || !password) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: email, displayName, password'
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address format'
            });
        }

        if (displayName.trim().length < 2) {
            return res.status(400).json({
                success: false,
                message: 'Display name must be at least 2 characters'
            });
        }

        if (password.length < 6) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 6 characters'
            });
        }

        // Generate OTP
        const otp = generateOTP();
        const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes

        // Store OTP in Firestore
        const otpRef = db.collection('otp_verifications').doc(email);
        await otpRef.set({
            email,
            otp,
            displayName,
            password,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            expiresAt,
        });

        // Email HTML template
        const emailHTML = `
      <!DOCTYPE html>
      <html>
      <head>
          <meta charset="UTF-8">
          <style>
              body { 
                  font-family: 'Segoe UI', Arial, sans-serif; 
                  line-height: 1.6; 
                  color: #333;
                  margin: 0;
                  padding: 0;
                  background-color: #f4f4f4;
              }
              .container { 
                  max-width: 600px; 
                  margin: 20px auto; 
                  background: white;
                  border-radius: 10px;
                  overflow: hidden;
                  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
              }
              .header { 
                  background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%); 
                  color: white; 
                  padding: 40px 20px; 
                  text-align: center;
              }
              .header h1 {
                  margin: 0;
                  font-size: 28px;
              }
              .content { 
                  padding: 40px 30px;
                  background: #ffffff;
              }
              .otp-box { 
                  background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
                  border: 3px solid #3b82f6; 
                  border-radius: 12px; 
                  padding: 30px; 
                  text-align: center; 
                  margin: 30px 0;
                  box-shadow: 0 4px 6px rgba(59, 130, 246, 0.1);
              }
              .otp-code { 
                  font-size: 48px; 
                  font-weight: bold; 
                  color: #1e40af; 
                  letter-spacing: 8px;
                  font-family: 'Courier New', monospace;
              }
              .warning {
                  background: #fef3c7;
                  border-left: 4px solid #f59e0b;
                  padding: 15px;
                  margin: 20px 0;
                  border-radius: 4px;
              }
              .footer { 
                  text-align: center; 
                  color: #6b7280; 
                  font-size: 13px; 
                  padding: 20px;
                  background: #f9fafb;
                  border-top: 1px solid #e5e7eb;
              }
              .gujarati {
                  color: #059669;
                  font-weight: 500;
              }
          </style>
      </head>
      <body>
          <div class="container">
              <div class="header">
                  <h1>🔐 Email Verification</h1>
                  <p style="margin: 10px 0 0 0; opacity: 0.9;">ઈમેલ વેરિફિકેશન</p>
              </div>
              <div class="content">
                  <p><strong>Hello ${displayName},</strong></p>
                  
                  <p class="gujarati">તમારો વેરિફિકેશન કોડ નીચે છે:</p>
                  <p>Your verification code is:</p>
                  
                  <div class="otp-box">
                      <div class="otp-code">${otp}</div>
                  </div>
                  
                  <div class="warning">
                      <strong>⚠️ Important / મહત્વપૂર્ણ:</strong><br>
                      <span class="gujarati">આ કોડ <strong>2 મિનિટ</strong> માં expire થઈ જશે.</span><br>
                      This code expires in <strong>2 minutes</strong>.
                  </div>
                  
                  <p style="margin-top: 30px;">
                      <span class="gujarati">જો તમે આ રિક્વેસ્ટ નથી કરી, તો આ email ને ignore કરો.</span><br>
                      If you didn't request this code, please ignore this email.
                  </p>
              </div>
              <div class="footer">
                  <p>This is an automated message, please do not reply.</p>
                  <p class="gujarati">આ ઓટોમેટિક મેસેજ છે, રિપ્લાય ન કરશો.</p>
              </div>
          </div>
      </body>
      </html>
    `;

        // Send email
        const mailOptions = {
            from: `"Portfolio App" <${process.env.GMAIL_USER}>`,
            to: email,
            subject: 'તમારો વેરિફિકેશન કોડ / Your Verification Code',
            text: `Hello ${displayName},\n\nYour verification code is: ${otp}\n\nThis code expires in 2 minutes.\n\nતમારો વેરિફિકેશન કોડ છે: ${otp}\n\nઆ કોડ 2 મિનિટમાં expire થઈ જશે.`,
            html: emailHTML,
        };

        await transporter.sendMail(mailOptions);

        console.log(`✅ OTP sent to ${email}: ${otp}`);

        res.json({
            success: true,
            message: 'OTP sent successfully',
            email: email
        });

    } catch (error) {
        console.error('❌ Error sending OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to send OTP',
            error: error.message
        });
    }
});

/**
 * POST /api/verify-otp
 * Verify OTP and return user data
 */
app.post('/api/verify-otp', async (req, res) => {
    try {
        const { email, otp } = req.body;

        // Validation
        if (!email || !otp) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: email, otp'
            });
        }

        if (!validateEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email address format'
            });
        }

        if (otp.length !== 6) {
            return res.status(400).json({
                success: false,
                message: 'OTP must be 6 digits'
            });
        }

        // Get OTP from Firestore
        const otpRef = db.collection('otp_verifications').doc(email);
        const otpDoc = await otpRef.get();

        if (!otpDoc.exists) {
            return res.status(404).json({
                success: false,
                valid: false,
                message: 'OTP not found or expired'
            });
        }

        const data = otpDoc.data();

        // Check if OTP is expired
        if (Date.now() > data.expiresAt) {
            await otpRef.delete();
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'OTP has expired'
            });
        }

        // Check if OTP matches
        if (data.otp !== otp) {
            return res.status(400).json({
                success: false,
                valid: false,
                message: 'Invalid OTP'
            });
        }

        // OTP is valid, delete it and return user data
        await otpRef.delete();

        res.json({
            success: true,
            valid: true,
            displayName: data.displayName,
            password: data.password,
            message: 'OTP verified successfully'
        });

    } catch (error) {
        console.error('❌ Error verifying OTP:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify OTP',
            error: error.message
        });
    }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        message: 'OTP Email Server is running',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(PORT, () => {
    console.log(`
╔════════════════════════════════════════╗
║   🚀 OTP Email Server Started 🚀       ║
╠════════════════════════════════════════╣
║  Server: http://localhost:${PORT}       ║
║  Status: ✅ Running                     ║
║  CORS: ${process.env.CORS_ORIGIN}     
║                                        ║
║  Endpoints:                            ║
║  POST /api/send-otp                    ║
║  POST /api/verify-otp                  ║
║  GET  /api/health                      ║
╚════════════════════════════════════════╝
  `);
});
