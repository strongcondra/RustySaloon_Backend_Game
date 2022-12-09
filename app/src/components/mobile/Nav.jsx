import React, {useState,useRef,useEffect} from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import MeBar from "../MeBar";
import { socket } from "../../Socket";
import FullPopup from "../FullPopupMobile";
import FakeCaptcha from "../Captcha";

const Nav = props => {
  const navCollapsed = useSelector(state => state.app.navCollapsed);

  // About the captcha
  const input = useRef();
  const [redeemVisible, setRedeemVisible] = useState(false);
  const [faucetVisible, setFaucetVisible] = useState(false);
  const [captchaVisible, setCaptchaVisible] = useState(false);

   // About the captcha
  let popupRes = (type, captcha, value) => {
    if (type === "referralCode") {
      const code = value;
      if (code !== "" && captcha !== "") {
        socket.emit("addReferralCode", { code: code, captcha: captcha });
      }
    } else if (type === "faucet") {
      if (captcha !== "") {
        socket.emit("claimFaucet", { captcha: captcha });
      }
    }
  };

  //Closing the pop-ups when outside

  let faucetReff = useRef();
  let redeemRef = useRef();

  useEffect(() => {

    let handler = (event) => {

      if(!faucetReff.current.contains(event.target)){
        setFaucetVisible(false);
      }
      if(!redeemRef.current.contains(event.target)){
        setRedeemVisible(false);       
      }

    };

    document.addEventListener("ontouchend", handler);

    return () => {
      document.removeEventListener("ontouchend", handler)
    };  
  });

  return (
    <div
      className={
        "nav nav--mobile hidden-on-desktop " + (!navCollapsed ? "visible" : "")
      }
    >
      <MeBar />
      
      {/* This is a space for mobile pop-ups */}
      <div ref={faucetReff}>
        <FullPopup
          title="Faucet"
          close={() => { setFaucetVisible(false); setCaptchaVisible(false)}}
          visible={faucetVisible}
        >
          <div className="faucet">
            <div className="faucet__title">Claim 3 Cents Every 15 Minutes!</div>
            <div className="">
              <strong>Requirement</strong>: Balance must be 0.00 and your steam name
              must include rustysaloon.com
            </div>
            <button className="button button--green green" onClick={() => {setCaptchaVisible(true)}}>CLAIM</button>
          </div>

          <div className={captchaVisible ? "redeem__captcha": "hidden"}>
              <FakeCaptcha
                submit={(captcha) => {
                  popupRes("faucet", captcha, input.current.value);
                }}
                key="6LefWTAaAAAAAIeeXuXO0VJ0RjioqSGXbNBvaJc_" 
              />
            </div>
        </FullPopup>
      </div>

      <div ref={redeemRef}>
        <FullPopup
          title="Referral code"
          close={() => {setRedeemVisible(false); setCaptchaVisible(false)}}
          visible={redeemVisible}
        >
          <div className="redeem">
            <div>Use code Saloon for 50 free Cents</div>

            <div>
              <div className="redeem__inputs">
                <input
                  placeholder="Enter code"
                  className="input"
                  type="text"
                  ref={input}
                  style={{maxWidth:'240px'}}
                />
              </div>
              <div style={{paddingTop:'1em'}}>
                <button className="button button--green green"  onClick={() => {setCaptchaVisible(true)}}>CLAIM</button>
              </div>
            </div>

            <div className={captchaVisible ? "redeem__captcha": "hidden"} style={{paddingTop:'30px', marginLeft:'-20%'}}>
              <FakeCaptcha
                submit={(captcha) => {
                  popupRes("referralCode", captcha, input.current.value);
                }}
                key="6LeRd9EZAAAAAGVfUxgnbZGLJ8oTX3RZntNz_0Vd"
              />
            </div>

          </div>
        </FullPopup>
      </div>
      {/* This is a space for mobile pop-ups */}

      <div className="nav__links">
        <Link to="/" className="nav-item nav-item--game">
          <img src={process.env.PUBLIC_URL + "/images/roulette.svg"} />
          Roulette
        </Link>
        <Link to="/crash" className="nav-item nav-item--game">
          <img src={process.env.PUBLIC_URL + "/images/crash.svg"} />
          Crash
        </Link>
        <Link to="/50x" className="nav-item nav-item--game">
          <img src={process.env.PUBLIC_URL + "/images/50x.svg"} />
          50x
        </Link>
        <Link to="/tower" className="nav-item nav-item--game">
          <img src={process.env.PUBLIC_URL + "/images/towers.svg"} />
          Towers
        </Link>
        <Link to="/dice" className="nav-item nav-item--game">
          <img src={process.env.PUBLIC_URL + "/images/dice.svg"} />
          Dice
        </Link>

        <Link to="/affiliates" className="nav-item">
          Affiliates
        </Link>
        <div className="nav-item" onClick={(e) => setRedeemVisible(true)}>
          Redeem Code
        </div>
        <div className="nav-item"  onClick={(e) => setFaucetVisible(true)}>
          Faucet
        </div>
        <Link to="/tos" className="nav-item">
          Terms of Service
        </Link>
        <Link to="/faq" className="nav-item">
          FAQ
        </Link>
        <Link to="/provably-fair" className="nav-item">
          Provably Fair
        </Link>
        <Link
          to=""
          className="nav-item"
          onClick={() => {
            document.location.replace("/logout");
          }}
        >
          <img src={process.env.PUBLIC_URL + "/images/logout.svg"} />
          Logout
        </Link>
      </div>

      <div className="nav__footer">
        <Link href="/deposit" className="button button--deposit">Deposit</Link>
        <Link href="/withdraw" className="button button--withdraw">
          Withdraw
        </Link>
      </div>
    </div>
  );
};
export default Nav;
