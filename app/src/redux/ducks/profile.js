/* 
 *
 * profile.js 
 *
 */

import {
    createSlice
} from "@reduxjs/toolkit";

const slice = createSlice({
    name: "profile",
    initialState: {
        loggedIn: false,
        username: "Not found",
        avatar: process.env.PUBLIC_URL + "/images/profile-pic-blank.png",
        balance: "",
        transactions: [],
        gameHistory: [],
        info: {
            deposit: 0,
            withdraw: 0,
        },
        levelInfo: {
            level: 1,
            neededXp: 1,
            xp: 1
        },
        addedCode: "None",
        yourCode: "None",
        muted: 0,
        transactionsActive: true,
        tradeurl: "",
    },
    reducers: {
        profileResponse: (state, action) => {
            let temp = {
                deposit: 0,
                withdraw: 0,
            }
            action.payload.transactions.map((transaction) => {
                temp[transaction.type] += Number(transaction.amount);
            });

            state.username = action.payload.username;
            state.avatar = action.payload.avatar;
            state.transactions = action.payload.transactions;
            state.gameHistory = action.payload.gameHistory;
            state.balance = action.payload.balance;
            state.info = temp;
            state.levelInfo = action.payload.levelInfo;
            state.muted = action.payload.muted;
            state.tradeurl = action.payload.tradeurl;
        },

        code: (state, action) => {
            state.yourCode = action.payload.yourCode;
            state.addedCode = action.payload.addedCode;
        },

        userData: (state, action) => {
            state.loggedIn = true;
            state.username = action.payload.username;
            state.avatar = action.payload.avatar;
        },

        balanceUpdate: (state, action) => {
            state.balance = action.payload;
        }
    },
    extraReducers: {},
}); 

export const {
    profileResponse,
    code,
    balanceUpdate,
    userData,
} = slice.actions;

export default slice.reducer;