const admin = require('firebase-admin');
const serviceAccount = require('./service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function checkImageQueue() {
  const presentationId = 'SRwGAsOfUvy6dCtvvAmn';
  
  console.log(`\nChecking image queue for presentation: ${presentationId}\n`);
  
  const snapshot = await db.collection('imageGenerationQueue')
    .where('presentationId', '==', presentationId)
    .get();
  
  console.log(`Found ${snapshot.size} jobs in queue:\n`);
  
  const statusCounts = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  };
  
  snapshot.forEach(doc => {
    const data = doc.data();
    statusCounts[data.status]++;
    console.log(`Job ${doc.id}:`);
    console.log(`  Status: ${data.status}`);
    console.log(`  Slide: ${data.slideId}`);
    if (data.imageUrls) {
      console.log(`  Images: ${data.imageUrls.length} variants`);
    }
    if (data.error) {
      console.log(`  Error: ${data.error}`);
    }
    console.log('');
  });
  
  console.log('\nSummary:');
  console.log(`  Pending: ${statusCounts.pending}`);
  console.log(`  Processing: ${statusCounts.processing}`);
  console.log(`  Completed: ${statusCounts.completed}`);
  console.log(`  Failed: ${statusCounts.failed}`);
  console.log(`  Total: ${snapshot.size}`);
  
  process.exit(0);
}

checkImageQueue().catch(console.error);