// Type definitions for the app

// User types
export interface User {
  id: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  role: 'admin' | 'user';
  enrolledCourses?: string[];
}

// Course types
export interface Course {
  id: string;
  name: string;
  description: string;
  duration: string;
  level: string;
  pic: string;
  recommendedFor?: string;
  category?: string;
  createdAt: number;
  updatedAt: number;
}

// Lesson types
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  videoUrl?: string;
  documentUrl?: string;
  order: number;
}

// Enrollment types
export interface Enrollment {
  id: string;
  userId: string;
  courseId: string;
  enrolledAt: number;
  progress: number; // Percentage completed
  completed: boolean;
  lastAccessedLessonId?: string;
}

// Navigation types
export type RootStackParamList = {
  Login: undefined;
  Register: undefined;
  Home: undefined;
  MyCourses: undefined;
  CourseDetail: { courseId: string };
  LessonView: { courseId: string; lessonId: string };
  Profile: undefined;
  AdminDashboard: undefined;
  AdminCourseEdit: { courseId?: string };
  AdminLessonEdit: { courseId: string; lessonId?: string };
};
