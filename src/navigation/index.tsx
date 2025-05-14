import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';

// Import screens (will create these next)
import HomeScreen from '../screens/HomeScreen';
import MyCoursesScreen from '../screens/MyCoursesScreen';
import ProfileScreen from '../screens/ProfileScreen';
import CourseDetailScreen from '../screens/CourseDetailScreen';
import LessonViewScreen from '../screens/LessonViewScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import AdminDashboardScreen from '../screens/AdminDashboardScreen';
import AdminCourseEditScreen from '../screens/AdminCourseEditScreen';
import AdminLessonEditScreen from '../screens/AdminLessonEditScreen';

// Create navigators
const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<RootStackParamList>();

// Main tab navigator for authenticated users
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: any;
          
          if (route.name === 'Home') {
            iconName = focused ? 'ios-home' : 'ios-home-outline';
          } else if (route.name === 'MyCourses') {
            iconName = focused ? 'ios-book' : 'ios-book-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'ios-person' : 'ios-person-outline';
          }
          
          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#4630EB', // Expo primary color
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{ 
          title: 'Home',
          headerShown: true,
        }}
      />
      <Tab.Screen 
        name="MyCourses" 
        component={MyCoursesScreen} 
        options={{ 
          title: 'My Courses',
          headerShown: true,
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{ 
          title: 'Profile',
          headerShown: true,
        }}
      />
    </Tab.Navigator>
  );
};

// Root navigator
const AppNavigator = () => {
  // We'll implement auth state checking later
  const isAuthenticated = false;
  
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName={isAuthenticated ? "Home" : "Login"}>
        {/* Auth screens */}
        <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
        <Stack.Screen name="Register" component={RegisterScreen} options={{ headerShown: false }} />
        
        {/* Main app screens */}
        <Stack.Screen 
          name="Home" 
          component={MainTabNavigator} 
          options={{ headerShown: false }}
        />
        
        {/* Course related screens */}
        <Stack.Screen name="CourseDetail" component={CourseDetailScreen} options={{ title: 'Course Details' }} />
        <Stack.Screen name="LessonView" component={LessonViewScreen} options={{ title: 'Lesson' }} />
        
        {/* Admin screens */}
        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} options={{ title: 'Admin Dashboard' }} />
        <Stack.Screen name="AdminCourseEdit" component={AdminCourseEditScreen} options={{ title: 'Edit Course' }} />
        <Stack.Screen name="AdminLessonEdit" component={AdminLessonEditScreen} options={{ title: 'Edit Lesson' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default AppNavigator;
