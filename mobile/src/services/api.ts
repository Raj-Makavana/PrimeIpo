import { API_BASE_URL } from '../config/constants';
import { IpoData, SavedPan, AllotmentCheckResponse, UserAlertsData } from '../types';

export const fetchIpos = async (params?: {
  status?: string;
  type?: string;
  sector?: string;
  search?: string;
}): Promise<IpoData[]> => {
  try {
    const query = new URLSearchParams();
    if (params?.status && params.status !== 'all') query.append('status', params.status);
    if (params?.type && params.type !== 'all') query.append('type', params.type);
    if (params?.sector && params.sector !== 'all') query.append('sector', params.sector);
    if (params?.search) query.append('search', params.search);

    const res = await fetch(`${API_BASE_URL}/api/ipos?${query.toString()}`);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error('Mobile fetchIpos error:', err);
    return [];
  }
};

export const fetchIpoDetail = async (id: string): Promise<IpoData | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/ipos/${id}`);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    console.error('Mobile fetchIpoDetail error:', err);
    return null;
  }
};

export const fetchPans = async (userId: string = 'guest_user'): Promise<SavedPan[]> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/pans?userId=${userId}`);
    const json = await res.json();
    return json.success ? json.data : [];
  } catch (err) {
    console.error('Mobile fetchPans error:', err);
    return [];
  }
};

export const addPan = async (
  pan: string,
  label: string,
  userId: string = 'guest_user'
): Promise<{ success: boolean; data?: SavedPan; error?: string }> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/pans`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pan, label, userId }),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Failed to save PAN' };
  }
};

export const deletePan = async (id: string): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/pans?id=${id}`, { method: 'DELETE' });
    const json = await res.json();
    return json.success;
  } catch (err) {
    return false;
  }
};

export const checkAllotment = async (payload: {
  ipoId: string;
  pan?: string;
  panHash?: string;
  registrar?: string;
  companyName?: string;
}): Promise<AllotmentCheckResponse> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/allotment/check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err: any) {
    return { success: false, error: err.message || 'Check failed' };
  }
};

export const fetchAlerts = async (userId: string = 'guest_user'): Promise<UserAlertsData | null> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/alerts?userId=${userId}`);
    const json = await res.json();
    return json.success ? json.data : null;
  } catch (err) {
    return null;
  }
};

export const saveAlerts = async (
  data: UserAlertsData & { userId?: string }
): Promise<boolean> => {
  try {
    const res = await fetch(`${API_BASE_URL}/api/alerts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    return json.success;
  } catch (err) {
    return false;
  }
};
