/* 
 *
 * app.js 
 *
 */

import {
    createSlice
} from "@reduxjs/toolkit";
const slice = createSlice({
    name: "app",
    initialState: {
        chatCollapsed: window.innerWidth <= 1375,
        navCollapsed: true
    },
    reducers: {
        toggleChatCollapsed: (state, action) => {
            state.chatCollapsed = !state.chatCollapsed;
            state.navCollapsed = true;
        },
        toggleNavCollapsed: (state, action) => {
            state.navCollapsed = !state.navCollapsed;
            state.chatCollapsed = true;
        }
    },
    extraReducers: {}
});

export const {
    toggleChatCollapsed,
    toggleNavCollapsed
} = slice.actions;

export default slice.reducer;