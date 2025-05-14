import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, ScrollView, ActivityIndicator, Alert, Dimensions } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { doc, getDoc, collection, query, orderBy, getDocs, updateDoc } from 'firebase/firestore';
import { WebView } from 'react-native-webview';
import { firestore } from '../config/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Lesson } from '../types';
import { getAuth } from 'firebase/auth';
import { TouchableOpacity } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

type LessonViewScreenRouteProp = RouteProp<RootStackParamList, 'LessonView'>;
type LessonViewScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'LessonView'>;

const LessonViewScreen = () => {
  const route = useRoute<LessonViewScreenRouteProp>();
  const navigation = useNavigation<LessonViewScreenNavigationProp>();
  const { courseId, lessonId } = route.params;
  
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [allLessons, setAllLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentLessonIndex, setCurrentLessonIndex] = useState(0);
  
  const auth = getAuth();
  const currentUser = auth.currentUser;
  
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  useEffect(() => {
    const fetchLessonData = async () => {
      try {
        // Fetch all lessons for the course to enable navigation between lessons
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
        
        setAllLessons(lessonsList);
        
        // Find the current lesson in the list
        const currentIndex = lessonsList.findIndex(l => l.id === lessonId);
        if (currentIndex !== -1) {
          setCurrentLessonIndex(currentIndex);
          setLesson(lessonsList[currentIndex]);
        } else {
          // If the specific lesson isn't found, fetch it directly
          const lessonDoc = await getDoc(doc(firestore, 'courses', courseId, 'lessons', lessonId));
          if (lessonDoc.exists()) {
            setLesson({ 
              id: lessonDoc.id, 
              courseId,
              ...lessonDoc.data() 
            } as Lesson);
          } else {
            Alert.alert('Error', 'Lesson not found');
            navigation.goBack();
            return;
          }
        }
        
        // Update user's last accessed lesson
        if (currentUser) {
          await updateDoc(doc(firestore, 'users', currentUser.uid), {
            lastAccessedLessonId: lessonId
          });
        }
        
      } catch (error) {
        console.error('Error fetching lesson data:', error);
        Alert.alert('Error', 'Failed to load lesson content');
      } finally {
        setLoading(false);
      }
    };
    
    fetchLessonData();
  }, [courseId, lessonId]);

  const navigateToPreviousLesson = () => {
    if (currentLessonIndex > 0) {
      const previousLesson = allLessons[currentLessonIndex - 1];
      navigation.replace('LessonView', { courseId, lessonId: previousLesson.id });
    }
  };

  const navigateToNextLesson = () => {
    if (currentLessonIndex < allLessons.length - 1) {
      const nextLesson = allLessons[currentLessonIndex + 1];
      navigation.replace('LessonView', { courseId, lessonId: nextLesson.id });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4630EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContainer}>
        <Text style={styles.lessonTitle}>{lesson?.title}</Text>
        
        {lesson?.description && (
          <Text style={styles.lessonDescription}>{lesson.description}</Text>
        )}
        
        {lesson?.videoUrl && (
          <View style={styles.videoContainer}>
            <WebView
              source={{ uri: lesson.videoUrl }}
              style={styles.video}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              allowsFullscreenVideo={true}
              mediaPlaybackRequiresUserAction={false}
            />
          </View>
        )}
        
        {lesson?.documentUrl && (
          <View style={styles.documentContainer}>
            <WebView
              source={{ uri: lesson.documentUrl }}
              style={[styles.document, { height: screenHeight * 0.7 }]}
            />
          </View>
        )}
        
        <View style={styles.navigationContainer}>
          <TouchableOpacity
            style={[
              styles.navButton,
              currentLessonIndex === 0 ? styles.disabledButton : null
            ]}
            onPress={navigateToPreviousLesson}
            disabled={currentLessonIndex === 0}
          >
            <Ionicons name="arrow-back" size={20} color={currentLessonIndex === 0 ? "#999" : "#fff"} />
            <Text style={styles.navButtonText}>Previous Lesson</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.navButton,
              currentLessonIndex === allLessons.length - 1 ? styles.disabledButton : null
            ]}
            onPress={navigateToNextLesson}
            disabled={currentLessonIndex === allLessons.length - 1}
          >
            <Text style={styles.navButtonText}>Next Lesson</Text>
            <Ionicons name="arrow-forward" size={20} color={currentLessonIndex === allLessons.length - 1 ? "#999" : "#fff"} />
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollContainer: {
    padding: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lessonTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  lessonDescription: {
    fontSize: 16,
    lineHeight: 24,
    color: '#444',
    marginBottom: 20,
  },
  videoContainer: {
    marginVertical: 20,
    height: 220,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  video: {
    flex: 1,
  },
  documentContainer: {
    marginVertical: 20,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ddd',
  },
  document: {
    width: '100%',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 30,
    marginBottom: 20,
  },
  navButton: {
    backgroundColor: '#4630EB',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 0.48,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  navButtonText: {
    color: '#fff',
    fontSize: 14,
    marginHorizontal: 5,
    fontWeight: '500',
  },
});

export default LessonViewScreen;
