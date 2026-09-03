import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { User, Shield, CheckSquare, Bell, Flame, Award, ChevronRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { THEME } from '../config/constants';

export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<any>();

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>IN</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>Investor Account</Text>
            <Text style={styles.userEmail}>Synced via PrimeIpo Cloud</Text>
            <View style={styles.planBadge}>
              <Text style={styles.planText}>Active Investor</Text>
            </View>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Flame size={16} color="#fb923c" />
            <Text style={styles.statVal}>50+</Text>
            <Text style={styles.statLabel}>IPOs Tracked</Text>
          </View>
          <View style={styles.statBox}>
            <CheckSquare size={16} color={THEME.colors.success} />
            <Text style={styles.statVal}>1-Click</Text>
            <Text style={styles.statLabel}>Allotment Check</Text>
          </View>
          <View style={styles.statBox}>
            <Award size={16} color={THEME.colors.primaryLight} />
            <Text style={styles.statVal}>Real</Text>
            <Text style={styles.statLabel}>Live GMP Data</Text>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Quick Navigation</Text>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Allotment')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <CheckSquare size={16} color={THEME.colors.primaryLight} />
              <Text style={styles.navItemText}>Manage Saved Family PANs</Text>
            </View>
            <ChevronRight size={16} color={THEME.colors.textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => navigation.navigate('Alerts')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Bell size={16} color={THEME.colors.primaryLight} />
              <Text style={styles.navItemText}>Notification & Alert Triggers</Text>
            </View>
            <ChevronRight size={16} color={THEME.colors.textDim} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.navItem, { borderBottomWidth: 0 }]}
            onPress={() => navigation.navigate('Sectors')}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <Flame size={16} color={THEME.colors.primaryLight} />
              <Text style={styles.navItemText}>Explore Industry Sectors</Text>
            </View>
            <ChevronRight size={16} color={THEME.colors.textDim} />
          </TouchableOpacity>
        </View>

        {/* Security & Compliance */}
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Shield size={16} color={THEME.colors.warning} />
            <Text style={styles.cardHeader}>Security & Compliance</Text>
          </View>
          <Text style={styles.securityDesc}>
            All PAN numbers are encrypted at rest with AES-256 and never logged. Allotment checks are routed through official registrars (Bigshare, KFintech, Link Intime, Cameo & Skyline).
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 14,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#0d1322',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  userName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  userEmail: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
  },
  planBadge: {
    backgroundColor: '#064e3b',
    borderColor: '#059669',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 6,
  },
  planText: {
    color: '#6ee7b7',
    fontSize: 10,
    fontWeight: '800',
  },
  statsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  statBox: {
    flex: 1,
    backgroundColor: THEME.colors.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  statVal: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  statLabel: {
    color: THEME.colors.textDim,
    fontSize: 9,
    fontWeight: '600',
  },
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 16,
  },
  cardHeader: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '800',
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  navItemText: {
    color: THEME.colors.text,
    fontSize: 12,
    fontWeight: '600',
  },
  securityDesc: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    lineHeight: 16,
  },
});
