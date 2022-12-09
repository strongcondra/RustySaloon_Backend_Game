import React from "react";

const Spinner = props => {
  return (
    <div className="spinner" id="spinner">
      <div className="spinner__items" id = 'spinner__items'>
        {
          props.rouletteNumbers.map((number) => {
            return <Number number={number}/>
          })
        }
        
      </div>
      <img
        className="spinner__spin-select"
        src={process.env.PUBLIC_URL + "/images/spin-select.svg"}
      />
    </div>
  );
};

const Number = props => {
  return (
    <div className={props.number == 0 ? "spinner__item spinner__item--green" : props.number < 8 ? "spinner__item spinner__item--red" : "spinner__item spinner__item--black"}>
      {props.number == 0 ? <img id="spinner__img" src ={process.env.PUBLIC_URL + "/images/logo-icon.png"}/> : props.number}
    </div>
  );
}

export default Spinner;
