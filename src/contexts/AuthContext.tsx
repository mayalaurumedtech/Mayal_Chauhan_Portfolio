import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import {
  User,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
  sendPasswordResetEmail
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  loading: boolean;
  signup: (email: string, password: string, displayName?: string) => Promise<void>;
  sendSignupOTP: (email: string, password: string, displayName: string) => Promise<string>;
  verifyOTPAndSignup: (email: string, otp: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setUser(user);

      if (user) {
        // Check if user is admin based on email (Super Admin)
        // Check if user is admin based on email (Super Admin)
        const adminEmail = import.meta.env.VITE_ADMIN_EMAIL;
        const isSuperAdmin = adminEmail && user.email?.toLowerCase() === adminEmail.toLowerCase();

        let role = 'user';
        if (isSuperAdmin) {
          role = 'admin';
          setIsAdmin(true); // Set immediate if super admin
        }

        // Save/Sync user to Firestore
        try {
          const userRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userRef); // Get current data to check role

          if (userSnap.exists()) {
            // Only overwrite role from DB if NOT super admin (env var takes precedence or is equal)
            // Actually, if DB says admin, we trust it too.
            const dbRole = userSnap.data().role;
            if (dbRole === 'admin') {
              role = 'admin';
              setIsAdmin(true);
            }
          }

          // Force admin role if matches env email (redundant but safe)
          if (isSuperAdmin) {
            role = 'admin';
          }

          // If neither super admin nor DB admin, then isAdmin remains false (default) or set to false
          if (role !== 'admin') {
            setIsAdmin(false);
          }

          await setDoc(userRef, {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: serverTimestamp(),
            creationTime: user.metadata.creationTime,
            lastSignInTime: user.metadata.lastSignInTime,
            authProvider: user.providerData[0]?.providerId || 'email',
            role: role
          }, { merge: true });
        } catch (error) {
          console.error("Error saving user to Firestore:", error);
          // Even if Firestore fails, if we established isSuperAdmin earlier, we stay Admin
          if (isSuperAdmin) {
            setIsAdmin(true);
          }
        }
      } else {
        setIsAdmin(false);
      }

      setLoading(false);
    });

    return unsubscribe;
  }, []);


  const sendSignupOTP = async (email: string, password: string, displayName: string): Promise<string> => {
    const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${backendURL}/api/send-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, displayName, password }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || 'Failed to send OTP');
      }

      console.log(`✅ OTP sent to ${email}`);
      // Return empty string as backend handles OTP
      return '';
    } catch (error: any) {
      console.error('❌ Error sending OTP:', error);
      throw new Error(error.message || 'Failed to send verification code. Please try again.');
    }
  };

  const verifyOTPAndSignup = async (email: string, otp: string): Promise<void> => {
    const backendURL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';

    try {
      const response = await fetch(`${backendURL}/api/verify-otp`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, otp }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.valid) {
        throw new Error(data.message || 'Invalid OTP');
      }

      // Create the account after OTP is verified
      if (data.password && data.displayName) {
        await signup(email, data.password, data.displayName);
      } else {
        throw new Error('Signup data not found');
      }
    } catch (error: any) {
      console.error('❌ Error verifying OTP:', error);
      throw new Error(error.message || 'Failed to verify OTP. Please try again.');
    }
  };

  const signup = async (email: string, password: string, displayName?: string) => {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    if (displayName && userCredential.user) {
      await updateProfile(userCredential.user, { displayName });
    }
  };

  const login = async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    await sendPasswordResetEmail(auth, email);
  };

  const refreshUser = async () => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      // Force reload the user data from Firebase Auth
      await currentUser.reload();
      setUser({ ...auth.currentUser } as User);
    }
  };

  const value = {
    user,
    isAdmin,
    loading,
    signup,
    sendSignupOTP,
    verifyOTPAndSignup,
    login,
    loginWithGoogle,
    logout,
    resetPassword,
    refreshUser
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
