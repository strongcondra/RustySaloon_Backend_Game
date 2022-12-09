/* eslint-disable react-hooks/exhaustive-deps */
/* eslint-disable no-unused-vars */
import React, { useEffect, useRef } from 'react';
import { useSelector, useDispatch } from "react-redux";
import BetAmount from "../../BetAmount";
import WinBetDisplay from "../../WinBetDisplay";
import Bars from "./Bars";
import Last100 from "./Last100";
import SpinnerFT from "./Spinner";
import {socket} from '../../../Socket';

import { WOFCounter, countDown, setWinningColor, setPlayers, WOFHistory, WOFConnect, setSpinnerActive } from "../../../redux/ducks/wof";

const FiftyTimes = props => {

  const dispatch = useDispatch();
  const ref = useRef();


  const projected  = useSelector(state => state.wof.projected);
  const total = useSelector(state => state.wof.betTotals);
  const players  = useSelector(state => state.wof.players);
  const done = useSelector(state => state.wof.winningColor);
  const counter = useSelector(state => state.wof.counter);
  const lastBets = useSelector(state => state.wof.lastBets);
  const history = useSelector(state => state.wof.history);
  const spinnerActive = useSelector(state => state.wof.spinnerActive);

  var counterInterval = "";

  useEffect(() => {
    document.title = "RustySaloon | 50x";

    socket.on("WOFCounter", (data) => {

      clearInterval(counterInterval);

      dispatch(WOFCounter(data));

      counterInterval = setInterval(() => {
        dispatch(countDown());
      }, 10);

      dispatch(WOFHistory(data.history));
    })

    socket.on("WOFSpin", (data) => {
        dispatch(setSpinnerActive());
        document.getElementById('FT__spinner-img').style.transform = `rotate(-${2 +  360 * 4 + (((data.fairRound.ticket - 1) / 54) * 360)}deg)`;
        document.getElementById('FT__spinner-img').style.transition = `transform 4500ms cubic-bezier(0, 0, 0.28, 1) 0s`;
        setTimeout(() => {
            dispatch(setWinningColor(data));
        }, 4500);
    });
    socket.on("WOFPlayers", (players) => {
       dispatch(setPlayers(players));
    });
    socket.on("WOFHistory", (history, fairRound) => {
        dispatch(WOFHistory(history));
        document.getElementById('FT__spinner-img').style.transform = `rotate(-${(2 + ((fairRound.ticket - 1) / 54) * 360)}deg)`;
        document.getElementById('FT__spinner-img').style.transition = `transform 0ms cubic-bezier(0, 0, 0.28, 1) 0s`;
    });
    socket.emit("WOFConnect");
    socket.on("WOFConnect", (data) => {

      dispatch(WOFConnect(data));

      counterInterval = setInterval(() => {
        dispatch(countDown());
      }, 100);

      if (data.end) 
      {
        document.getElementById('FT__spinner-img').style.transform = `rotate(-${2 +  360 * 4 + (((data.fairRound.ticket - 1) / 54) * 360)}deg)`;
        document.getElementById('FT__spinner-img').style.transition = `transform ${data.end - Date.now()}ms cubic-bezier(0, 0, 0.28, 1) 0s`;

        setTimeout(() => {
            dispatch(setWinningColor(data));
        }, (data.end - Date.now()));
      }

      dispatch(WOFHistory(data.history));
    })
  }, []);


  return (
    <div className="FT">
      <SpinnerFT spinnerActive = {spinnerActive} counter = {counter}/>

      <div className="FT__top">
        <Last100 lastBets = {lastBets}/>
        <Bars history = {history}/>
        <BetAmount ref={ref}/>
      </div>

      <div className="win-bet-container">
      <WinBetDisplay 
        color="red" 
        multiplier = {Number(2)} 
        players = {players ? players.red : undefined}
        totalAmount = {total.red} 
        projected = {projected.red}
        onClick = {() => {
          socket.emit("WOFPlacebet", {
            color: "red",
            bet: ref.current.value
          });
        }}
        done = {done}
      />
      <WinBetDisplay 
        color="black" 
        multiplier = {Number(3)} 
        players = {players ? players.black : undefined}
        totalAmount = {total.black}   
        projected = {projected.black}
        onClick = {() => {
          socket.emit("WOFPlacebet", {
            color: "black",
            bet: ref.current.value
          });
        }}
        done = {done}
      />
      <WinBetDisplay 
        color="green" 
        multiplier = {Number(5)} 
        players = {players ? players.green : undefined}
        totalAmount = {total.green}   
        projected = {projected.green}
        onClick = {() => {
          socket.emit("WOFPlacebet", {
            color: "green",
            bet: ref.current.value
          });
        }}
        done = {done}
      />
      
      <WinBetDisplay 
        color="yellow" 
        multiplier = {Number(50)} 
        players = {players ? players.yellow : undefined}
        totalAmount = {total.yellow}   
        projected = {projected.yellow}
        onClick = {() => {
          socket.emit("WOFPlacebet", {
            color: "yellow",
            bet: ref.current.value
          });
        }}
        done = {done}
      />
      </div>
    </div>
  );
};

export default FiftyTimes;
