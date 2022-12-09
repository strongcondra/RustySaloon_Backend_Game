import React, { useEffect, createRef } from 'react';
import Chat from "../components/Chat";
import MobileHeader from "../components/desktop/Header";
import DesktopHeader from "../components/mobile/Header";
import MobileNav from "../components/mobile/Nav";
import TabComponent from "../components/TabComponent";

import { socket } from "../Socket";

import { profileResponse, code } from "../redux/ducks/profile";
import { useSelector, useDispatch } from "react-redux";

import StringTools  from "../utils/StringTools";

const linkInput = createRef();

const ProfileRoute = props => {

  const username = useSelector(state => state.profile.username);
  const avatar = useSelector(state => state.profile.avatar);
  const info = useSelector(state => state.profile.info);
  const transactions = useSelector(state => state.profile.transactions);
  const gameHistory = useSelector(state => state.profile.gameHistory);

  const dispatch = useDispatch();
  useEffect(() => {

    document.title = "RustySaloon | Profile";

    socket.emit("profile");

    socket.on("profileResponse", (data) => {
      dispatch(profileResponse(data));
      linkInput.current.value = data.tradeurl;
    });

    socket.emit("codeInfo");

    socket.on("code", (data) => {
      dispatch(code(data));
    });
  }, []);

  return (
    <React.Fragment>
      {/* <DesktopHeader />
      <MobileHeader />
      <Chat />
      <MobileNav /> */}

      <div className="page-content">
        <div className="profile">
          <div className="profile__head">
            <div className="profile__head-user-profile-container">
              <img
                src={avatar}
                className="profile-pic"
              />
              <div>
                <div>{username}</div>
                <div className="profile__head-user-tradelink-container">
                  <input
                    placeholder="Tradelink"
                    className="input"
                    type="text"
                    ref={linkInput}
                  />
                  <button className="button button--green" 
                    onClick = {() => {
                      if(linkInput.current.value != "") {
                        socket.emit("enterTradeurl", linkInput.current.value);
                      }
                    }}>
                    SAVE
                  </button>
                  <span className="find-trade-link">
                    Find your tradelink <a href="https://steamcommunity.com/my/tradeoffers/privacy#trade_offer_access_url">here</a>
                  </span>
                </div>
              </div>
            </div>
            <div className="profile__head-user-stats">
              <div className="profile__head-user-stat green">
                <div>Total Withdraws</div>

                <div className="value">{info.withdraw.toFixed(2)}</div>
              </div>
              -
              <div className="profile__head-user-stat red">
                <div>Total Deposits</div>

                <div className="value">{info.deposit.toFixed(2)}</div>
              </div>
              =
              <div className={info.withdraw >= info.deposit ? "profile__head-user-stat green" : "profile__head-user-stat red"}>
                <div>Total Profit</div>

                <div className="value">{(info.withdraw - info.deposit).toFixed(2)}</div>
              </div>
            </div>

            <TabComponent>
              <div label="Transactions">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Action</th>
                      <th>Type</th>
                      <th>Timestamp</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      transactions.map((transaction, i) => {
                        let date = new Date(transaction.timestamp);
                      
                        return (
                            <Row 
                              one = "Rust Skins"
                              two = {StringTools.capitalizeFirstLetter(transaction.type)}
                              time = {(date.getMonth() + 1) + "/" + date.getDate()}
                              color = {transaction.type == "deposit" ? "red" : "green"}
                              value = {transaction.amount}>
                            </Row>
                          )
                        })
                      }
                  </tbody>
                </table>
              </div>
              <div label="Bet History">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Game</th>
                      <th>Bet Amount</th>
                      <th>Timestamp</th>
                      <th>Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {
                      gameHistory != undefined ? gameHistory.map((game, i) => {
                        let date = new Date(game.timestamp);
                        
                        return (
                            <Row 
                              one = {StringTools.capitalizeFirstLetter(game.mode)}
                              two = {game.betvalue / 100}
                              time = {(date.getMonth() + 1) + "/" + date.getDate()}
                              color = {game.winnings < 0 ? "red" : "green"}
                              value = {game.winnings / 100}>
                            </Row>
                          )
                        }) : ""
                      }
                  </tbody>
                </table>
              </div>
            </TabComponent>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

const Row = props => (
  <tr>
    <td>{props.one}</td>
    <td>{props.two}</td>
    <td>{props.time}</td>
    <td className={props.color}>{props.value}</td>
  </tr>
);

export default ProfileRoute;
