import React from 'react';
import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

const TAB_CONFIG: Record<string, { icon: keyof typeof Ionicons.glyphMap; activeIcon: keyof typeof Ionicons.glyphMap }> = {
  index: { icon: 'home-outline', activeIcon: 'home' },
  faq: { icon: 'chatbox-outline', activeIcon: 'chatbox' },
  'my-queries': { icon: 'time-outline', activeIcon: 'time' },
  notifications: { icon: 'notifications-outline', activeIcon: 'notifications' },
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
                color={isFocused ? '#1A1A2E' : '#FFFFFF'}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

export default function StudentTabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="faq" options={{ title: 'FAQ' }} />
      <Tabs.Screen name="my-queries" options={{ title: 'My Queries' }} />
      <Tabs.Screen name="notifications" options={{ title: 'Notifications' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  navBarContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 28 : 20,
    left: 28,
    right: 28,
  },
  navBar: {
    height: 68,
    borderRadius: 34,
    backgroundColor: 'rgba(26, 26, 46, 0.92)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.12)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 12,
  },
  navItem: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navItemActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
});
