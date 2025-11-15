import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './StockManagement.css';
import './StockManagement-scanner.css';

export default function StockManagement() {
  const [materials, setMaterials] = useState([]);
  const [lowStockItems, setLowStockItems] = useState([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(null);
  const [showRestockForm, setShowRestockForm] = useState(null);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanMode, setScanMode] = useState('in'); // 'in' or 'out'
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [selectedMaterial, setSelectedMaterial] = useState(null);
  const [scanHistory, setScanHistory] = useState([]);
  const [multiScanMode, setMultiScanMode] = useState(false);
  const [scannedItems, setScannedItems] = useState([]);
  const [viewMode, setViewMode] = useState(() => {
    // Load saved view preference from localStorage
    return localStorage.getItem('stockViewMode') || 'grid';
  });
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  // Save view mode preference
  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    localStorage.setItem('stockViewMode', mode);
  };

  // Check if user can manage stock limits and settings (owner/manager only)
  const canManageStockSettings = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return false;
    try {
      const user = JSON.parse(userStr);
      return user.role === 'owner' || user.permissions?.canManageInventory === true;
    } catch {
      return false;
    }
  };

  // Get current user info for logging
  const getCurrentUser = () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  };

  const [formData, setFormData] = useState({
    name: '',
    category: 'hair-extensions',
    unit: 'packs',
    currentStock: 0,
    minimumStock: 5,
    costPerUnit: 0,
    supplier: ''
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    category: '',
    unit: '',
    minimumStock: 0,
    costPerUnit: 0,
    supplier: ''
  });

  useEffect(() => {
    fetchMaterials();
  }, []);

  // Cleanup scanner when modal closes
  useEffect(() => {
    if (!showScanModal && cameraActive) {
      stopScanner();
    }
  }, [showScanModal, cameraActive]);

  const fetchMaterials = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      const [materialsRes, lowStockRes] = await Promise.all([
        axios.get('http://localhost:5000/api/v1/materials', config),
        axios.get('http://localhost:5000/api/v1/materials/low-stock', config)
      ]);

      setMaterials(materialsRes.data.data || []);
      setLowStockItems(lowStockRes.data.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMaterial = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const user = getCurrentUser();
      
      // Prepare material data
      const materialData = {
        name: formData.name,
        category: formData.category,
        unit: formData.unit,
        currentStock: parseInt(formData.currentStock) || 0,
        costPerUnit: parseFloat(formData.costPerUnit) || 0,
        supplier: formData.supplier || '',
        addedBy: {
          userId: user?.id,
          name: `${user?.firstName} ${user?.lastName}`,
          role: user?.role
        },
        addedAt: new Date().toISOString()
      };

      // Only include minimumStock if user has permission
      if (canManageStockSettings()) {
        materialData.minimumStock = parseInt(formData.minimumStock) || 5;
      }
      
      console.log('Sending material data:', materialData);
      
      await axios.post('http://localhost:5000/api/v1/materials', materialData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert('✓ Material added successfully!');
      setShowAddForm(false);
      setFormData({
        name: '',
        category: 'hair-extensions',
        unit: 'packs',
        currentStock: 0,
        minimumStock: 5,
        costPerUnit: 0,
        supplier: ''
      });
      fetchMaterials();
    } catch (error) {
      console.error('Add material error:', error);
      console.error('Error response:', error.response?.data);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to add material';
      alert(`Failed to add material: ${errorMsg}`);
    }
  };

  const handleRestock = async (materialId, quantity) => {
    if (!quantity || quantity <= 0) {
      alert('Please enter a valid quantity');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const response = await axios.post(
        `http://localhost:5000/api/v1/materials/${materialId}/restock`, 
        { quantity: parseInt(quantity) },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log('Restock response:', response.data);
      alert(`✓ Successfully restocked ${quantity} units!`);
      setShowRestockForm(null);
      fetchMaterials();
    } catch (error) {
      console.error('Restock error:', error);
      alert(`Failed to restock: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleEditMaterial = (material) => {
    setEditFormData({
      name: material.name,
      category: material.category,
      unit: material.unit,
      minimumStock: material.minimumStock,
      costPerUnit: material.costPerUnit || 0,
      supplier: material.supplier || ''
    });
    setShowEditForm(material._id);
  };

  const handleUpdateMaterial = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('adminToken');
      const user = getCurrentUser();
      
      // Prepare update data with user info
      const updateData = {
        name: editFormData.name,
        category: editFormData.category,
        unit: editFormData.unit,
        costPerUnit: editFormData.costPerUnit,
        supplier: editFormData.supplier,
        lastModifiedBy: {
          userId: user?.id,
          name: `${user?.firstName} ${user?.lastName}`,
          role: user?.role
        },
        lastModifiedAt: new Date().toISOString()
      };

      // Only include minimumStock if user has permission
      if (canManageStockSettings()) {
        updateData.minimumStock = editFormData.minimumStock;
      }

      await axios.put(
        `http://localhost:5000/api/v1/materials/${showEditForm}`,
        updateData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('✓ Material updated successfully!');
      setShowEditForm(null);
      fetchMaterials();
    } catch (error) {
      console.error('Update error:', error);
      alert(`Failed to update material: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleDeleteMaterial = async (materialId, materialName) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${materialName}"?\n\nThis action cannot be undone.`
    );
    
    if (!confirmed) return;

    try {
      const token = localStorage.getItem('adminToken');
      await axios.delete(
        `http://localhost:5000/api/v1/materials/${materialId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert('✓ Material deleted successfully!');
      fetchMaterials();
    } catch (error) {
      console.error('Delete error:', error);
      alert(`Failed to delete material: ${error.response?.data?.message || error.message}`);
    }
  };

  const startScanner = async () => {
    console.log('🎥 Starting barcode scanner');
    setCameraError(null);
    
    try {
      // First, explicitly request camera permission
      console.log('📷 Requesting camera permission...');
      
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          video: { facingMode: 'environment' } 
        });
        console.log('✅ Camera permission granted');
        // Stop the test stream
        stream.getTracks().forEach(track => track.stop());
      } catch (permError) {
        console.error('❌ Camera permission error:', permError);
        
        if (permError.name === 'NotAllowedError') {
          setCameraError('🚫 Camera permission denied. Click the camera icon 📷 in your browser address bar and select "Allow". Then try again.');
          return;
        } else if (permError.name === 'NotFoundError') {
          setCameraError('📷 No camera found. Please connect a webcam or use the manual input field below to type/paste barcodes.');
          return;
        } else if (permError.name === 'NotReadableError') {
          setCameraError('⚠️ Camera is busy. Close other apps using the camera (Zoom, Teams, Skype, etc.) and try again.');
          return;
        } else if (permError.name === 'NotSupportedError') {
          setCameraError('🔒 Camera not supported. Make sure you\'re using HTTPS or localhost. Use manual input instead.');
          return;
        } else {
          setCameraError(`❌ Camera error: ${permError.message}. Try using manual input below.`);
          return;
        }
      }

      // Set camera active first to render the div
      setCameraActive(true);
      
      // Wait for React to render the element
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check if element exists
      const element = document.getElementById('barcode-scanner');
      if (!element) {
        console.error('❌ Scanner element not found after render');
        setCameraError('Scanner element not ready. Please try again.');
        setCameraActive(false);
        return;
      }

      // Clear any existing content
      element.innerHTML = '';

      console.log('🔧 Initializing Html5QrcodeScanner with optimized settings...');
      const scanner = new Html5QrcodeScanner('barcode-scanner', {
        fps: 30, // Increased from 10 for faster detection
        qrbox: function(viewfinderWidth, viewfinderHeight) {
          // Dynamic scan box - 70% of viewport
          const minEdgePercentage = 0.7;
          const minEdgeSize = Math.min(viewfinderWidth, viewfinderHeight);
          const qrboxSize = Math.floor(minEdgeSize * minEdgePercentage);
          return {
            width: qrboxSize,
            height: Math.floor(qrboxSize * 0.6) // Wider for barcodes
          };
        },
        aspectRatio: 1.777778,
        formatsToSupport: [
          'CODE_128', 'CODE_39', 'CODE_93',
          'EAN_13', 'EAN_8', 
          'UPC_A', 'UPC_E', 'UPC_EAN_EXTENSION',
          'CODABAR', 'ITF',
          'QR_CODE', 'DATA_MATRIX'
        ],
        rememberLastUsedCamera: true,
        showTorchButtonIfSupported: true,
        // Advanced settings for better detection
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true // Use native browser barcode detector if available
        },
        videoConstraints: {
          facingMode: 'environment',
          focusMode: 'continuous',
          advanced: [{ zoom: 2.0 }] // Slight zoom for better focus
        }
      });

      scanner.render(
        (decodedText) => {
          console.log('✅ Barcode scanned:', decodedText);
          
          // Visual feedback - flash green
          const scannerElement = document.getElementById('barcode-scanner');
          if (scannerElement) {
            scannerElement.style.border = '4px solid #10b981';
            scannerElement.style.boxShadow = '0 0 20px #10b981';
            setTimeout(() => {
              scannerElement.style.border = '';
              scannerElement.style.boxShadow = '';
            }, 1000);
          }
          
          // Audio feedback (beep sound)
          try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            oscillator.frequency.value = 800;
            oscillator.type = 'sine';
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.1);
          } catch (e) {
            console.log('Audio feedback not available');
          }
          
          // Haptic feedback (vibration on mobile)
          if (navigator.vibrate) {
            navigator.vibrate(200);
          }
          
          // Show success message
          alert(`✅ Barcode captured: ${decodedText}`);
          
          setScannedBarcode(decodedText);
          handleScanBarcode(decodedText);
          scanner.clear().catch(err => console.log('Clear error:', err));
          setCameraActive(false);
        },
        (error) => {
          // Ignore scanning errors (happens continuously while scanning)
          // Only log if it's a real error, not just "no barcode found"
          if (!error.includes('NotFoundException')) {
            console.log('Scanner error:', error);
          }
        }
      );

      scannerRef.current = scanner;
      console.log('✅ Scanner initialized and running');
    } catch (error) {
      console.error('❌ Scanner initialization error:', error);
      console.error('Error details:', error.message, error.stack);
      
      setCameraActive(false);
      
      // Provide specific error message
      let errorMsg = 'Unable to start scanner. ';
      if (error.message && error.message.includes('NotAllowedError')) {
        errorMsg += 'Camera permission denied. Please allow camera access in your browser.';
      } else if (error.message && error.message.includes('NotFoundError')) {
        errorMsg += 'No camera found on this device.';
      } else if (error.message && error.message.includes('NotReadableError')) {
        errorMsg += 'Camera is in use by another application (possibly Tobii).';
      } else {
        errorMsg += 'Please close any apps using the camera and try again. Error: ' + (error.message || 'Unknown');
      }
      
      setCameraError(errorMsg);
    }
  };

  const stopScanner = () => {
    if (scannerRef.current) {
      scannerRef.current.clear().catch(err => console.log('Scanner already cleared'));
      scannerRef.current = null;
    }
    setCameraActive(false);
  };

  const handleScanBarcode = async (barcodeValue = null) => {
    const barcode = barcodeValue || scannedBarcode;
    
    if (!barcode) {
      alert('Please enter a barcode');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      
      if (scanMode === 'in') {
        // Multi-scan mode: Add to list
        if (multiScanMode) {
          if (scannedItems.includes(barcode)) {
            alert('This barcode is already in the list');
            return;
          }
          setScannedItems(prev => [...prev, barcode]);
          setScannedBarcode(''); // Clear for next scan
          return;
        }
        
        // Single scan mode
        setScanResult({ barcode, step: 'select-material' });
        setScannedBarcode(barcode);
      } else {
        // Stock Out - search for existing item
        const response = await axios.get(
          `http://localhost:5000/api/v1/barcodes/search/${barcode}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        
        setScanResult({ ...response.data.data, step: 'confirm-out' });
        setScannedBarcode(barcode);
      }
    } catch (error) {
      if (error.response?.status === 404) {
        alert('Item not found. Please scan it in first.');
      } else {
        alert(`Scan error: ${error.response?.data?.message || error.message}`);
      }
    }
  };

  const handleConfirmStockIn = async () => {
    if (!selectedMaterial) {
      alert('Please select a material');
      return;
    }

    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      // Get quantity from input
      const quantityInput = document.getElementById('batch-quantity');
      const quantity = parseInt(quantityInput?.value || 1);
      
      if (quantity < 1) {
        alert('Quantity must be at least 1');
        return;
      }

      // Show progress for batch operations
      if (quantity > 1) {
        const confirmed = window.confirm(`Scan in ${quantity} items with barcode ${scannedBarcode}?`);
        if (!confirmed) return;
      }

      let successCount = 0;
      let failCount = 0;

      // Scan in each item
      for (let i = 0; i < quantity; i++) {
        try {
          // Create unique barcode for each item (append sequence number)
          const uniqueBarcode = quantity > 1 ? `${scannedBarcode}-${i + 1}` : scannedBarcode;
          
          await axios.post(
            'http://localhost:5000/api/v1/barcodes/scan/in',
            {
              barcode: uniqueBarcode,
              materialId: selectedMaterial,
              supplier: 'Manual Entry',
              location: 'Main Storage',
              notes: quantity > 1 ? `Batch ${i + 1} of ${quantity}` : ''
            },
            config
          );
          successCount++;
        } catch (error) {
          console.error(`Failed to scan item ${i + 1}:`, error);
          failCount++;
        }
      }

      // Add to scan history
      const material = materials.find(m => m._id === selectedMaterial);
      setScanHistory(prev => [{
        barcode: scannedBarcode,
        material: material?.name,
        action: `Stock In (${quantity}x)`,
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 9)]);

      // Show result
      if (failCount === 0) {
        alert(`✓ Successfully scanned in ${successCount} items!`);
      } else {
        alert(`⚠️ Scanned ${successCount} items, ${failCount} failed`);
      }

      setScannedBarcode('');
      setScanResult(null);
      setSelectedMaterial(null);
      fetchMaterials();
    } catch (error) {
      alert(`Failed to scan in: ${error.response?.data?.message || error.message}`);
    }
  };

  const handleConfirmStockOut = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      
      await axios.post(
        'http://localhost:5000/api/v1/barcodes/scan/out',
        {
          barcode: scannedBarcode,
          notes: 'Used via barcode scan'
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Add to scan history
      setScanHistory(prev => [{
        barcode: scannedBarcode,
        material: scanResult.materialId?.name,
        action: 'Stock Out',
        time: new Date().toLocaleTimeString()
      }, ...prev.slice(0, 9)]);

      alert('✓ Item marked as used!');
      setScannedBarcode('');
      setScanResult(null);
      fetchMaterials();
    } catch (error) {
      alert(`Failed to scan out: ${error.response?.data?.message || error.message}`);
    }
  };

  const closeScanModal = () => {
    stopScanner();
    setShowScanModal(false);
    setScannedBarcode('');
    setScanResult(null);
    setSelectedMaterial(null);
    setCameraError(null);
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="stock-management">
      <div className="stock-header">
        <button onClick={() => navigate('/dashboard')} className="back-btn">← Back</button>
        <div className="page-title-wrapper">
          <div className="title-with-icon">
            <span className="title-icon">🧴</span>
            <div className="title-content">
              <h1>Stock Management</h1>
              <p className="page-tagline">Track, manage, and optimize your salon inventory</p>
            </div>
          </div>
        </div>
        <div className="header-actions">
          <button onClick={() => { setScanMode('in'); setShowScanModal(true); }} className="scan-btn scan-in">
            📦 Scan In
          </button>
          <button onClick={() => { setScanMode('out'); setShowScanModal(true); }} className="scan-btn scan-out">
            📤 Scan Out
          </button>
          <button onClick={() => setShowAddForm(true)} className="add-btn">+ Add Material</button>
        </div>
      </div>

      {lowStockItems.length > 0 && (
        <div className="alert-box">
          <h3>⚠️ Low Stock Alerts ({lowStockItems.length})</h3>
          <div className="low-stock-items">
            {lowStockItems.map(item => (
              <div key={item._id} className="alert-item">
                <span>{item.name}</span>
                <span className="stock-level">{item.currentStock} {item.unit} left</span>
                <button onClick={() => setShowRestockForm(item._id)}>Restock</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* View Controls Bar */}
      <div className="view-controls-bar">
        <div className="view-info">
          <span className="material-count">{materials.length} Materials</span>
          {lowStockItems.length > 0 && (
            <span className="low-stock-badge">{lowStockItems.length} Low Stock</span>
          )}
        </div>
        <div className="view-toggle">
          <span className="view-label">View:</span>
          <button 
            onClick={() => handleViewModeChange('grid')} 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            title="Grid View"
            aria-label="Grid View"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="6" height="6" rx="1"/>
              <rect x="9" y="1" width="6" height="6" rx="1"/>
              <rect x="1" y="9" width="6" height="6" rx="1"/>
              <rect x="9" y="9" width="6" height="6" rx="1"/>
            </svg>
            <span className="view-btn-text">Grid</span>
          </button>
          <button 
            onClick={() => handleViewModeChange('list')} 
            className={`view-btn ${viewMode === 'list' ? 'active' : ''}`}
            title="List View"
            aria-label="List View"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="2" width="14" height="2" rx="1"/>
              <rect x="1" y="7" width="14" height="2" rx="1"/>
              <rect x="1" y="12" width="14" height="2" rx="1"/>
            </svg>
            <span className="view-btn-text">List</span>
          </button>
          <button 
            onClick={() => handleViewModeChange('table')} 
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            title="Table View"
            aria-label="Table View"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
              <rect x="1" y="1" width="14" height="3" rx="1"/>
              <rect x="1" y="6" width="14" height="3" rx="1"/>
              <rect x="1" y="11" width="14" height="3" rx="1"/>
            </svg>
            <span className="view-btn-text">Table</span>
          </button>
        </div>
      </div>

      {materials.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📦</div>
          <h2>No Stock Items Yet</h2>
          <p>Start by adding your first material to track inventory</p>
          <button onClick={() => setShowAddForm(true)} className="empty-action-btn">
            + Add Your First Material
          </button>
          <div className="empty-features">
            <div className="feature-item">
              <span className="feature-icon">📱</span>
              <span>Barcode Scanning</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">📊</span>
              <span>Stock Tracking</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">⚠️</span>
              <span>Low Stock Alerts</span>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Grid View */}
          {viewMode === 'grid' && (
            <div className="materials-grid">
              {materials.map(material => (
                <div key={material._id} className={`material-card ${material.currentStock <= material.minimumStock ? 'low-stock' : ''}`}>
                  <div className="material-header">
                    <h3>{material.name}</h3>
                    <span className="category-badge">{material.category}</span>
                  </div>
                  
                  <div className="stock-info">
                    <div className="stock-level">
                      <span className="label">Current Stock:</span>
                      <span className="value">{material.currentStock} {material.unit}</span>
                    </div>
                    <div className="stock-level">
                      <span className="label">Minimum:</span>
                      <span className="value">{material.minimumStock} {material.unit}</span>
                    </div>
                    {material.costPerUnit && (
                      <div className="stock-level">
                        <span className="label">Cost/Unit:</span>
                        <span className="value">KES {material.costPerUnit}</span>
                      </div>
                    )}
                    {material.supplier && (
                      <div className="stock-level">
                        <span className="label">Supplier:</span>
                        <span className="value">{material.supplier}</span>
                      </div>
                    )}
                  </div>

                  <div className="material-actions">
                    <button 
                      onClick={() => setShowRestockForm(material._id)} 
                      className="restock-btn"
                    >
                      Restock
                    </button>
                    <button 
                      onClick={() => handleEditMaterial(material)} 
                      className="edit-btn"
                    >
                      ✏️ Edit
                    </button>
                  </div>

                  {showRestockForm === material._id && (
                    <div className="restock-form">
                      <input
                        type="number"
                        placeholder="Quantity"
                        id={`qty-${material._id}`}
                        min="1"
                      />
                      <button onClick={() => {
                        const qty = document.getElementById(`qty-${material._id}`).value;
                        handleRestock(material._id, qty);
                      }}>
                        Add
                      </button>
                      <button onClick={() => setShowRestockForm(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* List View */}
          {viewMode === 'list' && (
            <div className="materials-list">
              {materials.map(material => (
                <div key={material._id} className={`material-list-item ${material.currentStock <= material.minimumStock ? 'low-stock' : ''}`}>
                  <div className="list-item-main">
                    <div className="list-item-info">
                      <h3>{material.name}</h3>
                      <span className="category-badge">{material.category}</span>
                      <div className="list-item-details">
                        <span className="detail-item">
                          <strong>Stock:</strong> {material.currentStock} {material.unit}
                        </span>
                        <span className="detail-item">
                          <strong>Min:</strong> {material.minimumStock} {material.unit}
                        </span>
                        {material.costPerUnit && (
                          <span className="detail-item">
                            <strong>Cost:</strong> KES {material.costPerUnit}
                          </span>
                        )}
                        {material.supplier && (
                          <span className="detail-item">
                            <strong>Supplier:</strong> {material.supplier}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="list-item-actions">
                      <button 
                        onClick={() => setShowRestockForm(material._id)} 
                        className="restock-btn"
                      >
                        Restock
                      </button>
                      <button 
                        onClick={() => handleEditMaterial(material)} 
                        className="edit-btn"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </div>
                  {showRestockForm === material._id && (
                    <div className="restock-form">
                      <input
                        type="number"
                        placeholder="Quantity"
                        id={`qty-${material._id}`}
                        min="1"
                      />
                      <button onClick={() => {
                        const qty = document.getElementById(`qty-${material._id}`).value;
                        handleRestock(material._id, qty);
                      }}>
                        Add
                      </button>
                      <button onClick={() => setShowRestockForm(null)}>Cancel</button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Table View */}
          {viewMode === 'table' && (
            <div className="materials-table-container">
              <table className="materials-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Category</th>
                    <th>Current Stock</th>
                    <th>Min Stock</th>
                    <th>Cost/Unit</th>
                    <th>Supplier</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {materials.map(material => (
                    <tr key={material._id} className={material.currentStock <= material.minimumStock ? 'low-stock-row' : ''}>
                      <td className="material-name">{material.name}</td>
                      <td>
                        <span className="category-badge">{material.category}</span>
                      </td>
                      <td className="stock-value">
                        {material.currentStock} {material.unit}
                      </td>
                      <td className="stock-value">
                        {material.minimumStock} {material.unit}
                      </td>
                      <td>
                        {material.costPerUnit ? `KES ${material.costPerUnit}` : '-'}
                      </td>
                      <td>{material.supplier || '-'}</td>
                      <td className="table-actions">
                        <button 
                          onClick={() => setShowRestockForm(material._id)} 
                          className="table-btn restock-btn-small"
                          title="Restock"
                        >
                          ↑
                        </button>
                        <button 
                          onClick={() => handleEditMaterial(material)} 
                          className="table-btn edit-btn-small"
                          title="Edit"
                        >
                          ✏️
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Restock form for table view */}
              {showRestockForm && (
                <div className="table-restock-modal">
                  <div className="table-restock-content">
                    <h4>Restock {materials.find(m => m._id === showRestockForm)?.name}</h4>
                    <input
                      type="number"
                      placeholder="Quantity"
                      id={`qty-${showRestockForm}`}
                      min="1"
                      autoFocus
                    />
                    <div className="table-restock-actions">
                      <button onClick={() => {
                        const qty = document.getElementById(`qty-${showRestockForm}`).value;
                        handleRestock(showRestockForm, qty);
                      }} className="confirm-btn-small">
                        Add
                      </button>
                      <button onClick={() => setShowRestockForm(null)} className="cancel-btn-small">
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)} role="dialog" aria-modal="true" aria-labelledby="add-material-title">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="add-material-title">Add New Material</h2>
              <button 
                onClick={() => setShowAddForm(false)} 
                className="modal-close-btn"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleAddMaterial}>
              <div className="form-group">
                <label htmlFor="material-name">Material Name *</label>
                <input
                  id="material-name"
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value.trim() })}
                  maxLength={100}
                  required
                  autoFocus
                  placeholder="e.g., Brazilian Hair Extensions"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="material-category">Category *</label>
                  <select
                    id="material-category"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  >
                    <option value="hair-extensions">Hair Extensions</option>
                    <option value="chemicals">Chemicals</option>
                    <option value="tools">Tools</option>
                    <option value="accessories">Accessories</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label htmlFor="material-unit">Unit *</label>
                  <select
                    id="material-unit"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    required
                  >
                    <option value="pieces">Pieces</option>
                    <option value="grams">Grams</option>
                    <option value="ml">ML</option>
                    <option value="bottles">Bottles</option>
                    <option value="packs">Packs</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="material-quantity">Quantity *</label>
                  <input
                    id="material-quantity"
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: Math.max(0, parseInt(e.target.value) || 0) })}
                    min="0"
                    max="999999"
                    step="1"
                    required
                    placeholder="0"
                  />
                </div>

                {canManageStockSettings() && (
                  <div className="form-group">
                    <label htmlFor="material-min-stock">Minimum Stock Alert</label>
                    <input
                      id="material-min-stock"
                      type="number"
                      value={formData.minimumStock}
                      onChange={(e) => setFormData({ ...formData, minimumStock: Math.max(0, parseInt(e.target.value) || 0) })}
                      min="0"
                      max="999999"
                      step="1"
                      placeholder="5"
                    />
                    <small className="field-hint">Alert when stock falls below this</small>
                  </div>
                )}
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label htmlFor="material-cost">Cost Per Unit (KES)</label>
                  <input
                    id="material-cost"
                    type="number"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: Math.max(0, parseFloat(e.target.value) || 0) })}
                    min="0"
                    max="9999999"
                    step="0.01"
                    placeholder="0.00"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="material-supplier">Supplier</label>
                  <input
                    id="material-supplier"
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value.trim() })}
                    maxLength={100}
                    placeholder="e.g., Beauty Supplies Ltd"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Add Material
                </button>
                <button type="button" onClick={() => setShowAddForm(false)} className="btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && (
        <div className="modal-overlay" onClick={() => setShowEditForm(null)} role="dialog" aria-modal="true" aria-labelledby="edit-material-title">
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 id="edit-material-title">Edit Material</h2>
              <button 
                onClick={() => setShowEditForm(null)} 
                className="modal-close-btn"
                aria-label="Close dialog"
              >
                ✕
              </button>
            </div>
            <form onSubmit={handleUpdateMaterial}>
              <div className="form-group">
                <label>Material Name *</label>
                <input
                  type="text"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={editFormData.category}
                    onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
                  >
                    <option value="hair-extensions">Hair Extensions</option>
                    <option value="chemicals">Chemicals</option>
                    <option value="tools">Tools</option>
                    <option value="accessories">Accessories</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Unit *</label>
                  <select
                    value={editFormData.unit}
                    onChange={(e) => setEditFormData({ ...editFormData, unit: e.target.value })}
                  >
                    <option value="pieces">Pieces</option>
                    <option value="grams">Grams</option>
                    <option value="ml">ML</option>
                    <option value="bottles">Bottles</option>
                    <option value="packs">Packs</option>
                  </select>
                </div>
              </div>

              {canManageStockSettings() && (
                <div className="form-group">
                  <label>Minimum Stock Alert</label>
                  <input
                    type="number"
                    value={editFormData.minimumStock}
                    onChange={(e) => setEditFormData({ ...editFormData, minimumStock: e.target.value })}
                    min="0"
                  />
                  <small style={{ color: '#666', fontSize: '11px' }}>Alert when stock falls below this (Owner/Manager only)</small>
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Cost Per Unit</label>
                  <input
                    type="number"
                    value={editFormData.costPerUnit}
                    onChange={(e) => setEditFormData({ ...editFormData, costPerUnit: e.target.value })}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    value={editFormData.supplier}
                    onChange={(e) => setEditFormData({ ...editFormData, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-primary">
                  Update Material
                </button>
                <button type="button" onClick={() => setShowEditForm(null)} className="btn-secondary">
                  Cancel
                </button>
                {canManageStockSettings() && (
                  <button 
                    type="button" 
                    onClick={() => {
                      const material = materials.find(m => m._id === showEditForm);
                      if (material) {
                        handleDeleteMaterial(showEditForm, material.name);
                      }
                    }}
                    className="btn-danger"
                    style={{ marginLeft: 'auto' }}
                    aria-label={`Delete ${materials.find(m => m._id === showEditForm)?.name}`}
                  >
                    🗑️ Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {showScanModal && (
        <div className="modal-overlay" onClick={closeScanModal}>
          <div className="modal-content scan-modal" onClick={(e) => e.stopPropagation()}>
            <div className="scan-header">
              <h2>{scanMode === 'in' ? '📦 Scan Stock In' : '📤 Scan Stock Out'}</h2>
              <button onClick={closeScanModal} className="close-btn">✕</button>
            </div>

            <div className="scan-body">
              {/* Scanner Section */}
              {!cameraActive ? (
                <div className="scanner-prompt">
                  <div className="scanner-icon">📷</div>
                  <h3>Scan Barcode</h3>
                  <button onClick={startScanner} className="start-scanner-btn">
                    Start Camera Scanner
                  </button>
                  <p className="scanner-hint">Or enter barcode manually below</p>
                  {cameraError && (
                    <div style={{ background: '#fee2e2', border: '1px solid #ef4444', borderRadius: '8px', padding: '15px', marginTop: '15px' }}>
                      <p className="scanner-error" style={{ color: '#dc2626', fontWeight: '600', marginBottom: '10px' }}>
                        {cameraError}
                      </p>
                      <div style={{ fontSize: '13px', color: '#666', marginTop: '10px' }}>
                        <p style={{ fontWeight: '600', marginBottom: '5px' }}>💡 Troubleshooting Tips:</p>
                        <ul style={{ marginLeft: '20px', lineHeight: '1.6' }}>
                          <li>Make sure you're using <strong>Chrome, Edge, or Safari</strong></li>
                          <li>Check if camera is working in other apps</li>
                          <li>Try refreshing the page (F5)</li>
                          <li>Use <strong>manual input below</strong> - type or paste barcode</li>
                          <li>Use a USB barcode scanner (works like a keyboard)</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="scanner-container">
                  <div id="barcode-scanner"></div>
                  <button onClick={stopScanner} className="stop-scanner-btn">
                    Stop Scanner
                  </button>
                </div>
              )}

              {/* Manual Entry */}
              <div className="manual-entry">
                <label>Barcode / Serial Number</label>
                <div className="barcode-input-group">
                  <input
                    type="text"
                    value={scannedBarcode}
                    onChange={(e) => setScannedBarcode(e.target.value)}
                    placeholder="Enter or paste barcode"
                    onKeyPress={(e) => e.key === 'Enter' && handleScanBarcode()}
                  />
                  <button 
                    onClick={async () => {
                      try {
                        const text = await navigator.clipboard.readText();
                        setScannedBarcode(text);
                      } catch (err) {
                        alert('Please paste manually (long-press in field)');
                      }
                    }} 
                    className="paste-btn"
                    title="Paste from clipboard"
                  >
                    📋
                  </button>
                  <button onClick={() => handleScanBarcode()} className="scan-submit-btn">
                    Scan
                  </button>
                </div>
                <p className="scanner-app-hint">
                  💡 Tip: Use a barcode scanner app, then paste here
                </p>
                
                {/* Multi-Scan Mode Toggle */}
                {scanMode === 'in' && !scanResult && (
                  <div className="multi-scan-toggle">
                    <label className="toggle-label">
                      <input
                        type="checkbox"
                        checked={multiScanMode}
                        onChange={(e) => {
                          setMultiScanMode(e.target.checked);
                          if (!e.target.checked) setScannedItems([]);
                        }}
                      />
                      <span>Multi-Scan Mode (Scan multiple unique barcodes)</span>
                    </label>
                  </div>
                )}
              </div>

              {/* Multi-Scan List */}
              {multiScanMode && scannedItems.length > 0 && (
                <div className="scanned-items-list">
                  <h4>Scanned Items ({scannedItems.length})</h4>
                  <div className="items-grid">
                    {scannedItems.map((item, idx) => (
                      <div key={idx} className="scanned-item">
                        <span className="item-number">#{idx + 1}</span>
                        <span className="item-barcode">{item}</span>
                        <button 
                          onClick={() => setScannedItems(prev => prev.filter((_, i) => i !== idx))}
                          className="remove-item-btn"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                  <button 
                    onClick={() => {
                      setScanResult({ barcodes: scannedItems, step: 'select-material-multi' });
                    }}
                    className="process-batch-btn"
                  >
                    Process {scannedItems.length} Items →
                  </button>
                </div>
              )}

              {/* Scan Result */}
              {scanResult && (
                <div className="scan-result">
                  {scanResult.step === 'select-material-multi' ? (
                    <div className="material-selection">
                      <h3>Process {scanResult.barcodes.length} Items</h3>
                      <p className="barcode-display">
                        Scanned {scanResult.barcodes.length} unique barcodes
                      </p>
                      <select 
                        value={selectedMaterial || ''} 
                        onChange={(e) => setSelectedMaterial(e.target.value)}
                        className="material-select"
                      >
                        <option value="">-- Select Material --</option>
                        {materials.map(mat => (
                          <option key={mat._id} value={mat._id}>
                            {mat.name} ({mat.category})
                          </option>
                        ))}
                      </select>
                      
                      <button 
                        onClick={async () => {
                          if (!selectedMaterial) {
                            alert('Please select a material');
                            return;
                          }
                          
                          const token = localStorage.getItem('adminToken');
                          const config = { headers: { Authorization: `Bearer ${token}` } };
                          let successCount = 0;
                          let failCount = 0;

                          for (const barcode of scanResult.barcodes) {
                            try {
                              await axios.post(
                                'http://localhost:5000/api/v1/barcodes/scan/in',
                                {
                                  barcode,
                                  materialId: selectedMaterial,
                                  supplier: 'Manual Entry',
                                  location: 'Main Storage'
                                },
                                config
                              );
                              successCount++;
                            } catch (error) {
                              console.error(`Failed to scan ${barcode}:`, error);
                              failCount++;
                            }
                          }

                          const material = materials.find(m => m._id === selectedMaterial);
                          setScanHistory(prev => [{
                            barcode: 'Multiple',
                            material: material?.name,
                            action: `Stock In (${successCount}x)`,
                            time: new Date().toLocaleTimeString()
                          }, ...prev.slice(0, 9)]);

                          if (failCount === 0) {
                            alert(`✓ Successfully scanned in ${successCount} items!`);
                          } else {
                            alert(`⚠️ Scanned ${successCount} items, ${failCount} failed`);
                          }

                          setScannedItems([]);
                          setScanResult(null);
                          setSelectedMaterial(null);
                          setMultiScanMode(false);
                          fetchMaterials();
                        }} 
                        className="confirm-btn"
                        disabled={!selectedMaterial}
                      >
                        ✓ Confirm All {scanResult.barcodes.length} Items
                      </button>
                    </div>
                  ) : scanResult.step === 'select-material' ? (
                    <div className="material-selection">
                      <h3>Select Material Type</h3>
                      <p className="barcode-display">Barcode: <strong>{scannedBarcode}</strong></p>
                      <select 
                        value={selectedMaterial || ''} 
                        onChange={(e) => {
                          if (e.target.value === 'ADD_NEW') {
                            setShowAddForm(true);
                            setShowScanModal(false);
                          } else {
                            setSelectedMaterial(e.target.value);
                          }
                        }}
                        className="material-select"
                      >
                        <option value="">-- Select Material --</option>
                        {materials.map(mat => (
                          <option key={mat._id} value={mat._id}>
                            {mat.name} ({mat.category})
                          </option>
                        ))}
                        <option value="ADD_NEW" style={{ background: '#f0fdf4', color: '#16a34a', fontWeight: 'bold' }}>
                          ➕ Add New Material
                        </option>
                      </select>
                      {!selectedMaterial && (
                        <p style={{ fontSize: '12px', color: '#666', marginTop: '8px' }}>
                          💡 Don't see your material? Select "Add New Material"
                        </p>
                      )}
                      
                      <div className="quantity-section">
                        <label>Quantity (same barcode)</label>
                        <input
                          type="number"
                          min="1"
                          defaultValue="1"
                          id="batch-quantity"
                          className="quantity-input"
                          placeholder="Enter quantity"
                        />
                        <p className="quantity-hint">
                          For 50 items with SAME barcode, enter 50
                        </p>
                      </div>
                      
                      <button 
                        onClick={handleConfirmStockIn} 
                        className="confirm-btn"
                        disabled={!selectedMaterial}
                      >
                        ✓ Confirm Stock In
                      </button>
                    </div>
                  ) : (
                    <div className="item-details">
                      <h3>Item Found</h3>
                      <div className="detail-row">
                        <span>Material:</span>
                        <strong>{scanResult.materialId?.name}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Barcode:</span>
                        <strong>{scanResult.barcode}</strong>
                      </div>
                      <div className="detail-row">
                        <span>Status:</span>
                        <span className={`status-badge ${scanResult.status}`}>
                          {scanResult.status}
                        </span>
                      </div>
                      {scanResult.receivedDate && (
                        <div className="detail-row">
                          <span>Received:</span>
                          <span>{new Date(scanResult.receivedDate).toLocaleDateString()}</span>
                        </div>
                      )}
                      <button onClick={handleConfirmStockOut} className="confirm-btn danger">
                        ✓ Mark as Used
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Scan History */}
              {scanHistory.length > 0 && (
                <div className="scan-history">
                  <h3>Recent Scans</h3>
                  <div className="history-list">
                    {scanHistory.map((item, idx) => (
                      <div key={idx} className="history-item">
                        <span className={`action-badge ${item.action === 'Stock In' ? 'in' : 'out'}`}>
                          {item.action}
                        </span>
                        <span className="material-name">{item.material}</span>
                        <span className="time">{item.time}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
