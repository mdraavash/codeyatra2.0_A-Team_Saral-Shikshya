import { Stack } from 'expo-router';
import React from 'react';

export default function StudentLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#2F2F2F' },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="course-detail" />
      <Stack.Screen name="queries-answered" />
      <Stack.Screen name="ask-question" />
      <Stack.Screen
        name="answer-detail"
        options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
      />
    </Stack>
  );
}
