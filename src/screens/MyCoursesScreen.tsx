import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, where, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { firestore } from '../config/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Course } from '../types';
import { unenrollFromCourse } from '../services/courseService';

type MyCoursesScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'MyCourses'>;

const MyCoursesScreen = () => {
  const navigation = useNavigation<MyCoursesScreenNavigationProp>();
  const [enrolledCourses, setEnrolledCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const auth = getAuth();

  const setupRealtimeListeners = () => {
    try {
      setLoading(true);

      const currentUser = auth.currentUser;
      if (!currentUser) {
        setLoading(false);
        setRefreshing(false);
        return () => {};
      }

      const userDocRef = doc(firestore, 'users', currentUser.uid);
      const unsubscribeUserListener = onSnapshot(userDocRef, async (userDocSnap) => {
        try {
          if (userDocSnap.exists()) {
            const userData = userDocSnap.data();
            const enrolledCourseIds = userData?.enrolledCourses || [];

            if (enrolledCourseIds.length === 0) {
              setEnrolledCourses([]);
              setLoading(false);
              setRefreshing(false);
              return;
            }

            const coursesQuery = query(
              collection(firestore, 'course'),
              where('__name__', 'in', enrolledCourseIds)
            );

            onSnapshot(coursesQuery, (coursesSnapshot) => {
              try {
                let coursesList: Course[] = [];

                coursesSnapshot.forEach((doc) => {
                  const data = doc.data();
                  coursesList.push({
                    id: doc.id,
                    name: data.name || '',
                    description: data.description || 'รายละเอียดคอร์ส',
                    level: data.level || 'Beginner',
                    duration: data.duration || '',
                    pic: data.pic || 'https://via.placeholder.com/150',
                    recommendedFor: data.recommendedfor || '',
                    category: data.category || 'General',
                    createdAt: data.createdAt || Date.now(),
                    updatedAt: data.updatedAt || Date.now(),
                  } as Course);
                });

                if (coursesList.length === 0 && enrolledCourseIds.length > 0) {
                  setEnrolledCourses([
                    {
                      id: '1',
                      name: 'Certified Ethical Hacker (CEH)',
                      description: 'หลักสูตรฝึกอบรมด้านการแฮกอย่างมีจริยธรรม เรียนรู้เทคนิคและเครื่องมือที่ใช้โดยแฮกเกอร์',
                      level: 'Advanced',
                      duration: '30 days',
                      pic: 'https://cicra.edu.lk/library/programmes/featured_images/hq720.jpg',
                      recommendedFor: 'เหมาะกับผู้ที่ต้องการเข้าสู่วงการแฮ็กอย่างถูกกฎหมายและสอบ Cert',
                      category: 'Security',
                      createdAt: Date.now(),
                      updatedAt: Date.now(),
                    },
                  ]);
                } else {
                  setEnrolledCourses(coursesList);
                }
              } catch (snapError) {
                console.error('Error processing courses snapshot:', snapError);
              } finally {
                setLoading(false);
                setRefreshing(false);
              }
            }, (error) => {
              console.error('Error in courses listener:', error);
              Alert.alert('ไม่สามารถเข้าถึงข้อมูลคอร์ส', 'โปรดตรวจสอบการตั้งค่า Security Rules ใน Firebase');
              setLoading(false);
              setRefreshing(false);
            });
          } else {
            setEnrolledCourses([]);
            setLoading(false);
            setRefreshing(false);
          }
        } catch (userError) {
          console.error('Error processing user document:', userError);
          setLoading(false);
          setRefreshing(false);
        }
      }, (error) => {
        console.error('Error in user document listener:', error);
        Alert.alert('ไม่สามารถเข้าถึงข้อมูลผู้ใช้', 'โปรดตรวจสอบการตั้งค่า Security Rules ใน Firebase หรือลองเข้าสู่ระบบอีกครั้ง');
        setLoading(false);
        setRefreshing(false);
      });

      return unsubscribeUserListener;
    } catch (error) {
      console.error('Error setting up realtime listeners:', error);
      setLoading(false);
      setRefreshing(false);
      return () => {};
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  useEffect(() => {
    const unsubscribe = setupRealtimeListeners();
    return () => unsubscribe();
  }, []);

  const handleUnenroll = async (courseId: string, courseName: string) => {
    // ใช้ Alert.alert สำหรับทุกแพลตฟอร์มเพื่อหลีกเลี่ยงปัญหา runtime
    Alert.alert(
      'ยืนยันการยกเลิก',
      `คุณต้องการยกเลิกการลงทะเบียนคอร์ส "${courseName}" ใช่หรือไม่?`,
      [
        { text: 'ยกเลิก', style: 'cancel' },
        {
          text: 'ยืนยัน',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              await unenrollFromCourse(courseId);
              Alert.alert('สำเร็จ', 'ยกเลิกการลงทะเบียนเรียบร้อยแล้ว');
            } catch (error) {
              console.error('Error unenrolling from course:', error);
              Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถยกเลิกการลงทะเบียนได้ กรุณาลองใหม่');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <View style={styles.courseItemContainer}>
      <View style={styles.courseCardWrapper}>
        <TouchableOpacity
          style={styles.courseCard}
          onPress={() => navigation.navigate('CourseDetail', { courseId: item.id })}
        >
          <Image
            source={{ uri: item.pic || 'https://via.placeholder.com/150' }}
            style={styles.courseImage}
            resizeMode="cover"
          />
          <View style={styles.courseInfo}>
            <Text style={styles.courseTitle} numberOfLines={2}>
              {item.name}
            </Text>
            <View style={styles.courseMetaData}>
              <View style={styles.levelBadge}>
                <Text style={styles.levelText}>{item.level}</Text>
              </View>
              <Text style={styles.duration}>{item.duration}</Text>
            </View>
            <Text style={styles.courseDescription} numberOfLines={2}>
              {item.description}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.removeButtonContainer}>
        <TouchableOpacity
          style={styles.removeButton}
          onPress={() => handleUnenroll(item.id, item.name)}
          activeOpacity={0.5}
        >
          <Ionicons name="trash-outline" size={28} color="white" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.titleText}>My Courses</Text>
        <Text style={styles.subtitleText}>Continue your learning journey</Text>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4630EB" />
        </View>
      ) : enrolledCourses.length > 0 ? (
        <FlatList
          data={enrolledCourses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.coursesList}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={['#4630EB']} />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't enrolled in any courses yet</Text>
          <TouchableOpacity style={styles.browseButton} onPress={() => navigation.navigate('Home')}>
            <Text style={styles.browseButtonText}>Browse Courses</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  courseItemContainer: {
    position: 'relative',
    marginBottom: 16,
    flexDirection: 'row',
  },
  courseCardWrapper: {
    flex: 1,
    position: 'relative',
  },
  removeButtonContainer: {
    width: 60,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 10,
  },
  removeButton: {
    width: 50,
    height: 50,
    backgroundColor: '#ff3b30',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    zIndex: 999,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
  },
  subtitleText: {
    fontSize: 16,
    color: '#666',
    marginTop: 5,
  },
  coursesList: {
    padding: 15,
  },
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 15,
    overflow: 'hidden',
  },
  courseImage: {
    width: '100',
    height: 150,
  },
  courseInfo: {
    padding: 15,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  courseMetaData: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  levelBadge: {
    backgroundColor: '#e0e7ff',
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 4,
  },
  levelText: {
    fontSize: 12,
    color: '#4630EB',
    fontWeight: '500',
  },
  duration: {
    fontSize: 13,
    color: '#666',
  },
  courseDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
    textAlign: 'center',
  },
  browseButton: {
    backgroundColor: '#4630EB',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  browseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});

export default MyCoursesScreen;