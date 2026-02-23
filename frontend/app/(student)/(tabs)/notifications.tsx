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

interface Notification {
  id: string;
  message: string;
  query_id: string;
  course_id: string;
  read: boolean;
  created_at: string;
}

export default function NotificationsScreen() {
  const { token } = useAuth();
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const headers = { Authorization: `Bearer ${token}` };

  const fetchNotifications = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(API.NOTIFICATIONS, { headers });
      if (res.ok) setNotifications(await res.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { fetchNotifications(); }, [token]));

  const handlePress = (notif: Notification) => {
    fetch(API.NOTIFICATION_READ(notif.id), { method: 'PATCH', headers }).catch(() => {});
    setNotifications((prev) =>
      prev.map((n) => (n.id === notif.id ? { ...n, read: true } : n))
    );
    router.push({
      pathname: '/(student)/queries-answered',
      params: { courseId: notif.course_id, courseName: '' },
    });
  };

  const formatTime = (iso: string) => {
    try {
      const date = new Date(iso);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMin = Math.floor(diffMs / 60000);
      if (diffMin < 1) return 'Just now';
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHrs = Math.floor(diffMin / 60);
      if (diffHrs < 24) return `${diffHrs}h ago`;
      const diffDays = Math.floor(diffHrs / 24);
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#6C63FF" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const unread = notifications.filter((n) => !n.read);
  const read = notifications.filter((n) => n.read);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchNotifications(true)} tintColor="#6C63FF" />
        }
      >
        {/* Page Header */}
        <View style={styles.pageHeader}>
          <Ionicons name="notifications" size={28} color="#6C63FF" />
          <View style={styles.pageHeaderText}>
            <Text style={styles.pageTitle}>Notifications</Text>
            <Text style={styles.pageSubtitle}>{notifications.length} total notifications</Text>
          </View>
        </View>

        {notifications.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="notifications-off-outline" size={40} color="#555" />
            <Text style={styles.emptyText}>No notifications yet</Text>
            <Text style={styles.emptySubText}>You&apos;ll be notified when teachers respond</Text>
          </View>
        ) : (
          <>
            {/* Unread section */}
            {unread.length > 0 && (
              <>
                <View style={styles.sectionLabelRow}>
                  <Text style={styles.sectionLabel}>New</Text>
                  <View style={styles.countBadge}>
                    <Text style={styles.countBadgeText}>{unread.length}</Text>
                  </View>
                </View>
                {unread.map((notif) => (
                  <TouchableOpacity
                    key={notif.id}
                    style={[styles.notifCard, styles.notifUnread]}
                    activeOpacity={0.7}
                    onPress={() => handlePress(notif)}
                  >
                    <View style={styles.notifIconWrap}>
                      <Ionicons name="chatbubble-ellipses" size={20} color="#6C63FF" />
                    </View>
                    <View style={styles.notifContent}>
                      <Text style={styles.notifMessage} numberOfLines={2}>{notif.message}</Text>
                      <Text style={styles.notifTime}>{formatTime(notif.created_at)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#555" />
                  </TouchableOpacity>
                ))}
              </>
            )}

            {/* Read section */}
            {read.length > 0 && (
              <>
                <Text style={[styles.sectionLabel, { marginTop: unread.length > 0 ? 24 : 0 }]}>Earlier</Text>
                {read.map((notif) => (
                  <TouchableOpacity
                    key={notif.id}
                    style={styles.notifCard}
                    activeOpacity={0.7}
                    onPress={() => handlePress(notif)}
                  >
                    <View style={[styles.notifIconWrap, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
                      <Ionicons name="chatbubble-outline" size={20} color="#666" />
                    </View>
                    <View style={styles.notifContent}>
                      <Text style={[styles.notifMessage, { color: '#888' }]} numberOfLines={2}>{notif.message}</Text>
                      <Text style={styles.notifTime}>{formatTime(notif.created_at)}</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={18} color="#444" />
                  </TouchableOpacity>
                ))}
              </>
            )}
          </>
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

  /* Section */
  sectionLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#888',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  countBadge: {
    backgroundColor: '#6C63FF',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginBottom: 14,
  },
  countBadgeText: { fontSize: 11, fontWeight: '700', color: '#FFF' },

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

  /* Notification Card */
  notifCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16213E',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    gap: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
  },
  notifUnread: {
    borderColor: 'rgba(108, 99, 255, 0.2)',
    backgroundColor: 'rgba(108, 99, 255, 0.05)',
  },
  notifIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(108, 99, 255, 0.12)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  notifContent: { flex: 1 },
  notifMessage: { fontSize: 14, fontWeight: '500', color: '#D1D1D1', lineHeight: 20 },
  notifTime: { fontSize: 11, color: '#666', marginTop: 4 },
});
