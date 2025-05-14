import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, Image, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { doc, getDoc, updateDoc, arrayUnion, collection, query, orderBy, getDocs } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../config/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Course, Lesson } from '../types';
import { Ionicons } from '@expo/vector-icons';

type CourseDetailScreenRouteProp = RouteProp<RootStackParamList, 'CourseDetail'>;
type CourseDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'CourseDetail'>;

const CourseDetailScreen = () => {
  const route = useRoute<CourseDetailScreenRouteProp>();
  const navigation = useNavigation<CourseDetailScreenNavigationProp>();
  const { courseId } = route.params;
  
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  
  const auth = getAuth();
  const currentUser = auth.currentUser;

  useEffect(() => {
    const fetchCourseAndLessons = async () => {
      try {
        // Fetch course details
        const courseDoc = await getDoc(doc(firestore, 'courses', courseId));
        if (!courseDoc.exists()) {
          Alert.alert('Error', 'Course not found');
          navigation.goBack();
          return;
        }
        
        setCourse({ id: courseDoc.id, ...courseDoc.data() } as Course);
        
        // Fetch course lessons
        const lessonsQuery = query(
          collection(firestore, 'courses', courseId, 'lessons'),
          orderBy('order', 'asc')
        );
        
        const lessonsSnapshot = await getDocs(lessonsQuery);
        const lessonsList: Lesson[] = [];
        
        lessonsSnapshot.forEach((doc) => {
          lessonsList.push({ 
            id: doc.id, 
            courseId,
            ...doc.data() 
          } as Lesson);
        });
        
        setLessons(lessonsList);
        
        // Check if user is enrolled
        if (currentUser) {
          const userDoc = await getDoc(doc(firestore, 'users', currentUser.uid));
          const userData = userDoc.data();
          setIsEnrolled(userData?.enrolledCourses?.includes(courseId) || false);
        }
        
      } catch (error) {
        console.error('Error fetching course details:', error);
        Alert.alert('Error', 'Failed to load course details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchCourseAndLessons();
  }, [courseId]);

  const handleEnroll = async () => {
    if (!currentUser) {
      navigation.navigate('Login');
      return;
    }
    
    try {
      setEnrolling(true);
      
      // Add course to user's enrolled courses
      await updateDoc(doc(firestore, 'users', currentUser.uid), {
        enrolledCourses: arrayUnion(courseId)
      });
      
      setIsEnrolled(true);
      Alert.alert('Success', 'You have successfully enrolled in this course');
    } catch (error) {
      console.error('Error enrolling in course:', error);
      Alert.alert('Error', 'Failed to enroll in course');
    } finally {
      setEnrolling(false);
    }
  };

  const navigateToLesson = (lessonId: string) => {
    navigation.navigate('LessonView', { courseId, lessonId });
  };
  
  const navigateToHome = () => {
    navigation.navigate('Home');
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4630EB" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      {course?.pic && (
        <Image 
          source={{ uri: course.pic }} 
          style={styles.courseImage} 
          resizeMode="cover" 
        />
      )}
      
      <View style={styles.courseInfoContainer}>
        <Text style={styles.courseTitle}>{course?.name}</Text>
        
        <View style={styles.metaContainer}>
          <View style={styles.levelBadge}>
            <Text style={styles.levelText}>{course?.level}</Text>
          </View>
          <Text style={styles.duration}>{course?.duration}</Text>
        </View>
        
        <Text style={styles.sectionTitle}>About this course</Text>
        <Text style={styles.courseDescription}>{course?.description}</Text>
        
        {course?.recommendedFor && (
          <>
            <Text style={styles.sectionTitle}>Recommended for</Text>
            <Text style={styles.courseDescription}>{course.recommendedFor}</Text>
          </>
        )}
      </View>
      
      <View style={styles.lessonsContainer}>
        <Text style={styles.sectionTitle}>Course Content</Text>
        
        {lessons.length > 0 ? (
          lessons.map((lesson, index) => (
            <TouchableOpacity
              key={lesson.id}
              style={styles.lessonItem}
              onPress={() => isEnrolled ? navigateToLesson(lesson.id) : Alert.alert('Enrollment Required', 'Please enroll in the course to access lessons')}
            >
              <View style={styles.lessonIndex}>
                <Text style={styles.lessonIndexText}>{index + 1}</Text>
              </View>
              <View style={styles.lessonContent}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                {lesson.description && (
                  <Text style={styles.lessonDescription} numberOfLines={2}>
                    {lesson.description}
                  </Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={20} color="#999" />
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.noLessonsText}>No lessons available for this course yet</Text>
        )}
      </View>
      
      <View style={styles.actionContainer}>
        {isEnrolled ? (
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={() => navigateToHome()}
          >
            <Text style={styles.buttonText}>Continue Learning</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.enrollButton}
            onPress={handleEnroll}
            disabled={enrolling}
          >
            <Text style={styles.buttonText}>
              {enrolling ? 'Enrolling...' : 'Enroll Now'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseImage: {
    width: '100%',
    height: 220,
  },
  courseInfoContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  courseTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  metaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  levelBadge: {
    backgroundColor: '#e0e7ff',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 4,
    marginRight: 15,
  },
  levelText: {
    fontSize: 12,
    color: '#4630EB',
    fontWeight: '500',
  },
  duration: {
    fontSize: 14,
    color: '#666',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
    color: '#333',
  },
  courseDescription: {
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  lessonsContainer: {
    marginTop: 15,
    backgroundColor: '#fff',
    padding: 20,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  lessonIndex: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#e0e7ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  lessonIndexText: {
    color: '#4630EB',
    fontWeight: 'bold',
  },
  lessonContent: {
    flex: 1,
  },
  lessonTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  lessonDescription: {
    fontSize: 14,
    color: '#666',
  },
  noLessonsText: {
    fontSize: 15,
    color: '#666',
    fontStyle: 'italic',
    textAlign: 'center',
    marginVertical: 20,
  },
  actionContainer: {
    padding: 20,
  },
  enrollButton: {
    backgroundColor: '#4630EB',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  continueButton: {
    backgroundColor: '#28a745',
    paddingVertical: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CourseDetailScreen;
