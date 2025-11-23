import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { AuthContext } from '../context/AuthContext';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const { user } = useContext(AuthContext);
  const [stats, setStats] = useState({ bookings: 0, clients: 0, services: 0 });
  const [recentBookings, setRecentBookings] = useState([]);
  const [mySchedule, setMySchedule] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const isStylist = user?.role === 'stylist';

  useEffect(() => {
    fetchData();
    
    // Auto-refresh every 30 seconds for real-time updates
    const refreshInterval = setInterval(() => {
      fetchData();
    }, 30000);

    return () => clearInterval(refreshInterval);
  }, []);

  const fetchData = async () => {
    try {
      if (isStylist) {
        // Stylists see all their upcoming bookings (backend filters by role automatically)
        const scheduleRes = await api.get('/bookings');
        console.log('Stylist bookings response:', scheduleRes.data);
        
        // Filter to show only upcoming bookings (not cancelled, completed, or no-show)
        const allBookings = scheduleRes.data.data || [];
        console.log('Total bookings:', allBookings.length);
        
        const upcoming = allBookings.filter(booking => {
          const bookingDate = new Date(booking.scheduledDate);
          const now = new Date();
          const isUpcoming = bookingDate > now;
          const isNotExcluded = !['cancelled', 'completed', 'no-show'].includes(booking.status);
          console.log(`Booking ${booking._id}: date=${bookingDate}, isUpcoming=${isUpcoming}, status=${booking.status}, isNotExcluded=${isNotExcluded}`);
          return isUpcoming && isNotExcluded;
        });
        
        console.log('Filtered upcoming bookings:', upcoming.length);
        setMySchedule(upcoming);
      } else {
        // Owners/Managers see full stats
        const [bookingsRes, clientsRes, servicesRes] = await Promise.all([
          api.get('/bookings?limit=5'),
          api.get('/clients'),
          api.get('/services')
        ]);

        setStats({
          bookings: bookingsRes.data.count || 0,
          clients: clientsRes.data.count || 0,
          services: servicesRes.data.count || 0
        });

        setRecentBookings(bookingsRes.data.data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (isStylist) {
    // Stylist View - Task-focused
    return (
      <ScrollView
        style={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={styles.title}>My Schedule</Text>
          <Text style={styles.subtitle}>Hi {user?.firstName}! 👋</Text>
        </View>

        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('MaterialPickup')}
          >
            <Text style={styles.actionIcon}>📦</Text>
            <Text style={styles.actionText}>Pick Materials</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => navigation.navigate('Bookings')}
          >
            <Text style={styles.actionIcon}>📅</Text>
            <Text style={styles.actionText}>My Bookings</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Today's Appointments</Text>
          {mySchedule.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyText}>No appointments scheduled</Text>
              <Text style={styles.emptySubtext}>Enjoy your free time!</Text>
            </View>
          ) : (
            mySchedule.map((booking) => (
              <View key={booking._id} style={styles.scheduleCard}>
                <View style={styles.scheduleHeader}>
                  <Text style={styles.scheduleTime}>
                    {new Date(booking.scheduledDate).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </Text>
                  <View style={styles.statusBadge}>
                    <Text style={styles.statusText}>{booking.status}</Text>
                  </View>
                </View>
                <Text style={styles.scheduleClient}>
                  {booking.clientId?.firstName} {booking.clientId?.lastName}
                </Text>
                <Text style={styles.scheduleService}>
                  {booking.services?.map(s => s.serviceName).join(', ')}
                </Text>
                {booking.services?.some(s => s.materialsRequired?.length > 0) && (
                  <View style={styles.materialsSection}>
                    <Text style={styles.materialsTitle}>📦 Materials Needed:</Text>
                    {booking.services.map((service, idx) => 
                      service.materialsRequired?.map((material, midx) => (
                        <Text key={`${idx}-${midx}`} style={styles.materialItem}>
                          • {material.name} (Qty: {material.quantity})
                        </Text>
                      ))
                    )}
                  </View>
                )}
                {booking.customerInstructions && (
                  <View style={styles.instructionsBox}>
                    <Text style={styles.instructionsLabel}>💬 Client Notes:</Text>
                    <Text style={styles.instructionsText}>{booking.customerInstructions}</Text>
                  </View>
                )}
              </View>
            ))
          )}
        </View>
      </ScrollView>
    );
  }

  // Owner/Manager View - Full Dashboard
  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Dashboard</Text>
        <Text style={styles.subtitle}>Welcome back, {user?.firstName}!</Text>
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.bookings}</Text>
          <Text style={styles.statLabel}>Bookings</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.clients}</Text>
          <Text style={styles.statLabel}>Clients</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statNumber}>{stats.services}</Text>
          <Text style={styles.statLabel}>Services</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Bookings</Text>
        {recentBookings.length === 0 ? (
          <Text style={styles.emptyText}>No bookings yet</Text>
        ) : (
          recentBookings.map((booking) => (
            <View key={booking._id} style={styles.bookingCard}>
              <Text style={styles.bookingClient}>
                {booking.clientId?.firstName} {booking.clientId?.lastName}
              </Text>
              <Text style={styles.bookingService}>
                {booking.services?.map(s => s.serviceName).join(', ')}
              </Text>
              <Text style={styles.bookingDate}>
                {new Date(booking.scheduledDate).toLocaleDateString()}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
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
  subtitle: {
    fontSize: 16,
    color: 'white',
    marginTop: 4
  },
  quickActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12
  },
  actionButton: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  actionIcon: {
    fontSize: 32,
    marginBottom: 8
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  statsContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 10
  },
  statCard: {
    flex: 1,
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center'
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333'
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  section: {
    padding: 20
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333'
  },
  emptyState: {
    backgroundColor: 'white',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center'
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12
  },
  emptyText: {
    textAlign: 'center',
    color: '#999',
    fontSize: 16,
    fontWeight: '600'
  },
  emptySubtext: {
    textAlign: 'center',
    color: '#ccc',
    fontSize: 14,
    marginTop: 4
  },
  scheduleCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  scheduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  scheduleTime: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#667eea'
  },
  statusBadge: {
    backgroundColor: '#e0e7ff',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#667eea',
    textTransform: 'capitalize'
  },
  scheduleClient: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  scheduleService: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12
  },
  materialsSection: {
    backgroundColor: '#f8f9fa',
    padding: 12,
    borderRadius: 8,
    marginTop: 8
  },
  materialsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6
  },
  materialItem: {
    fontSize: 13,
    color: '#666',
    marginLeft: 8,
    marginTop: 2
  },
  instructionsBox: {
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#ffc107'
  },
  instructionsLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#856404',
    marginBottom: 4
  },
  instructionsText: {
    fontSize: 13,
    color: '#856404',
    lineHeight: 18
  },
  bookingCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12
  },
  bookingClient: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  bookingService: {
    fontSize: 14,
    color: '#666',
    marginTop: 4
  },
  bookingDate: {
    fontSize: 12,
    color: '#999',
    marginTop: 4
  }
});
