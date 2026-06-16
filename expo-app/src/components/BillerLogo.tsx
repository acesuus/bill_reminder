// Renders an app-style branded logo badge for a biller.
// Uses the brand color + short mark (e.g. orange "MER" for Meralco).
// Works 100% offline — no images to download.

import { StyleSheet, Text, View } from 'react-native';
import { getBillerBrand } from '@/constants/billers';

interface Props {
  name: string;
  size?: number;
}

export default function BillerLogo({ name, size = 48 }: Props) {
  const brand = getBillerBrand(name);
  const fontSize = size * 0.3;
  const borderRadius = size * 0.28;

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
      <Text
        style={[
          styles.mark,
          {
            fontSize,
            color: brand.textColor ?? '#FFFFFF',
          },
        ]}
        numberOfLines={1}
      >
        {brand.mark}
      </Text>
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
