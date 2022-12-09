import React from "react";

const PreviousRolls = props => {
  return (
    <div className="previous-rolls">
      <div className="hide-on-mobile">Pevious Rolls</div>
      <div>
        {
            props.rolls.slice(0, 10).map((data, i) => {
              return <HistoryCircle info = {data.fairRound.ticket}/>
            })
        }
      </div>
    </div>
  );
};

const HistoryCircle = props => {
  return (
    <div className={
      props.info == 0 ? "roll-circle roll-circle--green" : 
      props.info <=7 ? "roll-circle roll-circle--red" : 
      "roll-circle roll-circle--black"}>
    </div>
  );
};

export default PreviousRolls;
