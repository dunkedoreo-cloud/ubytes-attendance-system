import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Student, EventSession } from '../types';
import { X, Search, CreditCard, Link2, AlertCircle, Sparkles } from 'lucide-react';
import { playSuccessBeep } from '../utils/soundEffects';

interface CardPairingModalProps {
  isOpen: boolean;
  cardUid: string;
  students: Student[];
  activeSession: EventSession;
  onPairAndCheckIn: (student: Student, cardUid: string) => void;
  onClose: () => void;
}

const DEFAULT_AVATAR = '/default_avatar.jpg';

export const CardPairingModal: React.FC<CardPairingModalProps> = ({
  isOpen,
  cardUid,
  students,
  activeSession,
  onPairAndCheckIn,
  onClose,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setSearchQuery('');
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const filteredStudents = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return students
      .filter(s => {
        if (!q) return true;
        return (
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          s.id.toLowerCase().replace('-', '').includes(q) ||
          s.yearLevel.toLowerCase().includes(q) ||
          s.role.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const aHasCard = Boolean(a.rfidUid && a.rfidUid.trim());
        const bHasCard = Boolean(b.rfidUid && b.rfidUid.trim());
        if (!aHasCard && bHasCard) return -1;
        if (aHasCard && !bHasCard) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [students, searchQuery]);

  if (!isOpen) return null;

  const handleSelectStudent = (student: Student) => {
    playSuccessBeep();
    onPairAndCheckIn(student, cardUid);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && filteredStudents.length === 1) {
      e.preventDefault();
      handleSelectStudent(filteredStudents[0]);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop"
      onKeyDown={handleKeyDown}
    >
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh] animate-modal-scale">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-ubytes-maroon-950 via-ubytes-maroon-900 to-ubytes-maroon-800 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-ubytes-amber-500 text-ubytes-maroon-950 flex items-center justify-center font-bold shadow-md">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-display font-bold text-base text-white uppercase tracking-wider">
                  New RFID Card Scanned
                </h3>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-medium">
                Link this card to a student and record attendance now
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center btn-subtle"
            title="Cancel"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Card UID Pill Banner */}
        <div className="px-6 py-3 bg-amber-50/80 border-b border-amber-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-amber-900">Extracted Card UID:</span>
            <span className="px-2.5 py-1 bg-amber-100 text-amber-950 font-mono font-bold text-sm rounded-lg border border-amber-300 shadow-2xs">
              {cardUid}
            </span>
          </div>
          <span className="text-[11px] text-amber-800 font-medium">
            Active Session: <strong className="font-bold text-amber-950">{activeSession.title}</strong>
          </span>
        </div>

        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name or Student ID (e.g. 24-0419-773, Manliguez)..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-ubytes-amber-500 font-medium shadow-2xs"
            />
          </div>
          <p className="text-[11px] text-slate-500 mt-1.5 px-1 flex items-center gap-1">
            <span>💡 Students without an RFID card are listed first. Select student to pair card and record attendance.</span>
          </p>
        </div>

        {/* Students List */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2 divide-y divide-slate-100/80">
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 text-slate-300" />
              <p className="text-xs font-semibold text-slate-600">No students found matching "{searchQuery}"</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Please check the spelling or add the student in the Directory first.</p>
            </div>
          ) : (
            filteredStudents.map((s) => {
              const isUnpaired = !s.rfidUid || !s.rfidUid.trim();
              return (
                <div
                  key={s.id}
                  onClick={() => handleSelectStudent(s)}
                  className={`pt-2 first:pt-0 group flex items-center justify-between p-3 rounded-2xl cursor-pointer transition-all ${
                    isUnpaired
                      ? 'hover:bg-amber-50/70 border border-transparent hover:border-amber-200'
                      : 'hover:bg-slate-50 border border-transparent hover:border-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={s.photo || DEFAULT_AVATAR}
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_AVATAR; }}
                      alt=""
                      className="w-10 h-10 rounded-full object-cover border border-slate-200 bg-slate-100 flex-shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-800 group-hover:text-ubytes-maroon-900 truncate">
                          {s.name}
                        </span>
                        {isUnpaired ? (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-900 text-[10px] font-bold rounded-full border border-amber-300 flex-shrink-0 flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-amber-600" />
                            Needs Card
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.2 bg-slate-100 text-slate-500 text-[10px] font-mono rounded flex-shrink-0">
                            Current: {s.rfidUid}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5 font-mono">
                        <span className="text-ubytes-maroon-800 font-bold">{s.id}</span>
                        <span>•</span>
                        <span className="font-sans text-slate-600">{s.yearLevel}</span>
                        <span>•</span>
                        <span className="font-sans text-slate-500">{s.role}</span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectStudent(s);
                    }}
                    className="px-3 py-1.5 bg-ubytes-maroon-800 hover:bg-ubytes-maroon-900 text-white text-xs font-bold rounded-xl shadow-xs flex items-center gap-1.5 flex-shrink-0 transition-all group-hover:scale-[1.02] btn-subtle"
                  >
                    <Link2 className="w-3.5 h-3.5 text-ubytes-amber-400" />
                    <span>Link & Check In</span>
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500 text-[11px]">
            Showing {filteredStudents.length} of {students.length} registered students
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl text-xs btn-subtle"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
};
