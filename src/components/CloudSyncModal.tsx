import React, { useState, useEffect } from 'react';
import { 
  X, Database, FileSpreadsheet, CheckCircle2, AlertCircle, 
  ExternalLink, Copy, Check, RefreshCw, Send, ShieldCheck, Zap
} from 'lucide-react';
import { 
  getSupabaseSettings, saveSupabaseSettings, testSupabaseConnection, 
  syncLocalStudentsToSupabase, isSupabaseConfigured 
} from '../services/supabaseClient';
import { 
  getGoogleSheetsSettings, saveGoogleSheetsSettings, 
  testGoogleSheetsConnection, syncBatchToGoogleSheet, isGoogleSheetsConfigured 
} from '../services/googleSheetsSync';
import { Student, AttendanceRecord } from '../types';

interface CloudSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  attendanceRecords: AttendanceRecord[];
  onCloudStateChanged?: () => void;
}

export const CloudSyncModal: React.FC<CloudSyncModalProps> = ({
  isOpen,
  onClose,
  students,
  attendanceRecords,
  onCloudStateChanged
}) => {
  const [activeTab, setActiveTab] = useState<'supabase' | 'sheets'>('supabase');

  // Supabase Form State
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [supabaseStatus, setSupabaseStatus] = useState<{ testing: boolean; result: { success: boolean; message: string } | null }>({
    testing: false,
    result: null
  });
  const [isSyncingStudents, setIsSyncingStudents] = useState(false);
  const [studentSyncResult, setStudentSyncResult] = useState<string | null>(null);

  // Google Sheets Form State
  const [sheetsUrl, setSheetsUrl] = useState('');
  const [sheetsStatus, setSheetsStatus] = useState<{ testing: boolean; result: { success: boolean; message: string } | null }>({
    testing: false,
    result: null
  });
  const [isSyncingRecords, setIsSyncingRecords] = useState(false);
  const [sheetsSyncResult, setSheetsSyncResult] = useState<string | null>(null);

  // Copy feedback
  const [copiedSchema, setCopiedSchema] = useState(false);
  const [copiedScript, setCopiedScript] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const sb = getSupabaseSettings();
      setSupabaseUrl(sb.url);
      setSupabaseKey(sb.anonKey);

      const gs = getGoogleSheetsSettings();
      setSheetsUrl(gs);

      setSupabaseStatus({ testing: false, result: null });
      setSheetsStatus({ testing: false, result: null });
      setStudentSyncResult(null);
      setSheetsSyncResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Handler: Test & Save Supabase
  const handleTestAndSaveSupabase = async () => {
    setSupabaseStatus({ testing: true, result: null });
    saveSupabaseSettings(supabaseUrl, supabaseKey);

    const res = await testSupabaseConnection(supabaseUrl, supabaseKey);
    setSupabaseStatus({ testing: false, result: res });
    if (onCloudStateChanged) onCloudStateChanged();
  };

  // Handler: Sync Local Students to Supabase
  const handleSyncStudents = async () => {
    setIsSyncingStudents(true);
    setStudentSyncResult(null);
    const res = await syncLocalStudentsToSupabase(students);
    setIsSyncingStudents(false);
    if (res.error) {
      setStudentSyncResult(`Error: ${res.error}`);
    } else {
      setStudentSyncResult(`Successfully pushed ${res.count} BSCS students to Supabase!`);
    }
  };

  // Handler: Test & Save Google Sheets
  const handleTestAndSaveSheets = async () => {
    setSheetsStatus({ testing: true, result: null });
    saveGoogleSheetsSettings(sheetsUrl);

    const res = await testGoogleSheetsConnection(sheetsUrl);
    setSheetsStatus({ testing: false, result: res });
    if (onCloudStateChanged) onCloudStateChanged();
  };

  // Handler: Sync All Records to Google Sheets
  const handleSyncAllToSheets = async () => {
    setIsSyncingRecords(true);
    setSheetsSyncResult(null);
    const res = await syncBatchToGoogleSheet(attendanceRecords);
    setIsSyncingRecords(false);
    if (res.error) {
      setSheetsSyncResult(`Error: ${res.error}`);
    } else {
      setSheetsSyncResult(`Pushed ${res.count} attendance rows to Google Sheet!`);
    }
  };

  // Handler: Copy Supabase Schema
  const handleCopySchema = () => {
    const schemaNotice = `-- Copy the entire contents of supabase_schema.sql located in your project root, or paste the tables:\n-- public.students, public.events, public.attendance_records`;
    navigator.clipboard.writeText(schemaNotice);
    setCopiedSchema(true);
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  // Handler: Copy Apps Script
  const handleCopyScript = () => {
    const scriptSnippet = `// Open google_apps_script.js in your project directory to copy the full code!`;
    navigator.clipboard.writeText(scriptSnippet);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2500);
  };

  const isSbActive = isSupabaseConfigured();
  const isGsActive = isGoogleSheetsConfigured();

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 modal-backdrop">
      <div className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh] modal-content">
        
        {/* Header */}
        <div className="px-6 py-4 bg-ubytes-maroon-900 text-white flex items-center justify-between border-b-2 border-ubytes-gold">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ubytes-amber-500 text-ubytes-maroon-950 flex items-center justify-center font-black">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-display tracking-wider text-xl text-white">CLOUD DATABASE & GOOGLE SHEETS</h2>
                <span className="text-[10px] font-condensed bg-amber-400 text-ubytes-maroon-950 font-black px-2 py-0.5 rounded uppercase tracking-wider">
                  Automated Sync
                </span>
              </div>
              <p className="text-xs text-amber-200/90 font-condensed">
                Live synchronization pipeline for Young Thinkers Society (UByTeS)
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center btn-subtle"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3 gap-3">
          <button
            onClick={() => setActiveTab('supabase')}
            className={`pb-3 px-4 font-condensed font-bold text-sm tracking-wide flex items-center gap-2 border-b-2 btn-subtle ${
              activeTab === 'supabase'
                ? 'border-ubytes-maroon-900 text-ubytes-maroon-900 bg-white rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Database className="w-4 h-4 text-emerald-600" />
            <span>Supabase Cloud Database</span>
            {isSbActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('sheets')}
            className={`pb-3 px-4 font-condensed font-bold text-sm tracking-wide flex items-center gap-2 border-b-2 btn-subtle ${
              activeTab === 'sheets'
                ? 'border-ubytes-maroon-900 text-ubytes-maroon-900 bg-white rounded-t-xl shadow-sm'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Google Sheets Automated Sync</span>
            {isGsActive && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">

          {/* ============================================================ */}
          {/* TAB 1: SUPABASE                                              */}
          {/* ============================================================ */}
          {activeTab === 'supabase' && (
            <div className="space-y-5">
              
              {/* Status Header */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${isSbActive ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'}`}></div>
                  <span className="font-bold text-slate-700 font-condensed uppercase tracking-wider text-xs">
                    Current Status: {isSbActive ? 'Configured & Active' : 'Offline / LocalStorage Mode'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-condensed">
                  PostgreSQL Realtime Enabled
                </span>
              </div>

              {/* Supabase Credentials Inputs */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-ubytes-maroon-900" />
                  Supabase Project Credentials
                </h4>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-condensed font-bold text-slate-600 uppercase tracking-wider">
                      Project URL
                    </label>
                    <span className="text-[10px] text-slate-400">Settings &gt; Data API (or top "Connect" button)</span>
                  </div>
                  <input
                    type="text"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://wkwcokhwoieuioz.supabase.co"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-ubytes-amber-500 font-mono"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-condensed font-bold text-slate-600 uppercase tracking-wider">
                      Public Anon / Publishable Key
                    </label>
                    <span className="text-[10px] text-emerald-600 font-medium">Publishable key (sb_publishable_...) or Legacy anon</span>
                  </div>
                  <input
                    type="password"
                    value={supabaseKey}
                    onChange={(e) => setSupabaseKey(e.target.value)}
                    placeholder="sb_publishable_... or eyJhbGciOi..."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-ubytes-amber-500 font-mono"
                  />
                  <p className="mt-1 text-[10px] text-slate-500">
                    Supabase renamed the <strong>anon key</strong> to <strong>Publishable key</strong> (starts with <code className="bg-slate-100 px-1 py-0.5 rounded text-slate-700">sb_publishable_</code>). You can copy that directly, or click the "Legacy anon" tab.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={handleTestAndSaveSupabase}
                    disabled={supabaseStatus.testing}
                    className="px-4 py-2 bg-ubytes-maroon-900 hover:bg-ubytes-maroon-950 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm font-condensed uppercase tracking-wider text-xs btn-subtle"
                  >
                    {supabaseStatus.testing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Save & Test Connection</span>
                  </button>

                  <button
                    onClick={handleSyncStudents}
                    disabled={isSyncingStudents || !isSbActive}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm font-condensed uppercase tracking-wider text-xs btn-subtle"
                  >
                    {isSyncingStudents ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    <span>Push {students.length} Students to Supabase</span>
                  </button>
                </div>

                {/* Connection Feedback */}
                {supabaseStatus.result && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    supabaseStatus.result.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-amber-50 border-amber-300 text-amber-800'
                  }`}>
                    {supabaseStatus.result.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    )}
                    <span>{supabaseStatus.result.message}</span>
                  </div>
                )}

                {studentSyncResult && (
                  <div className="p-3 bg-blue-50 border border-blue-200 text-blue-900 rounded-xl text-xs font-semibold">
                    {studentSyncResult}
                  </div>
                )}
              </div>

              {/* 3-Step Setup Instructions */}
              <div className="p-4 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-amber-950 font-condensed uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <Zap className="w-4 h-4 text-amber-600" />
                    1-Minute Supabase Database Setup
                  </h4>
                  <a 
                    href="https://supabase.com" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] font-bold text-ubytes-maroon-900 hover:underline flex items-center gap-1"
                  >
                    <span>Open Supabase</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium text-[11px]">
                  <li>Create a free database project at <strong>supabase.com</strong>.</li>
                  <li>
                    In your project dashboard, click <strong>SQL Editor</strong> &gt; <strong>New Query</strong>.
                  </li>
                  <li>
                    Open and run <strong><code>supabase_schema.sql</code></strong> (located in your project root). It creates all tables and seeds the BSCS student roster automatically.
                  </li>
                  <li>
                    Go to <strong>Project Settings &gt; API</strong>, copy your <strong>Project URL</strong> and <strong>anon key</strong>, and paste them above!
                  </li>
                </ol>
              </div>

            </div>
          )}

          {/* ============================================================ */}
          {/* TAB 2: GOOGLE SHEETS                                         */}
          {/* ============================================================ */}
          {activeTab === 'sheets' && (
            <div className="space-y-5">
              
              {/* Status Header */}
              <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <div className="flex items-center gap-2.5">
                  <div className={`w-3 h-3 rounded-full ${isGsActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'}`}></div>
                  <span className="font-bold text-slate-700 font-condensed uppercase tracking-wider text-xs">
                    Current Status: {isGsActive ? 'Connected & Auto-Syncing' : 'Not Connected'}
                  </span>
                </div>
                <span className="text-[11px] text-slate-500 font-condensed">
                  Instant Webhook Stream
                </span>
              </div>

              {/* Webhook URL Input */}
              <div className="space-y-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Google Apps Script Web App Webhook
                </h4>

                <div>
                  <label className="block text-[11px] font-condensed font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Web App URL (from Google Sheets Deployment)
                  </label>
                  <input
                    type="text"
                    value={sheetsUrl}
                    onChange={(e) => setSheetsUrl(e.target.value)}
                    placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-ubytes-amber-500 font-mono"
                  />
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2">
                  <button
                    onClick={handleTestAndSaveSheets}
                    disabled={sheetsStatus.testing}
                    className="px-4 py-2 bg-ubytes-maroon-900 hover:bg-ubytes-maroon-950 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm font-condensed uppercase tracking-wider text-xs btn-subtle"
                  >
                    {sheetsStatus.testing ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                    )}
                    <span>Save & Send Test Ping</span>
                  </button>

                  <button
                    onClick={handleSyncAllToSheets}
                    disabled={isSyncingRecords || !isGsActive}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-xl flex items-center gap-1.5 shadow-sm font-condensed uppercase tracking-wider text-xs btn-subtle"
                  >
                    {isSyncingRecords ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                    <span>Sync All {attendanceRecords.length} Records to Sheet</span>
                  </button>
                </div>

                {/* Connection Feedback */}
                {sheetsStatus.result && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center gap-2 ${
                    sheetsStatus.result.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                      : 'bg-amber-50 border-amber-300 text-amber-800'
                  }`}>
                    {sheetsStatus.result.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    )}
                    <span>{sheetsStatus.result.message}</span>
                  </div>
                )}

                {sheetsSyncResult && (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl text-xs font-semibold">
                    {sheetsSyncResult}
                  </div>
                )}
              </div>

              {/* 3-Step Setup Instructions */}
              <div className="p-4 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-emerald-950 font-condensed uppercase tracking-wider text-xs flex items-center gap-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
                    3-Step Google Sheet Auto-Sync Setup
                  </h4>
                  <a 
                    href="https://sheets.new" 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-[11px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                  >
                    <span>Create New Sheet (sheets.new)</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <ol className="list-decimal list-inside space-y-1 text-slate-700 font-medium text-[11px]">
                  <li>Create a new spreadsheet at <strong>sheets.new</strong>.</li>
                  <li>
                    Click <strong>Extensions &gt; Apps Script</strong>.
                  </li>
                  <li>
                    Delete existing code, paste the contents of <strong><code>google_apps_script.js</code></strong> (in your project directory), and click <strong>Deploy &gt; New deployment</strong>:
                    <ul className="list-disc list-inside ml-4 text-slate-600 text-[10px] mt-0.5 space-y-0.5">
                      <li>Select type: <strong>Web app</strong></li>
                      <li>Execute as: <strong>Me</strong></li>
                      <li>Who has access: <strong>Anyone</strong> (allows the laptop kiosk to post logs)</li>
                    </ul>
                  </li>
                  <li>
                    Click <strong>Deploy</strong>, copy the generated <strong>Web app URL</strong>, and paste it above!
                  </li>
                </ol>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-500 font-condensed text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            <span>Zero-latency offline buffer active. All scans are saved locally first.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold font-condensed uppercase tracking-wider text-xs shadow btn-subtle"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
