// Settings screen — dark mode toggle and app info.

import { StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';

export default function SettingsScreen() {
  const { theme, isDark, toggleTheme } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['bottom']}>
      <View style={styles.content}>
        {/* Dark mode */}
        <View style={[styles.row, { backgroundColor: theme.surface }]}>
          <MaterialCommunityIcons
            name={isDark ? 'weather-night' : 'white-balance-sunny'}
            size={24}
            color={theme.primary}
          />
          <View style={styles.rowBody}>
            <Text style={[styles.rowTitle, { color: theme.text }]}>Dark Mode</Text>
            <Text style={[styles.rowSub, { color: theme.textMuted }]}>
              {isDark ? 'On' : 'Off'} — changes the app appearance
            </Text>
          </View>
          <Switch
            value={isDark}
            onValueChange={toggleTheme}
            trackColor={{ true: theme.primary, false: theme.border }}
            thumbColor={theme.white}
          />
        </View>

        {/* App info */}
        <View style={[styles.row, { backgroundColor: theme.surface, marginTop: 12 }]}>
          <MaterialCommunityIcons name="information-outline" size={24} color={theme.primary} />
          <View style={styles.rowBody}>
            <Text style={[styles.rowTitle, { color: theme.text }]}>Bill Reminder</Text>
            <Text style={[styles.rowSub, { color: theme.textMuted }]}>
              Version 1.0.0 — Offline-first bill tracking app
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  content: { padding: 16, paddingTop: 8 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    borderRadius: 14,
    padding: 16,
  },
  rowBody: { flex: 1 },
  rowTitle: { fontSize: 16, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 2 },
});
