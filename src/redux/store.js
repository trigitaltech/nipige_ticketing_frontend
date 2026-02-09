import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import ticketReducer from './ticketSlice';
import categoryReducer from './categorySlice';
import userReducer from './userSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tickets: ticketReducer,
    categories: categoryReducer,
    users: userReducer,
  },
});

export default store;
