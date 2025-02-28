import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { View } from "react-native";
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import ChatScreen from "../components/Message/ChatScreen";
import PlaceholderScreen from "../components/shared/placeholder";
import Home from "../routes/Home";

const Tab = createBottomTabNavigator();

const MainNavigator = () => {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Login" component={Home} />
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
      {/*<Tab.Screen name="Register" component={Register} />*/}
    </Tab.Navigator>
  );
}
export default MainNavigator;
