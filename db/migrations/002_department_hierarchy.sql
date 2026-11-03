ALTER TABLE departments
  ADD COLUMN IF NOT EXISTS parent_dept_id INT REFERENCES departments(dept_id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conrelid = 'departments'::regclass
      AND conname = 'chk_department_parent'
  ) THEN
    ALTER TABLE departments
      ADD CONSTRAINT chk_department_parent
      CHECK (parent_dept_id IS NULL OR parent_dept_id <> dept_id);
  END IF;
END $$;

CREATE OR REPLACE VIEW v_department_tree AS
WITH RECURSIVE dept_tree AS (
  SELECT d.dept_id,
         d.name,
         d.parent_dept_id,
         0 AS depth,
         d.name::text AS path
  FROM departments d
  WHERE d.parent_dept_id IS NULL

  UNION ALL

  SELECT d.dept_id,
         d.name,
         d.parent_dept_id,
         dt.depth + 1,
         dt.path || ' > ' || d.name
  FROM departments d
  JOIN dept_tree dt ON d.parent_dept_id = dt.dept_id
)
SELECT dept_id, name, parent_dept_id, depth, path
FROM dept_tree
ORDER BY path;
