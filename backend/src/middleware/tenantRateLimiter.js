const Tenant = require('../models/Tenant');
const logger = require('../config/logger');

// In-memory store for request counts
// In production, use Redis for distributed systems
const tenantRequestCounts = new Map();

// Tier-based rate limits (requests per minute)
const TIER_LIMITS = {
  free: { requests: 100, window: 60000, name: 'Free' },
  pro: { requests: 500, window: 60000, name: 'Pro' },
  premium: { requests: 2000, window: 60000, name: 'Premium' }
};

/**
 * Tenant-level rate limiting middleware
 * Prevents "noisy neighbor" problem by limiting requests per tenant
 * Limits are based on subscription tier
 */
exports.tenantRateLimiter = async (req, res, next) => {
  try {
    const tenantId = req.tenantId?.toString();
    
    // Skip if no tenant (public endpoints)
    if (!tenantId) {
      return next();
    }
    
    const now = Date.now();
    
    // Get or create tenant data
    if (!tenantRequestCounts.has(tenantId)) {
      tenantRequestCounts.set(tenantId, {
        count: 0,
        resetTime: now + 60000,
        tier: 'free',
        tenantName: 'Unknown'
      });
    }
    
    const tenantData = tenantRequestCounts.get(tenantId);
    
    // Reset if window expired
    if (now > tenantData.resetTime) {
      tenantData.count = 0;
      tenantData.resetTime = now + 60000;
      
      // Refresh tier info every reset (cache for 1 minute)
      try {
        const tenant = await Tenant.findById(tenantId).select('subscriptionTier businessName');
        if (tenant) {
          tenantData.tier = tenant.subscriptionTier || 'free';
          tenantData.tenantName = tenant.businessName;
        }
      } catch (error) {
        logger.error('Error fetching tenant for rate limit:', error);
        // Continue with cached tier
      }
    }
    
    const tierConfig = TIER_LIMITS[tenantData.tier] || TIER_LIMITS.free;
    const limit = tierConfig.requests;
    
    // Check limit
    if (tenantData.count >= limit) {
      logger.warn('Tenant rate limit exceeded', {
        tenantId,
        tenantName: tenantData.tenantName,
        tier: tenantData.tier,
        count: tenantData.count,
        limit,
        endpoint: req.path,
        method: req.method
      });
      
      const retryAfter = Math.ceil((tenantData.resetTime - now) / 1000);
      
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', tenantData.resetTime);
      res.setHeader('Retry-After', retryAfter);
      
      return res.status(429).json({
        success: false,
        message: 'Rate limit exceeded for your subscription tier',
        error: 'RATE_LIMIT_EXCEEDED',
        details: {
          currentTier: tenantData.tier,
          tierName: tierConfig.name,
          limit,
          retryAfter,
          upgradeRequired: tenantData.tier === 'free',
          upgradeMessage: tenantData.tier === 'free' 
            ? 'Upgrade to Pro for 5x more requests per minute'
            : tenantData.tier === 'pro'
            ? 'Upgrade to Premium for 4x more requests per minute'
            : null
        }
      });
    }
    
    // Increment counter
    tenantData.count++;
    
    // Add rate limit headers to response
    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', limit - tenantData.count);
    res.setHeader('X-RateLimit-Reset', tenantData.resetTime);
    res.setHeader('X-RateLimit-Tier', tenantData.tier);
    
    next();
  } catch (error) {
    logger.error('Rate limiter error:', error);
    // Don't block on error - fail open
    next();
  }
};

/**
 * Get current rate limit stats for a tenant
 */
exports.getTenantRateLimitStats = (tenantId) => {
  const stats = tenantRequestCounts.get(tenantId?.toString());
  if (!stats) {
    return null;
  }
  
  const tierConfig = TIER_LIMITS[stats.tier] || TIER_LIMITS.free;
  
  return {
    tier: stats.tier,
    limit: tierConfig.requests,
    used: stats.count,
    remaining: tierConfig.requests - stats.count,
    resetTime: stats.resetTime,
    resetIn: Math.max(0, stats.resetTime - Date.now())
  };
};

/**
 * Reset rate limit for a tenant (admin function)
 */
exports.resetTenantRateLimit = (tenantId) => {
  tenantRequestCounts.delete(tenantId?.toString());
  logger.info('Rate limit reset for tenant', { tenantId });
};

/**
 * Get all tenant rate limit stats (admin function)
 */
exports.getAllTenantStats = () => {
  const stats = [];
  for (const [tenantId, data] of tenantRequestCounts.entries()) {
    const tierConfig = TIER_LIMITS[data.tier] || TIER_LIMITS.free;
    stats.push({
      tenantId,
      tenantName: data.tenantName,
      tier: data.tier,
      requests: data.count,
      limit: tierConfig.requests,
      utilization: (data.count / tierConfig.requests * 100).toFixed(1) + '%'
    });
  }
  return stats.sort((a, b) => b.requests - a.requests);
};

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  
  for (const [tenantId, data] of tenantRequestCounts.entries()) {
    // Remove entries that haven't been used in 5 minutes after reset
    if (now > data.resetTime + 300000) {
      tenantRequestCounts.delete(tenantId);
      cleaned++;
    }
  }
  
  if (cleaned > 0) {
    logger.debug(`Cleaned ${cleaned} stale rate limit entries`);
  }
}, 300000); // 5 minutes

// Log stats every hour
setInterval(() => {
  const stats = exports.getAllTenantStats();
  if (stats.length > 0) {
    logger.info('Rate limit stats', {
      activeTenants: stats.length,
      topUsers: stats.slice(0, 5)
    });
  }
}, 3600000); // 1 hour
