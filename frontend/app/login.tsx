import {
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  Alert,
  ActivityIndicator,
  Image,
  Animated,
  Easing,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth-context';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const logoTranslateY = useRef(new Animated.Value(0)).current;
  const formOpacity = useRef(new Animated.Value(0)).current;
  const formTranslateY = useRef(new Animated.Value(30)).current;

  useEffect(() => {
  Animated.sequence([

    Animated.timing(logoTranslateY, {
      toValue: -50,
      duration: 600,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }),
    
    Animated.delay(800),

    
    Animated.timing(logoTranslateY, {
      toValue: -80,
      duration: 700,
      easing: Easing.out(Easing.exp),
      useNativeDriver: true,
    }),

    
    Animated.delay(200),

    Animated.parallel([
      Animated.timing(formOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(formTranslateY, {
        toValue: 0,
        duration: 600,
        easing: Easing.out(Easing.exp),
        useNativeDriver: true,
      }),
    ]),
  ]).start();
}, []);


  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err: any) {
      Alert.alert('Login Failed', err.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
{/*       
      Animated Logo
      <Animated.Image
        source={require('@/assets/images/Grouplogo.png')}
        style={[
          styles.logo,
          { transform: [{ translateY: logoTranslateY }] },
        ]}
        resizeMode="contain"
      /> */}

      <Animated.View
        style={[
          styles.inner,
          {
            opacity: formOpacity,
            transform: [{ translateY: formTranslateY }],
          },
        ]}
      >
        <Image
          source={require('@/assets/images/00 1.png')}
          style={{ width: '100%', height: 150, marginBottom: 20 }}
          resizeMode="contain"
        />
        <Text style={styles.title}>Login</Text>

        <Text style={styles.name}>Email</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your email"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />

        <Text style={styles.name}>Password</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your password"
          placeholderTextColor="rgba(255,255,255,0.6)"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <Pressable style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <Text style={styles.buttonText}>Logging in...</Text>
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </Pressable>
      </Animated.View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#2F2F2F',
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  logo: {
    width: '100%',
    height: 100,
    marginBottom: 0,
  },
  inner: {
    gap: 12,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  name: {
    color: '#FFFFFF',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    color: '#FFFFFF',
    padding: 15,
    borderRadius: 6,
  },
  button: {
    marginTop: 10,
    backgroundColor: '#FFFFFF',
    padding: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#2F2F2F',
  },
});