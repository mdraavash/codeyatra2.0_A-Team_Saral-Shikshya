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

interface StudentItem {
  student_id: string;
  student_roll: string;
  student_name: string;
  has_pending: boolean;
}

export default function CourseStudents() {
  const { token } = useAuth();
  const router = useRouter();
  const { courseId, courseName } = useLocalSearchParams<{ courseId: string; courseName: string }>();

  const [students, setStudents] = useState<StudentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}` };

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(API.TEACHER_COURSE_STUDENTS(courseId), { headers });
        if (res.ok) setStudents(await res.json());
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId, token]);

  const pendingCount = students.filter(s => s.has_pending).length;

  return (
    <SafeAreaView style={styles.container}>
      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()} activeOpacity={0.7}>
        <Ionicons name="arrow-back" size={20} color="#FFF" />
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerTitle}>{courseName}</Text>
          <Text style={styles.headerSub}>Student Queries</Text>
          {students.length > 0 && (
            <View style={styles.headerStats}>
              <View style={styles.headerStatItem}>
                <Text style={styles.headerStatNum}>{students.length}</Text>
                <Text style={styles.headerStatLabel}>Students</Text>
              </View>
              <View style={styles.headerStatDivider} />
              <View style={styles.headerStatItem}>
                <Text style={[styles.headerStatNum, { color: '#e67e22' }]}>{pendingCount}</Text>
                <Text style={styles.headerStatLabel}>With Pending</Text>
              </View>
            </View>
          )}
        </View>

        {/* Student List */}
        {loading ? (
          <ActivityIndicator color="#444" style={{ marginTop: 40 }} />
        ) : students.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="people-outline" size={48} color="#888" />
            <Text style={styles.emptyTitle}>No students yet</Text>
            <Text style={styles.emptyText}>Students who ask questions will appear here</Text>
          </View>
        ) : (
          students.map((s) => (
            <TouchableOpacity
              key={s.student_id}
              style={styles.studentCard}
              activeOpacity={0.7}
              onPress={() =>
                router.push({
                  pathname: '/(teacher)/student-queries',
                  params: {
                    courseId,
                    courseName,
                    studentId: s.student_id,
                    studentRoll: s.student_roll,
                    studentName: s.student_name,
                  },
                })
              }
            >
              <View style={[styles.statusDot, s.has_pending ? styles.dotPending : styles.dotClear]} />
              <View style={styles.studentInfo}>
                <Text style={styles.studentRoll}>{s.student_roll}</Text>
                <Text style={styles.studentName}>{s.student_name}</Text>
              </View>
              {s.has_pending && (
                <View style={styles.pendingTag}>
                  <Text style={styles.pendingTagText}>Pending</Text>
                </View>
              )}
              <Ionicons name="chevron-forward" size={18} color="#B7B7B7" />
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#2F2F2F' },
  scrollContent: { paddingHorizontal: 17, paddingTop: 80, paddingBottom: 40 },

  backBtn: {
    position: 'absolute',
    top: 56,
    left: 20,
    zIndex: 10,
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#444444',
    justifyContent: 'center',
    alignItems: 'center',
  },

  /* Header */
  headerCard: {
    backgroundColor: '#444444',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 20,
    elevation: 5,
  },
  headerTitle: { fontSize: 22, fontWeight: '600', color: '#FFF' },
  headerSub: { fontSize: 13, color: '#FFFFFF', marginTop: 4 },
  headerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 18,
    gap: 20,
  },
  headerStatItem: { alignItems: 'center' },
  headerStatNum: { fontSize: 20, fontWeight: '800', color: '#0A3B87' },
  headerStatLabel: { fontSize: 11, color: '#FFFFFF', marginTop: 2 },
  headerStatDivider: { width: 1, height: 30, backgroundColor: '#F5F5F5' },

  /* Student Card */
  studentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#444444',
    borderRadius: 10,
    color: '#f2f2f2',
    paddingHorizontal: 16,
    paddingVertical: 16,
    marginBottom: 10,
  
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  statusDot: { width: 10, height: 10, borderRadius: 5, marginRight: 14 },
  dotPending: { backgroundColor: '#e67e22' },
  dotClear: { backgroundColor: '#2ecc71' },
  studentInfo: { flex: 1 },
  studentRoll: { fontSize: 15, fontWeight: '700', color: '#f2f2f2' },
  studentName: { fontSize: 12, color: '#f2f2f2', marginTop: 2 },
  pendingTag: {
    backgroundColor: 'rgba(230,126,34,0.12)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginRight: 8,
  },
  pendingTagText: { fontSize: 11, fontWeight: '600', color: '#e67e22' },

  /* Empty */
  emptyCard: {
    backgroundColor: '#444444',
    borderRadius: 18,
    padding: 48,
    alignItems: 'center',
    marginTop: 20,
  },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: '#f2f2f2', marginTop: 16 },
  emptyText: { fontSize: 13, color: '#888', marginTop: 6 },
});
