// Dashboard — month picker, gradient header, summary card, sort + filters, bill cards.

import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  LayoutChangeEvent,
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

  // Month picker — defaults to current month
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());

  const [selectedFilter, setSelectedFilter] = useState<Filter>('Upcoming');
  const [sortBy, setSortBy] = useState<SortOption>('Due Date');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [sortMenuTop, setSortMenuTop] = useState(0);
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const monthLabel = new Date(viewYear, viewMonth).toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  });

  const goBackMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const goForwardMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const goToCurrentMonth = () => {
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
  };

  const isCurrentMonth = viewYear === today.getFullYear() && viewMonth === today.getMonth();

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

  const monthBills = useMemo(() => {
    return allBills.filter((b) => {
      const d = new Date(b.dueDate);
      return d.getFullYear() === viewYear && d.getMonth() === viewMonth;
    });
  }, [allBills, viewYear, viewMonth]);

  const summary = useMemo(() => {
    const unpaid = monthBills.filter((b) => !b.isPaid);
    const totalUnpaid = unpaid.reduce((sum, b) => sum + b.amount, 0);
    const overdue = unpaid.filter((b) => new Date(b.dueDate).getTime() < now).length;
    return { totalUnpaid, unpaidCount: unpaid.length, overdue };
  }, [monthBills, now]);

  const filteredBills = useMemo(() => {
    let bills: Bill[];

    switch (selectedFilter) {
      case 'Upcoming': {
        const unpaid = monthBills.filter((b) => !b.isPaid);
        const seen = new Map<string, Bill>();
        for (const bill of unpaid) {
          if (bill.recurrence === 'monthly') {
            const key = `${bill.title}|${bill.category}|${bill.userId}`;
            const existing = seen.get(key);
            if (!existing || new Date(bill.dueDate).getTime() < new Date(existing.dueDate).getTime()) {
              seen.set(key, bill);
            }
          } else {
            seen.set(`single_${bill.id}`, bill);
          }
        }
        bills = Array.from(seen.values());
        break;
      }
      case 'Overdue':
        bills = monthBills.filter((b) => !b.isPaid && new Date(b.dueDate).getTime() < now);
        break;
      case 'Paid':
        bills = monthBills.filter((b) => b.isPaid);
        break;
      default:
        bills = [...monthBills];
    }

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
  }, [monthBills, selectedFilter, sortBy, now]);

  const filterCounts = useMemo(() => {
    // Upcoming: same logic as the 'Upcoming' case in filteredBills
    const unpaid = monthBills.filter((b) => !b.isPaid);
    const seen = new Map<string, Bill>();
    for (const bill of unpaid) {
      if (bill.recurrence === 'monthly') {
        const key = `${bill.title}|${bill.category}|${bill.userId}`;
        const existing = seen.get(key);
        if (!existing || new Date(bill.dueDate).getTime() < new Date(existing.dueDate).getTime()) {
          seen.set(key, bill);
        }
      } else {
        seen.set(`single_${bill.id}`, bill);
      }
    }
    const upcomingCount = seen.size;
    const overdueCount = monthBills.filter((b) => !b.isPaid && new Date(b.dueDate).getTime() < now).length;
    const paidCount = monthBills.filter((b) => b.isPaid).length;
    const allCount = monthBills.length;

    return {
      Upcoming: upcomingCount,
      Overdue: overdueCount,
      Paid: paidCount,
      All: allCount,
    } as Record<Filter, number>;
  }, [monthBills, now]);

  const handleLogout = () => {
    Alert.alert('Log out?', 'Are you sure you want to log out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Log Out',
        style: 'destructive',
        onPress: async () => {
          await signOut();
          router.replace('/auth');
        },
      },
    ]);
  };

  // Measure the filter row position so we can place the sort dropdown directly below it
  const onFilterRowLayout = (e: LayoutChangeEvent) => {
    const { y, height } = e.nativeEvent.layout;
    setSortMenuTop(y + height + 4);
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
        <BillerLogo name={item.title} size={44} />
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
              <MaterialIcons name="logout" size={20} color="#fff" />
            </TouchableOpacity>
          </View>

          {/* Summary card */}
          <View style={[styles.summaryCard, { backgroundColor: theme.surface }]}>
            <Text style={[styles.summaryLabel, { color: theme.textMuted }]}>
              Unpaid this month
            </Text>
            <Text style={[styles.summaryAmount, { color: theme.text }]}>
              {formatCurrency(summary.totalUnpaid)}
            </Text>
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
          <MaterialCommunityIcons name="history" size={20} color={theme.primary} />
          <Text style={[styles.actionLabel, { color: theme.textMuted }]}>History</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.surface }]}
          onPress={() => router.push('/summary')}
        >
          <MaterialCommunityIcons name="chart-bar" size={20} color={theme.primary} />
          <Text style={[styles.actionLabel, { color: theme.textMuted }]}>Summary</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionBtn, { backgroundColor: theme.surface }]}
          onPress={() => router.push('/settings')}
        >
          <MaterialCommunityIcons name="cog-outline" size={20} color={theme.primary} />
          <Text style={[styles.actionLabel, { color: theme.textMuted }]}>Settings</Text>
        </TouchableOpacity>
      </View>

      {/* --- MONTH PICKER --- */}
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={goBackMonth} hitSlop={12}>
          <MaterialIcons name="chevron-left" size={26} color={theme.primary} />
        </TouchableOpacity>
        <TouchableOpacity onPress={goToCurrentMonth} disabled={isCurrentMonth}>
          <Text style={[styles.monthLabel, { color: theme.text }]}>{monthLabel}</Text>
          {!isCurrentMonth && (
            <Text style={[styles.monthHint, { color: theme.textFaint }]}>Tap for today</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={goForwardMonth} hitSlop={12}>
          <MaterialIcons name="chevron-right" size={26} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* --- FILTERS + SORT --- */}
      <View style={styles.filterSortRow} onLayout={onFilterRowLayout}>
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
                  {filter} ({filterCounts[filter]})
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <TouchableOpacity
          style={[styles.sortBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
          onPress={() => setShowSortMenu((v) => !v)}
        >
          <MaterialCommunityIcons name="sort" size={16} color={theme.primary} />
        </TouchableOpacity>
      </View>

      {/* Sort dropdown — positioned right below the filter row */}
      {showSortMenu && (
        <View style={[styles.sortMenu, { top: sortMenuTop, backgroundColor: theme.surface, borderColor: theme.border }]}>
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
                <MaterialIcons name="check" size={16} color={theme.primary} />
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
          <MaterialCommunityIcons name="receipt-text-outline" size={56} color={theme.textFaint} />
          <Text style={[styles.emptyTitle, { color: theme.text }]}>No bills this month</Text>
          <Text style={[styles.emptyText, { color: theme.textMuted }]}>
            {selectedFilter === 'Upcoming'
              ? 'No upcoming bills for this month. Tap + to add one.'
              : `No "${selectedFilter}" bills for ${monthLabel}.`}
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
        <MaterialIcons name="add" size={26} color={theme.white} />
        <Text style={[styles.fabText, { color: theme.white }]}>Add Bill</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 50,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  greeting: { color: 'rgba(255,255,255,0.85)', fontSize: 13 },
  username: { color: '#fff', fontSize: 20, fontWeight: '800' },
  logoutBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    borderRadius: 16,
    padding: 16,
    marginTop: 14,
    marginBottom: -36,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  summaryLabel: { fontSize: 12, fontWeight: '600' },
  summaryAmount: { fontSize: 28, fontWeight: '900', marginTop: 2 },
  summaryStats: { flexDirection: 'row', alignItems: 'center', marginTop: 10 },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 12, fontWeight: '600' },
  statDivider: { width: 1, height: 16, marginHorizontal: 12 },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 44,
    gap: 8,
  },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  actionLabel: { fontSize: 10, fontWeight: '600', marginTop: 3 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginTop: 12,
  },
  monthLabel: { fontSize: 16, fontWeight: '800', textAlign: 'center' },
  monthHint: { fontSize: 9, textAlign: 'center', marginTop: 1 },
  filterSortRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingRight: 16,
  },
  filterContent: { paddingHorizontal: 16, paddingVertical: 2, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 16,
    marginRight: 6,
    borderWidth: 1,
  },
  chipText: { fontSize: 12 },
  sortBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  sortMenu: {
    position: 'absolute',
    right: 16,
    zIndex: 100,
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
    minWidth: 150,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  sortOptionText: { fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { fontSize: 16, fontWeight: '700', marginTop: 12 },
  emptyText: { fontSize: 13, marginTop: 4, textAlign: 'center' },
  listContent: { padding: 16, paddingTop: 8 },
  card: {
    borderRadius: 14,
    padding: 12,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardBody: { flex: 1, marginLeft: 12 },
  cardTitle: { fontSize: 15, fontWeight: '700' },
  cardCategory: { fontSize: 11, marginTop: 1 },
  cardDue: { fontSize: 12, marginTop: 3, fontWeight: '500' },
  cardRight: { alignItems: 'flex-end', marginLeft: 6 },
  amount: { fontSize: 15, fontWeight: '800' },
  badge: { marginTop: 5, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  fab: {
    position: 'absolute',
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 18,
    height: 50,
    borderRadius: 25,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabText: { fontWeight: '800', fontSize: 14 },
});
