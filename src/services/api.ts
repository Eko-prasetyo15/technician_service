import { 
  DashboardStats, 
  User, 
  EquipmentCategory, 
  Equipment, 
  ServiceSchedule, 
  ServiceReport, 
  ServiceReminder, 
  CompanySettings 
} from '../types/index.ts';

const API_BASE = '/api';

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
    ...options,
  });

  if (!res.ok) {
    let errMsg = `Request failed with status ${res.status}`;
    try {
      const errObj = await res.json();
      if (errObj.error) errMsg = errObj.error;
    } catch {
      // ignore
    }
    throw new Error(errMsg);
  }

  return res.json();
}

export const api = {
  // Stats
  getStats: () => fetchJson<DashboardStats>(`${API_BASE}/stats`),

  // Auth / Current User
  getCurrentUser: () => fetchJson<User>(`${API_BASE}/auth/current`),
  switchUser: (userId: string) => 
    fetchJson<User>(`${API_BASE}/auth/switch`, {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // Users
  getUsers: () => fetchJson<User[]>(`${API_BASE}/users`),
  createUser: (data: Partial<User>) => 
    fetchJson<User>(`${API_BASE}/users`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateUser: (id: string, data: Partial<User>) =>
    fetchJson<User>(`${API_BASE}/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  // Categories
  getCategories: () => fetchJson<EquipmentCategory[]>(`${API_BASE}/categories`),
  createCategory: (data: Partial<EquipmentCategory>) =>
    fetchJson<EquipmentCategory>(`${API_BASE}/categories`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateCategory: (id: string, data: Partial<EquipmentCategory>) =>
    fetchJson<EquipmentCategory>(`${API_BASE}/categories/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteCategory: (id: string) =>
    fetchJson<{ success: boolean }>(`${API_BASE}/categories/${id}`, {
      method: 'DELETE',
    }),

  // Equipment
  getEquipment: (params?: { categoryId?: string; search?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params?.categoryId) q.set('categoryId', params.categoryId);
    if (params?.search) q.set('search', params.search);
    if (params?.status) q.set('status', params.status);
    return fetchJson<Equipment[]>(`${API_BASE}/equipment?${q.toString()}`);
  },
  getEquipmentById: (id: string) => fetchJson<Equipment>(`${API_BASE}/equipment/${id}`),
  createEquipment: (data: Partial<Equipment>) =>
    fetchJson<Equipment>(`${API_BASE}/equipment`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateEquipment: (id: string, data: Partial<Equipment>) =>
    fetchJson<Equipment>(`${API_BASE}/equipment/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteEquipment: (id: string) =>
    fetchJson<{ success: boolean }>(`${API_BASE}/equipment/${id}`, {
      method: 'DELETE',
    }),

  // Schedules
  getSchedules: (technicianId?: string) => {
    const q = new URLSearchParams();
    if (technicianId) q.set('technicianId', technicianId);
    return fetchJson<ServiceSchedule[]>(`${API_BASE}/schedules?${q.toString()}`);
  },
  getScheduleById: (id: string) => fetchJson<ServiceSchedule>(`${API_BASE}/schedules/${id}`),
  createSchedule: (data: Partial<ServiceSchedule>) =>
    fetchJson<ServiceSchedule>(`${API_BASE}/schedules`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateSchedule: (id: string, data: Partial<ServiceSchedule>) =>
    fetchJson<ServiceSchedule>(`${API_BASE}/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteSchedule: (id: string) =>
    fetchJson<{ success: boolean }>(`${API_BASE}/schedules/${id}`, {
      method: 'DELETE',
    }),

  // Reports
  getReports: (params?: { equipmentId?: string; technicianId?: string }) => {
    const q = new URLSearchParams();
    if (params?.equipmentId) q.set('equipmentId', params.equipmentId);
    if (params?.technicianId) q.set('technicianId', params.technicianId);
    return fetchJson<ServiceReport[]>(`${API_BASE}/reports?${q.toString()}`);
  },
  getReportById: (id: string) => fetchJson<ServiceReport>(`${API_BASE}/reports/${id}`),
  createReport: (data: Partial<ServiceReport>) =>
    fetchJson<ServiceReport>(`${API_BASE}/reports`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  batchSyncReports: (reports: any[]) =>
    fetchJson<{ success: boolean; count: number; synced: ServiceReport[] }>(`${API_BASE}/reports/batch-sync`, {
      method: 'POST',
      body: JSON.stringify({ reports }),
    }),

  // Reminders
  getReminders: () => fetchJson<ServiceReminder[]>(`${API_BASE}/reminders`),
  acknowledgeReminder: (id: string) =>
    fetchJson<{ success: boolean }>(`${API_BASE}/reminders/${id}/acknowledge`, {
      method: 'POST',
    }),
  processReminders: () =>
    fetchJson<{ count: number; reminders: ServiceReminder[] }>(`${API_BASE}/reminders/process`, {
      method: 'POST',
    }),

  // Company Settings
  getCompanySettings: () => fetchJson<CompanySettings>(`${API_BASE}/company`),
  updateCompanySettings: (data: Partial<CompanySettings>) =>
    fetchJson<CompanySettings>(`${API_BASE}/company`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};
