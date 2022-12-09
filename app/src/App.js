import React, { Component } from "react";
import { socket } from "./Socket";
import { BrowserRouter as Router, Switch, Route } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';

import RouletteRoute from "./routes/RouletteRoute";
import CrashRoute from "./routes/CrashRoute";
import FiftyTimesRoute from "./routes/FiftyTimesRoute";
import DiceRoute from "./routes/DiceRoute";
import TowerRoute from "./routes/TowerRoute";
// import CupsRoute from "./routes/CupsRoute";
import TermsOfServiceRoute from "./routes/TermsOfServiceRoute";
import FAQRoute from "./routes/FAQRoute";
import ProvablyFairRoute from "./routes/ProvablyFairRoute";
import ProfileRoute from "./routes/ProfileRoute";
import WithdrawDepositRoute from "./routes/WithdrawDepositRoute";
import AffiliatesRoute from "./routes/AffiliatesRoute";
// New Routes, to not reload all the page
import Chat from "./components/Chat";
import MobileHeader from "./components/desktop/Header";
import DesktopHeader from "./components/mobile/Header";
import MobileNav from "./components/mobile/Nav";
import SideNav from "./components/SideNav";



function retoastr(type, msg) {
  if (toast[type]) {
    toast[type](msg, { position: toast.POSITION.BOTTOM_LEFT });
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      apiResponse: "",

      user: null,

      popupActive: false,
      popupHeader: "",
      popupBody: <p></p>,
      popupOnClick: "",
    };
  }

  redirect = () => {
    window.location.href = "http://localhost:9000/auth/steam";
  };

  componentDidMount() {
    socket.on("redirect", data => {
      window.open(data.url);
    });

    socket.on("message", function (data) {
      retoastr(data.type, data.msg);
    });
  }

  login = () => {
    document.location.replace("/auth/steam");
  };

  render() {
    return (
      <>
      
      <div className="App">
        
        <Router>
          
          <DesktopHeader />
          <SideNav style={{zIndex:'999999999999999 !important'}}/>
          <MobileHeader />
          <Chat />
          <MobileNav />

          <Switch>
            <Route exact path="/" component={RouletteRoute} />
            <Route exact path="/roulette" component={RouletteRoute} />
            <Route exact path="/crash" component={CrashRoute} />
            <Route exact path="/50x" component={FiftyTimesRoute} />
            <Route exact path="/dice" component={DiceRoute} />
            <Route exact path="/tower" component={TowerRoute} />
            {/* <Route exact path="/cups" component={CupsRoute} /> */}
            <Route exact path="/tos" component={TermsOfServiceRoute} />
            <Route exact path="/faq" component={FAQRoute} />
            <Route exact path="/provably-fair" component={ProvablyFairRoute} />
            <Route exact path="/profile" component={ProfileRoute} />
            <Route exact path="/affiliates" component={AffiliatesRoute} />
            <Route exact path="/deposit" component={() => <WithdrawDepositRoute name={"Deposit"}/>}/>
            <Route exact path="/withdraw" component={() => <WithdrawDepositRoute name={"Withdraw"}/>}/>
            <Route exact path="/auth/steam" render={() => this.redirect()} />
          </Switch>

          <ToastContainer/>
          
        </Router>
        
      </div>
      </>
    );
  } 
}

export default App;
