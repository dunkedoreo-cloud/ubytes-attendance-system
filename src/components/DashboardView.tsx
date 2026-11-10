import React, { useState, useEffect, useMemo } from 'react';
import { Student, AttendanceRecord, EventSession, AdminUser } from '../types';
import { RadarChart } from './RadarChart';
import { AttendanceHeatmap } from './AttendanceHeatmap';
import { 
  ArrowUpRight, 
  MoreHorizontal, 
  Download, 
  Plus, 
  CreditCard, 
  FileText,
  Search,
  Users
} from 'lucide-react';

interface DashboardViewProps {
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  events: EventSession[];
  onSwitchToKiosk: () => void;
  onOpenCreateEvent: () => void;
  currentUser?: AdminUser;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  students = [],
  attendanceRecords,
  events,
  onSwitchToKiosk,
  onOpenCreateEvent,
  currentUser,
}) => {
  const [filterTab, setFilterTab] = useState<'all' | 'on-time' | 'late'>('all');
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Real-time live date and ticking clock
  const [currentDateTime, setCurrentDateTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDateTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedDate = currentDateTime.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  const formattedDateShort = currentDateTime.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });

  const formattedTime = currentDateTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  // Dynamic Year Level Distribution from master students list
  const totalRegisteredStudents = students.length;
  const firstYears = students.filter(s => s.yearLevel === '1st Year').length;
  const secondYears = students.filter(s => s.yearLevel === '2nd Year').length;
  const thirdYears = students.filter(s => s.yearLevel === '3rd Year').length;
  const fourthYears = students.filter(s => s.yearLevel === '4th Year').length;

  const pct1 = totalRegisteredStudents > 0 ? Math.round((firstYears / totalRegisteredStudents) * 100) : 0;
  const pct2 = totalRegisteredStudents > 0 ? Math.round((secondYears / totalRegisteredStudents) * 100) : 0;
  const pct3 = totalRegisteredStudents > 0 ? Math.round((thirdYears / totalRegisteredStudents) * 100) : 0;
  const pct4 = totalRegisteredStudents > 0 ? Math.max(0, 100 - pct1 - pct2 - pct3) : 0;

  // Real-time Organization Metrics
  const activeQuorumRate = totalRegisteredStudents > 0
    ? Math.min(100, Math.round((attendanceRecords.length / totalRegisteredStudents) * 100))
    : attendanceRecords.length > 0 ? 100 : 0;

  const onTimeAttendance = attendanceRecords.filter(r => r.status === 'On-Time').length;
  const onTimeRatio = attendanceRecords.length > 0
    ? onTimeAttendance / attendanceRecords.length
    : 1;

  const radarMetrics = useMemo(() => [
    { label: 'Attendance', value: Math.max(0.25, Math.min(1, totalRegisteredStudents > 0 ? attendanceRecords.length / Math.max(totalRegisteredStudents, 1) : 0.85)) },
    { label: 'On-Time', value: Math.max(0.25, Math.min(1, onTimeRatio)) },
    { label: 'Quorum', value: Math.max(0.25, Math.min(1, activeQuorumRate / 100)) },
    { label: 'Events', value: Math.max(0.3, Math.min(1, events.length / 4)) },
    { label: 'Roster', value: Math.max(0.25, Math.min(1, totalRegisteredStudents / 20)) },
    { label: 'Activity', value: Math.max(0.3, Math.min(1, (attendanceRecords.length * 1.5) / Math.max(totalRegisteredStudents, 1))) }
  ], [totalRegisteredStudents, attendanceRecords, onTimeRatio, activeQuorumRate, events]);

  // Dynamic Event Countdown
  const getEventCountdown = (dateStr: string) => {
    if (!dateStr) return 'TODAY';
    const target = new Date(dateStr);
    if (isNaN(target.getTime())) return 'TODAY';
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);
    const diffTime = target.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'TODAY';
    if (diffDays === 1) return 'TOMORROW';
    if (diffDays > 1) return `${diffDays} DAYS`;
    if (diffDays === -1) return 'YESTERDAY';
    return `${Math.abs(diffDays)}D AGO`;
  };

  // Records for the selected event (or all events)
  const selectedEventRecords = useMemo(() => {
    if (selectedEventId === 'all') return attendanceRecords;
    const targetEvent = events.find(e => e.id === selectedEventId);
    return attendanceRecords.filter(r => 
      r.eventId === selectedEventId || (targetEvent && r.eventName === targetEvent.title)
    );
  }, [attendanceRecords, selectedEventId, events]);

  // Filter attendance table records by event, status tab, and search query
  const filteredRecords = useMemo(() => {
    return selectedEventRecords.filter(r => {
      // Status filter tab
      if (filterTab === 'on-time' && r.status !== 'On-Time') return false;
      if (filterTab === 'late' && r.status !== 'Late') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matches = 
          r.studentName.toLowerCase().includes(q) ||
          r.studentId.toLowerCase().includes(q) ||
          (r.program && r.program.toLowerCase().includes(q)) ||
          (r.yearLevel && r.yearLevel.toLowerCase().includes(q)) ||
          (r.eventName && r.eventName.toLowerCase().includes(q));
        if (!matches) return false;
      }

      return true;
    });
  }, [selectedEventRecords, filterTab, searchQuery]);

  const handleExport = () => {
    const headers = ['Student ID', 'Full Name', 'Course', 'Year Level', 'Event', 'Date', 'Time In', 'Time Out', 'Status'];
    const recordsToExport = filteredRecords.length > 0 ? filteredRecords : selectedEventRecords;
    const rows = recordsToExport.map(r => [
      `"${r.studentId}"`,
      `"${r.studentName}"`,
      `"${r.program}"`,
      `"${r.yearLevel}"`,
      `"${r.eventName}"`,
      `"${(!r.date || r.date === '16 Sep 2026') ? formattedDateShort : r.date}"`,
      `"${r.timeIn}"`,
      `"${r.timeOut || ''}"`,
      `"${r.status}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const eventNameSlug = selectedEventId === 'all' 
      ? 'all_events' 
      : (events.find(e => e.id === selectedEventId)?.title || 'event').toLowerCase().replace(/[^a-z0-9]+/g, '_');
    link.setAttribute('download', `ubytes_attendance_${eventNameSlug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header Greeting & Quick Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display tracking-wider text-slate-900 text-3xl md:text-4xl">
            HELLO, {currentUser?.isLoggedIn ? currentUser.name.toUpperCase() : 'GUEST OPERATOR'}
          </h1>
          <p className="text-xs md:text-sm text-slate-500 font-medium flex items-center gap-2 flex-wrap mt-1">
            <span className="text-ubytes-maroon-800 font-bold">Young Thinkers Society</span>
            <span>•</span>
            <span className="font-semibold text-slate-700">{formattedDate}</span>
            <span>•</span>
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-700 font-mono text-xs font-semibold shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {formattedTime}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={onSwitchToKiosk}
            className="px-4 py-2.5 bg-gradient-to-r from-ubytes-maroon-800 to-ubytes-amber-600 text-white rounded-xl text-xs font-bold shadow-md hover:brightness-110 flex items-center gap-2 font-condensed tracking-wider uppercase btn-subtle"
          >
            <CreditCard className="w-4 h-4 text-ubytes-amber-300" />
            Launch RFID Station
          </button>

          <button
            onClick={onOpenCreateEvent}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 font-condensed tracking-wider uppercase btn-subtle"
          >
            <Plus className="w-4 h-4 text-slate-400" />
            Create New Event
          </button>

          <button
            onClick={handleExport}
            className="px-4 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 font-condensed tracking-wider uppercase btn-subtle"
          >
            <Download className="w-4 h-4 text-slate-400" />
            Export Report
          </button>
        </div>
      </div>

      {/* Top 3 Analytical Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* CARD 1: Organization Performance Radar Chart */}
        <div className="bg-white rounded-2xl p-5 ubytes-card-shadow border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-display tracking-wider text-slate-900 text-2xl leading-none">
                ORGANIZATION PERFORMANCE
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Live student activity & engagement metrics
              </p>
            </div>
            <button className="text-slate-300 hover:text-slate-500">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="my-2">
            <RadarChart data={radarMetrics} />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            <span>Overall Activity: <strong className="text-emerald-600 font-bold font-condensed text-sm">{activeQuorumRate}%</strong></span>
            <span className="text-ubytes-maroon-800 font-bold font-condensed uppercase tracking-wider">Active Quorum</span>
          </div>
        </div>

        {/* CARD 2: Student Year Level Distribution */}
        <div className="bg-white rounded-2xl p-5 ubytes-card-shadow border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-display tracking-wider text-slate-900 text-2xl leading-none">
                BSCS YEAR LEVELS
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Live member distribution across academic years
              </p>
            </div>
            <button className="text-slate-300 hover:text-slate-500">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          {/* Segmented Bar */}
          <div className="my-2">
            <div className="flex items-baseline justify-between mb-2">
              <span className="font-display text-4xl text-slate-900 leading-none">{totalRegisteredStudents}</span>
              <span className="text-xs font-condensed uppercase tracking-wider text-slate-400 font-bold">Registered Members</span>
            </div>

            <div className="h-3.5 w-full rounded-full overflow-hidden flex gap-1 p-0.5 bg-slate-100">
              <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: `${Math.max(pct1, totalRegisteredStudents > 0 ? 3 : 0)}%` }} title={`1st Year (${pct1}%)`}></div>
              <div className="h-full bg-ubytes-amber-500 rounded-full transition-all duration-300" style={{ width: `${Math.max(pct2, totalRegisteredStudents > 0 ? 3 : 0)}%` }} title={`2nd Year (${pct2}%)`}></div>
              <div className="h-full bg-ubytes-maroon-800 rounded-full transition-all duration-300" style={{ width: `${Math.max(pct3, totalRegisteredStudents > 0 ? 3 : 0)}%` }} title={`3rd Year (${pct3}%)`}></div>
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${Math.max(pct4, totalRegisteredStudents > 0 ? 3 : 0)}%` }} title={`4th Year (${pct4}%)`}></div>
            </div>
          </div>

          {/* Cohort Breakdown */}
          <div className="space-y-2 text-xs pt-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span className="text-slate-600 font-medium">1st Year Freshmen</span>
              </div>
              <span className="font-bold text-slate-800 font-condensed tracking-wide">
                {firstYears} Students <span className="text-emerald-600 ml-1 font-black">{pct1}%</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ubytes-amber-500"></span>
                <span className="text-slate-600 font-medium">2nd Year Sophomores</span>
              </div>
              <span className="font-bold text-slate-800 font-condensed tracking-wide">
                {secondYears} Students <span className="text-amber-600 ml-1 font-black">{pct2}%</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-ubytes-maroon-800"></span>
                <span className="text-slate-600 font-medium">3rd Year Juniors</span>
              </div>
              <span className="font-bold text-slate-800 font-condensed tracking-wide">
                {thirdYears} Students <span className="text-ubytes-maroon-800 ml-1 font-black">{pct3}%</span>
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-600"></span>
                <span className="text-slate-600 font-medium">4th Year Seniors & Officers</span>
              </div>
              <span className="font-bold text-slate-800 font-condensed tracking-wide">
                {fourthYears} Students <span className="text-indigo-600 ml-1 font-black">{pct4}%</span>
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-condensed uppercase tracking-wider">
            A.Y. 2026-2027 • College of Engineering, Technology & Arts
          </div>
        </div>

        {/* CARD 3: Attendance Report Heatmap with Floating Tooltip */}
        <div className="bg-white rounded-2xl p-5 ubytes-card-shadow border border-slate-100 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="font-display tracking-wider text-slate-900 text-2xl leading-none">
                ATTENDANCE REPORT
              </h3>
              <p className="text-[11px] text-slate-400 font-medium">
                Real-time student attendance volume map
              </p>
            </div>
            <button className="text-slate-300 hover:text-slate-500">
              <MoreHorizontal className="w-5 h-5" />
            </button>
          </div>

          <div className="my-1">
            <AttendanceHeatmap attendanceRecords={attendanceRecords} />
          </div>
        </div>

      </div>

      {/* Bottom Section: Events Filter Grid (Left) + Detailed Attendance Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT: Organization Event Cards (4 Cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-slate-500 font-condensed uppercase tracking-wider">
              Filter by Event ({events.length})
            </h4>
            {selectedEventId !== 'all' && (
              <button
                onClick={() => setSelectedEventId('all')}
                className="text-[11px] text-ubytes-maroon-800 font-bold hover:underline"
              >
                Show All Events
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3 max-h-[560px] overflow-y-auto pr-1">
            {events.map((evt) => {
              const isSelected = selectedEventId === evt.id;
              const count = attendanceRecords.filter(r => r.eventId === evt.id || r.eventName === evt.title).length;

              return (
                <div
                  key={evt.id}
                  onClick={() => setSelectedEventId(isSelected ? 'all' : evt.id)}
                  className={`bg-white rounded-2xl p-4 ubytes-card-shadow border transition-all group cursor-pointer flex flex-col justify-between ${
                    isSelected
                      ? 'border-ubytes-maroon-800 ring-2 ring-ubytes-amber-500 bg-amber-50/20 shadow-md'
                      : 'border-slate-100 hover:border-ubytes-amber-400'
                  }`}
                  title={`Click to filter attendance for ${evt.title}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[10px] font-condensed font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      {evt.status}
                    </span>
                    {isSelected ? (
                      <span className="bg-ubytes-maroon-800 text-white text-[9px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                        Active Filter
                      </span>
                    ) : (
                      <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-1.5 py-0.5 rounded-full flex-shrink-0">
                        {count} Attended
                      </span>
                    )}
                  </div>

                  <h4 className={`text-xs font-bold line-clamp-2 transition-colors ${
                    isSelected ? 'text-ubytes-maroon-900' : 'text-slate-800 group-hover:text-ubytes-maroon-800'
                  }`}>
                    {evt.title}
                  </h4>

                  <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-condensed uppercase">Scheduled in</span>
                      <span className="font-display text-xl text-ubytes-maroon-800 leading-none">
                        {getEventCountdown(evt.date)}
                      </span>
                    </div>

                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-ubytes-maroon-800 text-ubytes-amber-300'
                        : 'bg-amber-50 text-ubytes-maroon-800 group-hover:bg-ubytes-maroon-800 group-hover:text-ubytes-amber-300'
                    }`}>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT: Detailed Student Attendance Log Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 ubytes-card-shadow border border-slate-100 flex flex-col justify-between">
          <div>
            {/* Header & Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-display tracking-wider text-slate-900 text-2xl leading-none">
                    STUDENT ATTENDANCE RECORDS
                  </h3>
                  {selectedEventId !== 'all' && (
                    <span className="bg-ubytes-amber-100 text-ubytes-maroon-900 text-[10px] font-bold px-2 py-0.5 rounded-full border border-ubytes-amber-300 font-condensed uppercase tracking-wider">
                      {events.find(e => e.id === selectedEventId)?.title || 'Filtered Event'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                  {selectedEventId === 'all'
                    ? 'Showing all students across all events'
                    : `Showing all students recorded for: ${events.find(e => e.id === selectedEventId)?.title}`}
                </p>
              </div>

              {/* Action Controls: Event Selector & Filter Tabs */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Event Dropdown Selector */}
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:ring-2 focus:ring-ubytes-amber-500 focus:outline-none max-w-[200px] truncate"
                >
                  <option value="all">All Events ({attendanceRecords.length})</option>
                  {events.map((evt) => {
                    const count = attendanceRecords.filter(r => r.eventId === evt.id || r.eventName === evt.title).length;
                    return (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({count})
                      </option>
                    );
                  })}
                </select>

                {/* Filter Tabs */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold font-condensed uppercase tracking-wider">
                  <button
                    onClick={() => setFilterTab('all')}
                    className={`px-2.5 py-1 rounded-lg btn-subtle ${
                      filterTab === 'all'
                        ? 'bg-white text-slate-800 shadow-sm font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All ({selectedEventRecords.length})
                  </button>
                  <button
                    onClick={() => setFilterTab('on-time')}
                    className={`px-2.5 py-1 rounded-lg btn-subtle ${
                      filterTab === 'on-time'
                        ? 'bg-white text-slate-800 shadow-sm font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    On-Time
                  </button>
                  <button
                    onClick={() => setFilterTab('late')}
                    className={`px-2.5 py-1 rounded-lg btn-subtle ${
                      filterTab === 'late'
                        ? 'bg-white text-slate-800 shadow-sm font-bold'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Late
                  </button>
                </div>
              </div>
            </div>

            {/* Search Input Bar */}
            <div className="mb-3 flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search student by name, student ID, program, or event..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-8.5 pr-8 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-ubytes-amber-500 focus:outline-none transition-all placeholder:text-slate-400"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs w-4 h-4 flex items-center justify-center rounded-full hover:bg-slate-200"
                  >
                    ×
                  </button>
                )}
              </div>

              <button
                onClick={handleExport}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-xl text-xs flex items-center gap-1.5 btn-subtle flex-shrink-0"
                title="Export filtered records to CSV"
              >
                <Download className="w-3.5 h-3.5" />
                <span className="font-condensed uppercase tracking-wider">CSV</span>
              </button>
            </div>

            {/* Scrollable Table Container (No limits, supports hundreds of students) */}
            <div className="overflow-x-auto overflow-y-auto max-h-[460px] rounded-xl border border-slate-200 shadow-2xs relative">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 sticky top-0 z-10 text-slate-500 font-condensed font-bold uppercase text-[11px] tracking-wider border-b border-slate-200 shadow-2xs">
                  <tr>
                    <th className="py-2.5 px-3 whitespace-nowrap">Student ID</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Full Name</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Date</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Event / Schedule</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Time In</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Time Out</th>
                    <th className="py-2.5 px-3 whitespace-nowrap">Status</th>
                    <th className="py-2.5 px-3 text-center whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map((row) => {
                      const matchedEvent = events.find(e => e.id === row.eventId || e.title === row.eventName);
                      const scheduleTime = matchedEvent?.startTime || '08:00 AM';
                      const displayDate = (!row.date || row.date === '16 Sep 2026') ? formattedDateShort : row.date;

                      return (
                        <tr key={row.id} className="hover:bg-amber-50/40 transition-colors">
                          <td className="py-2.5 px-3 font-mono font-bold text-ubytes-maroon-800 whitespace-nowrap">
                            {row.studentId}
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                            {row.studentName}
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                            {displayDate}
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                            <span className="font-semibold block truncate max-w-[160px]" title={row.eventName}>
                              {row.eventName}
                            </span>
                            <span className="font-mono text-[10px] text-slate-400">
                              {scheduleTime}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold whitespace-nowrap">
                            {row.timeIn}
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs whitespace-nowrap">
                            {row.timeOut ? (
                              <span className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[11px]">
                                {row.timeOut}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-[11px]">In Session</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            {row.timeOut ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-condensed font-bold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200/50">
                                • Checked Out
                              </span>
                            ) : (
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-condensed font-bold uppercase tracking-wider ${
                                  row.status === 'On-Time'
                                    ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/50'
                                    : 'bg-amber-50 text-amber-700 border border-amber-200/50'
                                }`}
                              >
                                • {row.status}
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-center whitespace-nowrap">
                            <button
                              onClick={onSwitchToKiosk}
                              className="p-1 rounded text-slate-400 hover:text-ubytes-maroon-800 hover:bg-slate-100"
                              title="View in Kiosk"
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        <p className="font-semibold text-slate-600">No attendance records found</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {searchQuery
                            ? `No students matching "${searchQuery}"`
                            : 'No students have checked in for this event yet.'}
                        </p>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer with exact counts */}
          <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <strong className="text-slate-800 font-bold">{filteredRecords.length}</strong> of{' '}
              <strong className="text-slate-800 font-bold">{selectedEventRecords.length}</strong> recorded students
              {selectedEventId !== 'all' && (
                <span className="text-slate-400 ml-1">
                  in {events.find(e => e.id === selectedEventId)?.title}
                </span>
              )}
            </div>

            <button
              onClick={onSwitchToKiosk}
              className="text-ubytes-maroon-800 font-bold hover:underline flex items-center gap-1 font-condensed uppercase tracking-wider"
            >
              Open RFID Tap Station →
            </button>
          </div>
        </div>

      </div>

    </div>
  );
};
