import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import PlaceholderScreen from './components/PlaceholderScreen';
import ChatList from './ChatList';
import Workspace from './WorkspaceList';


const Tab = createBottomTabNavigator();

const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator screenOptions={{ headerShown: false }}>
      <Tab.Screen
        name="Chat"
        component={ChatList}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="message-text" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Workspaces"
        component={Workspace}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="briefcase" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Activities"
        component={PlaceholderScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="bell" size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="Settings"
        component={PlaceholderScreen}
        options={{
          tabBarIcon: ({ color, size }) => <Icon name="cog" size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
};

export default TabNavigator;
