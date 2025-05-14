import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { firestore } from './src/config/firebase';

// Ignore specific Firebase warnings that we can't fix
LogBox.ignoreLogs([
  'Setting a timer',
  'AsyncStorage has been extracted from react-native',
  '@firebase/auth',
]);

export default function App() {
  useEffect(() => {
    // Setup auth state listener to manage user sessions
    const auth = getAuth();
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        // Check if user exists in Firestore, if not create a document
        try {
          const userRef = doc(firestore, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              id: user.uid,
              email: user.email,
              displayName: user.displayName || '',
              photoURL: user.photoURL || '',
              role: 'user',
              enrolledCourses: [],
              createdAt: Date.now()
            });
          }
        } catch (error) {
          console.error('Error checking/creating user doc:', error);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <SafeAreaProvider>
      <AppNavigator />
      <StatusBar style="auto" />
    </SafeAreaProvider>
  );
}
