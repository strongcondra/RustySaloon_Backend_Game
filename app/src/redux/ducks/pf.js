/*
 *
 * pf.js
 *
 */

import { createSlice } from "@reduxjs/toolkit";
const slice = createSlice({
  name: "pf",
  initialState: {
    roulette: [],
    crash: [],
    dice: [],
    hashes: {
      roulette: "",
      crash: "",
      wof: "",
    },
    fiftyx: [],
  },
  reducers: {
    updateHashes: (state, action) => {
        state.roulette= action.payload.roulette;
        state.crash= action.payload.crash;
        state.dice= action.payload.dice;
        state.fiftyx= action.payload["50x"];
        state.hashes= action.payload.hashes;
    },
  },
  extraReducers: {},
});

export const { updateHashes } = slice.actions;

export default slice.reducer;
