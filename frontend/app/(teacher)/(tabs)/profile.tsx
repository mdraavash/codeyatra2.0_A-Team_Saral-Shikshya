import React, { useState, useCallback } from 'react';
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
import { Ionicons } from '@expo/vector-icons';
import { API } from '@/constants/api';
import { useFocusEffect } from '@react-navigation/native';

export default function TeacherProfile() {
  const { user, token, logout } = useAuth();
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);
  const [totalQueries, setTotalQueries] = useState(0);
  const [answeredQueries, setAnsweredQueries] = useState(0);
  const [loading, setLoading] = useState(true);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      // Fetch rating
      if (user?.id) {
        const ratingRes = await fetch(API.TEACHER_RATING(user.id), { headers });
        if (ratingRes.ok) {
          const rData = await ratingRes.json();
          setAvgRating(rData.average_rating || 0);
          setTotalRatings(rData.total_ratings || 0);
        }
      }
      // Fetch queries for stats
      const qRes = await fetch(API.QUERIES_TEACHER, { headers });
      if (qRes.ok) {
        const all = await qRes.json();
        setTotalQueries(all.length);
        setAnsweredQueries(all.filter((q: { answered: boolean }) => q.answered).length);
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { fetchData(); }, [token]));

  const starLabels = ['Poor', 'Below Average', 'Average', 'Good', 'Excellent'];

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.screenTitle}>Profile</Text>

        {/* Avatar + Info */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name ?? 'T').charAt(0).toUpperCase()}</Text>
          </View>
          <Text style={styles.profileName}>{user?.name ?? 'Teacher'}</Text>
          <Text style={styles.profileRole}>Professor</Text>
          <View style={styles.profileDivider} />
          <View style={styles.profileInfoRow}>
            <Ionicons name="id-card-outline" size={16} color="rgba(255,255,255,0.4)" />
            <Text style={styles.profileInfoText}>{user?.roll ?? 'N/A'}</Text>
          </View>
        </View>

        {/* Rating Card */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingTitle}>Your Rating</Text>
          <View style={styles.ratingStarsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.round(avgRating) ? 'star' : star - 0.5 <= avgRating ? 'star-half' : 'star-outline'}
                size={28}
                color={star <= Math.round(avgRating) ? '#FFD93D' : 'rgba(255,255,255,0.2)'}
              />
            ))}
          </View>
          <Text style={styles.ratingValue}>
            {avgRating > 0 ? `${avgRating.toFixed(1)} / 5.0` : 'No ratings yet'}
          </Text>
          {avgRating > 0 && (
            <Text style={styles.ratingLabel}>{starLabels[Math.min(Math.round(avgRating) - 1, 4)]}</Text>
          )}
          <Text style={styles.ratingCount}>
            {totalRatings > 0
              ? `Based on ${totalRatings} student rating${totalRatings > 1 ? 's' : ''}`
              : 'Students will rate your answers'}
          </Text>
        </View>

        {/* Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#6C63FF' }]}>{totalQueries}</Text>
            <Text style={styles.statLabel}>Total Queries</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#4ECDC4' }]}>{answeredQueries}</Text>
            <Text style={styles.statLabel}>Answered</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statNum, { color: '#FF6B6B' }]}>{totalQueries - answeredQueries}</Text>
            <Text style={styles.statLabel}>Pending</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1A1A2E' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 110 },

  screenTitle: { fontSize: 28, fontWeight: '800', color: '#FFF', marginBottom: 20 },

  /* Profile Card */
  profileCard: {
    backgroundColor: '#16213E',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108,99,255,0.15)',
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  avatarText: { fontSize: 30, fontWeight: '700', color: '#FFF' },
  profileName: { fontSize: 22, fontWeight: '700', color: '#FFF' },
  profileRole: { fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 },
  profileDivider: {
    width: '60%',
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.08)',
    marginVertical: 18,
  },
  profileInfoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileInfoText: { fontSize: 14, color: 'rgba(255,255,255,0.6)' },

  /* Rating */
  ratingCard: {
    backgroundColor: '#16213E',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 61, 0.12)',
  },
  ratingTitle: { fontSize: 16, fontWeight: '700', color: '#FFF', marginBottom: 14 },
  ratingStarsRow: { flexDirection: 'row', gap: 6, marginBottom: 10 },
  ratingValue: { fontSize: 22, fontWeight: '800', color: '#FFD93D' },
  ratingLabel: { fontSize: 14, fontWeight: '600', color: 'rgba(255, 217, 61, 0.7)', marginTop: 4 },
  ratingCount: { fontSize: 12, color: 'rgba(255,255,255,0.4)', marginTop: 8 },

  /* Stats */
  statsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  statCard: {
    flex: 1,
    backgroundColor: '#16213E',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  statNum: { fontSize: 22, fontWeight: '800' },
  statLabel: { fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 4, fontWeight: '600' },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B6B',
    height: 54,
    borderRadius: 16,
    marginTop: 28,
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
});
