import React from "react";
import ColorBar from "../../ColorBar";

const Bars = props => {
  return (
    <div className="FT__bars">
      {
        props.history ? props.history.slice(0, 10).map((data, i) => {
          return  <ColorBar color={data.fairRound.color == "blue" ? "black" : data.fairRound.color} />
        }): ""
      }

    </div>
  );
};

export default Bars;
