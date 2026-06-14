import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { initNotifications } from '@/services/notifications';
import { colors } from '@/theme/colors';

export default function RootLayout() {
  useEffect(() => {
    // Set up notification channels / permissions once on startup.
    initNotifications().catch((e) => console.warn('Notification init failed', e));
  }, []);

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: colors.bg },
            headerTintColor: colors.primaryBlue,
            headerTitleStyle: { fontWeight: 'bold' },
            contentStyle: { backgroundColor: colors.bg },
          }}
        >
          <Stack.Screen name="index" options={{ headerShown: false }} />
          <Stack.Screen name="auth" options={{ headerShown: false }} />
          <Stack.Screen name="home" options={{ headerShown: false }} />
          <Stack.Screen name="add-bill" options={{ title: 'Add New Bill' }} />
          <Stack.Screen name="edit-bill" options={{ title: 'Edit Bill' }} />
        </Stack>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
