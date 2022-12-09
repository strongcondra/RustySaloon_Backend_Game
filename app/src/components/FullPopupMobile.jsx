import React from "react";

const FullPopup = props => {
  return (

    <div style={{maxWidth:'240px'}}>
        <div className="full-popup ">
        <div
            className={"full-popup__bg " + (props.visible ? "visible" : "")}
        ></div>
        <div
            className={"full-popup__content " + (props.visible ? "visible" : "")}
            style={{marginTop:'0', cursor:'pointer'}}
        >
            <div className="full-popup__header">
            <div>{props.title}</div>
            <div className="full-popup__close" onClick={props.close}>
                <img src={process.env.PUBLIC_URL + "/images/x.svg"} />
            </div>
            </div>
            <div className="full-popup__body">{props.children}</div>
        </div>
        </div>
    </div>
  );
};
export default FullPopup;