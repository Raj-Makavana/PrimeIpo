import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { TrendingUp, TrendingDown } from 'lucide-react-native';
import { THEME } from '../config/constants';

interface Props {
  gmp: number;
  gmpPct: number;
}

export const GmpBadge: React.FC<Props> = ({ gmp, gmpPct }) => {
  const isPositive = gmp >= 0;
  const isZero = gmp === 0;

  const color = isZero ? THEME.colors.textMuted : isPositive ? THEME.colors.success : THEME.colors.danger;
  const bg = isZero ? '#1e293b' : isPositive ? '#064e3b' : '#7f1d1d';
  const border = isZero ? '#334155' : isPositive ? '#059669' : '#dc2626';

  return (
    <View style={[styles.badge, { backgroundColor: bg, borderColor: border }]}>
      {isPositive ? (
        <TrendingUp size={12} color={color} />
      ) : (
        <TrendingDown size={12} color={color} />
      )}
      <Text style={[styles.text, { color }]}>
        GMP: {isPositive && !isZero ? '+' : ''}₹{gmp} ({gmpPct > 0 ? `+${gmpPct}%` : `${gmpPct}%`})
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
  },
});
