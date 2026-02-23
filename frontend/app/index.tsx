import { StyleSheet, Image, Animated, Easing } from 'react-native';
import React, { useEffect, useRef } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/auth-context';

const Index = () => {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Start animation
    Animated.timing(translateY, {
      toValue: -150,
      duration: 1000,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }).start();

    if (isLoading) return;

    if (user) {
      switch (user.role) {
        case 'admin':
          router.replace('/(admin)' as never);
          return;
        case 'teacher':
          router.replace('/(teacher)' as never);
          return;
        case 'student':
          router.replace('/(student)' as never);
          return;
      }
    }

    const timeout = setTimeout(() => {
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(timeout);

  }, [isLoading]);

  return (
    <SafeAreaView style={styles.container}>
      <Animated.Image
        source={require('@/assets/images/Grouplogo.png')}
        style={[
          styles.logo,
          { transform: [{ translateY }] }
        ]}
      />
    </SafeAreaView>
  );
};

export default Index;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#2F2F2F',
  },

  logo: {
    width: 300,
    height: 100,
    resizeMode: 'contain',
  },
});