import { collection, doc, setDoc, getDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

interface OTPData {
    email: string;
    otp: string;
    displayName: string;
    password: string;
    createdAt: any;
    expiresAt: number;
}

// Generate a random 6-digit OTP
export const generateOTP = (): string => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

// Store OTP in Firestore with 2-minute expiration
export const storeOTP = async (
    email: string,
    otp: string,
    displayName: string,
    password: string
): Promise<void> => {
    const otpRef = doc(db, 'otp_verifications', email);
    const expiresAt = Date.now() + 2 * 60 * 1000; // 2 minutes

    await setDoc(otpRef, {
        email,
        otp,
        displayName,
        password,
        createdAt: serverTimestamp(),
        expiresAt,
    });
};

// Verify OTP
export const verifyOTP = async (email: string, otp: string): Promise<{
    valid: boolean;
    displayName?: string;
    password?: string;
    message?: string;
}> => {
    const otpRef = doc(db, 'otp_verifications', email);
    const otpDoc = await getDoc(otpRef);

    if (!otpDoc.exists()) {
        return { valid: false, message: 'OTP not found or expired' };
    }

    const data = otpDoc.data() as OTPData;

    // Check if OTP is expired
    if (Date.now() > data.expiresAt) {
        await deleteDoc(otpRef);
        return { valid: false, message: 'OTP has expired' };
    }

    // Check if OTP matches
    if (data.otp !== otp) {
        return { valid: false, message: 'Invalid OTP' };
    }

    // OTP is valid, delete it and return the stored data
    await deleteDoc(otpRef);
    return {
        valid: true,
        displayName: data.displayName,
        password: data.password,
    };
};

/**
 * Send OTP via Nodemailer Backend API
 * 
 * 100% FREE with Gmail SMTP (500 emails/day)
 * Backend runs on http://localhost:3001
 */
export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
    const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
    console.log(`📧 Sending OTP to ${email} via Nodemailer backend...`);

    try {
        // Note: OTP is generated in backend, we don't use the frontend OTP
        // This is just for the sendOTPEmail signature compatibility
        const response = await fetch(`${backendURL}/api/send-otp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, displayName: 'User', password: 'temp' }),
        });

        const data = await response.json();

        if (!response.ok || !data.success) {
            throw new Error(data.message || 'Failed to send OTP');
        }

        console.log(`✅ OTP sent successfully to ${email}`);
        console.log(`📬 Check ${email} inbox now.`);

    } catch (error: any) {
        console.error('❌ Backend API error:', error);

        // Fallback to console
        console.log(`
╔════════════════════════════════════════╗
║   ⚠️  Backend Server જોઈએ છે  ⚠️        ║
╠════════════════════════════════════════╣
║  Console Fallback OTP:                 ║
║  To: ${email.padEnd(33)}║
║  Code: ${otp}                         ║
║                                        ║
║  Start backend: npm run server         ║
╚════════════════════════════════════════╝
        `);

        throw error;
    }
};
