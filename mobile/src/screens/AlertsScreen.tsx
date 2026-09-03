import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  ActivityIndicator,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Bell, Mail, CheckCircle2, Shield } from 'lucide-react-native';
import { fetchAlerts, saveAlerts } from '../services/api';
import { THEME } from '../config/constants';

export const AlertsScreen: React.FC = () => {
  const [email, setEmail] = useState('');
  const [newIpoAlerts, setNewIpoAlerts] = useState(true);
  const [allotmentAlerts, setAllotmentAlerts] = useState(true);
  const [gmpSurgeAlerts, setGmpSurgeAlerts] = useState(true);
  const [pushAlerts, setPushAlerts] = useState(true);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await fetchAlerts();
      if (data) {
        setEmail(data.email || '');
        setNewIpoAlerts(data.newIpoAlerts ?? true);
        setAllotmentAlerts(data.allotmentAlerts ?? true);
        setGmpSurgeAlerts(data.gmpSurgeAlerts ?? true);
        setPushAlerts(data.pushAlerts ?? true);
      }
      setLoading(false);
    }
    load();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);

    const ok = await saveAlerts({
      email,
      newIpoAlerts,
      allotmentAlerts,
      gmpSurgeAlerts,
      pushAlerts,
      emailAlerts: true,
    });

    setSaving(false);
    if (ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } else {
      Alert.alert('Error', 'Failed to save alert preferences.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={THEME.colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerIcon}>
            <Bell size={20} color={THEME.colors.primaryLight} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.bannerTitle}>IPO Instant Alerts</Text>
            <Text style={styles.bannerSub}>
              Notifications for high-GMP spikes, allotment results, and new filings.
            </Text>
          </View>
        </View>

        {saved && (
          <View style={styles.successBox}>
            <CheckCircle2 size={16} color={THEME.colors.success} />
            <Text style={styles.successText}>Alert preferences saved successfully!</Text>
          </View>
        )}

        {/* Form Card */}
        <View style={styles.card}>
          <Text style={styles.cardHeader}>Destination</Text>

          <Text style={styles.inputLabel}>Email Address:</Text>
          <View style={styles.emailInputWrapper}>
            <Mail size={14} color={THEME.colors.textDim} />
            <TextInput
              placeholder="investor@example.com"
              placeholderTextColor={THEME.colors.textDim}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.emailInput}
            />
          </View>

          <Text style={[styles.cardHeader, { marginTop: 16 }]}>Trigger Conditions</Text>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>New IPO Announcements</Text>
              <Text style={styles.toggleSub}>When a new Mainboard/SME IPO opens</Text>
            </View>
            <Switch
              value={newIpoAlerts}
              onValueChange={setNewIpoAlerts}
              trackColor={{ false: '#334155', true: THEME.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Allotment Day Reminders</Text>
              <Text style={styles.toggleSub}>Instant notice when status is declared</Text>
            </View>
            <Switch
              value={allotmentAlerts}
              onValueChange={setAllotmentAlerts}
              trackColor={{ false: '#334155', true: THEME.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>High GMP Surge Alerts (&gt;25%)</Text>
              <Text style={styles.toggleSub}>When expected listing gain spikes</Text>
            </View>
            <Switch
              value={gmpSurgeAlerts}
              onValueChange={setGmpSurgeAlerts}
              trackColor={{ false: '#334155', true: THEME.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.toggleTitle}>Mobile Push Notifications</Text>
              <Text style={styles.toggleSub}>Direct alerts on your device</Text>
            </View>
            <Switch
              value={pushAlerts}
              onValueChange={setPushAlerts}
              trackColor={{ false: '#334155', true: THEME.colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <TouchableOpacity
            style={[styles.saveBtn, saving && styles.btnDisabled]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.saveBtnText}>Save Alert Preferences</Text>
            )}
          </TouchableOpacity>
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
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
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#064e3b33',
    borderWidth: 1,
    borderColor: '#064e3b',
    borderRadius: 12,
    padding: 10,
  },
  successText: {
    color: '#6ee7b7',
    fontSize: 12,
    fontWeight: '700',
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
    marginBottom: 10,
  },
  inputLabel: {
    color: THEME.colors.textDim,
    fontSize: 11,
    marginBottom: 4,
  },
  emailInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0a0f1d',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#1e293b',
    paddingHorizontal: 10,
    height: 40,
    gap: 8,
  },
  emailInput: {
    flex: 1,
    color: '#fff',
    fontSize: 12,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  toggleTitle: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleSub: {
    color: THEME.colors.textDim,
    fontSize: 10,
    marginTop: 1,
  },
  saveBtn: {
    backgroundColor: THEME.colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 16,
  },
  btnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '800',
  },
});
