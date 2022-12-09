import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from "react-redux";
import BettingBar from "./BettingBar";
import Last100Rolls from "./Last100Rolls";
import PreviousRolls from "./PreviousRolls";
import ProgressBar from "./ProgressBar";
import Spinner from "./Spinner";
import TotalBets from "./TotalBets";
import TotalBetsMobile from "../../mobile/roulette/TotalBets";

import {socket} from '../../../Socket';
import { rouletteTimer, countDown, rouletteConnect, reset, roulettePlayers, roulettePlaceBetRes, rouletteDone } from "../../../redux/ducks/roulette";

const Roulette = props => {
  
  const dispatch = useDispatch();
  const ref = useRef();

  const counter = Number(useSelector(state => state.roulette.counter));
  const rouletteNumbers = useSelector(state => state.roulette.numbers);
  const spinnerActive = useSelector(state => state.roulette.spinnerActive);
  const lastBets = useSelector(state => state.roulette.lastBets);
  const history = useSelector(state => state.roulette.history);
  const projected  = useSelector(state => state.roulette.projected);
  const total = useSelector(state => state.roulette.total);
  const players  = useSelector(state => state.roulette.players);
  const balance = Number(useSelector(state => state.roulette.balance));
  const done = useSelector(state => state.roulette.done);

  var counterInterval = "";
  var start = -162;
  
  const winnerPosition = {
    1: 7,
    14: 6,
    2: 5,
    13: 4,
    3: 3,
    12: 2,
    4: 1,
    0: 0,
    11: -1,
    5: -2,
    10: -3,
    6: -4,
    9: -5,
    7: -6,
    8: -7,
  }

  function spin (time, spinner) {
    document.getElementById('spinner__items').style.transform = `matrix(1, 0, 0, 1, ${spinner}, 0)`;
    document.getElementById('spinner__items').style.transition = `transform ${time}ms cubic-bezier(0, 0, 0.28, 1) 0s`;
  }

  useEffect(() => {

    document.title = "RustySaloon | Roulette";
    socket.emit("rouletteConnected");

    socket.on("rouletteTimer", (data) => {

      clearInterval(counterInterval);

      dispatch(rouletteTimer(data));

      counterInterval = setInterval(() => {
        dispatch(countDown());
      }, 10);
    });

    socket.on("rouletteConnect", (data) => {

      dispatch(rouletteConnect(data));

      counterInterval = setInterval(() => {
        dispatch(countDown());
      }, 10);

      if(data.spinnerActive > 0) {
        spin(
            ((spinnerActive > 2000 ? (spinnerActive - 2000) : 0)), 
            (start - 88 * 15 * 5 + winnerPosition[data.fairRound.ticket] * 88 + data.fairRound.indicator));
      }
    });

    socket.on("rouletteSpin", (data) => {
      // data.ticket, data.secret, data.hash, data.type, data.indicator
      spin(8000, start - 88 * 15 * 5 + winnerPosition[data.ticket] * 88 + data.indicator);
    });

    socket.on("rouletteReset", (data) => {
      spin(0, start - 88 * 15 * 1 + winnerPosition[data.info.ticket] * 88 + data.info.indicator);
      dispatch(reset(data));
    });

    socket.on("roulettePlayers", (players) => {
      dispatch(roulettePlayers(players));
    })

    socket.on("roulettePlaceBetRes", (data) => {
      dispatch(roulettePlaceBetRes(data));
    })

    socket.on("rouletteDone", () => {
      dispatch(rouletteDone());
    })
  }, []);

  return (
    <div className="roulette">
      <div className="past-rolls hide-on-mobile">
        <Last100Rolls red = {lastBets.red} black = {lastBets.black} green = {lastBets.green} />
        <PreviousRolls rolls = {history} />
      </div>
      <h1>
        {spinnerActive <= 0
          ? "Rolling in " + counter.toFixed(1) + " seconds"
          : "Spinning"}
      </h1>
      <ProgressBar percent={Number((spinnerActive <= 0 ? (counter/2)* 100 : 0))} />
      <Spinner rouletteNumbers={rouletteNumbers}/>

      <div className="past-rolls show-on-mobile--flex">
        <Last100Rolls red = {lastBets.red} black = {lastBets.black} green = {lastBets.green} />
        <PreviousRolls rolls = {history}/>
      </div>

      <BettingBar bal = {balance} ref = {ref}/>

      <div className="past-rolls hide-on-mobile">
        <TotalBets players = {players} total = {total} projected = {projected} ref = {ref} done = {done}/>
      </div>

      <div className="past-rolls show-on-mobile--flex">
        <TotalBetsMobile players = {players} total = {total} ref = {ref} done = {done}/>
      </div>
    </div>
  );
};

export default Roulette;
