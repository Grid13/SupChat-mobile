import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { RootState } from './store/store';
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

export interface NotificationModel {
  Id: number;
  Content: string;
  Type: string;
  TypeLocalized: string;
  IsActive: boolean;
  MessageId: number;
  UserId: string;
}

interface NotificationItemProps {
  notification: NotificationModel;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ notification }) => (
  <View style={styles.container}>
    <Text style={styles.type}>{notification.TypeLocalized}</Text>
    <Text style={styles.content}>{notification.Content}</Text>
  </View>
);

const Notification: React.FC = () => {
  const token = useSelector((state: RootState) => state.auth.token);
  const [notifications, setNotifications] = useState<NotificationModel[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const res = await fetch('http://'+ipAddress+':5263/api/Notification', {
          headers: {
            Accept: 'text/plain',
            Authorization: `Bearer ${token}`,
          },
        });
        const text = await res.text();
        const data = JSON.parse(text || '[]');
        const mapped: NotificationModel[] = data.map((n: any) => ({
          Id: n.id,
          Content: n.content,
          Type: n.type,
          TypeLocalized: n.typeLocalized,
          IsActive: n.isActive,
          MessageId: n.messageId,
          UserId: n.userId,
        }));
        const filtered = mapped.filter((n) => n.IsActive);
        setNotifications(filtered);
      } catch (e: any) {
        Alert.alert('Erreur', e.message || 'Chargement des notifications échoué');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchNotifications();
  }, [token]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#fff' }}>
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, color: '#6C8AF5', fontWeight: 'bold', marginBottom: 20 }}>
          Notifications
        </Text>
        {notifications.length === 0 && !loading && (
          <Text style={{ color: '#888', fontSize: 16, marginTop: 30 }}>Aucune notification</Text>
        )}
        <ScrollView contentContainerStyle={styles.listContainer} style={{ alignSelf: 'stretch' }}>
          {notifications.map((notif) => (
            <NotificationItem key={notif.Id} notification={notif} />
          ))}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  listContainer: {
    padding: 8,
  },
  container: {
    flexDirection: 'column',
    backgroundColor: '#6C8AF5',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  type: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  content: {
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default Notification;
