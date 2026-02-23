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
          <View style={[styles.statCard, { borderColor: '#F5F5F5' }]}>
            <Text style={[styles.statNum, { color: '#0A3B87' }]}>{queries.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#F5F5F5' }]}>
            <Text style={[styles.statNum, { color: '#2ecc71' }]}>{answeredCount}</Text>
            <Text style={styles.statLabel}>Answered</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#F5F5F5' }]}>
            <Text style={[styles.statNum, { color: '#e67e22' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Questions */}
        <Text style={styles.sectionTitle}>Questions</Text>

        {loading ? (
          <ActivityIndicator color="#444" style={{ marginTop: 30 }} />
        ) : queries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubble-outline" size={44} color="#888" />
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
                    <Ionicons name="checkmark-circle" size={14} color="#2ecc71" />
                    <Text style={styles.answeredText}>Answered</Text>
                  </View>
                  <View style={styles.editHint}>
                    <Ionicons name="create-outline" size={14} color="#0A3B87" />
                    <Text style={styles.editHintText}>Edit</Text>
                  </View>
                </View>
              ) : (
                <View style={styles.queryFooter}>
                  <View style={styles.pendingBadge}>
                    <Ionicons name="time" size={14} color="#e67e22" />
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
  container: { flex: 1, backgroundColor: '#2F2F2F' },
  scrollContent: { paddingHorizontal: 17, paddingTop: 60, paddingBottom: 40 },

  backBtn: {
    position: 'absolute',
    top: 56,
    left: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#444444',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Header */
  headerCard: {
    backgroundColor: '#444444',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#FFF' },
  headerSub: { fontSize: 13, color: '#FFFFFF', marginTop: 4 },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#C4C4C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, fontWeight: '600' },

  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.21, marginBottom: 14 },

  /* Query Card */
  queryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#C4C4C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  queryQuestion: { fontSize: 15, fontWeight: '600', color: '#2F2F2F', lineHeight: 22, marginBottom: 12 },
  queryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  answeredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  answeredText: { fontSize: 12, fontWeight: '600', color: '#2ecc71' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pendingText: { fontSize: 12, fontWeight: '600', color: '#e67e22' },
  editHint: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editHintText: { fontSize: 12, fontWeight: '600', color: '#0A3B87' },
  answerHint: {
    backgroundColor: 'rgba(10,59,135,0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  answerHintText: { fontSize: 12, fontWeight: '700', color: '#0A3B87' },

  /* Empty */
  emptyCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: { fontSize: 13, color: '#888', marginTop: 14 },
});
