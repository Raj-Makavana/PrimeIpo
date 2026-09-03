import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Search, Zap, Flame, Calendar, CheckCircle2, TrendingUp } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchIpos } from '../services/api';
import { IpoData, RootStackParamList } from '../types';
import { THEME } from '../config/constants';
import { IpoCard } from '../components/IpoCard';

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [ipos, setIpos] = useState<IpoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'mainboard' | 'sme'>('all');
  const [activeTab, setActiveTab] = useState<'open' | 'upcoming' | 'closed' | 'listed'>('open');

  const loadData = useCallback(async () => {
    const data = await fetchIpos();
    setIpos(data);
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const filtered = ipos.filter((i) => {
    const matchSearch =
      i.companyName.toLowerCase().includes(search.toLowerCase()) ||
      i.symbol.toLowerCase().includes(search.toLowerCase()) ||
      i.sector.toLowerCase().includes(search.toLowerCase());

    const matchType = typeFilter === 'all' || i.type === typeFilter;
    const matchTab = i.status === activeTab;

    return matchSearch && matchType && matchTab;
  });

  const openCount = ipos.filter((i) => i.status === 'open').length;
  const upcomingCount = ipos.filter((i) => i.status === 'upcoming').length;
  const closedCount = ipos.filter((i) => i.status === 'closed').length;
  const listedCount = ipos.filter((i) => i.status === 'listed').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Header Banner */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <View style={styles.logoIcon}>
            <Text style={styles.logoLetter}>P</Text>
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={styles.logoTitle}>Prime<Text style={{ color: THEME.colors.primaryLight }}>IPO</Text></Text>
              <View style={styles.indiaBadge}>
                <Text style={styles.indiaText}>INDIA</Text>
              </View>
            </View>
            <Text style={styles.logoSub}>Every Mainboard & SME IPO</Text>
          </View>
        </View>

        {/* Search Bar */}
        <View style={styles.searchBar}>
          <Search size={16} color={THEME.colors.textDim} />
          <TextInput
            placeholder="Search company, symbol, or sector..."
            placeholderTextColor={THEME.colors.textDim}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        {/* Mainboard vs SME Toggle */}
        <View style={styles.typeSelector}>
          {(['all', 'mainboard', 'sme'] as const).map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setTypeFilter(t)}
              style={[styles.typeButton, typeFilter === t && styles.typeButtonActive]}
            >
              <Text style={[styles.typeButtonText, typeFilter === t && styles.typeButtonTextActive]}>
                {t === 'all' ? 'All Types' : t.toUpperCase()}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Status Segment Tabs */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statusTabs}>
          {[
            { key: 'open', label: `Live Bidding (${openCount})`, icon: Flame },
            { key: 'upcoming', label: `Upcoming (${upcomingCount})`, icon: Calendar },
            { key: 'closed', label: `Closed (${closedCount})`, icon: CheckCircle2 },
            { key: 'listed', label: `Listed (${listedCount})`, icon: TrendingUp },
          ].map(({ key, label, icon: Icon }) => (
            <TouchableOpacity
              key={key}
              onPress={() => setActiveTab(key as any)}
              style={[styles.statusTab, activeTab === key && styles.statusTabActive]}
            >
              <Icon size={14} color={activeTab === key ? THEME.colors.primaryLight : THEME.colors.textDim} />
              <Text style={[styles.statusTabText, activeTab === key && styles.statusTabTextActive]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* List / Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
          <Text style={styles.loadingText}>Fetching live Indian IPOs...</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <IpoCard
              ipo={item}
              onPress={() => navigation.navigate('IpoDetail', { id: item.id, title: item.companyName })}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={THEME.colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyTitle}>No IPOs Found</Text>
              <Text style={styles.emptySubtitle}>No matching IPOs in this category right now.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    backgroundColor: '#0d1322',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: THEME.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoLetter: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  logoTitle: {
    color: '#fff',
    fontWeight: '900',
    fontSize: 18,
  },
  indiaBadge: {
    backgroundColor: '#1e1b4b',
    borderColor: '#4338ca',
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  indiaText: {
    color: '#a5b4fc',
    fontSize: 9,
    fontWeight: '800',
  },
  logoSub: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131b2e',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    height: 40,
    marginBottom: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 13,
  },
  typeSelector: {
    flexDirection: 'row',
    backgroundColor: '#131b2e',
    borderRadius: 10,
    padding: 3,
    marginBottom: 10,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 6,
    alignItems: 'center',
    borderRadius: 8,
  },
  typeButtonActive: {
    backgroundColor: THEME.colors.primary,
  },
  typeButtonText: {
    color: THEME.colors.textDim,
    fontSize: 11,
    fontWeight: '700',
  },
  typeButtonTextActive: {
    color: '#fff',
  },
  statusTabs: {
    flexDirection: 'row',
  },
  statusTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: '#131b2e',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  statusTabActive: {
    backgroundColor: '#1e1b4b',
    borderColor: '#4338ca',
  },
  statusTabText: {
    color: THEME.colors.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  statusTabTextActive: {
    color: '#c7d2fe',
    fontWeight: '800',
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  loadingText: {
    color: THEME.colors.textMuted,
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  emptySubtitle: {
    color: THEME.colors.textDim,
    fontSize: 12,
    marginTop: 4,
  },
});
