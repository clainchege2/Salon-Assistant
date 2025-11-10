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
  const scannerRef = useRef(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    category: 'hair-extensions',
    unit: 'packs',
    currentStock: 0,
    minimumStock: 5,
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
      await axios.post('http://localhost:5000/api/v1/materials', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

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
      alert('Failed to add material');
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
          setCameraError('Camera permission denied. Please click the camera icon in your address bar and allow camera access.');
          return;
        } else if (permError.name === 'NotFoundError') {
          setCameraError('No camera found on this device.');
          return;
        } else if (permError.name === 'NotReadableError') {
          setCameraError('Camera is in use by another application. Please close Tobii or other camera apps.');
          return;
        } else {
          throw permError;
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
        <h1>Stock Management</h1>
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

            <button 
              onClick={() => setShowRestockForm(material._id)} 
              className="restock-btn"
            >
              Restock
            </button>

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

      {showAddForm && (
        <div className="modal-overlay" onClick={() => setShowAddForm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>Add New Material</h2>
            <form onSubmit={handleAddMaterial}>
              <div className="form-group">
                <label>Material Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Category *</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
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
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
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
                  <label>Current Stock *</label>
                  <input
                    type="number"
                    value={formData.currentStock}
                    onChange={(e) => setFormData({ ...formData, currentStock: e.target.value })}
                    min="0"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Minimum Stock *</label>
                  <input
                    type="number"
                    value={formData.minimumStock}
                    onChange={(e) => setFormData({ ...formData, minimumStock: e.target.value })}
                    min="0"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Cost Per Unit</label>
                  <input
                    type="number"
                    value={formData.costPerUnit}
                    onChange={(e) => setFormData({ ...formData, costPerUnit: e.target.value })}
                    min="0"
                  />
                </div>

                <div className="form-group">
                  <label>Supplier</label>
                  <input
                    type="text"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit">Add Material</button>
                <button type="button" onClick={() => setShowAddForm(false)}>Cancel</button>
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
                    <p className="scanner-error">{cameraError}</p>
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
