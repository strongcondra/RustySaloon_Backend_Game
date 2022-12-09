  
import React from "react";

const CoinInput = React.forwardRef((props, ref) => {

  return (
    <div className={"coin-input-container " + props.containerClass}>
      <img
        className="coin-img"
        src={process.env.PUBLIC_URL + "/images/coins.svg"}
      />
      <input
        placeholder="0.00"
        value={props.betInput ? props.betInput : null}
        type="number"
        className={"input coin-input " + props.inputClass}
        onChange={(e) => {
          ref ? ref.current.value = e.target.value : props.setBetInput(e.target.value)
        }}
        ref={ref}
      />
      <button className="button" 
        onClick={() => {
          ref ? ref.current.value = "" : 
          props.setBetInput(0);
      }}>
        <img id="button-clear-button" src={process.env.PUBLIC_URL + "/images/x.svg"} />
      </button>
    </div>
  );
});
export default CoinInput;