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

interface MyQuery {
  id: string;
  question: string;
  answer: string | null;
  answered: boolean;
  course_name: string;
  created_at: string;
  teacher_id?: string;
}

export default function MyQueriesScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [myQueries, setMyQueries] = useState<MyQuery[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'answered' | 'pending'>('all');

  const headers = { Authorization: `Bearer ${token}` };

  const fetchQueries = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(API.MY_QUERIES, { headers });
      if (res.ok) setMyQueries(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { fetchQueries(); }, [token]));

  const filtered = myQueries.filter((q) => {
    if (filter === 'answered') return q.answered;
    if (filter === 'pending') return !q.answered;
    return true;
  });

  const answeredCount = myQueries.filter((q) => q.answered).length;
  const pendingCount = myQueries.filter((q) => !q.answered).length;

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchQueries(true)} tintColor="#6C63FF" />
        }
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Ionicons name="document-text" size={28} color="#6C63FF" />
          <View style={styles.pageHeaderText}>
            <Text style={styles.pageTitle}>My Queries</Text>
            <Text style={styles.pageSubtitle}>Track all your questions</Text>
          </View>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statNumber}>{myQueries.length}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(78, 205, 196, 0.2)' }]}>
            <Text style={[styles.statNumber, { color: '#4ECDC4' }]}>{answeredCount}</Text>
            <Text style={styles.statLabel}>Answered</Text>
          </View>
          <View style={[styles.statCard, { borderColor: 'rgba(255, 107, 107, 0.2)' }]}>
            <Text style={[styles.statNumber, { color: '#FF6B6B' }]}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(['all', 'answered', 'pending'] as const).map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterChip, filter === f && styles.filterChipActive]}
              onPress={() => setFilter(f)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filter === f && styles.filterChipTextActive]}>
                {f.charAt(0).toUpperCase() + f.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Queries */}
        {filtered.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="document-text-outline" size={40} color="#555" />
            <Text style={styles.emptyText}>
              {filter === 'all' ? "You haven't asked any questions yet" : `No ${filter} queries`}
            </Text>
          </View>
        ) : (
          filtered.map((q) => (
            <TouchableOpacity
              key={q.id}
              style={styles.queryCard}
              activeOpacity={0.8}
              onPress={() => {
                if (q.answered && q.answer) {
                  router.push({
                    pathname: '/(student)/answer-detail',
                    params: {
                      queryId: q.id,
                      question: q.question,
                      answer: q.answer,
                      courseName: q.course_name,
                      teacherId: q.teacher_id ?? '',
                    },
                  });
                }
              }}
            >
              <View style={styles.queryHeader}>
                <View style={styles.queryBadge}>
                  <Text style={styles.queryBadgeText}>{q.course_name}</Text>
                </View>
                <View style={[styles.statusBadge, q.answered ? styles.statusAnswered : styles.statusPending]}>
                  <View style={[styles.statusDot, { backgroundColor: q.answered ? '#4ECDC4' : '#FF6B6B' }]} />
                  <Text style={[styles.statusText, { color: q.answered ? '#4ECDC4' : '#FF6B6B' }]}>
                    {q.answered ? 'Answered' : 'Pending'}
                  </Text>
                </View>
              </View>
              <Text style={styles.queryQuestion} numberOfLines={2}>{q.question}</Text>
              {q.answered && q.answer ? (
                <View style={styles.queryAnswerPreview}>
                  <Text style={styles.queryAnswer} numberOfLines={2}>{q.answer}</Text>
                  <View style={styles.tapHint}>
                    <Text style={styles.tapHintText}>Tap to view full answer</Text>
                    <Ionicons name="expand-outline" size={14} color="#6C63FF" />
                  </View>
                </View>
              ) : (
                <View style={styles.pendingRow}>
                  <Ionicons name="hourglass-outline" size={16} color="#888" />
                  <Text style={styles.pendingText}>Awaiting teacher response...</Text>
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
  scrollContent: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 110 },

  /* Page Header */
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginBottom: 20,
    paddingVertical: 12,
  },
  pageHeaderText: { flex: 1 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 4 },

  /* Stats */
  statsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#16213E',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  statNumber: { fontSize: 24, fontWeight: '800', color: '#6C63FF' },
  statLabel: { fontSize: 11, color: '#888', marginTop: 4, textTransform: 'uppercase', letterSpacing: 0.5 },

  /* Filters */
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 20 },
  filterChip: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#16213E',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  filterChipActive: {
    backgroundColor: '#6C63FF',
    borderColor: '#6C63FF',
  },
  filterChipText: { fontSize: 13, fontWeight: '600', color: '#888' },
  filterChipTextActive: { color: '#FFF' },

  /* Empty */
  emptyCard: {
    backgroundColor: '#16213E',
    borderRadius: 20,
    paddingVertical: 50,
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  emptyText: { fontSize: 14, color: '#666' },

  /* Query Card */
  queryCard: {
    backgroundColor: '#16213E',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  queryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  queryBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  queryBadgeText: { fontSize: 11, fontWeight: '700', color: '#6C63FF', textTransform: 'uppercase' },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusAnswered: { backgroundColor: 'rgba(78, 205, 196, 0.1)' },
  statusPending: { backgroundColor: 'rgba(255, 107, 107, 0.1)' },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '700' },
  queryQuestion: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', lineHeight: 22 },

  /* Answer preview */
  queryAnswerPreview: { marginTop: 12 },
  queryAnswer: { fontSize: 14, color: '#888', lineHeight: 20 },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  tapHintText: { fontSize: 12, fontWeight: '600', color: '#6C63FF' },

  /* Pending */
  pendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
  },
  pendingText: { fontSize: 13, color: '#888', fontStyle: 'italic' },
});
