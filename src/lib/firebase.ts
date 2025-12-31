import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: "AIzaSyAa03yl0dWyZw1D_0wRATGkvIlLBxDwIBU",
  authDomain: "mayal-portfolio.firebaseapp.com",
  projectId: "mayal-portfolio",
  storageBucket: "mayal-portfolio.firebasestorage.app",
  messagingSenderId: "1050072336967",
  appId: "1:1050072336967:web:8093dd9d3defafe3b37f62",
  measurementId: "G-82LHG232QJ"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Initialize Cloud Storage and get a reference to the service
export const storage = getStorage(app);

export default app;
