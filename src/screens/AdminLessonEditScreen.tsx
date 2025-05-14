import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator, FlatList } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { doc, getDoc, setDoc, addDoc, collection, getDocs, query, orderBy, deleteDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore } from '../config/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Lesson } from '../types';
import { Ionicons } from '@expo/vector-icons';

type AdminLessonEditScreenRouteProp = RouteProp<RootStackParamList, 'AdminLessonEdit'>;
type AdminLessonEditScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminLessonEdit'>;

const AdminLessonEditScreen = () => {
  const navigation = useNavigation<AdminLessonEditScreenNavigationProp>();
  const route = useRoute<AdminLessonEditScreenRouteProp>();
  const { courseId, lessonId } = route.params;
  const isEditing = !!lessonId;
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [order, setOrder] = useState('1');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  
  const [loading, setLoading] = useState(isEditing);
  const [listLoading, setListLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchLessons();
    if (isEditing) {
      fetchLessonData();
    }
  }, [isEditing, courseId, lessonId]);

  const fetchLessons = async () => {
    try {
      setListLoading(true);
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
    } catch (error) {
      console.error('Error fetching lessons:', error);
      Alert.alert('Error', 'Failed to load lessons');
    } finally {
      setListLoading(false);
    }
  };

  const fetchLessonData = async () => {
    try {
      const lessonDoc = await getDoc(doc(firestore, 'courses', courseId, 'lessons', lessonId));
      if (lessonDoc.exists()) {
        const lessonData = lessonDoc.data() as Lesson;
        setTitle(lessonData.title);
        setDescription(lessonData.description || '');
        setVideoUrl(lessonData.videoUrl || '');
        setDocumentUrl(lessonData.documentUrl || '');
        setOrder(lessonData.order.toString());
      } else {
        Alert.alert('Error', 'Lesson not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching lesson data:', error);
      Alert.alert('Error', 'Failed to load lesson data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Lesson title is required');
      return false;
    }
    
    const orderNum = parseInt(order);
    if (isNaN(orderNum) || orderNum < 1) {
      Alert.alert('Error', 'Order must be a positive number');
      return false;
    }
    
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      const lessonData = {
        title,
        description: description || null,
        videoUrl: videoUrl || null,
        documentUrl: documentUrl || null,
        order: parseInt(order),
        updatedAt: Date.now(),
      };
      
      if (isEditing) {
        // Update existing lesson
        await setDoc(doc(firestore, 'courses', courseId, 'lessons', lessonId), {
          ...lessonData,
        }, { merge: true });
        
        Alert.alert('Success', 'Lesson updated successfully');
      } else {
        // Create new lesson
        const newLessonData = {
          ...lessonData,
          createdAt: Date.now(),
        };
        
        await addDoc(collection(firestore, 'courses', courseId, 'lessons'), newLessonData);
        Alert.alert('Success', 'Lesson created successfully');
      }
      
      // Reset form and refresh lesson list
      if (!isEditing) {
        setTitle('');
        setDescription('');
        setVideoUrl('');
        setDocumentUrl('');
        
        // Set next order number
        const nextOrder = lessons.length > 0 
          ? Math.max(...lessons.map(l => l.order)) + 1 
          : 1;
        setOrder(nextOrder.toString());
      }
      
      fetchLessons();
    } catch (error) {
      console.error('Error saving lesson:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} lesson`);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteLesson = async (lessonId: string) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this lesson? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(firestore, 'courses', courseId, 'lessons', lessonId));
              fetchLessons();
              Alert.alert('Success', 'Lesson deleted successfully');
            } catch (error) {
              console.error('Error deleting lesson:', error);
              Alert.alert('Error', 'Failed to delete lesson');
            }
          }
        }
      ]
    );
  };

  const editLesson = (lesson: Lesson) => {
    navigation.navigate('AdminLessonEdit', { courseId, lessonId: lesson.id });
  };

  const renderLessonItem = ({ item }: { item: Lesson }) => (
    <View style={styles.lessonItem}>
      <View style={styles.lessonIndex}>
        <Text style={styles.lessonIndexText}>{item.order}</Text>
      </View>
      <View style={styles.lessonContent}>
        <Text style={styles.lessonTitle}>{item.title}</Text>
      </View>
      <View style={styles.lessonActions}>
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => editLesson(item)}
        >
          <Ionicons name="create-outline" size={18} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={() => handleDeleteLesson(item.id)}
        >
          <Ionicons name="trash-outline" size={18} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4630EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView style={styles.formSection}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {isEditing ? 'Edit Lesson' : 'Add New Lesson'}
          </Text>
        </View>
        
        <View style={styles.formContainer}>
          <Text style={styles.label}>Lesson Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter lesson title"
          />
          
          <Text style={styles.label}>Description (Optional)</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="Enter lesson description"
            multiline
          />
          
          <Text style={styles.label}>Video URL (Optional)</Text>
          <TextInput
            style={styles.input}
            value={videoUrl}
            onChangeText={setVideoUrl}
            placeholder="Enter YouTube or Vimeo URL"
          />
          
          <Text style={styles.label}>Document URL (Optional)</Text>
          <TextInput
            style={styles.input}
            value={documentUrl}
            onChangeText={setDocumentUrl}
            placeholder="Enter document URL"
          />
          
          <Text style={styles.label}>Lesson Order</Text>
          <TextInput
            style={styles.input}
            value={order}
            onChangeText={setOrder}
            placeholder="Enter lesson order (number)"
            keyboardType="numeric"
          />
          
          <TouchableOpacity 
            style={styles.saveButton}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={styles.saveButtonText}>
              {saving ? 'Saving...' : isEditing ? 'Update Lesson' : 'Add Lesson'}
            </Text>
          </TouchableOpacity>
          
          {isEditing && (
            <TouchableOpacity 
              style={styles.newLessonButton}
              onPress={() => navigation.navigate('AdminLessonEdit', { courseId })}
            >
              <Text style={styles.newLessonButtonText}>Create New Lesson</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
      
      <View style={styles.lessonListSection}>
        <Text style={styles.lessonListTitle}>Course Lessons</Text>
        
        {listLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#4630EB" />
          </View>
        ) : lessons.length > 0 ? (
          <FlatList
            data={lessons}
            renderItem={renderLessonItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.lessonsList}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No lessons added yet</Text>
          </View>
        )}
      </View>
    </View>
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
  formSection: {
    flex: 1,
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
  },
  formContainer: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  saveButton: {
    backgroundColor: '#4630EB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  newLessonButton: {
    backgroundColor: '#28a745',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  newLessonButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lessonListSection: {
    flex: 1,
    backgroundColor: '#fff',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  lessonListTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 20,
    marginBottom: 15,
    color: '#333',
  },
  lessonsList: {
    paddingHorizontal: 20,
  },
  lessonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
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
    color: '#333',
  },
  lessonActions: {
    flexDirection: 'row',
  },
  editButton: {
    backgroundColor: '#4630EB',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  deleteButton: {
    backgroundColor: '#ff3b30',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    fontStyle: 'italic',
  },
});

export default AdminLessonEditScreen;
