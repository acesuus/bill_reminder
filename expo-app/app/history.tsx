// Payment History screen — shows all past payments grouped by date.

import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getPaymentHistory, PaymentRecord } from '@/db/database';
import { getCategory } from '@/constants/categories';
import BillerLogo from '@/components/BillerLogo';
import { formatCurrency } from '@/utils/format';
import { formatShortDate } from '@/utils/date';

export default function HistoryScreen() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        setIsLoading(true);
        if (currentUser) {
          setRecords(await getPaymentHistory(currentUser.id));
        }
        setIsLoading(false);
      })();
    }, [currentUser])
  );

  const renderItem = ({ item }: { item: PaymentRecord }) => {
    const cat = getCategory(item.category);
    return (
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <BillerLogo name={item.billTitle} size={44} />
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {item.billTitle}
          </Text>
          <Text style={[styles.cardSub, { color: theme.textMuted }]}>
            {cat.label} {'\u00B7'} {formatShortDate(item.paidAt)}
          </Text>
        </View>
        <Text style={[styles.amount, { color: theme.success }]}>
          -{formatCurrency(item.amount)}
        </Text>
      </View>
    );
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.bg }]} edges={['bottom']}>
      {records.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="history" size={64} color={theme.textFaint} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No payments yet</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            When you mark a bill as paid, it will appear here.
          </Text>
        </View>
      ) : (
        <FlatList
          data={records}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 14 },
  emptyText: { fontSize: 14, marginTop: 6, textAlign: 'center' },
  list: { padding: 16 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardSub: { fontSize: 12, marginTop: 2 },
  amount: { fontSize: 15, fontWeight: '800' },
});
