import React from "react";

const CrashMultipliers = props => {
  return (
    <div className="crash__multipliers">
      {
        props.history.map((info, i) => {
          return <CrashHistory number={Number(info.coords.y).toFixed(2)} />
        })
      }
    </div>
  );
};

const CrashHistory = props => {
  return (
      <div className={props.number > 5 ? "crash__multiplier crash__multiplier--yellow" : props.number > 2 ? "crash__multiplier crash__multiplier--green" : props.number > 1.3 ? "crash__multiplier crash__multiplier--blue" : "crash__multiplier crash__multiplier--red"}>
          <p>{props.number}x</p>
      </div>
  )
};

export default CrashMultipliers;
