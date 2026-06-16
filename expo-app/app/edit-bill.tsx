// Edit Bill — change category/biller/amount/date, mark as paid, or delete.

import { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteBill, getBillById, updateBill } from '@/db/database';
import { Bill } from '@/types/bill';
import { getCategory } from '@/constants/categories';
import CategoryGrid from '@/components/CategoryGrid';
import { colors, CURRENCY_SYMBOL } from '@/theme/colors';
import { formatLongDate } from '@/utils/date';

export default function EditBillScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const billId = Number(id);

  const [bill, setBill] = useState<Bill | null>(null);
  const [category, setCategory] = useState<string>('other');
  const [showCategoryGrid, setShowCategoryGrid] = useState(false);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});

  useEffect(() => {
    (async () => {
      const loaded = await getBillById(billId);
      if (loaded) {
        setBill(loaded);
        setCategory(loaded.category);
        setTitle(loaded.title);
        setAmount(String(loaded.amount));
        setSelectedDate(new Date(loaded.dueDate));
        setIsPaid(loaded.isPaid);
      }
      setIsLoading(false);
    })();
  }, [billId]);

  const cat = useMemo(() => getCategory(category), [category]);

  const onDateChange = (_event: unknown, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const validate = () => {
    const next: typeof errors = {};
    if (title.trim().length === 0) next.title = 'Please enter a biller / bill name';
    if (Number.isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
      next.amount = 'Enter a valid amount';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate() || !bill?.id) return;
    setIsLoading(true);
    try {
      await updateBill({
        ...bill,
        title: title.trim(),
        amount: parseFloat(amount.trim()),
        category,
        dueDate: selectedDate.toISOString(),
        isPaid,
      });
      router.back();
    } catch (e) {
      Alert.alert('Error', `Error updating: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmDelete = () => {
    Alert.alert('Delete Bill?', 'Are you sure you want to permanently delete this bill?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          if (!bill?.id) return;
          setIsLoading(true);
          await deleteBill(bill.id);
          router.back();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={confirmDelete} hitSlop={8}>
              <MaterialIcons name="delete-outline" size={24} color={colors.danger} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* --- MARK AS PAID --- */}
        <View style={[styles.paidCard, isPaid && styles.paidCardOn]}>
          <View style={styles.paidIcon}>
            <MaterialCommunityIcons
              name={isPaid ? 'check-circle' : 'clock-outline'}
              size={26}
              color={isPaid ? colors.success : colors.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.paidTitle}>{isPaid ? 'Paid' : 'Mark as Paid'}</Text>
            <Text style={styles.paidSubtitle}>Removes this bill from active alerts</Text>
          </View>
          <Switch
            value={isPaid}
            onValueChange={setIsPaid}
            trackColor={{ true: colors.success, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>

        {/* --- CATEGORY --- */}
        <Text style={styles.sectionTitle}>Category</Text>
        <TouchableOpacity
          style={styles.categoryRow}
          activeOpacity={0.8}
          onPress={() => setShowCategoryGrid((v) => !v)}
        >
          <View style={[styles.catIcon, { backgroundColor: cat.color + '1A' }]}>
            <MaterialCommunityIcons name={cat.icon} size={22} color={cat.color} />
          </View>
          <Text style={styles.categoryLabel}>{cat.label}</Text>
          <Text style={styles.changeText}>{showCategoryGrid ? 'Done' : 'Change'}</Text>
        </TouchableOpacity>
        {showCategoryGrid && (
          <View style={styles.card}>
            <CategoryGrid
              selectedId={category}
              onSelect={(id) => {
                setCategory(id);
                setShowCategoryGrid(false);
              }}
            />
          </View>
        )}

        {/* --- BILLER --- */}
        <Text style={styles.sectionTitle}>Biller / Provider</Text>
        <TextInput
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          placeholderTextColor={colors.hint}
        />
        {!!errors.title && <Text style={styles.error}>{errors.title}</Text>}

        {/* --- AMOUNT --- */}
        <Text style={styles.sectionTitle}>Amount</Text>
        <View style={styles.amountWrap}>
          <Text style={styles.currency}>{CURRENCY_SYMBOL}</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            style={styles.amountInput}
            keyboardType="numeric"
            placeholderTextColor={colors.hint}
          />
        </View>
        {!!errors.amount && <Text style={styles.error}>{errors.amount}</Text>}

        {/* --- DUE DATE --- */}
        <Text style={styles.sectionTitle}>Due date</Text>
        <TouchableOpacity style={styles.dateRow} onPress={() => setShowDatePicker(true)}>
          <MaterialCommunityIcons name="calendar-month-outline" size={22} color={colors.primary} />
          <Text style={styles.dateText}>{formatLongDate(selectedDate)}</Text>
          <MaterialIcons name="chevron-right" size={22} color={colors.textFaint} />
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
        )}

        <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={handleUpdate}>
          <Text style={styles.saveButtonText}>Save Changes</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  paidCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1.5,
    borderColor: colors.border,
  },
  paidCardOn: { borderColor: colors.success, backgroundColor: colors.successSurface },
  paidIcon: { width: 36, alignItems: 'center' },
  paidTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  paidSubtitle: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 18,
    marginBottom: 10,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  catIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  categoryLabel: { flex: 1, fontSize: 16, fontWeight: '700', color: colors.text },
  changeText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 8,
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 6, fontWeight: '600' },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
  },
  amountWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  currency: { fontSize: 22, fontWeight: '800', color: colors.primary, marginRight: 6 },
  amountInput: { flex: 1, fontSize: 22, fontWeight: '700', color: colors.text, paddingVertical: 12 },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  dateText: { flex: 1, fontSize: 16, color: colors.text, fontWeight: '600' },
  saveButton: {
    marginTop: 28,
    backgroundColor: colors.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
});
