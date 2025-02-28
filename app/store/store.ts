// import { configureStore } from "@reduxjs/toolkit";
// import { api } from "../api/api";

// export const store = configureStore({
//   reducer: {
//     // ...createRouterReducerMapObject(routerHistory),
//     [api.reducerPath]: api.reducer,
//     // app: appReducer,
//     // snackbar: snackbarReducer,
//     // modal: modalReducer,
//   },
//   middleware: (getDefaultMiddleware) =>
//     getDefaultMiddleware({
//       serializableCheck: false,
//     })
//       // .concat(thunk)
//       // .concat(createRouterMiddleware(routerHistory))
//       .concat(api.middleware),
//   devTools: true,
// });