import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import * as WebBrowser from 'expo-web-browser';
import {
  Building2,
  Calendar,
  ShieldCheck,
  Zap,
  ExternalLink,
  CheckCircle2,
  TrendingUp,
  Award,
} from 'lucide-react-native';
import { fetchIpoDetail, fetchPans, checkAllotment } from '../services/api';
import { IpoData, SavedPan, AllotmentCheckResponse, RootStackParamList } from '../types';
import { THEME } from '../config/constants';
import { StatusPill } from '../components/StatusPill';
import { GmpBadge } from '../components/GmpBadge';
import { SubscriptionBadge } from '../components/SubscriptionBadge';

type RouteType = RouteProp<RootStackParamList, 'IpoDetail'>;

export const IpoDetailScreen: React.FC = () => {
  const route = useRoute<RouteType>();
  const { id } = route.params;

  const [ipo, setIpo] = useState<IpoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'financials' | 'allotment'>('overview');

  // Allotment inline check state
  const [pans, setPans] = useState<SavedPan[]>([]);
  const [customPan, setCustomPan] = useState('');
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkResult, setCheckResult] = useState<AllotmentCheckResponse | null>(null);

  useEffect(() => {
    async function load() {
      const [ipoData, panData] = await Promise.all([fetchIpoDetail(id), fetchPans()]);
      setIpo(ipoData);
      setPans(panData);
      setLoading(false);
    }
    load();
  }, [id]);

  const handleCheck = async (targetPan?: string, panHash?: string) => {
    if (!ipo) return;
    setCheckLoading(true);
    setCheckResult(null);

    const res = await checkAllotment({
      ipoId: ipo.id,
      pan: targetPan || customPan || undefined,
      panHash,
      registrar: ipo.registrar,
      companyName: ipo.companyName,
    });

    setCheckResult(res);
    setCheckLoading(false);
  };

  const handleOpenRegistrar = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      Alert.alert('Error', 'Unable to open registrar link in browser');
    }
  };

  if (loading || !ipo) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Loading IPO details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const minInvestment = (ipo.priceBandHigh || ipo.priceBandLow) * ipo.lotSize;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroHeader}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={styles.heroTitle} numberOfLines={2}>
                  {ipo.companyName}
                </Text>
              </View>
              <Text style={styles.heroSub}>
                {ipo.type.toUpperCase()} • Symbol: {ipo.symbol}
              </Text>
            </View>
            <StatusPill status={ipo.status} size="md" />
          </View>

          {/* Highlights Row */}
          <View style={styles.metricsRow}>
            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel}>Price Band</Text>
              <Text style={styles.metricBoxVal}>
                ₹{ipo.priceBandLow} – ₹{ipo.priceBandHigh}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel}>Lot Size</Text>
              <Text style={styles.metricBoxVal}>{ipo.lotSize} Shares</Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel}>Min Amount</Text>
              <Text style={[styles.metricBoxVal, { color: THEME.colors.success }]}>
                ₹{minInvestment.toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.metricBox}>
              <Text style={styles.metricBoxLabel}>Issue Size</Text>
              <Text style={[styles.metricBoxVal, { color: '#c7d2fe' }]}>
                ₹{ipo.issueSize} Cr
              </Text>
            </View>
          </View>

          {/* Badges strip */}
          <View style={styles.badgesStrip}>
            <GmpBadge gmp={ipo.gmpCurrent} gmpPct={ipo.gmpPct} />
            <SubscriptionBadge total={ipo.subscriptionTotal} />
          </View>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabsContainer}>
          {(['overview', 'financials', 'allotment'] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              onPress={() => setActiveTab(tab)}
              style={[styles.tabButton, activeTab === tab && styles.tabButtonActive]}
            >
              <Text style={[styles.tabButtonText, activeTab === tab && styles.tabButtonTextActive]}>
                {tab === 'allotment' ? 'Allotment' : tab.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <View style={styles.section}>
            {/* Timeline */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>IPO Schedule & Dates</Text>
              <View style={styles.dateGrid}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxLabel}>Opens</Text>
                  <Text style={styles.dateBoxVal}>{ipo.openDate}</Text>
                </View>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxLabel}>Closes</Text>
                  <Text style={styles.dateBoxVal}>{ipo.closeDate}</Text>
                </View>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxLabel}>Allotment</Text>
                  <Text style={[styles.dateBoxVal, { color: THEME.colors.success }]}>
                    {ipo.allotmentDate}
                  </Text>
                </View>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxLabel}>Listing</Text>
                  <Text style={[styles.dateBoxVal, { color: '#c084fc' }]}>
                    {ipo.listingDate}
                  </Text>
                </View>
              </View>
            </View>

            {/* Subscription breakdown */}
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Live Subscription Breakdown</Text>
              <View style={styles.subGrid}>
                <View style={styles.subRow}>
                  <Text style={styles.subCat}>QIB (Institutional)</Text>
                  <Text style={styles.subVal}>{ipo.subscriptionQib}×</Text>
                </View>
                <View style={styles.subRow}>
                  <Text style={styles.subCat}>NII (Non-Institutional)</Text>
                  <Text style={styles.subVal}>{ipo.subscriptionNii}×</Text>
                </View>
                <View style={styles.subRow}>
                  <Text style={styles.subCat}>Retail Individual</Text>
                  <Text style={styles.subVal}>{ipo.subscriptionRetail}×</Text>
                </View>
                <View style={[styles.subRow, styles.subRowTotal]}>
                  <Text style={styles.subCatTotal}>Total Subscription</Text>
                  <Text style={styles.subValTotal}>{ipo.subscriptionTotal}×</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Tab 2: Financials */}
        {activeTab === 'financials' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Financial Summary</Text>
              <Text style={styles.textMuted}>
                Registrar: <Text style={{ color: '#fff', fontWeight: '700' }}>{ipo.registrar}</Text>
              </Text>
              <Text style={[styles.textMuted, { marginTop: 6 }]}>
                Sector: <Text style={{ color: '#fff', fontWeight: '700' }}>{ipo.sector}</Text>
              </Text>
              <Text style={[styles.textMuted, { marginTop: 6 }]}>
                Face Value: <Text style={{ color: '#fff', fontWeight: '700' }}>₹{ipo.faceValue} per share</Text>
              </Text>
              <Text style={[styles.textMuted, { marginTop: 12, lineHeight: 18 }]}>
                {ipo.description}
              </Text>
            </View>
          </View>
        )}

        {/* Tab 3: Allotment */}
        {activeTab === 'allotment' && (
          <View style={styles.section}>
            <View style={styles.card}>
              <Text style={styles.cardHeader}>Check Allotment Status</Text>
              <Text style={styles.textMuted}>
                Registrar: <Text style={{ color: '#fff', fontWeight: '700' }}>{ipo.registrar}</Text>
              </Text>

              {/* Saved PANs quick check */}
              {pans.length > 0 && (
                <View style={{ marginTop: 12 }}>
                  <Text style={styles.subHeader}>Saved Family PANs:</Text>
                  {pans.map((p) => (
                    <TouchableOpacity
                      key={p.id}
                      style={styles.panCheckBtn}
                      onPress={() => handleCheck(undefined, p.panHash)}
                      disabled={checkLoading}
                    >
                      <View>
                        <Text style={styles.panLabel}>{p.label}</Text>
                        <Text style={styles.panMasked}>{p.maskedPan}</Text>
                      </View>
                      <Zap size={14} color={THEME.colors.primaryLight} />
                    </TouchableOpacity>
                  ))}
                </View>
              )}

              {/* Custom PAN Input */}
              <View style={{ marginTop: 14 }}>
                <Text style={styles.subHeader}>Or Enter 10-Digit PAN:</Text>
                <TextInput
                  placeholder="ABCDE1234F"
                  placeholderTextColor={THEME.colors.textDim}
                  value={customPan}
                  onChangeText={(t) => setCustomPan(t.toUpperCase())}
                  maxLength={10}
                  style={styles.panInput}
                />
                <TouchableOpacity
                  style={styles.checkSubmitBtn}
                  onPress={() => handleCheck(customPan)}
                  disabled={checkLoading || customPan.length !== 10}
                >
                  {checkLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.checkSubmitText}>Check Result</Text>
                  )}
                </TouchableOpacity>
              </View>

              {/* Check Result Display */}
              {checkResult && (
                <View style={styles.resultBox}>
                  {checkResult.requiresCaptcha ? (
                    <View style={{ gap: 8 }}>
                      <Text style={styles.captchaTitle}>Captcha Required by {ipo.registrar}</Text>
                      <Text style={styles.captchaDesc}>{checkResult.message}</Text>
                      {checkResult.redirectUrl && (
                        <TouchableOpacity
                          style={styles.openWebBtn}
                          onPress={() => handleOpenRegistrar(checkResult.redirectUrl!)}
                        >
                          <Text style={styles.openWebText}>Open Registrar Portal</Text>
                          <ExternalLink size={14} color="#fff" />
                        </TouchableOpacity>
                      )}
                    </View>
                  ) : checkResult.success ? (
                    <View style={{ gap: 6 }}>
                      <Text style={styles.resultStatus}>
                        {checkResult.data?.status === 'allotted' ? '🎉 ALLOTTED!' : 'NOT ALLOTTED'}
                      </Text>
                      {checkResult.data?.status === 'allotted' && (
                        <Text style={{ color: THEME.colors.success, fontSize: 13, fontWeight: '700' }}>
                          Shares Allotted: {checkResult.data.shares}
                        </Text>
                      )}
                      <Text style={styles.disclaimerText}>{checkResult.disclaimer}</Text>
                    </View>
                  ) : (
                    <Text style={{ color: THEME.colors.danger, fontSize: 12 }}>
                      {checkResult.error || 'Failed to retrieve allotment status.'}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        )}
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
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
    marginTop: 10,
  },
  heroCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    padding: 16,
    marginBottom: 16,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 14,
  },
  heroTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '900',
  },
  heroSub: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    backgroundColor: '#0a0f1d',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    marginBottom: 12,
  },
  metricBox: {
    width: '50%',
    padding: 4,
  },
  metricBoxLabel: {
    color: THEME.colors.textDim,
    fontSize: 10,
  },
  metricBoxVal: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  badgesStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#131b2e',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabButtonActive: {
    backgroundColor: THEME.colors.primary,
  },
  tabButtonText: {
    color: THEME.colors.textDim,
    fontSize: 11,
    fontWeight: '700',
  },
  tabButtonTextActive: {
    color: '#fff',
  },
  section: {
    gap: 12,
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
    marginBottom: 12,
  },
  dateGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dateBox: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#0a0f1d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
  },
  dateBoxLabel: {
    color: THEME.colors.textDim,
    fontSize: 10,
  },
  dateBoxVal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  subGrid: {
    gap: 8,
  },
  subRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  subRowTotal: {
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    paddingTop: 8,
  },
  subCat: {
    color: THEME.colors.textMuted,
    fontSize: 12,
  },
  subVal: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  subCatTotal: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  subValTotal: {
    color: THEME.colors.primaryLight,
    fontSize: 14,
    fontWeight: '900',
  },
  textMuted: {
    color: THEME.colors.textMuted,
    fontSize: 12,
  },
  subHeader: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 6,
  },
  panCheckBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0f1d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
    marginBottom: 6,
  },
  panLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  panMasked: {
    color: THEME.colors.primaryLight,
    fontSize: 11,
  },
  panInput: {
    backgroundColor: '#0a0f1d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    color: '#fff',
    padding: 10,
    fontSize: 13,
    letterSpacing: 1,
    fontWeight: '700',
  },
  checkSubmitBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  checkSubmitText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  resultBox: {
    backgroundColor: '#0a0f1d',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
    marginTop: 14,
  },
  captchaTitle: {
    color: THEME.colors.warning,
    fontSize: 13,
    fontWeight: '800',
  },
  captchaDesc: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  openWebBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: THEME.colors.primary,
    borderRadius: 8,
    paddingVertical: 8,
    marginTop: 4,
  },
  openWebText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  resultStatus: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '900',
  },
  disclaimerText: {
    color: THEME.colors.textDim,
    fontSize: 10,
    marginTop: 4,
  },
});
