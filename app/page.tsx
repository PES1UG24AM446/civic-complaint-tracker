import Link from 'next/link';
import { db } from '@/lib/db';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const result = await db.query(
    `SELECT
       COUNT(*) FILTER (
         WHERE status NOT IN ('resolved', 'closed')
       )::int AS open_issues,
       COUNT(*) FILTER (
         WHERE status NOT IN ('resolved', 'closed')
           AND sla_deadline <= now() + interval '24 hours'
       )::int AS at_risk,
       COUNT(*) FILTER (WHERE escalation_level > 0)::int AS escalated
     FROM complaints;`
  );
  const stats = result.rows[0];

  return (
    <main className="shell">
      <section className="hero">
        <p className="eyebrow">Civic Complaint & Incident Tracking System</p>
        <h1>Citizen-first service with SLA escalation</h1>
        <p>
          Track civic issues, enforce departmental ownership, and escalate overdue complaints
          automatically before service deadlines are missed.
        </p>
        <div className="actions">
          <Link href="/complaints" className="button primary">View complaints</Link>
          <Link href="/officer" className="button secondary">Officer dashboard</Link>
        </div>
      </section>

      <section className="grid stats">
        <div className="card">
          <span>Open issues</span>
          <strong>{stats.open_issues}</strong>
        </div>
        <div className="card">
          <span>At risk</span>
          <strong>{stats.at_risk}</strong>
        </div>
        <div className="card">
          <span>Escalated</span>
          <strong>{stats.escalated}</strong>
        </div>
      </section>
    </main>
  );
}
