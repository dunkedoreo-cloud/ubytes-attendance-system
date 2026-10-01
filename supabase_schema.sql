-- ==============================================================================
-- YOUNG THINKERS SOCIETY (UByTeS) - SUPABASE DATABASE SCHEMA
-- University of Bohol - BS Computer Science
-- ==============================================================================

-- 1. Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Master Students Table
CREATE TABLE IF NOT EXISTS public.students (
    id TEXT PRIMARY KEY,                       -- e.g. '2023-01492'
    rfid_uid TEXT UNIQUE,                      -- Physical card UID, nullable for newly enrolled students (auto-paired on tap)
    name TEXT NOT NULL,                        -- Full Name
    program TEXT NOT NULL DEFAULT 'BS Computer Science',
    year_level TEXT NOT NULL,                  -- '1st Year', '2nd Year', '3rd Year', '4th Year'
    role TEXT NOT NULL DEFAULT 'Active Member',-- 'Officer', 'Active Member', 'Lead Organizer'
    photo TEXT,                                -- URL to avatar photo
    email TEXT,                                -- University email
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Migration safety: ensure rfid_uid is nullable for embedded cards & drop unused section column
ALTER TABLE public.students ALTER COLUMN rfid_uid DROP NOT NULL;
ALTER TABLE public.students DROP COLUMN IF EXISTS section;

-- 3. Events & Sessions Table
CREATE TABLE IF NOT EXISTS public.events (
    id TEXT PRIMARY KEY,                       -- e.g. 'evt-ga-2026'
    title TEXT NOT NULL,                       -- e.g. 'General Assembly & Tech Symposium 2026'
    date TEXT NOT NULL,                        -- e.g. '16 Sep 2026'
    start_time TEXT NOT NULL,                  -- e.g. '08:00 AM'
    end_time TEXT NOT NULL,                    -- e.g. '12:00 PM'
    venue TEXT NOT NULL,                       -- e.g. 'UB Main Auditorium'
    late_threshold TEXT NOT NULL,              -- e.g. '08:30 AM'
    status TEXT NOT NULL DEFAULT 'Active',     -- 'Active', 'Upcoming', 'Completed'
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Attendance Records Table
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id TEXT PRIMARY KEY,                       -- e.g. 'att-1726482910'
    student_id TEXT NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    program TEXT NOT NULL,
    year_level TEXT NOT NULL,
    event_id TEXT NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    event_name TEXT NOT NULL,
    date TEXT NOT NULL,
    time_in TEXT NOT NULL,                     -- e.g. '08:15:24 AM'
    time_out TEXT,                             -- e.g. '05:00:12 PM'
    status TEXT NOT NULL,                      -- 'On-Time', 'Late'
    photo TEXT,
    synced_to_sheets BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_student_session UNIQUE (student_id, event_id)
);

-- Migration safety for existing installations
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS time_out TEXT;
ALTER TABLE public.attendance_records DROP COLUMN IF EXISTS section;

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies for Anon Key (Public Kiosk Access)
CREATE POLICY "Allow public read students" ON public.students FOR SELECT USING (true);
CREATE POLICY "Allow public insert students" ON public.students FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update students" ON public.students FOR UPDATE USING (true);
CREATE POLICY "Allow public delete students" ON public.students FOR DELETE USING (true);

CREATE POLICY "Allow public read events" ON public.events FOR SELECT USING (true);
CREATE POLICY "Allow public insert events" ON public.events FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update events" ON public.events FOR UPDATE USING (true);
CREATE POLICY "Allow public delete events" ON public.events FOR DELETE USING (true);

CREATE POLICY "Allow public read attendance" ON public.attendance_records FOR SELECT USING (true);
CREATE POLICY "Allow public insert attendance" ON public.attendance_records FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update attendance" ON public.attendance_records FOR UPDATE USING (true);
CREATE POLICY "Allow public delete attendance" ON public.attendance_records FOR DELETE USING (true);

-- 7. Enable Supabase Realtime for Multi-Device Live Sync
ALTER PUBLICATION supabase_realtime ADD TABLE public.attendance_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.students;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events;

-- 8. Seed Initial Event Session
INSERT INTO public.events (id, title, date, start_time, end_time, venue, late_threshold, status)
VALUES (
    'evt-ga-2026',
    'General Assembly & Tech Symposium 2026',
    '16 Sep 2026',
    '08:00 AM',
    '12:00 PM',
    'University of Bohol Gym / Main Auditorium',
    '08:30 AM',
    'Active'
) ON CONFLICT (id) DO NOTHING;

-- 9. Seed Registered Students Roster
INSERT INTO public.students (id, rfid_uid, name, program, year_level, section, role, photo, email)
VALUES
    ('2023-01492', '0008439201', 'John Christian D. Perez', 'BS Computer Science', '3rd Year', 'Section A', 'Active Member', '/default_avatar.jpg', 'jperez@ub.edu.ph'),
    ('2023-00941', '0009182374', 'Mark Anthony B. Solis', 'BS Computer Science', '3rd Year', 'Section A', 'Vice President - Internal', '/default_avatar.jpg', 'msolis@ub.edu.ph'),
    ('2024-00412', '0007261543', 'Alyssa Nicole M. Torrefiel', 'BS Computer Science', '1st Year', 'Section B', 'Active Member', '/default_avatar.jpg', 'atorrefiel@ub.edu.ph'),
    ('2022-00819', '0006351982', 'Arthur Sjorgen B. Ramos', 'BS Computer Science', '4th Year', 'Section A', 'President / Executive Officer', '/default_avatar.jpg', 'asjorgen@ub.edu.ph'),
    ('2023-02104', '0004918273', 'Bea Maureen G. Alcantara', 'BS Computer Science', '3rd Year', 'Section B', 'Secretary', '/default_avatar.jpg', 'balcantara@ub.edu.ph'),
    ('2024-01289', '0003829104', 'Gabriel Ian P. Sanchez', 'BS Computer Science', '1st Year', 'Section A', 'Active Member', '/default_avatar.jpg', 'gsanchez@ub.edu.ph'),
    ('2022-00431', '0005739281', 'Kathryn Claire D. Lim', 'BS Computer Science', '4th Year', 'Section A', 'Treasurer', '/default_avatar.jpg', 'klim@ub.edu.ph'),
    ('2023-01872', '0002847192', 'Renz Matthew K. Ong', 'BS Computer Science', '2nd Year', 'Section A', 'Auditor', '/default_avatar.jpg', 'rong@ub.edu.ph')
ON CONFLICT (id) DO NOTHING;
