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
  const [popup, setPopup] = useState<{ 
    visible: boolean; 
    type: 'success' | 'error' | 'warning' | 'faq' | 'subject-invalid' | null; 
    message: string;
    faqAnswer?: string;
  }>({
    visible: false, type: null, message: '',
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
      
      const data = await res.json();
      
      if (res.ok) {
        // Check if this is a FAQ match response
        if (data.matched && data.faq) {
          setPopup({ 
            visible: true, 
            type: 'faq', 
            message: 'We found a similar question that was already answered!',
            faqAnswer: data.faq.answer || 'No answer available yet.'
          });
        } else {
          setPopup({ visible: true, type: 'success', message: 'Your query has been sent to the teacher!' });
        }
        return;
      } else {
        if (data.moderation) {
          setPopup({ visible: true, type: 'warning', message: data.detail || 'Your query was flagged as inappropriate.' });
        } else if (data.subject_invalid) {
          setPopup({ visible: true, type: 'subject-invalid', message: data.detail || 'This question is not related to the course subject.' });
        } else {
          setPopup({ visible: true, type: 'error', message: data.detail || 'Something went wrong' });
        }
      }
    } catch {
      setPopup({ visible: true, type: 'error', message: 'Network error. Please try again.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePopupDismiss = () => {
    const wasSuccess = popup.type === 'success';
    setPopup({ visible: false, type: null, message: '' });
    if (wasSuccess) {
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
            <Ionicons name="book-outline" size={18} color="#0A3B87" />
            <Text style={styles.courseInfoText}>{courseName}</Text>
            <Text style={styles.teacherInfoText}>by {teacherName}</Text>
          </View>

          {/* Text Input */}
          <View style={styles.inputCard}>
            <TextInput
              style={styles.input}
              placeholder="Type your question here..."
              placeholderTextColor="#888"
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
            <View style={[
              styles.modalIconWrap,
              popup.type === 'success' ? styles.modalIconSuccess
                : popup.type === 'warning' ? styles.modalIconWarning
                : popup.type === 'faq' ? styles.modalIconFaq
                : popup.type === 'subject-invalid' ? styles.modalIconWarning
                : styles.modalIconError,
            ]}>
              <Ionicons
                name={popup.type === 'success' ? 'checkmark-circle' : 
                     popup.type === 'warning' ? 'warning' : 
                     popup.type === 'faq' ? 'bulb' :
                     popup.type === 'subject-invalid' ? 'alert-circle' :
                     'close-circle'}
                size={48}
                color={popup.type === 'success' ? '#4ECDC4' : 
                       popup.type === 'warning' ? '#e67e22' : 
                       popup.type === 'faq' ? '#4ECDC4' :
                       popup.type === 'subject-invalid' ? '#e67e22' :
                       '#FF6B6B'}
              />
            </View>
            <Text style={styles.modalTitle}>
              {popup.type === 'success' ? 'Query Submitted' : 
               popup.type === 'warning' ? 'Warning' : 
               popup.type === 'faq' ? 'Similar Question Found' :
               popup.type === 'subject-invalid' ? 'Off-Topic Question' :
               'Error'}
            </Text>
            <Text style={styles.modalMessage}>{popup.message}</Text>
            {popup.type === 'faq' && popup.faqAnswer && (
              <View style={styles.faqAnswerBox}>
                <Text style={styles.faqAnswerLabel}>📚 Answer:</Text>
                <Text style={styles.faqAnswerText}>{popup.faqAnswer}</Text>
              </View>
            )}
            <TouchableOpacity style={[
              styles.modalBtn,
              (popup.type === 'warning' || popup.type === 'subject-invalid') && styles.modalBtnWarning,
              popup.type === 'faq' && styles.modalBtnFaq,
            ]} onPress={handlePopupDismiss} activeOpacity={0.7}>
              <Text style={styles.modalBtnText}>
                {popup.type === 'faq' ? 'Got It' : 'OK'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2F2F2F' },

  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#444444',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#444444',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: '#888', marginTop: 2 },

  body: { flex: 1, paddingHorizontal: 20, paddingTop: 20, paddingBottom: 30 },

  courseInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  courseInfoText: { fontSize: 14, fontWeight: '600', color: '#0A3B87' },
  teacherInfoText: { fontSize: 13, color: '#888' },

  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 4,
    minHeight: 200,
    shadowColor: '#C4C4C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#2F2F2F',
    padding: 16,
    lineHeight: 24,
    minHeight: 192,
  },

  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#0A3B87',
    height: 50,
    borderRadius: 25,
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
    backgroundColor: '#444444',
    borderRadius: 24,
    padding: 32,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
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
  modalIconWarning: { backgroundColor: 'rgba(230,126,34,0.12)' },
  modalIconFaq: { backgroundColor: 'rgba(78,205,196,0.12)' },
  modalTitle: { fontSize: 22, fontWeight: '800', color: '#FFF', marginBottom: 8 },
  modalMessage: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', lineHeight: 20, marginBottom: 24 },
  faqAnswerBox: {
    backgroundColor: 'rgba(78,205,196,0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#4ECDC4',
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    marginHorizontal: -8,
  },
  faqAnswerLabel: { fontSize: 12, fontWeight: '600', color: '#4ECDC4', marginBottom: 6 },
  faqAnswerText: { fontSize: 13, color: 'rgba(255,255,255,0.8)', lineHeight: 18 },
  modalBtn: {
    backgroundColor: '#0A3B87',
    paddingHorizontal: 48,
    paddingVertical: 14,
    borderRadius: 16,
  },
  modalBtnWarning: {
    backgroundColor: '#e67e22',
  },
  modalBtnFaq: {
    backgroundColor: '#4ECDC4',
  },
  modalBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});