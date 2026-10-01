export type YearLevel = '1st Year' | '2nd Year' | '3rd Year' | '4th Year';

export type AttendanceStatus = 'On-Time' | 'Late' | 'Excused' | 'Absent';

export interface Student {
  id: string;
  rfidUid: string;
  name: string;
  program: string;
  yearLevel: YearLevel;
  section?: string;
  role: string;
  photo: string;
  email?: string;
}

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  program: string;
  yearLevel: YearLevel;
  section?: string;
  eventId: string;
  eventName: string;
  date: string;
  timeIn: string;
  timeOut?: string;
  status: AttendanceStatus;
  notes?: string;
  photo?: string;
  syncedToSheets?: boolean;
}

export interface EventSession {
  id: string;
  title: string;
  date: string;
  startTime: string;
  lateThreshold: string; // e.g. "08:15"
  location: string;
  description: string;
  status: 'Active' | 'Upcoming' | 'Completed';
  daysLeft?: number;
}

export interface AdminUser {
  id: string;
  username?: string;
  name: string;
  email: string;
  role: string;
  avatar: string;
  pin: string;
  isLoggedIn: boolean;
}
