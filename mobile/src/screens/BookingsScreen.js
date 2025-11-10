import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import api from '../services/api';

export default function BookingsScreen() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const response = await api.get('/bookings');
      setBookings(response.data.data || []);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderBooking = ({ item }) => (
    <TouchableOpacity style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <Text style={styles.clientName}>
          {item.clientId?.firstName} {item.clientId?.lastName}
        </Text>
        <View style={[styles.statusBadge, styles[item.status]]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
      </View>
      <Text style={styles.service}>
        {item.services?.map(s => s.serviceName).join(', ')}
      </Text>
      <Text style={styles.date}>
        {new Date(item.scheduledDate).toLocaleString()}
      </Text>
      <Text style={styles.price}>KES {item.totalPrice}</Text>
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
        <Text style={styles.title}>Bookings</Text>
      </View>
      <FlatList
        data={bookings}
        renderItem={renderBooking}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.emptyText}>No bookings found</Text>
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
  bookingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  bookingHeader: {
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize'
  },
  pending: {
    backgroundColor: '#fef3c7'
  },
  confirmed: {
    backgroundColor: '#dbeafe'
  },
  completed: {
    backgroundColor: '#d1fae5'
  },
  cancelled: {
    backgroundColor: '#fee2e2'
  },
  service: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  date: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4
  },
  price: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#667eea'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 40
  }
});
