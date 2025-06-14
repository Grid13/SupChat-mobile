import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

interface MessageActionsModalProps {
  visible: boolean;
  onClose: () => void;
  onReply: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onReaction: () => void;
  showEditDelete?: boolean;
}

const MessageActionsModal: React.FC<MessageActionsModalProps> = ({
  visible,
  onClose,
  onReply,
  onEdit,
  onDelete,
  onReaction,
  showEditDelete = false,
}) => {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPress={onClose}
      />
      <View style={styles.drawerContainer}>
        <Text style={styles.drawerTitle}>Que voulez-vous faire ?</Text>

        <TouchableOpacity style={styles.drawerButton} onPress={onReply}>
          <Text style={styles.drawerButtonText}>Répondre</Text>
        </TouchableOpacity>

        {showEditDelete && (
          <>
            <TouchableOpacity style={styles.drawerButton} onPress={onEdit}>
              <Text style={styles.drawerButtonText}>Modifier</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.drawerButton, styles.deleteButton]}
              onPress={onDelete}
            >
              <Text style={[styles.drawerButtonText, styles.deleteText]}>
                Supprimer
              </Text>
            </TouchableOpacity>
          </>
        )}

        <TouchableOpacity style={styles.drawerButton} onPress={onReaction}>
          <Text style={styles.drawerButtonText}>Ajouter une réaction</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.drawerButton} onPress={onClose}>
          <Text style={styles.drawerButtonText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  drawerContainer: {
    backgroundColor: '#fff',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 20,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  drawerTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  drawerButton: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  drawerButtonText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  deleteButton: {
    borderColor: '#eee',
  },
  deleteText: {
    color: '#E53935',
    fontWeight: '600',
  },
});

export default MessageActionsModal;
