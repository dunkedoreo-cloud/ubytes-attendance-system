import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Student, AttendanceRecord, EventSession } from '../types';

let cachedClient: SupabaseClient | null = null;

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSupabaseSettings(): SupabaseConfig {
  const envUrl = (import.meta as any).env?.VITE_SUPABASE_URL || '';
  const envKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || '';
  
  const savedUrl = localStorage.getItem('ubytes_supabase_url') || envUrl;
  const savedKey = localStorage.getItem('ubytes_supabase_key') || envKey;

  return {
    url: savedUrl.trim(),
    anonKey: savedKey.trim()
  };
}

export function saveSupabaseSettings(url: string, anonKey: string) {
  localStorage.setItem('ubytes_supabase_url', url.trim());
  localStorage.setItem('ubytes_supabase_key', anonKey.trim());
  cachedClient = null; // Invalidate cached client to recreate with new credentials
}

export function isSupabaseConfigured(): boolean {
  const { url, anonKey } = getSupabaseSettings();
  return Boolean(url && anonKey && url.startsWith('http'));
}

export function getSupabase(): SupabaseClient | null {
  if (cachedClient) return cachedClient;

  const { url, anonKey } = getSupabaseSettings();
  if (!url || !anonKey || !url.startsWith('http')) {
    return null;
  }

  try {
    cachedClient = createClient(url, anonKey, {
      auth: { persistSession: false }
    });
    return cachedClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    return null;
  }
}

/**
 * Tests connection to the Supabase database
 */
export async function testSupabaseConnection(customUrl?: string, customKey?: string): Promise<{ success: boolean; message: string }> {
  const url = customUrl !== undefined ? customUrl.trim() : getSupabaseSettings().url;
  const key = customKey !== undefined ? customKey.trim() : getSupabaseSettings().anonKey;

  if (!url || !key) {
    return { success: false, message: 'Please provide both Supabase Project URL and Anon Key.' };
  }

  try {
    const testClient = createClient(url, key, { auth: { persistSession: false } });
    const { data, error } = await testClient.from('students').select('id').limit(1);

    if (error) {
      // If table does not exist, provide helpful prompt
      if (error.message.includes('relation "public.students" does not exist')) {
        return { 
          success: false, 
          message: 'Connected to Supabase, but the "students" table was not found. Please run the SQL schema script in your Supabase SQL Editor!' 
        };
      }
      return { success: false, message: `Supabase error: ${error.message}` };
    }

    return { success: true, message: `Connected to Supabase successfully! (${data ? data.length : 0} sample rows verified)` };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Network error connecting to Supabase.' };
  }
}

/**
 * Fetch all students from Supabase
 */
export async function fetchStudentsFromSupabase(): Promise<Student[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;
    if (!data) return null;

    return data.map((row: any) => ({
      id: row.id,
      rfidUid: (row.rfid_uid && !String(row.rfid_uid).startsWith('UNPAIRED-')) ? String(row.rfid_uid).trim() : '',
      name: row.name,
      program: row.program,
      yearLevel: row.year_level,
      role: row.role,
      photo: row.photo || '/default_avatar.jpg',
      email: row.email
    }));
  } catch (err) {
    console.warn('Failed to fetch students from Supabase:', err);
    return null;
  }
}

/**
 * Upsert a single student to Supabase
 */
export async function upsertStudentToSupabase(student: Student): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const hasRealRfid = Boolean(student.rfidUid && student.rfidUid.trim() && !student.rfidUid.startsWith('UNPAIRED-'));
  const baseFields = {
    id: student.id,
    name: student.name,
    program: student.program,
    year_level: student.yearLevel,
    role: student.role,
    photo: student.photo,
    email: student.email
  };

  try {
    // 1. Preferred approach: null for unpaired cards (allows multiple unpaired rows under UNIQUE)
    const { error } = await supabase.from('students').upsert({
      ...baseFields,
      rfid_uid: hasRealRfid ? student.rfidUid.trim() : null
    }, { onConflict: 'id' });

    if (!error) return true;

    // 2. Fallback for tables with legacy NOT NULL constraint: use unique placeholder UNPAIRED-id
    const isNotNullViolation = error.code === '23502' || (error.message && (
      error.message.toLowerCase().includes('not-null') ||
      error.message.toLowerCase().includes('null value') ||
      error.message.toLowerCase().includes('violates not-null')
    ));
    if (isNotNullViolation) {
      const { error: retryErr } = await supabase.from('students').upsert({
        ...baseFields,
        rfid_uid: hasRealRfid ? student.rfidUid.trim() : `UNPAIRED-${student.id}`
      }, { onConflict: 'id' });
      if (!retryErr) return true;
      throw retryErr;
    }

    throw error;
  } catch (err) {
    console.error('Failed to upsert student to Supabase:', err);
    return false;
  }
}

/**
 * Fetch events from Supabase
 */
export async function fetchEventsFromSupabase(): Promise<EventSession[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase.from('events').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    if (!data) return null;

    return data.map((row: any) => ({
      id: row.id,
      title: row.title,
      date: row.date,
      startTime: row.start_time,
      endTime: row.end_time,
      location: row.venue || 'University of Bohol',
      description: row.description || '',
      lateThreshold: row.late_threshold,
      status: row.status
    }));
  } catch (err) {
    console.warn('Failed to fetch events from Supabase:', err);
    return null;
  }
}

/**
 * Upsert an event session to Supabase
 */
export async function upsertEventToSupabase(event: EventSession): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('events').upsert({
      id: event.id,
      title: event.title,
      date: event.date,
      start_time: event.startTime,
      end_time: event.startTime, // default
      venue: event.location,
      late_threshold: event.lateThreshold,
      status: event.status
    }, { onConflict: 'id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to upsert event to Supabase:', err);
    return false;
  }
}

/**
 * Log attendance record to Supabase
 */
export async function logAttendanceToSupabase(record: AttendanceRecord): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('attendance_records').upsert({
      id: record.id,
      student_id: record.studentId,
      student_name: record.studentName,
      program: record.program,
      year_level: record.yearLevel,
      event_id: record.eventId,
      event_name: record.eventName,
      date: record.date,
      time_in: record.timeIn,
      time_out: record.timeOut || null,
      status: record.status,
      photo: record.photo,
      synced_to_sheets: record.syncedToSheets ?? false
    }, { onConflict: 'id' });

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to log attendance to Supabase:', err);
    return false;
  }
}

/**
 * Fetch attendance records for a session from Supabase
 */
export async function fetchAttendanceFromSupabase(eventId?: string): Promise<AttendanceRecord[] | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    let query = supabase.from('attendance_records').select('*').order('created_at', { ascending: false });
    if (eventId) {
      query = query.eq('event_id', eventId);
    }
    const { data, error } = await query;
    if (error) throw error;
    if (!data) return null;

    return data.map((row: any) => ({
      id: row.id,
      studentId: row.student_id,
      studentName: row.student_name,
      program: row.program,
      yearLevel: row.year_level,
      eventId: row.event_id,
      eventName: row.event_name,
      date: row.date,
      timeIn: row.time_in,
      timeOut: row.time_out || undefined,
      status: row.status,
      photo: row.photo,
      syncedToSheets: row.synced_to_sheets
    }));
  } catch (err) {
    console.warn('Failed to fetch attendance records from Supabase:', err);
    return null;
  }
}

/**
 * Realtime subscription to attendance_records
 */
export function subscribeToRealtimeAttendance(
  onRecord: (record: AttendanceRecord) => void,
  onDeleteRecord?: (recordId: string) => void
) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('public:attendance_records')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'attendance_records' }, (payload) => {
      const row: any = payload.new;
      if (row) {
        onRecord({
          id: row.id,
          studentId: row.student_id,
          studentName: row.student_name,
          program: row.program,
          yearLevel: row.year_level,
          eventId: row.event_id,
          eventName: row.event_name,
          date: row.date,
          timeIn: row.time_in,
          timeOut: row.time_out || undefined,
          status: row.status,
          photo: row.photo,
          syncedToSheets: row.synced_to_sheets
        });
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'attendance_records' }, (payload) => {
      const row: any = payload.new;
      if (row) {
        onRecord({
          id: row.id,
          studentId: row.student_id,
          studentName: row.student_name,
          program: row.program,
          yearLevel: row.year_level,
          eventId: row.event_id,
          eventName: row.event_name,
          date: row.date,
          timeIn: row.time_in,
          timeOut: row.time_out || undefined,
          status: row.status,
          photo: row.photo,
          syncedToSheets: row.synced_to_sheets
        });
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'attendance_records' }, (payload) => {
      const oldRow: any = payload.old;
      if (oldRow && oldRow.id && onDeleteRecord) {
        onDeleteRecord(oldRow.id);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Realtime subscription to students and events master data
 */
export function subscribeToRealtimeMasterData(
  onStudentUpsert: (student: Student) => void,
  onStudentDelete: (studentId: string) => void,
  onEventUpsert: (event: EventSession) => void,
  onEventDelete: (eventId: string) => void
) {
  const supabase = getSupabase();
  if (!supabase) return () => {};

  const channel = supabase
    .channel('public:master_data')
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'students' }, (payload) => {
      const row: any = payload.new;
      if (row) {
        onStudentUpsert({
          id: row.id,
          rfidUid: (row.rfid_uid && !String(row.rfid_uid).startsWith('UNPAIRED-')) ? String(row.rfid_uid).trim() : '',
          name: row.name,
          program: row.program,
          yearLevel: row.year_level,
          role: row.role,
          photo: row.photo || '/default_avatar.jpg',
          email: row.email
        });
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'students' }, (payload) => {
      const row: any = payload.new;
      if (row) {
        onStudentUpsert({
          id: row.id,
          rfidUid: (row.rfid_uid && !String(row.rfid_uid).startsWith('UNPAIRED-')) ? String(row.rfid_uid).trim() : '',
          name: row.name,
          program: row.program,
          yearLevel: row.year_level,
          role: row.role,
          photo: row.photo || '/default_avatar.jpg',
          email: row.email
        });
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'students' }, (payload) => {
      const oldRow: any = payload.old;
      if (oldRow && oldRow.id) {
        onStudentDelete(oldRow.id);
      }
    })
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'events' }, (payload) => {
      const row: any = payload.new;
      if (row) {
        onEventUpsert({
          id: row.id,
          title: row.title,
          date: row.date,
          startTime: row.start_time,
          location: row.venue || 'University of Bohol',
          description: row.description || '',
          lateThreshold: row.late_threshold,
          status: row.status
        });
      }
    })
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'events' }, (payload) => {
      const row: any = payload.new;
      if (row) {
        onEventUpsert({
          id: row.id,
          title: row.title,
          date: row.date,
          startTime: row.start_time,
          location: row.venue || 'University of Bohol',
          description: row.description || '',
          lateThreshold: row.late_threshold,
          status: row.status
        });
      }
    })
    .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'events' }, (payload) => {
      const oldRow: any = payload.old;
      if (oldRow && oldRow.id) {
        onEventDelete(oldRow.id);
      }
    })
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Sync all local students to Supabase in bulk
 */
export async function syncLocalStudentsToSupabase(students: Student[]): Promise<{ count: number; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { count: 0, error: 'Supabase is not configured' };

  try {
    // 1. Attempt with null for unpaired cards (allows multiple unpaired rows under UNIQUE)
    const payloadWithNull = students.map(s => {
      const hasRealRfid = Boolean(s.rfidUid && s.rfidUid.trim() && !s.rfidUid.startsWith('UNPAIRED-'));
      return {
        id: s.id,
        rfid_uid: hasRealRfid ? s.rfidUid.trim() : null,
        name: s.name,
        program: s.program,
        year_level: s.yearLevel,
        role: s.role,
        photo: s.photo,
        email: s.email
      };
    });

    const { error } = await supabase.from('students').upsert(payloadWithNull, { onConflict: 'id' });
    if (!error) {
      return { count: students.length };
    }

    // 2. If table was created with legacy NOT NULL constraint on rfid_uid,
    // fallback to unique placeholder UNPAIRED-${id} so every row has a distinct non-null UID
    const isNotNullViolation = error.code === '23502' || (error.message && (
      error.message.toLowerCase().includes('not-null') ||
      error.message.toLowerCase().includes('null value') ||
      error.message.toLowerCase().includes('violates not-null')
    ));
    if (isNotNullViolation) {
      const payloadWithFallback = students.map(s => {
        const hasRealRfid = Boolean(s.rfidUid && s.rfidUid.trim() && !s.rfidUid.startsWith('UNPAIRED-'));
        return {
          id: s.id,
          rfid_uid: hasRealRfid ? s.rfidUid.trim() : `UNPAIRED-${s.id}`,
          name: s.name,
          program: s.program,
          year_level: s.yearLevel,
          role: s.role,
          photo: s.photo,
          email: s.email
        };
      });

      const { error: retryError } = await supabase.from('students').upsert(payloadWithFallback, { onConflict: 'id' });
      if (retryError) throw retryError;
      return { count: students.length };
    }

    throw error;
  } catch (err: any) {
    return { count: 0, error: err?.message || 'Failed to sync students' };
  }
}

/**
 * Clear all attendance records for a specific event from Supabase
 */
export async function clearSessionAttendanceFromSupabase(eventId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('attendance_records').delete().eq('event_id', eventId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to clear session attendance from Supabase:', err);
    return false;
  }
}

/**
 * Delete a student from Supabase and cascade delete their attendance records
 */
export async function deleteStudentFromSupabase(studentId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    // Delete associated attendance records first to ensure foreign key cascade
    await supabase.from('attendance_records').delete().eq('student_id', studentId);
    const { error } = await supabase.from('students').delete().eq('id', studentId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete student from Supabase:', err);
    return false;
  }
}

/**
 * Delete a single attendance record from Supabase
 */
export async function deleteAttendanceRecordFromSupabase(recordId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('attendance_records').delete().eq('id', recordId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete attendance record from Supabase:', err);
    return false;
  }
}

/**
 * Delete an event from Supabase
 */
export async function deleteEventFromSupabase(eventId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('events').delete().eq('id', eventId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete event from Supabase:', err);
    return false;
  }
}
