-- ============================================================
-- BBS Dummy Data for Dashboard Testing
-- Run: mysql -u root trucking < bbs_dummy_data.sql
-- ============================================================

-- Clear existing test data
DELETE FROM bbs_observations;
DELETE FROM bbs_checklists;
DELETE FROM bbs_incidents;

-- ============================================================
-- OBSERVATIONS — 6 months of varied data
-- ============================================================

-- Jan 2026: 3 observasi, mostly safe
INSERT INTO bbs_observations (id_admin, observer_name, driver_id, date, location, vehicle_type, scores, feedback, follow_up) VALUES
(2, 'Sri Sudrajat', '112985', '2026-01-15', 'Gudang Utama', 'Fuso', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '112982', '2026-01-20', 'Terminal A', 'CDD', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '112990', '2026-01-25', 'Pool', 'Fuso Box', '{"o1":"aman","o2":"berisiko","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Tegur speed', 'Pantau');

-- Feb 2026: 4 observasi, 2 safe 2 risky
INSERT INTO bbs_observations (id_admin, observer_name, driver_id, date, location, vehicle_type, scores, feedback, follow_up) VALUES
(2, 'Sri Sudrajat', '112985', '2026-02-05', 'Gudang Utama', 'Fuso', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '113001', '2026-02-10', 'Terminal B', 'CDD', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '112990', '2026-02-15', 'Pool', 'Fuso Box', '{"o1":"aman","o2":"berbahaya","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Ngebut!', 'Suratin'),
(2, 'Sri Sudrajat', '113015', '2026-02-20', 'Site C', 'Tronton', '{"o1":"berisiko","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Sabuk', 'Edukasi');

-- Mar 2026: 5 observasi, 3 safe 2 risky
INSERT INTO bbs_observations (id_admin, observer_name, driver_id, date, location, vehicle_type, scores, feedback, follow_up) VALUES
(2, 'Sri Sudrajat', '112985', '2026-03-02', 'Gudang Utama', 'Fuso', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '113001', '2026-03-08', 'Terminal A', 'CDD', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '112990', '2026-03-12', 'Pool', 'Fuso Box', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '113015', '2026-03-18', 'Site C', 'Tronton', '{"o1":"aman","o2":"berisiko","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Speed', 'Pantau'),
(2, 'Sri Sudrajat', '112985', '2026-03-25', 'Gudang Utama', 'Fuso', '{"o1":"aman","o2":"aman","o3":"aman","o4":"berbahaya","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'HP saat nyetir', 'Teguran');

-- Apr 2026: 4 observasi, 1 safe 3 risky  
INSERT INTO bbs_observations (id_admin, observer_name, driver_id, date, location, vehicle_type, scores, feedback, follow_up) VALUES
(2, 'Sri Sudrajat', '113001', '2026-04-03', 'Terminal B', 'CDD', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '112990', '2026-04-08', 'Pool', 'Fuso Box', '{"o1":"berisiko","o2":"berisiko","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Sabuk+speed', 'Edukasi'),
(2, 'Sri Sudrajat', '113015', '2026-04-14', 'Site C', 'Tronton', '{"o1":"aman","o2":"aman","o3":"aman","o4":"berbahaya","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'HP', 'Surat'),
(2, 'Sri Sudrajat', '112985', '2026-04-22', 'Gudang Utama', 'Fuso', '{"o1":"aman","o2":"berbahaya","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Ngebut parah', 'Skorsing');

-- May 2026: 6 observasi, 3 safe 3 risky
INSERT INTO bbs_observations (id_admin, observer_name, driver_id, date, location, vehicle_type, scores, feedback, follow_up) VALUES
(2, 'Sri Sudrajat', '112985', '2026-05-02', 'Gudang Utama', 'Fuso', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '113001', '2026-05-07', 'Terminal A', 'CDD', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '112990', '2026-05-11', 'Pool', 'Fuso Box', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '113015', '2026-05-16', 'Site C', 'Tronton', '{"o1":"aman","o2":"berisiko","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Speed', 'Pantau'),
(2, 'Sri Sudrajat', '112985', '2026-05-21', 'Gudang Utama', 'Fuso', '{"o1":"aman","o2":"aman","o3":"aman","o4":"berisiko","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'HP', 'Tegur'),
(2, 'Sri Sudrajat', '113001', '2026-05-28', 'Terminal B', 'CDD', '{"o1":"aman","o2":"berbahaya","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Ngebut', 'Suratin');

-- Jun 2026: 5 observasi, 2 safe 3 risky (current month)
INSERT INTO bbs_observations (id_admin, observer_name, driver_id, date, location, vehicle_type, scores, feedback, follow_up) VALUES
(2, 'Sri Sudrajat', '112985', '2026-06-03', 'Gudang Utama', 'Fuso', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '113001', '2026-06-08', 'Terminal A', 'CDD', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-'),
(2, 'Sri Sudrajat', '112990', '2026-06-11', 'Pool', 'Fuso Box', '{"o1":"aman","o2":"berisiko","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Speed', 'Pantau'),
(2, 'Sri Sudrajat', '113015', '2026-06-15', 'Site C', 'Tronton', '{"o1":"aman","o2":"aman","o3":"aman","o4":"berbahaya","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'HP saat nyetir', 'Suratin'),
(2, 'Sri Sudrajat', '112985', '2026-06-17', 'Gudang Utama', 'Fuso', '{"o1":"aman","o2":"aman","o3":"aman","o4":"aman","o5":"aman","o6":"aman","o7":"aman","o8":"aman"}', 'Baik', '-');

-- ============================================================
-- CHECKLISTS — 4 sample entries
-- ============================================================
INSERT INTO bbs_checklists (id_admin, driver_id, plate_number, date, items, score, status) VALUES
(2, '112985', 'B 1234 ABC', '2026-06-01', '{"m1":"safe","m2":"safe","m3":"safe","m4":"unsafe","m5":"safe","s1":"safe","s2":"safe","s3":"safe","s4":"safe","s5":"safe","s6":"safe","e1":"safe","e2":"safe","e3":"safe","e4":"safe","e5":"safe"}', 94, 'passed'),
(2, '113001', 'B 5678 DEF', '2026-06-05', '{"m1":"safe","m2":"safe","m3":"unsafe","m4":"unsafe","m5":"safe","s1":"safe","s2":"safe","s3":"safe","s4":"safe","s5":"unsafe","s6":"safe","e1":"safe","e2":"safe","e3":"safe","e4":"safe","e5":"safe"}', 81, 'passed'),
(2, '112990', 'B 9012 GHI', '2026-06-10', '{"m1":"safe","m2":"safe","m3":"safe","m4":"safe","m5":"safe","s1":"safe","s2":"safe","s3":"safe","s4":"safe","s5":"safe","s6":"safe","e1":"safe","e2":"safe","e3":"safe","e4":"safe","e5":"safe"}', 100, 'passed'),
(2, '113015', 'B 3456 JKL', '2026-06-14', '{"m1":"safe","m2":"unsafe","m3":"unsafe","m4":"unsafe","m5":"unsafe","s1":"safe","s2":"safe","s3":"safe","s4":"safe","s5":"safe","s6":"safe","e1":"safe","e2":"safe","e3":"safe","e4":"safe","e5":"safe"}', 69, 'needs_fix');

-- ============================================================
-- INCIDENTS — 4 entries (3 Near-Miss + 1 Berat)
-- ============================================================
INSERT INTO bbs_incidents (id_admin, reporter_name, date, type, location, plate_number, chronology, factors, casualties, recommendations) VALUES
(2, 'Sri Sudrajat', '2026-05-10', 'Near-Miss', 'Simpang Tiga', 'B 1234 ABC', 'Hampir tabrakan dengan motor', '["human_error","distraction"]', 'Tidak ada korban', 'Briefing safety'),
(2, 'Sri Sudrajat', '2026-05-22', 'Near-Miss', 'Jalan Raya Merdeka', 'B 5678 DEF', 'Rem mendadak karena potongan ban truk di depan', '["environment","technical"]', 'Tidak ada korban', 'Periksa jarak aman'),
(2, 'Sri Sudrajat', '2026-06-05', 'Near-Miss', 'Terminal A', 'B 9012 GHI', 'Hampir tertabrak forklift saat bongkar muat', '["human_error","procedure"]', 'Tidak ada korban', 'SOP bongkar muat'),
(2, 'Sri Sudrajat', '2026-06-12', 'Insiden Berat', 'Jalan Tol', 'B 3456 JKL', 'Menabrak pembatas jalan karena pecah ban', '["technical","fatigue"]', '1 sopir luka ringan', 'Investigasi lanjutan');

-- ============================================================
-- Summary for verification
-- ============================================================
SELECT '=== DATA COUNT ===' AS '';
SELECT CONCAT('Observations: ', COUNT(*)) FROM bbs_observations;
SELECT CONCAT('Checklists: ', COUNT(*)) FROM bbs_checklists;
SELECT CONCAT('Incidents: ', COUNT(*)) FROM bbs_incidents;
