# Evidence bundle

This directory collects the project evidence required for the DBMS Level 3 submission.

## Included artifacts
- `ddl-log.txt` — PostgreSQL schema and migration verification notes
- `escalation-log.txt` — overdue escalation trigger/procedure check
- `mongo-summary.json` — sample MongoDB comment aggregation summary
- `tree-output.txt` — project tree snapshot for review
- `status.md` — current environment validation status and limitations
- `final-project-report.docx` — Word report bundle generated from the project summary

## Live database outputs
The DDL log was generated against a disposable PostgreSQL database, and the integration suite passed against local PostgreSQL and MongoDB services. The test runner creates and removes its PostgreSQL database and cleans up its own MongoDB test documents.

- `npm run ddl-demo`
- `npm run test:integration`

`npm run escalate` changes overdue records in the configured database. Run it only against a disposable/demo database; the existing `civic_db` was deliberately left unchanged.

The screenshot set already lives in the parent `docs/` folder and is referenced in the project report.
