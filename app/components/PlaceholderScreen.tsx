import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import dotenv from 'dotenv';

const ipAddress = process.env.EXPO_PUBLIC_IP_ADDRESS;



console.log(`Using IP Address: +ipAddress+`);

const PlaceholderScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Coming Soon...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default PlaceholderScreen;
