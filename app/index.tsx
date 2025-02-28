import { NavigationIndependentTree } from "@react-navigation/core";
import AppNavigator from "./navigation/AppNavigator";

const App = () => {
  return (
    <NavigationIndependentTree>
      <AppNavigator />;
    </NavigationIndependentTree>
  );
};

export default App;
