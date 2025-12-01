import { createSlice } from "@reduxjs/toolkit";
import Cookies from "js-cookie";

// Initial state
const initialState = {
  id: "",
  username: "",
  email: "",
  phone: "",
  fullname: "",
  birthdate: "",
  role: "",
  avarta_url: "",
  accessToken: "",
  refreshToken: Cookies.get("refreshToken"),
  isAuthenticated: !!Cookies.get("accessToken"), // Check if accessToken exists
};

// Utility to filter payload fields
const filterPayload = (payload, state) => {
  const filteredPayload = {};
  Object.keys(state).forEach((key) => {
    if (key in payload) {
      filteredPayload[key] = payload[key];
    }
  });
  return filteredPayload;
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateUser: (state, action) => {
      const filteredPayload = filterPayload(action.payload, state);
      return {
        ...state,
        ...filteredPayload,
        role: filteredPayload.role || state.role, // Ensure role is updated if provided
        isAuthenticated: true, // Ensure user is authenticated
      };
    },
    resetUser: (state) => {
      return {
        ...state,
        fullname: "",
        birthday: "",
        email: "",
        id: "",
        phone: "",
        role: "",
        username: [],
        user_avt_img: "",
        accessToken: "",
        refreshToken: "",
        isAuthenticated: false,
      };
    },
    logout: () => {
      Cookies.remove("accessToken");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("id");
      localStorage.removeItem("role");
      
      return {
        ...initialState,
        accessToken: "", // Clear tokens
        refreshToken: "",
        isAuthenticated: false,
      };
    },
  },
});

export const { updateUser, resetUser, logout } = userSlice.actions;
export default userSlice.reducer;