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

interface FAQ {
  id: string;
  question: string;
  answer: string | null;
  course_name: string;
  student_name: string;
  teacher_id?: string;
}

export default function FAQScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchFaqs = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(API.FAQ_ALL, { headers });
      if (res.ok) setFaqs(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { fetchFaqs(); }, [token]));

  const toggleExpand = (id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

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
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchFaqs(true)} tintColor="#6C63FF" />
        }
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Ionicons name="help-circle" size={28} color="#6C63FF" />
          <View style={styles.pageHeaderText}>
            <Text style={styles.pageTitle}>FAQ</Text>
            <Text style={styles.pageSubtitle}>Frequently Asked Questions across all courses</Text>
          </View>
        </View>

        {faqs.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="chatbubble-ellipses-outline" size={40} color="#555" />
            <Text style={styles.emptyText}>No FAQs available yet</Text>
            <Text style={styles.emptySubText}>Answered queries will appear here</Text>
          </View>
        ) : (
          faqs.map((faq) => {
            const isExpanded = expandedId === faq.id;
            return (
              <TouchableOpacity
                key={faq.id}
                style={[styles.faqCard, isExpanded && styles.faqCardExpanded]}
                activeOpacity={0.8}
                onPress={() => toggleExpand(faq.id)}
              >
                <View style={styles.faqTopRow}>
                  <View style={styles.faqBadge}>
                    <Text style={styles.faqBadgeText}>{faq.course_name}</Text>
                  </View>
                  <Ionicons
                    name={isExpanded ? 'chevron-up' : 'chevron-down'}
                    size={18}
                    color="#888"
                  />
                </View>
                <Text style={styles.faqQuestion} numberOfLines={isExpanded ? undefined : 2}>
                  {faq.question}
                </Text>
                {isExpanded && (
                  <View style={styles.faqAnswerSection}>
                    <View style={styles.faqDivider} />
                    <Text style={styles.faqAnswerLabel}>Answer</Text>
                    <Text style={styles.faqAnswer}>{faq.answer ?? ''}</Text>
                    <TouchableOpacity
                      style={styles.viewFullBtn}
                      activeOpacity={0.7}
                      onPress={() =>
                        router.push({
                          pathname: '/(student)/answer-detail',
                          params: {
                            queryId: faq.id,
                            question: faq.question,
                            answer: faq.answer ?? '',
                            courseName: faq.course_name,
                            teacherId: faq.teacher_id ?? '',
                          },
                        })
                      }
                    >
                      <Text style={styles.viewFullBtnText}>View Full Answer</Text>
                      <Ionicons name="expand-outline" size={16} color="#6C63FF" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            );
          })
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
    marginBottom: 24,
    paddingVertical: 12,
  },
  pageHeaderText: { flex: 1 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#FFFFFF' },
  pageSubtitle: { fontSize: 13, color: '#888', marginTop: 4 },

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
  emptyText: { fontSize: 16, fontWeight: '600', color: '#666' },
  emptySubText: { fontSize: 13, color: '#555' },

  /* FAQ Card */
  faqCard: {
    backgroundColor: '#16213E',
    borderRadius: 16,
    padding: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  faqCardExpanded: {
    borderColor: 'rgba(108, 99, 255, 0.2)',
  },
  faqTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  faqBadge: {
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
  },
  faqBadgeText: { fontSize: 11, fontWeight: '700', color: '#6C63FF', textTransform: 'uppercase' },
  faqQuestion: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', lineHeight: 22 },

  /* Answer section */
  faqAnswerSection: { marginTop: 10 },
  faqDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginBottom: 12,
  },
  faqAnswerLabel: { fontSize: 11, fontWeight: '700', color: '#4ECDC4', textTransform: 'uppercase', marginBottom: 8 },
  faqAnswer: { fontSize: 14, color: '#B0B0B0', lineHeight: 22 },
  viewFullBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    alignSelf: 'flex-end',
  },
  viewFullBtnText: { fontSize: 13, fontWeight: '600', color: '#6C63FF' },
});
