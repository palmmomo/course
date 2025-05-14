import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { doc, getDoc, setDoc, addDoc, collection } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { firestore } from '../config/firebase';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList, Course } from '../types';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';

type AdminCourseEditScreenRouteProp = RouteProp<RootStackParamList, 'AdminCourseEdit'>;
type AdminCourseEditScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AdminCourseEdit'>;

const AdminCourseEditScreen = () => {
  const navigation = useNavigation<AdminCourseEditScreenNavigationProp>();
  const route = useRoute<AdminCourseEditScreenRouteProp>();
  const courseId = route.params?.courseId;
  const isEditing = !!courseId;
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [level, setLevel] = useState('');
  const [duration, setDuration] = useState('');
  const [category, setCategory] = useState('');
  const [recommendedFor, setRecommendedFor] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      fetchCourseData();
    }
  }, [isEditing, courseId]);

  const fetchCourseData = async () => {
    try {
      const courseDoc = await getDoc(doc(firestore, 'courses', courseId));
      if (courseDoc.exists()) {
        const courseData = courseDoc.data() as Course;
        setName(courseData.name);
        setDescription(courseData.description);
        setLevel(courseData.level);
        setDuration(courseData.duration);
        setCategory(courseData.category || '');
        setRecommendedFor(courseData.recommendedFor || '');
        setImageUri(courseData.pic);
      } else {
        Alert.alert('Error', 'Course not found');
        navigation.goBack();
      }
    } catch (error) {
      console.error('Error fetching course data:', error);
      Alert.alert('Error', 'Failed to load course data');
    } finally {
      setLoading(false);
    }
  };

  const selectImage = async () => {
    try {
      // Request media library permissions
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Permission to access media library is required');
        return;
      }

      // Launch image picker
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled) {
        setImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  const uploadImage = async (): Promise<string | null> => {
    if (!imageUri) return null;
    
    try {
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const filename = `courses/${Date.now()}.jpg`;
      
      const storage = getStorage();
      const storageRef = ref(storage, filename);
      
      await uploadBytes(storageRef, blob);
      const downloadURL = await getDownloadURL(storageRef);
      
      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  };

  const validateForm = () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Course name is required');
      return false;
    }
    if (!description.trim()) {
      Alert.alert('Error', 'Course description is required');
      return false;
    }
    if (!level.trim()) {
      Alert.alert('Error', 'Course level is required');
      return false;
    }
    if (!duration.trim()) {
      Alert.alert('Error', 'Course duration is required');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    
    try {
      setSaving(true);
      
      // Upload image if selected
      let imageUrl = imageUri;
      if (imageUri && !imageUri.startsWith('http')) {
        imageUrl = await uploadImage();
      }
      
      const courseData = {
        name,
        description,
        level,
        duration,
        category: category || null,
        recommendedFor: recommendedFor || null,
        pic: imageUrl,
        updatedAt: Date.now(),
      };
      
      if (isEditing) {
        // Update existing course
        await setDoc(doc(firestore, 'courses', courseId), {
          ...courseData,
        }, { merge: true });
        
        Alert.alert('Success', 'Course updated successfully');
      } else {
        // Create new course
        const newCourseData = {
          ...courseData,
          createdAt: Date.now(),
        };
        
        await addDoc(collection(firestore, 'courses'), newCourseData);
        Alert.alert('Success', 'Course created successfully');
      }
      
      navigation.goBack();
    } catch (error) {
      console.error('Error saving course:', error);
      Alert.alert('Error', `Failed to ${isEditing ? 'update' : 'create'} course`);
    } finally {
      setSaving(false);
    }
  };

  const navigateToLessons = () => {
    if (!courseId) return;
    navigation.navigate('AdminLessonEdit', { courseId });
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
      <View style={styles.header}>
        <Text style={styles.headerTitle}>
          {isEditing ? 'Edit Course' : 'Create New Course'}
        </Text>
      </View>
      
      <View style={styles.formContainer}>
        <Text style={styles.label}>Course Name</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="Enter course name"
        />
        
        <Text style={styles.label}>Description</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={description}
          onChangeText={setDescription}
          placeholder="Enter course description"
          multiline
        />
        
        <Text style={styles.label}>Level</Text>
        <TextInput
          style={styles.input}
          value={level}
          onChangeText={setLevel}
          placeholder="Beginner, Intermediate, Advanced, etc."
        />
        
        <Text style={styles.label}>Duration</Text>
        <TextInput
          style={styles.input}
          value={duration}
          onChangeText={setDuration}
          placeholder="e.g. 8 weeks, 30 days, etc."
        />
        
        <Text style={styles.label}>Category (Optional)</Text>
        <TextInput
          style={styles.input}
          value={category}
          onChangeText={setCategory}
          placeholder="Enter course category"
        />
        
        <Text style={styles.label}>Recommended For (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          value={recommendedFor}
          onChangeText={setRecommendedFor}
          placeholder="Who is this course for?"
          multiline
        />
        
        <Text style={styles.label}>Course Image</Text>
        <TouchableOpacity 
          style={styles.imagePickerButton}
          onPress={selectImage}
        >
          <Ionicons name="image-outline" size={24} color="#4630EB" />
          <Text style={styles.imagePickerText}>
            {imageUri ? 'Change Image' : 'Select Image'}
          </Text>
        </TouchableOpacity>
        {imageUri && (
          <Text style={styles.imageSelectedText}>Image selected</Text>
        )}
        
        {isEditing && (
          <TouchableOpacity 
            style={styles.manageLessonsButton}
            onPress={navigateToLessons}
          >
            <Ionicons name="list-outline" size={20} color="#fff" />
            <Text style={styles.manageLessonsButtonText}>Manage Lessons</Text>
          </TouchableOpacity>
        )}
        
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>
            {saving ? 'Saving...' : 'Save Course'}
          </Text>
        </TouchableOpacity>
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
    height: 120,
    textAlignVertical: 'top',
  },
  imagePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0e7ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
  },
  imagePickerText: {
    marginLeft: 10,
    fontSize: 16,
    color: '#4630EB',
    fontWeight: '500',
  },
  imageSelectedText: {
    color: '#4CAF50',
    marginBottom: 20,
  },
  manageLessonsButton: {
    backgroundColor: '#007BFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  manageLessonsButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
  saveButton: {
    backgroundColor: '#4630EB',
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 20,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default AdminCourseEditScreen;
