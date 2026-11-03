import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import { Client } from 'pg';
import nextEnv from '@next/env';

nextEnv.loadEnvConfig(process.cwd());
const databaseUrl = process.env.DATABASE_URL;
const mongoUri = process.env.MONGODB_URI;
const seedPassword = process.env.SEED_PASSWORD;

if (!databaseUrl || !mongoUri || !seedPassword) {
  throw new Error('Set DATABASE_URL, MONGODB_URI, and SEED_PASSWORD before running the demo seed script.');
}
if (process.env.NODE_ENV === 'production') {
  throw new Error('The seed script must not run in production.');
}
if (Buffer.byteLength(seedPassword, 'utf8') > 72) {
  throw new Error('SEED_PASSWORD must not exceed 72 UTF-8 bytes.');
}

async function main() {
  const pg = new Client({ connectionString: databaseUrl });
  const mongo = new MongoClient(mongoUri, { serverSelectionTimeoutMS: 5000 });
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  await pg.connect();
  await mongo.connect();

  try {
    await pg.query('BEGIN');

    const deptRows = await pg.query(
      `INSERT INTO departments (name, parent_dept_id)
       VALUES ('Municipal Services', NULL), ('Water & Sanitation', 1), ('Roads & Transport', NULL), ('Public Health', 1)
       ON CONFLICT (name) DO NOTHING
       RETURNING dept_id, name;`
    );

    const municipal = deptRows.rows.find((row) => row.name === 'Municipal Services') ?? (await pg.query("SELECT dept_id FROM departments WHERE name = 'Municipal Services';")).rows[0];
    const sanitation = deptRows.rows.find((row) => row.name === 'Water & Sanitation') ?? (await pg.query("SELECT dept_id FROM departments WHERE name = 'Water & Sanitation';")).rows[0];
    const roads = deptRows.rows.find((row) => row.name === 'Roads & Transport') ?? (await pg.query("SELECT dept_id FROM departments WHERE name = 'Roads & Transport';")).rows[0];
    const health = deptRows.rows.find((row) => row.name === 'Public Health') ?? (await pg.query("SELECT dept_id FROM departments WHERE name = 'Public Health';")).rows[0];

    const categoryInsert = [
      ['Waste Collection', municipal.dept_id],
      ['Water Supply', sanitation.dept_id],
      ['Road Repairs', roads.dept_id],
      ['Sanitation', sanitation.dept_id],
      ['Public Health', health.dept_id],
    ];
    for (const [name, deptId] of categoryInsert) {
      await pg.query(
        'INSERT INTO categories (name, dept_id) VALUES ($1, $2) ON CONFLICT (name) DO NOTHING;',
        [name, deptId]
      );
    }

    const deptList = await pg.query('SELECT dept_id, name FROM departments ORDER BY dept_id;');
    const categories = await pg.query('SELECT category_id, name, dept_id FROM categories ORDER BY category_id;');

    await pg.query(
      `INSERT INTO users (name, email, password_hash, role, dept_id)
       VALUES
         ('Demo Admin', 'admin.demo@example.test', $1, 'admin', NULL),
         ('Officer One', 'officer1.demo@example.test', $1, 'officer', $2),
         ('Officer Two', 'officer2.demo@example.test', $1, 'officer', $3),
         ('Citizen One', 'citizen1.demo@example.test', $1, 'citizen', NULL),
         ('Citizen Two', 'citizen2.demo@example.test', $1, 'citizen', NULL),
         ('Citizen Three', 'citizen3.demo@example.test', $1, 'citizen', NULL),
         ('Citizen Four', 'citizen4.demo@example.test', $1, 'citizen', NULL),
         ('Citizen Five', 'citizen5.demo@example.test', $1, 'citizen', NULL)
       ON CONFLICT (email) DO NOTHING;`,
      [passwordHash, deptList.rows[0]?.dept_id ?? municipal.dept_id, deptList.rows[1]?.dept_id ?? sanitation.dept_id]
    );

    const userLookup = await pg.query('SELECT user_id, email, role, dept_id FROM users WHERE email LIKE \'%.demo@example.test\' ORDER BY user_id;');
    const adminId = userLookup.rows.find((row) => row.role === 'admin')?.user_id;
    const officerIds = userLookup.rows.filter((row) => row.role === 'officer').map((row) => row.user_id);
    const citizenIds = userLookup.rows.filter((row) => row.role === 'citizen').map((row) => row.user_id);

    const complaintTemplates = [
      ['Broken streetlight near bus stand', 'Road Repairs', 'high', 'open'],
      ['Water contamination at the quarter', 'Water Supply', 'critical', 'open'],
      ['Garbage overflow in market lane', 'Waste Collection', 'medium', 'assigned'],
      ['Blocked storm drain causing puddles', 'Sanitation', 'high', 'in_progress'],
      ['Mosquito breeding near public park', 'Public Health', 'medium', 'open'],
      ['Pothole on main road', 'Road Repairs', 'high', 'assigned'],
      ['No water supply for 3 days', 'Water Supply', 'critical', 'open'],
      ['Overflowing garbage bin near school', 'Waste Collection', 'medium', 'resolved'],
      ['Street drain blocked', 'Sanitation', 'low', 'open'],
      ['Powerless streetlight', 'Road Repairs', 'medium', 'open'],
    ];

    for (let index = 0; index < complaintTemplates.length; index += 1) {
      const [title, categoryName, priority, status] = complaintTemplates[index];
      const category = categories.rows.find((row) => row.name === categoryName);
      const citizenId = citizenIds[index % citizenIds.length];
      const incident = await mongo.db('civic_db').collection('incidents').insertOne({
        description: `${title}. The issue was reported by a demo citizen and needs inspection.`,
        location: `Demo location ${index + 1}`,
        created_at: new Date(Date.now() - (index + 1) * 86400000),
      });
      const insertResult = await pg.query(
        `INSERT INTO complaints (citizen_id, category_id, title, mongo_doc_id, priority, status, assigned_officer_id, escalation_level, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, now() - ($9 || ' hours')::interval)
         RETURNING complaint_id;`,
        [citizenId, category.category_id, title, incident.insertedId.toHexString(), priority, status, officerIds[index % officerIds.length], index % 3, 12 + index * 2]
      );
      if (index % 2 === 0) {
        await mongo.db('civic_db').collection('comments').insertOne({
          complaint_id: insertResult.rows[0].complaint_id,
          user_id: officerIds[index % officerIds.length],
          user_name: 'Officer Demo',
          body: 'This issue has been logged and assigned to the relevant team.',
          created_at: new Date(Date.now() - 3600000),
        });
      }
      if (index % 3 === 0) {
        await mongo.db('civic_db').collection('comments').insertOne({
          complaint_id: insertResult.rows[0].complaint_id,
          user_id: citizenId,
          user_name: 'Citizen Demo',
          body: 'Please share an update on the status of this complaint.',
          created_at: new Date(Date.now() - 1800000),
        });
      }
    }

    await pg.query('COMMIT');
    console.log(`Seeded departments, categories, roles, and ${complaintTemplates.length} demo complaints.`);
  } catch (error) {
    await pg.query('ROLLBACK').catch(() => {});
    throw error;
  } finally {
    await mongo.close();
    await pg.end();
  }
}

main().catch((error) => {
  console.error('Demo seed failed:', error);
  process.exitCode = 1;
});
