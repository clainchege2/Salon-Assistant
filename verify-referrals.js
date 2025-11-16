const { MongoClient } = require('mongodb');

async function verify() {
  const client = new MongoClient('mongodb://127.0.0.1:27017');
  await client.connect();
  
  const db = client.db('hairvia');
  const clients = await db.collection('clients').find({}, {
    referralSource: 1,
    firstName: 1
  }).limit(15).toArray();
  
  console.log('\n📊 Sample Clients with Referral Sources:\n');
  clients.forEach(c => {
    console.log(`   ${c.firstName}: ${c.referralSource || 'not set'}`);
  });
  
  // Count by referral source
  const referralCounts = await db.collection('clients').aggregate([
    { $group: { _id: '$referralSource', count: { $sum: 1 } } },
    { $sort: { count: -1 } }
  ]).toArray();
  
  console.log('\n📈 Referral Source Distribution:\n');
  referralCounts.forEach(r => {
    console.log(`   ${r._id || 'not set'}: ${r.count} clients`);
  });
  
  await client.close();
}

verify();
