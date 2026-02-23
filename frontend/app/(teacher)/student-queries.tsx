import React, { useCallback, useState } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API } from '@/constants/api';
import { useFocusEffect } from '@react-navigation/native';

interface Query {
  id: string;
  question: string;
  answer: string | null;
  answered: boolean;
  course_name: string;
  student_name: string;
}

export default function StudentQueries() {
  const { token } = useAuth();
  const router = useRouter();
  const { courseId, courseName, studentId, studentRoll } =
    useLocalSearchParams<{
      courseId: string;
      courseName: string;
      studentId: string;
      studentRoll: string;
    }>();

  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch(API.TEACHER_STUDENT_QUERIES(courseId, studentId), { headers });
      if (res.ok) setQueries(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { load(); }, [courseId, studentId, token]));

  const pendingCount = queries.filter(q => !q.answered).length;
  const answeredCount = queries.filter(q => q.answered).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Back */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={20} color="#FFF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{studentRoll}</Text>
          <Text style={styles.headerSub}>{courseName} · Questions Raised</Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: 'rgba(108,99,255,0.2)' }]}>
            <Text style={[styles.statNum, { color: '#6C63FF' }]}>{queries.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(78,205,196,0.2)' }]}>
            <Text style={[styles.statNum, { color: '#4ECDC4' }]}>{answeredCount}</Text>
            <Text style={styles.statLabel}>Answered</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(255,107,107,0.2)' }]}>
            <Text style={[styles.statNum, { color: '#FF6B6B' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Questions */}
        <Text style={styles.sectionTitle}>Questions</Text>

        {loading ? (
          <ActivityIndicator color="#6C63FF" style={{ marginTop: 30 }} />
        ) : queries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubble-outline" size={44} color="#555" />
            <Text style={styles.emptyText}>No questions from this student</Text>
          </View>
        ) : (
          queries.map((q) => (
            <TouchableOpacity
              key={q.id}
              style={styles.queryCard}
              activeOpacity={0.7}
              onPress={() => {
                if (!q.answered) {
                  router.push({
                    pathname: '/(teacher)/answer-query',
                    params: {
                      queryId: q.id,
                      question: q.question,
                      studentName: studentRoll,
                      courseName: courseName,
                    },
                  });
                } else {
                  router.push({
                    pathname: '/(teacher)/answer-query',
                    params: {
                      queryId: q.id,
                      question: q.question,
                      studentName: studentRoll,
                      courseName: courseName,
                      existingAnswer: q.answer ?? '',
                    },
                  });
                }
              }}
            >
              <Text style={styles.queryQuestion} numberOfLines={2}>{q.question}</Text>
              {q.answered ? (
                <View style={styles.queryFooter}>
                  <View style={styles.answeredBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#4ECDC4" />
                    <Text style={styles.answeredText}>Answered</Text>
                  </View>
                  <View style={styles.editHint}>
                    <Ionicons name="create-outline" size={14} color="#6C63FF" />
                    <Text style={styles.editHintText}>Edit</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.queryFooter}>
                  <View style={styles.pendingBadge}>
                    <Ionicons name="time" size={14} color="#FF6B6B" />
                    <Text style={styles.pendingText}>Pending</Text>
                  </View>
                  <View style={styles.answerHint}>
                    <Text style={styles.answerHintText}>Answer →</Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
    marginBottom: 16,
  },
  headerTitle: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#16213E',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: '600' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 14 },

  /* Query Card */
  queryCard: {
    backgroundColor: '#16213E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  queryQuestion: { fontSize: 15, fontWeight: '600', color: '#FFF', lineHeight: 22, marginBottom: 12 },
  queryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  answeredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  answeredText: { fontSize: 12, fontWeight: '600', color: '#4ECDC4' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pendingText: { fontSize: 12, fontWeight: '600', color: '#FF6B6B' },
  editHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editHintText: { fontSize: 12, fontWeight: '600', color: '#6C63FF' },
  answerHint: {
    backgroundColor: 'rgba(108,99,255,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  answerHintText: { fontSize: 12, fontWeight: '700', color: '#6C63FF' },

  /* Empty */
  emptyCard: {
    backgroundColor: '#16213E',
    borderRadius: 18,
    padding: 40,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 14 },
});
