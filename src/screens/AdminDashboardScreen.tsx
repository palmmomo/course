import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, FlatList, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { collection, getDocs, query, orderBy, doc, deleteDoc } from 'firebase/firestore';
import { firestore } from '../config/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Course } from '../types';
import { Ionicons } from '@expo/vector-icons';

type AdminDashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminDashboard'>;

const AdminDashboardScreen = () => {
  const navigation = useNavigation<AdminDashboardScreenNavigationProp>();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      const coursesQuery = query(
        collection(firestore, 'courses'),
        orderBy('createdAt', 'desc')
      );
      
      const coursesSnapshot = await getDocs(coursesQuery);
      const coursesList: Course[] = [];
      
      coursesSnapshot.forEach((doc) => {
        coursesList.push({ 
          id: doc.id, 
          ...doc.data() 
        } as Course);
      });
      
      setCourses(coursesList);
    } catch (error) {
      console.error('Error fetching courses:', error);
      Alert.alert('Error', 'Failed to load courses');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this course? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, 'courses', courseId));
              // Refresh course list
              fetchCourses();
              Alert.alert('Success', 'Course deleted successfully');
            } catch (error) {
              console.error('Error deleting course:', error);
              Alert.alert('Error', 'Failed to delete course');
            }
          }
        }
      ]
    );
  };

  const renderCourseItem = ({ item }: { item: Course }) => (
    <View style={styles.courseItem}>
      <View style={styles.courseInfo}>
        <Text style={styles.courseTitle} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.courseLevel}>{item.level}</Text>
      </View>
      <View style={styles.actionButtons}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => navigation.navigate('AdminCourseEdit', { courseId: item.id })}
        >
          <Ionicons name="create-outline" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteCourse(item.id)}
        >
          <Ionicons name="trash-outline" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Course Management</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => navigation.navigate('AdminCourseEdit')}
        >
          <Ionicons name="add" size={24} color="#fff" />
          <Text style={styles.addButtonText}>Add Course</Text>
        </TouchableOpacity>
      </View>
      
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4630EB" />
        </View>
      ) : courses.length > 0 ? (
        <FlatList
          data={courses}
          renderItem={renderCourseItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.courseList}
        />
      ) : (
        <View style={styles.emptyCourseContainer}>
          <Ionicons name="book-outline" size={60} color="#ccc" />
          <Text style={styles.emptyCourseText}>No courses available</Text>
          <Text style={styles.emptyCourseSubText}>
            Start by adding your first course using the button above
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  addButton: {
    backgroundColor: '#4630EB',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  courseList: {
    padding: 15,
  },
  courseItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  courseInfo: {
    flex: 1,
    marginRight: 10,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
    color: '#333',
  },
  courseLevel: {
    fontSize: 14,
    color: '#666',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#4630EB',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCourseContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  emptyCourseText: {
    fontSize: 18,
    fontWeight: '500',
    color: '#666',
    marginTop: 15,
    marginBottom: 8,
  },
  emptyCourseSubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
});

export default AdminDashboardScreen;
