import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AppNavigator from './src/navigation';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, firestore } from './src/config/firebase';

// Ignore specific Firebase warnings that we can't fix
LogBox.ignoreLogs([
  'Setting a timer',
  'AsyncStorage has been extracted from react-native',
  '@firebase/auth',
]);

export default function App() {
  useEffect(() => {
    // Setup auth state listener to manage user sessions
    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        try {
          const userRef = doc(firestore, 'users', user.uid);
          const userSnap = await getDoc(userRef);

          if (!userSnap.exists()) {
            await setDoc(userRef, {
              id: user.uid,
              email: user.email ?? '', // Use nullish coalescing for safety
              displayName: user.displayName ?? '',
              photoURL: user.photoURL ?? '',
              role: 'user' as const, // Define role as a literal type
              enrolledCourses: [] as string[], // Explicitly type as string array
              createdAt: Date.now(),
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