import React from "react";
import Chat from "../components/Chat";
import MobileHeader from "../components/desktop/Header";
import Crash from "../components/games/crash/Crash";
import DesktopHeader from "../components/mobile/Header";
import MobileNav from "../components/mobile/Nav";

const CrashRoute = props => {
  return (
    <React.Fragment>
      {/* <DesktopHeader />
      <MobileHeader />
      <Chat />
      <MobileNav /> */}

      <div className="page-content">
        <Crash />
      </div>
    </React.Fragment>
  );
};

export default CrashRoute;
