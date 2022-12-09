/* 
 *
 * dice.js 
 *
 */

import {
    createSlice
} from "@reduxjs/toolkit";

const slice = createSlice({
    name: "dice",
    initialState: {
        type: "over",
        balance: 0,
        values: [5000],
        winnings: 0,
        button: 0,
        winningNr: 0,
        history: [],
    },
    reducers: {
        setWinnings: (state, action) => {
            state.winnings = action.payload;
        },
        setValue: (state, action) => {
            state.values = action.payload;
        },
        setBalance: (state, action) => {
            state.balance = action.payload;
        },
        diceResponse: (state, action) => {
            state.balance = action.payload.won ? 1 : 2;
            state.winningNr = action.payload.fairRound.ticket;
        },
        setHistory: (state, action) => {
            state.history = action.payload;
        }
    },
    extraReducers: {},
}); 

export const {
    setWinnings,
    setValue,
    setBalance,
    diceResponse,
    setHistory
} = slice.actions;

export default slice.reducer;