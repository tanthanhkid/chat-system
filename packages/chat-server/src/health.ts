import { Request, Response } from 'express';
import { db } from './database';
import { Pool } from 'pg';

// Import the pool directly for health checks
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

export interface HealthStatus {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  services: {
    database: {
      status: 'healthy' | 'unhealthy';
      responseTime?: number;
      error?: string;
    };
    server: {
      status: 'healthy';
      uptime: number;
      memory: {
        used: number;
        total: number;
        percentage: number;
      };
    };
  };
  version: string;
}

/**
 * Comprehensive health check endpoint
 */
export async function healthCheck(req: Request, res: Response) {
  const startTime = Date.now();
  const timestamp = new Date().toISOString();
  
  let overallStatus: 'healthy' | 'unhealthy' = 'healthy';
  
  // Database health check
  let dbStatus = 'healthy' as 'healthy' | 'unhealthy';
  let dbResponseTime: number | undefined;
  let dbError: string | undefined;
  
  try {
    const dbStartTime = Date.now();
    await pool.query('SELECT 1 as health_check');
    dbResponseTime = Date.now() - dbStartTime;
  } catch (error) {
    dbStatus = 'unhealthy';
    dbError = error instanceof Error ? error.message : 'Unknown database error';
    overallStatus = 'unhealthy';
  }
  
  // Server memory usage
  const memoryUsage = process.memoryUsage();
  const totalMemory = memoryUsage.heapTotal;
  const usedMemory = memoryUsage.heapUsed;
  const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);
  
  const healthStatus: HealthStatus = {
    status: overallStatus,
    timestamp,
    services: {
      database: {
        status: dbStatus,
        ...(dbResponseTime !== undefined && { responseTime: dbResponseTime }),
        ...(dbError && { error: dbError })
      },
      server: {
        status: 'healthy',
        uptime: Math.floor(process.uptime()),
        memory: {
          used: Math.round(usedMemory / 1024 / 1024), // MB
          total: Math.round(totalMemory / 1024 / 1024), // MB
          percentage: memoryPercentage
        }
      }
    },
    version: process.env.npm_package_version || '1.0.0'
  };
  
  const statusCode = overallStatus === 'healthy' ? 200 : 503;
  res.status(statusCode).json(healthStatus);
}

/**
 * Simple readiness check for Kubernetes/Docker
 */
export async function readinessCheck(req: Request, res: Response) {
  try {
    // Quick database connectivity check
    await pool.query('SELECT 1');
    res.status(200).json({ 
      status: 'ready',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({ 
      status: 'not_ready',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
}

/**
 * Liveness check for Kubernetes/Docker
 */
export function livenessCheck(req: Request, res: Response) {
  // Simple check that the server is running
  res.status(200).json({ 
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: Math.floor(process.uptime())
  });
}