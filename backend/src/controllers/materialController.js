const Material = require('../models/Material');
const logger = require('../config/logger');

exports.getAllMaterials = async (req, res) => {
  try {
    const { category, lowStock } = req.query;
    
    const filter = { tenantId: req.tenantId };
    if (category) filter.category = category;

    let materials = await Material.find(filter).sort('-createdAt');

    // Filter for low stock items
    if (lowStock === 'true') {
      materials = materials.filter(m => m.currentStock <= m.minimumStock);
    }

    res.json({
      success: true,
      count: materials.length,
      data: materials
    });
  } catch (error) {
    logger.error(`Get materials error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getMaterial = async (req, res) => {
  try {
    const material = await Material.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    logger.error(`Get material error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.createMaterial = async (req, res) => {
  try {
    const material = await Material.create({
      ...req.body,
      tenantId: req.tenantId
    });

    logger.info(`Material created: ${material._id} by user ${req.user._id}`);

    res.status(201).json({
      success: true,
      data: material
    });
  } catch (error) {
    logger.error(`Create material error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateMaterial = async (req, res) => {
  try {
    // Check if user is trying to update minimumStock
    if (req.body.minimumStock !== undefined) {
      // Only owners and users with canManageInventory permission can update minimumStock
      const canManageSettings = req.user.role === 'owner' || req.user.permissions?.canManageInventory === true;
      
      if (!canManageSettings) {
        return res.status(403).json({
          success: false,
          message: 'Only owners and managers can update minimum stock levels'
        });
      }
    }

    const material = await Material.findOneAndUpdate(
      { _id: req.params.id, tenantId: req.tenantId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    logger.info(`Material updated: ${material._id} by user ${req.user._id} (${req.user.role})`);

    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    logger.error(`Update material error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteMaterial = async (req, res) => {
  try {
    if (req.user.role !== 'owner') {
      return res.status(403).json({
        success: false,
        message: 'Only owners can delete materials'
      });
    }

    const material = await Material.findOneAndDelete({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    logger.info(`Material deleted: ${material._id} by user ${req.user._id}`);

    res.json({
      success: true,
      message: 'Material deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete material error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.restockMaterial = async (req, res) => {
  try {
    const { quantity } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity required'
      });
    }

    const material = await Material.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    material.currentStock += quantity;
    material.lastRestocked = new Date();
    await material.save();

    logger.info(`Material restocked: ${material._id} +${quantity} by user ${req.user._id}`);

    res.json({
      success: true,
      data: material,
      message: `Added ${quantity} ${material.unit} to stock`
    });
  } catch (error) {
    logger.error(`Restock material error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.recordUsage = async (req, res) => {
  try {
    const { quantity, bookingId } = req.body;

    if (!quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid quantity required'
      });
    }

    const material = await Material.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    if (material.currentStock < quantity) {
      return res.status(400).json({
        success: false,
        message: 'Insufficient stock'
      });
    }

    material.currentStock -= quantity;
    material.usageHistory.push({
      bookingId,
      quantity,
      date: new Date(),
      usedBy: req.user._id
    });

    await material.save();

    logger.info(`Material used: ${material._id} -${quantity} by user ${req.user._id}`);

    res.json({
      success: true,
      data: material,
      message: `Used ${quantity} ${material.unit}`
    });
  } catch (error) {
    logger.error(`Record usage error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getLowStockAlerts = async (req, res) => {
  try {
    const materials = await Material.find({ tenantId: req.tenantId });
    
    const lowStock = materials.filter(m => m.currentStock <= m.minimumStock);

    res.json({
      success: true,
      count: lowStock.length,
      data: lowStock
    });
  } catch (error) {
    logger.error(`Get low stock alerts error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.recordPickup = async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Items array required'
      });
    }

    const results = [];
    const errors = [];

    for (const item of items) {
      try {
        const material = await Material.findOne({
          _id: item.materialId,
          tenantId: req.tenantId
        });

        if (!material) {
          errors.push(`Material ${item.materialId} not found`);
          continue;
        }

        if (material.currentStock < item.quantity) {
          errors.push(`Insufficient stock for ${material.name}`);
          continue;
        }

        // Deduct from stock
        material.currentStock -= item.quantity;
        
        // Record pickup
        material.pickupHistory.push({
          pickedBy: req.user._id,
          quantity: item.quantity,
          date: new Date()
        });

        await material.save();
        results.push({
          material: material.name,
          quantity: item.quantity,
          remainingStock: material.currentStock
        });

        logger.info(`Material picked up: ${material._id} -${item.quantity} by user ${req.user._id}`);
      } catch (err) {
        errors.push(`Error processing ${item.materialId}: ${err.message}`);
      }
    }

    res.json({
      success: errors.length === 0,
      data: results,
      errors: errors.length > 0 ? errors : undefined,
      message: `Picked up ${results.length} items successfully`
    });
  } catch (error) {
    logger.error(`Record pickup error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.getMaterialByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const material = await Material.findOne({
      barcode,
      tenantId: req.tenantId
    });

    if (!material) {
      return res.status(404).json({
        success: false,
        message: 'Material not found'
      });
    }

    res.json({
      success: true,
      data: material
    });
  } catch (error) {
    logger.error(`Get material by barcode error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
