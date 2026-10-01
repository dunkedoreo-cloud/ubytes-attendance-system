import { Student, EventSession, AttendanceRecord } from '../types';

export const DEFAULT_AVATAR = '/default_avatar.jpg';

export const INITIAL_STUDENTS: Student[] = [
  {
    id: '2023-01492',
    rfidUid: '1083920194',
    name: 'John Christian D. Perez',
    program: 'BS Computer Science',
    yearLevel: '3rd Year',
    section: 'Section A',
    role: 'Active Member',
    photo: DEFAULT_AVATAR,
    email: 'jcperez@ub.edu.ph'
  },
  {
    id: '2024-00412',
    rfidUid: '1083920195',
    name: 'Alyssa Nicole M. Torrefiel',
    program: 'BS Computer Science',
    yearLevel: '1st Year',
    section: 'Section B',
    role: 'Freshman Representative',
    photo: DEFAULT_AVATAR,
    email: 'antorrefiel@ub.edu.ph'
  },
  {
    id: '2022-00819',
    rfidUid: '1083920196',
    name: 'Arthur Sjorgen B. Ramos',
    program: 'BS Computer Science',
    yearLevel: '4th Year',
    section: 'Section A',
    role: 'Executive Vice President',
    photo: DEFAULT_AVATAR,
    email: 'asramos@ub.edu.ph'
  },
  {
    id: '2023-02104',
    rfidUid: '1083920197',
    name: 'Bea Maureen G. Alcantara',
    program: 'BS Computer Science',
    yearLevel: '3rd Year',
    section: 'Section B',
    role: 'Committee Chair (Events)',
    photo: DEFAULT_AVATAR,
    email: 'bmalcantara@ub.edu.ph'
  },
  {
    id: '2023-00941',
    rfidUid: '1083920198',
    name: 'Mark Anthony B. Solis',
    program: 'BS Computer Science',
    yearLevel: '3rd Year',
    section: 'Section A',
    role: 'Active Member',
    photo: DEFAULT_AVATAR,
    email: 'masolis@ub.edu.ph'
  },
  {
    id: '2024-01289',
    rfidUid: '1083920199',
    name: 'Gabriel Ian P. Sanchez',
    program: 'BS Computer Science',
    yearLevel: '1st Year',
    section: 'Section A',
    role: 'Active Member',
    photo: DEFAULT_AVATAR,
    email: 'gipsanchez@ub.edu.ph'
  },
  {
    id: '2022-00431',
    rfidUid: '1083920200',
    name: 'Kathryn Claire D. Lim',
    program: 'BS Computer Science',
    yearLevel: '4th Year',
    section: 'Section B',
    role: 'Secretary General',
    photo: DEFAULT_AVATAR,
    email: 'kcdlim@ub.edu.ph'
  },
  {
    id: '2023-01872',
    rfidUid: '1083920201',
    name: 'Renz Matthew K. Ong',
    program: 'BS Computer Science',
    yearLevel: '2nd Year',
    section: 'Section A',
    role: 'Active Member',
    photo: DEFAULT_AVATAR,
    email: 'rmong@ub.edu.ph'
  },
  {
    id: '2024-00109',
    rfidUid: '1083920202',
    name: 'Dave Russel C. Flores',
    program: 'BS Computer Science',
    yearLevel: '1st Year',
    section: 'Section C',
    role: 'Active Member',
    photo: DEFAULT_AVATAR,
    email: 'drcflores@ub.edu.ph'
  },
  {
    id: '2021-00305',
    rfidUid: '1083920203',
    name: 'Fiona Therese E. Tan',
    program: 'BS Computer Science',
    yearLevel: '4th Year',
    section: 'Section A',
    role: 'President - UByTeS',
    photo: DEFAULT_AVATAR,
    email: 'fttan@ub.edu.ph'
  },
  {
    id: '2023-00567',
    rfidUid: '1083920204',
    name: 'Lance Patrick S. Garcia',
    program: 'BS Computer Science',
    yearLevel: '2nd Year',
    section: 'Section B',
    role: 'Treasurer',
    photo: DEFAULT_AVATAR,
    email: 'lpsgarcia@ub.edu.ph'
  },
  {
    id: '2024-00891',
    rfidUid: '1083920205',
    name: 'Krizzia Mae L. Villamor',
    program: 'BS Computer Science',
    yearLevel: '1st Year',
    section: 'Section A',
    role: 'Active Member',
    photo: DEFAULT_AVATAR,
    email: 'kmlvillamor@ub.edu.ph'
  }
];

export const getTodayDateFormatted = (): string => {
  return new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

export const INITIAL_EVENTS: EventSession[] = [
  {
    id: 'evt-ga-2026',
    title: 'General Assembly & Tech Symposium 2026',
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00 AM',
    lateThreshold: '08:15 AM',
    location: 'UB Science Complex & Auditorium',
    description: 'Annual gathering of all BSCS students, organization report, project demos, and keynote speaker.',
    status: 'Active',
    daysLeft: 0
  },
  {
    id: 'evt-codecamp',
    title: 'CodeCamp 2026: Algorithm Battle',
    date: '2026-09-22',
    startTime: '09:00 AM',
    lateThreshold: '09:15 AM',
    location: 'UB Computer Lab 402 & 403',
    description: 'Competitive programming and algorithm contest for junior and senior BSCS students.',
    status: 'Upcoming',
    daysLeft: 6
  },
  {
    id: 'evt-tech-symp',
    title: 'AI & Full-Stack Modernization Summit',
    date: '2026-09-25',
    startTime: '01:00 PM',
    lateThreshold: '01:15 PM',
    location: 'Engineering Amphitheater',
    description: 'Technical workshop covering modern AI integrations, React, and cloud native architecture.',
    status: 'Upcoming',
    daysLeft: 9
  },
  {
    id: 'evt-outreach',
    title: 'Community Outreach & Digital Literacy Drive',
    date: '2026-10-10',
    startTime: '08:00 AM',
    lateThreshold: '08:30 AM',
    location: 'Barangay Bool High School',
    description: 'Volunteer teaching computer literacy and basic programming to high school students.',
    status: 'Upcoming',
    daysLeft: 24
  }
];

export const INITIAL_ATTENDANCE: AttendanceRecord[] = [];

