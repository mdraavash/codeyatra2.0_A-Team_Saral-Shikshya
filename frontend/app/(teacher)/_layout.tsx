import { Stack } from 'expo-router';
import React from 'react';

export default function TeacherLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#1A1A2E' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="course-students" />
      <Stack.Screen name="student-queries" />
      <Stack.Screen name="answer-query" />
    </Stack>
  );
}
