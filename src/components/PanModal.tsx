'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  CreditCard,
  Plus,
  Trash2,
  ShieldCheck,
  Eye,
  EyeOff,
  CheckCircle2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface Pan {
  id: string;
  label: string;
  panMasked: string;
  panHash: string;
  createdAt?: string;
}

interface PanModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PanModal: React.FC<PanModalProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const userId = user?.uid;

  const [pans, setPans] = useState<Pan[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newPan, setNewPan] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [showPan, setShowPan] = useState(false);
  const [adding, setAdding] = useState(false);

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const loadPans = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/pans?userId=${userId}`);
      const data = await res.json();
      if (data.success) {
        setPans(data.data || []);
      } else {
        setError(data.error || 'Failed to load PANs');
      }
    } catch {
      setError('Network error loading PANs');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    if (isOpen && userId) loadPans();
    if (!isOpen) {
      setShowAddForm(false);
      setNewPan('');
      setNewLabel('');
      setError('');
      setSuccess('');
    }
  }, [isOpen, userId, loadPans]);

  const handleAddPan = async (e: React.FormEvent) => {
    e.preventDefault();
    const pan = newPan.trim().toUpperCase();
    if (!/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan)) {
      setError('Invalid PAN format. Expected format: ABCDE1234F');
      return;
    }
    if (!userId) return;

    setAdding(true);
    setError('');
    try {
      const res = await fetch('/api/pans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          pan,
          label: newLabel.trim() || 'My PAN',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSuccess('PAN card saved securely!');
        setNewPan('');
        setNewLabel('');
        setShowAddForm(false);
        await loadPans();
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(data.error || 'Failed to save PAN');
      }
    } catch {
      setError('Network error saving PAN');
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (panId: string) => {
    if (!userId) return;
    setDeletingId(panId);
    setError('');
    try {
      const res = await fetch(`/api/pans/${panId}?userId=${userId}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setPans((prev) => prev.filter((p) => p.id !== panId));
        setSuccess('PAN removed.');
        setTimeout(() => setSuccess(''), 2500);
      } else {
        setError(data.error || 'Failed to delete PAN');
      }
    } catch {
      setError('Network error deleting PAN');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 animate-fade-in"
        onClick={onClose}
      />

      {/* Modal Panel */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="pointer-events-auto w-full max-w-md bg-slate-950 border border-slate-700/80 rounded-3xl shadow-2xl shadow-black/60 animate-slide-up overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-6 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
                <CreditCard className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-base font-bold text-white">Saved PAN Cards</h2>
                <p className="text-[11px] text-slate-400">Securely encrypted &amp; stored</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          <div className="px-6 py-5 space-y-4 max-h-[70vh] overflow-y-auto">
            {/* Security note */}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                PAN numbers are{' '}
                <strong className="text-slate-300">one-way hashed</strong> before storage.
                Only the last 4 digits are visible. Used only for allotment checks.
              </span>
            </div>

            {/* Feedback messages */}
            {success && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800 text-emerald-300 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {success}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-950/40 border border-rose-800 text-rose-300 text-xs">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                {error}
              </div>
            )}

            {/* PAN List */}
            {loading ? (
              <div className="flex items-center justify-center py-8 gap-2 text-slate-400 text-xs">
                <Loader2 className="w-4 h-4 animate-spin" />
                Loading saved PANs…
              </div>
            ) : pans.length === 0 && !showAddForm ? (
              <div className="text-center py-8 space-y-2">
                <CreditCard className="w-8 h-8 text-slate-700 mx-auto" />
                <p className="text-sm text-slate-400">No PAN cards saved yet.</p>
                <p className="text-xs text-slate-600">Add one to check allotment with 1 click.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {pans.map((pan) => (
                  <div
                    key={pan.id}
                    className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-colors space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-indigo-950 border border-indigo-800 flex items-center justify-center">
                          <CreditCard className="w-3.5 h-3.5 text-indigo-400" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-white">{pan.label}</p>
                          <p className="text-[11px] text-slate-400 font-mono">
                            ••••••{pan.panMasked?.slice(-4) || '••••'}
                          </p>
                        </div>
                      </div>

                      {confirmDeleteId !== pan.id ? (
                        <button
                          onClick={() => setConfirmDeleteId(pan.id)}
                          className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-950/40 transition-colors"
                          title="Delete PAN"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5 animate-fade-in">
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-semibold transition-colors"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => {
                              setConfirmDeleteId(null);
                              handleDelete(pan.id);
                            }}
                            disabled={deletingId === pan.id}
                            className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold transition-colors flex items-center gap-1"
                          >
                            {deletingId === pan.id ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              'Delete'
                            )}
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add PAN Form */}
            {showAddForm && (
              <form onSubmit={handleAddPan} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    Label (e.g., My PAN, Spouse PAN)
                  </label>
                  <input
                    type="text"
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    placeholder="My PAN Card"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:outline-none focus:border-indigo-500 transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-400 mb-1.5">
                    PAN Number
                  </label>
                  <div className="relative">
                    <input
                      type={showPan ? 'text' : 'password'}
                      value={newPan}
                      onChange={(e) => setNewPan(e.target.value.toUpperCase())}
                      placeholder="ABCDE1234F"
                      maxLength={10}
                      className="w-full px-3.5 py-2.5 pr-10 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-sm uppercase focus:outline-none focus:border-indigo-500 transition-colors"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPan(!showPan)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                    >
                      {showPan ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-600 mt-1">
                    Format: 5 letters + 4 digits + 1 letter (e.g., ABCDE1234F)
                  </p>
                </div>
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => { setShowAddForm(false); setError(''); setNewPan(''); setNewLabel(''); }}
                    className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={adding || newPan.length !== 10}
                    className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-1.5"
                  >
                    {adding ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving…</>
                    ) : (
                      <><ShieldCheck className="w-3.5 h-3.5" /> Save Securely</>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          {!showAddForm && (
            <div className="px-6 pb-6 pt-2">
              <button
                onClick={() => { setShowAddForm(true); setError(''); }}
                className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 active:scale-[0.98] text-white text-sm font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20"
              >
                <Plus className="w-4 h-4" />
                Add New PAN Card
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
