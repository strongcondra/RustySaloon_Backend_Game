import React from "react";

/* If @sidePart is true, element will shift to the right, and push every latter element right as well */
const HeaderItem = props => (
  <span
    onClick={props.onClick}
    className={`header__item ${props.className} ${
      props.sidePart ? "header__item--side-part" : ""
    }`}
  >
    {props.children}
  </span>
);
export default HeaderItem;
