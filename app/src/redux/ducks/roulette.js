/* 
 *
 * roulette.js 
 *
 */

import {
    createSlice
} from "@reduxjs/toolkit";

function totalAmount (players) {
    let temp = {
        red: 0,
        green: 0,
        black: 0
    }

    for(var color in players) {
        for(var player in players[color]){
            temp[color] += players[color][player].bet
        }
    }

    return temp;
}

/**
 * Updates latest bets
 * @param {*} history 
 * @returns 
 */
function updateLastBets(history) {

    let temp = {
        red: 0,
        green: 0,
        black: 0
    }

    history.map((info, i) => {
        if(info.fairRound.ticket == 0){
            temp.green++;
        } else if(info.fairRound.ticket <= 7){
            temp.red++;
        } else {
            temp.black++;
        }
    })
    
    return temp;
}

const slice = createSlice({
    name: "roulette",
    initialState: {
        players: {
            red: {},
            green: {},
            black: {}
        },
        counter: 0,
        balance: 0,
        history: [],
        hash: "Not Found",
        spinnerActive: false,
        projected: {
            red: 0,
            green: 0,
            black: 0
        },
        total: {
            red: 0,
            green: 0,
            black: 0
        },
        done: false,
        numbers: [
            1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8,
            1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8,
            1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8,
            1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8,
            1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8,
            1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8,
            1, 14, 2, 13, 3, 12, 4, 0, 11, 5, 10, 6, 9, 7, 8,
        ],
        lastBets: {
            red: 0,
            green: 0,
            black: 0
        }
    },
    reducers: {
        rouletteTimer: (state, action) => {
            state.counter = action.payload.counter;
            state.hash = action.payload.hash;
            state.spinnerActive = action.payload.spinning;
        },

        countDown: (state, action) => {
            state.counter = state.counter - 0.01;
        },

        rouletteConnect: (state, action) => {
            state.total = totalAmount(action.payload.players);
            state.counter = action.payload.counter;
            state.hash = action.payload.hash;
            state.spinnerActive = action.payload.spinning;
            state.players = action.payload.players;
            state.history = action.payload.history;
            state.lastBets = updateLastBets(action.payload.history);
        },

        reset: (state, action) => {
            state.players = {
                red: {},
                green: {},
                black: {}
            };
            state.total = {
                red: 0,
                green: 0,
                black: 0,
            };
            state.projected = {
                red: 0,
                green: 0,
                black: 0
            };
            
            state.history = action.payload.history;
            state.done = false;
            state.lastBets = updateLastBets(action.payload.history);
        },

        roulettePlayers: (state, action) => {
            const players = {
                red: action.payload.red,
                green: action.payload.green,
                black: action.payload.black,
            }

            state.players = players;
            state.total = totalAmount(players);
        },

        roulettePlaceBetRes: (state, action) => {
            let temp = state.projected;
            temp[action.payload.color] += action.payload.color == "green" ? (action.payload.bet * 14) : (action.payload.bet * 2);
            state.projected = temp;
        },

        rouletteDone: (state, action) => {
            state.done = true;
        },
    },
    extraReducers: {}
});

export const {
    rouletteTimer,
    rouletteConnect,
    countDown,
    reset,
    roulettePlayers,
    roulettePlaceBetRes,
    rouletteDone
} = slice.actions;
export default slice.reducer;