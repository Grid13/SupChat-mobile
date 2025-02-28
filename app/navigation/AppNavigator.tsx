import { NavigationContainer } from "@react-navigation/native";
import MainNavigator from "./MainNavigator";

const AppNavigator = () => {
  // const { user } = useAuth();

  return (
    <NavigationContainer>
      <MainNavigator />
      {/*{user ? <MainNavigator /> : <AuthNavigator />}*/}
    </NavigationContainer>
  );
};

export default AppNavigator;
