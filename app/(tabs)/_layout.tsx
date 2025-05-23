import { Tabs } from "expo-router";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function TabsLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="Chat"
        options={{
          title: "Chat",
          tabBarIcon: ({ color, size }) => <Icon name="message-text" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Workspaces"
        options={{
          title: "Workspaces",
          tabBarIcon: ({ color, size }) => <Icon name="briefcase" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Activities"
        options={{
          title: "Activities",
          tabBarIcon: ({ color, size }) => <Icon name="bell" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="Settings"
        options={{
          title: "Settings",
          tabBarIcon: ({ color, size }) => <Icon name="cog" size={size} color={color} />,
        }}
      />
    </Tabs>
    </GestureHandlerRootView>
  );
}
