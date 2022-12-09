/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable no-eval */
/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */
/* eslint-disable eqeqeq */
import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from "react-redux";
import BetAmount from "../../BetAmount";
import Slider from "./Slider";

import {socket} from '../../../Socket';
import { setWinnings, setValue, setBalance, diceResponse } from "../../../redux/ducks/dice";


const Details = props => {

  const dispatch = useDispatch();

  const type = useSelector(state => state.dice.type);
  const balance = useSelector(state => state.dice.balance);
  const winnings = useSelector(state => state.dice.winnings);
  const winningNumber = useSelector(state => state.dice.winningNr);

  const [betInput, setBetInput] = useState(0);
  const [numberInput, setNumberInput] = useState(5000);
  const [multInput, setMultInput] = useState(0);
  const [chanceInput, setChanceInput] = useState(0);
  
  function calcMultiplier() {
    let number = Number(numberInput);
    let mult = Number(((10000 / ((type == "over" ? 10000 - number : number))) * 0.95).toFixed(2));
    setMultInput(mult);
    dispatch(setWinnings((mult * betInput).toFixed(2)));
    setChanceInput(((type == "under" ? number : (10000 - number)) / 100));
  } 

  function calcNumber() {
    let mult = Number(multInput);
    if(type == "under") {
        let number = Math.round(10000 / (mult / 0.95));
        setNumberInput(number);
        setChanceInput((number / 100));
    } else {
        let number = Math.round(10000 - 10000 / (mult / 0.95));
        setNumberInput(number);
        setChanceInput((number / 100));
    }

    dispatch(setValue([numberInput]));
  }
  
  useEffect(() => {
    document.title = "RustySaloon | Dice";

    socket.on("diceResponse", (data) => {
      dispatch(diceResponse(data));
    });

    socket.on("diceSound", (data) => {
        var audio = new Audio(
          data.type != "loose" ? process.env.PUBLIC_URL + "/audio/dice_win.mp3" : 
          process.env.PUBLIC_URL + "/audio/dice_loose.mp3");
        audio.play();
    })
    
    socket.emit("diceConnect");

    socket.on("diceConnect", (data) => {
        dispatch(setBalance(Number(data.balance).toFixed(2)));
    })

    //numberInput = 5000;
    calcMultiplier();
  }, []);

  function value(value) {
      if(value == "clear") {
          setBetInput(0);
      } else if(value == "max") {
        setBetInput((balance > 500 ? 500 : balance));
      } else {
          if(betInput == "") setBetInput(0);
          setBetInput(Math.round(eval(betInput+value) * 100) / 100);
      }
      calcMultiplier();
      dispatch(setValue([numberInput]));
  }

  return (
    <div className="dice__details">
      <div className="dice__detail-row">
        <div className="dice__label-container">
          <div className="dice__label">Bet Amount</div>
          <BetAmount 
            betInput = {betInput} 
            setBetInput = {num => { setBetInput(num); calcMultiplier();}} 
            handler={() => {calcMultiplier()}}/>
        </div>

        <div className="dice__label-container">
          <div className="dice__label">Winnings</div>
            <div className={"coin-input-container " + props.containerClass}>
              <img
                className="coin-img"
                src={process.env.PUBLIC_URL + "/images/coins.svg"}
              />
              {winnings}
            </div>
        </div>
      </div>

      <div className="dice__detail-row">
        <div className="dice__label-container">
          <div className="dice__label">Roll</div>
          <input
            type="number"
            className="input dice__input--roll"
            placeholder="0.00"
            value={numberInput}
            onChange={(e) => setNumberInput(e.target.value)}
          />
        </div>

        <div className="dice__label-container">
          <div className="dice__label">Multiplier</div>
          <input
            type="number"
            className="input dice__input--multiplier"
            placeholder="0.00"
            value={multInput}
            onChange={(e) => {setMultInput(e.target.value); calcNumber();}}
          />
        </div>

        <div className="dice__label-container">
          <div className="dice__label">Chance</div>
          <input
            type="number"
            className="input dice__input--chance"
            placeholder="0.00"
            value={chanceInput}
            onChange={(e) => setChanceInput(e.target.value)}
          />
        </div>
      </div>

      <div class = "dice__columns-container">
        <div class={winningNumber ? (winningNumber > numberInput ? "dice__rolled color-bar--green" : "dice__rolled color-bar--red") : " dice__rolled hidden"} style={{"left": "calc(" + (winningNumber/100).toString() + "% - 50px)"}}> 
          {winningNumber}
        </div>
        <Slider val = {numberInput} handler={num => {setNumberInput(num); calcMultiplier();}} />
      </div>
      <button className="button button--green dice__play-button" onClick={
        () => {
          const bet = betInput;
          const number = numberInput;
          if(Number(bet) > 0) {
              if(number > 0 && number < 10000) {
                  socket.emit("diceStart", {
                      betValue: Number(bet),
                      number: number,
                      type: type,
                  });
              }
          }
        }
      }>Play</button>
    </div>
  );
};

export default Details;
