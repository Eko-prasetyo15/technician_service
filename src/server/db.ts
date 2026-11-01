import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { Pool, PoolClient } from 'pg';
import { 
  EquipmentCategory, 
  Equipment, 
  ServiceSchedule, 
  ServiceReport, 
  ServiceReminder, 
  User, 
  CompanySettings, 
  DashboardStats 
} from '../types/index.ts';
import { 
  initialCategories, 
  initialEquipment, 
  initialSchedules, 
  initialReports, 
  initialUsers, 
  initialCompanySettings 
} from './seedData.ts';

dotenv.config({ path: ['.env.local', '.env'] });

interface DatabaseSchema {
  categories: EquipmentCategory[];
  equipment: Equipment[];
  schedules: ServiceSchedule[];
  reports: ServiceReport[];
  reminders: ServiceReminder[];
  users: User[];
  company: CompanySettings;
  currentUserId: string;
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');
const COLLECTIONS = [
  'categories',
  'equipment',
  'schedules',
  'reports',
  'reminders',
  'users',
  'company_settings',
] as const;
type Collection = (typeof COLLECTIONS)[number];

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
});

const clone = <T>(value: T): T => JSON.parse(JSON.stringify(value)) as T;

// Reference date for scheduling calculations (matching environment: 2026-10-31)
const getTodayStr = (): string => {
  const d = new Date();
  return d.toISOString().split('T')[0];
};

class DatabaseManager {
  private data: DatabaseSchema;
  private persistedData: DatabaseSchema;
  private persistenceQueue: Promise<void> = Promise.resolve();
  private companySettingsInitialized = false;

  constructor() {
    this.data = this.seedData();
    this.persistedData = {
      categories: [],
      equipment: [],
      schedules: [],
      reports: [],
      reminders: [],
      users: [],
      company: initialCompanySettings,
      currentUserId: '',
    };
  }

  private seedData(): DatabaseSchema {
    return {
      categories: initialCategories,
      equipment: initialEquipment,
      schedules: initialSchedules,
      reports: initialReports,
      reminders: [],
      users: initialUsers,
      company: initialCompanySettings,
      currentUserId: initialUsers[0].id,
    };
  }

  public async initialize(
    migrateReportPhotos?: (reports: ServiceReport[]) => Promise<ServiceReport[]>
  ): Promise<void> {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required. Add your Neon connection string to .env.local.');
    }

    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (id text PRIMARY KEY, data jsonb NOT NULL);
      CREATE TABLE IF NOT EXISTS equipment (id text PRIMARY KEY, data jsonb NOT NULL);
      CREATE TABLE IF NOT EXISTS schedules (id text PRIMARY KEY, data jsonb NOT NULL);
      CREATE TABLE IF NOT EXISTS reports (id text PRIMARY KEY, data jsonb NOT NULL);
      CREATE TABLE IF NOT EXISTS reminders (id text PRIMARY KEY, data jsonb NOT NULL);
      CREATE TABLE IF NOT EXISTS users (id text PRIMARY KEY, data jsonb NOT NULL);
      CREATE TABLE IF NOT EXISTS company_settings (id text PRIMARY KEY, data jsonb NOT NULL);
      CREATE TABLE IF NOT EXISTS app_settings (id text PRIMARY KEY, data jsonb NOT NULL);
    `);

    const settings = await pool.query<{ data: { currentUserId: string } }>(
      "SELECT data FROM app_settings WHERE id = 'main'"
    );

    if (settings.rowCount) {
      const collections = await Promise.all(
        COLLECTIONS.map(async (table) => {
          const result = await pool.query<{ id: string; data: unknown }>(`SELECT id, data FROM ${table}`);
          return [table, result.rows] as const;
        })
      );
      const loaded = Object.fromEntries(collections) as Record<Collection, { id: string; data: unknown }[]>;
      this.data = {
        categories: loaded.categories.map((row) => row.data as EquipmentCategory),
        equipment: loaded.equipment.map((row) => row.data as Equipment),
        schedules: loaded.schedules.map((row) => row.data as ServiceSchedule),
        reports: loaded.reports.map((row) => row.data as ServiceReport),
        reminders: loaded.reminders.map((row) => row.data as ServiceReminder),
        users: loaded.users.map((row) => row.data as User),
        company: (loaded.company_settings[0]?.data as CompanySettings | undefined) || initialCompanySettings,
        currentUserId: settings.rows[0].data.currentUserId,
      };
      this.companySettingsInitialized = loaded.company_settings.length > 0;
      this.persistedData = clone(this.data);
      if (migrateReportPhotos) {
        this.data.reports = await migrateReportPhotos(this.data.reports);
      }
      await this.saveData();
      await this.processReminders();
      return;
    }

    if (fs.existsSync(DB_FILE)) {
      const parsed = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8')) as Partial<DatabaseSchema>;
      this.data = {
        categories: parsed.categories ?? initialCategories,
        equipment: parsed.equipment ?? initialEquipment,
        schedules: parsed.schedules ?? initialSchedules,
        reports: parsed.reports ?? initialReports,
        reminders: parsed.reminders ?? [],
        users: parsed.users ?? initialUsers,
        company: parsed.company ?? initialCompanySettings,
        currentUserId: parsed.currentUserId ?? initialUsers[0].id,
      };
    } else {
      this.data = this.seedData();
    }

    if (migrateReportPhotos) {
      this.data.reports = await migrateReportPhotos(this.data.reports);
    }
    await this.saveData();
    await this.processReminders();
  }

  private async persistSnapshot(state: DatabaseSchema): Promise<void> {
    const client: PoolClient = await pool.connect();
    try {
      await client.query('BEGIN');
      for (const collection of COLLECTIONS) {
        const table = collection;
        const currentRecords = collection === 'company_settings'
          ? [{ id: 'main', data: state.company }]
          : state[collection].map((record) => ({ id: record.id, data: record }));
        const previousRecords = collection === 'company_settings'
          ? [{ id: 'main', data: this.persistedData.company }]
          : this.persistedData[collection].map((record) => ({ id: record.id, data: record }));
        const previousById = new Map(previousRecords.map((record) => [record.id, JSON.stringify(record.data)]));
        const currentById = new Map(currentRecords.map((record) => [record.id, JSON.stringify(record.data)]));

        for (const record of currentRecords) {
          if (
            previousById.get(record.id) !== JSON.stringify(record.data) ||
            (collection === 'company_settings' && !this.companySettingsInitialized)
          ) {
            await client.query(
              `INSERT INTO ${table} (id, data) VALUES ($1, $2::jsonb)
               ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
              [record.id, JSON.stringify(record.data)]
            );
          }
        }

        for (const previous of previousRecords) {
          if (!currentById.has(previous.id)) {
            await client.query(`DELETE FROM ${table} WHERE id = $1`, [previous.id]);
          }
        }
      }

      const settings = { currentUserId: state.currentUserId };
      if (state.currentUserId !== this.persistedData.currentUserId) {
        await client.query(
          `INSERT INTO app_settings (id, data) VALUES ('main', $1::jsonb)
           ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data`,
          [JSON.stringify(settings)]
        );
      }
      await client.query('COMMIT');
      this.persistedData = clone(state);
      this.companySettingsInitialized = true;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  private saveData(): Promise<void> {
    const snapshot = clone(this.data);
    const write = this.persistenceQueue.then(() => this.persistSnapshot(snapshot)).catch((error) => {
      if (JSON.stringify(this.data) === JSON.stringify(snapshot)) {
        this.data = clone(this.persistedData);
      }
      throw error;
    });
    this.persistenceQueue = write.catch(() => undefined);
    return write;
  }

  public async close(): Promise<void> {
    await pool.end();
  }

  // --- AUTOMATED REMINDER LOGIC (Server-Side Cron/Scheduled Job) ---
  public async processReminders(): Promise<ServiceReminder[]> {
    const today = new Date(getTodayStr());
    const existingReminders = this.data.reminders;
    const newReminders: ServiceReminder[] = [];

    this.data.equipment.forEach((eq) => {
      if (eq.status !== 'active') return;
      if (!eq.nextServiceDate) return;

      const nextDate = new Date(eq.nextServiceDate);
      const diffMs = nextDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      let reminderType: 'overdue' | '1_day' | '3_days' | '7_days' | null = null;

      if (diffDays < 0) {
        reminderType = 'overdue';
      } else if (diffDays <= 1) {
        reminderType = '1_day';
      } else if (diffDays <= 3) {
        reminderType = '3_days';
      } else if (diffDays <= 7) {
        reminderType = '7_days';
      }

      if (reminderType) {
        // Prevent duplicate notifications for same equipment, due date and type
        const duplicate = existingReminders.find(
          (r) => r.equipmentId === eq.id && r.dueDate === eq.nextServiceDate && r.type === reminderType
        );

        if (!duplicate) {
          // Check if an upcoming schedule exists
          const matchingSchedule = this.data.schedules.find(
            (s) => s.equipmentId === eq.id && s.scheduledDate === eq.nextServiceDate && s.status !== 'Completed'
          );

          const reminder: ServiceReminder = {
            id: 'rem-' + Date.now() + '-' + Math.random().toString(36).substr(2, 5),
            equipmentId: eq.id,
            equipmentName: eq.name,
            categoryName: eq.categoryName,
            location: eq.location,
            dueDate: eq.nextServiceDate,
            daysRemaining: diffDays,
            type: reminderType,
            scheduleId: matchingSchedule?.id,
            technicianName: matchingSchedule?.technicianName,
            status: 'pending',
            createdAt: new Date().toISOString(),
          };

          newReminders.push(reminder);
        }
      }
    });

    if (newReminders.length > 0) {
      this.data.reminders = [...newReminders, ...this.data.reminders];
      await this.saveData();
    }

    return this.data.reminders;
  }

  // --- STATS ---
  public getStats(): DashboardStats {
    const today = new Date(getTodayStr());
    const currentMonthPrefix = getTodayStr().slice(0, 7); // e.g. 2026-10

    const totalEquipment = this.data.equipment.length;
    const activeEquipment = this.data.equipment.filter((e) => e.status === 'active').length;

    const schedulesThisMonth = this.data.schedules.filter(
      (s) => s.scheduledDate.startsWith(currentMonthPrefix)
    );
    const jobsThisMonth = schedulesThisMonth.length;
    const completedJobsThisMonth = schedulesThisMonth.filter((s) => s.status === 'Completed').length;

    const upcomingSchedules = this.data.schedules.filter(
      (s) => s.status !== 'Completed' && new Date(s.scheduledDate) >= today
    ).length;

    const overdueMaintenance = this.data.equipment.filter((e) => {
      if (e.status !== 'active' || !e.nextServiceDate) return false;
      return new Date(e.nextServiceDate) < today;
    }).length;

    const pendingReminders = this.data.reminders.filter((r) => r.status === 'pending').length;

    return {
      totalEquipment,
      activeEquipment,
      jobsThisMonth,
      completedJobsThisMonth,
      upcomingSchedules,
      overdueMaintenance,
      pendingReminders,
    };
  }

  // --- CURRENT USER / AUTH ---
  public getCurrentUser(): User {
    const user = this.data.users.find((u) => u.id === this.data.currentUserId);
    return user || this.data.users[0];
  }

  public async switchUser(userId: string): Promise<User> {
    const user = this.data.users.find((u) => u.id === userId);
    if (user) {
      this.data.currentUserId = user.id;
      await this.saveData();
      return user;
    }
    return this.getCurrentUser();
  }

  public getUsers(): User[] {
    return this.data.users;
  }

  public async createUser(user: Omit<User, 'id'>): Promise<User> {
    const newUser: User = {
      ...user,
      id: `usr-${randomUUID()}`,
    };
    this.data.users.push(newUser);
    await this.saveData();
    return newUser;
  }

  public async updateUser(id: string, updates: Partial<User>): Promise<User | null> {
    const index = this.data.users.findIndex((u) => u.id === id);
    if (index === -1) return null;
    this.data.users[index] = { ...this.data.users[index], ...updates };
    await this.saveData();
    return this.data.users[index];
  }

  // --- CATEGORIES ---
  public getCategories(): EquipmentCategory[] {
    return this.data.categories;
  }

  public async createCategory(cat: Omit<EquipmentCategory, 'id'>): Promise<EquipmentCategory> {
    const newCat: EquipmentCategory = {
      ...cat,
      id: `cat-${randomUUID()}`,
    };
    this.data.categories.push(newCat);
    await this.saveData();
    return newCat;
  }

  public async updateCategory(id: string, updates: Partial<EquipmentCategory>): Promise<EquipmentCategory | null> {
    const idx = this.data.categories.findIndex((c) => c.id === id);
    if (idx === -1) return null;
    this.data.categories[idx] = { ...this.data.categories[idx], ...updates };

    if (updates.name) {
      this.data.equipment = this.data.equipment.map((e) =>
        e.categoryId === id ? { ...e, categoryName: updates.name! } : e
      );
    }

    await this.saveData();
    return this.data.categories[idx];
  }

  public async deleteCategory(id: string): Promise<boolean> {
    const initialLen = this.data.categories.length;
    this.data.categories = this.data.categories.filter((c) => c.id !== id);
    if (this.data.categories.length !== initialLen) {
      await this.saveData();
      return true;
    }
    return false;
  }

  // --- EQUIPMENT ---
  public getEquipment(filters?: { categoryId?: string; search?: string; status?: string }): Equipment[] {
    let result = [...this.data.equipment];

    if (filters?.categoryId && filters.categoryId !== 'all') {
      result = result.filter((e) => e.categoryId === filters.categoryId);
    }

    if (filters?.status && filters.status !== 'all') {
      result = result.filter((e) => e.status === filters.status);
    }

    if (filters?.search && filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(
        (e) =>
          e.name.toLowerCase().includes(q) ||
          e.brand.toLowerCase().includes(q) ||
          e.model.toLowerCase().includes(q) ||
          e.location.toLowerCase().includes(q) ||
          e.serialNumber.toLowerCase().includes(q)
      );
    }

    return result;
  }

  public getEquipmentById(id: string): Equipment | null {
    return this.data.equipment.find((e) => e.id === id) || null;
  }

  public async createEquipment(eq: Omit<Equipment, 'id' | 'createdAt'>): Promise<Equipment> {
    const category = this.data.categories.find((c) => c.id === eq.categoryId);
    const categoryName = category ? category.name : eq.categoryName || 'General';

    // Calculate next service date if not provided
    let nextServiceDate = eq.nextServiceDate;
    if (!nextServiceDate) {
      const base = eq.lastServiceDate ? new Date(eq.lastServiceDate) : new Date(getTodayStr());
      base.setDate(base.getDate() + (eq.maintenanceIntervalDays || 30));
      nextServiceDate = base.toISOString().split('T')[0];
    }

    const newEq: Equipment = {
      ...eq,
      id: `eq-${randomUUID()}`,
      categoryName,
      nextServiceDate,
      createdAt: new Date().toISOString(),
    };

    this.data.equipment.unshift(newEq);
    await this.saveData();
    await this.processReminders();
    return newEq;
  }

  public async updateEquipment(id: string, updates: Partial<Equipment>): Promise<Equipment | null> {
    const idx = this.data.equipment.findIndex((e) => e.id === id);
    if (idx === -1) return null;

    if (updates.categoryId && updates.categoryId !== this.data.equipment[idx].categoryId) {
      const category = this.data.categories.find((c) => c.id === updates.categoryId);
      if (category) updates.categoryName = category.name;
    }

    this.data.equipment[idx] = { ...this.data.equipment[idx], ...updates };
    await this.saveData();
    await this.processReminders();
    return this.data.equipment[idx];
  }

  public async deleteEquipment(id: string): Promise<boolean> {
    const initialLength = this.data.equipment.length;
    this.data.equipment = this.data.equipment.filter((e) => e.id !== id);
    if (this.data.equipment.length !== initialLength) {
      await this.saveData();
      return true;
    }
    return false;
  }

  // --- SCHEDULES ---
  public getSchedules(technicianId?: string): ServiceSchedule[] {
    let result = [...this.data.schedules];
    if (technicianId) {
      result = result.filter((s) => s.technicianId === technicianId);
    }
    // Sort by scheduledDate ascending
    return result.sort((a, b) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
  }

  public getScheduleById(id: string): ServiceSchedule | null {
    return this.data.schedules.find((s) => s.id === id) || null;
  }

  public async createSchedule(sch: Omit<ServiceSchedule, 'id' | 'createdAt'>): Promise<ServiceSchedule> {
    const equipment = this.data.equipment.find((e) => e.id === sch.equipmentId);
    const tech = this.data.users.find((u) => u.id === sch.technicianId);

    const newSchedule: ServiceSchedule = {
      ...sch,
      id: `sch-${randomUUID()}`,
      equipmentName: equipment ? equipment.name : sch.equipmentName,
      location: equipment ? equipment.location : sch.location,
      technicianName: tech ? tech.name : sch.technicianName,
      createdAt: new Date().toISOString(),
    };

    this.data.schedules.unshift(newSchedule);
    await this.saveData();
    await this.processReminders();
    return newSchedule;
  }

  public async updateSchedule(id: string, updates: Partial<ServiceSchedule>): Promise<ServiceSchedule | null> {
    const idx = this.data.schedules.findIndex((s) => s.id === id);
    if (idx === -1) return null;

    this.data.schedules[idx] = { ...this.data.schedules[idx], ...updates };
    await this.saveData();
    return this.data.schedules[idx];
  }

  public async deleteSchedule(id: string): Promise<boolean> {
    const initialLength = this.data.schedules.length;
    this.data.schedules = this.data.schedules.filter((s) => s.id !== id);
    if (this.data.schedules.length !== initialLength) {
      await this.saveData();
      return true;
    }
    return false;
  }

  // --- REPORTS ---
  public getReports(filters?: { equipmentId?: string; technicianId?: string }): ServiceReport[] {
    let result = [...this.data.reports];
    if (filters?.equipmentId) {
      result = result.filter((r) => r.equipmentId === filters.equipmentId);
    }
    if (filters?.technicianId) {
      result = result.filter((r) => r.technicianId === filters.technicianId);
    }
    // Sort latest first
    return result.sort((a, b) => new Date(b.jobDate + 'T' + (b.jobTime || '00:00')).getTime() - new Date(a.jobDate + 'T' + (a.jobTime || '00:00')).getTime());
  }

  public getReportById(id: string): ServiceReport | null {
    return this.data.reports.find((r) => r.id === id) || null;
  }

  public generateReportNumber(): string {
    const now = new Date();
    const ym = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
    const countThisMonth = this.data.reports.filter((r) => r.reportNumber.includes(`SRV-${ym}`)).length + 1;
    return `SRV-${ym}-${String(countThisMonth).padStart(3, '0')}`;
  }

  public async createReport(report: Omit<ServiceReport, 'id' | 'reportNumber' | 'createdAt'>): Promise<ServiceReport> {
    const reportNumber = this.generateReportNumber();
    const newReport: ServiceReport = {
      ...report,
      id: `rep-${randomUUID()}`,
      reportNumber,
      status: 'Submitted',
      syncedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    this.data.reports.unshift(newReport);

    // If report links to a schedule, mark schedule as Completed
    if (newReport.scheduleId) {
      const schIdx = this.data.schedules.findIndex((s) => s.id === newReport.scheduleId);
      if (schIdx !== -1) {
        this.data.schedules[schIdx].status = 'Completed';
        this.data.schedules[schIdx].completedReportId = newReport.id;
      }
    }

    // Automatically update equipment lastServiceDate and nextServiceDate based on equipment maintenanceIntervalDays
    const eqIdx = this.data.equipment.findIndex((e) => e.id === newReport.equipmentId);
    if (eqIdx !== -1) {
      const eq = this.data.equipment[eqIdx];
      const serviceDate = new Date(newReport.jobDate);
      const nextDate = new Date(serviceDate);
      nextDate.setDate(nextDate.getDate() + (eq.maintenanceIntervalDays || 30));

      this.data.equipment[eqIdx].lastServiceDate = newReport.jobDate;
      this.data.equipment[eqIdx].nextServiceDate = nextDate.toISOString().split('T')[0];
    }

    // Mark pending reminder for this equipment as completed
    this.data.reminders = this.data.reminders.map((rem) => {
      if (rem.equipmentId === newReport.equipmentId && rem.status === 'pending') {
        return { ...rem, status: 'completed' };
      }
      return rem;
    });

    await this.saveData();
    await this.processReminders();
    return newReport;
  }

  public async batchSyncReports(reports: Omit<ServiceReport, 'id'>[]): Promise<ServiceReport[]> {
    const synced: ServiceReport[] = [];
    for (const rep of reports) {
      const created = await this.createReport({
        ...rep,
      });
      synced.push(created);
    }
    return synced;
  }

  // --- REMINDERS ---
  public getReminders(): ServiceReminder[] {
    return this.data.reminders;
  }

  public async acknowledgeReminder(id: string): Promise<boolean> {
    const idx = this.data.reminders.findIndex((r) => r.id === id);
    if (idx !== -1) {
      this.data.reminders[idx].status = 'acknowledged';
      await this.saveData();
      return true;
    }
    return false;
  }

  // --- COMPANY SETTINGS ---
  public getCompanySettings(): CompanySettings {
    return this.data.company;
  }

  public async updateCompanySettings(updates: Partial<CompanySettings>): Promise<CompanySettings> {
    this.data.company = { ...this.data.company, ...updates };
    await this.saveData();
    return this.data.company;
  }
}

export const db = new DatabaseManager();
