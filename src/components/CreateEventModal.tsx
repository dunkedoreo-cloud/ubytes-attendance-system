import React, { useState } from 'react';
import { EventSession } from '../types';
import { X, Calendar, Clock, MapPin, Plus, Trash2, AlertTriangle, Pencil, Check, RotateCcw } from 'lucide-react';

interface CreateEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: EventSession[];
  activeSession: EventSession;
  onSelectSession: (event: EventSession) => void;
  onAddEvent: (event: EventSession) => void;
  onUpdateEvent?: (event: EventSession) => void;
  onDeleteEvent: (eventId: string) => void;
}

export const CreateEventModal: React.FC<CreateEventModalProps> = ({
  isOpen,
  onClose,
  events,
  activeSession,
  onSelectSession,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent
}) => {
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('08:00 AM');
  const [lateThreshold, setLateThreshold] = useState('08:15 AM');
  const [location, setLocation] = useState('');
  const [description, setDescription] = useState('');
  const [eventToDelete, setEventToDelete] = useState<EventSession | null>(null);

  if (!isOpen) return null;

  const handleStartEdit = (evt: EventSession) => {
    setEditingEventId(evt.id);
    setTitle(evt.title);
    setDate(evt.date);
    setStartTime(evt.startTime);
    setLateThreshold(evt.lateThreshold);
    setLocation(evt.location);
    setDescription(evt.description || '');
  };

  const handleCancelEdit = () => {
    setEditingEventId(null);
    setTitle('');
    setDate('');
    setStartTime('08:00 AM');
    setLateThreshold('08:15 AM');
    setLocation('');
    setDescription('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (editingEventId) {
      const existing = events.find(ev => ev.id === editingEventId);
      const updatedEvent: EventSession = {
        id: editingEventId,
        title: title.trim(),
        date: date || (existing ? existing.date : new Date().toISOString().split('T')[0]),
        startTime: startTime.trim(),
        lateThreshold: lateThreshold.trim(),
        location: location.trim() || 'UB Campus',
        description: description.trim(),
        status: existing ? existing.status : 'Active',
        daysLeft: existing?.daysLeft ?? 0
      };

      if (onUpdateEvent) {
        onUpdateEvent(updatedEvent);
      }
      handleCancelEdit();
    } else {
      const newEvent: EventSession = {
        id: `evt-${Date.now()}`,
        title: title.trim(),
        date: date || new Date().toISOString().split('T')[0],
        startTime: startTime.trim(),
        lateThreshold: lateThreshold.trim(),
        location: location.trim() || 'UB Campus',
        description: description.trim(),
        status: 'Active',
        daysLeft: 0
      };

      onAddEvent(newEvent);
      onSelectSession(newEvent);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col modal-content">
        
        {/* Header */}
        <div className="px-6 py-4 bg-ubytes-maroon-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-ubytes-amber-500 text-ubytes-maroon-950 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Attendance Sessions & Events
              </h2>
              <p className="text-xs text-amber-200/80">
                Active: <span className="font-bold">{activeSession.title}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center btn-subtle"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Active Session Selector */}
          <div>
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">
              Switch Active Attendance Session
            </h4>

            {/* Event Delete Confirmation Banner */}
            {eventToDelete && (
              <div className="mb-3 p-3.5 bg-red-50 border-2 border-red-200 rounded-2xl flex items-center justify-between gap-3 animate-new-row shadow-sm">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0">
                    <AlertTriangle className="w-4 h-4" />
                  </div>
                  <div>
                    <h5 className="font-bold text-xs text-red-900">Delete Event Session</h5>
                    <p className="text-[11px] text-red-700">
                      Delete <strong>"{eventToDelete.title}"</strong>? Existing attendance records will remain saved.
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    type="button"
                    onClick={() => setEventToDelete(null)}
                    className="px-2.5 py-1 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-xs btn-subtle"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      onDeleteEvent(eventToDelete.id);
                      setEventToDelete(null);
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-xs shadow-sm flex items-center gap-1 btn-subtle"
                  >
                    <Trash2 className="w-3 h-3" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {events.map((evt) => {
                const isActive = evt.id === activeSession.id;
                const isEditing = evt.id === editingEventId;
                return (
                  <div
                    key={evt.id}
                    onClick={() => {
                      if (!isEditing) {
                        onSelectSession(evt);
                        onClose();
                      }
                    }}
                    className={`p-3 rounded-xl border text-left transition-all btn-subtle cursor-pointer relative group ${
                      isEditing
                        ? 'border-ubytes-amber-500 bg-amber-50/70 ring-2 ring-ubytes-amber-500 shadow-sm'
                        : isActive
                        ? 'border-ubytes-maroon-800 bg-red-50/50 ring-2 ring-ubytes-amber-500'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1 pr-16">
                      <span className="font-bold text-slate-800 line-clamp-1">{evt.title}</span>
                      {isActive && (
                        <span className="bg-ubytes-maroon-800 text-white text-[9px] font-bold px-1.5 py-0.5 rounded flex-shrink-0 ml-1">
                          Active
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center gap-2 pr-16">
                      <span>{evt.startTime}</span>
                      <span>•</span>
                      <span className="truncate">{evt.location}</span>
                    </div>

                    {/* Action Buttons: Edit & Delete */}
                    <div className="absolute top-2.5 right-2.5 flex items-center gap-1 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isEditing) {
                            handleCancelEdit();
                          } else {
                            handleStartEdit(evt);
                          }
                        }}
                        className={`p-1.5 rounded-lg transition-colors btn-subtle ${
                          isEditing
                            ? 'bg-ubytes-amber-500 text-white shadow-xs'
                            : 'text-slate-400 hover:text-ubytes-maroon-800 hover:bg-slate-100'
                        }`}
                        title={isEditing ? "Cancel editing" : "Edit Event Session"}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (events.length <= 1) {
                            alert('Cannot delete the last remaining event session.');
                            return;
                          }
                          setEventToDelete(evt);
                        }}
                        className="p-1.5 rounded-lg text-slate-300 hover:text-red-600 hover:bg-red-50 transition-colors btn-subtle"
                        title="Delete Session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Create or Edit Form */}
          <form onSubmit={handleSubmit} className="border-t border-slate-100 pt-5 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-xs text-ubytes-maroon-900 uppercase tracking-wider flex items-center gap-1.5">
                {editingEventId ? (
                  <>
                    <Pencil className="w-4 h-4 text-ubytes-amber-600" />
                    <span>Edit Event Session</span>
                    <span className="text-slate-400 text-[11px] font-normal normal-case ml-1">
                      (Editing: <strong className="text-slate-700">{events.find(e => e.id === editingEventId)?.title}</strong>)
                    </span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create & Activate New Event Session</span>
                  </>
                )}
              </h4>

              {editingEventId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 hover:bg-slate-50 btn-subtle"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Cancel Edit</span>
                </button>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Event Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. BSCS Midterm General Assembly"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-ubytes-amber-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Start Time</label>
                <input
                  type="text"
                  placeholder="e.g. 02:00 PM"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-600 font-semibold mb-1">Late After</label>
                <input
                  type="text"
                  placeholder="e.g. 02:15 PM"
                  value={lateThreshold}
                  onChange={(e) => setLateThreshold(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">Location / Venue</label>
              <input
                type="text"
                placeholder="e.g. Science Complex Audi / Lab 402"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              {editingEventId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 font-bold rounded-xl text-xs btn-subtle"
                >
                  Cancel
                </button>
              )}

              <button
                type="submit"
                className="px-5 py-2.5 bg-ubytes-maroon-800 hover:bg-ubytes-maroon-900 text-white font-bold rounded-xl text-xs shadow-md flex items-center gap-1.5 btn-subtle"
              >
                {editingEventId ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>Save Event Changes</span>
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" />
                    <span>Create & Set Active Session</span>
                  </>
                )}
              </button>
            </div>
          </form>

        </div>

      </div>
    </div>
  );
};
