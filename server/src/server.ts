import { app } from './app.js';
import { connectDB } from './config/db.js';
import { initRedis } from './config/redis.js';

const PORT = process.env.PORT || 5000;

async function bootstrap() {
  try {
    await connectDB();
    await initRedis();

    app.listen(PORT, () => {
      console.log(`🚀 Delivery Agent Management API running at http://localhost:${PORT}`);
      console.log(`🩺 Health check available at http://localhost:${PORT}/health`);
      console.log(`📦 Delivery Agents API at http://localhost:${PORT}/api/agents`);
    });
  } catch (error) {
    console.error('Fatal bootstrapping error:', error);
    process.exit(1);
  }
}

bootstrap();
