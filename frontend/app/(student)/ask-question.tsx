import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API } from '@/constants/api';

export default function AskQuestion() {
  const { token } = useAuth();
  const router = useRouter();
  const { courseId, courseName, teacherName } = useLocalSearchParams<{
    courseId: string;
    courseName: string;
    teacherName: string;
  }>();

  const [question, setQuestion] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [popup, setPopup] = useState<{ visible: boolean; success: boolean; message: string }>({
    visible: false, success: false, message: '',
  });

  const handleSubmit = async () => {
    const trimmed = question.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await fetch(API.QUERIES, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ course_id: courseId, question: trimmed }),
      });
      if (res.ok) {
        setPopup({ visible: true, success: true, message: 'Your query has been sent to the teacher!' });
        return;
      } else {
        const data = await res.json();
        setPopup({ visible: true, success: false, message: data.detail || 'Something went wrong' });
      }
    } catch {
      setPopup({ visible: true, success: false, message: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePopupDismiss = () => {
    setPopup({ visible: false, success: false, message: '' });
    if (popup.success) {
      router.replace('/(student)/' as never);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Ask a Question</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{courseName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.body}>
          {/* Course Info */}
          <View style={styles.courseInfoRow}>
            <Ionicons name="book-outline" size={18} color="#6C63FF" />
            <Text style={styles.courseInfoText}>{courseName}</Text>
            <Text style={styles.teacherInfoText}>by {teacherName}</Text>
          </View>

          {/* Text Input */}
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="Type your question here..."
              placeholderTextColor="#555"
              value={question}
              onChangeText={setQuestion}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitBtn, (!question.trim() || submitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !question.trim()}
            activeOpacity={0.7}
          >
            {submitting ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Ionicons name="send" size={20} color="#FFF" />
                <Text style={styles.submitBtnText}>Submit Query</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Success/Error Popup Modal */}
      <Modal transparent visible={popup.visible} animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={[styles.modalIconWrap, popup.success ? styles.modalIconSuccess : styles.modalIconError]}>
              <Ionicons
                name={popup.success ? 'checkmark-circle' : 'close-circle'}
                size={48}
                color={popup.success ? '#4ECDC4' : '#FF6B6B'}
              />
            </View>
            <Text style={styles.modalTitle}>
              {popup.success ? 'Query Submitted' : 'Error'}
            </Text>
            <Text style={styles.modalMessage}>{popup.message}</Text>
            <TouchableOpacity style={styles.modalBtn} onPress={handlePopupDismiss} activeOpacity={0.7}>
              <Text style={styles.modalBtnText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: '#6C63FF', marginTop: 2 },

  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },

  courseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(108, 99, 255, 0.08)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.15)',
  },
  courseInfoText: { fontSize: 14, fontWeight: '600', color: '#6C63FF' },
  teacherInfoText: { fontSize: 13, color: '#888' },

  inputCard: {
    backgroundColor: '#16213E',
    borderRadius: 18,
    padding: 4,
    minHeight: 200,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
    padding: 16,
    lineHeight: 24,
    minHeight: 192,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#6C63FF',
    height: 56,
    borderRadius: 28,
    marginTop: 16,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
  },
  modalCard: {
    width: '100%',
    backgroundColor: '#16213E',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  modalIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalIconSuccess: { backgroundColor: 'rgba(78,205,196,0.12)' },
  modalIconError: { backgroundColor: 'rgba(255,107,107,0.12)' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  modalBtn: {
    backgroundColor: '#6C63FF',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 16,
  },
  modalBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
