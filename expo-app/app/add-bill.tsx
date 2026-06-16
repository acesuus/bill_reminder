// Add Bill screen, a port of the Flutter `AddBillScreen`.

import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { insertBill } from '@/db/database';
import { saveImageLocally } from '@/utils/images';
import { colors } from '@/theme/colors';
import { formatDate } from '@/utils/date';

export default function AddBillScreen() {
  const router = useRouter();
  const { currentUser } = useAuth();

  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [frontImageUri, setFrontImageUri] = useState<string | null>(null);
  const [backImageUri, setBackImageUri] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ title?: string; amount?: string }>({});

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
    const next: { title?: string; amount?: string } = {};
    if (title.trim().length === 0) next.title = 'Please enter a name';
    if (Number.isNaN(parseFloat(amount))) next.amount = 'Enter a valid amount';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const saveBill = async () => {
    if (!validate()) return;
    if (!currentUser) return;
    setIsLoading(true);
    try {
      const uniqueRef = String(Date.now());
      const frontPath = await saveImageLocally(frontImageUri, uniqueRef, 'front');
      const backPath = await saveImageLocally(backImageUri, uniqueRef, 'back');

      await insertBill({
        title: title.trim(),
        amount: parseFloat(amount.trim()),
        dueDate: selectedDate.toISOString(),
        isPaid: false,
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
        <ActivityIndicator size="large" color={colors.primaryBlue} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.label}>Bill Name (e.g., Electric)</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        style={styles.input}
        placeholder="Bill Name"
        placeholderTextColor={colors.hint}
      />
      {!!errors.title && <Text style={styles.error}>{errors.title}</Text>}

      <Text style={[styles.label, { marginTop: 15 }]}>Amount</Text>
      <TextInput
        value={amount}
        onChangeText={setAmount}
        style={styles.input}
        keyboardType="numeric"
        placeholder="0.00"
        placeholderTextColor={colors.hint}
      />
      {!!errors.amount && <Text style={styles.error}>{errors.amount}</Text>}

      <TouchableOpacity style={styles.row} onPress={() => setShowDatePicker(true)}>
        <Text style={styles.rowText}>Due Date: {formatDate(selectedDate.toISOString())}</Text>
        <MaterialIcons name="calendar-today" size={22} color={colors.primaryBlue} />
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

      {/* Photo upload previews */}
      <View style={styles.photoRow}>
        <TouchableOpacity style={styles.photoBox} onPress={() => pickImage(true)}>
          {frontImageUri ? (
            <Image source={{ uri: frontImageUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialIcons name="photo-camera" size={24} color={colors.grey} />
              <Text style={styles.photoLabel}>Front</Text>
            </View>
          )}
        </TouchableOpacity>
        <TouchableOpacity style={styles.photoBox} onPress={() => pickImage(false)}>
          {backImageUri ? (
            <Image source={{ uri: backImageUri }} style={styles.photo} />
          ) : (
            <View style={styles.photoPlaceholder}>
              <MaterialIcons name="photo-camera" size={24} color={colors.grey} />
              <Text style={styles.photoLabel}>Back</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.saveButton} onPress={saveBill}>
        <Text style={styles.saveButtonText}>Save Bill</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
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
  photoRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
  },
  photoBox: {
    height: 100,
    width: 100,
    backgroundColor: colors.greyLight,
    borderWidth: 1,
    borderColor: colors.greyBorder,
    borderRadius: 8,
    overflow: 'hidden',
  },
  photoPlaceholder: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoLabel: { color: colors.grey, marginTop: 4 },
  photo: { width: '100%', height: '100%' },
  saveButton: {
    marginTop: 30,
    backgroundColor: colors.primaryBlue,
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonText: { color: colors.white, fontSize: 16, fontWeight: 'bold' },
});
