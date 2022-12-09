import React, { useState, useEffect, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link } from "react-router-dom";
import FullPopup from "../FullPopup";
import HeaderItem from "../HeaderItem";
import { socket } from "../../Socket";
import { balanceUpdate } from "../../redux/ducks/profile";
import FakeCaptcha from "../Captcha";



const Header = (props) => {
  const dispatch = useDispatch();

  const profile = useSelector(state => state.profile);
  const input = useRef();

  const [redeemVisible, setRedeemVisible] = useState(false);
  const [faucetVisible, setFaucetVisible] = useState(false);
  const [captchaVisible, setCaptchaVisible] = useState(false);

  useEffect(() => {
    socket.on("balance", (data) => {
      dispatch(balanceUpdate(data));
    });
  });

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

  /*let check = (type) => {
    if (captcha != "") {
      popupRes(type, captcha, input.current.value);
      setCaptcha("");
      captcha.execute();
    }
  };*/

    //Closing the pop-ups when outside

    let faucetRef = useRef();
    let redeemRef = useRef();

    useEffect(() => {

      let handler = (event) => {

        if(!faucetRef.current.contains(event.target)){
          setFaucetVisible(false);
        }
        if(!redeemRef.current.contains(event.target)){
          setRedeemVisible(false);       
        }

      };

      document.addEventListener("mousedown", handler);

      return () => {
        document.removeEventListener("mousedown", handler)
      };  
    });


  return (
    <React.Fragment>

      <div ref={faucetRef}>
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
            <div className="redeem__inputs">
              <input
                placeholder="Enter code"
                className="input"
                type="text"
                ref={input}
              />
              <button className="button button--green green"  onClick={() => {setCaptchaVisible(true)}}>CLAIM</button>
            </div>
            
            <div className={captchaVisible ? "redeem__captcha": "hidden"}>
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

      <header className="header header--desktop">
        <HeaderItem className="header__link--logo">
          <Link className="header__link--logo" to="">
            <img src={process.env.PUBLIC_URL + "/images/logo.png"} />
          </Link>
        </HeaderItem>

        <HeaderItem className="popup-trigger">
          Gamemodes
          <img src={process.env.PUBLIC_URL + "/images/carrot-down.svg"} />
          <div className="popup popup--gamemodes">
            <Link className="popup__gamemode gm_roulette" to="/"></Link>
            <Link className="popup__gamemode gm_crash" to="/crash"></Link>
            <Link className="popup__gamemode gm_50x" to="/50x"></Link>
            <Link className="popup__gamemode gm_towers" to="/tower"></Link>
            <Link className="popup__gamemode gm_dice" to="/dice"></Link>
            <div className="popup__gamemode">Coming Soon</div>
          </div>
        </HeaderItem>
        <HeaderItem>
          <Link to="/affiliates">Affiliates</Link>
        </HeaderItem>
        <HeaderItem onClick={(e) => setRedeemVisible(true)}>Redeem</HeaderItem>
        <HeaderItem onClick={(e) => setFaucetVisible(true)}>Faucet</HeaderItem>
        <HeaderItem className="popup-trigger">
          Other
          <img src={process.env.PUBLIC_URL + "/images/carrot-down.svg"} />
          <div className="popup popup--other">
            <Link to="/tos">Terms of Service</Link>
            <Link to="/faq">FAQ</Link>
            <Link to="/provably-fair">Provably Fair</Link>
          </div>
        </HeaderItem>

        <HeaderItem className="header__item--withdraw" sidePart={true}>
          <Link to="/withdraw">Withdraw</Link>
        </HeaderItem>
        {profile.loggedIn ? (
          <HeaderItem className="header__item--deposit">
            <div className="coin-container">
              <Link to="/deposit" className="button button--deposit">
                Deposit
              </Link>
              <div>
                <img src={process.env.PUBLIC_URL + "/images/coins.svg"} />
                {profile.loggedIn ? parseFloat(profile.balance).toFixed(2) : '0.00'}
              </div>
            </div>
          </HeaderItem>
        ) : (
        <HeaderItem className="header__item--deposit">
            <Link to="/deposit" className="button button--deposit" data-isfull="true">
              Deposit
            </Link>
          </HeaderItem>
        )}
      </header>
    </React.Fragment>
  );
};
export default Header;
