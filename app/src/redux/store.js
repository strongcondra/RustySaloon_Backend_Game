import {
  configureStore
} from "@reduxjs/toolkit";

import appReducer from "./ducks/app";
import rouletteReducer from "./ducks/roulette";
import chatReducer from "./ducks/chat";
import profileReducer from "./ducks/profile"
import towersReducer from "./ducks/towers"
import diceReducer from "./ducks/dice"
import wofReducer from "./ducks/wof"
import shopReducer from "./ducks/shop"
import pfReducer from "./ducks/pf"

export const store = configureStore({
  reducer: {
    app: appReducer,
    roulette: rouletteReducer,
    chat: chatReducer,
    profile: profileReducer,
    towers: towersReducer,
    dice: diceReducer,
    wof: wofReducer,
    shop: shopReducer,
    pf: pfReducer,
  },
});