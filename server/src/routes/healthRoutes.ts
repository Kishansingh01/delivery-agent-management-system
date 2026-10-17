import { Router, Request, Response } from 'express';
import { prisma } from '../config/db.js';
import { getRedisStatus } from '../config/redis.js';

const router = Router();

router.get('/', async (_req: Request, res: Response) => {
  let dbStatus = 'ok';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch (err: any) {
    dbStatus = `error: ${err.message}`;
  }

  const redis = getRedisStatus();

  res.status(200).json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
    services: {
      database: {
        status: dbStatus,
        type: 'SQLite (Prisma ORM)',
      },
      cache: {
        status: redis.connected ? 'connected' : 'disconnected',
        mode: redis.mode,
      },
    },
  });
});

export default router;
