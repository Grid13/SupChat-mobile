import React from 'react';
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

const screenHeight = Dimensions.get('window').height;

interface Props {
    visible: boolean;
    onClose: () => void;
    workspaceName: string;
  }
  
  

const WorkspaceInfoSheet: React.FC<Props> = ({ visible, onClose, workspaceName }) => {
  const translateY = React.useRef(new Animated.Value(screenHeight)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: screenHeight,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none">
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose} />
      <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
        <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{workspaceName}</Text>


          {/* Photos & Videos */}
          <Section title="Photos & Videos" count={24}>
            <ScrollView horizontal>
              {[1, 2, 3, 4].map((i) => (
                <Image
                  key={i}
                  style={styles.photo}
                  source={{ uri: `https://placeimg.com/140/100/tech?${i}` }}
                />
              ))}
            </ScrollView>
          </Section>

          {/* Members */}
          <Section title="Members" count={5}>
            <View style={styles.membersContainer}>
              {[
                { name: 'Maria Santa', avatar: 'https://randomuser.me/api/portraits/women/10.jpg' },
                { name: 'Jbj', avatar: 'https://randomuser.me/api/portraits/women/20.jpg' },
                { name: 'Med', avatar: 'https://randomuser.me/api/portraits/men/30.jpg' },
                { name: 'Gros Bzeur', avatar: 'https://randomuser.me/api/portraits/men/40.jpg' },
                { name: 'Patron', avatar: 'https://randomuser.me/api/portraits/men/50.jpg' },
              ].map((user, idx) => (
                <View key={idx} style={styles.member}>
                  <View style={styles.avatarContainer}>
                    <Image source={{ uri: user.avatar }} style={styles.memberAvatar} />
                    <View style={styles.onlineDot} />
                  </View>
                  <Text style={styles.memberName}>{user.name}</Text>
                </View>
              ))}
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

          {/* Applications */}
          <Section title="Applications" count={3}>
            {[
              { name: 'Google Drive', icon: 'https://img.icons8.com/color/48/google-drive--v2.png' },
              { name: 'GitHub', icon: 'https://img.icons8.com/ios-glyphs/30/github.png' },
              { name: 'Microsoft Teams', icon: 'https://img.icons8.com/color/48/microsoft-teams.png' },
            ].map((app, idx) => (
              <View key={idx} style={styles.sharedItem}>
                <Image source={{ uri: app.icon }} style={styles.sharedIcon} />
                <Text style={styles.sharedText}>{app.name}</Text>
              </View>
            ))}
          </Section>
        </ScrollView>
      </Animated.View>
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
