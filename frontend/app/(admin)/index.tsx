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
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/auth-context';
import { Ionicons } from '@expo/vector-icons';
import { API } from '@/constants/api';
import { useFocusEffect } from '@react-navigation/native';

type Tab = 'teachers' | 'subjects';

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

  const [loading, setLoading] = useState(true);
  const headers = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  const fetchAll = async () => {
    try {
      const [tRes, sRes] = await Promise.all([
        fetch(API.ADMIN_TEACHERS, { headers }),
        fetch(API.ADMIN_SUBJECTS, { headers }),
      ]);
      if (tRes.ok) setTeachers(await tRes.json());
      if (sRes.ok) setSubjects(await sRes.json());
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useFocusEffect(useCallback(() => { fetchAll(); }, [token]));

  /* ── Create Teacher ── */
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

  /* ── Delete Teacher ── */
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

  /* ── Create Subject ── */
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

  /* ── Delete Subject ── */
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

  const selectedTeacher = teachers.find(t => t.id === selectedTeacherId);

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#FFF" style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  /* ── Teachers Tab ── */
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

      {/* List */}
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

  /* ── Subjects Tab ── */
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
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'teachers' && styles.tabBtnActive]}
            onPress={() => setTab('teachers')}
          >
            <Ionicons name="people-outline" size={18} color={tab === 'teachers' ? '#2F2F2F' : '#AAA'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, tab === 'teachers' && styles.tabTextActive]}>
              Teachers
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tabBtn, tab === 'subjects' && styles.tabBtnActive]}
            onPress={() => setTab('subjects')}
          >
            <Ionicons name="book-outline" size={18} color={tab === 'subjects' ? '#2F2F2F' : '#AAA'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, tab === 'subjects' && styles.tabTextActive]}>
              Subjects
            </Text>
          </TouchableOpacity>
        </View>

        {tab === 'teachers' ? renderTeachers() : renderSubjects()}

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
  tabRow: { flexDirection: 'row', marginTop: 24, marginBottom: 20, gap: 12 },
  tabBtn: {
    flex: 1,
    height: 46,
    borderRadius: 23,
    borderWidth: 1,
    borderColor: '#888',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabBtnActive: { backgroundColor: '#FFFFFF', borderColor: '#FFFFFF' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#AAA' },
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
});

