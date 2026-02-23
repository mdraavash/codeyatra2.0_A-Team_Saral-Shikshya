import React, { useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API } from '@/constants/api';
import { useFocusEffect } from '@react-navigation/native';

interface Query {
  id: string;
  question: string;
  answer: string | null;
  answered: boolean;
  course_name: string;
  student_name: string;
  student_roll: string;
  created_at: string;
  answered_at: string | null;
}

export default function TeacherHistory() {
  const { token } = useAuth();
  const router = useRouter();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const res = await fetch(API.QUERIES_TEACHER, { headers });
      if (res.ok) {
        const all: Query[] = await res.json();
        setQueries(all.filter(q => q.answered));
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { fetchData(); }, [token]));

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#444" />}
      >
        <Text style={styles.screenTitle}>History</Text>
        <Text style={styles.screenSub}>{queries.length} answered quer{queries.length === 1 ? 'y' : 'ies'}</Text>

        {loading ? (
          <ActivityIndicator color="#444" style={{ marginTop: 40 }} />
        ) : queries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="time-outline" size={48} color="#888" />
            <Text style={styles.emptyTitle}>No history yet</Text>
            <Text style={styles.emptyText}>Answered queries will appear here</Text>
          </View>
        ) : (
          queries.map((q) => (
            <TouchableOpacity
              key={q.id}
              style={styles.histCard}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/(teacher)/answer-query',
                  params: {
                    queryId: q.id,
                    question: q.question,
                    studentName: q.student_roll || q.student_name,
                    courseName: q.course_name,
                    existingAnswer: q.answer ?? '',
                  },
                })
              }
            >
              {/* Q */}
              <Text style={styles.histQuestion} numberOfLines={2}>{q.question}</Text>

              {/* A preview */}
              <Text style={styles.histAnswer} numberOfLines={2}>{q.answer}</Text>

              {/* Footer */}
              <View style={styles.histFooter}>
                <View style={styles.histCourseBadge}>
                  <Text style={styles.histCourseBadgeText}>{q.course_name}</Text>
                </View>
                <Text style={styles.histDate}>{formatDate(q.answered_at)}</Text>
              </View>

              {/* Edit hint */}
              <View style={styles.editHintRow}>
                <Ionicons name="create-outline" size={14} color="#f2f2f2" />
                <Text style={styles.editHintText}>Edit Your Answer</Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2F2F2F' },
  scrollContent: { paddingHorizontal: 17, paddingTop: 12, paddingBottom: 120 },

  screenTitle: { fontSize: 22, fontWeight: '600', color: '#FFF' },
  screenSub: { fontSize: 13, color: '#888', marginTop: 4, marginBottom: 20 },

  /* History Card */
  histCard: {
    backgroundColor: '#444444',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    elevation: 3,
  },
  histQuestion: { fontSize: 15, fontWeight: '700', color: '#f2f2f2', lineHeight: 22, marginBottom: 8 },
  histAnswer: { fontSize: 13, color: '#888', lineHeight: 20, marginBottom: 12 },
  histFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  histCourseBadge: {
    backgroundColor: '#0A3B87',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
  histCourseBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  histDate: { fontSize: 11, color: '#f2f2f2' },
  editHintRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-end',
  },
  editHintText: { fontSize: 12, fontWeight: '600', color: '#f5f5f5' },

  /* Empty */
  emptyCard: {
    backgroundColor: '#444444',
    borderRadius: 18,
    padding: 48,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f2f2f2', marginTop: 16 },
  emptyText: { fontSize: 13, color: '#888', marginTop: 6 },
});
