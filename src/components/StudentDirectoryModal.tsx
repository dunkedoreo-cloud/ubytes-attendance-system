import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Student, YearLevel } from '../types';
import { 
  X, Search, Plus, UserPlus, CreditCard, GraduationCap, 
  Check, Edit2, Trash2, AlertTriangle, Upload, Camera, ImagePlus,
  Radio, CheckCircle2, AlertCircle, Scan, Sparkles, RefreshCw
} from 'lucide-react';
import { useRfidListener } from '../hooks/useRfidListener';
import { playSuccessBeep, playWarningBeep } from '../utils/soundEffects';

interface StudentDirectoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  onAddStudent: (student: Student) => void;
  onUpdateStudent: (student: Student) => void;
  onDeleteStudent: (studentId: string) => void;
  onSimulateTap: (studentId: string) => void;
}

interface ScanFeedback {
  uid: string;
  type: 'success' | 'warning' | 'info';
  message: string;
  studentName?: string;
}

const DEFAULT_STUDENT_PHOTO = './default_avatar.jpg';

export const StudentDirectoryModal: React.FC<StudentDirectoryModalProps> = ({
  isOpen,
  onClose,
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onSimulateTap
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [showAddForm, setShowAddForm] = useState(false);

  // Real-time RFID scanner feedback & errors
  const [scanFeedback, setScanFeedback] = useState<ScanFeedback | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [editError, setEditError] = useState<string | null>(null);

  // New Student Form State
  const newIdInputRef = useRef<HTMLInputElement>(null);
  const [newId, setNewId] = useState('');
  const [newRfid, setNewRfid] = useState('');
  const [newName, setNewName] = useState('');
  const [newYear, setNewYear] = useState<YearLevel>('1st Year');
  const [newRole, setNewRole] = useState('Active Member');
  const [newPhoto, setNewPhoto] = useState(DEFAULT_STUDENT_PHOTO);

  // Edit Student State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editName, setEditName] = useState('');
  const [editRfid, setEditRfid] = useState('');
  const [editYear, setEditYear] = useState<YearLevel>('1st Year');
  const [editRole, setEditRole] = useState('');
  const [editPhoto, setEditPhoto] = useState('');

  // Delete Confirmation State
  const [studentToDelete, setStudentToDelete] = useState<Student | null>(null);

  // Auto-dismiss scanner feedback banner after 6 seconds
  useEffect(() => {
    if (!scanFeedback) return;
    const timer = setTimeout(() => {
      setScanFeedback(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [scanFeedback]);

  // Hardware USB RFID Scanner Listener for Student Directory
  const handleModalRfidScan = useCallback((scannedUid: string) => {
    const trimmed = scannedUid.trim();
    if (!trimmed) return;

    console.log('[handleModalRfidScan] Scanned:', trimmed, 'editingStudent:', editingStudent?.name, 'showAddForm:', showAddForm);
    playSuccessBeep();

    // Check if this card UID is already registered in the directory
    const existing = students.find(
      s => s.rfidUid.toLowerCase() === trimmed.toLowerCase()
    );

    if (editingStudent) {
      // Form: Edit Student is open -> Extract card into edit field
      setEditRfid(trimmed);
      setEditError(null);

      if (existing && existing.id !== editingStudent.id) {
        setScanFeedback({
          uid: trimmed,
          type: 'warning',
          message: `Hardware Card Scanned: UID "${trimmed}" is already assigned to ${existing.name} (${existing.id}). Saving will transfer this card to ${editingStudent.name}.`,
          studentName: existing.name
        });
      } else {
        setScanFeedback({
          uid: trimmed,
          type: 'success',
          message: `Hardware Card Extracted: UID "${trimmed}" captured from USB scanner for ${editingStudent.name}. Click "Save Changes" to apply.`
        });
      }
    } else if (showAddForm) {
      // Form: Register New Student is open -> Extract card into new student field
      setNewRfid(trimmed);
      setFormError(null);

      if (existing) {
        setScanFeedback({
          uid: trimmed,
          type: 'warning',
          message: `Hardware Card Scanned: UID "${trimmed}" is already registered to ${existing.name} (${existing.id}).`,
          studentName: existing.name
        });
      } else {
        setScanFeedback({
          uid: trimmed,
          type: 'success',
          message: `Hardware Card Extracted: UID "${trimmed}" captured from USB scanner! Ready to save student.`
        });
      }
    } else {
      // Neither form is open (viewing directory)
      if (existing) {
        // Identified student in directory
        setSearchQuery(trimmed);
        setScanFeedback({
          uid: trimmed,
          type: 'info',
          message: `Card Scanned: Identified registered student ${existing.name} (${existing.id}). Filter applied.`,
          studentName: existing.name
        });
      } else {
        // Unregistered card: auto-open registration form with this card extracted!
        setShowAddForm(true);
        setNewRfid(trimmed);
        setEditingStudent(null);
        setFormError(null);
        setScanFeedback({
          uid: trimmed,
          type: 'success',
          message: `New Unregistered Card Detected: UID "${trimmed}" extracted. Enter student details to complete registration.`
        });
      }
    }
  }, [students, editingStudent, showAddForm]);

  useRfidListener({
    onScan: handleModalRfidScan,
    enabled: isOpen
  });

  if (!isOpen) return null;

  const handleNewPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setNewPhoto(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleEditPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === 'string') {
        setEditPhoto(event.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const filteredStudents = students.filter(s => {
    const matchesSearch = 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.rfidUid.includes(searchQuery);
    const matchesYear = selectedYear === 'all' || s.yearLevel === selectedYear;
    return matchesSearch && matchesYear;
  });

  const handleSaveStudent = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const trimmedId = newId.trim();
    const trimmedName = newName.trim();
    const trimmedRfid = newRfid.trim();

    if (!trimmedId || !trimmedName) {
      setFormError('Please enter both the Student ID and Full Name.');
      playWarningBeep();
      return;
    }

    // Duplicate Student ID check
    if (students.some(s => s.id.toLowerCase() === trimmedId.toLowerCase())) {
      setFormError(`Student ID "${trimmedId}" is already registered in the directory.`);
      playWarningBeep();
      return;
    }

    // Duplicate RFID UID check (only if an RFID was scanned/entered)
    if (trimmedRfid) {
      const duplicateRfid = students.find(s => s.rfidUid && s.rfidUid.toLowerCase() === trimmedRfid.toLowerCase());
      if (duplicateRfid) {
        setFormError(`This RFID card (${trimmedRfid}) is already registered to ${duplicateRfid.name} (${duplicateRfid.id}). Each student must have a unique physical card.`);
        playWarningBeep();
        return;
      }
    }

    const student: Student = {
      id: trimmedId,
      rfidUid: trimmedRfid || '', // Saved cleanly as empty if not yet scanned!
      name: trimmedName,
      program: 'BS Computer Science',
      yearLevel: newYear,
      role: newRole.trim() || 'Active Member',
      photo: newPhoto || DEFAULT_STUDENT_PHOTO,
      email: `${trimmedId.toLowerCase().replace(/[^a-z0-9]/g, '')}@ub.edu.ph`
    };

    onAddStudent(student);
    // Continuously add members without exiting the form
    // Reset form fields for the next member
    setNewId('');
    setNewRfid('');
    setNewName('');
    setNewPhoto(DEFAULT_STUDENT_PHOTO);
    setFormError(null);
    setScanFeedback({
      uid: student.rfidUid,
      type: 'success',
      message: trimmedRfid
        ? `✓ Registered ${student.name} (${student.id})! Ready to add next member.`
        : `✓ Registered ${student.name} (${student.id})! Ready to add next member (card will pair on tap).`
    });

    // Re-focus the Student ID field immediately for rapid entry
    setTimeout(() => {
      newIdInputRef.current?.focus();
    }, 50);
  };

  const startEditStudent = (student: Student) => {
    setEditingStudent(student);
    setEditName(student.name);
    setEditRfid(student.rfidUid || '');
    setEditYear(student.yearLevel);
    setEditRole(student.role);
    setEditPhoto(student.photo);
    setShowAddForm(false);
    setStudentToDelete(null);
    setEditError(null);
    setScanFeedback({
      uid: student.rfidUid,
      type: 'info',
      message: student.rfidUid
        ? `Editing ${student.name}. Tap a new card on the USB RFID Scanner to re-pair.`
        : `Editing ${student.name}. Card is currently unpaired; tap card to bind now or during attendance.`
    });
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    setEditError(null);

    if (!editingStudent || !editName.trim()) return;

    const trimmedRfid = editRfid.trim();

    // Check duplicate RFID against other students (if specified)
    if (trimmedRfid) {
      const duplicate = students.find(
        s => s.rfidUid && s.rfidUid.toLowerCase() === trimmedRfid.toLowerCase() && s.id !== editingStudent.id
      );
      if (duplicate) {
        setEditError(`This RFID card (${trimmedRfid}) is already assigned to ${duplicate.name} (${duplicate.id}). Each student must have a unique card.`);
        playWarningBeep();
        return;
      }
    }

    const updated: Student = {
      ...editingStudent,
      name: editName.trim(),
      rfidUid: trimmedRfid || '',
      yearLevel: editYear,
      role: editRole.trim() || editingStudent.role,
      photo: editPhoto || editingStudent.photo,
    };

    onUpdateStudent(updated);
    setEditingStudent(null);
    setEditError(null);
    setScanFeedback({
      uid: updated.rfidUid,
      type: 'success',
      message: updated.rfidUid
        ? `✓ Successfully updated ${updated.name} (RFID UID: ${updated.rfidUid})!`
        : `✓ Successfully updated ${updated.name} (Unpaired - will pair on attendance tap)!`
    });
  };

  const confirmDelete = () => {
    if (!studentToDelete) return;
    onDeleteStudent(studentToDelete.id);
    setStudentToDelete(null);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] modal-content">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-ubytes-maroon-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ubytes-amber-500 text-ubytes-maroon-950 flex items-center justify-center font-bold">
              <GraduationCap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white uppercase tracking-wider">
                STUDENT DIRECTORY
              </h2>
              <p className="text-xs text-amber-200/80">
                Young Thinkers Society • Total Registered: {students.length} Students
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Live Hardware Scanner Status Indicator */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-xs text-emerald-300 shadow-sm" title="USB RFID Reader is active and listening for card tap">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-semibold tracking-wide">USB RFID Scanner Active</span>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center btn-subtle"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 flex-1 overflow-y-auto space-y-4">

          {/* Real-time Hardware RFID Scanner Feedback Banner */}
          {scanFeedback && (
            <div 
              className={`p-3.5 rounded-2xl flex items-center justify-between gap-3 animate-new-row shadow-sm border ${
                scanFeedback.type === 'warning'
                  ? 'bg-amber-50 border-amber-300 text-amber-900'
                  : scanFeedback.type === 'info'
                  ? 'bg-blue-50 border-blue-300 text-blue-900'
                  : 'bg-emerald-50 border-emerald-300 text-emerald-900'
              }`}
            >
              <div className="flex items-center gap-2.5 text-xs">
                {scanFeedback.type === 'warning' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                ) : scanFeedback.type === 'info' ? (
                  <Radio className="w-4 h-4 text-blue-600 flex-shrink-0 animate-pulse" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                )}
                <div className="font-medium">
                  {scanFeedback.message}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setScanFeedback(null)}
                className="p-1 hover:bg-black/5 rounded-lg text-slate-500 flex-shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-1 max-w-md">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student by name, student ID, or RFID UID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-ubytes-amber-500 focus:outline-none"
                />
              </div>

              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
              >
                <option value="all">All Year Levels</option>
                <option value="1st Year">1st Year</option>
                <option value="2nd Year">2nd Year</option>
                <option value="3rd Year">3rd Year</option>
                <option value="4th Year">4th Year</option>
              </select>
            </div>

            <button
              onClick={() => {
                setShowAddForm(!showAddForm);
                setEditingStudent(null);
                setStudentToDelete(null);
              }}
              className={`px-3.5 py-2 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm btn-subtle ${
                showAddForm
                  ? 'bg-slate-700 hover:bg-slate-800'
                  : 'bg-ubytes-maroon-800 hover:bg-ubytes-maroon-900'
              }`}
            >
              {showAddForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {showAddForm ? 'Exit' : 'Register New Student'}
            </button>
          </div>

          {/* Delete Confirmation Banner */}
          {studentToDelete && (
            <div className="p-4 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-between gap-4 animate-new-row shadow-sm">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-xs text-red-900 uppercase tracking-wider">
                    Confirm Student Deletion
                  </h4>
                  <p className="text-xs text-red-700">
                    Are you sure you want to remove <strong className="font-bold">{studentToDelete.name}</strong> ({studentToDelete.id}) from the official directory?
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setStudentToDelete(null)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs btn-subtle"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={confirmDelete}
                  className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs shadow-sm flex items-center gap-1 btn-subtle"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          )}

          {/* Edit Student Form */}
          {editingStudent && (
            <form onSubmit={handleSaveEdit} className="p-4 bg-blue-50/80 border border-blue-200 rounded-2xl space-y-3 animate-new-row shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Edit2 className="w-4 h-4 text-blue-700" />
                  Edit Student Information: <span className="font-mono text-blue-800">{editingStudent.id}</span>
                </h4>
                <button 
                  type="button" 
                  onClick={() => setEditingStudent(null)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Edit Form Error Banner */}
              {editError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 animate-new-row">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="font-semibold">{editError}</span>
                </div>
              )}

              {/* Active Scanner Status Pill */}
              <div className="p-2.5 bg-white/90 border border-blue-200 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-blue-900 font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                  </span>
                  <span>USB RFID Scanner Active</span>
                </div>
                <span className="text-[11px] text-blue-700 bg-blue-100/80 px-2 py-0.5 rounded-lg border border-blue-200 font-medium">
                  Tap physical ID card on USB reader to replace RFID UID
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2 border-b border-blue-200/60">
                <label className="relative group cursor-pointer w-14 h-14 rounded-full overflow-hidden border-2 border-blue-400 flex-shrink-0 shadow-sm bg-slate-100" title="Click to upload new photo from gallery">
                  <img 
                    src={editPhoto || editingStudent.photo || DEFAULT_STUDENT_PHOTO} 
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_STUDENT_PHOTO; }}
                    alt="" 
                    className="w-full h-full object-cover group-hover:brightness-90 transition-all" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Camera className="w-4 h-4" />
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleEditPhotoUpload} />
                </label>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label
                      className="flex items-center gap-1.5 text-xs font-bold text-blue-800 bg-white hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg cursor-pointer transition-all btn-subtle shadow-sm"
                      title="Upload photo from device gallery"
                    >
                      <Upload className="w-3.5 h-3.5 text-blue-600" />
                      <span>Upload Photo from Gallery</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleEditPhotoUpload} />
                    </label>
                    <span className="text-[11px] text-slate-500">Supports JPG, PNG, WEBP</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 font-semibold flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-blue-800" />
                      <span>RFID UID (Optional)</span>
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded-full border border-blue-300">
                      {editRfid ? 'Linked' : 'Links on Tap'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      data-rfid-input="true"
                      placeholder="Optional: Auto-links when student taps ID at attendance"
                      value={editRfid}
                      onChange={(e) => setEditRfid(e.target.value)}
                      className="w-full pl-3 pr-24 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-mono font-bold tracking-wider text-blue-950 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {editRfid && editRfid !== editingStudent.rfidUid ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-blue-300">
                          <Check className="w-3 h-3 text-blue-600" /> Re-linked
                        </span>
                      ) : editRfid ? (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Check className="w-3 h-3 text-emerald-600" /> Linked
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded">
                          Unpaired
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Leave blank if unknown. Student will simply tap card at the kiosk during attendance to link automatically.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Year Level</label>
                  <select
                    value={editYear}
                    onChange={(e) => setEditYear(e.target.value as YearLevel)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Organization Role</label>
                  <input
                    type="text"
                    value={editRole}
                    onChange={(e) => setEditRole(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-lg text-xs btn-subtle"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1.5 btn-subtle"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          )}

          {/* Add Student Form */}
          {showAddForm && (
            <form onSubmit={handleSaveStudent} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-3 animate-new-row shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-ubytes-maroon-800" />
                  Register New Student
                </h4>
              </div>

              {/* Add Form Error Banner */}
              {formError && (
                <div className="p-2.5 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-center gap-2 animate-new-row">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              {/* Active Scanner Status Pill */}
              <div className="p-2.5 bg-emerald-50/90 border border-emerald-300 rounded-xl flex flex-wrap items-center justify-between gap-2 shadow-xs">
                <div className="flex items-center gap-2 text-xs text-emerald-900 font-semibold">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
                  </span>
                  <span>USB RFID Scanner Active</span>
                </div>
                <span className="text-[11px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-300 font-medium">
                  Tap student ID card on USB reader to extract UID
                </span>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-2 border-b border-slate-200">
                <label className="relative group cursor-pointer w-14 h-14 rounded-full overflow-hidden border-2 border-dashed border-ubytes-amber-500 flex-shrink-0 flex items-center justify-center bg-slate-100 shadow-sm" title="Click to upload student photo from gallery">
                  <img 
                    src={newPhoto || DEFAULT_STUDENT_PHOTO} 
                    onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_STUDENT_PHOTO; }}
                    alt="" 
                    className="w-full h-full object-cover group-hover:brightness-90 transition-all" 
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity">
                    <Camera className="w-4 h-4" />
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={handleNewPhotoUpload} />
                </label>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <label
                      className="flex items-center gap-1.5 text-xs font-bold text-ubytes-maroon-900 bg-white hover:bg-amber-100 border border-amber-300 px-3 py-1.5 rounded-lg cursor-pointer transition-all btn-subtle shadow-sm"
                      title="Upload student photo from device gallery"
                    >
                      <Upload className="w-3.5 h-3.5 text-amber-600" />
                      <span>Upload Photo from Gallery</span>
                      <input type="file" accept="image/*" className="hidden" onChange={handleNewPhotoUpload} />
                    </label>
                    <span className="text-[11px] text-slate-500">Student 1x1 or ID photo</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Student ID *</label>
                  <input
                    ref={newIdInputRef}
                    type="text"
                    required
                    placeholder="e.g. 2024-0512"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-slate-600 font-semibold flex items-center gap-1">
                      <CreditCard className="w-3.5 h-3.5 text-ubytes-maroon-800" />
                      <span>RFID UID (Optional)</span>
                    </label>
                    <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded-full border border-amber-300">
                      {newRfid ? 'Scanned' : 'Links on Tap'}
                    </span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      data-rfid-input="true"
                      placeholder="Optional: Auto-links when student taps ID at attendance"
                      value={newRfid}
                      onChange={(e) => setNewRfid(e.target.value)}
                      className={`w-full pl-3 pr-24 py-1.5 bg-white border rounded-lg text-xs font-mono font-bold tracking-wider transition-all focus:outline-none ${
                        newRfid 
                          ? 'border-emerald-400 bg-emerald-50/40 text-emerald-950 ring-2 ring-emerald-400/30' 
                          : 'border-slate-300 text-slate-700 focus:ring-2 focus:ring-ubytes-amber-500'
                      }`}
                    />
                    <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {newRfid ? (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-0.5 border border-emerald-300">
                          <Check className="w-3 h-3 text-emerald-600" /> Scanned
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          Optional
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Leave blank if unknown. Student will simply tap card at the kiosk during attendance to link automatically.
                  </p>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan P. Dela Cruz"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Year Level</label>
                  <select
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value as YearLevel)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  >
                    <option value="1st Year">1st Year</option>
                    <option value="2nd Year">2nd Year</option>
                    <option value="3rd Year">3rd Year</option>
                    <option value="4th Year">4th Year</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-600 font-semibold mb-1">Organization Role</label>
                  <input
                    type="text"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-ubytes-amber-500 hover:bg-ubytes-amber-600 text-ubytes-maroon-950 font-bold rounded-lg text-xs shadow-sm btn-subtle"
                >
                  Save & Register
                </button>
              </div>
            </form>
          )}

          {/* Student Roster Table */}
          <div className="overflow-x-auto rounded-2xl border border-slate-100 max-h-[400px]">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 sticky top-0 text-[11px] font-bold text-slate-500 uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Student ID</th>
                  <th className="py-2.5 px-3">RFID UID</th>
                  <th className="py-2.5 px-3">Full Name</th>
                  <th className="py-2.5 px-3">Year</th>
                  <th className="py-2.5 px-3">Role</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredStudents.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 font-mono font-bold text-ubytes-maroon-800">
                      {s.id}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px]">
                      {s.rfidUid && s.rfidUid.trim() ? (
                        <span className="text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded font-bold font-mono">
                          {s.rfidUid}
                        </span>
                      ) : (
                        <span className="text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse"></span>
                          Unpaired (Links on tap)
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-2">
                      <img 
                        src={s.photo || DEFAULT_STUDENT_PHOTO} 
                        onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_STUDENT_PHOTO; }}
                        alt="" 
                        className="w-6 h-6 rounded-full object-cover border border-slate-200 bg-slate-100 flex-shrink-0" 
                      />
                      <span>{s.name}</span>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {s.yearLevel}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {s.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => {
                            onSimulateTap(s.id);
                            onClose();
                          }}
                          className="px-2.5 py-1 bg-amber-50 hover:bg-ubytes-amber-500 hover:text-white text-ubytes-maroon-800 font-bold rounded-lg border border-amber-200 text-[11px] btn-subtle"
                          title="Simulate Card Tap"
                        >
                          Tap ID
                        </button>
                        
                        <button
                          onClick={() => startEditStudent(s)}
                          className="p-1.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 rounded-lg transition-colors btn-subtle"
                          title="Edit Student Information"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          onClick={() => setStudentToDelete(s)}
                          className="p-1.5 bg-slate-100 hover:bg-red-50 hover:text-red-600 text-slate-600 rounded-lg transition-colors btn-subtle"
                          title="Delete Student"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>

      </div>
    </div>
  );
};
