import React from "react";

const AutoInput = React.forwardRef((props, ref) => {
  return (
    <div className={"coin-input-container " + props.containerClass}>
      <img
        className="coin-img"
        src={process.env.PUBLIC_URL + "/images/@.svg"}
      />
      <input
        placeholder="0.00"
        type="number"
        className={"input coin-input " + props.inputClass}
        ref={ref}
      />
    </div>
  );
});

export default AutoInput;
