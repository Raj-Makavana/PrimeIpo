import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { THEME } from '../config/constants';

interface Props {
  status: 'open' | 'upcoming' | 'closed' | 'listed';
  size?: 'sm' | 'md';
}

export const StatusPill: React.FC<Props> = ({ status, size = 'sm' }) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'open':
        return { label: 'LIVE NOW', bg: THEME.colors.successBg, text: THEME.colors.success, border: '#059669' };
      case 'upcoming':
        return { label: 'UPCOMING', bg: THEME.colors.blueBg, text: '#60a5fa', border: '#2563eb' };
      case 'closed':
        return { label: 'CLOSED', bg: '#1e293b', text: THEME.colors.textMuted, border: '#334155' };
      case 'listed':
        return { label: 'LISTED', bg: THEME.colors.purpleBg, text: '#c084fc', border: '#9333ea' };
    }
  };

  const config = getStatusConfig();
  const isSm = size === 'sm';

  return (
    <View style={[styles.container, { backgroundColor: config.bg, borderColor: config.border }, isSm ? styles.sm : styles.md]}>
      <Text style={[styles.text, { color: config.text }, isSm ? styles.textSm : styles.textMd]}>
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  md: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  text: {
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  textSm: {
    fontSize: 10,
  },
  textMd: {
    fontSize: 12,
  },
});
