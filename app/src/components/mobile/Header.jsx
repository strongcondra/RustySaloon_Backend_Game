import React, { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { toggleChatCollapsed, toggleNavCollapsed } from "../../redux/ducks/app";
import HeaderItem from "../HeaderItem";

const Header = (props) => {
  const dispatch = useDispatch();

  const balance = useSelector((state) => state.profile.balance);

  useEffect(() => {}, []);

  return (
    <header className="header header--mobile">
      <HeaderItem>
        <img
          className="button"
          onClick={() => dispatch(toggleNavCollapsed())}
          src={process.env.PUBLIC_URL + "/images/burger.svg"}
        />
        <img
          className="button"
          onClick={() => dispatch(toggleChatCollapsed())}
          src={process.env.PUBLIC_URL + "/images/chat.svg"}
        />
      </HeaderItem>

      <HeaderItem className="header__link--logo">
        <Link className="header__link--logo" to="">
          <img src={process.env.PUBLIC_URL + "/images/logo-icon.png"} />
        </Link>
      </HeaderItem>
      <HeaderItem>
        <div className="coin-container">
          <button className="button button--deposit" id="mobile">
            <div>+</div>
          </button>
          <div>
            <img src={process.env.PUBLIC_URL + "/images/coins.svg"} />
            {balance}
          </div>
        </div>
      </HeaderItem>
    </header>
  );
};
export default Header;
