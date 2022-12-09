import React from "react";

const Last100Rolls = props => {
  return (
    <div className="last-100">
      <div className="hide-on-mobile">Last 100 Rolls</div>
      <div className="last-100__data">
        <div>
          <div className="roll-circle roll-circle--red"></div>
          {props.red}
        </div>
        <div>
          <div className="roll-circle roll-circle--green"></div>
          {props.green}
        </div>
        <div>
          <div className="roll-circle roll-circle--black"></div>
          {props.black}
        </div>
      </div>
    </div>
  );
};

export default Last100Rolls;
