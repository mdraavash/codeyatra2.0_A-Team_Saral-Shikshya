import React, { useState, useEffect } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { API } from '@/constants/api';

export default function AnswerDetail() {
  const { token } = useAuth();
  const router = useRouter();
  const { queryId, question, answer, courseName, teacherId } = useLocalSearchParams<{
    queryId: string;
    question: string;
    answer: string;
    courseName: string;
    teacherId: string;
  }>();

  const [rating, setRating] = useState(0);
  const [existingRating, setExistingRating] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [loadingRating, setLoadingRating] = useState(true);

  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Check if student already rated this query
  useEffect(() => {
    const checkRating = async () => {
      try {
        const res = await fetch(API.QUERY_RATING(queryId), {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          if (data.rating) {
            setExistingRating(data.rating);
            setRating(data.rating);
          }
        }
      } catch {
        // silent
      } finally {
        setLoadingRating(false);
      }
    };
    checkRating();
  }, [queryId, token]);

  const handleSubmitRating = async () => {
    if (rating === 0) {
      Alert.alert('Rating Required', 'Please select a star rating before submitting.');
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch(API.RATE_TEACHER, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          query_id: queryId,
          teacher_id: teacherId,
          rating,
        }),
      });
      if (res.ok) {
        setExistingRating(rating);
        Alert.alert('Thank you!', 'Your rating has been submitted successfully.');
      } else {
        const data = await res.json();
        Alert.alert('Error', data.detail || 'Failed to submit rating');
      }
    } catch {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (interactive: boolean) => {
    return (
      <View style={styles.starsRow}>
        {[1, 2, 3, 4, 5].map((star) => (
          <TouchableOpacity
            key={star}
            onPress={() => interactive && setRating(star)}
            disabled={!interactive || !!existingRating}
            activeOpacity={interactive ? 0.6 : 1}
            style={styles.starBtn}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={interactive ? 36 : 20}
              color={star <= rating ? '#FFD93D' : '#555'}
            />
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header Bar */}
      <View style={styles.headerBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle} numberOfLines={1}>Answer Detail</Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>{courseName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Question Section */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Ionicons name="help-circle" size={18} color="#6C63FF" />
            <Text style={styles.sectionLabel}>Question</Text>
          </View>
          <Text style={styles.questionText}>{question}</Text>
        </View>

        {/* Answer Section */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#4ECDC4" />
            <Text style={[styles.sectionLabel, { color: '#4ECDC4' }]}>Answer</Text>
          </View>
          <Text style={styles.answerText}>{answer}</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Rating Section */}
        <View style={styles.ratingSection}>
          <Text style={styles.ratingTitle}>
            {existingRating ? 'Your Rating' : 'Rate this Answer'}
          </Text>
          <Text style={styles.ratingSubtitle}>
            {existingRating
              ? 'Thanks for your feedback!'
              : 'Help us improve by rating your teacher\'s response'}
          </Text>

          {loadingRating ? (
            <ActivityIndicator color="#6C63FF" style={{ marginTop: 20 }} />
          ) : (
            <>
              {renderStars(true)}

              {rating > 0 && (
                <Text style={styles.ratingLabel}>
                  {rating === 1 && 'Poor'}
                  {rating === 2 && 'Below Average'}
                  {rating === 3 && 'Average'}
                  {rating === 4 && 'Good'}
                  {rating === 5 && 'Excellent'}
                </Text>
              )}

              {!existingRating && (
                <TouchableOpacity
                  style={[styles.submitBtn, rating === 0 && styles.submitBtnDisabled]}
                  onPress={handleSubmitRating}
                  disabled={submitting || rating === 0}
                  activeOpacity={0.7}
                >
                  {submitting ? (
                    <ActivityIndicator color="#FFF" size="small" />
                  ) : (
                    <>
                      <Ionicons name="send" size={18} color="#FFF" />
                      <Text style={styles.submitBtnText}>Submit Rating</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {existingRating && (
                <View style={styles.submittedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#4ECDC4" />
                  <Text style={styles.submittedText}>Rating submitted</Text>
                </View>
              )}
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },

  /* Header */
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitleWrap: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  headerSubtitle: { fontSize: 12, color: '#6C63FF', marginTop: 2 },

  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 40 },

  /* Sections */
  section: {
    backgroundColor: '#16213E',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6C63FF',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FFFFFF',
    lineHeight: 26,
  },
  answerText: {
    fontSize: 16,
    color: '#C8C8C8',
    lineHeight: 26,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    marginVertical: 8,
  },

  /* Rating Section */
  ratingSection: {
    backgroundColor: '#16213E',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  ratingSubtitle: {
    fontSize: 13,
    color: '#888',
    textAlign: 'center',
    marginBottom: 20,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  starBtn: {
    padding: 4,
  },
  ratingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFD93D',
    marginBottom: 20,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#6C63FF',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 25,
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.4,
  },
  submitBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  submittedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(78, 205, 196, 0.1)',
  },
  submittedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4ECDC4',
  },
});
