import React, { useState, useEffect, useCallback } from 'react';
import { Student, AttendanceRecord, EventSession, AdminUser } from './types';
import { INITIAL_STUDENTS, INITIAL_EVENTS, INITIAL_ATTENDANCE } from './data/mockStudents';
import { TopNavbar } from './components/TopNavbar';
import { RfidKioskView } from './components/RfidKioskView';
import { DashboardView } from './components/DashboardView';
import { StudentDirectoryModal } from './components/StudentDirectoryModal';
import { CreateEventModal } from './components/CreateEventModal';
import { CloudSyncModal } from './components/CloudSyncModal';
import { UserProfileModal } from './components/UserProfileModal';
import { AdminLoginModal } from './components/AdminLoginModal';
import { CardPairingModal } from './components/CardPairingModal';
import { useRfidListener } from './hooks/useRfidListener';
import { playSuccessBeep, playLateBeep, playWarningBeep, playTimeOutBeep } from './utils/soundEffects';
import { 
  fetchStudentsFromSupabase, upsertStudentToSupabase, deleteStudentFromSupabase,
  fetchEventsFromSupabase, upsertEventToSupabase, deleteEventFromSupabase,
  fetchAttendanceFromSupabase, logAttendanceToSupabase, deleteAttendanceRecordFromSupabase,
  clearSessionAttendanceFromSupabase,
  subscribeToRealtimeAttendance, subscribeToRealtimeMasterData, isSupabaseConfigured 
} from './services/supabaseClient';
import { 
  syncRecordToGoogleSheet, isGoogleSheetsConfigured 
} from './services/googleSheetsSync';
import { calculateAttendanceStatus } from './utils/timeUtils';

const DEFAULT_ADMIN: AdminUser = {
  id: 'admin-01',
  username: 'ADMIN',
  name: 'ADMIN',
  email: 'admin@ub.edu.ph',
  role: 'System Administrator',
  avatar: '/default_avatar.jpg',
  pin: '1234',
  isLoggedIn: true,
};

const sanitizePhoto = (photo?: string): string => {
  if (!photo || photo.includes('unsplash.com')) {
    return '/default_avatar.jpg';
  }
  return photo;
};

export function App() {
  // State Initialization with LocalStorage persistence and orphan cleanup
  const [students, setStudents] = useState<Student[]>(() => {
    const saved = localStorage.getItem('ubytes_students');
    const list: Student[] = saved ? JSON.parse(saved) : INITIAL_STUDENTS;
    return list.map(s => ({ ...s, photo: sanitizePhoto(s.photo) }));
  });

  const [events, setEvents] = useState<EventSession[]>(() => {
    const saved = localStorage.getItem('ubytes_events');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS;
  });

  const [activeSession, setActiveSession] = useState<EventSession>(() => {
    const saved = localStorage.getItem('ubytes_active_session');
    return saved ? JSON.parse(saved) : INITIAL_EVENTS[0];
  });

  const [attendanceRecords, setAttendanceRecords] = useState<AttendanceRecord[]>(() => {
    const savedStudents = localStorage.getItem('ubytes_students');
    const validStudents: Student[] = savedStudents ? JSON.parse(savedStudents) : INITIAL_STUDENTS;
    const validStudentIds = new Set(validStudents.map((s: Student) => s.id));

    const saved = localStorage.getItem('ubytes_attendance');
    if (!saved) return [];

    try {
      const records: AttendanceRecord[] = JSON.parse(saved);
      // Cleanse any legacy mock records (e.g. att-1, att-2) and ensure student is in roster
      const authentic = records.filter(r => 
        r && 
        r.id && 
        !/^att-\d+$/i.test(r.id) && 
        validStudentIds.has(r.studentId)
      );

      // Cleanse localStorage immediately so legacy mock data is purged
      if (authentic.length !== records.length) {
        localStorage.setItem('ubytes_attendance', JSON.stringify(authentic));
      }

      return authentic.map(r => ({
        ...r,
        photo: sanitizePhoto(r.photo)
      }));
    } catch {
      return [];
    }
  });

  const [activeView, setActiveView] = useState<'kiosk' | 'dashboard'>('kiosk');
  
  const [lastScannedStudent, setLastScannedStudent] = useState<Student | null>(() => {
    const saved = localStorage.getItem('ubytes_attendance');
    if (!saved) return null;
    try {
      const records: AttendanceRecord[] = JSON.parse(saved);
      const authentic = records.filter(r => r && r.id && !/^att-\d+$/i.test(r.id));
      if (authentic.length > 0) {
        const latest = authentic[0];
        const savedStudents = localStorage.getItem('ubytes_students');
        const list: Student[] = savedStudents ? JSON.parse(savedStudents) : INITIAL_STUDENTS;
        const matched = list.find(s => s.id === latest.studentId);
        return matched ? { ...matched, photo: sanitizePhoto(matched.photo) } : null;
      }
    } catch {
      return null;
    }
    return null;
  });

  const [lastScannedRecord, setLastScannedRecord] = useState<AttendanceRecord | null>(() => {
    const saved = localStorage.getItem('ubytes_attendance');
    if (!saved) return null;
    try {
      const records: AttendanceRecord[] = JSON.parse(saved);
      const authentic = records.filter(r => r && r.id && !/^att-\d+$/i.test(r.id));
      if (authentic.length > 0) {
        return {
          ...authentic[0],
          photo: sanitizePhoto(authentic[0].photo)
        };
      }
    } catch {
      return null;
    }
    return null;
  });


  // Modal visibility states
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
  const [unpairedCardScanned, setUnpairedCardScanned] = useState<string | null>(null);

  // Admin accounts roster with #1 ADMIN as primary
  const [adminAccounts, setAdminAccounts] = useState<AdminUser[]>(() => {
    const saved = localStorage.getItem('ubytes_admin_accounts');
    if (!saved) return [DEFAULT_ADMIN];
    try {
      const parsed: AdminUser[] = JSON.parse(saved);
      if (!Array.isArray(parsed) || parsed.length === 0) return [DEFAULT_ADMIN];
      parsed[0] = {
        ...parsed[0],
        id: 'admin-01',
        username: 'ADMIN',
        name: 'ADMIN',
        avatar: (!parsed[0].avatar || parsed[0].avatar.includes('unsplash.com')) ? '/default_avatar.jpg' : parsed[0].avatar
      };
      return parsed;
    } catch {
      return [DEFAULT_ADMIN];
    }
  });

  // Admin authentication and profile state
  const [currentUser, setCurrentUser] = useState<AdminUser>(() => {
    const saved = localStorage.getItem('ubytes_admin_profile');
    if (!saved) return DEFAULT_ADMIN;
    try {
      const parsed: AdminUser = JSON.parse(saved);
      if (parsed.name === 'Arthur Sjorgen' || !parsed.avatar || parsed.avatar.includes('unsplash.com')) {
        return DEFAULT_ADMIN;
      }
      return {
        ...parsed,
        username: parsed.username || parsed.name || 'ADMIN'
      };
    } catch {
      return DEFAULT_ADMIN;
    }
  });
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Cloud status flag
  const [isCloudActive, setIsCloudActive] = useState(() => isSupabaseConfigured() || isGoogleSheetsConfigured());

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('ubytes_admin_profile', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('ubytes_admin_accounts', JSON.stringify(adminAccounts));
  }, [adminAccounts]);

  useEffect(() => {
    localStorage.setItem('ubytes_students', JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem('ubytes_events', JSON.stringify(events));
  }, [events]);

  useEffect(() => {
    localStorage.setItem('ubytes_active_session', JSON.stringify(activeSession));
  }, [activeSession]);

  useEffect(() => {
    localStorage.setItem('ubytes_attendance', JSON.stringify(attendanceRecords));
  }, [attendanceRecords]);

  // Reconcile and purge any orphaned attendance records if a student is deleted from directory
  useEffect(() => {
    const studentIdSet = new Set(students.map(s => s.id));
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => studentIdSet.has(r.studentId));
      if (filtered.length !== prev.length) {
        return filtered;
      }
      return prev;
    });

    // If currently highlighted student is no longer in directory, switch to first available
    if (lastScannedStudent && !studentIdSet.has(lastScannedStudent.id)) {
      const firstValid = students.length > 0 ? students[0] : null;
      setLastScannedStudent(firstValid);
      if (firstValid) {
        const match = attendanceRecords.find(
          r => r.studentId === firstValid.id && r.eventId === activeSession.id
        );
        setLastScannedRecord(match || null);
      } else {
        setLastScannedRecord(null);
      }
    }
  }, [students, activeSession]);

  // Supabase Hydration and Realtime listener
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    // Fetch master students
    fetchStudentsFromSupabase().then(sbStudents => {
      if (sbStudents && sbStudents.length > 0) {
        setStudents(sbStudents);
      }
    });

    // Fetch events
    fetchEventsFromSupabase().then(sbEvents => {
      if (sbEvents && sbEvents.length > 0) {
        setEvents(sbEvents);
        const currentActive = sbEvents.find(e => e.id === activeSession.id);
        if (currentActive) {
          setActiveSession(currentActive);
        }
      }
    });

    // Fetch attendance records
    fetchAttendanceFromSupabase().then(sbAttendance => {
      if (sbAttendance !== null) {
        setAttendanceRecords(sbAttendance);
        if (sbAttendance.length > 0) {
          const latest = sbAttendance[0];
          setLastScannedRecord(latest);
          const matched = students.find(s => s.id === latest.studentId);
          if (matched) {
            setLastScannedStudent({ ...matched, photo: sanitizePhoto(matched.photo) });
          }
        } else {
          setLastScannedRecord(null);
          setLastScannedStudent(null);
        }
      }
    });

    // Realtime subscription: attendance logs
    const unsubAttendance = subscribeToRealtimeAttendance(
      (newRecord) => {
        setAttendanceRecords(prev => {
          const existingIndex = prev.findIndex(r => r.id === newRecord.id);
          if (existingIndex >= 0) {
            const copy = [...prev];
            copy[existingIndex] = newRecord;
            return copy;
          }
          return [newRecord, ...prev];
        });
      },
      (deletedRecordId) => {
        setAttendanceRecords(prev => prev.filter(r => r.id !== deletedRecordId));
      }
    );

    // Realtime subscription: students and events
    const unsubMaster = subscribeToRealtimeMasterData(
      (student) => {
        setStudents(prev => {
          const idx = prev.findIndex(s => s.id === student.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = student;
            return copy;
          }
          return [...prev, student];
        });
      },
      (studentId) => {
        setStudents(prev => prev.filter(s => s.id !== studentId));
      },
      (event) => {
        setEvents(prev => {
          const idx = prev.findIndex(e => e.id === event.id);
          if (idx >= 0) {
            const copy = [...prev];
            copy[idx] = event;
            return copy;
          }
          return [...prev, event];
        });
      },
      (eventId) => {
        setEvents(prev => prev.filter(e => e.id !== eventId));
      }
    );

    return () => {
      unsubAttendance();
      unsubMaster();
    };
  }, [isCloudActive]);

  // Record Attendance Logic (Zero latency local + background dual sync, supports Time In and Time Out)
  const handleRecordAttendance = useCallback((
    student: Student, 
    status?: 'On-Time' | 'Late',
    action: 'in' | 'out' | 'auto' = 'auto'
  ) => {
    const now = new Date();
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const timeStr = `${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;
    const todayDateStr = activeSession.date || now.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

    // Look for existing session attendance
    const existing = attendanceRecords.find(
      r => r.studentId === student.id && r.eventId === activeSession.id
    );

    // Compute status accurately against the active event session threshold
    const determinedStatus = status || calculateAttendanceStatus(now, activeSession);

    let updatedRecord: AttendanceRecord;

    if (action === 'out' || (action === 'auto' && existing && !existing.timeOut)) {
      // Record TIME OUT
      playTimeOutBeep();
      if (existing) {
        updatedRecord = {
          ...existing,
          timeOut: timeStr,
          syncedToSheets: false
        };
      } else {
        updatedRecord = {
          id: `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
          studentId: student.id,
          studentName: student.name,
          program: student.program,
          yearLevel: student.yearLevel,
          section: student.section,
          eventId: activeSession.id,
          eventName: activeSession.title,
          date: todayDateStr,
          timeIn: timeStr,
          timeOut: timeStr,
          status: determinedStatus,
          photo: sanitizePhoto(student.photo),
          syncedToSheets: false
        };
      }
    } else {
      // Record TIME IN
      if (determinedStatus === 'On-Time') {
        playSuccessBeep();
      } else {
        playLateBeep();
      }

      updatedRecord = {
        id: existing ? existing.id : `rec-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        studentId: student.id,
        studentName: student.name,
        program: student.program,
        yearLevel: student.yearLevel,
        section: student.section,
        eventId: activeSession.id,
        eventName: activeSession.title,
        date: todayDateStr,
        timeIn: existing ? existing.timeIn : timeStr,
        timeOut: existing ? existing.timeOut : undefined,
        status: determinedStatus,
        photo: sanitizePhoto(student.photo),
        syncedToSheets: false
      };
    }

    // 1. Instant local state update (0ms UI latency for hardware scanner)
    setAttendanceRecords(prev => {
      const filtered = prev.filter(r => !(r.studentId === student.id && r.eventId === activeSession.id));
      return [updatedRecord, ...filtered];
    });

    setLastScannedStudent(student);
    setLastScannedRecord(updatedRecord);

    // 2. Background Asynchronous Sync to Supabase
    if (isSupabaseConfigured()) {
      logAttendanceToSupabase(updatedRecord).catch(err => {
        console.warn('Background Supabase sync pending:', err);
      });
    }

    // 3. Background Asynchronous Sync to Google Sheets Webhook
    if (isGoogleSheetsConfigured()) {
      syncRecordToGoogleSheet(updatedRecord).then(success => {
        if (success) {
          setAttendanceRecords(prev => 
            prev.map(r => r.id === updatedRecord.id ? { ...r, syncedToSheets: true } : r)
          );
        }
      }).catch(err => {
        console.warn('Background Google Sheet sync pending:', err);
      });
    }
  }, [activeSession, attendanceRecords]);

  // Reconcile attendance records' On-Time vs Late status whenever activeSession changes
  useEffect(() => {
    setAttendanceRecords(prev => {
      let changed = false;
      const updated = prev.map(r => {
        if (r.eventId === activeSession.id && r.timeIn) {
          const correctStatus = calculateAttendanceStatus(r.timeIn, activeSession);
          if (r.status !== correctStatus) {
            changed = true;
            return { ...r, status: correctStatus };
          }
        }
        return r;
      });
      return changed ? updated : prev;
    });

    if (lastScannedRecord && lastScannedRecord.eventId === activeSession.id && lastScannedRecord.timeIn) {
      const correctStatus = calculateAttendanceStatus(lastScannedRecord.timeIn, activeSession);
      if (lastScannedRecord.status !== correctStatus) {
        setLastScannedRecord(prev => prev ? { ...prev, status: correctStatus } : null);
      }
    }
  }, [activeSession]);

  // Global Hardware USB RFID Keystroke listener
  const handleHardwareScan = useCallback((code: string) => {
    const trimmed = code.trim().toLowerCase();
    const matched = students.find(
      s => s.id.toLowerCase() === trimmed ||
           (s.rfidUid && s.rfidUid.toLowerCase() === trimmed) ||
           s.id.toLowerCase().replace('-', '') === trimmed
    );

    if (matched) {
      // Check if already checked in for this session
      const alreadyScanned = attendanceRecords.find(
        r => r.studentId === matched.id && r.eventId === activeSession.id
      );

      // If student already has both Time In and Time Out completed
      if (alreadyScanned && alreadyScanned.timeOut) {
        playWarningBeep();
        alert(`${matched.name} has already completed attendance for this session (In: ${alreadyScanned.timeIn}, Out: ${alreadyScanned.timeOut})!`);
        return;
      }

      // Dynamic status determination based on current time & active session late threshold
      const status = calculateAttendanceStatus(new Date(), activeSession);

      const action = alreadyScanned ? 'out' : 'in';
      handleRecordAttendance(matched, status, action);
      setActiveView('kiosk');
    } else {
      // Embedded RFID chip tapped for the first time!
      // Open the Card Pairing Modal to link this card to a student and check them in!
      playSuccessBeep();
      setUnpairedCardScanned(code.trim());
      setActiveView('kiosk');
    }
  }, [students, attendanceRecords, activeSession, handleRecordAttendance]);

  useRfidListener({
    onScan: handleHardwareScan,
    enabled: !isDirectoryOpen && !isCreateEventOpen && !unpairedCardScanned
  });

  const handlePairCardAndCheckIn = (student: Student, cardUid: string) => {
    // 1. Permanently link the embedded RFID to this student profile
    const updatedStudent: Student = {
      ...student,
      rfidUid: cardUid.trim()
    };
    handleUpdateStudent(updatedStudent);

    // 2. Determine Time In / Time Out
    const alreadyScanned = attendanceRecords.find(
      r => r.studentId === student.id && r.eventId === activeSession.id
    );
    const status = calculateAttendanceStatus(new Date(), activeSession);
    const action = alreadyScanned ? 'out' : 'in';

    // 3. Record attendance immediately
    handleRecordAttendance(updatedStudent, status, action);

    // 4. Close pairing modal and switch to kiosk view
    setUnpairedCardScanned(null);
    setActiveView('kiosk');
  };

  const handleAddStudent = (newStudent: Student) => {
    setStudents(prev => [newStudent, ...prev]);
    if (isSupabaseConfigured()) {
      upsertStudentToSupabase(newStudent);
    }
  };

  const handleUpdateStudent = (updatedStudent: Student) => {
    setStudents(prev => prev.map(s => s.id === updatedStudent.id ? updatedStudent : s));
    if (lastScannedStudent && lastScannedStudent.id === updatedStudent.id) {
      setLastScannedStudent(updatedStudent);
    }
    // Update existing attendance records for consistency
    setAttendanceRecords(prev => prev.map(r => r.studentId === updatedStudent.id ? {
      ...r,
      studentName: updatedStudent.name,
      program: updatedStudent.program,
      yearLevel: updatedStudent.yearLevel,
      section: updatedStudent.section,
      photo: updatedStudent.photo
    } : r));

    if (isSupabaseConfigured()) {
      upsertStudentToSupabase(updatedStudent);
    }
  };

  const handleDeleteStudent = (studentId: string) => {
    // 1. Remove from students roster
    setStudents(prev => prev.filter(s => s.id !== studentId));

    // 2. Cascade delete: immediately purge all attendance records for this student
    setAttendanceRecords(prev => prev.filter(r => r.studentId !== studentId));

    // 3. Reset last scanned preview if this student was displayed
    if (lastScannedStudent && lastScannedStudent.id === studentId) {
      const remaining = students.filter(s => s.id !== studentId);
      const nextStudent = remaining.length > 0 ? remaining[0] : null;
      setLastScannedStudent(nextStudent);
      if (nextStudent) {
        const nextRecord = attendanceRecords.find(
          r => r.studentId === nextStudent.id && r.eventId === activeSession.id
        );
        setLastScannedRecord(nextRecord || null);
      } else {
        setLastScannedRecord(null);
      }
    }

    // 4. Background Supabase deletion (both student and attendance records)
    if (isSupabaseConfigured()) {
      deleteStudentFromSupabase(studentId);
    }
  };

  const handleDeleteAttendanceRecord = (recordId: string) => {
    setAttendanceRecords(prev => {
      const updated = prev.filter(r => r.id !== recordId);
      if (lastScannedRecord && lastScannedRecord.id === recordId) {
        const nextLatest = updated.find(r => r.eventId === activeSession.id);
        if (nextLatest) {
          setLastScannedRecord(nextLatest);
          const matched = students.find(s => s.id === nextLatest.studentId);
          setLastScannedStudent(matched ? { ...matched, photo: sanitizePhoto(matched.photo) } : null);
        } else {
          setLastScannedRecord(null);
          setLastScannedStudent(null);
        }
      }
      return updated;
    });
    if (isSupabaseConfigured()) {
      deleteAttendanceRecordFromSupabase(recordId);
    }
  };

  const handleClearSessionAttendance = () => {
    setAttendanceRecords(prev => prev.filter(r => r.eventId !== activeSession.id));
    if (lastScannedRecord && lastScannedRecord.eventId === activeSession.id) {
      setLastScannedRecord(null);
      setLastScannedStudent(null);
    }
    if (isSupabaseConfigured()) {
      clearSessionAttendanceFromSupabase(activeSession.id);
    }
  };

  const handleAddEvent = (newEvent: EventSession) => {
    setEvents(prev => [newEvent, ...prev]);
    if (isSupabaseConfigured()) {
      upsertEventToSupabase(newEvent);
    }
  };

  const handleUpdateEvent = (updatedEvent: EventSession) => {
    setEvents(prev => prev.map(e => e.id === updatedEvent.id ? updatedEvent : e));
    if (activeSession.id === updatedEvent.id) {
      setActiveSession(updatedEvent);
    }
    // Synchronize eventName in attendance records
    setAttendanceRecords(prev => prev.map(r => r.eventId === updatedEvent.id ? {
      ...r,
      eventName: updatedEvent.title
    } : r));

    if (isSupabaseConfigured()) {
      upsertEventToSupabase(updatedEvent);
    }
  };

  const handleDeleteEvent = (eventId: string) => {
    if (events.length <= 1) {
      alert('Cannot delete the last remaining event session.');
      return;
    }
    setEvents(prev => prev.filter(e => e.id !== eventId));
    // Cascade delete: remove attendance records for this event
    setAttendanceRecords(prev => prev.filter(r => r.eventId !== eventId));

    if (activeSession.id === eventId) {
      const nextSession = events.find(e => e.id !== eventId);
      if (nextSession) {
        setActiveSession(nextSession);
      }
    }
    if (isSupabaseConfigured()) {
      deleteEventFromSupabase(eventId);
    }
  };

  const handleUpdateProfile = (updated: AdminUser) => {
    setCurrentUser(updated);
    setAdminAccounts(prev => {
      const idx = prev.findIndex(a => a.id === updated.id);
      if (idx !== -1) {
        const copy = [...prev];
        copy[idx] = updated;
        return copy;
      }
      return [...prev, updated];
    });
  };

  const handleRegisterAdmin = (newAdmin: AdminUser) => {
    setAdminAccounts(prev => [...prev, newAdmin]);
  };

  const handleSwitchAdmin = (admin: AdminUser) => {
    setCurrentUser({
      ...admin,
      isLoggedIn: true
    });
  };

  const handleLogout = () => {
    setCurrentUser(prev => ({ ...prev, isLoggedIn: false }));
  };

  const handleLoginSuccess = () => {
    setCurrentUser(prev => ({ ...prev, isLoggedIn: true }));
  };

  return (
    <div className="min-h-screen bg-[#EEF0F5] text-slate-800 flex flex-col font-sans">
      {/* Top Navbar */}
      <TopNavbar
        activeView={activeView}
        setActiveView={setActiveView}
        onOpenDirectory={() => setIsDirectoryOpen(true)}
        onOpenEvents={() => setIsCreateEventOpen(true)}
        onOpenCloudSync={() => setIsCloudModalOpen(true)}
        isCloudSyncActive={isCloudActive}
        hardwareStatus={true}
        currentUser={currentUser}
        onOpenProfile={() => setIsProfileModalOpen(true)}
        onOpenLogin={() => setIsLoginModalOpen(true)}
      />

      {/* Main Content Area with Subtle View Transition */}
      <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
        <div key={activeView} className="view-enter">
          {activeView === 'kiosk' ? (
            <RfidKioskView
              students={students}
              attendanceRecords={attendanceRecords}
              activeSession={activeSession}
              onRecordAttendance={handleRecordAttendance}
              onDeleteAttendanceRecord={handleDeleteAttendanceRecord}
              onClearSessionAttendance={handleClearSessionAttendance}
              lastScannedStudent={lastScannedStudent}
              lastScannedRecord={lastScannedRecord}
            />
          ) : (
            <DashboardView
              students={students}
              attendanceRecords={attendanceRecords}
              events={events}
              onSwitchToKiosk={() => setActiveView('kiosk')}
              onOpenCreateEvent={() => setIsCreateEventOpen(true)}
              currentUser={currentUser}
            />
          )}
        </div>
      </main>

      {/* Modals */}
      <StudentDirectoryModal
        isOpen={isDirectoryOpen}
        onClose={() => setIsDirectoryOpen(false)}
        students={students}
        onAddStudent={handleAddStudent}
        onUpdateStudent={handleUpdateStudent}
        onDeleteStudent={handleDeleteStudent}
        onSimulateTap={(studentId) => {
          const student = students.find(s => s.id === studentId);
          if (student) {
            const status = calculateAttendanceStatus(new Date(), activeSession);
            handleRecordAttendance(student, status);
            setActiveView('kiosk');
          }
        }}
      />

      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        events={events}
        activeSession={activeSession}
        onSelectSession={setActiveSession}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
      />

      <CloudSyncModal
        isOpen={isCloudModalOpen}
        onClose={() => setIsCloudModalOpen(false)}
        students={students}
        attendanceRecords={attendanceRecords}
        onCloudStateChanged={() => {
          setIsCloudActive(isSupabaseConfigured() || isGoogleSheetsConfigured());
        }}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        currentUser={currentUser}
        adminAccounts={adminAccounts}
        onUpdateProfile={handleUpdateProfile}
        onRegisterAdmin={handleRegisterAdmin}
        onSwitchAdmin={handleSwitchAdmin}
        onLogout={handleLogout}
      />

      {/* Admin Login Modal */}
      <AdminLoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        currentUser={currentUser}
        adminAccounts={adminAccounts}
        onSwitchAdmin={handleSwitchAdmin}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Just-In-Time Card Pairing Modal for Embedded IDs */}
      {unpairedCardScanned && (
        <CardPairingModal
          isOpen={Boolean(unpairedCardScanned)}
          cardUid={unpairedCardScanned}
          students={students}
          activeSession={activeSession}
          onPairAndCheckIn={handlePairCardAndCheckIn}
          onClose={() => setUnpairedCardScanned(null)}
        />
      )}
    </div>
  );
}

export default App;
