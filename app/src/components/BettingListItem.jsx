import React from "react";

const BettingListItem = props => {
  return (
    <div className="betting-list-item">
      <img
        className="profile-pic"
        src={props.player.avatar}
      />
      <div className="name">{props.player.username}</div>
      <img
        className="coins"
        src={process.env.PUBLIC_URL + "/images/coins.svg"}
      />

      <div>{!props.done ? props.player.bet.toFixed(2) : (props.player.winnings ? `+${props.player.winnings.toFixed(2)}` : `-${Number(props.player.bet).toFixed(2)}`)}</div>
    </div>
  );
};

export default BettingListItem;
