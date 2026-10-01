import { AttendanceRecord } from '../types';

export function getGoogleSheetsSettings(): string {
  const envUrl = (import.meta as any).env?.VITE_GOOGLE_SHEET_WEBHOOK_URL || '';
  const savedUrl = localStorage.getItem('ubytes_google_sheet_webhook') || envUrl;
  return savedUrl.trim();
}

export function saveGoogleSheetsSettings(webhookUrl: string) {
  localStorage.setItem('ubytes_google_sheet_webhook', webhookUrl.trim());
}

export function isGoogleSheetsConfigured(): boolean {
  const url = getGoogleSheetsSettings();
  return Boolean(url && url.startsWith('http') && url.includes('script.google.com'));
}

/**
 * Send a test ping to the Google Apps Script Webhook
 */
export async function testGoogleSheetsConnection(customUrl?: string): Promise<{ success: boolean; message: string }> {
  const url = customUrl !== undefined ? customUrl.trim() : getGoogleSheetsSettings();

  if (!url) {
    return { success: false, message: 'Please provide a Google Apps Script Web App URL.' };
  }

  if (!url.includes('script.google.com')) {
    return { success: false, message: 'Invalid URL. It must be a script.google.com web app URL.' };
  }

  try {
    // We send via no-cors to handle Google Apps Script 302 redirect smoothly in client browser
    await fetch(url, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        action: 'test',
        type: 'ping',
        timestamp: new Date().toISOString()
      })
    });

    return { 
      success: true, 
      message: 'Test ping dispatched to Google Sheet! Check your spreadsheet to confirm the connection.' 
    };
  } catch (err: any) {
    return { 
      success: false, 
      message: err?.message || 'Failed to reach Google Apps Script webhook.' 
    };
  }
}

/**
 * Sends a single attendance record to the Google Sheet webhook asynchronously
 */
export async function syncRecordToGoogleSheet(record: AttendanceRecord): Promise<boolean> {
  const webhookUrl = getGoogleSheetsSettings();
  if (!webhookUrl) return false;

  try {
    const payload = {
      studentId: record.studentId,
      studentName: record.studentName,
      program: record.program,
      yearLevel: record.yearLevel,
      eventName: record.eventName,
      date: record.date,
      timeIn: record.timeIn,
      timeOut: record.timeOut || 'In Session',
      status: record.status
    };

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return true;
  } catch (err) {
    console.error('Google Sheets sync error:', err);
    return false;
  }
}

/**
 * Batch sync pending records to Google Sheet
 */
export async function syncBatchToGoogleSheet(records: AttendanceRecord[]): Promise<{ count: number; error?: string }> {
  const webhookUrl = getGoogleSheetsSettings();
  if (!webhookUrl) return { count: 0, error: 'Google Sheet webhook is not configured' };
  if (records.length === 0) return { count: 0 };

  try {
    const payload = {
      records: records.map(r => ({
        studentId: r.studentId,
        studentName: r.studentName,
        program: r.program,
        yearLevel: r.yearLevel,
        eventName: r.eventName,
        date: r.date,
        timeIn: r.timeIn,
        timeOut: r.timeOut || 'In Session',
        status: r.status
      }))
    };

    await fetch(webhookUrl, {
      method: 'POST',
      mode: 'no-cors',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    return { count: records.length };
  } catch (err: any) {
    return { count: 0, error: err?.message || 'Failed to dispatch batch to Google Sheet' };
  }
}
