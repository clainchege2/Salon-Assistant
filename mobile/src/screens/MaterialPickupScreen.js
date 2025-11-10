import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Alert, Modal } from 'react-native';
import { Camera } from 'expo-camera';
import { BarCodeScanner } from 'expo-barcode-scanner';
import api from '../services/api';

export default function MaterialPickupScreen({ navigation }) {
  const [hasPermission, setHasPermission] = useState(null);
  const [scanning, setScanning] = useState(false);
  const [materials, setMaterials] = useState([]);
  const [scannedItems, setScannedItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    requestCameraPermission();
    fetchMaterials();
  }, []);

  const requestCameraPermission = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  const fetchMaterials = async () => {
    try {
      const response = await api.get('/materials');
      setMaterials(response.data.data || []);
    } catch (error) {
      console.error('Error fetching materials:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBarCodeScanned = ({ type, data }) => {
    setScanning(false);
    
    // Find material by barcode
    const material = materials.find(m => m.barcode === data);
    
    if (material) {
      // Check if already scanned
      const existing = scannedItems.find(item => item._id === material._id);
      
      if (existing) {
        // Increase quantity
        setScannedItems(scannedItems.map(item =>
          item._id === material._id
            ? { ...item, pickedQuantity: item.pickedQuantity + 1 }
            : item
        ));
      } else {
        // Add new item
        setScannedItems([...scannedItems, { ...material, pickedQuantity: 1 }]);
      }
      
      Alert.alert(
        'Material Scanned',
        `${material.name} added to pickup list`,
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Not Found',
        'Material not found in inventory. Please check the barcode.',
        [{ text: 'OK' }]
      );
    }
  };

  const removeItem = (materialId) => {
    setScannedItems(scannedItems.filter(item => item._id !== materialId));
  };

  const updateQuantity = (materialId, change) => {
    setScannedItems(scannedItems.map(item => {
      if (item._id === materialId) {
        const newQty = Math.max(1, item.pickedQuantity + change);
        return { ...item, pickedQuantity: newQty };
      }
      return item;
    }));
  };

  const confirmPickup = async () => {
    if (scannedItems.length === 0) {
      Alert.alert('No Items', 'Please scan materials first');
      return;
    }

    try {
      // Record material pickup
      await api.post('/materials/pickup', {
        items: scannedItems.map(item => ({
          materialId: item._id,
          quantity: item.pickedQuantity
        }))
      });

      Alert.alert(
        'Success',
        'Materials picked up successfully!',
        [
          {
            text: 'OK',
            onPress: () => {
              setScannedItems([]);
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to record pickup. Please try again.');
    }
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Camera permission denied</Text>
        <Text style={styles.errorSubtext}>
          Please enable camera access in your device settings to scan barcodes
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Material Pickup</Text>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.scanButton}
          onPress={() => setScanning(true)}
        >
          <Text style={styles.scanIcon}>📷</Text>
          <Text style={styles.scanText}>Scan Barcode</Text>
        </TouchableOpacity>

        <View style={styles.listHeader}>
          <Text style={styles.listTitle}>Scanned Items ({scannedItems.length})</Text>
        </View>

        {scannedItems.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>📦</Text>
            <Text style={styles.emptyText}>No items scanned yet</Text>
            <Text style={styles.emptySubtext}>Tap "Scan Barcode" to start</Text>
          </View>
        ) : (
          <FlatList
            data={scannedItems}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.itemCard}>
                <View style={styles.itemInfo}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemCategory}>{item.category}</Text>
                  <Text style={styles.itemStock}>
                    Available: {item.quantityInStock} {item.unit}
                  </Text>
                </View>
                <View style={styles.itemActions}>
                  <View style={styles.quantityControl}>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQuantity(item._id, -1)}
                    >
                      <Text style={styles.qtyButtonText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.quantity}>{item.pickedQuantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyButton}
                      onPress={() => updateQuantity(item._id, 1)}
                    >
                      <Text style={styles.qtyButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removeItem(item._id)}
                  >
                    <Text style={styles.removeText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          />
        )}

        {scannedItems.length > 0 && (
          <TouchableOpacity
            style={styles.confirmButton}
            onPress={confirmPickup}
          >
            <Text style={styles.confirmText}>Confirm Pickup</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Barcode Scanner Modal */}
      <Modal
        visible={scanning}
        animationType="slide"
        onRequestClose={() => setScanning(false)}
      >
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanning ? handleBarCodeScanned : undefined}
            style={StyleSheet.absoluteFillObject}
          />
          <View style={styles.scannerOverlay}>
            <Text style={styles.scannerTitle}>Scan Material Barcode</Text>
            <View style={styles.scannerFrame} />
            <Text style={styles.scannerHint}>
              Position the barcode within the frame
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setScanning(false)}
            >
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa'
  },
  header: {
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#667eea'
  },
  backButton: {
    color: 'white',
    fontSize: 16,
    marginBottom: 12
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white'
  },
  content: {
    flex: 1,
    padding: 20
  },
  scanButton: {
    backgroundColor: '#667eea',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5
  },
  scanIcon: {
    fontSize: 48,
    marginBottom: 8
  },
  scanText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  listHeader: {
    marginBottom: 16
  },
  listTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333'
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999'
  },
  itemCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2
  },
  itemInfo: {
    flex: 1
  },
  itemName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  itemCategory: {
    fontSize: 13,
    color: '#667eea',
    textTransform: 'capitalize',
    marginBottom: 4
  },
  itemStock: {
    fontSize: 12,
    color: '#999'
  },
  itemActions: {
    alignItems: 'center',
    gap: 12
  },
  quantityControl: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4
  },
  qtyButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 6
  },
  qtyButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#667eea'
  },
  quantity: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginHorizontal: 16,
    minWidth: 30,
    textAlign: 'center'
  },
  removeButton: {
    padding: 8
  },
  removeText: {
    fontSize: 20
  },
  confirmButton: {
    backgroundColor: '#10b981',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 16
  },
  confirmText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    paddingHorizontal: 40
  },
  scannerContainer: {
    flex: 1
  },
  scannerOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 60
  },
  scannerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8
  },
  scannerFrame: {
    width: 250,
    height: 250,
    borderWidth: 3,
    borderColor: 'white',
    borderRadius: 12,
    backgroundColor: 'transparent'
  },
  scannerHint: {
    fontSize: 16,
    color: 'white',
    backgroundColor: 'rgba(0,0,0,0.7)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    textAlign: 'center'
  },
  cancelButton: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12
  },
  cancelText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold'
  }
});
