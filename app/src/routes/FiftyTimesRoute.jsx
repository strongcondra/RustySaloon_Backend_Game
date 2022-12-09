import React from "react";
import Chat from "../components/Chat";
import MobileHeader from "../components/desktop/Header";
import FiftyTimes from "../components/games/50x/FiftyTimes";
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
        <FiftyTimes />
      </div>
    </React.Fragment>
  );
};

export default FiftyTimesRoute;
