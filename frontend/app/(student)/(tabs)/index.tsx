import React, { useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
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

const COURSE_ICONS: (keyof typeof MaterialCommunityIcons.glyphMap)[] = [
  'book-open-variant',
  'atom',
  'calculator-variant',
  'flask',
  'code-tags',
  'database',
  'chart-line',
  'microscope',
];

export default function StudentHome() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const [coursesRes, notifsRes] = await Promise.all([
        fetch(API.SUBJECTS, { headers }),
        fetch(API.NOTIFICATIONS, { headers }),
      ]);
      if (coursesRes.ok) setSubjects(await coursesRes.json());
      if (notifsRes.ok) setNotifications(await notifsRes.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  
  useFocusEffect(useCallback(() => { fetchData(); }, [token]));

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleNotifPress = (notif: Notification) => {
    fetch(API.NOTIFICATION_READ(notif.id), { method: 'PATCH', headers }).catch(() => {});
    router.push({
      pathname: '/(student)/queries-answered',
      params: { courseId: notif.course_id, courseName: '' },
    });
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
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchData(true)} tintColor="#6C63FF" />
        }
      >
       
        <View style={styles.headerCard}>
          <View style={styles.headerLeft}>
            <View style={styles.avatarCircle}>
              <Ionicons name="person" size={28} color="#2F2F2F" />
            </View>
            <View style={styles.headerInfo}>
              <Text style={styles.greeting}>Welcome back,</Text>
              <Text style={styles.userName}>{user?.name ?? 'Student'}</Text>
              <Text style={styles.userRoll}>{user?.roll ?? ''}</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.logoutIconBtn} onPress={logout} activeOpacity={0.7}>
            <Ionicons name="log-out-outline" size={20} color="#FF6B6B" />
          </TouchableOpacity>
        </View>

        {/* Quick Notifications Preview */}
        {unreadCount > 0 && (
          <View style={styles.alertBanner}>
            <Ionicons name="notifications" size={18} color="#FFD93D" />
            <Text style={styles.alertText}>
              You have {unreadCount} unread notification{unreadCount > 1 ? 's' : ''}
            </Text>
          </View>
        )}

        {/* Recent Notifications */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          {notifications.length > 0 && (
            <TouchableOpacity onPress={() => router.navigate('/(student)/(tabs)/notifications' as never)}>
              <Text style={styles.viewAllLink}>View all</Text>
            </TouchableOpacity>
          )}
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={32} color="#555" />
            <Text style={styles.emptyText}>No notifications yet</Text>
          </View>
        ) : (
          notifications.slice(0, 3).map((notif) => (
            <TouchableOpacity
              key={notif.id}
              style={[styles.notifCard, !notif.read && styles.notifCardUnread]}
              activeOpacity={0.7}
              onPress={() => handleNotifPress(notif)}
            >
              <View style={[styles.notifDot, !notif.read && styles.notifDotActive]} />
              <Text style={styles.notifText} numberOfLines={1}>
                {notif.message}
              </Text>
              <Ionicons name="chevron-forward" size={18} color="#888" />
            </TouchableOpacity>
          ))
        )}

        {/* Enrolled Courses */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Enrolled Courses</Text>
        {subjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="school-outline" size={32} color="#555" />
            <Text style={styles.emptyText}>No courses enrolled yet</Text>
          </View>
        ) : (
          <View style={styles.coursesGrid}>
            {subjects.map((subj, idx) => (
              <TouchableOpacity
                key={subj.id}
                style={styles.courseCard}
                activeOpacity={0.8}
                onPress={() =>
                  router.push({
                    pathname: '/(student)/course-detail',
                    params: {
                      courseId: subj.id,
                      courseName: subj.name,
                      teacherName: subj.teacher_name,
                    },
                  })
                }
              >
                <View style={[styles.courseIconWrap, { backgroundColor: CARD_COLORS[idx % CARD_COLORS.length] }]}>
                  <MaterialCommunityIcons
                    name={COURSE_ICONS[idx % COURSE_ICONS.length]}
                    size={26}
                    color="#FFF"
                  />
                </View>
                <Text style={styles.courseName} numberOfLines={2}>{subj.name}</Text>
                <Text style={styles.courseTeacher} numberOfLines={1}>{subj.teacher_name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const GRID_PADDING = 20;
const COL_GAP = 16;
const CARD_WIDTH = (width - GRID_PADDING * 2 - COL_GAP) / 2;

const CARD_COLORS = ['#6C63FF', '#FF6B6B', '#4ECDC4', '#FFD93D', '#A855F7', '#F97316'];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2F2F2F' },
  scrollContent: { paddingHorizontal: GRID_PADDING, paddingTop: 8, paddingBottom: 110 },

  /* Header */
  headerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#444444',
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  avatarCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(108, 99, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerInfo: { flex: 1 },
  greeting: { fontSize: 12, color: '#888', letterSpacing: 0.3 },
  userName: { fontSize: 20, fontWeight: '700', color: '#F5F5F5', marginTop: 2 },
  userRoll: { fontSize: 12, color: '#F5F5F5', marginTop: 2, letterSpacing: 0.2 },
  logoutIconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Alert Banner */
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 217, 61, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
    gap: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 217, 61, 0.2)',
  },
  alertText: { fontSize: 13, color: '#FFD93D', fontWeight: '500' },

  /* Section */
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.2,
    marginBottom: 14,
  },
  viewAllLink: {
    fontSize: 13,
    color: '#F5F5F5',
    fontWeight: '600',
    marginBottom: 14,
  },

  /* Empty state */
  emptyCard: {
    backgroundColor: '#444444',
    borderRadius: 16,
    paddingVertical: 30,
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  emptyText: { fontSize: 13, color: '#666' },

  
  notifCard: {
    backgroundColor: '#444444',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  notifCardUnread: {
    borderColor: 'rgba(108, 99, 255, 0.3)',
    backgroundColor: 'rgba(108, 99, 255, 0.06)',
  },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'transparent',
  },
  notifDotActive: { backgroundColor: '#6C63FF' },
  notifText: { flex: 1, fontSize: 14, fontWeight: '500', color: '#D1D1D1', letterSpacing: 0.1 },

  /* Course Grid */
  coursesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: COL_GAP,
    rowGap: 5,
  },
  courseCard: {
    width: CARD_WIDTH,
    backgroundColor: '#444444',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  courseIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  courseName: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: 4 },
  courseTeacher: { fontSize: 12, color: '#888', letterSpacing: 0.1 },
});
