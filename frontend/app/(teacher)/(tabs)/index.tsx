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

const SUBJECT_COLORS = ['#0A3B87', '#2ecc71', '#e74c3c', '#FFD700', '#45B7D1', '#96CEB4', '#FF8A65', '#AB47BC'];
const SUBJECT_ICONS: (keyof typeof MaterialCommunityIcons.glyphMap)[] = [
  'atom', 'brain', 'code-braces', 'flask', 'calculator-variant', 'chip', 'database', 'earth',
];

export default function TeacherHome() {
  const { user, token } = useAuth();
  const router = useRouter();
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchData = async () => {
    try {
      const [coursesRes, notifsRes] = await Promise.all([
        fetch(API.TEACHING_SUBJECTS, { headers }),
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

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { fetchData(); }, [token]));

  const onRefresh = () => { setRefreshing(true); fetchData(); };

  const unreadCount = notifications.filter(n => !n.read).length;

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
        <ActivityIndicator size="large" color="#444" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#444" />}
      >
        {/* Header Card */}
        <View style={styles.headerCard}>
          <View style={styles.headerAvatar}>
            <Text style={styles.avatarText}>
              {(user?.name ?? 'T').charAt(0).toUpperCase()}
            </Text>
          </View>
          <Text style={styles.headerName}>{user?.name ?? 'Teacher'}</Text>
          <Text style={styles.headerSub}>Professor · {user?.roll ?? ''}</Text>
        </View>

        {/* Notification Alert */}
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.alertBanner}
            activeOpacity={0.8}
            onPress={() => {
              const firstUnread = notifications.find(n => !n.read);
              if (firstUnread) handleNotifPress(firstUnread);
            }}
          >
            <View style={styles.alertIconWrap}>
              <Ionicons name="notifications" size={18} color="#FFD700" />
            </View>
            <Text style={styles.alertText}>
              You have {unreadCount} new notification{unreadCount > 1 ? 's' : ''}
            </Text>
            <Ionicons name="chevron-forward" size={18} color="#888" />
          </TouchableOpacity>
        )}

        {/* Quick Notification Preview */}
        {notifications.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Recent Notifications</Text>
            {notifications.slice(0, 3).map((notif) => (
              <TouchableOpacity
                key={notif.id}
                style={[styles.notifCard, !notif.read && styles.notifUnread]}
                activeOpacity={0.7}
                onPress={() => handleNotifPress(notif)}
              >
                <View style={[styles.notifDot, !notif.read && styles.notifDotActive]} />
                <Text style={styles.notifText} numberOfLines={1}>{notif.message}</Text>
                <Ionicons name="chevron-forward" size={18} color="#B7B7B7" />
              </TouchableOpacity>
            ))}
          </>
        )}

        {/* Subjects */}
        <Text style={styles.sectionTitle}>Subjects</Text>
        {subjects.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="book-outline" size={40} color="#888" />
            <Text style={styles.emptyText}>No subjects assigned yet</Text>
          </View>
        ) : (
          <View style={styles.subjectsGrid}>
            {subjects.map((subj, idx) => {
              const color = SUBJECT_COLORS[idx % SUBJECT_COLORS.length];
              const icon = SUBJECT_ICONS[idx % SUBJECT_ICONS.length];
              return (
                <TouchableOpacity
                  key={subj.id}
                  style={styles.subjectCard}
                  activeOpacity={0.7}
                  onPress={() =>
                    router.push({
                      pathname: '/(teacher)/course-students',
                      params: { courseId: subj.id, courseName: subj.name },
                    })
                  }
                >
                  <View style={[styles.subjectIconWrap, { backgroundColor: color + '20' }]}>
                    <MaterialCommunityIcons name={icon} size={28} color={color} />
                  </View>
                  <Text style={styles.subjectName} numberOfLines={2}>{subj.name}</Text>
                  <Ionicons name="chevron-forward" size={14} color="#B7B7B7" style={{ marginTop: 4 }} />
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');
const CARD_GAP = 14;
const GRID_PAD = 20;
const CARD_W = (width - GRID_PAD * 2 - CARD_GAP) / 2;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2F2F2F' },
  scrollContent: { paddingHorizontal: 17, paddingTop: 12, paddingBottom: 120 },

  /* Header */
  headerCard: {
    backgroundColor: '#444444',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  headerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#0A3B87',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  avatarText: { fontSize: 24, fontWeight: '700', color: '#FFF' },
  headerName: { fontSize: 22, fontWeight: '600', color: '#FFFFFF', lineHeight: 33 },
  headerSub: { fontSize: 12, color: '#FFFFFF', marginTop: 2, letterSpacing: 0.18 },

  /* Alert */
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFD700',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  alertIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 215, 0, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  alertText: { flex: 1, fontSize: 13, fontWeight: '600', color: '#2F2F2F' },

  /* Section */
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.21,
    marginTop: 24,
    marginBottom: 14,
  },

  /* Notification */
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  notifUnread: { borderLeftWidth: 4, borderLeftColor: '#FFD700' },
  notifDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#B7B7B7',
    marginRight: 12,
  },
  notifDotActive: { backgroundColor: '#FFD700' },
  notifText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#2F2F2F', letterSpacing: 0.21 },

  /* Subjects Grid */
  subjectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  subjectCard: {
    width: CARD_W,
    backgroundColor: '#FFFFFF',
    borderRadius: 25,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#C4C4C4',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  subjectIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  subjectName: { fontSize: 14, fontWeight: '600', color: '#2F2F2F', textAlign: 'center' },

  /* Empty */
  emptyCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: '#888', marginTop: 12 },
});
