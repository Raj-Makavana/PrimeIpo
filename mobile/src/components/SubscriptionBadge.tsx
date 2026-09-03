import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../config/constants';

interface Props {
  total: number;
}

export const SubscriptionBadge: React.FC<Props> = ({ total }) => {
  return (
    <View style={styles.badge}>
      <Text style={styles.text}>
        Sub: <Text style={styles.value}>{total > 0 ? `${total}×` : '—'}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    backgroundColor: '#1e1b4b',
    borderColor: '#4338ca',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  text: {
    color: '#a5b4fc',
    fontSize: 11,
    fontWeight: '600',
  },
  value: {
    color: '#e0e7ff',
    fontWeight: '800',
  },
});
