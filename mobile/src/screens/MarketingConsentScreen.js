import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Switch, ScrollView } from 'react-native';
import api from '../services/api';

export default function MarketingConsentScreen({ navigation, route }) {
  const { clientId } = route.params;
  
  const [consent, setConsent] = useState({
    sms: false,
    email: false,
    whatsapp: false
  });

  const handleSave = async () => {
    try {
      await api.put(`/clients/${clientId}`, {
        marketingConsent: consent
      });
      
      navigation.navigate('Home');
    } catch (error) {
      console.error('Error saving consent:', error);
    }
  };

  const handleSkip = () => {
    navigation.navigate('Home');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.icon}>📱</Text>
        <Text style={styles.title}>Stay Connected</Text>
        <Text style={styles.subtitle}>
          Get exclusive offers, birthday wishes, and appointment reminders
        </Text>

        <View style={styles.consentCard}>
          <Text style={styles.cardTitle}>How can we reach you?</Text>
          
          <View style={styles.consentItem}>
            <View style={styles.consentInfo}>
              <Text style={styles.consentLabel}>📱 SMS Messages</Text>
              <Text style={styles.consentDesc}>
                Appointment reminders & special offers
              </Text>
            </View>
            <Switch
              value={consent.sms}
              onValueChange={(value) => setConsent({ ...consent, sms: value })}
              trackColor={{ false: '#d1d5db', true: '#9F7AEA' }}
              thumbColor={consent.sms ? '#6B46C1' : '#f4f3f4'}
            />
          </View>

          <View style={styles.consentItem}>
            <View style={styles.consentInfo}>
              <Text style={styles.consentLabel}>💬 WhatsApp</Text>
              <Text style={styles.consentDesc}>
                Quick updates & personalized messages
              </Text>
            </View>
            <Switch
              value={consent.whatsapp}
              onValueChange={(value) => setConsent({ ...consent, whatsapp: value })}
              trackColor={{ false: '#d1d5db', true: '#9F7AEA' }}
              thumbColor={consent.whatsapp ? '#6B46C1' : '#f4f3f4'}
            />
          </View>

          <View style={styles.consentItem}>
            <View style={styles.consentInfo}>
              <Text style={styles.consentLabel}>📧 Email</Text>
              <Text style={styles.consentDesc}>
                Monthly newsletters & exclusive deals
              </Text>
            </View>
            <Switch
              value={consent.email}
              onValueChange={(value) => setConsent({ ...consent, email: value })}
              trackColor={{ false: '#d1d5db', true: '#9F7AEA' }}
              thumbColor={consent.email ? '#6B46C1' : '#f4f3f4'}
            />
          </View>
        </View>

        <View style={styles.benefits}>
          <Text style={styles.benefitsTitle}>✨ Benefits of staying connected:</Text>
          <Text style={styles.benefit}>🎂 Birthday month special offers</Text>
          <Text style={styles.benefit}>⏰ Never miss an appointment</Text>
          <Text style={styles.benefit}>💰 Exclusive discounts & promotions</Text>
          <Text style={styles.benefit}>🆕 First to know about new services</Text>
        </View>

        <View style={styles.privacy}>
          <Text style={styles.privacyText}>
            🔒 Your privacy matters. We'll never share your information. 
            You can change these preferences anytime in Settings.
          </Text>
        </View>

        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Preferences</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafafa'
  },
  content: {
    padding: 24,
    paddingTop: 60
  },
  icon: {
    fontSize: 64,
    textAlign: 'center',
    marginBottom: 16
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#1d1d1f',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.5
  },
  subtitle: {
    fontSize: 17,
    color: '#86868b',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24
  },
  consentCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 20
  },
  consentItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  consentInfo: {
    flex: 1,
    marginRight: 16
  },
  consentLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 4
  },
  consentDesc: {
    fontSize: 13,
    color: '#86868b',
    lineHeight: 18
  },
  benefits: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    marginBottom: 24
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1d1d1f',
    marginBottom: 12
  },
  benefit: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20
  },
  privacy: {
    backgroundColor: '#eef2ff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24
  },
  privacyText: {
    fontSize: 13,
    color: '#6B46C1',
    lineHeight: 20,
    textAlign: 'center'
  },
  saveButton: {
    backgroundColor: '#6B46C1',
    padding: 18,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12
  },
  saveButtonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: '600'
  },
  skipButton: {
    padding: 18,
    alignItems: 'center'
  },
  skipButtonText: {
    color: '#86868b',
    fontSize: 15,
    fontWeight: '500'
  }
});
