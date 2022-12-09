import React, {useEffect} from "react";
import CoinInput from "./CoinInput";
import BettingButton from "./BettingButton";
import {socket} from '../Socket';

const BetAmount = React.forwardRef((props, ref) => {

  useEffect(() => {
    socket.on("maxButton", (bal) => {
      ref ? ref.current.value = Number(bal > 500 ? 500 : bal) :
      props.setBetInput( Number((bal > 500) ? 500 : bal)); 
    });
  });

  return (
    <div className={"bet-amount " + (props.alt ? "bet-amount--alt" : "")}>
      <div className="bet-amount__title">Bet Amount</div>
      <CoinInput 
        betInput = {props.betInput} 
        setBetInput = {(num) => props.setBetInput(num)} 
        handler={() => {props.handler()}}
        ref = {ref}
      />
      <div className="bet-amount__buttons hide-on-mobile">
        <BettingButton multiply = {0.5} betInput = {props.betInput} setBetInput = {(num) => {props.setBetInput(num)}} ref = {ref} handler={() => {props.handler()}} className = "button bet-amount__button">1/2</BettingButton>
        <BettingButton multiply = {2} betInput = {props.betInput}  setBetInput = {(num) => {props.setBetInput(num)}} ref = {ref} handler={() => {props.handler()}} className = "button bet-amount__button">x2</BettingButton>
        <BettingButton max = {1} betInput = {props.betInput}  setBetInput = {(num) => {props.setBetInput(num)}} ref = {ref} handler={() => {props.handler()}} className = "button bet-amount__button">Max</BettingButton>
      </div>
    </div>
  );
});

export default BetAmount;
