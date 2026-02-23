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
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#444" />}
      >
        {/* Title */}
        <Text style={styles.screenTitle}>Queries</Text>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { borderColor: '#F5F5F5' }]}>
            <Text style={[styles.statNum, { color: '#e67e22' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#F5F5F5' }]}>
            <Text style={[styles.statNum, { color: '#2ecc71' }]}>{answeredCount}</Text>
            <Text style={styles.statLabel}>Answered</Text>
          </View>
          <View style={[styles.statCard, { borderColor: '#F5F5F5' }]}>
            <Text style={[styles.statNum, { color: '#0A3B87' }]}>{queries.length}</Text>
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
          <ActivityIndicator color="#444" style={{ marginTop: 40 }} />
        ) : queries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="checkmark-circle-outline" size={48} color="#2ecc71" />
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
                    <Ionicons name="checkmark-circle" size={14} color="#2ecc71" />
                    <Text style={styles.answeredBadgeText}>Answered</Text>
                  </View>
                ) : (
                  <View style={styles.pendingBadge}>
                    <Ionicons name="time" size={14} color="#e67e22" />
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
  container: { flex: 1, backgroundColor: '#2F2F2F' },
  scrollContent: { paddingHorizontal: 17, paddingTop: 12, paddingBottom: 120 },

  screenTitle: { fontSize: 22, fontWeight: '600', color: '#FFF', marginBottom: 16 },

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
  statNum: { fontSize: 24, fontWeight: '800' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, fontWeight: '600' },

  /* Filter */
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 18 },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  chipActive: { backgroundColor: '#0A3B87' },
  chipText: { fontSize: 13, fontWeight: '600', color: '#888' },
  chipTextActive: { color: '#FFF' },

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
  queryHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  queryCourseBadge: {
    backgroundColor: '#0A3B87',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  queryCourseBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },
  queryTime: { fontSize: 11, color: '#B7B7B7' },
  queryQuestion: { fontSize: 15, fontWeight: '600', color: '#2F2F2F', lineHeight: 22, marginBottom: 12 },
  queryFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  queryStudent: { fontSize: 12, color: '#888' },
  answeredBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  answeredBadgeText: { fontSize: 12, fontWeight: '600', color: '#2ecc71' },
  pendingBadge: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  pendingBadgeText: { fontSize: 12, fontWeight: '600', color: '#e67e22' },

  /* Empty */
  emptyCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 18,
    padding: 48,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#2F2F2F', marginTop: 16 },
  emptyText: { fontSize: 13, color: '#888', marginTop: 6 },
});
