import { initializeApp } from 'firebase/app';
import { getFirestore, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { readFileSync } from 'fs';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

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

async function importConvertedPlaybook(userId, teamId = 'team-1') {
  console.log('📖 Loading converted playbook...\n');

  // Read converted playbook
  const data = JSON.parse(readFileSync('scripts/playbook-converted.json', 'utf-8'));

  console.log(`Found ${data.plays.length} plays to import\n`);

  let successCount = 0;
  let errorCount = 0;

  for (const play of data.plays) {
    try {
      const docRef = await addDoc(collection(db, 'plays'), {
        name: `[Official] ${play.name}`,
        teamId: teamId,
        createdBy: userId,
        slides: play.slides,
        formation: play.formation,
        notes: play.notes,
        createdAt: serverTimestamp(),
      });

      console.log(`✓ Imported: ${play.name} (${docRef.id})`);
      successCount++;
    } catch (error) {
      console.error(`✗ Failed to import: ${play.name}`, error.message);
      errorCount++;
    }
  }

  console.log(`\n✅ Import complete!`);
  console.log(`Successfully imported: ${successCount} plays`);
  if (errorCount > 0) {
    console.log(`Failed: ${errorCount} plays`);
  }

  process.exit(0);
}

// Get userId from command line argument
const userId = process.argv[2];
const teamId = process.argv[3] || 'team-1';

if (!userId) {
  console.error('❌ Error: Please provide a user ID');
  console.log('Usage: node import-converted-playbook.mjs <userId> [teamId]');
  console.log('Example: node import-converted-playbook.mjs abc123xyz team-1');
  process.exit(1);
}

console.log(`Importing plays for user: ${userId}`);
console.log(`Team ID: ${teamId}\n`);

importConvertedPlaybook(userId, teamId);
