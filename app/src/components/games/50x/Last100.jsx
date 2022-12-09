import React from "react";
import ColorBar from "../../ColorBar";

const Last100 = props => {
  return (
    <div className="last-100-bar">
      <div className="last-100-bar__title hide-on-mobile">Last 100</div>
      <ColorBar color="red" />
      {props.lastBets.red}
      <ColorBar color="black" />
      {props.lastBets.black}
      <ColorBar color="green" />
      {props.lastBets.green}
      <ColorBar color="yellow" />
      {props.lastBets.yellow}
    </div>
  );
};

export default Last100;
