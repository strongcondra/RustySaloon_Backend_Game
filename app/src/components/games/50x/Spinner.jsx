import React from "react";

const SpinnerFT = props => {
  return (
    <div className="FT__spinner-container">
      <img
        className="FT__spinner-img"
        src={process.env.PUBLIC_URL + "/images/spin-wheel.png"}
        id="FT__spinner-img"
      />
      <div className="FT__spinner-inner">{props.spinnerActive ? "Spinning" : `${props.counter > 0 ? props.counter.toFixed(1) : "0.0"}s`}</div>
    </div>
  );
};

export default SpinnerFT;
