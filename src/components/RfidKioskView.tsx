import React, { useState, useEffect } from 'react';
import { Student, AttendanceRecord, EventSession } from '../types';
import { playSuccessBeep, playLateBeep, playWarningBeep } from '../utils/soundEffects';
import { calculateAttendanceStatus } from '../utils/timeUtils';
import { 
  CheckCircle2, 
  Search, 
  Download, 
  Sparkles, 
  Wifi, 
  AlertTriangle,
  GraduationCap,
  CreditCard,
  LogIn,
  LogOut,
  Trash2,
  X
} from 'lucide-react';

interface RfidKioskViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  activeSession: EventSession;
  onRecordAttendance: (student: Student, status: 'On-Time' | 'Late', action?: 'in' | 'out' | 'auto') => void;
  onDeleteAttendanceRecord?: (recordId: string) => void;
  onClearSessionAttendance?: () => void;
  lastScannedStudent: Student | null;
  lastScannedRecord: AttendanceRecord | null;
}

export const RfidKioskView: React.FC<RfidKioskViewProps> = ({
  students,
  attendanceRecords,
  activeSession,
  onRecordAttendance,
  onDeleteAttendanceRecord,
  onClearSessionAttendance,
  lastScannedStudent,
  lastScannedRecord
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [manualCodeInput, setManualCodeInput] = useState('');
  const [duplicateAlert, setDuplicateAlert] = useState<string | null>(null);
  const [stationMode, setStationMode] = useState<'auto' | 'in' | 'out'>('auto');
  const [recordToDelete, setRecordToDelete] = useState<AttendanceRecord | null>(null);
  const [showClearModal, setShowClearModal] = useState(false);
  const [deleteToast, setDeleteToast] = useState<string | null>(null);

  // Synchronize default station mode with active session attendance mode
  useEffect(() => {
    if (activeSession.attendanceMode === 'in_only') {
      setStationMode('in');
    } else if (activeSession.attendanceMode === 'out_only') {
      setStationMode('out');
    } else {
      setStationMode('auto');
    }
  }, [activeSession.id, activeSession.attendanceMode]);

  // Keyboard shortcut listener for confirmation dialog
  useEffect(() => {
    if (!recordToDelete) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setRecordToDelete(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        handleConfirmDelete();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [recordToDelete]);

  const handleConfirmDelete = () => {
    if (!recordToDelete || !onDeleteAttendanceRecord) return;
    const studentName = recordToDelete.studentName;
    onDeleteAttendanceRecord(recordToDelete.id);
    setRecordToDelete(null);
    playSuccessBeep();
    setDeleteToast(`Attendance record for ${studentName} removed.`);
    setTimeout(() => setDeleteToast(null), 3500);
  };


  // Filter attendance database by search query
  const sessionRecords = attendanceRecords.filter(r => r.eventId === activeSession.id);
  const filteredRecords = sessionRecords.filter(r => {
    const q = searchQuery.toLowerCase();
    return (
      r.studentName.toLowerCase().includes(q) ||
      r.studentId.toLowerCase().includes(q) ||
      r.yearLevel.toLowerCase().includes(q) ||
      (r.section ? r.section.toLowerCase().includes(q) : false)
    );
  });

  // Live statistics
  const totalScanned = sessionRecords.length;
  const timedOutCount = sessionRecords.filter(r => !!r.timeOut).length;
  const inSessionCount = totalScanned - timedOutCount;
  const onTimeCount = sessionRecords.filter(r => r.status === 'On-Time').length;
  const lateCount = sessionRecords.filter(r => r.status === 'Late').length;

  // Handle simulation tap
  const handleSimulateTap = (studentId: string) => {
    const student = students.find(s => s.id === studentId);
    if (!student) return;

    // Check existing attendance in this session
    const alreadyScanned = sessionRecords.find(r => r.studentId === student.id);
    const eventMode = activeSession.attendanceMode || 'both';

    // If event is strictly Time In Only
    if (eventMode === 'in_only') {
      if (alreadyScanned) {
        playWarningBeep();
        setDuplicateAlert(`${student.name} already recorded Time In at ${alreadyScanned.timeIn} (Time In Only event)!`);
        setTimeout(() => setDuplicateAlert(null), 3500);
        return;
      }
      const status = calculateAttendanceStatus(new Date(), activeSession);
      onRecordAttendance(student, status, 'in');
      return;
    }

    // If event is strictly Time Out Only
    if (eventMode === 'out_only') {
      if (alreadyScanned && alreadyScanned.timeOut) {
        playWarningBeep();
        setDuplicateAlert(`${student.name} already recorded Time Out at ${alreadyScanned.timeOut} (Time Out Only event)!`);
        setTimeout(() => setDuplicateAlert(null), 3500);
        return;
      }
      const status = calculateAttendanceStatus(new Date(), activeSession);
      onRecordAttendance(student, status, 'out');
      return;
    }

    // Dual Mode: Check stationMode and existing status
    // If Mode is 'in' and student already timed in
    if (stationMode === 'in' && alreadyScanned) {
      playWarningBeep();
      setDuplicateAlert(`${student.name} already recorded Time In at ${alreadyScanned.timeIn}!`);
      setTimeout(() => setDuplicateAlert(null), 3500);
      return;
    }

    // If Mode is 'out' and student has not timed in yet
    if (stationMode === 'out' && !alreadyScanned) {
      playWarningBeep();
      setDuplicateAlert(`${student.name} cannot Time Out without recording Time In first!`);
      setTimeout(() => setDuplicateAlert(null), 3500);
      return;
    }

    // If student already has both Time In and Time Out completed
    if (alreadyScanned && alreadyScanned.timeOut) {
      playWarningBeep();
      setDuplicateAlert(`${student.name} has already completed attendance (In: ${alreadyScanned.timeIn}, Out: ${alreadyScanned.timeOut})!`);
      setTimeout(() => setDuplicateAlert(null), 3500);
      return;
    }

    // Dynamic status determination based on current time & active session late threshold
    const status = calculateAttendanceStatus(new Date(), activeSession);

    const action = stationMode === 'auto'
      ? (alreadyScanned ? 'out' : 'in')
      : stationMode;

    onRecordAttendance(student, status, action);
  };

  // Handle manual code or student name search input form
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCodeInput.trim()) return;

    const query = manualCodeInput.trim().toLowerCase();
    const matched = students.find(
      s => s.id.toLowerCase() === query || 
           s.rfidUid.toLowerCase() === query ||
           s.id.toLowerCase().replace('-', '') === query ||
           s.name.toLowerCase().includes(query)
    );

    if (matched) {
      handleSimulateTap(matched.id);
      setManualCodeInput('');
    } else {
      playWarningBeep();
      setDuplicateAlert(`No student found matching "${manualCodeInput.trim()}". Try searching by ID, RFID, or full name.`);
      setTimeout(() => setDuplicateAlert(null), 3500);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Student ID', 'Full Name', 'Course', 'Year Level', 'Event', 'Date', 'Time In', 'Time Out', 'Status'];
    const rows = sessionRecords.map(r => [
      `"${r.studentId}"`,
      `"${r.studentName}"`,
      `"${r.program}"`,
      `"${r.yearLevel}"`,
      `"${r.eventName}"`,
      `"${r.date}"`,
      `"${r.timeIn}"`,
      `"${r.timeOut || 'In Session'}"`,
      `"${r.timeOut ? 'Checked Out' : r.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `ubytes_attendance_${activeSession.id}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      
      {/* Sleek Search & Station Mode Bar */}
      <div className="bg-white/95 backdrop-blur rounded-2xl p-2.5 sm:p-3 border border-slate-200 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        
        {/* Mode Selector */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold font-condensed uppercase tracking-wider flex-shrink-0 self-start md:self-auto">
          <span className="text-[10px] text-slate-400 px-2 uppercase font-mono">MODE:</span>
          {activeSession.attendanceMode === 'in_only' ? (
            <span className="px-3 py-1 rounded-lg bg-ubytes-maroon-800 text-white shadow-xs flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-ubytes-amber-400 animate-pulse"></span>
              Time In Only
            </span>
          ) : activeSession.attendanceMode === 'out_only' ? (
            <span className="px-3 py-1 rounded-lg bg-ubytes-maroon-800 text-white shadow-xs flex items-center gap-1.5 font-bold">
              <span className="w-1.5 h-1.5 rounded-full bg-ubytes-amber-400 animate-pulse"></span>
              Time Out Only
            </span>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setStationMode('auto')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                  stationMode === 'auto'
                    ? 'bg-ubytes-maroon-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Auto In/Out
              </button>
              <button
                type="button"
                onClick={() => setStationMode('in')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                  stationMode === 'in'
                    ? 'bg-ubytes-maroon-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Time In
              </button>
              <button
                type="button"
                onClick={() => setStationMode('out')}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer font-bold ${
                  stationMode === 'out'
                    ? 'bg-ubytes-maroon-800 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Time Out
              </button>
            </>
          )}
        </div>

        <form onSubmit={handleManualSubmit} className="flex-1 flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search student name, enter Student ID (e.g. 2023-01492), or tap RFID card..."
              value={manualCodeInput}
              onChange={(e) => setManualCodeInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-ubytes-amber-500 transition-all font-medium"
            />
          </div>
          <button
            type="submit"
            className="btn-subtle active:scale-[0.97] px-4 py-2 text-white rounded-xl font-bold font-condensed tracking-wider uppercase text-xs shadow transition-all flex items-center gap-1.5 flex-shrink-0 cursor-pointer bg-ubytes-maroon-800 hover:bg-ubytes-maroon-900"
          >
            <CreditCard className="w-3.5 h-3.5 text-ubytes-amber-400" />
            <span>
              {activeSession.attendanceMode === 'in_only'
                ? 'Time In'
                : activeSession.attendanceMode === 'out_only'
                ? 'Time Out'
                : stationMode === 'out'
                ? 'Time Out'
                : stationMode === 'in'
                ? 'Time In'
                : 'Tap In / Out'}
            </span>
          </button>
        </form>

        <div className="hidden xl:flex items-center gap-2 text-slate-400 font-condensed text-[11px] border-l border-slate-200 pl-3 flex-shrink-0">
          <span className="w-2 h-2 rounded-full animate-pulse bg-ubytes-amber-500"></span>
          <span>RFID Reader ({stationMode.toUpperCase()})</span>
        </div>
      </div>

      {/* Backdrop for Confirmation Pop-out Mini Tab */}
      {recordToDelete && (
        <div 
          onClick={() => setRecordToDelete(null)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9990] modal-backdrop"
          aria-hidden="true"
        />
      )}

      {/* Mini Tab that Pops Out for Deletion Confirmation */}
      {recordToDelete && (
        <div 
          role="alertdialog"
          aria-labelledby="confirm-delete-title"
          aria-describedby="confirm-delete-desc"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[92vw] max-w-md bg-white rounded-2xl shadow-2xl border-2 border-red-300/90 overflow-hidden mini-tab-popout"
        >
          {/* Tab Header Banner */}
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-ubytes-maroon-900 text-white px-4 py-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </div>
              <h3 id="confirm-delete-title" className="font-condensed font-bold text-xs uppercase tracking-wider text-white">
                Confirm Attendance Removal
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setRecordToDelete(null)}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors btn-subtle cursor-pointer"
              title="Cancel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab Body */}
          <div className="p-4 space-y-3">
            <div>
              <span className="text-[10px] font-condensed uppercase tracking-wider text-slate-400 font-bold block mb-1">
                Target Attendee Record
              </span>
              <div className="flex items-center gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200/80">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-700 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {recordToDelete.studentName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-bold text-xs sm:text-sm text-slate-900 truncate">
                    {recordToDelete.studentName}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] text-slate-500 font-mono">
                    <span>ID: <strong>{recordToDelete.studentId}</strong></span>
                    <span>•</span>
                    <span>{recordToDelete.yearLevel}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Record Details Strip */}
            <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-condensed">
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Time In</span>
                <span className="font-bold text-slate-800">{recordToDelete.timeIn || '—'}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Time Out</span>
                <span className="font-bold text-slate-800">{recordToDelete.timeOut || '—'}</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-50 border border-slate-200">
                <span className="text-slate-400 block text-[9px] uppercase font-bold">Status</span>
                <span className={`font-bold ${recordToDelete.status === 'On-Time' ? 'text-amber-800' : 'text-red-700'}`}>
                  {recordToDelete.status}
                </span>
              </div>
            </div>

            <p id="confirm-delete-desc" className="text-xs text-red-700 bg-red-50/80 border border-red-200/70 p-2.5 rounded-xl leading-relaxed">
              Remove attendance record for <strong>{recordToDelete.studentName}</strong>? The student can scan their RFID tag again later.
            </p>
          </div>

          {/* Tab Footer / Actions */}
          <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-400 font-condensed">
              Press <kbd className="px-1 py-0.5 bg-white border rounded font-mono text-[9px]">Esc</kbd> to cancel
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setRecordToDelete(null)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 shadow-2xs btn-subtle cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 active:scale-[0.97] text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 btn-subtle cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Backdrop & Dialog for Reset / Clear All Session Attendance */}
      {showClearModal && (
        <div 
          onClick={() => setShowClearModal(false)}
          className="fixed inset-0 bg-slate-950/40 backdrop-blur-[2px] z-[9990] modal-backdrop"
          aria-hidden="true"
        />
      )}

      {showClearModal && (
        <div 
          role="alertdialog"
          aria-labelledby="confirm-clear-title"
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-[92vw] max-w-md bg-white rounded-2xl shadow-2xl border-2 border-red-300/90 overflow-hidden mini-tab-popout"
        >
          <div className="bg-gradient-to-r from-red-600 via-red-700 to-ubytes-maroon-900 text-white px-4 py-2.5 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-md bg-white/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              </div>
              <h3 id="confirm-clear-title" className="font-condensed font-bold text-xs uppercase tracking-wider text-white">
                Reset Session Attendance
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowClearModal(false)}
              className="p-1 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors btn-subtle cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <p className="text-xs text-slate-700 leading-relaxed">
              Are you sure you want to clear all <strong>{sessionRecords.length}</strong> attendance records for <strong>{activeSession.title}</strong>?
            </p>
            <p className="text-xs text-amber-800 bg-amber-50 border border-amber-200 p-2.5 rounded-xl font-medium">
              The attendance roster will be empty and ready for fresh scans. Student profiles will not be deleted.
            </p>
          </div>

          <div className="px-4 py-2.5 bg-slate-50/90 border-t border-slate-200/80 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowClearModal(false)}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs border border-slate-200 shadow-2xs btn-subtle cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (onClearSessionAttendance) {
                  onClearSessionAttendance();
                  playSuccessBeep();
                  setDeleteToast('Session attendance has been reset.');
                  setTimeout(() => setDeleteToast(null), 3500);
                }
                setShowClearModal(false);
              }}
              className="px-3.5 py-1.5 bg-red-600 hover:bg-red-700 active:scale-[0.97] text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1.5 btn-subtle cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear Attendance</span>
            </button>
          </div>
        </div>
      )}

      {/* Success Notification Mini Tab */}
      {deleteToast && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[100] bg-slate-900/95 text-white px-4 py-2 rounded-2xl shadow-xl border border-ubytes-amber-500/40 flex items-center gap-2 text-xs font-semibold mini-tab-popout backdrop-blur-sm">
          <CheckCircle2 className="w-4 h-4 text-ubytes-amber-400" />
          <span>{deleteToast}</span>
        </div>
      )}

      {/* Duplicate / Warning Banner */}
      {duplicateAlert && (
        <div className="bg-amber-50 border-2 border-amber-300 text-amber-900 px-4 py-3 rounded-2xl flex items-center justify-between shadow-md animate-new-row">
          <div className="flex items-center gap-2.5 font-bold text-xs">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>{duplicateAlert}</span>
          </div>
          <button onClick={() => setDuplicateAlert(null)} className="text-amber-800 hover:text-amber-950 text-xs font-bold">
            Dismiss
          </button>
        </div>
      )}


      {/* ========================================================================= */}
      {/* CRISP VECTOR SVG BANNER KIOSK: Matches bag-ong boner.svg & frame layout   */}
      {/* ========================================================================= */}
      <div className="relative rounded-3xl shadow-2xl ring-1 ring-black/10 w-full overflow-hidden bg-gradient-to-br from-[#3d050a] via-[#520911] to-[#260306]">
        {/* Proportional Container for Desktop/Laptop */}
        <div 
          className="hidden lg:block relative w-full" 
          style={{ 
            paddingBottom: '48.5%',
            backgroundImage: "url('./official_banner.svg')",
            backgroundSize: '100% 100%',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }}
        >
          
          {/* ======================================================= */}
          {/* ======================================================= */}
          {/* STUDENT PROFILE CARD: Cleanly contained inside card,   */}
          {/* rests comfortably above "UNIVERSITY OF BOHOL"           */}
          {/* ======================================================= */}
          <div 
            className="absolute bg-white rounded-3xl shadow-2xl p-4 sm:p-5 border border-white/90 flex flex-col justify-between overflow-hidden transition-all duration-300 z-20"
            style={{
              left: '5.5%',
              top: '6.5%',
              width: '42.5%',
              height: '55.0%' /* Bottom reaches 61.5%, comfortably above "UNIVERSITY OF BOHOL" at 65.3% */
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-1.5 flex-shrink-0">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ubytes-amber-500"></span>
                <h3 className="font-display tracking-wider text-slate-900 text-xl lg:text-2xl leading-none whitespace-nowrap">
                  STUDENT PROFILE
                </h3>
              </div>
            </div>

            {/* Content Body */}
            {lastScannedStudent ? (
              <div 
                key={lastScannedStudent.id} 
                className="student-scan-animate flex flex-col justify-between flex-1 overflow-hidden py-0.5"
              >
                
                {/* Top Row: Photo + Name & ID */}
                <div className="flex items-center gap-3.5 flex-shrink-0">
                  {/* Photo with Ring */}
                  <div className="relative flex-shrink-0">
                    <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl p-1 bg-gradient-to-tr from-ubytes-amber-500 via-ubytes-gold to-ubytes-maroon-800 shadow-md flex items-center justify-center overflow-hidden">
                      <img
                        src={lastScannedStudent.photo || './default_avatar.jpg'}
                        onError={(e) => { (e.target as HTMLImageElement).src = './default_avatar.jpg'; }}
                        alt={lastScannedStudent.name}
                        className="w-full h-full rounded-2xl object-cover bg-white"
                      />
                    </div>
                    <div className={`absolute -bottom-1 -right-1 p-0.5 rounded-full shadow border-2 border-white text-white ${
                      lastScannedRecord?.status === 'On-Time' ? 'bg-ubytes-amber-500' : 'bg-red-500'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                    </div>
                  </div>

                  {/* Name and ID */}
                  <div className="flex-1 min-w-0 text-left">
                    <h2 className="font-display tracking-wide font-normal text-slate-900 text-xl lg:text-2xl truncate leading-tight">
                      {lastScannedStudent.name.toUpperCase()}
                    </h2>

                    <div className="flex flex-wrap items-center gap-2 mt-1">
                      <span className="font-condensed font-bold text-[11px] text-slate-400 uppercase tracking-wider">ID:</span>
                      <span className="font-mono font-black text-ubytes-maroon-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded-lg text-xs shadow-sm">
                        {lastScannedStudent.id}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-1 text-xs text-slate-600 font-condensed font-semibold truncate">
                      <GraduationCap className="w-3.5 h-3.5 text-ubytes-maroon-800 flex-shrink-0" />
                      <span className="truncate">{lastScannedStudent.program}</span>
                    </div>
                  </div>
                </div>

                {/* Year Level and Role details */}
                <div className="w-full bg-slate-50 rounded-xl px-3 py-1.5 border border-slate-100 flex items-center justify-between my-1 text-xs flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-condensed uppercase tracking-wider">Year:</span>
                    <span className="font-bold text-[#B45309] font-condensed text-xs">
                      {lastScannedStudent.yearLevel}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] text-slate-400 font-condensed uppercase tracking-wider">Role:</span>
                    <span className="font-semibold text-slate-700 text-[11px] bg-white px-2 py-0.5 rounded border border-slate-200">
                      {lastScannedStudent.role}
                    </span>
                  </div>
                </div>

                {/* Bottom Verification Status & Timestamps */}
                <div className="flex items-center justify-between pt-1.5 border-t border-slate-100 flex-shrink-0">
                  {activeSession.attendanceMode === 'out_only' || lastScannedRecord?.timeOut ? (
                    <span className="text-[11px] font-black font-condensed tracking-wider px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 bg-slate-800 text-white">
                      <LogOut className="w-3 h-3" />
                      CHECKED OUT
                    </span>
                  ) : (
                    <span className={`text-[11px] font-black font-condensed tracking-wider px-2.5 py-1 rounded-lg shadow-sm flex items-center gap-1 ${
                      lastScannedRecord?.status === 'On-Time'
                        ? 'bg-ubytes-amber-500 text-ubytes-maroon-950'
                        : 'bg-ubytes-maroon-800 text-white'
                    }`}>
                      <CheckCircle2 className="w-3 h-3" />
                      {lastScannedRecord?.status.toUpperCase() || 'CHECKED IN'}
                    </span>
                  )}

                  <div className="flex items-center gap-2 text-right">
                    {activeSession.attendanceMode !== 'out_only' && (
                      <div className="flex items-center gap-1">
                        <span className="text-[9px] font-condensed font-bold text-slate-400 uppercase tracking-wider">
                          IN:
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                          {lastScannedRecord?.timeIn || '08:15 AM'}
                        </span>
                      </div>
                    )}

                    {activeSession.attendanceMode !== 'in_only' && (
                      lastScannedRecord?.timeOut ? (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-condensed font-bold text-blue-500 uppercase tracking-wider">
                            OUT:
                          </span>
                          <span className="font-mono font-bold text-blue-700 text-xs bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200">
                            {lastScannedRecord.timeOut}
                          </span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] font-condensed font-bold text-slate-400 uppercase tracking-wider">
                            OUT:
                          </span>
                          <span className="font-condensed italic text-[11px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                            Active
                          </span>
                        </div>
                      )
                    )}
                  </div>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 text-center my-auto">
                <div className="w-12 h-12 rounded-full bg-amber-50 border border-ubytes-amber-500 flex items-center justify-center scanner-pulse mb-2 flex-shrink-0">
                  <Wifi className="w-6 h-6 text-ubytes-amber-600 rotate-90" />
                </div>
                <h4 className="font-display tracking-wider text-slate-800 text-xl md:text-2xl leading-none">
                  READY FOR STUDENT TAP
                </h4>
                <p className="text-xs text-slate-400 mt-1">
                  Hold student ID card against the USB RFID reader.
                </p>
              </div>
            )}
          </div>

          {/* LOWER-LEFT AREA: Ends right above "UNIVERSITY OF BOHOL" */}
          {/* Leaves the vector SVG's native logo and text 100% visible and unclipped! */}

          {/* ======================================================= */}
          {/* RIGHT CARD: ATTENDANCE DATABASE (x: 49.0%, y: 6.5%)      */}
          {/* ======================================================= */}
          <div 
            className="absolute bg-white rounded-3xl shadow-2xl p-3.5 sm:p-4 border border-white/90 flex flex-col justify-between overflow-hidden z-20"
            style={{
              left: '49.0%',
              top: '6.5%',
              width: '46.0%',
              height: '87.0%'
            }}
          >
            <div className="flex flex-col flex-1 min-h-0">
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-2 mb-2 flex-shrink-0">
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="font-display tracking-wider text-slate-900 text-2xl lg:text-3xl leading-none">
                      ATTENDANCE DATABASE
                    </h2>
                    <span className="text-[10px] font-condensed bg-slate-100 text-slate-700 font-bold px-2 py-0.5 rounded uppercase tracking-wider border border-slate-200">
                      Real-Time
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5 truncate max-w-xs flex items-center gap-1.5">
                    <span className="truncate">Session: <strong className="text-slate-700">{activeSession.title}</strong></span>
                    {activeSession.attendanceMode === 'in_only' ? (
                      <span className="text-[9px] font-bold text-amber-900 bg-amber-50 border border-amber-200 px-1.5 py-0.2 rounded uppercase flex-shrink-0">
                        In Only
                      </span>
                    ) : activeSession.attendanceMode === 'out_only' ? (
                      <span className="text-[9px] font-bold text-ubytes-maroon-800 bg-red-50 border border-red-200 px-1.5 py-0.2 rounded uppercase flex-shrink-0">
                        Out Only
                      </span>
                    ) : null}
                  </p>
                </div>

                {/* Counters */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {activeSession.attendanceMode === 'in_only' ? (
                    <div className="text-center px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-lg">
                      <span className="text-[9px] font-condensed font-bold text-amber-700 uppercase block">Checked In</span>
                      <span className="font-display text-base lg:text-lg text-amber-900 leading-none">{sessionRecords.length}</span>
                    </div>
                  ) : activeSession.attendanceMode === 'out_only' ? (
                    <div className="text-center px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg">
                      <span className="text-[9px] font-condensed font-bold text-slate-600 uppercase block">Timed Out</span>
                      <span className="font-display text-base lg:text-lg text-slate-800 leading-none">{timedOutCount}</span>
                    </div>
                  ) : (
                    <>
                      <div className="text-center px-2 py-0.5 bg-amber-50 border border-amber-200 rounded-lg">
                        <span className="text-[9px] font-condensed font-bold text-amber-700 uppercase block">In-Session</span>
                        <span className="font-display text-base lg:text-lg text-amber-900 leading-none">{inSessionCount}</span>
                      </div>

                      <div className="text-center px-2 py-0.5 bg-slate-100 border border-slate-200 rounded-lg">
                        <span className="text-[9px] font-condensed font-bold text-slate-600 uppercase block">Timed Out</span>
                        <span className="font-display text-base lg:text-lg text-slate-800 leading-none">{timedOutCount}</span>
                      </div>
                    </>
                  )}

                  <div className="text-center px-2 py-0.5 bg-red-50 border border-red-200 rounded-lg">
                    <span className="text-[9px] font-condensed font-bold text-ubytes-maroon-800 uppercase block">Total</span>
                    <span className="font-display text-base lg:text-lg text-ubytes-maroon-800 leading-none">{sessionRecords.length}</span>
                  </div>
                </div>
              </div>

              {/* Search & Export */}
              <div className="flex items-center gap-2 mb-2 px-0.5 flex-shrink-0">
                <div className="relative flex-1 min-w-0">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search by name, student ID or year..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ubytes-amber-500 transition-all h-8"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="btn-subtle active:scale-[0.96] px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200/80 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs font-condensed uppercase tracking-wider flex-shrink-0 cursor-pointer h-8"
                  title="Export Attendance to CSV"
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  <span>CSV</span>
                </button>

                {onClearSessionAttendance && sessionRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    className="btn-subtle active:scale-[0.96] px-3 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-xs font-condensed uppercase tracking-wider flex-shrink-0 cursor-pointer h-8"
                    title="Reset/Clear attendance records for this event"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-red-600" />
                    <span>Reset</span>
                  </button>
                )}
              </div>

              {/* Scrollable Table */}
              <div className="overflow-y-auto overflow-x-auto flex-1 min-h-0 rounded-xl border border-slate-100 shadow-2xs bg-white">
                <table className="w-full text-xs text-slate-600 table-fixed min-w-[560px]">
                  <colgroup>
                    <col style={{ width: '15%' }} />
                    <col style={{ width: '29%' }} />
                    <col style={{ width: '8%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '16%' }} />
                    <col style={{ width: '13%' }} />
                    <col style={{ width: '6%' }} />
                  </colgroup>
                  <thead className="bg-slate-50 sticky top-0 text-[10px] font-condensed font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200 shadow-2xs z-10">
                    <tr>
                      <th className="py-2 pl-3.5 pr-2 text-left whitespace-nowrap">Student ID</th>
                      <th className="py-2 pl-3 pr-2 text-left whitespace-nowrap">Student Name</th>
                      <th className="py-2 px-1 text-center whitespace-nowrap">Year</th>
                      <th className="py-2 px-1 text-center whitespace-nowrap">Time In</th>
                      <th className="py-2 px-2 text-center whitespace-nowrap">Time Out</th>
                      <th className="py-2 px-2 text-center whitespace-nowrap">Status</th>
                      <th className="py-2 px-1 text-center whitespace-nowrap"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {filteredRecords.length > 0 ? (
                      filteredRecords.map((row, index) => (
                        <tr
                          key={row.id}
                          className={`relative group transition-colors duration-150 ${
                            recordToDelete?.id === row.id
                              ? 'bg-red-50/90 ring-2 ring-red-400'
                              : index === 0 ? 'new-row-highlight' : 'hover:bg-amber-50/50'
                          }`}
                        >
                          {/* Student ID - Left-aligned with consistent indent */}
                          <td className="py-2 pl-3.5 pr-2 font-mono font-bold text-slate-900 text-xs text-left align-middle whitespace-nowrap">
                            {row.studentId}
                          </td>

                          {/* Student Name - Left-aligned with vertically aligned avatars & names */}
                          <td className="py-2 pl-3 pr-2 align-middle text-left whitespace-nowrap">
                            <div className="flex items-center justify-start gap-2 min-w-0">
                              <img
                                src={row.photo || './default_avatar.jpg'}
                                onError={(e) => { (e.target as HTMLImageElement).src = './default_avatar.jpg'; }}
                                alt=""
                                className="w-5 h-5 rounded-full object-cover border border-slate-200 flex-shrink-0 bg-slate-100 shadow-2xs"
                              />
                              <span className="font-semibold text-slate-800 text-xs truncate max-w-full text-left" title={row.studentName}>
                                {row.studentName}
                              </span>
                            </div>
                          </td>

                          {/* Year Level - Centered Pill */}
                          <td className="py-2 px-1 text-center align-middle whitespace-nowrap">
                            <span className="inline-flex items-center justify-center min-w-[56px] text-[10px] font-condensed font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200/80 whitespace-nowrap">
                              {row.yearLevel}
                            </span>
                          </td>

                          {/* Time In - Centered */}
                          <td className="py-2 px-1 font-mono text-[11px] text-slate-700 font-medium text-center align-middle whitespace-nowrap tabular-nums">
                            {activeSession.attendanceMode === 'out_only' ? (row.timeIn || '—') : row.timeIn}
                          </td>

                          {/* Time Out - Centered with generous margin */}
                          <td className="py-2 px-2 font-mono text-[11px] text-center align-middle whitespace-nowrap tabular-nums">
                            {activeSession.attendanceMode === 'in_only' ? (
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-400 bg-slate-50 border border-slate-200/60 min-w-[54px]">
                                —
                              </span>
                            ) : row.timeOut ? (
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-bold text-slate-700 bg-slate-100 border border-slate-200 whitespace-nowrap min-w-[62px]">
                                {row.timeOut}
                              </span>
                            ) : (
                              <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] gap-1 text-slate-600 bg-slate-100 border border-slate-200/90 italic whitespace-nowrap min-w-[62px]">
                                <span className="w-1.5 h-1.5 rounded-full bg-ubytes-amber-500 animate-pulse"></span>
                                In Session
                              </span>
                            )}
                          </td>

                          {/* Status - Centered Pill Badge */}
                          <td className="py-2 px-1 text-center align-middle whitespace-nowrap">
                            <div className="flex items-center justify-center">
                              {activeSession.attendanceMode === 'out_only' || row.timeOut ? (
                                <span className="inline-flex items-center justify-center min-w-[56px] px-2 py-0.5 rounded-md text-[10px] font-black font-condensed uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs whitespace-nowrap">
                                  CHECKED OUT
                                </span>
                              ) : (
                                <span className={`inline-flex items-center justify-center min-w-[46px] px-2 py-0.5 rounded-md text-[10px] font-black font-condensed uppercase tracking-wider shadow-2xs whitespace-nowrap ${
                                  row.status === 'On-Time'
                                    ? 'bg-amber-50 text-amber-900 border border-amber-200'
                                    : 'bg-red-50 text-red-800 border border-red-200'
                                }`}>
                                  {row.status}
                                </span>
                              )}
                            </div>
                          </td>

                          {/* Action - Dedicated Delete Button Column (Never overlaps Status badge) */}
                          <td className="py-2 px-1 text-center align-middle whitespace-nowrap">
                            {onDeleteAttendanceRecord && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  playWarningBeep();
                                  setRecordToDelete(row);
                                }}
                                className={`inline-flex items-center justify-center transition-all duration-150 p-1 rounded-md border cursor-pointer ${
                                  recordToDelete?.id === row.id
                                    ? 'opacity-100 text-red-700 bg-red-100 border-red-300 ring-2 ring-red-400 shadow-xs'
                                    : 'opacity-0 group-hover:opacity-100 text-slate-400 hover:text-red-600 hover:bg-red-50 bg-white border-slate-200 shadow-2xs'
                                }`}
                                title={`Delete attendance record for ${row.studentName}`}
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 text-xs">
                          No students recorded yet. Tap an RFID card to check in.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <div className="pt-2 mt-1 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400 font-condensed flex-shrink-0">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-ubytes-amber-500"></span>
                Listening to USB RFID reader
              </span>
              <span>Showing <strong>{filteredRecords.length}</strong> of <strong>{sessionRecords.length}</strong></span>
            </div>
          </div>

        </div>

        {/* Mobile / Tablet Responsive Fallback */}
        <div className="lg:hidden p-3 sm:p-5 space-y-4">
          <div className="bg-white rounded-2xl p-4 shadow-xl border border-white/80">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ubytes-amber-500"></span>
                <h3 className="font-display tracking-wider text-slate-900 text-lg sm:text-xl">STUDENT PROFILE</h3>
              </div>
            </div>

            {lastScannedStudent ? (
              <div className="space-y-3 text-xs">
                <div className="flex items-center gap-3">
                  <img 
                    src={lastScannedStudent.photo || './default_avatar.jpg'} 
                    onError={(e) => { (e.target as HTMLImageElement).src = './default_avatar.jpg'; }}
                    alt="" 
                    className="w-16 h-16 rounded-2xl object-cover bg-slate-100 ring-2 ring-ubytes-amber-400/80 shadow flex-shrink-0" 
                  />
                  <div className="min-w-0 flex-1">
                    <h4 className="font-display text-lg text-slate-900 truncate leading-tight">{lastScannedStudent.name}</h4>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-ubytes-maroon-800 font-bold text-xs bg-red-50 border border-red-200 px-1.5 py-0.5 rounded">
                        {lastScannedStudent.id}
                      </span>
                      <span className="text-[11px] font-condensed text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                        {lastScannedStudent.yearLevel}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 font-medium truncate mt-0.5">
                      {lastScannedStudent.program}
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="font-semibold text-slate-600 text-[11px] bg-slate-50 px-2 py-0.5 rounded border border-slate-200">
                    {lastScannedStudent.role}
                  </span>
                  <div>
                    {lastScannedRecord?.timeOut ? (
                      <span className="text-slate-700 font-bold bg-slate-100 border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                        Checked Out
                      </span>
                    ) : (
                      <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        lastScannedRecord?.status === 'On-Time' 
                          ? 'text-amber-900 bg-amber-50 border border-amber-200' 
                          : 'text-red-800 bg-red-50 border border-red-200'
                      }`}>
                        {lastScannedRecord?.status || 'On-Time'}
                      </span>
                    )}
                  </div>
                </div>

                {lastScannedRecord && (
                  <div className="flex justify-between text-[11px] font-mono text-slate-600 bg-slate-50 px-2.5 py-1.5 rounded-xl border border-slate-200">
                    <span>Time In: <strong className="text-slate-900">{lastScannedRecord.timeIn}</strong></span>
                    <span>Time Out: <strong className="text-slate-900">{lastScannedRecord.timeOut || 'In Session'}</strong></span>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 py-3 text-center">Ready for RFID scan... Tap a card or search above.</p>
            )}
          </div>

          <div className="bg-white rounded-2xl p-4 shadow-xl border border-white/80">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ubytes-maroon-800"></span>
                <h3 className="font-display tracking-wider text-slate-900 text-lg sm:text-xl">ATTENDANCE DATABASE</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleExportCSV}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold font-condensed uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                  title="Export to CSV"
                >
                  <Download className="w-3 h-3" />
                  <span>CSV</span>
                </button>
                {onClearSessionAttendance && sessionRecords.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClearModal(true)}
                    className="px-2 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-xs font-bold font-condensed uppercase tracking-wider flex items-center gap-1 cursor-pointer"
                    title="Reset Session Attendance"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Reset</span>
                  </button>
                )}
              </div>
            </div>
            <div className="overflow-x-auto max-h-72">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-200">
                  <tr>
                    <th className="p-2 pl-3 text-left whitespace-nowrap">Student ID</th>
                    <th className="p-2 pl-2 text-left whitespace-nowrap">Student Name</th>
                    <th className="p-2 text-center whitespace-nowrap">Time In</th>
                    <th className="p-2 text-center whitespace-nowrap">Time Out</th>
                    <th className="p-2 text-center whitespace-nowrap">Status</th>
                    <th className="p-2 text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRecords.map(r => (
                    <tr key={r.id}>
                      <td className="p-2 pl-3 font-mono font-bold text-slate-900 text-left whitespace-nowrap">{r.studentId}</td>
                      <td className="p-2 pl-2 text-left whitespace-nowrap font-medium text-slate-800">{r.studentName}</td>
                      <td className="p-2 font-mono text-center whitespace-nowrap tabular-nums">
                        {activeSession.attendanceMode === 'out_only' ? (r.timeIn || '—') : r.timeIn}
                      </td>
                      <td className="p-2 font-mono text-xs text-center whitespace-nowrap">
                        {activeSession.attendanceMode === 'in_only' ? (
                          <span className="inline-flex items-center justify-center min-w-[64px] text-slate-400 bg-slate-50 border border-slate-200 px-1.5 py-0.5 rounded-md text-[10px]">
                            —
                          </span>
                        ) : r.timeOut ? (
                          <span className="inline-flex items-center justify-center min-w-[64px] text-slate-700 font-bold bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md text-[10px]">
                            {r.timeOut}
                          </span>
                        ) : (
                          <span className="inline-flex items-center justify-center min-w-[64px] text-slate-600 italic text-[10px] bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                            In Session
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center whitespace-nowrap">
                        {activeSession.attendanceMode === 'out_only' || r.timeOut ? (
                          <span className="inline-flex items-center justify-center min-w-[60px] px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                            CHECKED OUT
                          </span>
                        ) : (
                          <span className={`inline-flex items-center justify-center min-w-[54px] px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            r.status === 'On-Time' ? 'bg-amber-50 text-amber-900 border border-amber-200' : 'bg-red-50 text-red-800 border border-red-200'
                          }`}>
                            {r.status}
                          </span>
                        )}
                      </td>
                      <td className="p-2 text-center">
                        {onDeleteAttendanceRecord && (
                          <button
                            type="button"
                            onClick={() => {
                              playWarningBeep();
                              setRecordToDelete(r);
                            }}
                            className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 cursor-pointer"
                            title={`Delete attendance record for ${r.studentName}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
