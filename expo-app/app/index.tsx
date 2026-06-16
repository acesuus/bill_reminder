// Auth gate: equivalent to the Flutter `AuthGate`.
// Shows a spinner while the session is restored, then routes to home or auth.

import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Redirect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { colors } from '@/theme/colors';

export default function Index() {
  const { currentUser, initializing } = useAuth();

  if (initializing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  return <Redirect href={currentUser ? '/home' : '/auth'} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
