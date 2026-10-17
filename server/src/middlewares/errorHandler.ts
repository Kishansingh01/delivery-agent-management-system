import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { Prisma } from '@prisma/client';

export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Handle Zod Schema Validation Errors
  if (err instanceof ZodError) {
    const formattedErrors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      details: formattedErrors,
    });
    return;
  }

  // Handle Prisma Unique Constraint Violation
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === 'P2002') {
      const target = (err.meta?.target as string[]) || ['field'];
      res.status(409).json({
        success: false,
        error: `Unique constraint failed on ${target.join(', ')}. Value already in use.`,
      });
      return;
    }

    if (err.code === 'P2025') {
      res.status(404).json({
        success: false,
        error: 'Record not found in the database.',
      });
      return;
    }
  }

  // Handle Invalid JSON input
  if (err instanceof SyntaxError && 'body' in err) {
    res.status(400).json({
      success: false,
      error: 'Malformed JSON payload.',
    });
    return;
  }

  console.error('Unhandled Server Error:', err);

  const statusCode = err.status || err.statusCode || 500;
  res.status(statusCode).json({
    success: false,
    error: err.message || 'Internal Server Error',
  });
}
