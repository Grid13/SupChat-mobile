import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useRouter } from 'expo-router'; 
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

interface DropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  onViewInfo?: () => void;
  workspaceId: number; 
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ visible, onClose, onViewInfo, workspaceId }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter(); 
  

  

  const leaveWorkspace = async () => {
    try {
      const res = await fetch(`http://${ipAddress}:5263/api/Workspace/${workspaceId}/Leave`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        Alert.alert('Success', 'You have left the workspace.');
        onClose();
        router.push('/(tabs)/Workspaces');
      } else {
        Alert.alert('Error', `Failed to leave workspace (status ${res.status}).`);
        console.error('[DropdownMenu] Error leaving workspace:', res.statusText);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An error occurred.');
    }
  };

  const confirmLeaveWorkspace = () => {
    Alert.alert(
      'Leave Workspace',
      'Are you sure you want to leave this workspace?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: leaveWorkspace },
      ]
    );
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.menu}>
          <TouchableOpacity
            onPress={() => {
              onClose();
              onViewInfo?.();
            }}
          >
            <Text style={styles.menuItem}>View Workspace Info</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.menuItem}>Mute Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmLeaveWorkspace}>
            <Text style={styles.menuItemDanger}>Leave Workspace</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

export default DropdownMenu;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 60,
    paddingRight: 15,
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  menu: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    padding: 10,
    width: 200,
  },
  menuItem: {
    paddingVertical: 10,
    fontSize: 16,
  },
  menuItemDanger: {
    paddingVertical: 10,
    fontSize: 16,
    color: 'red',
  },
});
