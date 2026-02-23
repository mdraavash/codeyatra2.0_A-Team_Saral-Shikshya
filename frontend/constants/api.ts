import { Platform } from "react-native";

// Your machine's local network IP — update if it changes
const LAN_IP = "10.5.5.206";

const getBaseUrl = () => {
  // Web can use localhost; physical devices need the LAN IP
  if (Platform.OS === "web") {
    return "http://localhost:8000";
  }
  return `http://${LAN_IP}:8000`;
};

export const API_BASE_URL = getBaseUrl();

export const API = {
  // Auth
  LOGIN: `${API_BASE_URL}/auth/login`,
  REGISTER: `${API_BASE_URL}/auth/register`,
  ME: `${API_BASE_URL}/auth/me`,

  // Subjects
  SUBJECTS: `${API_BASE_URL}/courses`,
  TEACHING_SUBJECTS: `${API_BASE_URL}/courses/teaching`,

  // Queries
  QUERIES: `${API_BASE_URL}/queries`,
  QUERIES_COURSE: (courseId: string) => `${API_BASE_URL}/queries/course/${courseId}`,
  QUERIES_COURSE_ANSWERED: (courseId: string) => `${API_BASE_URL}/queries/course/${courseId}/answered`,
  QUERIES_COURSE_FAQ: (courseId: string) => `${API_BASE_URL}/queries/course/${courseId}/faq`,
  FAQ_ALL: `${API_BASE_URL}/queries/faq/all`,
  MY_QUERIES: `${API_BASE_URL}/queries/mine`,
  QUERIES_TEACHER: `${API_BASE_URL}/queries/teacher`,
  QUERIES_TEACHER_PENDING: `${API_BASE_URL}/queries/teacher/pending`,
  QUERY_ANSWER: (queryId: string) => `${API_BASE_URL}/queries/${queryId}/answer`,
  TEACHER_COURSE_STUDENTS: (courseId: string) => `${API_BASE_URL}/queries/teacher/course/${courseId}/students`,
  TEACHER_STUDENT_QUERIES: (courseId: string, studentId: string) => `${API_BASE_URL}/queries/teacher/course/${courseId}/student/${studentId}`,

  // Ratings
  RATE_TEACHER: `${API_BASE_URL}/queries/rate`,
  QUERY_RATING: (queryId: string) => `${API_BASE_URL}/queries/${queryId}/rating`,
  TEACHER_RATING: (teacherId: string) => `${API_BASE_URL}/queries/teacher/${teacherId}/rating`,

  // Notifications
  NOTIFICATIONS: `${API_BASE_URL}/queries/notifications`,
  NOTIFICATION_READ: (notifId: string) => `${API_BASE_URL}/queries/notifications/${notifId}/read`,

  // Admin
  ADMIN_TEACHERS: `${API_BASE_URL}/admin/teachers`,
  ADMIN_DELETE_TEACHER: (teacherId: string) => `${API_BASE_URL}/admin/teachers/${teacherId}`,
  ADMIN_SUBJECTS: `${API_BASE_URL}/admin/subjects`,
  ADMIN_DELETE_SUBJECT: (subjectId: string) => `${API_BASE_URL}/admin/subjects/${subjectId}`,
};
