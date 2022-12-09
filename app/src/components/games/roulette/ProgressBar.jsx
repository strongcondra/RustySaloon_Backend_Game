import React from "react";

const Progressbar = props => {
  return (
    <div className="progress-bar">
      <div className="progress-bar__fill" style={{width: props.percent}}></div>
    </div>
  );
};

export default Progressbar;
