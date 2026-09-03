import { Platform } from 'react-native';

// For Android Emulator: 10.0.2.2 points to localhost; for iOS / web: localhost
// For physical devices: replace with LAN IP e.g. 192.168.x.x
export const API_BASE_URL = Platform.select({
  android: 'http://10.0.2.2:3000',
  ios: 'http://localhost:3000',
  default: 'http://localhost:3000',
});

export const THEME = {
  colors: {
    background: '#0b0f19',
    card: '#131b2e',
    cardBorder: '#1e293b',
    primary: '#6366f1',
    primaryDark: '#4f46e5',
    primaryLight: '#818cf8',
    text: '#f8fafc',
    textMuted: '#94a3b8',
    textDim: '#64748b',
    success: '#10b981',
    successBg: '#064e3b',
    warning: '#f59e0b',
    warningBg: '#78350f',
    danger: '#ef4444',
    dangerBg: '#7f1d1d',
    purple: '#a855f7',
    purpleBg: '#581c87',
    blue: '#3b82f6',
    blueBg: '#1e3a8a',
  },
};
