import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, RefreshControl, Alert, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Course } from '../types';
import { getAllCourses } from '../services/courseService';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

const HomeScreen = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [filteredCourses, setFilteredCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchCourses = async () => {
    try {
      setLoading(true);
      
      let coursesList: Course[] = [];
      
      try {
        // ดึงข้อมูลจาก collection 'course'
        const coursesQuery = query(
          collection(firestore, 'course')
        );
        
        const coursesSnapshot = await getDocs(coursesQuery);
        
        coursesSnapshot.forEach((doc) => {
          // ปรับโครงสร้างข้อมูลให้ตรงกับที่มีใน Firestore
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
            updatedAt: data.updatedAt || Date.now()
          } as Course);
        });
      } catch (firestoreError) {
        console.error('Firebase access error:', firestoreError);
        // แสดงข้อความว่ามีปัญหาเรื่องการเข้าถึงข้อมูล
        Alert.alert(
          'ไม่สามารถเข้าถึงข้อมูลได้', 
          'โปรดตรวจสอบการตั้งค่า Security Rules ใน Firebase หรือลองเข้าสู่ระบบก่อน'
        );
      }
      
      // ถ้าไม่มีข้อมูลหรือเข้าถึงไม่ได้ ให้แสดงข้อมูลตัวอย่าง
      if (coursesList.length === 0) {
        coursesList = [
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
          {
            id: '2',
            name: 'React Native Development',
            description: 'เรียนรู้การพัฒนาแอปพลิเคชันบนมือถือด้วย React Native ตั้งแต่พื้นฐานจนถึงขั้นสูง',
            level: 'Intermediate',
            duration: '45 days',
            pic: 'https://reactnative.dev/img/tiny_logo.png',
            recommendedFor: 'นักพัฒนาเว็บที่ต้องการต่อยอดสู่การพัฒนาแอปบนมือถือ',
            category: 'Programming',
            createdAt: Date.now() - 86400000,
            updatedAt: Date.now() - 86400000,
          },
          {
            id: '3',
            name: 'Firebase for Mobile Apps',
            description: 'สร้างและจัดการแอปพลิเคชันบนมือถือด้วย Firebase ครอบคลุมทั้ง Authentication, Firestore และ Storage',
            level: 'Beginner',
            duration: '21 days',
            pic: 'https://firebase.google.com/images/social.png',
            recommendedFor: 'นักพัฒนาที่ต้องการใช้งาน Firebase และบริการ Cloud ของ Google',
            category: 'Cloud',
            createdAt: Date.now() - 172800000,
            updatedAt: Date.now() - 172800000,
          },
        ];
      }
      
      setCourses(coursesList);
    } catch (error) {
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    // ไม่ต้องเรียก fetchCourses เพราะใช้ realtime listener แล้ว
    // แค่ตั้ง refreshing เป็น true และ listener จะจัดการเอง
    // จะมีการตั้งค่า refreshing เป็น false ในส่วน listener เมื่อได้ข้อมูลใหม่
  };
  
  // ฟังก์ชันสำหรับกรองคอร์สตาม keyword
  const filterCourses = (coursesToFilter: Course[], query: string) => {
    if (!query.trim()) {
      setFilteredCourses(coursesToFilter);
      return;
    }
    
    const lowercaseQuery = query.toLowerCase().trim();
    const filtered = coursesToFilter.filter(course => {
      return (
        (course.name || '').toLowerCase().includes(lowercaseQuery) || 
        (course.description || '').toLowerCase().includes(lowercaseQuery) || 
        (course.category || '').toLowerCase().includes(lowercaseQuery) ||
        (course.level || '').toLowerCase().includes(lowercaseQuery)
      );
    });
    
    setFilteredCourses(filtered);
  };
  
  // เมื่อ search query หรือรายการคอร์สเปลี่ยน ให้กรองใหม่
  useEffect(() => {
    filterCourses(courses, searchQuery);
  }, [searchQuery, courses]);

  useEffect(() => {
    // ใช้ Realtime Listeners แทน fetchCourses ธรรมดา
    try {
      setLoading(true);
      
      // สร้าง query สำหรับ collection 'course'
      const coursesQuery = query(
        collection(firestore, 'course')
      );
      
      // จัดการ realtime listener
      const unsubscribe = onSnapshot(coursesQuery, (snapshot) => {
        try {
          let coursesList: Course[] = [];
          
          snapshot.forEach((doc) => {
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
              updatedAt: data.updatedAt || Date.now()
            } as Course);
          });
          
          // เรียงคอร์สจากใหม่ไปเก่า
          coursesList.sort((a, b) => {
            return (b.createdAt || 0) - (a.createdAt || 0);
          });
          
          // ถ้าไม่มีข้อมูล ให้ใช้ข้อมูลตัวอย่าง
          if (coursesList.length === 0) {
            coursesList = [
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
              {
                id: '2',
                name: 'React Native Development',
                description: 'เรียนรู้การพัฒนาแอปพลิเคชันบนมือถือด้วย React Native ตั้งแต่พื้นฐานจนถึงขั้นสูง',
                level: 'Intermediate',
                duration: '45 days',
                pic: 'https://reactnative.dev/img/tiny_logo.png',
                recommendedFor: 'นักพัฒนาเว็บที่ต้องการต่อยอดสู่การพัฒนาแอปบนมือถือ',
                category: 'Programming',
                createdAt: Date.now() - 86400000,
                updatedAt: Date.now() - 86400000,
              },
              {
                id: '3',
                name: 'Firebase for Mobile Apps',
                description: 'สร้างและจัดการแอปพลิเคชันบนมือถือด้วย Firebase ครอบคลุมทั้ง Authentication, Firestore และ Storage',
                level: 'Beginner',
                duration: '21 days',
                pic: 'https://firebase.google.com/images/social.png',
                recommendedFor: 'นักพัฒนาที่ต้องการใช้งาน Firebase และบริการ Cloud ของ Google',
                category: 'Cloud',
                createdAt: Date.now() - 172800000,
                updatedAt: Date.now() - 172800000,
              },
            ];
          }
          
          setCourses(coursesList);
          // อัพเดทคอร์สที่กรองแล้วด้วย
          filterCourses(coursesList, searchQuery);
          setLoading(false);
          setRefreshing(false);
        } catch (error) {
          console.error('Error processing snapshot:', error);
          setLoading(false);
          setRefreshing(false);
        }
      }, (error) => {
        console.error('Realtime listener error:', error);
        Alert.alert(
          'ไม่สามารถเข้าถึงข้อมูลได้', 
          'โปรดตรวจสอบการตั้งค่า Security Rules ใน Firebase หรือลองเข้าสู่ระบบก่อน'
        );
        setLoading(false);
        setRefreshing(false);
      });
      
      // ยกเลิก listener เมื่อ component unmount
      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up realtime listener:', error);
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  const renderCourseItem = ({ item }: { item: Course }) => (
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
        <Text style={styles.courseTitle} numberOfLines={2}>{item.name}</Text>
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
  );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="ค้นหาคอร์ส..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
            <Ionicons name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        ) : null}
      </View>
      
      <View style={styles.headerContainer}>
        <Text style={styles.welcomeText}>Welcome to LateWork</Text>
        <Text style={styles.subtitleText}>Explore our courses</Text>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4630EB" />
        </View>
      ) : courses.length > 0 ? (
        <FlatList
          data={filteredCourses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
          numColumns={1}
          contentContainerStyle={styles.coursesList}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>ไม่พบคอร์สที่ตรงกับการค้นหา</Text>
              <TouchableOpacity 
                style={styles.browseButton}
                onPress={() => setSearchQuery('')}
              >
                <Text style={styles.browseButtonText}>แสดงทั้งหมด</Text>
              </TouchableOpacity>
            </View>
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#4630EB']}
            />
          }
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No courses available</Text>
          <TouchableOpacity 
            style={styles.refreshButton}
            onPress={fetchCourses}
          >
            <Text style={styles.refreshButtonText}>Refresh</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  browseButton: {
    backgroundColor: '#4630EB',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
    alignItems: 'center',
  },
  browseButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    margin: 16,
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  clearButton: {
    padding: 6,
  },
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  headerContainer: {
    padding: 20,
    backgroundColor: '#fff',
  },
  welcomeText: {
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
    width: '100%',
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
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginBottom: 15,
  },
  refreshButton: {
    backgroundColor: '#4630EB',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default HomeScreen;
