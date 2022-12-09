import React, { useState } from "react";

const TabComponent = props => {
  const children = React.Children.toArray(props.children);
  const [activeLabel, setActiveLabel] = useState(children[0].props.label);

  return (
    <div className="tab-component">
      <div className="tab-component__tabs">
        {children.map(child => (
          <div
            onClick={() => setActiveLabel(child.props.label)}
            className={
              "tab-component__tab " +
              (activeLabel === child.props.label
                ? "tab-component__tab--active"
                : "")
            }
          >
            {child.props.label}
          </div>
        ))}
      </div>
      <div className="tab-component__content">
        {children.map(child => {
          if (child.props.label === activeLabel) return child;
          return "";
        })}
      </div>
    </div>
  );
};

export default TabComponent;
