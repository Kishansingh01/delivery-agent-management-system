import { Request, Response, NextFunction } from 'express';
import { prisma } from '../config/db.js';
import { CacheService } from '../services/cacheService.js';
import {
  createAgentSchema,
  updateAgentSchema,
  queryAgentSchema,
} from '../validation/agentValidation.js';

export class AgentController {
  /**
   * GET /api/agents
   * Retrieves a paginated list of delivery agents with search and filter capabilities.
   * Responses are cached in Redis.
   */
  public static async getAgents(req: Request, res: Response, Next: NextFunction): Promise<void> {
    try {
      const parsedQuery = queryAgentSchema.parse(req.query);
      const cacheKey = CacheService.generateListKey(req.query);

      // Check Redis cache
      const cached = await CacheService.get<any>(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        res.status(200).json({
          success: true,
          source: 'cache',
          cacheKey,
          ...cached,
        });
        return;
      }

      // Build Prisma query filters
      const where: any = {};

      if (parsedQuery.search) {
        const s = parsedQuery.search.trim();
        where.OR = [
          { name: { contains: s } },
          { email: { contains: s } },
          { phone: { contains: s } },
          { serviceArea: { contains: s } },
        ];
      }

      if (parsedQuery.status) {
        where.status = parsedQuery.status;
      }

      if (parsedQuery.serviceArea) {
        where.serviceArea = parsedQuery.serviceArea;
      }

      if (parsedQuery.vehicleType) {
        where.vehicleType = parsedQuery.vehicleType;
      }

      const page = parsedQuery.page || 1;
      const limit = parsedQuery.limit || 10;
      const skip = (page - 1) * limit;

      const [agents, total] = await Promise.all([
        prisma.deliveryAgent.findMany({
          where,
          skip,
          take: limit,
          orderBy: {
            [parsedQuery.sortBy || 'createdAt']: parsedQuery.sortOrder || 'desc',
          },
        }),
        prisma.deliveryAgent.count({ where }),
      ]);

      const responsePayload = {
        data: agents,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit) || 1,
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      };

      // Store in Redis
      await CacheService.set(cacheKey, responsePayload);

      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);
      res.status(200).json({
        success: true,
        source: 'database',
        cacheKey,
        ...responsePayload,
      });
    } catch (error) {
      Next(error);
    }
  }

  /**
   * GET /api/agents/:id
   * Retrieves an individual delivery agent by ID. Cached in Redis.
   */
  public static async getAgentById(req: Request, res: Response, Next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const cacheKey = CacheService.generateDetailKey(id);

      // Check Redis cache
      const cached = await CacheService.get<any>(cacheKey);
      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        res.status(200).json({
          success: true,
          source: 'cache',
          cacheKey,
          data: cached,
        });
        return;
      }

      const agent = await prisma.deliveryAgent.findUnique({
        where: { id },
      });

      if (!agent) {
        res.status(404).json({
          success: false,
          error: `Delivery agent with ID '${id}' was not found.`,
        });
        return;
      }

      // Store in Redis
      await CacheService.set(cacheKey, agent);

      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);
      res.status(200).json({
        success: true,
        source: 'database',
        cacheKey,
        data: agent,
      });
    } catch (error) {
      Next(error);
    }
  }

  /**
   * POST /api/agents
   * Creates a new delivery agent. Invalidates list and stats caches.
   */
  public static async createAgent(req: Request, res: Response, Next: NextFunction): Promise<void> {
    try {
      const validatedData = createAgentSchema.parse(req.body);

      // Check for unique email
      const existing = await prisma.deliveryAgent.findUnique({
        where: { email: validatedData.email },
      });

      if (existing) {
        res.status(409).json({
          success: false,
          error: `An agent with email '${validatedData.email}' already exists.`,
        });
        return;
      }

      const agent = await prisma.deliveryAgent.create({
        data: validatedData,
      });

      // Invalidate relevant caches
      await CacheService.invalidateAgentCache();

      res.status(201).json({
        success: true,
        message: 'Delivery agent created successfully.',
        data: agent,
      });
    } catch (error) {
      Next(error);
    }
  }

  /**
   * PUT /api/agents/:id
   * Updates an existing delivery agent. Invalidates detail and list caches.
   */
  public static async updateAgent(req: Request, res: Response, Next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);
      const validatedData = updateAgentSchema.parse(req.body);

      const existing = await prisma.deliveryAgent.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          error: `Delivery agent with ID '${id}' was not found.`,
        });
        return;
      }

      // If email is changing, ensure it's not taken by another agent
      if (validatedData.email && validatedData.email !== existing.email) {
        const emailOwner = await prisma.deliveryAgent.findUnique({
          where: { email: validatedData.email },
        });
        if (emailOwner && emailOwner.id !== id) {
          res.status(409).json({
            success: false,
            error: `An agent with email '${validatedData.email}' already exists.`,
          });
          return;
        }
      }

      const updatedAgent = await prisma.deliveryAgent.update({
        where: { id },
        data: validatedData,
      });

      // Invalidate detail cache and all query lists
      await CacheService.invalidateAgentCache(id);

      res.status(200).json({
        success: true,
        message: 'Delivery agent updated successfully.',
        data: updatedAgent,
      });
    } catch (error) {
      Next(error);
    }
  }

  /**
   * DELETE /api/agents/:id
   * Deletes a delivery agent by ID. Invalidates detail and list caches.
   */
  public static async deleteAgent(req: Request, res: Response, Next: NextFunction): Promise<void> {
    try {
      const id = String(req.params.id);

      const existing = await prisma.deliveryAgent.findUnique({
        where: { id },
      });

      if (!existing) {
        res.status(404).json({
          success: false,
          error: `Delivery agent with ID '${id}' was not found.`,
        });
        return;
      }

      await prisma.deliveryAgent.delete({
        where: { id },
      });

      // Invalidate detail cache and all query lists
      await CacheService.invalidateAgentCache(id);

      res.status(200).json({
        success: true,
        message: `Delivery agent '${existing.name}' (${id}) was deleted successfully.`,
      });
    } catch (error) {
      Next(error);
    }
  }

  /**
   * GET /api/agents/meta/stats
   * Aggregated dashboard metrics. Cached for 60s.
   */
  public static async getStats(req: Request, res: Response, Next: NextFunction): Promise<void> {
    try {
      const cacheKey = CacheService.KEY_STATS;
      const cached = await CacheService.get<any>(cacheKey);

      if (cached) {
        res.setHeader('X-Cache', 'HIT');
        res.setHeader('X-Cache-Key', cacheKey);
        res.status(200).json({
          success: true,
          source: 'cache',
          data: cached,
        });
        return;
      }

      const [total, active, inactive, onDelivery, distinctAreas, allAgents] = await Promise.all([
        prisma.deliveryAgent.count(),
        prisma.deliveryAgent.count({ where: { status: 'active' } }),
        prisma.deliveryAgent.count({ where: { status: 'inactive' } }),
        prisma.deliveryAgent.count({ where: { status: 'on_delivery' } }),
        prisma.deliveryAgent.findMany({
          select: { serviceArea: true },
          distinct: ['serviceArea'],
        }),
        prisma.deliveryAgent.findMany({
          select: { rating: true, activeOrders: true },
        }),
      ]);

      const avgRating = allAgents.length
        ? Number((allAgents.reduce((acc, a) => acc + a.rating, 0) / allAgents.length).toFixed(2))
        : 5.0;

      const totalActiveOrders = allAgents.reduce((acc, a) => acc + a.activeOrders, 0);

      const stats = {
        totalAgents: total,
        activeAgents: active,
        inactiveAgents: inactive,
        onDeliveryAgents: onDelivery,
        totalActiveOrders,
        averageRating: avgRating,
        serviceAreas: distinctAreas.map((a) => a.serviceArea).sort(),
      };

      // Cache stats for 60 seconds
      await CacheService.set(cacheKey, stats, 60);

      res.setHeader('X-Cache', 'MISS');
      res.setHeader('X-Cache-Key', cacheKey);
      res.status(200).json({
        success: true,
        source: 'database',
        data: stats,
      });
    } catch (error) {
      Next(error);
    }
  }

  /**
   * GET /api/agents/meta/cache-status
   * Live cache inspection metrics.
   */
  public static async getCacheStatus(req: Request, res: Response): Promise<void> {
    const metrics = CacheService.getMetrics();
    res.status(200).json({
      success: true,
      data: metrics,
    });
  }

  /**
   * POST /api/agents/meta/cache-clear
   * Flush all Redis caches manually.
   */
  public static async clearCache(req: Request, res: Response): Promise<void> {
    await CacheService.flushAll();
    res.status(200).json({
      success: true,
      message: 'All Redis cache keys successfully cleared.',
    });
  }
}
