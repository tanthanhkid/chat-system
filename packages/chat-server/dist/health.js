"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.healthCheck = healthCheck;
exports.readinessCheck = readinessCheck;
exports.livenessCheck = livenessCheck;
const pg_1 = require("pg");
// Import the pool directly for health checks
const pool = new pg_1.Pool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432'),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});
/**
 * Comprehensive health check endpoint
 */
async function healthCheck(req, res) {
    const startTime = Date.now();
    const timestamp = new Date().toISOString();
    let overallStatus = 'healthy';
    // Database health check
    let dbStatus = 'healthy';
    let dbResponseTime;
    let dbError;
    try {
        const dbStartTime = Date.now();
        await pool.query('SELECT 1 as health_check');
        dbResponseTime = Date.now() - dbStartTime;
    }
    catch (error) {
        dbStatus = 'unhealthy';
        dbError = error instanceof Error ? error.message : 'Unknown database error';
        overallStatus = 'unhealthy';
    }
    // Server memory usage
    const memoryUsage = process.memoryUsage();
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryPercentage = Math.round((usedMemory / totalMemory) * 100);
    const healthStatus = {
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
async function readinessCheck(req, res) {
    try {
        // Quick database connectivity check
        await pool.query('SELECT 1');
        res.status(200).json({
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    }
    catch (error) {
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
function livenessCheck(req, res) {
    // Simple check that the server is running
    res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: Math.floor(process.uptime())
    });
}
