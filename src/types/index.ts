export interface EquipmentCategory {
  id: string;
  name: string;
  code: string;
  description: string;
  iconName: string;
}

export interface Equipment {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  brand: string;
  model: string;
  serialNumber: string;
  capacity: string;
  location: string;
  installationDate?: string;
  maintenanceIntervalDays: number;
  status: 'active' | 'inactive';
  lastServiceDate?: string;
  nextServiceDate: string;
  notes?: string;
  createdAt: string;
}

export type JobType = 
  | 'Preventive Maintenance'
  | 'Corrective Maintenance'
  | 'Inspection'
  | 'Repair'
  | 'Installation';

export type ScheduleStatus = 'Scheduled' | 'In Progress' | 'Completed';
export type SchedulePriority = 'Low' | 'Medium' | 'High' | 'Emergency';

export interface ServiceSchedule {
  id: string;
  title: string;
  equipmentId: string;
  equipmentName: string;
  location: string;
  technicianId: string;
  technicianName: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  jobType: JobType;
  priority: SchedulePriority;
  notes?: string;
  status: ScheduleStatus;
  completedReportId?: string;
  createdAt: string;
}

export interface ServiceReportPhoto {
  id: string;
  url: string;
  publicId?: string;
  caption: string;
  stage: 'before' | 'during' | 'after';
  timestamp: string;
}

export interface ServiceReport {
  id: string;
  reportNumber: string;
  scheduleId?: string;
  equipmentId: string;
  equipmentName: string;
  categoryName: string;
  brandModel: string;
  serialNumber?: string;
  location: string;
  technicianId: string;
  technicianName: string;
  jobDate: string;
  jobTime: string;
  jobType: JobType;
  conditionBefore: string;
  findings: string;
  actionTaken: string;
  spareParts?: string;
  conditionAfter: string;
  recommendations: string;
  additionalNotes?: string;
  photos: ServiceReportPhoto[];
  status: 'Draft' | 'Submitted';
  syncedAt?: string;
  createdAt: string;
}

export type ReminderType = '7_days' | '3_days' | '1_day' | 'overdue';

export interface ServiceReminder {
  id: string;
  equipmentId: string;
  equipmentName: string;
  categoryName: string;
  location: string;
  dueDate: string;
  daysRemaining: number;
  type: ReminderType;
  scheduleId?: string;
  technicianName?: string;
  status: 'pending' | 'acknowledged' | 'completed';
  createdAt: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: 'admin' | 'technician';
  specialization: string;
  status: 'active' | 'inactive';
}

export interface CompanySettings {
  companyName: string;
  branch: string;
  address: string;
  phone: string;
  email: string;
  picName: string;
  picTitle: string;
  headerNote: string;
}

export interface DashboardStats {
  totalEquipment: number;
  activeEquipment: number;
  jobsThisMonth: number;
  completedJobsThisMonth: number;
  upcomingSchedules: number;
  overdueMaintenance: number;
  pendingReminders: number;
}
