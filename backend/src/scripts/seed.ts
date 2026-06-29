import 'dotenv/config';
import prisma from '../config/database.js';
import { seedDemoData } from '../utils/demo-seed.js';

async function main() {
  console.log('🌱 Starting command-line seed script...');
  await seedDemoData();
  console.log('🌱 Command-line seed finished successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
