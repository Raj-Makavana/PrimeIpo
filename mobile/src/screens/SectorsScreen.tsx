import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Search, LayoutGrid } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { fetchIpos } from '../services/api';
import { IpoData, RootStackParamList } from '../types';
import { THEME } from '../config/constants';
import { IpoCard } from '../components/IpoCard';

export const SectorsScreen: React.FC = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [ipos, setIpos] = useState<IpoData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'all' | 'mainboard' | 'sme'>('all');
  const [sortBy, setSortBy] = useState<'gmp' | 'sub' | 'date'>('gmp');

  const loadData = useCallback(async () => {
    const data = await fetchIpos();
    setIpos(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sectorsList = Array.from(new Set(ipos.map((i) => i.sector)));

  let filtered = ipos.filter((i) => {
    const matchSearch =
      i.companyName.toLowerCase().includes(search.toLowerCase()) ||
      i.symbol.toLowerCase().includes(search.toLowerCase()) ||
      i.sector.toLowerCase().includes(search.toLowerCase());

    const matchSector = selectedSector === 'all' || i.sector === selectedSector;
    const matchType = selectedType === 'all' || i.type === selectedType;

    return matchSearch && matchSector && matchType;
  });

  filtered.sort((a, b) => {
    if (sortBy === 'gmp') return b.gmpPct - a.gmpPct;
    if (sortBy === 'sub') return b.subscriptionTotal - a.subscriptionTotal;
    return new Date(b.openDate).getTime() - new Date(a.openDate).getTime();
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <View style={styles.bannerRow}>
          <View style={styles.bannerIcon}>
            <LayoutGrid size={18} color={THEME.colors.primaryLight} />
          </View>
          <View>
            <Text style={styles.title}>Sector Explorer</Text>
            <Text style={styles.sub}>Compare IPO performance across industries</Text>
          </View>
        </View>

        {/* Search */}
        <View style={styles.searchBar}>
          <Search size={14} color={THEME.colors.textDim} />
          <TextInput
            placeholder="Search company or sector..."
            placeholderTextColor={THEME.colors.textDim}
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        {/* Sort Controls */}
        <View style={styles.sortRow}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {[
              { key: 'gmp', label: 'Highest GMP %' },
              { key: 'sub', label: 'Highest Subscription' },
              { key: 'date', label: 'Latest Opening' },
            ].map(({ key, label }) => (
              <TouchableOpacity
                key={key}
                onPress={() => setSortBy(key as any)}
                style={[styles.sortChip, sortBy === key && styles.sortChipActive]}
              >
                <Text style={[styles.sortChipText, sortBy === key && styles.sortChipTextActive]}>
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Sector Chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.sectorChips}>
          <TouchableOpacity
            onPress={() => setSelectedSector('all')}
            style={[styles.chip, selectedSector === 'all' && styles.chipActive]}
          >
            <Text style={[styles.chipText, selectedSector === 'all' && styles.chipTextActive]}>
              All Sectors ({ipos.length})
            </Text>
          </TouchableOpacity>
          {sectorsList.map((sec) => (
            <TouchableOpacity
              key={sec}
              onPress={() => setSelectedSector(sec)}
              style={[styles.chip, selectedSector === sec && styles.chipActive]}
            >
              <Text style={[styles.chipText, selectedSector === sec && styles.chipTextActive]}>
                {sec}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Grid List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
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
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No matching IPOs found in this sector.</Text>
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
    backgroundColor: '#0d1322',
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
    gap: 8,
  },
  bannerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  bannerIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#1e1b4b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  sub: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#131b2e',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    height: 36,
    gap: 6,
  },
  searchInput: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
  },
  sortRow: {
    flexDirection: 'row',
  },
  sortChip: {
    backgroundColor: '#131b2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
  },
  sortChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  sortChipText: {
    color: THEME.colors.textDim,
    fontSize: 10,
    fontWeight: '700',
  },
  sortChipTextActive: {
    color: '#fff',
  },
  sectorChips: {
    flexDirection: 'row',
  },
  chip: {
    backgroundColor: '#131b2e',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    paddingVertical: 5,
    marginRight: 6,
  },
  chipActive: {
    backgroundColor: '#1e1b4b',
    borderColor: '#4338ca',
  },
  chipText: {
    color: THEME.colors.textDim,
    fontSize: 10,
    fontWeight: '600',
  },
  chipTextActive: {
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
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    color: THEME.colors.textDim,
    fontSize: 12,
  },
});
