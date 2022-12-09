import React, { useState } from "react";
import BettingListItem from "../../BettingListItem";

const TotalBets = props => {
  return (
    <React.Fragment>
      <div className="win-bet-container">
        <div className="win-bet-display">
          <div className="projected-win projected-win--red">
            <div>Place Bet</div>
            <div>2x</div>
          </div>
        </div>

        <div className="win-bet-display">
          <div className="projected-win projected-win--green">
            <div>Place Bet</div>
            <div>14x</div>
          </div>
        </div>

        <div className="win-bet-display">
          <div className="projected-win projected-win--black">
            <div>Place Bet</div>
            <div>2x</div>
          </div>
        </div>
      </div>

      <ShowAllBetsContainer color="red" players = {props.players.red} totalAmount = {props.total.red} done = {props.done}/>
      <ShowAllBetsContainer color="green" players = {props.players.green}  totalAmount = {props.total.green} done = {props.done}/>
      <ShowAllBetsContainer color="black" players = {props.players.black}  totalAmount = {props.total.black} done = {props.done}/>
    </React.Fragment>
  );
};

const ShowAllBetsContainer = props => {
  const [betsVisible, setBetsVisible] = useState(false);
  return (
    <div className="win-bet-display__footer">
      <div className={`roll-circle roll-circle--${props.color}`}></div>
      <div className="win-bet-display__container">
        <div className="win-bet-display__label-value-container">
          <div className="win-bet-display__label">{props.players != undefined ? Object.keys(props.players).length : 0} Bets</div>
          <div className="win-bet-display__value">
            <img src={process.env.PUBLIC_URL + "/images/coins.svg"} />
            {props.totalAmount ? props.totalAmount.toFixed(2): "0.00"}
          </div>
        </div>
        <div onClick={() => setBetsVisible(!betsVisible)}>Show all bets</div>
        <div className={betsVisible ? "" : "hidden"}>
          {
            props.players != undefined ? Object.keys(props.players).sort((a, b) => {return Number(props.players[b].bet) - Number(props.players[a].bet)}).map((player, i) => {
              return  <BettingListItem player = {props.players[player]} done = {props.done}/>
          }) : ""
          }
        </div>
      </div>
    </div>
  );
};

export default TotalBets;
