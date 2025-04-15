import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
} from 'react-native';

interface DropdownMenuProps {
  visible: boolean;
  onClose: () => void;
  onViewInfo?: () => void;
}

const DropdownMenu: React.FC<DropdownMenuProps> = ({ visible, onClose, onViewInfo }) => {
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
          <TouchableOpacity onPress={onClose}>
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
