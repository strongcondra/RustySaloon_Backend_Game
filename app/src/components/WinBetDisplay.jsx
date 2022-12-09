  import React from "react";
import BettingListItem from "./BettingListItem";


const WinBetDisplay = props => {

  return (
    <div className="win-bet-display">
      <div className={`projected-win projected-win--${props.color}`} onClick = {props.onClick}>
        <div>Win {props.multiplier}x</div>
        <div>
          Projected Win
          <br />
          {props.projected ? props.projected.toFixed(2): "0.00"}
        </div>
      </div>

      <div className="win-bet-display__footer">
        <div className="win-bet-display__label">{props.players != undefined ? Object.keys(props.players).length : 0} Total Bets</div>
        <div className="win-bet-display__value">
          <img src={process.env.PUBLIC_URL + "/images/coins.svg"} />
          {props.totalAmount ? props.totalAmount.toFixed(2): "0.00"}
        </div>
      </div>

      <div className="win-bet-display__betting-list">
        {
          props.players != undefined ? Object.keys(props.players).sort((a, b) => {return Number(props.players[b].bet) - Number(props.players[a].bet)}).map((player, i) => {
              return  <BettingListItem player = {props.players[player]} done = {props.done}/>
          }) : ""
        }
      </div>
    </div>
  );
};

export default WinBetDisplay;
