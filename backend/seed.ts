import { dbStore } from './store.ts';

async function main() {
  console.log('🌱 Seeding CampusConnect mock database...');
  const data = await dbStore.resetToSeed();
  console.log(`✅ Seed complete!`);
  console.log(`   - Users: ${data.users.length}`);
  console.log(`   - Gigs: ${data.gigs.length}`);
  console.log(`   - Applications: ${data.applications.length}`);
  console.log(`   - Reviews: ${data.reviews.length}`);
}

main().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
