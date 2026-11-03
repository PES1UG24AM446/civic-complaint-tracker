DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'civic_citizen') THEN
    CREATE ROLE civic_citizen NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'civic_officer') THEN
    CREATE ROLE civic_officer NOLOGIN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'civic_admin') THEN
    CREATE ROLE civic_admin NOLOGIN;
  END IF;
END $$;

REVOKE ALL ON SCHEMA public FROM PUBLIC;
GRANT USAGE ON SCHEMA public TO civic_citizen, civic_officer, civic_admin;
GRANT SELECT ON TABLE departments, categories, sla_rules TO civic_citizen;
GRANT SELECT, INSERT ON TABLE complaints TO civic_citizen;
GRANT SELECT ON TABLE complaint_history, escalations TO civic_officer;
GRANT UPDATE (status, assigned_officer_id) ON TABLE complaints TO civic_officer;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO civic_admin;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO civic_admin;

ALTER TABLE complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY complaints_citizen_own_rows
  ON complaints
  FOR ALL
  TO civic_citizen
  USING (citizen_id = current_setting('app.user_id', true)::int)
  WITH CHECK (citizen_id = current_setting('app.user_id', true)::int);

CREATE POLICY complaints_officer_dept_rows
  ON complaints
  FOR SELECT
  TO civic_officer
  USING (
    EXISTS (
      SELECT 1
      FROM categories cat
      WHERE cat.category_id = complaints.category_id
        AND cat.dept_id = current_setting('app.dept_id', true)::int
    )
  );

CREATE POLICY complaints_admin_all_rows
  ON complaints
  FOR ALL
  TO civic_admin
  USING (true)
  WITH CHECK (true);

ALTER TABLE complaints FORCE ROW LEVEL SECURITY;
