/* 
 *
 *  wof.js 
 *
 */

import {
    createSlice
} from "@reduxjs/toolkit";


/**
 * Updates latest bets
 * @param {*} history 
 * @returns 
 */
function updateLastBets(history) {

    let temp = {
        red: 0,
        green: 0,
        black: 0,
        yellow: 0,
    }

    if(history){
        history.map((info, i) => {
            if(info.fairRound.color === "red"){
                temp.red++;
            } else if(info.fairRound.color === "green"){
                temp.green++;
            } else if(info.fairRound.color === "yellow"){
                temp.yellow++; 
            } else {
                temp.black++;
            }
        })
    }
    
    
    return temp;
}

const slice = createSlice({
    name: "wof",
    initialState: {
        counter: 0,
        spinnerActive: false,
        players: {red: {}, black: {}, green: {}, yellow: {}},
        history: [],
        balance: 0,
        hash: "Loading",
        betTotals: {
            red: 0,
            black: 0,
            green: 0,
            yellow: 0
        },
        projected: {
            red: 0,
            black: 0,
            green: 0,
            yellow: 0
        },
        lastBets: {
            red: 0,
            green: 0,
            black: 0,
            yellow: 0,
        },
        userId: "",
        winningColor: false,
    },
    reducers: {
        countDown: (state, action) => {
            state.counter = state.counter - 0.01;
        },

        WOFCounter: (state, action) => {
            state.counter = action.payload.counter;
            state.spinnerActive = false;
            state.hash = action.payload.hash;
            state.winningColor = false;
        },  

        setWinningColor: (state, action) => {
            state.winningColor = action.payload.color;
        },

        setPlayers: (state, action) => {
            let temp = {
                red: 0,
                black: 0,
                green: 0,
                yellow: 0
            };
            let projected = {
                red: 0,
                black: 0,
                green: 0,
                yellow: 0
            }
            for(var color in action.payload) {
                for(var player in action.payload[color]) {
                    temp[color] += action.payload[color][player].bet;
                    if(player === state.userId) {
                        projected[color] += action.payload[color][player].bet * (color === "red" ? 2 : color === "black" ? 3 : color == "green" ? 5 : 50);
                    }
                }
            }

            state.projected = projected;
            state.players = action.payload;
            state.betTotals = temp;
        },

        WOFHistory: (state, action) => {
            if(action.payload != undefined){
                state.history = action.payload;
                state.lastBets = updateLastBets(action.payload);
            }
            
        },

        WOFConnect: (state, action) => {
            let temp = {
                red: 0,
                black: 0,
                green: 0,
                yellow: 0
            };
            let projected = {
                red: 0,
                black: 0,
                green: 0,
                yellow: 0
            }
            for(var color in action.payload.players) {
                for(var player in action.payload.players[color]) {
                    temp[color] += action.payload.players[color][player].bet;
                    if(player == state.userId) {
                        projected[color] += action.payload.players[color][player].bet * (color == "red" ? 2 : color == "black" ? 3 : color == "green" ? 5 : 50);
                    }
                }
            }

            state.projected = projected;
            state.players = action.payload.players;
            state.betTotals = temp;
            state.userId = action.payload.userId;
            state.counter = action.payload.counter;
            state.hash = action.payload.hash;
            state.balance = action.payload.balance;
            state.history = action.payload.history;
    
            if (action.payload.end) {
                state.spinnerActive = true;
            }
    
            
        },

        setSpinnerActive: (state, action) => {
            state.spinnerActive = true;
        }
    },
    extraReducers: {}
});

export const {
    countDown,
    WOFCounter,
    setWinningColor,
    setPlayers,
    WOFHistory,
    WOFConnect,
    setSpinnerActive,
} = slice.actions;
export default slice.reducer;