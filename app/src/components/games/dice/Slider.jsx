import React, { useRef, useEffect } from "react";

const Slider = props => {
  
  const max = 10000;
  const min = 1;
  const ref = useRef();

  useEffect(() => {
    calcColors();
  }, [props.val]);

  function calcColors() {

    var value = ((ref.current.value - min) / (max - min)) * 100;

    ref.current.style.background =
      "linear-gradient(to right, #cd412a 0%, #cd412a " +
      value +
      "%, #0b933e " +
      value +
      "%, #0b933e 100%)";
  }

  return (
    <div className="dice__slider-container">
      0%
      <input
        type="range"
        min="1"
        max="10000"
        value={props.val}
        onChange={e => {
          props.handler(e.target.value);
          if (props.onChange) props.onChange(e);
        }}
        className="slider dice__slider"
        //onInput={calcColors()}
        ref={ref}
      />
      100%
    </div>
  );
};

export default Slider;
