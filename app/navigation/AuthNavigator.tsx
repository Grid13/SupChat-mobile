import {createBottomTabNavigator} from "@react-navigation/bottom-tabs";
import LoginScreen from "@/app/routes/Login/Login";

const Tab = createBottomTabNavigator();
const AuthNavigator = () => {
    return (
        <Tab.Navigator>
            <Tab.Screen name="Login" component={LoginScreen} />
            {/*<Tab.Screen name="Register" component={Register} />*/}
        </Tab.Navigator>
    );
}

export default AuthNavigator;
