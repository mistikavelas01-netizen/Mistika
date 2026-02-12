import { configureStore } from "@reduxjs/toolkit";
import { apiSlice } from "@/store/features/api/apiSlice";

const rootReducer = {
  [apiSlice.reducerPath]: apiSlice.reducer,
};

export const makeStore = () => {
  return configureStore({
    reducer: rootReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
  });
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];
