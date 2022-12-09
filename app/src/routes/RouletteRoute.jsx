import React from "react";
import Chat from "../components/Chat";
import MobileHeader from "../components/desktop/Header";
import Roulette from "../components/games/roulette/Roulette";
import DesktopHeader from "../components/mobile/Header";
import MobileNav from "../components/mobile/Nav";

const RouletteRoute = props => {
  return (
    <React.Fragment>
      {/* <DesktopHeader />
      <MobileHeader />
      <Chat />
      <MobileNav /> */}

      <div className="page-content">
        <Roulette />
      </div>
    </React.Fragment>
  );
};

export default RouletteRoute;
