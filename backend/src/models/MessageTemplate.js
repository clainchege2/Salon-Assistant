const mongoose = require('mongoose');

const messageTemplateSchema = new mongoose.Schema({
  tenantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Tenant',
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['confirmation', 'reminder', 'thank-you', 'follow-up', 'custom'],
    required: true
  },
  name: String,
  subject: String,
  message: {
    type: String,
    required: true
  },
  channel: {
    type: String,
    enum: ['sms', 'email', 'whatsapp'],
    default: 'sms'
  },
  variables: [{
    type: String,
    enum: ['clientName', 'serviceName', 'date', 'time', 'stylistName', 'salonName', 'price']
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true
});

messageTemplateSchema.index({ tenantId: 1, type: 1 });

module.exports = mongoose.model('MessageTemplate', messageTemplateSchema);
