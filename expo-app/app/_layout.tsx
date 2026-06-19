import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';

function InnerLayout() {
  const { theme, isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: theme.bg },
          headerTintColor: theme.primary,
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: theme.bg },
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="auth" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ headerShown: false }} />
        <Stack.Screen name="add-bill" options={{ title: 'Add New Bill' }} />
        <Stack.Screen name="edit-bill" options={{ title: 'Edit Bill' }} />
        <Stack.Screen name="history" options={{ title: 'Payment History' }} />
        <Stack.Screen name="summary" options={{ title: 'Monthly Summary' }} />
        <Stack.Screen name="settings" options={{ title: 'Settings' }} />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AuthProvider>
          <InnerLayout />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
