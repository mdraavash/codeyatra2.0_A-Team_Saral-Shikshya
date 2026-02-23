import React, { useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API } from '@/constants/api';

export default function AnswerQuery() {
  const { token } = useAuth();
  const router = useRouter();
  const { queryId, question, studentName, courseName, existingAnswer } = useLocalSearchParams<{
    queryId: string;
    question: string;
    studentName: string;
    courseName: string;
    existingAnswer?: string;
  }>();

  const isEditing = !!existingAnswer;
  const [answer, setAnswer] = useState(existingAnswer ?? '');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    const trimmed = answer.trim();
    if (!trimmed) return;
    setSubmitting(true);
    try {
      const res = await fetch(API.QUERY_ANSWER(queryId), {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ answer: trimmed }),
      });
      if (res.ok) {
        Alert.alert('Success', isEditing ? 'Answer updated!' : 'Answer submitted!', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      } else {
        const data = await res.json();
        Alert.alert('Error', data.detail || 'Something went wrong');
      }
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={20} color="#FFF" />
      </TouchableOpacity>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.headerCard}>
            <View style={styles.headerBadge}>
              <Text style={styles.headerBadgeText}>{isEditing ? 'Edit Answer' : 'New Answer'}</Text>
            </View>
            <Text style={styles.headerTitle}>{courseName}</Text>
            <Text style={styles.headerSub}>from {studentName}</Text>
          </View>

          {/* Question */}
          <Text style={styles.sectionTitle}>Student&apos;s Question</Text>
          <View style={styles.questionCard}>
            <Ionicons name="help-circle-outline" size={20} color="#6C63FF" style={{ marginRight: 10 }} />
            <Text style={styles.questionText}>{question}</Text>
          </View>

          {/* Answer input */}
          <Text style={styles.sectionTitle}>Your Answer</Text>
          <TextInput
            style={styles.answerInput}
            placeholder="Type your answer here..."
            placeholderTextColor="rgba(255,255,255,0.25)"
            value={answer}
            onChangeText={setAnswer}
            multiline
            textAlignVertical="top"
          />

          {/* Submit */}
          <TouchableOpacity
            style={[styles.submitBtn, (!answer.trim() || submitting) && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={submitting || !answer.trim()}
            activeOpacity={0.7}
          >
            <Ionicons name={isEditing ? 'create-outline' : 'send'} size={18} color="#FFF" />
            <Text style={styles.submitText}>
              {submitting ? 'Submitting...' : isEditing ? 'Update Answer' : 'Submit Answer'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 60, paddingBottom: 40 },

  backBtn: {
    position: 'absolute',
    top: 56,
    left: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Header */
  headerCard: {
    backgroundColor: '#16213E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.15)',
    marginBottom: 8,
  },
  headerBadge: {
    backgroundColor: 'rgba(108,99,255,0.15)',
    paddingHorizontal: 14,
    paddingVertical: 4,
    borderRadius: 10,
    marginBottom: 10,
  },
  headerBadgeText: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  /* Section */
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.6)',
    marginTop: 22,
    marginBottom: 10,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },

  /* Question */
  questionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#16213E',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  questionText: { flex: 1, fontSize: 15, fontWeight: '500', color: '#FFF', lineHeight: 22 },

  /* Answer */
  answerInput: {
    width: '100%',
    minHeight: 160,
    backgroundColor: '#16213E',
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: '#FFF',
    lineHeight: 22,
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.15)',
  },

  /* Submit */
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#6C63FF',
    height: 54,
    borderRadius: 16,
    marginTop: 24,
    gap: 8,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
