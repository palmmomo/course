// Firebase configuration
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAnalytics } from "firebase/analytics";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCTxIlM9apUp3zApmLfencoDKP-Uk6chgE",
  authDomain: "course-69a20.firebaseapp.com",
  projectId: "course-69a20",
  storageBucket: "course-69a20.firebasestorage.app",
  messagingSenderId: "592955923529",
  appId: "1:592955923529:web:26181764436383c19bb398",
  measurementId: "G-Q3PF0DBF44"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase services
const auth = getAuth(app);
const firestore = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

export { app, auth, firestore, storage, analytics };
