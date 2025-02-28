import { StyleSheet, Text, View } from "react-native";

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

const PlaceholderScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text>Coming Soon...</Text>
    </View>
  )
}

export default PlaceholderScreen;