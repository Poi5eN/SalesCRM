import app from './app.ts';
import { env } from '@/config/env.ts';
import prisma from '@/config/database.ts';

const port = env.PORT || 4000;

const server = app.listen(port, () => {
  console.log(`🚀 Server running in ${env.NODE_ENV} mode on port ${port}`);

  // Hourly Task Overdue Job
  setInterval(async () => {
    try {
      const now = new Date();
      const result = await prisma.task.updateMany({
        where: {
          dueAt: { lt: now },
          status: { notIn: ['completed', 'cancelled', 'overdue'] }
        },
        data: { status: 'overdue' }
      });
      if (result.count > 0) {
        console.log(`[OverdueJob] Updated ${result.count} tasks to overdue.`);
      }
    } catch (err) {
      console.error('[OverdueJob] Failed to update tasks:', err);
    }
  }, 60 * 60 * 1000); // 1 hour
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
