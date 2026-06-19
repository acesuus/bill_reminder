// Dashboard — gradient header, summary card, sort + filters, bill cards.

import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { getBillsByUserId } from '@/db/database';
import { Bill } from '@/types/bill';
import { getCategory } from '@/constants/categories';
import BillerLogo from '@/components/BillerLogo';
import { colors } from '@/theme/colors';
import { relativeDueDate, formatCurrency } from '@/utils/format';
import { formatShortDate } from '@/utils/date';
import { getBillStatus, getStatusStyle } from '@/utils/status';

const FILTERS = ['Upcoming', 'Overdue', 'Paid', 'All'] as const;
type Filter = (typeof FILTERS)[number];

const SORT_OPTIONS = ['Due Date', 'Amount', 'Name'] as const;
type SortOption = (typeof SORT_OPTIONS)[number];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, signOut } = useAuth();
  const { theme } = useTheme();

  const [selectedFilter, setSelectedFilter] = useState<Filter>('Upcoming');
  const [sortBy, setSortBy] = useState<SortOption>('Due Date');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBills = useCallback(async () => {
    setIsLoading(true);
    try {
      if (currentUser) {
        setAllBills(await getBillsByUserId(currentUser.id));
      }
    } catch (e) {
      console.warn('Error loading bills', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, [loadBills])
  );

  const now = Date.now();

  const summary = useMemo(() => {
    const unpaid = allBills.filter((b) => !b.isPaid);
    const totalUnpaid = unpaid.reduce((sum, b) => sum + b.amount, 0);
    const overdue = unpaid.filter((b) => new Date(b.dueDate).getTime() < now).length;
    return { totalUnpaid, unpaidCount: unpaid.length, overdue };
  }, [allBills, now]);

  // Smart filtering: "Upcoming" shows only the nearest unpaid entry per
  // recurring bill so duplicates don't clutter the list.
  const filteredBills = useMemo(() => {
    let bills: Bill[];

    switch (selectedFilter) {
      case 'Upcoming': {
        // Only unpaid bills. For recurring ones, show only the earliest upcoming.
        const unpaid = allBills.filter((b) => !b.isPaid);
        const seen = new Map<string, Bill>();
        for (const bill of unpaid) {
          if (bill.recurrence === 'monthly') {
            const key = `${bill.title}|${bill.category}|${bill.userId}`;
            const existing = seen.get(key);
            if (!existing || new Date(bill.dueDate).getTime() < new Date(existing.dueDate).getTime()) {
              seen.set(key, bill);
            }
          } else {
            // Non-recurring: always show
            seen.set(`single_${bill.id}`, bill);
          }
        }
        bills = Array.from(seen.values());
        break;
      }
      case 'Overdue':
        bills = allBills.filter((b) => !b.isPaid && new Date(b.dueDate).getTime() < now);
        break;
      case 'Paid':
        bills = allBills.filter((b) => b.isPaid);
        break;
      default:
        bills = [...allBills];
    }

    // Sort
    bills.sort((a, b) => {
      switch (sortBy) {
        case 'Amount':
          return b.amount - a.amount;
        case 'Name':
          return a.title.localeCompare(b.title);
        default:
          return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
    });

    return bills;
  }, [allBills, selectedFilter, sortBy, now]);

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth');
  };

  const renderBill = ({ item }: { item: Bill }) => {
    const cat = getCategory(item.category);
    const status = getBillStatus(item);
    const statusStyle = getStatusStyle(status);
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.card, { backgroundColor: theme.surface }]}
        onPress={() => router.push({ pathname: '/edit-bill', params: { id: String(item.id) } })}
      >
        <BillerLogo name={item.title} size={48} />
        <View style={styles.cardBody}>
          <Text style={[styles.cardTitle, { color: theme.text }]} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={[styles.cardCategory, { color: theme.textFaint }]}>
            {cat.label}
            {item.recurrence === 'monthly' ? ' \u00B7 Recurring' : ''}
          </Text>
          <Text
            style={[
              styles.cardDue,
              { color: theme.textMuted },
              status === 'overdue' && { color: theme.danger },
              status === 'dueSoon' && { color: theme.warning },
            ]}
          >
            {formatShortDate(item.dueDate)} {'\u00B7'} {relativeDueDate(item.dueDate, item.isPaid)}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={[styles.amount, { color: theme.text }]}>{formatCurrency(item.amount)}</Text>
          <View style={[styles.badge, { backgroundColor: statusStyle.surface }]}>
            <Text style={[styles.badgeText, { color: statusStyle.color }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const fabBottom = Math.max(insets.bottom, 16) + 16;

  return (
    <View style={[styles.root, { backgroundColor: theme.bg }]}>
      {/* --- GRADIENT HEADER --- */}
      <LinearGradient
        colors={[theme.headerGradientStart, theme.headerGradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.header}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Hello,</Text>
              <Text style={styles.username}>{currentUser?.username ?? 'there'}</Text>
            </View>
            <TouchableOpacity onPress={handleLogout} style={styles.logoutBtn} hitSlop={8}>
              <MaterialIcons name="logout" size={20} color={colors.white} />
            </TouchableOpacity>
          </View>

          {/* Summary card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>Total Unpaid</Text>
            <Text style={[styles.summaryAmount, { color: theme.text }]}>{formatCurrency(summary.totalUnpaid)}</Text>
            <View style={styles.summaryStats}>
              <View style={styles.stat}>
                <MaterialIcons name="receipt-long" size={18} color={theme.primary} />
                <Text style={[styles.statText, { color: theme.textMuted }]}>
                  {summary.unpaidCount} {summary.unpaidCount === 1 ? 'bill' : 'bills'} due
                </Text>
              </View>
              <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
              <View style={styles.stat}>
                <MaterialIcons name="warning-amber" size={18} color={theme.danger} />
                <Text style={[styles.statText, summary.overdue > 0 && { color: theme.danger }]}>
                  {summary.overdue} overdue
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* --- QUICK ACTIONS --- */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.surface }]}
          onPress={() => router.push('/history')}
        >
          <MaterialCommunityIcons name="history" size={22} color={theme.primary} />
          <Text style={[styles.actionLabel, { color: theme.textMuted }]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.surface }]}
          onPress={() => router.push('/summary')}
        >
          <MaterialCommunityIcons name="chart-bar" size={22} color={theme.primary} />
          <Text style={[styles.actionLabel, { color: theme.textMuted }]}>Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.surface }]}
          onPress={() => router.push('/settings')}
        >
          <MaterialCommunityIcons name="cog-outline" size={22} color={theme.primary} />
          <Text style={[styles.actionLabel, { color: theme.textMuted }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* --- FILTERS + SORT --- */}
      <View style={styles.filterSortRow}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {FILTERS.map((filter) => {
            const isSelected = selectedFilter === filter;
            return (
              <TouchableOpacity
                key={filter}
                activeOpacity={0.8}
                onPress={() => setSelectedFilter(filter)}
                style={[
                  styles.chip,
                  isSelected
                    ? { backgroundColor: theme.primary, borderColor: theme.primary }
                    : { backgroundColor: theme.surface, borderColor: theme.border },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? theme.white : theme.primary },
                    isSelected && { fontWeight: '700' },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          style={[styles.sortBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => setShowSortMenu((v) => !v)}
        >
          <MaterialCommunityIcons name="sort" size={18} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort dropdown */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          {SORT_OPTIONS.map((opt) => (
            <TouchableOpacity
              key={opt}
              style={styles.sortOption}
              onPress={() => {
                setSortBy(opt);
                setShowSortMenu(false);
              }}
            >
              <Text
                style={[
                  styles.sortOptionText,
                  { color: sortBy === opt ? theme.primary : theme.text },
                  sortBy === opt && { fontWeight: '700' },
                ]}
              >
                {opt}
              </Text>
              {sortBy === opt && (
                <MaterialIcons name="check" size={18} color={theme.primary} />
              )}
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* --- BILLS LIST --- */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={theme.primary} />
        </View>
      ) : filteredBills.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="receipt-text-outline" size={64} color={theme.textFaint} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No bills here yet</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            {selectedFilter === 'Upcoming'
              ? 'Tap the + button to add your first bill.'
              : `You have no "${selectedFilter}" bills.`}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredBills}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBill}
          contentContainerStyle={[styles.listContent, { paddingBottom: fabBottom + 60 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadBills} tintColor={theme.primary} />
          }
        />
      )}

      {/* --- FAB --- */}
      <TouchableOpacity
        style={[styles.fab, { bottom: fabBottom, backgroundColor: theme.primary }]}
        activeOpacity={0.85}
        onPress={() => router.push('/add-bill')}
      >
        <MaterialIcons name="add" size={28} color={theme.white} />
        <Text style={[styles.fabText, { color: theme.white }]}>Add Bill</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 56,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: 14 },
  username: { color: '#fff', fontSize: 22, fontWeight: '800' },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginBottom: -44,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  summaryLabel: { fontSize: 13, fontWeight: '600' },
  summaryAmount: { fontSize: 32, fontWeight: '900', marginTop: 4 },
  summaryStats: { flexDirection: 'row', alignItems: 'center', marginTop: 14 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { fontSize: 13, fontWeight: '600' },
  statDivider: { width: 1, height: 18, marginHorizontal: 14 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 56,
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 14,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  actionLabel: { fontSize: 11, fontWeight: '600', marginTop: 4 },
  filterSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingRight: 16,
  },
  filterContent: { paddingHorizontal: 16, paddingVertical: 4, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  chipText: { fontSize: 13 },
  sortBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sortMenu: {
    position: 'absolute',
    right: 16,
    top: undefined,
    zIndex: 100,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
    marginTop: 4,
    alignSelf: 'flex-end',
    marginRight: 16,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortOptionText: { fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 17, fontWeight: '700', marginTop: 14 },
  emptyText: { fontSize: 14, marginTop: 6, textAlign: 'center' },
  listContent: { padding: 16 },
  card: {
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardBody: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  cardCategory: { fontSize: 12, marginTop: 1 },
  cardDue: { fontSize: 13, marginTop: 4, fontWeight: '500' },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  amount: { fontSize: 16, fontWeight: '800' },
  badge: { marginTop: 6, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 20,
    height: 54,
    borderRadius: 27,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  fabText: { fontWeight: '800', fontSize: 15 },
});
