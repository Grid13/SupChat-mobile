import React from "react";
import AppNavigator from "./navigation/AppNavigator";
import {NavigationIndependentTree} from "@react-navigation/core";

const App = () => {
    return (
        <NavigationIndependentTree>
            <AppNavigator />;
        </NavigationIndependentTree>
    );
};

export default App;