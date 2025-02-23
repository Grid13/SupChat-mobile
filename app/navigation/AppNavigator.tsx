import {createStackNavigator} from "@react-navigation/native/src/__stubs__/createStackNavigator";
import {NavigationContainer} from "@react-navigation/native";
import AuthNavigator from "@/app/navigation/AuthNavigator";

const Stack = createStackNavigator();

const AppNavigator = () => {
    // const { user } = useAuth();

    return (
        <NavigationContainer>
            <AuthNavigator />
            {/*{user ? <MainNavigator /> : <AuthNavigator />}*/}
        </NavigationContainer>
    );
};

export default AppNavigator;