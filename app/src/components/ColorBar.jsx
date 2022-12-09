import React from "react";

const ColorBar = props => {
  return <div className={`color-bar color-bar--${props.color}`}></div>;
};

export default ColorBar;
