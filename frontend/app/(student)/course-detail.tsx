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
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { API } from '@/constants/api';

interface Query {
  id: string;
  question: string;
  answer: string | null;
  answered: boolean;
  teacher_id?: string;
}

export default function CourseDetail() {
  const { token } = useAuth();
  const router = useRouter();
  const { courseId, courseName, teacherName } = useLocalSearchParams<{
    courseId: string;
    courseName: string;
    teacherName: string;
  }>();

  const [faqs, setFaqs] = useState<Query[]>([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API.QUERIES_COURSE_FAQ(courseId), { headers });
        if (res.ok) setFaqs(await res.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, token]);

  return (
    <SafeAreaView style={styles.container}>
      
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>{courseName}</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{teacherName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Course Info Card */}
        <View style={styles.courseInfoCard}>
          <View style={styles.courseInfoIcon}>
            <MaterialCommunityIcons name="book-open-variant" size={32} color="#0A3B87" />
          </View>
          <Text style={styles.courseInfoName}>{courseName}</Text>
          <Text style={styles.courseInfoTeacher}>Instructor: {teacherName}</Text>
        </View>

        <View style={styles.actionsRow}>
          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/(student)/ask-question',
                params: { courseId, courseName, teacherName },
              })
            }
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(10, 59, 135, 0.15)' }]}>
              <Ionicons name="create-outline" size={24} color="#0A3B87" />
            </View>
            <Text style={styles.actionTitle}>Ask Query</Text>
            <Text style={styles.actionSub}>Submit a new question</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            activeOpacity={0.8}
            onPress={() =>
              router.push({
                pathname: '/(student)/queries-answered',
                params: { courseId, courseName, teacherName },
              })
            }
          >
            <View style={[styles.actionIconWrap, { backgroundColor: 'rgba(46, 204, 113, 0.15)' }]}>
              <Ionicons name="checkmark-done-outline" size={24} color="#2ecc71" />
            </View>
            <Text style={styles.actionTitle}>Answered</Text>
            <Text style={styles.actionSub}>View teacher replies</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="help-circle-outline" size={20} color="#FFD700" />
          <Text style={styles.sectionTitle}>Frequently Asked</Text>
        </View>

        {loading ? (
          <ActivityIndicator color="#444" style={{ marginTop: 20 }} />
        ) : faqs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={32} color="#888" />
            <Text style={styles.emptyText}>No FAQs yet</Text>
          </View>
        ) : (
          faqs.slice(0, 5).map((faq) => (
            <TouchableOpacity
              key={faq.id}
              style={styles.faqCard}
              activeOpacity={0.8}
              onPress={() => {
                if (faq.answer) {
                  router.push({
                    pathname: '/(student)/answer-detail',
                    params: {
                      queryId: faq.id,
                      question: faq.question,
                      answer: faq.answer,
                      courseName: courseName ?? '',
                      teacherId: faq.teacher_id ?? '',
                    },
                  });
                }
              }}
            >
              <Text style={styles.faqQuestion} numberOfLines={2}>{faq.question}</Text>
              <Text style={styles.faqAnswer} numberOfLines={2}>{faq.answer ?? ''}</Text>
              {faq.answer && (
                <View style={styles.faqTapHint}>
                  <Text style={styles.faqTapHintText}>Tap to view & rate</Text>
                  <Ionicons name="chevron-forward" size={14} color="#0A3B87" />
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

  courseInfoCard: {
    backgroundColor: '#444444',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  courseInfoIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: 'rgba(10, 59, 135, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  courseInfoName: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  courseInfoTeacher: { fontSize: 14, color: '#FFFFFF', marginTop: 6 },

  actionsRow: { flexDirection: 'row', gap: 14, marginBottom: 28 },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    shadowColor: '#C4C4C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  actionIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  actionTitle: { fontSize: 16, fontWeight: '700', color: '#2F2F2F', marginBottom: 4 },
  actionSub: { fontSize: 12, color: '#888' },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  sectionTitle: { fontSize: 14, fontWeight: '600', color: '#FFFFFF', letterSpacing: 0.21 },

  emptyCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    paddingVertical: 30,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: { fontSize: 14, color: '#888' },

  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#0A3B87',
    shadowColor: '#C4C4C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  faqQuestion: { fontSize: 14, fontWeight: '600', color: '#2F2F2F', lineHeight: 20 },
  faqAnswer: { fontSize: 13, color: '#888', lineHeight: 20, marginTop: 8 },
  faqTapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 10,
    alignSelf: 'flex-end',
  },
  faqTapHintText: { fontSize: 12, fontWeight: '600', color: '#0A3B87' },
});
