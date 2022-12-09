import React from "react";
import Chat from "../components/Chat";
import MobileHeader from "../components/desktop/Header";
import Tower from "../components/games/tower/Tower";
import DesktopHeader from "../components/mobile/Header";
import MobileNav from "../components/mobile/Nav";

const TowerRoute = props => {
  return (
    <React.Fragment>
      {/* <DesktopHeader />
      <MobileHeader />
      <Chat />
      <MobileNav /> */}

      <div className="page-content">
        <Tower />
      </div>
    </React.Fragment>
  );
};

export default TowerRoute;
