import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  ScrollView,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useRouter } from 'expo-router'; 
import dotenv from 'dotenv';
import * as Clipboard from 'expo-clipboard';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

interface DropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  workspaceId: number; 
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ visible, onClose, workspaceId }) => {
  const token = useSelector((state: RootState) => state.auth.token);
  const router = useRouter(); 
  
  const [nonMembers, setNonMembers] = useState<any[]>([]);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

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

  const copyInvitationLink = async () => {
    try {
      const res = await fetch(`http://${ipAddress}:5263/api/Workspace/${workspaceId}/invitations/generate`, {
        method: 'POST',
        headers: {
          Accept: 'text/plain',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const invitationLink = await res.text();
        await Clipboard.setStringAsync(invitationLink);
        Alert.alert('Success', 'Invitation link copied to clipboard.');
      } else {
        Alert.alert('Error', `Failed to generate invitation link (status ${res.status}).`);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An error occurred.');
    }
  };

  const fetchNonMembers = async () => {
    try {
      const res = await fetch(`http://${ipAddress}:5263/api/Workspace/${workspaceId}/NonMembers?pageNumber=1&pageSize=10`, {
        headers: {
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setNonMembers(data);
      } else {
        Alert.alert('Error', `Failed to fetch non-members (status ${res.status}).`);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An error occurred.');
    }
  };

  const sendInvitation = async () => {
    if (!selectedUserId) return;
    try {
      const res = await fetch(`http://${ipAddress}:5263/api/Workspace/${workspaceId}/invitations/generate/${selectedUserId}/email`, {
        method: 'POST',
        headers: {
          Accept: 'text/plain',
          Authorization: `Bearer ${token}`,
        },
      });
      if (res.ok) {
        Alert.alert('Success', 'Invitation sent successfully.');
        setShowInviteModal(false);
      } else {
        Alert.alert('Error', `Failed to send invitation (status ${res.status}).`);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message || 'An error occurred.');
    }
  };

  return (
    <Modal transparent visible={visible} animationType="fade">
      <TouchableOpacity style={styles.overlay} onPress={onClose} activeOpacity={1}>
        <View style={styles.menu}>
          <TouchableOpacity onPress={copyInvitationLink}>
            <Text style={styles.menuItem}>Copy Invitation Link</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => {
            fetchNonMembers();
            setShowInviteModal(true);
          }}>
            <Text style={styles.menuItem}>Send Invitation</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={confirmLeaveWorkspace}>
            <Text style={styles.menuItemDanger}>Leave Workspace</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>

      {showInviteModal && (
        <Modal transparent visible={showInviteModal} animationType="slide">
          <View style={styles.modalOverlay}>
            <View style={styles.inviteModal}>
              <Text style={styles.modalTitle}>Select a User to Invite</Text>
              {nonMembers.length > 0 && (
                <ScrollView style={{ maxHeight: 200 }}>
                  {nonMembers.map((user) => (
                    <TouchableOpacity
                      key={user.id}
                      style={[
                        styles.userItem,
                        selectedUserId === user.id && styles.selectedUserItem,
                      ]}
                      onPress={() => setSelectedUserId(user.id)}
                    >
                      <Text style={styles.userText}>{user.username}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
              {selectedUserId && (
                <Text style={styles.selectedUserText}>Selected User: {nonMembers.find(user => user.id === selectedUserId)?.username}</Text>
              )}
              <View style={styles.modalButtons}>
                <TouchableOpacity
                  style={[styles.modalButton, styles.cancelButton]}
                  onPress={() => setShowInviteModal(false)}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={sendInvitation}
                >
                  <Text style={styles.createButtonText}>Send</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, styles.createButton]}
                  onPress={copyInvitationLink}
                >
                  <Text style={styles.createButtonText}>Copy Link</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}
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
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  inviteModal: {
    backgroundColor: '#fff',
    borderRadius: 8,
    elevation: 5,
    padding: 20,
    width: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  userItem: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
  userText: {
    fontSize: 16,
  },
  selectedUserItem: {
    backgroundColor: '#d3d3d3',
  },
  selectedUserText: {
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 15,
  },
  modalButton: {
    flex: 1,
    borderRadius: 5,
    paddingVertical: 10,
    marginHorizontal: 5,
  },
  cancelButton: {
    backgroundColor: '#f44336',
  },
  createButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
  createButtonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});
