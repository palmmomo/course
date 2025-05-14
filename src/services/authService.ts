import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User as FirebaseUser,
  UserCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { User } from '../types';

// Sign in with email and password
export const signIn = async (email: string, password: string): Promise<UserCredential> => {
  const auth = getAuth();
  return await signInWithEmailAndPassword(auth, email, password);
};

// Sign up with email and password
export const signUp = async (
  email: string, 
  password: string, 
  displayName: string
): Promise<User> => {
  const auth = getAuth();
  
  // Create user in Firebase Auth
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const firebaseUser = userCredential.user;
  
  // Create user document in Firestore
  const user: User = {
    id: firebaseUser.uid,
    email: firebaseUser.email || email,
    displayName,
    role: 'user',
    enrolledCourses: [],
  };
  
  await setDoc(doc(firestore, 'users', firebaseUser.uid), {
    ...user,
    createdAt: Date.now()
  });
  
  return user;
};

// Sign out
export const signOut = async (): Promise<void> => {
  const auth = getAuth();
  return await firebaseSignOut(auth);
};

// Get current user data from Firestore
export const getCurrentUser = async (): Promise<User | null> => {
  const auth = getAuth();
  const firebaseUser = auth.currentUser;
  
  if (!firebaseUser) {
    return null;
  }
  
  const userDoc = await getDoc(doc(firestore, 'users', firebaseUser.uid));
  
  if (userDoc.exists()) {
    return userDoc.data() as User;
  }
  
  return null;
};

// Check if user is admin
export const isAdmin = async (): Promise<boolean> => {
  const user = await getCurrentUser();
  return user?.role === 'admin';
};

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
  const auth = getAuth();
  return await sendPasswordResetEmail(auth, email);
};
