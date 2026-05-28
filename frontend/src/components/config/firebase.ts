import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';

// Firebase configuration with the latest values from Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyDX17d_lN6JU718cB6t4Qz5mFTV7tbg5AI",
  authDomain: "healthmandala.firebaseapp.com",
  projectId: "healthmandala",
  storageBucket: "healthmandala.firebasestorage.app",
  messagingSenderId: "332585103082",
  appId: "1:332585103082:web:cb4e88888ed165d6be3193",
  measurementId: "G-TC5T6VPGJP"
};

console.log('Firebase Config:', {
  apiKey: firebaseConfig.apiKey.substring(0, 10) + '...',
  authDomain: firebaseConfig.authDomain,
  projectId: firebaseConfig.projectId
});

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;

try {
  if (getApps().length === 0) {
    console.log('Initializing Firebase app...');
    app = initializeApp(firebaseConfig);
    console.log('Firebase app initialized');
    console.log('App name:', app.name);
    console.log('App options:', app.options);
  } else {
    console.log('Using existing Firebase app');
    app = getApp();
  }
  
  auth = getAuth(app);
  console.log('Firebase Auth initialized');
  console.log('Auth app name:', auth.app.name);
  console.log('Auth config apiKey:', auth.config.apiKey?.substring(0, 10) + '...');
} catch (error) {
  console.error('Firebase initialization error:', error);
  throw error;
}

export { auth };
export default app;