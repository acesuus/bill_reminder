// Custom date picker modal with month/day/year selectors.
// Replaces @react-native-community/datetimepicker to avoid native dependency issues.

import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { colors } from '@/theme/colors';

interface DatePickerProps {
  value: Date;
  onChange: (date: Date) => void;
  visible: boolean;
  onClose: () => void;
  minimumDate?: Date;
}

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export default function DatePicker({ value, onChange, visible, onClose, minimumDate }: DatePickerProps) {
  const [selectedMonth, setSelectedMonth] = useState(value.getMonth());
  const [selectedDay, setSelectedDay] = useState(value.getDate());
  const [selectedYear, setSelectedYear] = useState(value.getFullYear());

  // Sync internal state when value prop changes or modal opens
  useEffect(() => {
    if (visible) {
      setSelectedMonth(value.getMonth());
      setSelectedDay(value.getDate());
      setSelectedYear(value.getFullYear());
    }
  }, [visible, value]);

  const years = useMemo(() => {
    const startYear = minimumDate ? minimumDate.getFullYear() : 2020;
    const endYear = new Date().getFullYear() + 5;
    const list: number[] = [];
    for (let y = startYear; y <= endYear; y++) {
      list.push(y);
    }
    return list;
  }, [minimumDate]);

  const days = useMemo(() => {
    const count = getDaysInMonth(selectedMonth, selectedYear);
    const list: number[] = [];
    for (let d = 1; d <= count; d++) {
      list.push(d);
    }
    return list;
  }, [selectedMonth, selectedYear]);

  // Clamp day if the current selection exceeds the number of days in the new month
  useEffect(() => {
    const maxDay = getDaysInMonth(selectedMonth, selectedYear);
    if (selectedDay > maxDay) {
      setSelectedDay(maxDay);
    }
  }, [selectedMonth, selectedYear, selectedDay]);

  const handleConfirm = () => {
    const maxDay = getDaysInMonth(selectedMonth, selectedYear);
    const day = Math.min(selectedDay, maxDay);
    const newDate = new Date(selectedYear, selectedMonth, day);

    // Enforce minimumDate if provided
    if (minimumDate && newDate < minimumDate) {
      onChange(minimumDate);
    } else {
      onChange(newDate);
    }
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <Text style={styles.title}>Select Date</Text>

          <View style={styles.columns}>
            {/* Month column */}
            <View style={styles.column}>
              <Text style={styles.columnHeader}>Month</Text>
              <FlatList
                data={MONTHS}
                keyExtractor={(item) => item}
                showsVerticalScrollIndicator={false}
                style={styles.list}
                renderItem={({ item, index }) => (
                  <TouchableOpacity
                    style={[styles.item, index === selectedMonth && styles.itemSelected]}
                    onPress={() => setSelectedMonth(index)}
                  >
                    <Text
                      style={[styles.itemText, index === selectedMonth && styles.itemTextSelected]}
                    >
                      {item.slice(0, 3)}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Day column */}
            <View style={styles.column}>
              <Text style={styles.columnHeader}>Day</Text>
              <FlatList
                data={days}
                keyExtractor={(item) => String(item)}
                showsVerticalScrollIndicator={false}
                style={styles.list}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.item, item === selectedDay && styles.itemSelected]}
                    onPress={() => setSelectedDay(item)}
                  >
                    <Text
                      style={[styles.itemText, item === selectedDay && styles.itemTextSelected]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>

            {/* Year column */}
            <View style={styles.column}>
              <Text style={styles.columnHeader}>Year</Text>
              <FlatList
                data={years}
                keyExtractor={(item) => String(item)}
                showsVerticalScrollIndicator={false}
                style={styles.list}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[styles.item, item === selectedYear && styles.itemSelected]}
                    onPress={() => setSelectedYear(item)}
                  >
                    <Text
                      style={[styles.itemText, item === selectedYear && styles.itemTextSelected]}
                    >
                      {item}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </View>

          {/* Action buttons */}
          <View style={styles.actions}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmText}>Confirm</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '85%',
    maxHeight: '70%',
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  columns: {
    flexDirection: 'row',
    gap: 8,
  },
  column: {
    flex: 1,
    alignItems: 'center',
  },
  columnHeader: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.textMuted,
    marginBottom: 8,
  },
  list: {
    maxHeight: 200,
  },
  item: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    marginBottom: 4,
    alignItems: 'center',
  },
  itemSelected: {
    backgroundColor: colors.primary,
  },
  itemText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  itemTextSelected: {
    color: colors.white,
    fontWeight: '800',
  },
  actions: {
    flexDirection: 'row',
    marginTop: 20,
    gap: 12,
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.textMuted,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmText: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.white,
  },
});
