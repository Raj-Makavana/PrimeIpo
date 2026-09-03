import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Building2, Calendar, ShieldCheck, ChevronRight } from 'lucide-react-native';
import { IpoData } from '../types';
import { THEME } from '../config/constants';
import { StatusPill } from './StatusPill';
import { GmpBadge } from './GmpBadge';
import { SubscriptionBadge } from './SubscriptionBadge';

interface Props {
  ipo: IpoData;
  onPress: () => void;
}

export const IpoCard: React.FC<Props> = ({ ipo, onPress }) => {
  const minInvestment = (ipo.priceBandHigh || ipo.priceBandLow) * ipo.lotSize;
  const isBigshare = ipo.registrar?.toLowerCase().includes('bigshare');

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Top Header: Symbol & Status */}
      <View style={styles.header}>
        <View style={styles.companyInfo}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{ipo.symbol.substring(0, 2).toUpperCase()}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.companyName} numberOfLines={1}>
                {ipo.companyName}
              </Text>
              <View style={styles.typeBadge}>
                <Text style={styles.typeText}>{ipo.type.toUpperCase()}</Text>
              </View>
            </View>
            <Text style={styles.sectorText} numberOfLines={1}>
              {ipo.sector}
            </Text>
          </View>
        </View>
        <StatusPill status={ipo.status} />
      </View>

      {/* Metrics Row: Price Band & Lot Size */}
      <View style={styles.metricsGrid}>
        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Price Band</Text>
          <Text style={styles.metricValue}>
            {ipo.priceBandLow > 0 && ipo.priceBandHigh > ipo.priceBandLow
              ? `₹${ipo.priceBandLow} – ₹${ipo.priceBandHigh}`
              : `₹${ipo.priceBandHigh || ipo.priceBandLow}`}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Lot Size</Text>
          <Text style={styles.metricValue}>{ipo.lotSize} Shares</Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Min Investment</Text>
          <Text style={[styles.metricValue, { color: THEME.colors.success }]}>
            ₹{minInvestment > 0 ? minInvestment.toLocaleString('en-IN') : '—'}
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={styles.metricLabel}>Dates</Text>
          <Text style={styles.metricValue} numberOfLines={1}>
            {ipo.openDate.substring(5)} to {ipo.closeDate.substring(5)}
          </Text>
        </View>
      </View>

      {/* Bottom Row: GMP + Subscription + Registrar */}
      <View style={styles.footer}>
        <View style={styles.badgesRow}>
          <GmpBadge gmp={ipo.gmpCurrent} gmpPct={ipo.gmpPct} />
          <SubscriptionBadge total={ipo.subscriptionTotal} />
        </View>

        <View style={styles.registrarTag}>
          <ShieldCheck size={11} color={isBigshare ? THEME.colors.success : THEME.colors.textDim} />
          <Text style={styles.registrarText} numberOfLines={1}>
            {ipo.registrar || 'Registrar'}
          </Text>
          <ChevronRight size={14} color={THEME.colors.textDim} />
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: THEME.colors.card,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 14,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 12,
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: THEME.colors.primaryLight,
    fontWeight: '900',
    fontSize: 14,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  companyName: {
    color: THEME.colors.text,
    fontSize: 14,
    fontWeight: '800',
    flexShrink: 1,
  },
  typeBadge: {
    backgroundColor: '#1e1b4b',
    borderColor: '#4338ca',
    borderWidth: 1,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  typeText: {
    color: '#818cf8',
    fontSize: 9,
    fontWeight: '700',
  },
  sectorText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#0a0f1d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    marginBottom: 12,
  },
  metricItem: {
    width: '50%',
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  metricLabel: {
    color: THEME.colors.textDim,
    fontSize: 10,
    fontWeight: '500',
  },
  metricValue: {
    color: THEME.colors.text,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 1,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  badgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  registrarTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    maxWidth: '40%',
  },
  registrarText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '500',
    flexShrink: 1,
  },
});
