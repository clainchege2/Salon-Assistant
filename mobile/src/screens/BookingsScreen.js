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

  const renderBooking = ({ item }) => {
    const date = new Date(item.scheduledDate);
    const timeStr = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    return (
      <View style={styles.timelineItem}>
        {/* Timeline Dot */}
        <View style={styles.timelineDot}>
          <View style={[styles.dot, styles[`${item.status}Dot`]]} />
          <View style={styles.timelineLine} />
        </View>

        {/* Card Content */}
        <TouchableOpacity style={styles.bookingCard}>
          {/* Top Section: Client & Status */}
          <View style={styles.cardTop}>
            <View style={styles.clientSection}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.clientId?.firstName?.charAt(0)}{item.clientId?.lastName?.charAt(0)}
                </Text>
              </View>
              <View>
                <Text style={styles.clientName}>
                  {item.clientId?.firstName} {item.clientId?.lastName}
                </Text>
                <Text style={styles.dateText}>{dateStr} • {timeStr}</Text>
              </View>
            </View>
          </View>

          {/* Service */}
          <Text style={styles.service}>
            {item.services?.map(s => s.serviceName).join(', ')}
          </Text>

          {/* Bottom Section: Status & Price */}
          <View style={styles.cardBottom}>
            <View style={[styles.statusPill, styles[item.status]]}>
              <View style={[styles.statusDot, styles[`${item.status}Dot`]]} />
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
            <Text style={styles.price}>KES {item.totalPrice?.toLocaleString()}</Text>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

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
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 20
  },
  timelineDot: {
    width: 40,
    alignItems: 'center',
    marginRight: 12
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 3,
    borderColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2
  },
  pendingDot: {
    backgroundColor: '#f59e0b'
  },
  confirmedDot: {
    backgroundColor: '#10b981'
  },
  completedDot: {
    backgroundColor: '#6366f1'
  },
  cancelledDot: {
    backgroundColor: '#ef4444'
  },
  timelineLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#e5e7eb',
    marginTop: 4
  },
  bookingCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  cardTop: {
    marginBottom: 12
  },
  clientSection: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#667eea',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  clientName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 2
  },
  dateText: {
    fontSize: 12,
    color: '#9ca3af',
    fontWeight: '500'
  },
  service: {
    fontSize: 14,
    color: '#4b5563',
    marginBottom: 14,
    lineHeight: 20
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6
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
    backgroundColor: '#d1fae5'
  },
  completed: {
    backgroundColor: '#e0e7ff'
  },
  cancelled: {
    backgroundColor: '#fee2e2'
  },
  price: {
    fontSize: 19,
    fontWeight: '800',
    color: '#10b981'
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    padding: 40
  }
});
