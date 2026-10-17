import { Router } from 'express';
import { AgentController } from '../controllers/agentController.js';

const router = Router();

// Cache & metadata endpoints
router.get('/meta/stats', AgentController.getStats);
router.get('/meta/cache-status', AgentController.getCacheStatus);
router.post('/meta/cache-clear', AgentController.clearCache);

// CRUD endpoints
router.get('/', AgentController.getAgents);
router.get('/:id', AgentController.getAgentById);
router.post('/', AgentController.createAgent);
router.put('/:id', AgentController.updateAgent);
router.delete('/:id', AgentController.deleteAgent);

export default router;
