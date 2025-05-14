# LateWork - Course Learning App

A mobile learning platform built with Expo (React Native) and Firebase to allow users to browse, enroll in, and learn from various courses.

## Features

- **User Authentication**: Sign up and login with email
- **Course Browsing**: View available courses with details
- **Course Enrollment**: Enroll in courses of interest
- **Course Learning**: Access course content including videos and documents
- **Admin Dashboard**: Create and manage courses and lessons (admin only)

## Project Structure

```
/src
  /components        # Reusable UI components
  /config            # Configuration files (Firebase, etc.)
  /constants         # App constants
  /hooks             # Custom hooks
  /navigation        # Navigation setup
  /screens           # App screens
  /services          # Firebase service functions
  /types             # TypeScript type definitions
  /utils             # Utility functions
```

## Prerequisites

- Node.js (>= 14.x)
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)
- Firebase account with a project set up

## Installation

1. Clone the repository:
```bash
git clone [repository-url]
cd LateWork
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Install required dependencies:
```bash
npm install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs expo-image-picker react-native-webview react-native-gesture-handler react-native-safe-area-context react-native-screens expo-status-bar firebase
# or
yarn add @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs expo-image-picker react-native-webview react-native-gesture-handler react-native-safe-area-context react-native-screens expo-status-bar firebase
```

## Firebase Configuration

1. Create a new Firebase project at [firebase.google.com](https://firebase.google.com)
2. Enable Authentication (Email/Password)
3. Create a Firestore database
4. Set up Firebase Storage
5. Add your web app to Firebase and copy the config
6. Update the Firebase configuration in `/src/config/firebase.ts`

## Firestore Data Structure

- **users**: User profiles and enrolled courses
  - `id`: String (User ID from Firebase Auth)
  - `email`: String
  - `displayName`: String
  - `role`: String ('user' or 'admin')
  - `enrolledCourses`: Array of Course IDs
  - `createdAt`: Number (Timestamp)

- **courses**: Course information
  - `id`: String (Auto-generated)
  - `name`: String
  - `description`: String
  - `level`: String
  - `duration`: String
  - `pic`: String (Image URL)
  - `recommendedFor`: String
  - `category`: String
  - `createdAt`: Number (Timestamp)
  - `updatedAt`: Number (Timestamp)

- **courses/{courseId}/lessons**: Lesson content
  - `id`: String (Auto-generated)
  - `title`: String
  - `description`: String
  - `videoUrl`: String
  - `documentUrl`: String
  - `order`: Number
  - `createdAt`: Number (Timestamp)
  - `updatedAt`: Number (Timestamp)

## Running the App

```bash
npm start
# or
yarn start
```

Follow the instructions in the terminal to run on:
- iOS simulator
- Android emulator
- Physical device using Expo Go app

## License

[MIT License](LICENSE)
