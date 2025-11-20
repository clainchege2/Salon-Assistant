const express = require('express');
const router = express.Router();
const { protect, checkPermission } = require('../middleware/auth');
const { auditLog } = require('../middleware/auditLogger');

const User = require('../models/User');
const logger = require('../config/logger');

// User controller with tenant isolation
const userController = {
  getUsers: async (req, res) => {
    try {
      const users = await User.find({ tenantId: req.tenantId })
        .select('-password')
        .sort({ createdAt: -1 });
      
      res.status(200).json({ success: true, data: users });
    } catch (error) {
      logger.error('Get users error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  getUser: async (req, res) => {
    try {
      const user = await User.findOne({ 
        _id: req.params.id, 
        tenantId: req.tenantId 
      }).select('-password');
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      res.status(200).json({ success: true, data: user });
    } catch (error) {
      logger.error('Get user error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  },
  
  createUser: async (req, res) => {
    try {
      const userData = {
        ...req.body,
        tenantId: req.tenantId
      };
      
      const user = await User.create(userData);
      const userResponse = user.toObject();
      delete userResponse.password;
      
      res.status(201).json({ success: true, data: userResponse });
    } catch (error) {
      logger.error('Create user error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },
  
  updateUser: async (req, res) => {
    try {
      const user = await User.findOne({ 
        _id: req.params.id, 
        tenantId: req.tenantId 
      });
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      // Update allowed fields
      const allowedFields = ['firstName', 'lastName', 'email', 'phone', 'status'];
      allowedFields.forEach(field => {
        if (req.body[field] !== undefined) {
          user[field] = req.body[field];
        }
      });
      
      await user.save();
      const userResponse = user.toObject();
      delete userResponse.password;
      
      res.status(200).json({ success: true, data: userResponse });
    } catch (error) {
      logger.error('Update user error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },
  
  updateUserRole: async (req, res) => {
    try {
      const user = await User.findOne({ 
        _id: req.params.id, 
        tenantId: req.tenantId 
      });
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      user.role = req.body.role;
      await user.save();
      
      const userResponse = user.toObject();
      delete userResponse.password;
      
      res.status(200).json({ success: true, data: userResponse });
    } catch (error) {
      logger.error('Update user role error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },
  
  updateUserPermissions: async (req, res) => {
    try {
      const user = await User.findOne({ 
        _id: req.params.id, 
        tenantId: req.tenantId 
      });
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      user.permissions = { ...user.permissions, ...req.body.permissions };
      await user.save();
      
      const userResponse = user.toObject();
      delete userResponse.password;
      
      res.status(200).json({ success: true, data: userResponse });
    } catch (error) {
      logger.error('Update user permissions error:', error);
      res.status(400).json({ success: false, message: error.message });
    }
  },
  
  deleteUser: async (req, res) => {
    try {
      const user = await User.findOne({ 
        _id: req.params.id, 
        tenantId: req.tenantId 
      });
      
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
      
      await user.deleteOne();
      
      res.status(200).json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
      logger.error('Delete user error:', error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
  }
};

// @desc    Get all users
// @route   GET /api/v1/users
// @access  Private (Admin/Manager)
router.get('/', 
  protect,
  checkPermission('view_users'),
  userController.getUsers
);

// @desc    Get single user
// @route   GET /api/v1/users/:id
// @access  Private (Admin/Manager)
router.get('/:id', 
  protect,
  checkPermission('view_users'),
  userController.getUser
);

// @desc    Create user
// @route   POST /api/v1/users
// @access  Private (Admin/Manager)
router.post('/', 
  protect,
  checkPermission('manage_users'),
  auditLog('User', { sensitive: true }),
  userController.createUser
);

// @desc    Update user
// @route   PUT /api/v1/users/:id
// @access  Private (Admin/Manager)
router.put('/:id', 
  protect,
  checkPermission('manage_users'),
  auditLog('User', { sensitive: true }),
  userController.updateUser
);

// @desc    Update user role
// @route   PUT /api/v1/users/:id/role
// @access  Private (Admin only)
router.put('/:id/role', 
  protect,
  checkPermission('manage_permissions'),
  auditLog('User', { sensitive: true, critical: true }),
  userController.updateUserRole
);

// @desc    Update user permissions
// @route   PUT /api/v1/users/:id/permissions
// @access  Private (Admin only)
router.put('/:id/permissions', 
  protect,
  checkPermission('manage_permissions'),
  auditLog('User', { sensitive: true, critical: true }),
  userController.updateUserPermissions
);

// @desc    Delete user
// @route   DELETE /api/v1/users/:id
// @access  Private (Admin/Manager)
router.delete('/:id', 
  protect,
  checkPermission('manage_users'),
  auditLog('User', { sensitive: true, critical: true }),
  userController.deleteUser
);

module.exports = router;
