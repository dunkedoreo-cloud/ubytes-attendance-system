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
  FileText 
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

  // Filter attendance table records
  const filteredRecords = attendanceRecords.filter(r => {
    if (filterTab === 'on-time') return r.status === 'On-Time';
    if (filterTab === 'late') return r.status === 'Late';
    return true;
  });

  const handleExport = () => {
    const headers = ['Student ID', 'Full Name', 'Course', 'Year Level', 'Event', 'Date', 'Time In', 'Time Out', 'Status'];
    const rows = attendanceRecords.map(r => [
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
    link.setAttribute('download', `ubytes_full_attendance_report.csv`);
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

      {/* Bottom Section: 2x2 Events Grid (Left) + Detailed Attendance Table (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* LEFT: 4 Organization Event Cards (4 Cols) */}
        <div className="lg:col-span-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {events.map((evt) => (
            <div
              key={evt.id}
              className="bg-white rounded-2xl p-4 ubytes-card-shadow border border-slate-100 flex flex-col justify-between hover:border-ubytes-amber-400 transition-all group cursor-pointer"
            >
              <div>
                <span className="text-[10px] font-condensed font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  {evt.status}
                </span>
                <h4 className="text-xs font-bold text-slate-800 line-clamp-2 group-hover:text-ubytes-maroon-800 transition-colors">
                  {evt.title}
                </h4>
              </div>

              <div className="mt-4 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 block font-condensed uppercase">Scheduled in</span>
                  <span className="font-display text-xl text-ubytes-maroon-800 leading-none">
                    {getEventCountdown(evt.date)}
                  </span>
                </div>

                <div className="w-8 h-8 rounded-xl bg-amber-50 text-ubytes-maroon-800 group-hover:bg-ubytes-maroon-800 group-hover:text-ubytes-amber-300 flex items-center justify-center transition-all shadow-sm">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* RIGHT: Detailed Student Attendance Log Table (8 Cols) */}
        <div className="lg:col-span-8 bg-white rounded-2xl p-5 ubytes-card-shadow border border-slate-100 flex flex-col justify-between">
          <div>
            {/* Header & Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="font-display tracking-wider text-slate-900 text-2xl leading-none">
                  STUDENT ATTENDANCE RECORDS
                </h3>
                <p className="text-[11px] text-slate-400 font-medium">
                  Student arrival details and check-in timeline
                </p>
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold font-condensed uppercase tracking-wider">
                <button
                  onClick={() => setFilterTab('all')}
                  className={`px-3 py-1.5 rounded-lg btn-subtle ${
                    filterTab === 'all'
                      ? 'bg-white text-slate-800 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => setFilterTab('on-time')}
                  className={`px-3 py-1.5 rounded-lg btn-subtle ${
                    filterTab === 'on-time'
                      ? 'bg-white text-slate-800 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  On-Time
                </button>
                <button
                  onClick={() => setFilterTab('late')}
                  className={`px-3 py-1.5 rounded-lg btn-subtle ${
                    filterTab === 'late'
                      ? 'bg-white text-slate-800 shadow-sm font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Late Attendance
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-condensed font-bold uppercase text-[11px] tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Student ID</th>
                    <th className="py-2.5 px-3">Full Name</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Schedule</th>
                    <th className="py-2.5 px-3">Time In</th>
                    <th className="py-2.5 px-3">Time Out</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.slice(0, 7).map((row) => {
                    const matchedEvent = events.find(e => e.id === row.eventId || e.title === row.eventName);
                    const scheduleTime = matchedEvent?.startTime || '08:00 AM';
                    const displayDate = (!row.date || row.date === '16 Sep 2026') ? formattedDateShort : row.date;

                    return (
                      <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-2.5 px-3 font-mono font-bold text-ubytes-maroon-800">
                          {row.studentId}
                        </td>
                        <td className="py-2.5 px-3 font-semibold text-slate-800">
                          {row.studentName}
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">
                          {displayDate}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-400">
                          {scheduleTime}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 font-semibold">
                          {row.timeIn}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-xs">
                          {row.timeOut ? (
                            <span className="text-blue-700 font-bold bg-blue-50 border border-blue-200 px-1.5 py-0.5 rounded text-[11px]">
                              {row.timeOut}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic text-[11px]">In Session</span>
                          )}
                        </td>
                        <td className="py-2.5 px-3">
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
                        <td className="py-2.5 px-3 text-center">
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
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer */}
          <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-400">
            <span>Synchronized with USB RFID Scanner</span>
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
