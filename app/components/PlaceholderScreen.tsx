import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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
