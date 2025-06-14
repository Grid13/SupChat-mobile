import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  Image,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store/store';
import { useProfileImage } from '../hooks/useProfileImage';
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;

const screenHeight = Dimensions.get('window').height;

interface Props {
  visible: boolean;
  onClose: () => void;
  workspaceName: string;
  workspaceId?: number; // Accept workspaceId as optional for compatibility
}

const WorkspaceInfoSheet: React.FC<Props> = ({ visible, onClose, workspaceName, workspaceId }) => {
  const translateY = React.useRef(new Animated.Value(screenHeight)).current;
  const [isVisible, setIsVisible] = useState(visible);
  const token = useSelector((state: RootState) => state.auth.token);

  // Update internal visibility state when prop changes
  useEffect(() => {
    console.log('WorkspaceInfoSheet visibility prop changed:', visible);
    setIsVisible(visible);
  }, [visible]);

  useEffect(() => {
    console.log('Animation triggered. isVisible:', isVisible);
    if (isVisible) {
      translateY.setValue(screenHeight);
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start(() => console.log('Open animation completed'));
    } else {
      Animated.spring(translateY, {
        toValue: screenHeight,
        useNativeDriver: true,
        tension: 65,
        friction: 11
      }).start(() => console.log('Close animation completed'));
    }
  }, [isVisible]);

  const members = Array.from({ length: 5 }).map((_, idx) => ({
    name: `Member ${idx + 1}`,
    avatar: `https://randomuser.me/api/portraits/men/${idx * 10}.jpg`,
  }));

  // Use local state for visibility
  return (
    <Modal 
      visible={isVisible}
      transparent
      statusBarTranslucent
      animationType="fade"
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={{ flex: 1 }}
          activeOpacity={1} 
          onPress={() => {
            console.log('Overlay pressed, calling onClose');
            onClose();
          }}
        />
        <Animated.View 
          style={[
            styles.sheet,
            { transform: [{ translateY }] }
          ]}
          onStartShouldSetResponder={() => true}
          onTouchEnd={e => e.stopPropagation()}
        >
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.title}>{workspaceName}</Text>

            {/* Members */}
            <Section title="Members" count={5}>
              <View style={styles.membersContainer}>
                {members.map((user, idx) => {
                  const safeToken = token || '';
                  const avatarUri = useProfileImage(user.avatar, safeToken) || user.avatar || "https://ui-avatars.com/api/?name=" + encodeURIComponent(user.name || "User");
                  return (
                    <View key={idx} style={styles.member}>
                      <View style={styles.avatarContainer}>
                        <Image source={{ uri: avatarUri }} style={styles.memberAvatar} />
                        <View style={styles.onlineDot} />
                      </View>
                      <Text style={styles.memberName}>{user.name}</Text>
                    </View>
                  );
                })}
              </View>
            </Section>

            {/* Shared */}
            <Section title="Shared" count={24}>
              <View style={styles.sharedItem}>
                <Image source={{ uri: "https://img.icons8.com/ios-filled/50/document--v1.png" }} style={styles.sharedIcon} />
                <Text style={styles.sharedText}>backFunction.txt</Text>
              </View>
              <View style={styles.sharedItem}>
                <Image source={{ uri: "https://img.icons8.com/ios-filled/50/ms-word.png" }} style={styles.sharedIcon} />
                <View>
                  <Text style={styles.sharedText}>Sprint Debrief</Text>
                  <Text style={styles.sharedSub}>https://docs.google.com/document/</Text>
                </View>
              </View>
            </Section>
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
};

export default WorkspaceInfoSheet;

const Section = ({ title, count, children }: any) => (
  <View style={{ marginBottom: 20 }}>
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.sectionCount}>{count}</Text>
      <TouchableOpacity>
        <Text style={styles.seeAll}>See all</Text>
      </TouchableOpacity>
    </View>
    {children}
  </View>
);

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  sheet: {
    position: 'absolute',
    left: 0, right: 0, bottom: 0,
    height: '75%',
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: 20,
  },
  content: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 18, fontWeight: 'bold', marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16, fontWeight: '600',
    flex: 1,
  },
  sectionCount: {
    color: '#888', marginRight: 10,
  },
  seeAll: {
    color: '#6A5ACD', fontWeight: '500',
  },
  photo: {
    width: 100, height: 70, borderRadius: 8, marginRight: 10,
  },
  membersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 15,
  },
  member: {
    width: 70, alignItems: 'center', marginVertical: 5,
  },
  avatarContainer: {
    position: 'relative',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  memberAvatar: {
    width: 40, height: 40, borderRadius: 20,
  },
  memberName: {
    fontSize: 12, marginTop: 4, textAlign: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: 'green',
    borderColor: '#fff',
    borderWidth: 1,
  },
  sharedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 6,
  },
  sharedIcon: {
    width: 24, height: 24, marginRight: 10,
  },
  sharedText: {
    fontSize: 14,
  },
  sharedSub: {
    fontSize: 12,
    color: '#888',
  },
});



