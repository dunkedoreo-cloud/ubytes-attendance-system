/**
 * ==============================================================================
 * YOUNG THINKERS SOCIETY (UByTeS) - GOOGLE SHEETS AUTOMATED SYNC WEBHOOK
 * University of Bohol • BS Computer Science
 * ==============================================================================
 * 
 * HOW TO INSTALL IN 3 STEPS:
 * 1. Open your Google Sheet (create a blank one at sheets.new).
 * 2. Click on "Extensions" > "Apps Script".
 * 3. Delete any code in the editor, paste this entire script, and click "Deploy" > "New deployment".
 *    - Select type: "Web app"
 *    - Description: "UByTeS Attendance Sync"
 *    - Execute as: "Me"
 *    - Who has access: "Anyone" (Required so your laptop can push attendance without OAuth)
 *    - Click "Deploy", copy the "Web app URL", and paste it into the UByTeS Kiosk Cloud Sync Settings!
 */

function doGet(e) {
  return ContentService.createTextOutput(JSON.stringify({
    status: 'online',
    message: 'Young Thinkers Society (UByTeS) Attendance Webhook is active and listening!',
    timestamp: new Date().toISOString()
  })).setMimeType(ContentService.MimeType.JSON);
}

function doPost(e) {
  try {
    var lock = LockService.getScriptLock();
    lock.waitLock(10000); // Wait up to 10s for other concurrent taps

    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    
    // Auto-rename sheet tab if default
    if (sheet.getName() === 'Sheet1') {
      sheet.setName('UByTeS Attendance Logs');
    }

    // Initialize Header Row if empty
    if (sheet.getLastRow() === 0) {
      var headers = [
        'Timestamp Recorded',
        'Student ID',
        'Full Name',
        'Degree Program',
        'Year Level',
        'Section',
        'Role',
        'Event / Session',
        'Date',
        'Time In',
        'Status'
      ];
      sheet.appendRow(headers);
      
      // Style Header: Maroon background with Gold text
      var headerRange = sheet.getRange(1, 1, 1, headers.length);
      headerRange.setBackground('#550a12');
      headerRange.setFontColor('#FFD54F');
      headerRange.setFontWeight('bold');
      headerRange.setFontFamily('Arial');
      sheet.setFrozenRows(1);
    }

    var data;
    if (e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    } else if (e.parameter) {
      data = e.parameter;
    } else {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error',
        message: 'No data payload received'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle Ping / Test
    if (data.action === 'test' || data.type === 'ping') {
      lock.releaseLock();
      return ContentService.createTextOutput(JSON.stringify({
        status: 'success',
        message: 'Ping test successful! Sheet is properly connected.'
      })).setMimeType(ContentService.MimeType.JSON);
    }

    // Handle Single Record or Batch Records
    var records = Array.isArray(data) ? data : (data.records ? data.records : [data]);

    for (var i = 0; i < records.length; i++) {
      var rec = records[i];
      var now = new Date();
      var formattedTimestamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
      
      var row = [
        formattedTimestamp,
        rec.studentId || '',
        rec.studentName || rec.name || '',
        rec.program || 'BS Computer Science',
        rec.yearLevel || '',
        rec.section || '',
        rec.role || 'Active Member',
        rec.eventName || '',
        rec.date || '',
        rec.timeIn || '',
        rec.status || 'On-Time'
      ];

      sheet.appendRow(row);
      var lastRow = sheet.getLastRow();

      // Format Status Pill Cell
      var statusCell = sheet.getRange(lastRow, 11);
      if (String(rec.status).toLowerCase().indexOf('on-time') !== -1) {
        statusCell.setBackground('#D1FAE5'); // Light Emerald
        statusCell.setFontColor('#065F46'); // Dark Emerald
        statusCell.setFontWeight('bold');
      } else {
        statusCell.setBackground('#FEF3C7'); // Light Amber
        statusCell.setFontColor('#92400E'); // Dark Amber
        statusCell.setFontWeight('bold');
      }
    }

    // Auto-resize columns for clean appearance
    for (var col = 1; col <= 11; col++) {
      sheet.autoResizeColumn(col);
    }

    lock.releaseLock();

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      inserted: records.length,
      timestamp: new Date().toISOString()
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: err.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
