// Add Bill — GCash-style: pick a category, then a biller, amount, due date,
// and optionally attach a photo of the bill.

import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
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
import * as ImagePicker from 'expo-image-picker';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { insertBill } from '@/db/database';
import { saveImageLocally } from '@/utils/images';
import { getCategory } from '@/constants/categories';
import CategoryGrid from '@/components/CategoryGrid';
import BillerLogo from '@/components/BillerLogo';
import { colors, CURRENCY_SYMBOL } from '@/theme/colors';
import { formatLongDate } from '@/utils/date';

export default function AddBillScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [category, setCategory] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [recurrence, setRecurrence] = useState<'none' | 'monthly'>('none');
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [backImageUri, setBackImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ category?: string; title?: string; amount?: string }>({});

  const billers = useMemo(
    () => (category ? getCategory(category).billers : []),
    [category]
  );

  const pickImage = async (isFront: boolean) => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera permission required', 'Please allow camera access to capture bill photos.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (!result.canceled && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      if (isFront) setFrontImageUri(uri);
      else setBackImageUri(uri);
    }
  };

  const onDateChange = (_event: unknown, date?: Date) => {
    setShowDatePicker(Platform.OS === 'ios');
    if (date) setSelectedDate(date);
  };

  const validate = () => {
    const next: typeof errors = {};
    if (!category) next.category = 'Please choose a category';
    if (title.trim().length === 0) next.title = 'Please enter a biller / bill name';
    if (Number.isNaN(parseFloat(amount)) || parseFloat(amount) <= 0)
      next.amount = 'Enter a valid amount';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveBill = async () => {
    if (!validate() || !currentUser || !category) return;
    setIsLoading(true);
    try {
      const uniqueRef = String(Date.now());
      const frontPath = await saveImageLocally(frontImageUri, uniqueRef, 'front');
      const backPath = await saveImageLocally(backImageUri, uniqueRef, 'back');

      await insertBill({
        title: title.trim(),
        amount: parseFloat(amount.trim()),
        category,
        dueDate: selectedDate.toISOString(),
        isPaid: false,
        recurrence,
        userId: currentUser.id,
        frontImagePath: frontPath,
        backImagePath: backPath,
      });

      router.back();
    } catch (e) {
      Alert.alert('Error', `Error saving bill: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      setIsLoading(false);
    }
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
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* --- CATEGORY --- */}
        <Text style={styles.sectionTitle}>Select a category</Text>
        <View style={styles.card}>
          <CategoryGrid selectedId={category} onSelect={(id) => setCategory(id)} />
        </View>
        {!!errors.category && <Text style={styles.error}>{errors.category}</Text>}

        {/* --- BILLER --- */}
        {!!category && (
          <>
            <Text style={styles.sectionTitle}>Biller / Provider</Text>
            {billers.length > 0 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.billerRow}
              >
                {billers.map((b) => {
                  const active = title.trim() === b;
                  return (
                    <TouchableOpacity
                      key={b}
                      activeOpacity={0.8}
                      onPress={() => setTitle(b)}
                      style={[styles.billerChip, active && styles.billerChipActive]}
                    >
                      <BillerLogo name={b} size={28} />
                      <Text style={[styles.billerChipText, active && { color: colors.white }]}>
                        {b}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}
            <TextInput
              value={title}
              onChangeText={setTitle}
              style={styles.input}
              placeholder="e.g. PALECO, MERALCO, or a custom name"
              placeholderTextColor={colors.hint}
            />
            {!!errors.title && <Text style={styles.error}>{errors.title}</Text>}
          </>
        )}

        {/* --- AMOUNT --- */}
        <Text style={styles.sectionTitle}>Amount</Text>
        <View style={styles.amountWrap}>
          <Text style={styles.currency}>{CURRENCY_SYMBOL}</Text>
          <TextInput
            value={amount}
            onChangeText={setAmount}
            style={styles.amountInput}
            keyboardType="numeric"
            placeholder="0.00"
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
          <DateTimePicker
            value={selectedDate}
            mode="date"
            display="default"
            minimumDate={new Date()}
            onChange={onDateChange}
          />
        )}

        {/* --- RECURRING --- */}
        <View style={styles.recurrenceRow}>
          <MaterialCommunityIcons name="repeat" size={22} color={colors.primary} />
          <Text style={styles.recurrenceText}>Repeat monthly</Text>
          <Switch
            value={recurrence === 'monthly'}
            onValueChange={(v) => setRecurrence(v ? 'monthly' : 'none')}
            trackColor={{ true: colors.primary, false: colors.border }}
            thumbColor={colors.white}
          />
        </View>
        {recurrence === 'monthly' && (
          <Text style={styles.recurrenceHint}>
            A new bill will be created automatically next month when you mark this one paid.
          </Text>
        )}

        {/* --- PHOTOS --- */}
        <Text style={styles.sectionTitle}>Attach bill photo (optional)</Text>
        <View style={styles.photoRow}>
          <PhotoBox uri={frontImageUri} label="Front" onPress={() => pickImage(true)} />
          <PhotoBox uri={backImageUri} label="Back" onPress={() => pickImage(false)} />
        </View>

        <TouchableOpacity style={styles.saveButton} activeOpacity={0.85} onPress={saveBill}>
          <Text style={styles.saveButtonText}>Save Bill</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function PhotoBox({
  uri,
  label,
  onPress,
}: {
  uri: string | null;
  label: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity style={styles.photoBox} activeOpacity={0.8} onPress={onPress}>
      {uri ? (
        <Image source={{ uri }} style={styles.photo} />
      ) : (
        <View style={styles.photoPlaceholder}>
          <MaterialCommunityIcons name="camera-plus-outline" size={26} color={colors.textFaint} />
          <Text style={styles.photoLabel}>{label}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginTop: 18,
    marginBottom: 10,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 8,
    shadowColor: colors.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 1,
  },
  error: { color: colors.danger, fontSize: 12, marginTop: 6, fontWeight: '600' },
  billerRow: { paddingVertical: 2, paddingRight: 8, gap: 8 },
  billerChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 8,
  },
  billerChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  billerChipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  input: {
    backgroundColor: colors.white,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
    color: colors.text,
    marginTop: 10,
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
  recurrenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginTop: 14,
  },
  recurrenceText: { flex: 1, fontSize: 15, color: colors.text, fontWeight: '600' },
  recurrenceHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 6,
    paddingHorizontal: 4,
  },
  photoRow: { flexDirection: 'row', gap: 12 },
  photoBox: {
    flex: 1,
    height: 110,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
    borderRadius: 12,
    overflow: 'hidden',
  },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoLabel: { color: colors.textMuted, marginTop: 6, fontWeight: '600' },
  photo: { width: '100%', height: '100%' },
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
