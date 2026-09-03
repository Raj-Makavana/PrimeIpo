import React, { useState, useEffect, useCallback } from 'react';
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
import * as WebBrowser from 'expo-web-browser';
import { CheckSquare, Plus, Trash2, ShieldCheck, Zap, ExternalLink, RefreshCw } from 'lucide-react-native';
import { fetchIpos, fetchPans, addPan, deletePan, checkAllotment } from '../services/api';
import { IpoData, SavedPan, AllotmentCheckResponse } from '../types';
import { THEME } from '../config/constants';

export const AllotmentScreen: React.FC = () => {
  const [ipos, setIpos] = useState<IpoData[]>([]);
  const [pans, setPans] = useState<SavedPan[]>([]);
  const [selectedIpoId, setSelectedIpoId] = useState<string>('');
  const [loading, setLoading] = useState(true);

  // Add PAN state
  const [newPan, setNewPan] = useState('');
  const [newLabel, setNewLabel] = useState('Self');
  const [addingPan, setAddingPan] = useState(false);

  // Checking state
  const [checking, setChecking] = useState(false);
  const [results, setResults] = useState<(AllotmentCheckResponse & { label: string; maskedPan: string })[]>([]);

  const loadData = useCallback(async () => {
    setLoading(true);
    const [ipoList, panList] = await Promise.all([fetchIpos(), fetchPans()]);
    setIpos(ipoList);
    setPans(panList);
    if (ipoList.length > 0 && !selectedIpoId) {
      setSelectedIpoId(ipoList[0].id);
    }
    setLoading(false);
  }, [selectedIpoId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleAddPan = async () => {
    if (newPan.length !== 10) {
      Alert.alert('Invalid PAN', 'Please enter a valid 10-digit PAN (e.g. ABCDE1234F)');
      return;
    }
    setAddingPan(true);
    const res = await addPan(newPan, newLabel);
    if (res.success) {
      setNewPan('');
      setNewLabel('Self');
      loadData();
    } else {
      Alert.alert('Error', res.error || 'Failed to save PAN');
    }
    setAddingPan(false);
  };

  const handleDeletePan = async (id: string) => {
    const ok = await deletePan(id);
    if (ok) {
      setPans((prev) => prev.filter((p) => p.id !== id));
    }
  };

  const handleCheckAllPans = async () => {
    if (!selectedIpoId || pans.length === 0) return;
    setChecking(true);
    setResults([]);

    const selectedIpo = ipos.find((i) => i.id === selectedIpoId);
    const batchResults: (AllotmentCheckResponse & { label: string; maskedPan: string })[] = [];

    for (const p of pans) {
      const res = await checkAllotment({
        ipoId: selectedIpoId,
        panHash: p.panHash,
        registrar: selectedIpo?.registrar,
        companyName: selectedIpo?.companyName,
      });
      batchResults.push({ ...res, label: p.label, maskedPan: p.maskedPan });
    }

    setResults(batchResults);
    setChecking(false);
  };

  const handleOpenRegistrar = async (url: string) => {
    try {
      await WebBrowser.openBrowserAsync(url);
    } catch (e) {
      Alert.alert('Error', 'Unable to open registrar link');
    }
  };

  const selectedIpoObj = ipos.find((i) => i.id === selectedIpoId);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <CheckSquare size={20} color={THEME.colors.primaryLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>Multi-PAN Allotment</Text>
            <Text style={styles.bannerSub}>
              1-Click query for family members across Bigshare, KFintech & Link Intime
            </Text>
          </View>
        </View>

        {/* Section 1: 1-Click Allotment Query */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>1-Click Allotment Query</Text>

          {/* Select Target IPO */}
          <Text style={styles.inputLabel}>Select Target IPO:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.ipoSelector}>
            {ipos.map((i) => (
              <TouchableOpacity
                key={i.id}
                onPress={() => setSelectedIpoId(i.id)}
                style={[styles.ipoChip, selectedIpoId === i.id && styles.ipoChipActive]}
              >
                <Text style={[styles.ipoChipText, selectedIpoId === i.id && styles.ipoChipTextActive]}>
                  {i.companyName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {selectedIpoObj && (
            <View style={styles.registrarInfoRow}>
              <Text style={styles.textDim}>Registrar:</Text>
              <Text style={styles.textWhite}>{selectedIpoObj.registrar}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.checkAllBtn, (checking || pans.length === 0) && styles.btnDisabled]}
            onPress={handleCheckAllPans}
            disabled={checking || pans.length === 0}
          >
            {checking ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Zap size={16} color="#fff" />
                <Text style={styles.checkAllText}>
                  Check All {pans.length} Saved PANs in 1-Click
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {results.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardHeader}>Allotment Results</Text>
            <View style={{ gap: 8 }}>
              {results.map((r, idx) => (
                <View key={idx} style={styles.resultItem}>
                  <View>
                    <Text style={styles.resLabel}>{r.label}</Text>
                    <Text style={styles.resPan}>{r.maskedPan}</Text>
                  </View>

                  {r.requiresCaptcha ? (
                    <TouchableOpacity
                      style={styles.openPortalBtn}
                      onPress={() => r.redirectUrl && handleOpenRegistrar(r.redirectUrl)}
                    >
                      <Text style={styles.openPortalText}>Open Registrar</Text>
                      <ExternalLink size={12} color="#fff" />
                    </TouchableOpacity>
                  ) : (
                    <View
                      style={[
                        styles.statusBadge,
                        r.data?.status === 'allotted' ? styles.statusAllotted : styles.statusNotAllotted,
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          r.data?.status === 'allotted' ? styles.statusAllottedText : styles.statusNotAllottedText,
                        ]}
                      >
                        {r.data?.status === 'allotted' ? `ALLOTTED (${r.data.shares} Shares)` : 'NOT ALLOTTED'}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Section 2: Manage Saved PANs */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Saved Family PANs ({pans.length})</Text>

          {/* Add form */}
          <View style={styles.addForm}>
            <TextInput
              placeholder="Label (e.g. Self, Dad, Mom)"
              placeholderTextColor={THEME.colors.textDim}
              value={newLabel}
              onChangeText={setNewLabel}
              style={styles.inputField}
            />
            <TextInput
              placeholder="10-Digit PAN (ABCDE1234F)"
              placeholderTextColor={THEME.colors.textDim}
              value={newPan}
              onChangeText={(t) => setNewPan(t.toUpperCase())}
              maxLength={10}
              style={[styles.inputField, { letterSpacing: 1, fontWeight: '700' }]}
            />
            <TouchableOpacity
              style={[styles.addBtn, addingPan && styles.btnDisabled]}
              onPress={handleAddPan}
              disabled={addingPan}
            >
              {addingPan ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Plus size={14} color="#fff" />
                  <Text style={styles.addBtnText}>Save Encrypted PAN</Text>
                </View>
              )}
            </TouchableOpacity>
          </View>

          {/* PAN List */}
          <View style={{ marginTop: 12, gap: 8 }}>
            {pans.map((p) => (
              <View key={p.id} style={styles.panItem}>
                <View>
                  <Text style={styles.panItemLabel}>{p.label}</Text>
                  <Text style={styles.panItemMasked}>{p.maskedPan}</Text>
                </View>
                <TouchableOpacity onPress={() => handleDeletePan(p.id)} style={styles.deleteBtn}>
                  <Trash2 size={16} color={THEME.colors.danger} />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Security Notice */}
        <View style={styles.securityBox}>
          <ShieldCheck size={16} color={THEME.colors.success} />
          <Text style={styles.securityText}>
            PAN numbers are securely encrypted with AES-256 before storage.
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
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#0d1322',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 14,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#1e1b4b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '900',
  },
  bannerSub: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    marginTop: 2,
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
  inputLabel: {
    color: THEME.colors.textDim,
    fontSize: 11,
    marginBottom: 6,
  },
  ipoSelector: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  ipoChip: {
    backgroundColor: '#0a0f1d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 12,
    paddingVertical: 7,
    marginRight: 8,
  },
  ipoChipActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  ipoChipText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  ipoChipTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  registrarInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#0a0f1d',
    borderRadius: 8,
    padding: 8,
    marginBottom: 12,
  },
  textDim: {
    color: THEME.colors.textDim,
    fontSize: 11,
  },
  textWhite: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
  checkAllBtn: {
    backgroundColor: THEME.colors.success,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
  checkAllText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
  addForm: {
    gap: 8,
  },
  inputField: {
    backgroundColor: '#0a0f1d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    color: '#fff',
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  addBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  panItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0f1d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
  },
  panItemLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  panItemMasked: {
    color: THEME.colors.primaryLight,
    fontSize: 11,
  },
  deleteBtn: {
    padding: 6,
  },
  resultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#0a0f1d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 10,
  },
  resLabel: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  resPan: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  openPortalBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: THEME.colors.primary,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  openPortalText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusAllotted: {
    backgroundColor: '#064e3b',
  },
  statusNotAllotted: {
    backgroundColor: '#7f1d1d',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusAllottedText: {
    color: THEME.colors.success,
  },
  statusNotAllottedText: {
    color: THEME.colors.danger,
  },
  securityBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#064e3b22',
    borderWidth: 1,
    borderColor: '#064e3b',
    borderRadius: 12,
    padding: 10,
  },
  securityText: {
    color: '#6ee7b7',
    fontSize: 11,
    flex: 1,
  },
});
