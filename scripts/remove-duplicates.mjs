import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, deleteDoc, doc } from 'firebase/firestore';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.VITE_FIREBASE_API_KEY,
  authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function removeDuplicates() {
  console.log('📖 Fetching all plays from Firestore...\n');

  const snapshot = await getDocs(collection(db, 'plays'));
  const plays = [];

  snapshot.forEach(doc => {
    const data = doc.data();
    plays.push({
      id: doc.id,
      name: data.name,
      createdAt: data.createdAt?.toDate() || new Date(0),
      createdBy: data.createdBy,
      slideCount: data.slides?.length || 0
    });
  });

  console.log(`Total plays in database: ${plays.length}\n`);

  // Group by name
  const playsByName = {};
  plays.forEach(play => {
    if (!playsByName[play.name]) {
      playsByName[play.name] = [];
    }
    playsByName[play.name].push(play);
  });

  // Find duplicates (more than one play with same name)
  const duplicates = Object.entries(playsByName).filter(([name, instances]) => instances.length > 1);

  if (duplicates.length === 0) {
    console.log('✅ No duplicates found!');
    process.exit(0);
  }

  console.log(`⚠️  Found ${duplicates.length} play names with duplicates:\n`);

  let totalToDelete = 0;
  const toDelete = [];

  duplicates.forEach(([name, instances]) => {
    console.log(`"${name}" - ${instances.length} copies`);

    // Sort by creation date (oldest first)
    instances.sort((a, b) => a.createdAt - b.createdAt);

    // Keep the first one, mark rest for deletion
    const [keep, ...remove] = instances;

    console.log(`  ✓ Keeping: ${keep.id} (created ${keep.createdAt.toLocaleString()})`);

    remove.forEach(play => {
      console.log(`  ✗ Will delete: ${play.id} (created ${play.createdAt.toLocaleString()})`);
      toDelete.push(play.id);
      totalToDelete++;
    });

    console.log('');
  });

  console.log(`\n📊 Summary:`);
  console.log(`   Total plays: ${plays.length}`);
  console.log(`   Unique names: ${Object.keys(playsByName).length}`);
  console.log(`   Duplicates to remove: ${totalToDelete}`);
  console.log(`   Final count after cleanup: ${plays.length - totalToDelete}`);

  // Ask for confirmation
  console.log(`\n⚠️  WARNING: This will permanently delete ${totalToDelete} plays!`);
  console.log('Press Ctrl+C to cancel, or wait 3 seconds to continue...\n');

  await new Promise(resolve => setTimeout(resolve, 3000));

  console.log('🗑️  Deleting duplicates...\n');

  let deleted = 0;
  let errors = 0;

  for (const playId of toDelete) {
    try {
      await deleteDoc(doc(db, 'plays', playId));
      console.log(`✓ Deleted: ${playId}`);
      deleted++;
    } catch (error) {
      console.error(`✗ Failed to delete ${playId}:`, error.message);
      errors++;
    }
  }

  console.log(`\n✅ Cleanup complete!`);
  console.log(`   Successfully deleted: ${deleted} plays`);
  if (errors > 0) {
    console.log(`   Failed: ${errors} plays`);
  }
  console.log(`   Remaining plays: ${plays.length - deleted}`);

  process.exit(0);
}

removeDuplicates();
