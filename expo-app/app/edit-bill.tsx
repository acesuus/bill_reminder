// Edit Bill screen, a port of the Flutter `EditBillScreen`.
// Mark as paid, edit fields, toggle reminders, delete.

import { useEffect, useState } from 'react';
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
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import { deleteBill, getBillById, updateBill } from '@/db/database';
import { cancelBillReminder, scheduleBillReminder } from '@/services/notifications';
import { Bill } from '@/types/bill';
import { colors } from '@/theme/colors';
import { formatDate } from '@/utils/date';

export default function EditBillScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const billId = Number(id);

  const [bill, setBill] = useState<Bill | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [alarmEnabled, setAlarmEnabled] = useState(true);
  const [isPaid, setIsPaid] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});

  useEffect(() => {
    (async () => {
      const loaded = await getBillById(billId);
      if (loaded) {
        setBill(loaded);
        setTitle(loaded.title);
        setAmount(String(loaded.amount));
        setSelectedDate(new Date(loaded.dueDate));
        setRemindersEnabled(loaded.remindersEnabled);
        setAlarmEnabled(loaded.alarmEnabled);
        setIsPaid(loaded.isPaid);
      }
      setIsLoading(false);
    })();
  }, [billId]);

  const onDateChange = (_event: unknown, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const validate = () => {
    const next: { title?: string; amount?: string } = {};
    if (title.trim().length === 0) next.title = 'Please enter a name';
    if (Number.isNaN(parseFloat(amount))) next.amount = 'Enter a valid amount';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleUpdate = async () => {
    if (!validate() || !bill?.id) return;
    setIsLoading(true);
    try {
      const updated: Bill = {
        ...bill,
        title: title.trim(),
        amount: parseFloat(amount.trim()),
        dueDate: selectedDate.toISOString(),
        isPaid,
        remindersEnabled,
        alarmEnabled,
      };
      await updateBill(updated);

      // Keep scheduled notifications in sync with the new state.
      if (isPaid || (!remindersEnabled && !alarmEnabled)) {
        await cancelBillReminder(bill.id);
      } else {
        let scheduleTime = new Date(
          selectedDate.getFullYear(),
          selectedDate.getMonth(),
          selectedDate.getDate(),
          9,
          0,
          0
        );
        if (scheduleTime.getTime() < Date.now()) {
          scheduleTime = new Date(Date.now() + 2 * 60 * 1000);
        }
        await scheduleBillReminder({
          billId: bill.id,
          title: `Bill Reminder: ${title.trim()}`,
          body: `Your bill of \u20B1${parseFloat(amount.trim()).toFixed(2)} is due today!`,
          scheduledDate: scheduleTime,
          isHighPriorityAlarm: alarmEnabled,
        });
      }

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
          await cancelBillReminder(bill.id);
          await deleteBill(bill.id);
          router.back();
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Stack.Screen
        options={{
          headerRight: () => (
            <TouchableOpacity onPress={confirmDelete} hitSlop={8}>
              <MaterialIcons name="delete-outline" size={24} color={colors.red} />
            </TouchableOpacity>
          ),
        }}
      />

      <View style={styles.paidRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.paidTitle}>Mark as Paid</Text>
          <Text style={styles.paidSubtitle}>Removes from active alerts</Text>
        </View>
        <Switch
          value={isPaid}
          onValueChange={setIsPaid}
          trackColor={{ true: colors.greenTrack }}
          thumbColor={isPaid ? colors.green : undefined}
        />
      </View>
      <View style={styles.divider} />

      <Text style={[styles.label, { marginTop: 10 }]}>Bill Name</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholderTextColor={colors.hint}
      />
      {!!errors.title && <Text style={styles.error}>{errors.title}</Text>}

      <Text style={[styles.label, { marginTop: 15 }]}>Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
        keyboardType="numeric"
        placeholderTextColor={colors.hint}
      />
      {!!errors.amount && <Text style={styles.error}>{errors.amount}</Text>}

      <TouchableOpacity style={styles.row} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.rowText}>Due Date: {formatDate(selectedDate.toISOString())}</Text>
        <MaterialIcons name="calendar-today" size={22} color={colors.primaryBlue} />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker value={selectedDate} mode="date" display="default" onChange={onDateChange} />
      )}

      <View style={styles.switchRow}>
        <Text style={styles.rowText}>Enable Notifications</Text>
        <Switch value={remindersEnabled} onValueChange={setRemindersEnabled} trackColor={{ true: colors.primaryBlue }} />
      </View>
      <View style={styles.switchRow}>
        <Text style={styles.rowText}>Enable Alarm</Text>
        <Switch value={alarmEnabled} onValueChange={setAlarmEnabled} trackColor={{ true: colors.primaryBlue }} />
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={handleUpdate}>
        <Text style={styles.saveButtonText}>Update Bill Details</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  paidRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  paidTitle: { fontSize: 16, fontWeight: 'bold', color: colors.black },
  paidSubtitle: { fontSize: 13, color: colors.greySubtitle, marginTop: 2 },
  divider: { height: 1, backgroundColor: colors.greyBorder, marginVertical: 8, opacity: 0.4 },
  label: { fontSize: 13, color: colors.greySubtitle, marginBottom: 6 },
  input: {
    backgroundColor: colors.white,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.greyBorder,
    color: colors.black,
  },
  error: { color: colors.red, fontSize: 12, marginTop: 4 },
  row: {
    marginTop: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  rowText: { fontSize: 16, color: colors.black },
  switchRow: {
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  saveButton: {
    marginTop: 30,
    backgroundColor: colors.primaryBlue,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
