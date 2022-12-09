/* 
 *
 * chat.js 
 *
 */

import {
    createSlice
} from "@reduxjs/toolkit";

const slice = createSlice({
    name: "chat",
    initialState: {
        messages: [],
        playersOnline: 0,
        regionPlayers: {
            "english": 0,
            "russian": 0,
            "turkish": 0,
            "spanish": 0,
            "swedish": 0,
        },

        activeChat: "english"
    },
    reducers: {
        chat: (state, action) => {
            if(state.activeChat == action.payload.type){
                state.messages = action.payload.messages;
            }
        },

        playersOnline: (state, action) => {
            state.playersOnline = action.payload.players;
            state.regionPlayers = action.payload.regionPlayers;
        },

        changedLan: (state, action) => {
            state.messages = action.payload.messages;
            state.activeChat = action.payload.type;
        }
    },
    extraReducers: {},
}); 

export const {
    chat,
    playersOnline,
    changedLan,
} = slice.actions;

export default slice.reducer;