// Dashboard, a port of the Flutter `HomeScreen`.
// Filter chips + scrollable bill cards, pull-to-refresh, add FAB, logout.

import { useCallback, useState } from 'react';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { getBillsByUserId } from '@/db/database';
import { Bill } from '@/types/bill';
import { colors, CURRENCY_SYMBOL } from '@/theme/colors';
import { formatDate } from '@/utils/date';

const FILTERS = ['All', 'This Month', 'This Year', 'Expired'] as const;
type Filter = (typeof FILTERS)[number];

export default function HomeScreen() {
  const router = useRouter();
  const { currentUser, signOut } = useAuth();

  const [selectedFilter, setSelectedFilter] = useState<Filter>('All');
  const [allBills, setAllBills] = useState<Bill[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadBills = useCallback(async () => {
    setIsLoading(true);
    try {
      if (currentUser) {
        const bills = await getBillsByUserId(currentUser.id);
        setAllBills(bills);
      }
    } catch (e) {
      console.warn('Error loading bills', e);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  // Reload whenever the screen regains focus (e.g. returning from add/edit).
  useFocusEffect(
    useCallback(() => {
      loadBills();
    }, [loadBills])
  );

  const now = new Date();
  const filteredBills = allBills.filter((bill) => {
    const due = new Date(bill.dueDate);
    if (selectedFilter === 'All') return true;
    if (selectedFilter === 'This Month') {
      return due.getFullYear() === now.getFullYear() && due.getMonth() === now.getMonth();
    }
    if (selectedFilter === 'This Year') {
      return due.getFullYear() === now.getFullYear();
    }
    if (selectedFilter === 'Expired') {
      return due.getTime() < now.getTime() && !bill.isPaid;
    }
    return true;
  });

  const handleLogout = async () => {
    await signOut();
    router.replace('/auth');
  };

  const renderBill = ({ item }: { item: Bill }) => {
    const isExpired = new Date(item.dueDate).getTime() < Date.now() && !item.isPaid;
    return (
      <TouchableOpacity
        activeOpacity={0.8}
        style={[styles.card, isExpired && styles.cardExpired]}
        onPress={() => router.push({ pathname: '/edit-bill', params: { id: String(item.id) } })}
      >
        <View style={[styles.leadingIcon, isExpired && styles.leadingIconExpired]}>
          <MaterialIcons
            name={isExpired ? 'warning' : 'receipt-long'}
            size={24}
            color={isExpired ? colors.red : colors.primaryBlue}
          />
        </View>
        <View style={styles.cardBody}>
          <Text style={styles.cardTitle}>{item.title}</Text>
          <Text style={[styles.cardSubtitle, isExpired && styles.cardSubtitleExpired]}>
            Due: {formatDate(item.dueDate)}
          </Text>
          <Text style={[styles.cardSubtitle, isExpired && styles.cardSubtitleExpired]}>
            Status: {item.isPaid ? 'Paid' : 'Pending'}
          </Text>
        </View>
        <Text style={styles.amount}>
          {CURRENCY_SYMBOL}
          {item.amount.toFixed(2)}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      {/* --- APP BAR --- */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Dashboard</Text>
        <TouchableOpacity onPress={handleLogout} hitSlop={8}>
          <MaterialIcons name="logout" size={24} color={colors.primaryBlue} />
        </TouchableOpacity>
      </View>

      {/* --- FILTER SECTION --- */}
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
                    { color: isSelected ? colors.white : colors.primaryBlue },
                    isSelected && { fontWeight: 'bold' },
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
          <ActivityIndicator size="large" color={colors.primaryBlue} />
        </View>
      ) : filteredBills.length === 0 ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>No bills found for "{selectedFilter}".</Text>
        </View>
      ) : (
        <FlatList
          data={filteredBills}
          keyExtractor={(item) => String(item.id)}
          renderItem={renderBill}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={loadBills} tintColor={colors.primaryBlue} />
          }
        />
      )}

      {/* --- FAB --- */}
      <TouchableOpacity
        style={styles.fab}
        activeOpacity={0.85}
        onPress={() => router.push('/add-bill')}
      >
        <MaterialIcons name="add" size={28} color={colors.white} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  appBar: {
    height: 56,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  appBarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.primaryBlue,
  },
  filterContainer: { height: 60, justifyContent: 'center' },
  filterContent: { paddingHorizontal: 16, alignItems: 'center' },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  chipSelected: {
    backgroundColor: colors.primaryBlue,
    borderColor: 'transparent',
  },
  chipUnselected: {
    backgroundColor: colors.white,
    borderColor: 'rgba(108,140,176,0.5)',
  },
  chipText: { fontSize: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyText: { color: colors.grey, fontSize: 16 },
  listContent: { padding: 16 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  cardExpired: { borderColor: 'rgba(244,67,54,0.5)' },
  leadingIcon: {
    padding: 12,
    borderRadius: 12,
    backgroundColor: colors.bg,
  },
  leadingIconExpired: { backgroundColor: colors.redSurface },
  cardBody: { flex: 1, marginLeft: 16 },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: colors.black },
  cardSubtitle: { color: colors.greySubtitle, marginTop: 4, lineHeight: 18 },
  cardSubtitleExpired: { color: colors.red },
  amount: {
    fontSize: 18,
    fontWeight: '900',
    color: colors.primaryBlue,
    marginLeft: 8,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primaryBlue,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: colors.black,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
  },
});
