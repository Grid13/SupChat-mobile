import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, Linking, Dimensions } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import Modal from 'react-native-modal';

const { width, height } = Dimensions.get('window');

const Header: React.FC = () => {
  const [isModalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.header}>
      {/* Image cliquable */}
      <TouchableOpacity onPress={() => setModalVisible(true)}>
        <Image
          source={{ uri: 'https://media.licdn.com/dms/image/v2/D4E03AQGFSF9a7FsNdg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1672734578160?e=2147483647&v=beta&t=R8cUgzBWx_FNNfLt6ctx7QM4Qu-Sr2v_r3omQqF-Zvw' }}
          style={styles.profilePic}
        />
      </TouchableOpacity>

      {/* Nom et statut */}
      <View style={styles.userInfo}>
        <Text style={styles.username}>Maria Santa</Text>
        <Text style={styles.onlineStatus}>online</Text>
      </View>

      {/* Icônes à droite */}
      <View style={styles.iconsContainer}>
        <TouchableOpacity>
          <Icon name="magnify" size={24} color="#6B8AFD" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="information-outline" size={24} color="#6B8AFD" />
        </TouchableOpacity>
        <TouchableOpacity>
          <Icon name="dots-vertical" size={24} color="#6B8AFD" />
        </TouchableOpacity>
      </View>

      {/* Modal affichant la fiche utilisateur */}
      <Modal
        isVisible={isModalVisible}
        onBackdropPress={() => setModalVisible(false)}
        animationIn="slideInDown"
        animationOut="slideOutUp"
        backdropOpacity={0.3}
        style={styles.modalWrapper}
      >
        <View style={styles.modalContainer}>
          {/* En-tête avec photo et nom */}
          <View style={styles.headerModal}>
            <Image
              source={{ uri: 'https://media.licdn.com/dms/image/v2/D4E03AQGFSF9a7FsNdg/profile-displayphoto-shrink_200_200/profile-displayphoto-shrink_200_200/0/1672734578160?e=2147483647&v=beta&t=R8cUgzBWx_FNNfLt6ctx7QM4Qu-Sr2v_r3omQqF-Zvw' }}
              style={styles.modalImage}
            />
            <Text style={styles.modalName}>Maria Santa</Text>
          </View>

          {/* Section Contact */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Contact</Text>
              <Icon name="chevron-down" size={20} color="white" />
            </TouchableOpacity>
            <View style={styles.sectionContent}>
              <TouchableOpacity onPress={() => Linking.openURL('mailto:maria.santa@email.com')}>
                <Text style={styles.linkText}>📧 maria.santa@email.com</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => Linking.openURL('tel:+33698175201')}>
                <Text style={styles.linkText}>📞 06 98 17 52 01</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Section Infos Personnelles */}
          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Custom infos</Text>
              <Icon name="chevron-down" size={20} color="white" />
            </TouchableOpacity>
            <View style={styles.sectionContent}>
              <TouchableOpacity onPress={() => Linking.openURL('https://maria.santa.linkedin.com')}>
                <Text style={styles.linkText}>🔗 maria.santa.linkedin.com</Text>
              </TouchableOpacity>
              <Text style={styles.infoText}>🏢 StratonDecadence</Text>
              <Text style={styles.infoText}>📍 11 résidence Sauvage Jules</Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    padding: 10, 
    borderBottomWidth: 1, 
    borderColor: '#ddd' 
  },
  profilePic: { width: 40, height: 40, borderRadius: 20, marginRight: 10 },
  
  userInfo: {
    flex: 1,
    marginLeft: 10
  },
  username: { fontSize: 16, fontWeight: 'bold' },
  onlineStatus: { fontSize: 12, color: 'green' },

  iconsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15
  },

  // Style du modal
  modalWrapper: { 
    justifyContent: 'flex-start',
    margin: 0
  },

  modalContainer: {
    backgroundColor: 'white',
    width: width, 
    height: height * 0.6, 
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
    alignItems: 'center',
    padding: 20,
  },

  headerModal: { alignItems: 'center', marginBottom: 15 },
  modalImage: { width: 60, height: 60, borderRadius: 30, marginBottom: 10 },
  modalName: { fontSize: 18, fontWeight: 'bold' },

  section: { 
    width: '100%', 
    marginBottom: 10 
  },
  
  sectionHeader: {
    backgroundColor: '#6B8AFD',
    padding: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopLeftRadius: 10,  // Bord arrondi à gauche
    borderTopRightRadius: 10, // Bord arrondi à droite
  },

  sectionTitle: { 
    fontSize: 16, 
    fontWeight: 'bold', 
    color: 'white' 
  },

  sectionContent: { 
    backgroundColor: '#F2F3F5', 
    padding: 10, 
    borderBottomLeftRadius: 10, // Bord arrondi en bas à gauche
    borderBottomRightRadius: 10 // Bord arrondi en bas à droite
  },
  linkText: { fontSize: 14, color: 'blue', marginVertical: 2 },
  infoText: { fontSize: 14, color: '#333', marginVertical: 2 },
});

export default Header;
