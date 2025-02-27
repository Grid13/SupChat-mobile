import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ChatScreen from './components/Message/ChatScreen';

const Tab = createBottomTabNavigator();

const PlaceholderScreen: React.FC = () => <View style={styles.container}><Text>Coming Soon...</Text></View>;

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Messages"
        component={ChatScreen}
        options={{
          tabBarIcon: ({ color, size }) => (
            <View>
              <Icon name="message-text" size={size} color={color} />
            </View>
          ),
        }}
      />
      <Tab.Screen name="Workspaces" component={PlaceholderScreen} options={{ tabBarIcon: ({ color, size }) => <Icon name="briefcase" size={size} color={color} /> }} />
      <Tab.Screen name="Activities" component={PlaceholderScreen} options={{ tabBarIcon: ({ color, size }) => <Icon name="bell" size={size} color={color} /> }} />
      <Tab.Screen name="Settings" component={PlaceholderScreen} options={{ tabBarIcon: ({ color, size }) => <Icon name="cog" size={size} color={color} /> }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});

export default TabNavigator;
