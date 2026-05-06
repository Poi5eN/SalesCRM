import app from './app.ts';
import { env } from '@/config/env.ts';
import prisma from '@/config/database.ts';

const port = env.PORT || 4000;

const server = app.listen(port, () => {
  console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${port}`);
});

// Graceful Shutdown
const shutdown = async () => {
  console.log('🛑 Shutting down gracefully...');
  
  server.close(async () => {
    console.log('HTTP server closed.');
    
    try {
      await prisma.$disconnect();
      console.log('Prisma disconnected.');
      process.exit(0);
    } catch (err) {
      console.error('Error during shutdown:', err);
      process.exit(1);
    }
  });

  // Force shutdown if it takes too long
  setTimeout(() => {
    console.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
