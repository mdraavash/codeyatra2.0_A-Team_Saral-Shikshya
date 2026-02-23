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
}

export default function TeacherQueries() {
  const { token } = useAuth();
  const router = useRouter();
  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'pending' | 'all'>('pending');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const url = filter === 'pending' ? API.QUERIES_TEACHER_PENDING : API.QUERIES_TEACHER;
      const res = await fetch(url, { headers });
      if (res.ok) setQueries(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { fetchData(); }, [token, filter]));

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const pendingCount = queries.filter(q => !q.answered).length;
  const answeredCount = queries.filter(q => q.answered).length;

  const formatTime = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#6C63FF" />}
      >
        {/* Title */}
        <Text style={styles.screenTitle}>Queries</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: 'rgba(255,107,107,0.2)' }]}>
            <Text style={[styles.statNum, { color: '#FF6B6B' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(78,205,196,0.2)' }]}>
            <Text style={[styles.statNum, { color: '#4ECDC4' }]}>{answeredCount}</Text>
            <Text style={styles.statLabel}>Answered</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(108,99,255,0.2)' }]}>
            <Text style={[styles.statNum, { color: '#6C63FF' }]}>{queries.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(['pending', 'all'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.chip, filter === f && styles.chipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, filter === f && styles.chipTextActive]}>
                {f === 'pending' ? 'Pending' : 'All Queries'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Query List */}
        {loading ? (
          <ActivityIndicator color="#6C63FF" style={{ marginTop: 40 }} />
        ) : queries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#4ECDC4" />
            <Text style={styles.emptyTitle}>All caught up!</Text>
            <Text style={styles.emptyText}>No {filter === 'pending' ? 'pending' : ''} queries</Text>
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
                      studentName: q.student_roll || q.student_name,
                      courseName: q.course_name,
                    },
                  });
                }
              }}
            >
              <View style={styles.queryHeader}>
                <View style={styles.queryCourseBadge}>
                  <Text style={styles.queryCourseBadgeText}>{q.course_name}</Text>
                </View>
                <Text style={styles.queryTime}>{formatTime(q.created_at)}</Text>
              </View>
              <Text style={styles.queryQuestion} numberOfLines={2}>{q.question}</Text>
              <View style={styles.queryFooter}>
                <Text style={styles.queryStudent}>from {q.student_roll || q.student_name}</Text>
                {q.answered ? (
                  <View style={styles.answeredBadge}>
                    <Ionicons name="checkmark-circle" size={14} color="#4ECDC4" />
                    <Text style={styles.answeredBadgeText}>Answered</Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Ionicons name="time" size={14} color="#FF6B6B" />
                    <Text style={styles.pendingBadgeText}>Pending</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 },

  screenTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 16 },

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
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.5)', marginTop: 4, fontWeight: '600' },

  /* Filter */
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#16213E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  chipActive: { backgroundColor: '#6C63FF', borderColor: '#6C63FF' },
  chipText: { fontSize: 13, fontWeight: '600', color: 'rgba(255,255,255,0.5)' },
  chipTextActive: { color: '#FFF' },

  /* Query Card */
  queryCard: {
    backgroundColor: '#16213E',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  queryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  queryCourseBadge: {
    backgroundColor: 'rgba(108,99,255,0.15)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  queryCourseBadgeText: { fontSize: 11, fontWeight: '700', color: '#6C63FF' },
  queryTime: { fontSize: 11, color: 'rgba(255,255,255,0.35)' },
  queryQuestion: { fontSize: 15, fontWeight: '600', color: '#FFF', lineHeight: 22, marginBottom: 12 },
  queryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  queryStudent: { fontSize: 12, color: 'rgba(255,255,255,0.4)' },
  answeredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  answeredBadgeText: { fontSize: 12, fontWeight: '600', color: '#4ECDC4' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pendingBadgeText: { fontSize: 12, fontWeight: '600', color: '#FF6B6B' },

  /* Empty */
  emptyCard: {
    backgroundColor: '#16213E',
    borderRadius: 18,
    padding: 48,
    alignItems: 'center',
    marginTop: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#FFF', marginTop: 16 },
  emptyText: { fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 6 },
});
