// Login screen, a faithful port of the Flutter `AuthScreen`.

import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

export default function AuthScreen() {
  const router = useRouter();
  const { signInWithName } = useAuth();

  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleSubmit = async () => {
    if (name.trim().length === 0) {
      setValidationError('Please enter your name');
      return;
    }
    setValidationError('');
    setIsLoading(true);
    setErrorMessage('');
    try {
      await signInWithName(name);
      router.replace('/home');
    } catch (e) {
      setErrorMessage(e instanceof Error ? e.message : String(e));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* --- CUSTOM HEADER SECTION --- */}
          <View style={styles.headerWrap}>
            <LinearGradient
              colors={[colors.headerGradientStart, colors.headerGradientEnd]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.header}
            >
              <Text style={styles.headerBold}>RICHMOND'S</Text>
              <View style={{ height: 5 }} />
              <Text style={styles.headerLight}>BILL{'\n'}REMINDER{'\n'}APP</Text>
            </LinearGradient>
          </View>

          <View style={{ height: 60 }} />

          {/* --- WELCOME TEXT --- */}
          <Text style={styles.welcome}>Enter your name to continue</Text>

          <View style={{ height: 30 }} />

          {/* --- NAME INPUT --- */}
          <View style={styles.inputWrap}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="YOUR NAME"
              placeholderTextColor={colors.hint}
              autoCapitalize="words"
              style={[
                styles.input,
                !!validationError && styles.inputError,
              ]}
              textAlign="center"
            />
            {!!validationError && <Text style={styles.fieldError}>{validationError}</Text>}
          </View>

          <View style={{ height: 40 }} />

          {/* Error message display */}
          {!!errorMessage && <Text style={styles.errorMessage}>{errorMessage}</Text>}

          {/* --- CONTINUE BUTTON --- */}
          <View style={styles.buttonWrap}>
            <LinearGradient
              colors={[colors.gradientStart, colors.gradientEnd]}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.button}
            >
              <TouchableOpacity
                style={styles.buttonTouchable}
                activeOpacity={0.8}
                disabled={isLoading}
                onPress={handleSubmit}
              >
                {isLoading ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={styles.buttonText}>CONTINUE</Text>
                )}
              </TouchableOpacity>
            </LinearGradient>
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex: { flex: 1 },
  scroll: { alignItems: 'center', paddingBottom: 20 },
  headerWrap: {
    width: '100%',
    marginRight: 50,
    marginBottom: 20,
  },
  header: {
    width: '100%',
    paddingHorizontal: 35,
    paddingVertical: 35,
    // shadow
    shadowColor: colors.black,
    shadowOpacity: 0.25,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  headerBold: {
    fontSize: 32,
    fontWeight: '900',
    color: colors.black,
    letterSpacing: 1,
  },
  headerLight: {
    fontSize: 32,
    fontWeight: '300',
    lineHeight: 32 * 1.15,
    color: colors.black,
  },
  welcome: {
    fontSize: 16,
    color: colors.primaryBlue,
    fontWeight: '500',
    paddingHorizontal: 40,
    textAlign: 'center',
  },
  inputWrap: {
    width: '100%',
    paddingHorizontal: 40,
  },
  input: {
    fontSize: 16,
    backgroundColor: colors.white,
    paddingVertical: 18,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(108,140,176,0.5)',
    color: colors.black,
  },
  inputError: {
    borderColor: colors.red,
  },
  fieldError: {
    color: colors.red,
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 6,
    textAlign: 'center',
  },
  errorMessage: {
    color: colors.red,
    fontSize: 12,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 10,
  },
  buttonWrap: {
    width: '100%',
    paddingHorizontal: 50,
  },
  button: {
    height: 55,
    borderRadius: 30,
    shadowColor: colors.gradientStart,
    shadowOpacity: 0.5,
    shadowRadius: 15,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  buttonTouchable: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 30,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.white,
    letterSpacing: 1.5,
  },
});
