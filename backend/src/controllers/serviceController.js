const Service = require('../models/Service');
const logger = require('../config/logger');

exports.createService = async (req, res) => {
  try {
    const { name, description, category, price, duration, images, materialsRequired } = req.body;

    const service = await Service.create({
      tenantId: req.tenantId,
      name,
      description,
      category,
      price,
      duration,
      images,
      materialsRequired,
      createdBy: req.user._id
    });

    res.status(201).json({
      success: true,
      data: service
    });
  } catch (error) {
    logger.error(`Create service error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.getServices = async (req, res) => {
  try {
    const { category, isActive } = req.query;
    
    const filter = { tenantId: req.tenantId };
    
    if (category) filter.category = category;
    if (isActive !== undefined) filter.isActive = isActive === 'true';

    const services = await Service.find(filter).sort({ name: 1 });

    res.json({
      success: true,
      count: services.length,
      data: services
    });
  } catch (error) {
    logger.error(`Get services error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

exports.updateService = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    const allowedUpdates = ['name', 'description', 'category', 'price', 'duration', 'images', 'isActive', 'materialsRequired'];
    const updates = {};
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    Object.assign(service, updates);
    await service.save();

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    logger.error(`Update service error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      tenantId: req.tenantId
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Service not found'
      });
    }

    await service.deleteOne();

    res.json({
      success: true,
      message: 'Service deleted successfully'
    });
  } catch (error) {
    logger.error(`Delete service error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};


exports.suggestService = async (req, res) => {
  try {
    const { name, description, price, duration } = req.body;

    const service = await Service.create({
      tenantId: req.tenantId,
      name,
      description,
      price: price || 0,
      duration: duration || 0,
      category: 'other',
      status: 'pending',
      suggestedBy: req.user._id,
      createdBy: req.user._id,
      isActive: false
    });

    logger.info(`Service suggested: ${service._id} by user ${req.user._id}`);

    res.status(201).json({
      success: true,
      data: service,
      message: 'Service suggestion submitted for owner approval'
    });
  } catch (error) {
    logger.error(`Suggest service error: ${error.message}`);
    res.status(400).json({
      success: false,
      message: error.message
    });
  }
};


exports.getPendingSuggestions = async (req, res) => {
  try {
    const suggestions = await Service.find({
      tenantId: req.tenantId,
      status: 'pending',
      isActive: false
    }).populate('suggestedBy', 'firstName lastName email').sort({ createdAt: -1 });
    
    res.json({
      success: true,
      count: suggestions.length,
      data: suggestions
    });
  } catch (error) {
    logger.error(`Get pending suggestions error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.approveSuggestion = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      status: 'pending'
    });
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Suggestion not found' });
    }
    
    service.status = 'approved';
    service.isActive = true;
    service.approvedBy = req.user._id;
    await service.save();
    
    logger.info(`Service suggestion approved: ${service._id} by user ${req.user._id}`);
    
    res.json({ success: true, data: service, message: 'Service approved and activated' });
  } catch (error) {
    logger.error(`Approve suggestion error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.rejectSuggestion = async (req, res) => {
  try {
    const service = await Service.findOne({
      _id: req.params.id,
      tenantId: req.tenantId,
      status: 'pending'
    });
    
    if (!service) {
      return res.status(404).json({ success: false, message: 'Suggestion not found' });
    }
    
    await service.deleteOne();
    
    logger.info(`Service suggestion rejected: ${service._id} by user ${req.user._id}`);
    
    res.json({ success: true, message: 'Suggestion rejected and removed' });
  } catch (error) {
    logger.error(`Reject suggestion error: ${error.message}`);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
