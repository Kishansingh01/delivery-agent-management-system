import { z } from 'zod';

export const phoneRegex = /^[+]?[(]?[0-9]{1,4}[)]?[-\s./0-9()]{6,20}$/;

export const createAgentSchema = z.object({
  name: z.string({ required_error: 'Full name is required' })
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must not exceed 100 characters')
    .trim(),
  email: z.string({ required_error: 'Email address is required' })
    .email('Please enter a valid email address')
    .trim()
    .toLowerCase(),
  phone: z.string({ required_error: 'Phone number is required' })
    .regex(phoneRegex, 'Please enter a valid phone number (e.g. +1 555-0199 or 555-0199)')
    .trim(),
  serviceArea: z.string({ required_error: 'Service area is required' })
    .min(2, 'Service area must be at least 2 characters')
    .max(100, 'Service area must not exceed 100 characters')
    .trim(),
  status: z.enum(['active', 'inactive', 'on_delivery'], {
    errorMap: () => ({ message: "Status must be 'active', 'inactive', or 'on_delivery'" }),
  }).default('active'),
  vehicleType: z.enum(['Bicycle', 'Motorcycle', 'Car', 'Van'], {
    errorMap: () => ({ message: "Vehicle type must be 'Bicycle', 'Motorcycle', 'Car', or 'Van'" }),
  }).default('Motorcycle'),
  rating: z.number().min(1).max(5).default(5.0),
  activeOrders: z.number().int().min(0).default(0),
});

export const updateAgentSchema = createAgentSchema.partial();

export const queryAgentSchema = z.object({
  search: z.string().optional(),
  status: z.string().optional(),
  serviceArea: z.string().optional(),
  vehicleType: z.string().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional().default('1'),
  limit: z.string().regex(/^\d+$/).transform(Number).optional().default('10'),
  sortBy: z.enum(['createdAt', 'name', 'rating', 'activeOrders', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

export type CreateAgentInput = z.infer<typeof createAgentSchema>;
export type UpdateAgentInput = z.infer<typeof updateAgentSchema>;
export type QueryAgentInput = z.infer<typeof queryAgentSchema>;
