import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { ReactNode } from 'react';

interface BackgroundProps {
  children: ReactNode;
}

export function Background({ children }: BackgroundProps) {
  return (
    <View style={styles.container}>
      <Image
        source={require('@/assets/images/mountain.png')}
        style={styles.image}
        contentFit="cover"
      />
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#2F2F2F',
  },
  image: {
    ...StyleSheet.absoluteFillObject,
    opacity: 1,
  },
  content: {
    flex: 1,
  },
});