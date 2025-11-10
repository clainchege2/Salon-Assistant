const MaterialItem = require('../models/MaterialItem');
const Material = require('../models/Material');
const logger = require('../config/logger');

// Scan barcode - Stock In (Receiving)
exports.scanStockIn = async (req, res) => {
  try {
    const { barcode, materialId, supplier, cost, location, notes } = req.body;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required'
      });
    }

    // Check if barcode already exists
    const existing = await MaterialItem.findOne({
      barcode,
      tenantId: req.tenantId
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'This barcode has already been scanned',
        data: existing
      });
    }

    // Create new material item
    const materialItem = await MaterialItem.create({
      materialId,
      barcode,
      serialNumber: barcode, // Use barcode as serial number
      status: 'in-stock',
      receivedDate: new Date(),
      receivedBy: req.user._id,
      supplier,
      cost,
      location,
      notes,
      tenantId: req.tenantId,
      history: [{
        action: 'received',
        date: new Date(),
        staffId: req.user._id,
        staffName: `${req.user.firstName} ${req.user.lastName}`,
        notes: 'Item received and scanned into inventory'
      }]
    });

    // Update material quantity
    await Material.findByIdAndUpdate(materialId, {
      $inc: { currentStock: 1 },
      lastRestocked: new Date()
    });

    logger.info(`Material item scanned in: ${barcode} by user ${req.user._id}`);

    res.status(201).json({
      success: true,
      message: 'Item scanned successfully',
      data: materialItem
    });
  } catch (error) {
    logger.error(`Scan stock in error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Scan barcode - Stock Out (Usage)
exports.scanStockOut = async (req, res) => {
  try {
    const { barcode, bookingId, clientName, serviceName, notes } = req.body;

    if (!barcode) {
      return res.status(400).json({
        success: false,
        message: 'Barcode is required'
      });
    }

    // Find the material item
    const materialItem = await MaterialItem.findOne({
      barcode,
      tenantId: req.tenantId,
      status: 'in-stock'
    }).populate('materialId');

    if (!materialItem) {
      return res.status(404).json({
        success: false,
        message: 'Item not found or already used'
      });
    }

    // Update item status and record who used it
    materialItem.status = 'used';
    materialItem.usedDate = new Date();
    materialItem.usedBy = {
      staffId: req.user._id,
      staffName: `${req.user.firstName} ${req.user.lastName}`,
      staffRole: req.user.role,
      staffEmail: req.user.email
    };

    if (bookingId || clientName || serviceName) {
      materialItem.usedFor = {
        bookingId,
        clientName,
        serviceName
      };
    }

    if (notes) {
      materialItem.notes = notes;
    }

    await materialItem.save();

    // Update material quantity
    await Material.findByIdAndUpdate(materialItem.materialId._id, {
      $inc: { currentStock: -1 }
    });

    logger.info(`Material item used: ${barcode} by ${req.user.firstName} ${req.user.lastName}`);

    res.json({
      success: true,
      message: 'Item marked as used',
      data: materialItem
    });
  } catch (error) {
    logger.error(`Scan stock out error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get all items for a material
exports.getMaterialItems = async (req, res) => {
  try {
    const { materialId } = req.params;
    const { status } = req.query;

    const query = {
      materialId,
      tenantId: req.tenantId
    };

    if (status) {
      query.status = status;
    }

    const items = await MaterialItem.find(query)
      .populate('receivedBy', 'firstName lastName')
      .populate('usedBy.staffId', 'firstName lastName')
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: items.length,
      data: items
    });
  } catch (error) {
    logger.error(`Get material items error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Search by barcode
exports.searchByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    const item = await MaterialItem.findOne({
      barcode,
      tenantId: req.tenantId
    })
      .populate('materialId')
      .populate('receivedBy', 'firstName lastName')
      .populate('usedBy.staffId', 'firstName lastName');

    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'Item not found'
      });
    }

    res.json({
      success: true,
      data: item
    });
  } catch (error) {
    logger.error(`Search barcode error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Get staff usage report
exports.getStaffUsageReport = async (req, res) => {
  try {
    const { staffId, startDate, endDate } = req.query;

    const query = {
      tenantId: req.tenantId,
      status: 'used'
    };

    if (staffId) {
      query['usedBy.staffId'] = staffId;
    }

    if (startDate || endDate) {
      query.usedDate = {};
      if (startDate) query.usedDate.$gte = new Date(startDate);
      if (endDate) query.usedDate.$lte = new Date(endDate);
    }

    const items = await MaterialItem.find(query)
      .populate('materialId', 'name unit costPerUnit')
      .sort({ usedDate: -1 });

    // Group by staff
    const staffUsage = {};
    items.forEach(item => {
      const staffKey = item.usedBy.staffId.toString();
      if (!staffUsage[staffKey]) {
        staffUsage[staffKey] = {
          staffName: item.usedBy.staffName,
          staffRole: item.usedBy.staffRole,
          items: [],
          totalCost: 0,
          totalItems: 0
        };
      }
      staffUsage[staffKey].items.push(item);
      staffUsage[staffKey].totalCost += item.cost || item.materialId?.costPerUnit || 0;
      staffUsage[staffKey].totalItems += 1;
    });

    res.json({
      success: true,
      data: Object.values(staffUsage)
    });
  } catch (error) {
    logger.error(`Staff usage report error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

// Bulk scan for inventory count
exports.bulkScan = async (req, res) => {
  try {
    const { barcodes } = req.body;

    if (!Array.isArray(barcodes) || barcodes.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Barcodes array is required'
      });
    }

    const items = await MaterialItem.find({
      barcode: { $in: barcodes },
      tenantId: req.tenantId
    }).populate('materialId', 'name');

    // Find which barcodes were not found
    const foundBarcodes = items.map(item => item.barcode);
    const notFound = barcodes.filter(bc => !foundBarcodes.includes(bc));

    res.json({
      success: true,
      data: {
        found: items,
        notFound,
        summary: {
          scanned: barcodes.length,
          found: items.length,
          missing: notFound.length
        }
      }
    });
  } catch (error) {
    logger.error(`Bulk scan error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};
