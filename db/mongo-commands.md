# MongoDB operations used by the civic complaint tracker

These commands mirror the application’s MongoDB workflows for incident and comment storage.

```javascript
// 1) insert incident
use civic_db;
db.incidents.insertOne({
  description: 'Streetlight outage on Main Road',
  location: 'Ward 4',
  created_at: new Date()
});

// 2) find incident by id
const incident = db.incidents.findOne({ description: /streetlight/i });

// 3) update incident location
 db.incidents.updateOne(
  { _id: incident._id },
  { $set: { location: 'Ward 5', updated_at: new Date() } }
);

// 4) delete incident
 db.incidents.deleteOne({ _id: incident._id });

// 5) insert comment
 db.comments.insertOne({
  complaint_id: 101,
  user_id: 42,
  user_name: 'Citizen One',
  body: 'Thanks for looking into this issue.',
  created_at: new Date()
});

// 6) find comments for a complaint
 db.comments.find({ complaint_id: 101 }).sort({ created_at: 1 });

// 7) update comment body
 db.comments.updateOne(
  { complaint_id: 101, user_id: 42 },
  { $set: { body: 'Updated comment body', edited_at: new Date() } }
);

// 8) delete comment
 db.comments.deleteOne({ complaint_id: 101, user_id: 42 });

// 9) aggregation: comments per complaint
 db.comments.aggregate([
  { $group: { _id: '$complaint_id', comment_count: { $sum: 1 } } },
  { $sort: { comment_count: -1 } },
  { $limit: 10 }
 ]);

// 10) aggregation: incidents by month
 db.incidents.aggregate([
  {
    $group: {
      _id: { $dateToString: { format: '%Y-%m', date: '$created_at' } },
      count: { $sum: 1 }
    }
  },
  { $sort: { _id: 1 } }
 ]);

// 11) create index
 db.comments.createIndex({ complaint_id: 1, created_at: -1 });
 db.incidents.createIndex({ description: 'text', location: 'text' });
 db.incidents.createIndex({ created_at: -1 });
```
