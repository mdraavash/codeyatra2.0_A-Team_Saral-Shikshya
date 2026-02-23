import React, { useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { API } from '@/constants/api';
import { useFocusEffect } from '@react-navigation/native';

interface Subject {
  id: string;
  name: string;
  teacher_id: string;
  teacher_name: string;
}

interface Notification {
  id: string;
  message: string;
  query_id: string;
  course_id: string;
  read: boolean;
  created_at: string;
}

export default function TeacherHome() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [avgRating, setAvgRating] = useState(0);
  const [totalRatings, setTotalRatings] = useState(0);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [coursesRes, notifsRes] = await Promise.all([
        fetch(API.TEACHING_SUBJECTS, { headers }),
        fetch(API.NOTIFICATIONS, { headers }),
      ]);
      if (coursesRes.ok) setSubjects(await coursesRes.json());
      if (notifsRes.ok) setNotifications(await notifsRes.json());
      // Fetch teacher rating
      if (user?.id) {
        try {
          const ratingRes = await fetch(API.TEACHER_RATING(user.id), { headers });
          if (ratingRes.ok) {
            const rData = await ratingRes.json();
            setAvgRating(rData.average_rating || 0);
            setTotalRatings(rData.total_ratings || 0);
          }
        } catch { /* silent */ }
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { fetchData(); }, [token]));

  const handleNotifPress = (notif: Notification) => {
    fetch(API.NOTIFICATION_READ(notif.id), { method: 'PATCH', headers }).catch(() => {});
    if (notif.course_id) {
      const subj = subjects.find(s => s.id === notif.course_id);
      router.push({
        pathname: '/(teacher)/course-students',
        params: { courseId: notif.course_id, courseName: subj?.name ?? '' },
      });
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFF" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <Text style={styles.userName}>{user?.name ?? 'Teacher'}</Text>
          <Text style={styles.userId}>{user?.roll ?? ''}</Text>
        </View>

        {/* Rating Card */}
        <View style={styles.ratingCard}>
          <View style={styles.ratingStars}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Ionicons
                key={star}
                name={star <= Math.round(avgRating) ? 'star' : star - 0.5 <= avgRating ? 'star-half' : 'star-outline'}
                size={22}
                color={star <= Math.round(avgRating) ? '#FFD93D' : '#888'}
              />
            ))}
          </View>
          <Text style={styles.ratingText}>
            {avgRating > 0 ? `${avgRating.toFixed(1)} / 5.0` : 'No ratings yet'}
          </Text>
          <Text style={styles.ratingCount}>
            {totalRatings > 0 ? `Based on ${totalRatings} student rating${totalRatings > 1 ? 's' : ''}` : 'Students will rate your answers'}
          </Text>
        </View>

        {/* Notifications preview */}
        <Text style={styles.sectionTitle}>Notification</Text>
        {notifications.length === 0 ? (
          <Text style={styles.emptyText}>No notifications yet</Text>
        ) : (
          notifications.slice(0, 3).map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={styles.notifCard}
              activeOpacity={0.7}
              onPress={() => handleNotifPress(notif)}
            >
              <Text style={styles.notifText} numberOfLines={1}>
                {notif.message}
              </Text>
              <View style={styles.notifArrowWrap}>
                <Text style={styles.notifArrow}>{'>'}</Text>
              </View>
            </TouchableOpacity>
          ))
        )}

        
        <Text style={styles.sectionTitle}>Taught Courses</Text>
        {subjects.length === 0 ? (
          <Text style={styles.emptyText}>No courses assigned yet</Text>
        ) : (
          <View style={styles.coursesGrid}>
            {subjects.map((subj) => (
              <TouchableOpacity
                key={subj.id}
                style={styles.courseCard}
                activeOpacity={0.7}
                onPress={() =>
                  router.push({
                    pathname: '/(teacher)/course-students',
                    params: { courseId: subj.id, courseName: subj.name },
                  })
                }
              >
                <MaterialCommunityIcons name="database" size={33} color="#FFFFFF" style={styles.courseIcon} />
                <Text style={styles.courseName}>{subj.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Logout */}
        <TouchableOpacity style={styles.logoutBtn} activeOpacity={0.7} onPress={logout}>
          <Ionicons name="log-out-outline" size={20} color="#FFF" />
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Nav Bar */}
      <View style={styles.navBar}>
        <TouchableOpacity style={[styles.navItem, styles.navItemActive]}>
          <Ionicons name="home-outline" size={22} color="#000" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="chatbox-outline" size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="heart-outline" size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="time-outline" size={22} color="#FFF" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={22} color="#FFF" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const CARD_GAP = 16;
const GRID_PADDING = 17;
const CARD_WIDTH = (width - GRID_PADDING * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2F2F2F' },
  scrollContent: { paddingHorizontal: 17, paddingTop: 12, paddingBottom: 120 },

  /* Intro */
  introCard: {
    width: '100%',
    height: 120,
    backgroundColor: '#444444',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  userName: { fontSize: 22, fontWeight: '600', textAlign: 'center', color: '#FFFFFF', lineHeight: 33 },
  userId: { fontSize: 12, textAlign: 'center', color: '#FFFFFF', marginTop: 2, letterSpacing: 0.18 },

  /* Rating Card */
  ratingCard: {
    backgroundColor: '#3A3A3A',
    borderRadius: 16,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 61, 0.15)',
  },
  ratingStars: { flexDirection: 'row', gap: 4, marginBottom: 8 },
  ratingText: { fontSize: 18, fontWeight: '700', color: '#FFD93D' },
  ratingCount: { fontSize: 12, color: '#AAA', marginTop: 4 },

  /* Section Title */
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.21,
    marginTop: 24,
    marginBottom: 14,
  },
  emptyText: { fontSize: 13, color: '#888', marginBottom: 8 },

  /* Notification Card */
  notifCard: {
    width: '100%',
    minHeight: 51,
    backgroundColor: '#6F6F6F',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  notifText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#F2F2F2', letterSpacing: 0.21 },
  notifArrowWrap: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    backgroundColor: '#444444',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  notifArrow: { fontSize: 20, color: '#FFFFFF', marginTop: -2 },

  /* Course Grid */
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  courseCard: {
    width: CARD_WIDTH,
    height: 95,
    backgroundColor: '#6F6F6F',
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#C4C4C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  courseIcon: { marginBottom: 4 },
  courseName: { fontSize: 16, textAlign: 'center', color: '#FFFFFF' },

  /* Logout */
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e74c3c',
    height: 50,
    borderRadius: 25,
    marginTop: 30,
    gap: 8,
  },
  logoutText: { fontSize: 16, fontWeight: '600', color: '#FFF' },

  /* Bottom Nav */
  navBar: {
    position: 'absolute',
    bottom: 24,
    left: 32,
    right: 32,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(176, 137, 137, 0.13)',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  navItem: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: { backgroundColor: '#FFFFFF' },
});
