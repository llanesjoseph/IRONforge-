import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs } from 'firebase/firestore';
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

async function checkPlays() {
  console.log('📖 Fetching all plays from Firestore...\n');

  const snapshot = await getDocs(collection(db, 'plays'));
  const plays = [];

  snapshot.forEach(doc => {
    plays.push({
      id: doc.id,
      name: doc.data().name,
      createdBy: doc.data().createdBy,
      teamId: doc.data().teamId,
      formation: doc.data().formation,
      slideCount: doc.data().slides?.length || 0
    });
  });

  console.log(`Total plays in database: ${plays.length}\n`);

  // Group by name to find duplicates
  const playsByName = {};
  plays.forEach(play => {
    if (!playsByName[play.name]) {
      playsByName[play.name] = [];
    }
    playsByName[play.name].push(play);
  });

  // Show all plays
  console.log('All plays:');
  console.log('─'.repeat(80));
  plays.forEach((play, i) => {
    console.log(`${i + 1}. ${play.name}`);
    console.log(`   ID: ${play.id}`);
    console.log(`   Formation: ${play.formation || 'N/A'}`);
    console.log(`   Slides: ${play.slideCount}`);
    console.log(`   Created by: ${play.createdBy}`);
    console.log('');
  });

  // Show duplicates
  const duplicates = Object.entries(playsByName).filter(([name, instances]) => instances.length > 1);

  if (duplicates.length > 0) {
    console.log('\n⚠️  DUPLICATES FOUND:');
    console.log('─'.repeat(80));
    duplicates.forEach(([name, instances]) => {
      console.log(`\n"${name}" - ${instances.length} copies:`);
      instances.forEach(play => {
        console.log(`  - ${play.id} (${play.slideCount} slides, by ${play.createdBy})`);
      });
    });
  } else {
    console.log('✅ No duplicates found!');
  }

  process.exit(0);
}

checkPlays();
