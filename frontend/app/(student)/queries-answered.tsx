import React, { useEffect, useState } from 'react';
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

interface Query {
  id: string;
  question: string;
  answer: string | null;
  course_name: string;
  teacher_id?: string;
}

export default function QueriesAnswered() {
  const { token } = useAuth();
  const router = useRouter();
  const { courseId, courseName } = useLocalSearchParams<{
    courseId: string;
    courseName: string;
  }>();

  const [queries, setQueries] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API.QUERIES_COURSE_ANSWERED(courseId), { headers });
        if (res.ok) setQueries(await res.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, token]);

  const displayName = courseName || (queries[0]?.course_name ?? '');

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>Answered Queries</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{displayName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Stats */}
        <View style={styles.statsCard}>
          <Ionicons name="checkmark-done-circle" size={28} color="#2ecc71" />
          <Text style={styles.statsText}>{queries.length} answered quer{queries.length === 1 ? 'y' : 'ies'}</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#444" style={{ marginTop: 30 }} />
        ) : queries.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color="#888" />
            <Text style={styles.emptyText}>No answered queries yet</Text>
            <Text style={styles.emptySubText}>Teacher responses will show up here</Text>
          </View>
        ) : (
          queries.map((q) => (
            <TouchableOpacity
              key={q.id}
              style={styles.queryCard}
              activeOpacity={0.8}
              onPress={() =>
                router.push({
                  pathname: '/(student)/answer-detail',
                  params: {
                    queryId: q.id,
                    question: q.question,
                    answer: q.answer ?? '',
                    courseName: q.course_name,
                    teacherId: q.teacher_id ?? '',
                  },
                })
              }
            >
              <Text style={styles.queryQuestion} numberOfLines={2}>{q.question}</Text>
              <Text style={styles.queryAnswer} numberOfLines={2}>{q.answer ?? ''}</Text>
              <View style={styles.tapHint}>
                <Text style={styles.tapHintText}>View full answer & rate</Text>
                <Ionicons name="expand-outline" size={14} color="#0A3B87" />
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

  scrollContent: { paddingHorizontal: 17, paddingTop: 20, paddingBottom: 40 },

  statsCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 16,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#2ecc71',
  },
  statsText: { fontSize: 15, fontWeight: '600', color: '#2ecc71' },

  emptyCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 20,
    paddingVertical: 50,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: '#888' },
  emptySubText: { fontSize: 13, color: '#888' },

  queryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 18,
    marginBottom: 14,
    borderLeftWidth: 3,
    borderLeftColor: '#2ecc71',
    shadowColor: '#C4C4C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  queryQuestion: { fontSize: 15, fontWeight: '600', color: '#2F2F2F', lineHeight: 22 },
  queryAnswer: { fontSize: 14, color: '#888', lineHeight: 20, marginTop: 10 },
  tapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
    alignSelf: 'flex-end',
  },
  tapHintText: { fontSize: 12, fontWeight: '600', color: '#0A3B87' },
});
