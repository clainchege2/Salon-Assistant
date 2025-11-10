import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import api from '../services/api';

export default function ClientsScreen() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const response = await api.get('/clients');
      setClients(response.data.data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderClient = ({ item }) => (
    <TouchableOpacity style={styles.clientCard}>
      <View style={styles.clientHeader}>
        <Text style={styles.clientName}>
          {item.firstName} {item.lastName}
        </Text>
        <View style={[styles.categoryBadge, styles[item.category]]}>
          <Text style={styles.categoryText}>{item.category}</Text>
        </View>
      </View>
      <Text style={styles.phone}>{item.phone}</Text>
      {item.email && <Text style={styles.email}>{item.email}</Text>}
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Clients</Text>
      </View>
      <FlatList
        data={clients}
        renderItem={renderClient}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No clients found</Text>
        }
      />
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white'
  },
  list: {
    padding: 20
  },
  clientCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  clientHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
    color: 'white'
  },
  new: {
    backgroundColor: '#3b82f6'
  },
  vip: {
    backgroundColor: '#f59e0b'
  },
  usual: {
    backgroundColor: '#10b981'
  },
  'longtime-no-see': {
    backgroundColor: '#ef4444'
  },
  phone: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  email: {
    fontSize: 14,
    color: '#666'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 40
  }
});
