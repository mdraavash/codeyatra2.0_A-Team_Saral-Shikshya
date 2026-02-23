import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }> = {
  index: { icon: 'home-outline', activeIcon: 'home' },
  queries: { icon: 'chatbox-outline', activeIcon: 'chatbox' },
  history: { icon: 'time-outline', activeIcon: 'time' },
  profile: { icon: 'person-outline', activeIcon: 'person' },
};

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  return (
    <View style={styles.navBarContainer}>
      <View style={styles.navBar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const isFocused = state.index === index;
          const config = TAB_CONFIG[route.name];
          if (!config) return null;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              onPress={onPress}
              style={[styles.navItem, isFocused && styles.navItemActive]}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isFocused ? config.activeIcon : config.icon}
                size={22}
                color={isFocused ? '#000' : '#FFF'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function TeacherTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="queries" options={{ title: 'Queries' }} />
      <Tabs.Screen name="history" options={{ title: 'History' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 20,
    left: 32,
    right: 32,
  },
  navBar: {
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
    width: 55,
    height: 55,
    borderRadius: 27.5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: {
    backgroundColor: '#FFFFFF',
  },
});
