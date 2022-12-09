import React from "react";
import Chat from "../components/Chat";
import MobileHeader from "../components/desktop/Header";
import Affiliates from "../components/Affiliates";
import DesktopHeader from "../components/mobile/Header";
import MobileNav from "../components/mobile/Nav";

const AffiliatesRoute = props => {
  return (
    <React.Fragment>
      {/* <DesktopHeader />
      <MobileHeader />
      <Chat />
      <MobileNav /> */}

      <div className="page-content">
        <Affiliates />
      </div>
    </React.Fragment>
  );
};

export default AffiliatesRoute;
