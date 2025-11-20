const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const auditLogger = require('../middleware/auditLogger');

// All audit log routes require authentication
router.use(protect);

// Only owners and managers can view audit logs
router.use(authorize('owner', 'manager'));

// Get audit logs with filters
router.get('/', auditLogger.getAuditLogs);

// Get audit summary/statistics
router.get('/summary', auditLogger.getAuditSummary);

// Get specific user's activity
router.get('/user/:userId', auditLogger.getUserActivity);

// Get history for a specific resource
router.get('/resource/:resource/:resourceId', auditLogger.getResourceHistory);

module.exports = router;
