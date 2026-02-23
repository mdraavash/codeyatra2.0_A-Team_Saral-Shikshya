import React, { useState, useCallback } from 'react';
import {
  Text,
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { API } from '@/constants/api';
import { useFocusEffect } from '@react-navigation/native';

type Tab = 'teachers' | 'subjects' | 'students' | 'queries';

interface Teacher {
  id: string;
  name: string;
  email: string;
  roll: string;
  average_rating?: number;
  total_ratings?: number;
}

interface Subject {
  id: string;
  name: string;
  teacher_id: string;
  teacher_name: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  roll: string;
}

interface Query {
  id: string;
  course_id: string;
  course_name: string;
  student_id: string;
  student_name: string;
  student_roll: string;
  question: string;
  answer: string | null;
  answered: boolean;
  created_at: string;
  answered_at: string | null;
}

export default function AdminDashboard() {
  const { user, token, logout } = useAuth();
  const [tab, setTab] = useState<Tab>('teachers');

  // Teachers state
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [tName, setTName] = useState('');
  const [tEmail, setTEmail] = useState('');
  const [tPassword, setTPassword] = useState('');
  const [tRoll, setTRoll] = useState('');
  const [tLoading, setTLoading] = useState(false);

  // Subjects state
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [sName, setSName] = useState('');
  const [selectedTeacherId, setSelectedTeacherId] = useState('');
  const [sLoading, setSLoading] = useState(false);
  const [showTeacherPicker, setShowTeacherPicker] = useState(false);

  // Students state
  const [students, setStudents] = useState<Student[]>([]);
  const [stName, setStName] = useState('');
  const [stEmail, setStEmail] = useState('');
  const [stPassword, setStPassword] = useState('');
  const [stRoll, setStRoll] = useState('');
  const [stLoading, setStLoading] = useState(false);

  // Queries state
  const [queries, setQueries] = useState<Query[]>([]);
  const [queryFilter, setQueryFilter] = useState<'all' | 'pending' | 'answered'>('all');
  const [expandedQuery, setExpandedQuery] = useState<string | null>(null);

  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchAll = async () => {
    try {
      const [tRes, sRes, stuRes, qRes] = await Promise.all([
        fetch(API.ADMIN_TEACHERS, { headers }),
        fetch(API.ADMIN_SUBJECTS, { headers }),
        fetch(API.ADMIN_STUDENTS, { headers }),
        fetch(API.ADMIN_QUERIES, { headers }),
      ]);
      if (tRes.ok) setTeachers(await tRes.json());
      if (sRes.ok) setSubjects(await sRes.json());
      if (stuRes.ok) setStudents(await stuRes.json());
      if (qRes.ok) setQueries(await qRes.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(useCallback(() => { fetchAll(); }, [token]));

  const handleCreateTeacher = async () => {
    if (!tName.trim() || !tEmail.trim() || !tPassword.trim()) {
      Alert.alert('Error', 'Name, email and password are required');
      return;
    }
    setTLoading(true);
    try {
      const res = await fetch(API.ADMIN_TEACHERS, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: tName.trim(),
          email: tEmail.trim(),
          password: tPassword.trim(),
          roll: tRoll.trim(),
          role: 'teacher',
        }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Teacher created!');
        setTName(''); setTEmail(''); setTPassword(''); setTRoll('');
        fetchAll();
      } else {
        const d = await res.json();
        Alert.alert('Error', d.detail || 'Failed');
      }
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setTLoading(false);
    }
  };

  const handleDeleteTeacher = (t: Teacher) => {
    Alert.alert('Delete Teacher', `Remove "${t.name}" and all assigned subjects?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await fetch(API.ADMIN_DELETE_TEACHER(t.id), { method: 'DELETE', headers });
            fetchAll();
          } catch { /* silent */ }
        },
      },
    ]);
  };

  const handleCreateSubject = async () => {
    if (!sName.trim() || !selectedTeacherId) {
      Alert.alert('Error', 'Subject name and teacher are required');
      return;
    }
    setSLoading(true);
    try {
      const res = await fetch(API.ADMIN_SUBJECTS, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: sName.trim(),
          teacher_id: selectedTeacherId,
          teacher_name: teachers.find(t => t.id === selectedTeacherId)?.name ?? '',
        }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Subject created and assigned!');
        setSName(''); setSelectedTeacherId('');
        fetchAll();
      } else {
        const d = await res.json();
        Alert.alert('Error', d.detail || 'Failed');
      }
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setSLoading(false);
    }
  };

  const handleDeleteSubject = (s: Subject) => {
    Alert.alert('Delete Subject', `Remove "${s.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await fetch(API.ADMIN_DELETE_SUBJECT(s.id), { method: 'DELETE', headers });
            fetchAll();
          } catch { /* silent */ }
        },
      },
    ]);
  };

 
  const handleCreateStudent = async () => {
    if (!stName.trim() || !stEmail.trim() || !stPassword.trim()) {
      Alert.alert('Error', 'Name, email and password are required');
      return;
    }
    setStLoading(true);
    try {
      const res = await fetch(API.ADMIN_STUDENTS, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: stName.trim(),
          email: stEmail.trim(),
          password: stPassword.trim(),
          roll: stRoll.trim(),
          role: 'student',
        }),
      });
      if (res.ok) {
        Alert.alert('Success', 'Student created!');
        setStName(''); setStEmail(''); setStPassword(''); setStRoll('');
        fetchAll();
      } else {
        const d = await res.json();
        Alert.alert('Error', d.detail || 'Failed');
      }
    } catch {
      Alert.alert('Error', 'Network error');
    } finally {
      setStLoading(false);
    }
  };

  const handleDeleteStudent = (s: Student) => {
    Alert.alert('Delete Student', `Remove "${s.name}" and all their queries?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive', onPress: async () => {
          try {
            await fetch(API.ADMIN_DELETE_STUDENT(s.id), { method: 'DELETE', headers });
            fetchAll();
          } catch { /* silent */ }
        },
      },
    ]);
  };

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFF" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  const renderTeachers = () => (
    <>
      {/* Create form */}
      <Text style={styles.formLabel}>Create New Teacher</Text>
      <View style={styles.formCard}>
        <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#999" value={tName} onChangeText={setTName} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={tEmail} onChangeText={setTEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" value={tPassword} onChangeText={setTPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Roll / Title (e.g. Professor – KHCE)" placeholderTextColor="#999" value={tRoll} onChangeText={setTRoll} />
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateTeacher} disabled={tLoading} activeOpacity={0.7}>
          <Text style={styles.createBtnText}>{tLoading ? 'Creating...' : 'Create Teacher'}</Text>
        </TouchableOpacity>
      </View>

    
      <Text style={styles.formLabel}>All Teachers ({teachers.length})</Text>
      {teachers.length === 0 ? (
        <Text style={styles.emptyText}>No teachers yet</Text>
      ) : (
        teachers.map(t => (
          <View key={t.id} style={styles.listCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.listName}>{t.name}</Text>
              <Text style={styles.listSub}>{t.email}</Text>
              {t.roll ? <Text style={styles.listSub}>{t.roll}</Text> : null}
              <View style={styles.ratingRow}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <Ionicons
                    key={star}
                    name={star <= Math.round(t.average_rating ?? 0) ? 'star' : 'star-outline'}
                    size={14}
                    color={star <= Math.round(t.average_rating ?? 0) ? '#FFD93D' : '#CCC'}
                  />
                ))}
                <Text style={styles.ratingLabel}>
                  {(t.average_rating ?? 0) > 0
                    ? `${(t.average_rating ?? 0).toFixed(1)} (${t.total_ratings ?? 0})`
                    : 'No ratings'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDeleteTeacher(t)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </>
  );

  const renderSubjects = () => (
    <>
      {/* Create form */}
      <Text style={styles.formLabel}>Create New Subject</Text>
      <View style={styles.formCard}>
        <TextInput style={styles.input} placeholder="Subject Name (e.g. Machine Learning)" placeholderTextColor="#999" value={sName} onChangeText={setSName} />

        {/* Teacher picker */}
        <TouchableOpacity
          style={styles.pickerBtn}
          onPress={() => setShowTeacherPicker(!showTeacherPicker)}
          activeOpacity={0.7}
        >
          <Text style={[styles.pickerText, !selectedTeacherId && { color: '#999' }]}>
            {selectedTeacher ? selectedTeacher.name : 'Select Teacher to Assign'}
          </Text>
          <Ionicons name={showTeacherPicker ? 'chevron-up' : 'chevron-down'} size={18} color="#999" />
        </TouchableOpacity>

        {showTeacherPicker && (
          <View style={styles.pickerDropdown}>
            {teachers.length === 0 ? (
              <Text style={styles.pickerEmpty}>No teachers available. Create one first.</Text>
            ) : (
              teachers.map(t => (
                <TouchableOpacity
                  key={t.id}
                  style={[styles.pickerItem, t.id === selectedTeacherId && styles.pickerItemActive]}
                  onPress={() => { setSelectedTeacherId(t.id); setShowTeacherPicker(false); }}
                >
                  <Text style={[styles.pickerItemText, t.id === selectedTeacherId && { color: '#FFF' }]}>{t.name}</Text>
                  <Text style={[styles.pickerItemSub, t.id === selectedTeacherId && { color: '#DDD' }]}>{t.email}</Text>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}

        <TouchableOpacity style={styles.createBtn} onPress={handleCreateSubject} disabled={sLoading} activeOpacity={0.7}>
          <Text style={styles.createBtnText}>{sLoading ? 'Creating...' : 'Create & Assign Subject'}</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <Text style={styles.formLabel}>All Subjects ({subjects.length})</Text>
      {subjects.length === 0 ? (
        <Text style={styles.emptyText}>No subjects yet</Text>
      ) : (
        subjects.map(s => (
          <View key={s.id} style={styles.listCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.listName}>{s.name}</Text>
              <Text style={styles.listSub}>Assigned to: {s.teacher_name}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDeleteSubject(s)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </>
  );

  const renderStudents = () => (
    <>
      <Text style={styles.formLabel}>Create New Student</Text>
      <View style={styles.formCard}>
        <TextInput style={styles.input} placeholder="Full Name" placeholderTextColor="#999" value={stName} onChangeText={setStName} />
        <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#999" value={stEmail} onChangeText={setStEmail} keyboardType="email-address" autoCapitalize="none" />
        <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#999" value={stPassword} onChangeText={setStPassword} secureTextEntry />
        <TextInput style={styles.input} placeholder="Roll Number" placeholderTextColor="#999" value={stRoll} onChangeText={setStRoll} />
        <TouchableOpacity style={styles.createBtn} onPress={handleCreateStudent} disabled={stLoading} activeOpacity={0.7}>
          <Text style={styles.createBtnText}>{stLoading ? 'Creating...' : 'Create Student'}</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.formLabel}>All Students ({students.length})</Text>
      {students.length === 0 ? (
        <Text style={styles.emptyText}>No students yet</Text>
      ) : (
        students.map(s => (
          <View key={s.id} style={styles.listCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.listName}>{s.name}</Text>
              <Text style={styles.listSub}>{s.email}</Text>
              {s.roll ? <Text style={styles.listSub}>Roll: {s.roll}</Text> : null}
            </View>
            <TouchableOpacity onPress={() => handleDeleteStudent(s)} style={styles.deleteBtn}>
              <Ionicons name="trash-outline" size={20} color="#FF4444" />
            </TouchableOpacity>
          </View>
        ))
      )}
    </>
  );

  const filteredQueries = queries.filter(q => {
    if (queryFilter === 'pending') return !q.answered;
    if (queryFilter === 'answered') return q.answered;
    return true;
  });

  const renderQueries = () => (
    <>
      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(['all', 'pending', 'answered'] as const).map(f => (
          <TouchableOpacity
            key={f}
            style={[styles.filterChip, queryFilter === f && styles.filterChipActive]}
            onPress={() => setQueryFilter(f)}
          >
            <Text style={[styles.filterChipText, queryFilter === f && styles.filterChipTextActive]}>
              {f === 'all' ? `All (${queries.length})` : f === 'pending' ? `Pending (${queries.filter(q => !q.answered).length})` : `Answered (${queries.filter(q => q.answered).length})`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {filteredQueries.length === 0 ? (
        <Text style={styles.emptyText}>No queries found</Text>
      ) : (
        filteredQueries.map(q => (
          <TouchableOpacity
            key={q.id}
            style={styles.queryCard}
            activeOpacity={0.7}
            onPress={() => setExpandedQuery(expandedQuery === q.id ? null : q.id)}
          >
            {/* Header row */}
            <View style={styles.queryHeader}>
              <View style={[styles.queryStatusDot, { backgroundColor: q.answered ? '#2ecc71' : '#e67e22' }]} />
              <Text style={styles.queryCourseBadge}>{q.course_name}</Text>
              <Text style={styles.queryDate}>{new Date(q.created_at).toLocaleDateString()}</Text>
            </View>

            {/* Student info – real name visible to admin */}
            <View style={styles.queryStudentRow}>
              <Ionicons name="person-outline" size={14} color="#0A3B87" />
              <Text style={styles.queryStudentName}>{q.student_name}</Text>
              {q.student_roll ? <Text style={styles.queryStudentRoll}>({q.student_roll})</Text> : null}
            </View>

            {/* Question */}
            <Text style={styles.queryQuestion} numberOfLines={expandedQuery === q.id ? undefined : 2}>{q.question}</Text>

            {/* Expanded answer */}
            {expandedQuery === q.id && q.answered && q.answer && (
              <View style={styles.queryAnswerBox}>
                <Text style={styles.queryAnswerLabel}>Answer:</Text>
                <Text style={styles.queryAnswerText}>{q.answer}</Text>
              </View>
            )}

            {!q.answered && (
              <Text style={styles.queryPendingHint}>Waiting for teacher response...</Text>
            )}
          </TouchableOpacity>
        ))
      )}
    </>
  );

  const renderTab = () => {
    switch (tab) {
      case 'teachers': return renderTeachers();
      case 'subjects': return renderSubjects();
      case 'students': return renderStudents();
      case 'queries': return renderQueries();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Intro Card */}
        <View style={styles.introCard}>
          <Text style={styles.introName}>{user?.name ?? 'Admin'}</Text>
          <Text style={styles.introSub}>Admin Panel</Text>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabRow}>
          {([
            { key: 'teachers', icon: 'people-outline', label: 'Teachers' },
            { key: 'students', icon: 'school-outline', label: 'Students' },
            { key: 'subjects', icon: 'book-outline', label: 'Subjects' },
            { key: 'queries', icon: 'chatbubbles-outline', label: 'Queries' },
          ] as const).map(t => (
            <TouchableOpacity
              key={t.key}
              style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
              onPress={() => setTab(t.key)}
            >
              <Ionicons name={t.icon as any} size={16} color={tab === t.key ? '#2F2F2F' : '#AAA'} />
              <Text style={[styles.tabText, tab === t.key && styles.tabTextActive]}>{t.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {renderTab()}

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
  container: { flex: 1, backgroundColor: '#2F2F2F' },
  scrollContent: { paddingHorizontal: 17, paddingTop: 12, paddingBottom: 40 },

  /* Intro */
  introCard: {
    width: '100%',
    height: 120,
    backgroundColor: '#444444',
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  introName: { fontSize: 22, fontWeight: '600', textAlign: 'center', color: '#FFFFFF', lineHeight: 33 },
  introSub: { fontSize: 14, color: '#FFFFFF', textAlign: 'center', letterSpacing: 0.21, marginTop: 2 },

  /* Tabs */
  tabRow: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 24, marginBottom: 20, gap: 10 },
  tabBtn: {
    flexBasis: '47%',
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: '#888',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  tabBtnActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  tabText: { fontSize: 13, fontWeight: '600', color: '#AAA' },
  tabTextActive: { color: '#2F2F2F' },

  /* Form */
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    letterSpacing: 0.21,
    marginBottom: 12,
  },
  formCard: {
    backgroundColor: '#444444',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
  },
  input: {
    backgroundColor: '#5A5A5A',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 14,
    color: '#FFFFFF',
    marginBottom: 12,
  },
  createBtn: {
    backgroundColor: '#0A3B87',
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 4,
  },
  createBtnText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },

  /* Teacher picker */
  pickerBtn: {
    backgroundColor: '#5A5A5A',
    borderRadius: 10,
    height: 48,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  pickerText: { fontSize: 14, color: '#FFFFFF' },
  pickerDropdown: {
    backgroundColor: '#5A5A5A',
    borderRadius: 10,
    marginBottom: 12,
    maxHeight: 200,
    overflow: 'hidden',
  },
  pickerEmpty: { fontSize: 13, color: '#999', padding: 14 },
  pickerItem: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4A4A4A',
  },
  pickerItemActive: { backgroundColor: '#0A3B87' },
  pickerItemText: { fontSize: 14, fontWeight: '500', color: '#FFF' },
  pickerItemSub: { fontSize: 11, color: '#AAA', marginTop: 2 },

  /* List cards */
  listCard: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  listName: { fontSize: 15, fontWeight: '600', color: '#2F2F2F' },
  listSub: { fontSize: 12, color: '#888', marginTop: 2 },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 6 },
  ratingLabel: { fontSize: 11, color: '#888', marginLeft: 4 },
  deleteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: '#FF4444',
  },

  emptyText: { fontSize: 13, color: '#888', marginBottom: 16 },

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

  /* Query Filters */
  filterRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
  },
  filterChipActive: { backgroundColor: '#0A3B87' },
  filterChipText: { fontSize: 12, fontWeight: '600', color: '#888' },
  filterChipTextActive: { color: '#FFF' },

  /* Query cards */
  queryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  queryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  queryStatusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  queryCourseBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
    backgroundColor: '#0A3B87',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    overflow: 'hidden',
  },
  queryDate: { fontSize: 11, color: '#888', marginLeft: 'auto' },
  queryStudentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  queryStudentName: { fontSize: 13, fontWeight: '600', color: '#0A3B87' },
  queryStudentRoll: { fontSize: 11, color: '#888' },
  queryQuestion: { fontSize: 14, fontWeight: '500', color: '#2F2F2F', lineHeight: 20 },
  queryAnswerBox: {
    marginTop: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 10,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#2ecc71',
  },
  queryAnswerLabel: { fontSize: 11, fontWeight: '700', color: '#2ecc71', marginBottom: 4, textTransform: 'uppercase' },
  queryAnswerText: { fontSize: 13, color: '#555', lineHeight: 19 },
  queryPendingHint: { fontSize: 11, color: '#e67e22', marginTop: 8, fontStyle: 'italic' },
});

