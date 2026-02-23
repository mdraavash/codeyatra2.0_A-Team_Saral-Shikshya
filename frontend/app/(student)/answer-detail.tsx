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
        Alert.alert('Thank you!', existingRating ? 'Your rating has been updated.' : 'Your rating has been submitted successfully.');
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
            disabled={!interactive}
            activeOpacity={interactive ? 0.6 : 1}
            style={styles.starBtn}
          >
            <Ionicons
              name={star <= rating ? 'star' : 'star-outline'}
              size={interactive ? 36 : 20}
              color={star <= rating ? '#FFD700' : '#B7B7B7'}
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
            <Ionicons name="help-circle" size={18} color="#0A3B87" />
            <Text style={styles.sectionLabel}>Question</Text>
          </View>
          <Text style={styles.questionText}>{question}</Text>
        </View>

        {/* Answer Section */}
        <View style={styles.section}>
          <View style={styles.sectionLabelRow}>
            <Ionicons name="chatbubble-ellipses" size={18} color="#2ecc71" />
            <Text style={[styles.sectionLabel, { color: '#2ecc71' }]}>Answer</Text>
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
              ? 'Tap the stars to update your rating'
              : 'Help us improve by rating your teacher\'s response'}
          </Text>

          {loadingRating ? (
            <ActivityIndicator color="#444" style={{ marginTop: 20 }} />
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

              <TouchableOpacity
                style={[styles.submitBtn, (rating === 0 || (existingRating !== null && rating === existingRating)) && styles.submitBtnDisabled]}
                onPress={handleSubmitRating}
                disabled={submitting || rating === 0 || (existingRating !== null && rating === existingRating)}
                activeOpacity={0.7}
              >
                {submitting ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Ionicons name={existingRating ? 'create-outline' : 'send'} size={18} color="#FFF" />
                    <Text style={styles.submitBtnText}>{existingRating ? 'Update Rating' : 'Submit Rating'}</Text>
                  </>
                )}
              </TouchableOpacity>

              {existingRating && rating === existingRating && (
                <View style={styles.submittedBadge}>
                  <Ionicons name="checkmark-circle" size={18} color="#2ecc71" />
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
  container: { flex: 1, backgroundColor: '#2F2F2F' },

  /* Header */
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

  /* Sections */
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#C4C4C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
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
    color: '#0A3B87',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  questionText: {
    fontSize: 17,
    fontWeight: '600',
    color: '#2F2F2F',
    lineHeight: 26,
  },
  answerText: {
    fontSize: 16,
    color: '#888',
    lineHeight: 26,
  },

  /* Divider */
  divider: {
    height: 1,
    backgroundColor: '#444444',
    marginVertical: 8,
  },

  /* Rating Section */
  ratingSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#C4C4C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#2F2F2F',
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
    color: '#FFD700',
    marginBottom: 20,
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#0A3B87',
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
    backgroundColor: 'rgba(46, 204, 113, 0.1)',
  },
  submittedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2ecc71',
  },
});
