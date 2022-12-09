import React, {useRef} from "react";
import AutoInput from "../../AutoInput";
import BetAmount from "../../BetAmount";
import CoinInput from "../../CoinInput";

const CrashDetails = React.forwardRef((props, ref) => {

  const { betInputRef, cashoutInputRef} = ref;

  return (
    <div className="crash__details">
      <BetAmount alt ref={betInputRef} betInput = {0}  setBetInput = {() => {}}  handler = {() => {}}/>
      <div className="crash__auto-cashout">
        <div className="crash__auto-cashout-title">Auto Cashout</div>
        <AutoInput ref= {cashoutInputRef} />
      </div>

      <button className={"button button--green crash__place-bet-button"} onClick={() => {props.active && props.y[props.y.length - 1] == "x" ? props.cashout() : props.placeBet()}}>
        {props.active && props.y[props.y.length - 1] == "x" ? "CASHOUT" : "PLACE BET"}
      </button>

      <div className="crash__players">
        <div className="crash__player">
          <div>{props.bets ? Object.keys(props.bets).length : 0} Players</div>
          <div className="crash__total-bets">
            <img src={process.env.PUBLIC_URL + "/images/coins.svg"} /> Total Pot
          </div>
        </div>

        

        {
           props.bets ? Object.keys(props.bets).sort((a, b) => {return (props.bets[b].betValue - props.bets[a].betValue)}).map((bet) => {
            console.log("there is player!");
            return (
          
            <div className="crash__player">
              <div>{props.bets[bet].username}</div>
              <div style={{"color" : props.bets[bet].cashedOut ? "green" : props.crashed ? "red" : "white"}}>{props.bets[bet].betValue}</div>
            </div>);
          }): ""
        }
      </div>
    </div>
  );
});

export default CrashDetails;
