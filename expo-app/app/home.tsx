// Dashboard — gradient header, summary card, status filters, bill cards with logos.

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
import { getBillsByUserId } from '@/db/database';
import { Bill } from '@/types/bill';
import { getCategory } from '@/constants/categories';
import BillerLogo from '@/components/BillerLogo';
import { colors } from '@/theme/colors';
import { relativeDueDate, formatCurrency } from '@/utils/format';
import { formatShortDate } from '@/utils/date';
import { getBillStatus, getStatusStyle } from '@/utils/status';

const FILTERS = ['All', 'Unpaid', 'Overdue', 'Paid'] as const;
type Filter = (typeof FILTERS)[number];

export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUser, signOut } = useAuth();

  const [selectedFilter, setSelectedFilter] = useState<Filter>('All');
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

  const filteredBills = useMemo(() => {
    return allBills.filter((bill) => {
      const overdue = !bill.isPaid && new Date(bill.dueDate).getTime() < now;
      switch (selectedFilter) {
        case 'Unpaid':
          return !bill.isPaid;
        case 'Overdue':
          return overdue;
        case 'Paid':
          return bill.isPaid;
        default:
          return true;
      }
    });
  }, [allBills, selectedFilter, now]);

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
        style={styles.card}
        onPress={() => router.push({ pathname: '/edit-bill', params: { id: String(item.id) } })}
      >
        <BillerLogo name={item.title} size={48} />
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardCategory}>
            {cat.label}
            {item.recurrence === 'monthly' ? '  \u00B7  Monthly' : ''}
          </Text>
          <Text
            style={[
              styles.cardDue,
              status === 'overdue' && { color: colors.danger },
              status === 'dueSoon' && { color: colors.warning },
            ]}
          >
            {formatShortDate(item.dueDate)} {'\u00B7'} {relativeDueDate(item.dueDate, item.isPaid)}
          </Text>
        </View>
        <View style={styles.cardRight}>
          <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          <View style={[styles.badge, { backgroundColor: statusStyle.surface }]}>
            <Text style={[styles.badgeText, { color: statusStyle.color }]}>
              {statusStyle.label}
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  // Bottom padding: nav bar safe area + FAB height + extra breathing room
  const fabBottom = Math.max(insets.bottom, 16) + 16;

  return (
    <View style={styles.root}>
      {/* --- GRADIENT HEADER --- */}
      <LinearGradient
        colors={[colors.headerGradientStart, colors.headerGradientEnd]}
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
          <View style={styles.summaryCard}>
            <Text style={styles.summaryLabel}>Total Unpaid</Text>
            <Text style={styles.summaryAmount}>{formatCurrency(summary.totalUnpaid)}</Text>
            <View style={styles.summaryStats}>
              <View style={styles.stat}>
                <MaterialIcons name="receipt-long" size={18} color={colors.primary} />
                <Text style={styles.statText}>
                  {summary.unpaidCount} {summary.unpaidCount === 1 ? 'bill' : 'bills'} due
                </Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <MaterialIcons name="warning-amber" size={18} color={colors.danger} />
                <Text style={[styles.statText, summary.overdue > 0 && { color: colors.danger }]}>
                  {summary.overdue} overdue
                </Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* --- FILTERS --- */}
      <View style={styles.filterContainer}>
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
                style={[styles.chip, isSelected ? styles.chipSelected : styles.chipUnselected]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? colors.white : colors.primary },
                    isSelected && { fontWeight: '700' },
                  ]}
                >
                  {filter}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* --- BILLS LIST --- */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : filteredBills.length === 0 ? (
        <View style={styles.center}>
          <MaterialCommunityIcons name="receipt-text-outline" size={64} color={colors.textFaint} />
          <Text style={styles.emptyTitle}>No bills here yet</Text>
          <Text style={styles.emptyText}>
            {selectedFilter === 'All'
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
            <RefreshControl refreshing={isLoading} onRefresh={loadBills} tintColor={colors.primary} />
          }
        />
      )}

      {/* --- FAB (respects safe area so it never overlaps nav buttons) --- */}
      <TouchableOpacity
        style={[styles.fab, { bottom: fabBottom }]}
        activeOpacity={0.85}
        onPress={() => router.push('/add-bill')}
      >
        <MaterialIcons name="add" size={28} color={colors.white} />
        <Text style={styles.fabText}>Add Bill</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
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
  username: { color: colors.white, fontSize: 22, fontWeight: '800' },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    marginTop: 20,
    marginBottom: -44,
    shadowColor: colors.shadow,
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
  summaryLabel: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  summaryAmount: { color: colors.text, fontSize: 32, fontWeight: '900', marginTop: 4 },
  summaryStats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
  },
  stat: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  statDivider: { width: 1, height: 18, backgroundColor: colors.border, marginHorizontal: 14 },
  filterContainer: { marginTop: 56 },
  filterContent: { paddingHorizontal: 16, paddingVertical: 4, alignItems: 'center' },
  chip: {
    paddingHorizontal: 18,
    paddingVertical: 9,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  chipSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipUnselected: { backgroundColor: colors.white, borderColor: colors.border },
  chipText: { fontSize: 13 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginTop: 14 },
  emptyText: { color: colors.textMuted, fontSize: 14, marginTop: 6, textAlign: 'center' },
  listContent: { padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: colors.shadow,
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardBody: { flex: 1, marginLeft: 14 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  cardCategory: { fontSize: 12, color: colors.textFaint, marginTop: 1 },
  cardDue: { fontSize: 13, color: colors.textMuted, marginTop: 4, fontWeight: '500' },
  cardRight: { alignItems: 'flex-end', marginLeft: 8 },
  amount: { fontSize: 16, fontWeight: '800', color: colors.text },
  badge: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 10,
  },
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
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 6,
  },
  fabText: { color: colors.white, fontWeight: '800', fontSize: 15 },
});
