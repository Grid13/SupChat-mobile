import { Slot } from "expo-router";

import { Provider } from "react-redux";
import { store } from "./store/store"; // ajuste selon ton projet
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SocketProvider } from "./hooks/SocketProvider";


export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <Provider store={store}>
        <SocketProvider>
          <Slot />
        </SocketProvider>
      </Provider>
    </GestureHandlerRootView>
  );
}
