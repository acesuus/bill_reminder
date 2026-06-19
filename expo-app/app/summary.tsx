// Monthly Spending Summary — category breakdown for the current month.

import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getPaymentHistoryForMonth, PaymentRecord } from '@/db/database';
import { getCategory } from '@/constants/categories';
import { formatCurrency } from '@/utils/format';

export default function SummaryScreen() {
  const { currentUser } = useAuth();
  const { theme } = useTheme();
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());

  const monthLabel = new Date(year, month).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const loadData = useCallback(async () => {
    setIsLoading(true);
    if (currentUser) {
      setRecords(await getPaymentHistoryForMonth(currentUser.id, year, month));
    }
    setIsLoading(false);
  }, [currentUser, year, month]);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const totalSpent = useMemo(
    () => records.reduce((sum, r) => sum + r.amount, 0),
    [records]
  );

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    for (const r of records) {
      map[r.category] = (map[r.category] || 0) + r.amount;
    }
    return Object.entries(map)
      .map(([id, amount]) => ({ id, amount, cat: getCategory(id) }))
      .sort((a, b) => b.amount - a.amount);
  }, [records]);

  const goBack = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const goForward = () => {
    const isCurrentMonth = year === now.getFullYear() && month === now.getMonth();
    if (isCurrentMonth) return;
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
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
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Month navigation */}
        <View style={styles.monthRow}>
          <TouchableOpacity onPress={goBack} hitSlop={12}>
            <MaterialIcons name="chevron-left" size={28} color={theme.primary} />
          </TouchableOpacity>
          <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
          <TouchableOpacity onPress={goForward} hitSlop={12}>
            <MaterialIcons name="chevron-right" size={28} color={theme.primary} />
          </TouchableOpacity>
        </View>

        {/* Total card */}
        <View style={[styles.totalCard, { backgroundColor: theme.surface }]}>
          <Text style={[styles.totalLabel, { color: theme.textMuted }]}>Total Spent</Text>
          <Text style={[styles.totalAmount, { color: theme.text }]}>
            {formatCurrency(totalSpent)}
          </Text>
          <Text style={[styles.totalSub, { color: theme.textFaint }]}>
            {records.length} {records.length === 1 ? 'payment' : 'payments'} this month
          </Text>
        </View>

        {/* Category breakdown */}
        {categoryBreakdown.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="chart-bar" size={48} color={theme.textFaint} />
            <Text style={[styles.emptyText, { color: theme.textMuted }]}>
              No payments recorded for this month.
            </Text>
          </View>
        ) : (
          <>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>By Category</Text>
            {categoryBreakdown.map(({ id, amount, cat }) => {
              const pct = totalSpent > 0 ? (amount / totalSpent) * 100 : 0;
              return (
                <View key={id} style={[styles.catRow, { backgroundColor: theme.surface }]}>
                  <View style={[styles.catIcon, { backgroundColor: cat.color + '1A' }]}>
                    <MaterialCommunityIcons name={cat.icon} size={20} color={cat.color} />
                  </View>
                  <View style={styles.catBody}>
                    <View style={styles.catHeader}>
                      <Text style={[styles.catName, { color: theme.text }]}>{cat.label}</Text>
                      <Text style={[styles.catAmount, { color: theme.text }]}>
                        {formatCurrency(amount)}
                      </Text>
                    </View>
                    {/* Progress bar */}
                    <View style={[styles.barBg, { backgroundColor: theme.border }]}>
                      <View
                        style={[
                          styles.barFill,
                          { width: `${pct}%`, backgroundColor: cat.color },
                        ]}
                      />
                    </View>
                    <Text style={[styles.catPct, { color: theme.textFaint }]}>
                      {pct.toFixed(0)}%
                    </Text>
                  </View>
                </View>
              );
            })}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 40 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  monthLabel: { fontSize: 18, fontWeight: '800' },
  totalCard: {
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  totalLabel: { fontSize: 13, fontWeight: '600' },
  totalAmount: { fontSize: 36, fontWeight: '900', marginTop: 4 },
  totalSub: { fontSize: 13, marginTop: 6 },
  emptyWrap: { alignItems: 'center', paddingTop: 40 },
  emptyText: { fontSize: 14, marginTop: 10, textAlign: 'center' },
  sectionTitle: { fontSize: 16, fontWeight: '700', marginBottom: 12 },
  catRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
  },
  catIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  catBody: { flex: 1, marginLeft: 12 },
  catHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  catName: { fontSize: 14, fontWeight: '700' },
  catAmount: { fontSize: 14, fontWeight: '700' },
  barBg: { height: 6, borderRadius: 3, marginTop: 8 },
  barFill: { height: 6, borderRadius: 3 },
  catPct: { fontSize: 11, marginTop: 4 },
});
