import React from "react";
import Chat from "../components/Chat";
import MobileHeader from "../components/desktop/Header";
import Dice from "../components/games/dice/Dice";
import DesktopHeader from "../components/mobile/Header";
import MobileNav from "../components/mobile/Nav";

const FiftyTimesRoute = props => {
  return (
    <React.Fragment>
      {/* <DesktopHeader />
      <MobileHeader />
      <Chat />
      <MobileNav /> */}

      <div className="page-content">
        <Dice />
      </div>
    </React.Fragment>
  );
};

export default FiftyTimesRoute;
