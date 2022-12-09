/* 
 *
 * shop.js 
 *
 */

import {
    createSlice
} from "@reduxjs/toolkit";


const slice = createSlice({
    name: "shop",
    initialState: {
        selected: {},
        selectedValue: 0,
        inventory: {},
        displayIv: {},
        descending: true,
        bonus: false,
        balance: 0,
        minAmount: 0,
        maxAmount: 10000,
        searched: {target: {value: ""}},
    },
    reducers: {
        setBalance: (state, action) => {
            state.balance = action.payload * 100;
        },

        searchForItem: (state, action) => {

            if(action.payload != null){
                state.searched = action.payload;
            }

            var temp = {};



            for(var item in state.inventory) {
                if(item.toLowerCase().includes(state.searched.target.value.toLowerCase())) {
                    if(state.inventory[item].price >= state.minAmount && state.inventory[item].price <= state.maxAmount) {
                        temp[item] = state.inventory[item];
                    }
                }
            }

            state.displayIv = temp;
            state.searched = action.payload;
        },

        updateInventory: (state, action) => {
            state.inventory = action.payload;
            state.displayIv = action.payload;
        },

        setSelected: (state, action) => {

            let temp = state.selected;

            if(!temp[action.payload.info.market_hash_name]){
                temp[action.payload.info.market_hash_name] = action.payload.info;
                state.selectedValue = Math.round((state.selectedValue + Number(action.payload.info.price)) * 100) / 100;
            } else {
                let tempSelected = temp[action.payload.info.market_hash_name].selectedAmount;
                temp[action.payload.info.market_hash_name].selectedAmount = action.payload.selectedAmount;
                state.selectedValue = Math.round((state.selectedValue + (Number(action.payload.info.price) * (action.payload.selectedAmount - tempSelected))) * 100) / 100;
            }
   
            state.selected = temp;         
        },

        removeSelected: (state, action) => {
            let temp = state.selected;
            let tempSelected = temp[action.payload.info.market_hash_name].selectedAmount;
            delete temp[action.payload.info.market_hash_name];
            state.selected = temp;
            state.selectedValue = Math.round((state.selectedValue - (Number(action.payload.info.price) * (tempSelected))) * 100) / 100;
        },  

        toggleDescending: (state, action) => {
            state.descending = !state.descending;
        },

        setMinAmount: (state, action) => {
            if(!action.payload) {
                state.minAmount = 0;
            } else {
                state.minAmount = action.payload;
            }
        },

        setMaxAmount: (state, action) => {
            if(!action.payload) {
                state.maxAmount = 100000;
            } else {
                state.maxAmount = action.payload;
            }
        },
        setBonus: (state, action) => {
            state.bonus = action.payload;
        },
    },
    extraReducers: {},
}); 

export const {
    setBalance,
    searchForItem,
    updateInventory,
    setSelected,
    removeSelected,
    toggleDescending,
    setMinAmount,
    setMaxAmount,
    setBonus
} = slice.actions;

export default slice.reducer;