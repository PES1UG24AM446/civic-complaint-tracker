-- Re-runnable DDL demonstration for DBMS report evidence.
-- This file intentionally touches only a scratch table so it does not modify production schema.

DROP TABLE IF EXISTS demo_notice_board;
DROP VIEW IF EXISTS demo_notice_board_summary;

CREATE TABLE demo_notice_board (
  notice_id SERIAL PRIMARY KEY,
  title VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE demo_notice_board ADD COLUMN category VARCHAR(50);
ALTER TABLE demo_notice_board
  ADD CONSTRAINT chk_demo_notice_board_status
  CHECK (status IN ('draft', 'published', 'archived'));

ALTER TABLE demo_notice_board DROP CONSTRAINT IF EXISTS chk_demo_notice_board_status;

CREATE INDEX idx_demo_notice_board_status ON demo_notice_board(status);
DROP INDEX IF EXISTS idx_demo_notice_board_status;

CREATE VIEW demo_notice_board_summary AS
SELECT notice_id, title, status FROM demo_notice_board;

DROP VIEW IF EXISTS demo_notice_board_summary;
DROP TABLE IF EXISTS demo_notice_board;
