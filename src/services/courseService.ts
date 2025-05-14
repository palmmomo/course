import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../config/firebase';
import { Course, Lesson } from '../types';

// Get all courses
export const getAllCourses = async (): Promise<Course[]> => {
  try {
    const coursesQuery = query(collection(firestore, 'course'), orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(coursesQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Course));
  } catch (error) {
    console.error('Error fetching courses:', error);
    throw error;
  }
};

// Get course by ID
export const getCourseById = async (courseId: string): Promise<Course | null> => {
  try {
    const courseDoc = await getDoc(doc(firestore, 'course', courseId));
    if (courseDoc.exists()) {
      return { id: courseDoc.id, ...courseDoc.data() } as Course;
    }
    return null;
  } catch (error) {
    console.error('Error fetching course:', error);
    throw error;
  }
};

// Get lessons for a course
export const getCourseLessons = async (courseId: string): Promise<Lesson[]> => {
  try {
    const lessonsQuery = query(collection(firestore, 'course', courseId, 'lessons'), orderBy('order', 'asc'));
    const snapshot = await getDocs(lessonsQuery);
    return snapshot.docs.map((doc) => ({ id: doc.id, courseId, ...doc.data() } as Lesson));
  } catch (error) {
    console.error('Error fetching lessons:', error);
    throw error;
  }
};

// Get a specific lesson
export const getLessonById = async (courseId: string, lessonId: string): Promise<Lesson | null> => {
  try {
    const lessonDoc = await getDoc(doc(firestore, 'course', courseId, 'lessons', lessonId));
    if (lessonDoc.exists()) {
      return { id: lessonDoc.id, courseId, ...lessonDoc.data() } as Lesson;
    }
    return null;
  } catch (error) {
    console.error('Error fetching lesson:', error);
    throw error;
  }
};

// Get enrolled courses for current user
export const getEnrolledCourses = async (): Promise<Course[]> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      return [];
    }

    const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
    const userData = userDoc.data();
    const enrolledCourseIds = userData?.enrolledCourses || [];

    if (enrolledCourseIds.length === 0) {
      return [];
    }

    const courses: Course[] = [];
    for (const courseId of enrolledCourseIds) {
      const courseDoc = await getDoc(doc(firestore, 'course', courseId));
      if (courseDoc.exists()) {
        courses.push({ id: courseDoc.id, ...courseDoc.data() } as Course);
      }
    }

    return courses;
  } catch (error) {
    console.error('Error fetching enrolled courses:', error);
    throw error;
  }
};

// Enroll current user in a course
export const enrollInCourse = async (courseId: string): Promise<void> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    await updateDoc(doc(firestore, 'users', currentUser.uid), {
      enrolledCourses: arrayUnion(courseId),
    });
  } catch (error) {
    console.error('Error enrolling in course:', error);
    throw error;
  }
};

// Unenroll current user from a course
export const unenrollFromCourse = async (courseId: string): Promise<void> => {
  try {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    const userRef = doc(firestore, 'users', currentUser.uid);
    const userDoc = await getDoc(userRef);

    if (!userDoc.exists()) {
      throw new Error('User document not found');
    }

    const userData = userDoc.data();
    const enrolledCourses = userData.enrolledCourses || [];

    if (!enrolledCourses.includes(courseId)) {
      throw new Error('Course not found in enrolled courses');
    }

    const updatedCourses = enrolledCourses.filter((id: string) => id !== courseId);

    await updateDoc(userRef, {
      enrolledCourses: updatedCourses,
    });

    console.log('Unenrolled from course successfully');
  } catch (error) {
    console.error('Error unenrolling from course:', error);
    throw error;
  }
};

// Admin operations
export const createCourse = async (courseData: Omit<Course, 'id'>): Promise<string> => {
  try {
    const courseRef = await addDoc(collection(firestore, 'course'), {
      ...courseData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return courseRef.id;
  } catch (error) {
    console.error('Error creating course:', error);
    throw error;
  }
};

export const updateCourse = async (courseId: string, courseData: Partial<Course>): Promise<void> => {
  try {
    await updateDoc(doc(firestore, 'course', courseId), {
      ...courseData,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error updating course:', error);
    throw error;
  }
};

export const deleteCourse = async (courseId: string): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, 'course', courseId));
  } catch (error) {
    console.error('Error deleting course:', error);
    throw error;
  }
};

export const createLesson = async (courseId: string, lessonData: Omit<Lesson, 'id' | 'courseId'>): Promise<string> => {
  try {
    const lessonRef = await addDoc(collection(firestore, 'course', courseId, 'lessons'), {
      ...lessonData,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return lessonRef.id;
  } catch (error) {
    console.error('Error creating lesson:', error);
    throw error;
  }
};

export const updateLesson = async (courseId: string, lessonId: string, lessonData: Partial<Lesson>): Promise<void> => {
  try {
    await updateDoc(doc(firestore, 'course', courseId, 'lessons', lessonId), {
      ...lessonData,
      updatedAt: Date.now(),
    });
  } catch (error) {
    console.error('Error updating lesson:', error);
    throw error;
  }
};

export const deleteLesson = async (courseId: string, lessonId: string): Promise<void> => {
  try {
    await deleteDoc(doc(firestore, 'course', courseId, 'lessons', lessonId));
  } catch (error) {
    console.error('Error deleting lesson:', error);
    throw error;
  }
};