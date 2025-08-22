import { initializeApp } from 'firebase/app';
import { getFirestore, collection, query, where, getDocs, orderBy } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyBE7r4tJC-XUQBX3V4hPWBG5YTPCFjJJBE",
  authDomain: "phoenix-web-app.firebaseapp.com",
  projectId: "phoenix-web-app",
  storageBucket: "phoenix-web-app.firebasestorage.app",
  messagingSenderId: "222975677244",
  appId: "1:222975677244:web:f3c2fdc2b079f1e2bb2dc6",
  measurementId: "G-D9PW7C8HJH"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function checkRecentPresentations() {
  // Check specific presentation from server logs
  const targetId = 'SRwGAsOfUvy6dCtvvAmn';
  console.log(`\nChecking specific presentation: ${targetId}\n`);
  
  const queueRef = collection(db, 'imageGenerationQueue');
  const imageQuery = query(queueRef, where('presentationId', '==', targetId));
  
  const imageSnapshot = await getDocs(imageQuery);
  
  if (imageSnapshot.empty) {
    console.log('  No image jobs found for this presentation');
  } else {
    const statusCounts = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };
    
    const jobs = [];
    imageSnapshot.forEach(doc => {
      const data = doc.data();
      statusCounts[data.status]++;
      jobs.push({
        id: doc.id,
        status: data.status,
        slideId: data.slideId,
        hasImages: !!data.imageUrls,
        imageCount: data.imageUrls?.length || 0
      });
    });
    
    console.log(`  Total jobs: ${imageSnapshot.size}`);
    console.log(`    Pending: ${statusCounts.pending}`);
    console.log(`    Processing: ${statusCounts.processing}`);
    console.log(`    Completed: ${statusCounts.completed}`);
    console.log(`    Failed: ${statusCounts.failed}`);
    
    console.log('\n  Job details:');
    jobs.forEach(job => {
      console.log(`    ${job.id}: ${job.status} (${job.imageCount} images)`);
    });
  }
  
  console.log('\n\nFetching other presentations...\n');
  
  const presentationsRef = collection(db, 'presentations');
  // Try without ordering first
  const q = query(presentationsRef);
  
  const snapshot = await getDocs(q);
  
  const presentations = [];
  snapshot.forEach(doc => {
    const data = doc.data();
    presentations.push({
      id: doc.id,
      title: data.title,
      createdAt: data.createdAt?.toDate?.() || data.createdAt,
      slideCount: data.slideCount,
    });
  });
  
  // Show first 3 presentations
  console.log('Recent presentations:');
  presentations.slice(0, 3).forEach(p => {
    console.log(`  ${p.id}: ${p.title} (${p.slideCount || '?'} slides)`);
    if (p.createdAt) {
      console.log(`    Created: ${new Date(p.createdAt).toLocaleString()}`);
    }
  });
  
  // Check image queue for each
  for (const pres of presentations.slice(0, 3)) {
    console.log(`\nChecking image queue for "${pres.title}" (${pres.id}):`);
    
    const queueRef = collection(db, 'imageGenerationQueue');
    const imageQuery = query(queueRef, where('presentationId', '==', pres.id));
    
    const imageSnapshot = await getDocs(imageQuery);
    
    if (imageSnapshot.empty) {
      console.log('  No image jobs found');
    } else {
      const statusCounts = {
        pending: 0,
        processing: 0,
        completed: 0,
        failed: 0
      };
      
      imageSnapshot.forEach(doc => {
        const data = doc.data();
        statusCounts[data.status]++;
      });
      
      console.log(`  Total jobs: ${imageSnapshot.size}`);
      console.log(`    Pending: ${statusCounts.pending}`);
      console.log(`    Processing: ${statusCounts.processing}`);
      console.log(`    Completed: ${statusCounts.completed}`);
      console.log(`    Failed: ${statusCounts.failed}`);
    }
  }
  
  process.exit(0);
}

checkRecentPresentations().catch(console.error);