// Renders a branded logo badge for a biller.
// Shows either a generic ICON (e.g. lightning bolt for electricity providers,
// water drop for water utilities, house for rent) or a TEXT mark (e.g. "N"
// for Netflix, "YT" for YouTube Premium) depending on what's appropriate.

import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getBillerBrand } from '@/constants/billers';

interface Props {
  name: string;
  size?: number;
}

export default function BillerLogo({ name, size = 48 }: Props) {
  const brand = getBillerBrand(name);
  const borderRadius = size * 0.28;
  const fgColor = brand.fgColor ?? '#FFFFFF';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          borderRadius,
          backgroundColor: brand.color,
        },
      ]}
    >
      {brand.type === 'icon' && brand.icon ? (
        <MaterialCommunityIcons
          name={brand.icon}
          size={size * 0.48}
          color={fgColor}
        />
      ) : (
        <Text
          style={[
            styles.mark,
            {
              fontSize: size * 0.3,
              color: fgColor,
            },
          ]}
          numberOfLines={1}
        >
          {brand.mark ?? '?'}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  mark: {
    fontWeight: '900',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
});
