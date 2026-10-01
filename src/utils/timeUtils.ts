/**
 * Utility functions for parsing time strings and calculating attendance status (On-Time vs Late).
 */

export function parseTimeToMinutes(timeStr: string): number | null {
  if (!timeStr) return null;
  const cleaned = timeStr.trim().toUpperCase();

  const matchHm = cleaned.match(/^(\d{1,2}):(\d{2})(?::\d{2})?\s*(AM|PM)?$/);
  if (matchHm) {
    let hours = parseInt(matchHm[1], 10);
    const minutes = parseInt(matchHm[2], 10);
    const meridiem = matchHm[3];

    if (meridiem === 'PM' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 60 + minutes;
  }

  const matchH = cleaned.match(/^(\d{1,2})\s*(AM|PM)$/);
  if (matchH) {
    let hours = parseInt(matchH[1], 10);
    const meridiem = matchH[2];
    if (meridiem === 'PM' && hours < 12) {
      hours += 12;
    } else if (meridiem === 'AM' && hours === 12) {
      hours = 0;
    }
    return hours * 60;
  }

  return null;
}

export function calculateAttendanceStatus(
  checkTime: string | Date | null | undefined,
  session?: { lateThreshold?: string; startTime?: string }
): 'On-Time' | 'Late' {
  if (!session) return 'On-Time';

  const thresholdStr = session.lateThreshold || session.startTime;
  if (!thresholdStr) return 'On-Time';

  const thresholdMinutes = parseTimeToMinutes(thresholdStr);
  if (thresholdMinutes === null) return 'On-Time';

  let checkMinutes: number;
  if (checkTime instanceof Date) {
    checkMinutes = checkTime.getHours() * 60 + checkTime.getMinutes();
  } else if (typeof checkTime === 'string' && checkTime.trim()) {
    const parsed = parseTimeToMinutes(checkTime);
    if (parsed !== null) {
      checkMinutes = parsed;
    } else {
      const now = new Date();
      checkMinutes = now.getHours() * 60 + now.getMinutes();
    }
  } else {
    const now = new Date();
    checkMinutes = now.getHours() * 60 + now.getMinutes();
  }

  return checkMinutes > thresholdMinutes ? 'Late' : 'On-Time';
}
