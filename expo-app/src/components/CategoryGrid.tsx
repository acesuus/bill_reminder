// Reusable GCash-style category picker grid.

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORIES } from '@/constants/categories';
import { colors } from '@/theme/colors';

interface Props {
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export default function CategoryGrid({ selectedId, onSelect }: Props) {
  return (
    <View style={styles.grid}>
      {CATEGORIES.map((cat) => {
        const selected = cat.id === selectedId;
        return (
          <TouchableOpacity
            key={cat.id}
            style={styles.cell}
            activeOpacity={0.7}
            onPress={() => onSelect(cat.id)}
          >
            <View
              style={[
                styles.iconCircle,
                { backgroundColor: cat.color + '1A' },
                selected && { backgroundColor: cat.color, borderColor: cat.color },
              ]}
            >
              <MaterialCommunityIcons
                name={cat.icon}
                size={26}
                color={selected ? colors.white : cat.color}
              />
            </View>
            <Text
              style={[styles.label, selected && { color: colors.text, fontWeight: '700' }]}
              numberOfLines={1}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  cell: {
    width: '25%',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  iconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  label: {
    marginTop: 6,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
