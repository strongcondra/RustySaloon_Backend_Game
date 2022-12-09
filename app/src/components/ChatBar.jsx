import React, { useState } from "react";
import { useSelector } from "react-redux";

import { socket } from "../Socket";

import StringTools  from "../utils/StringTools";

const ChatBar = props => {
  return (
    <div className="chat-bar">
      <img className="chat-bar-social" src={process.env.PUBLIC_URL + "/images/twitter.svg"} style={{"border-radius": "16px"}} alt = "twit" onClick={() => {window.open("https://twitter.com/RustySaloon")}}/>
      <img className="chat-bar-social" src={process.env.PUBLIC_URL + "/images/discord.svg"} style={{"border-radius": "16px"}} alt = "disc" onClick={() => {window.open("https://discord.gg/sYRJaTF")}}/>
      <Langs />
    </div>
  );
};

const Langs = props => {
  const [open, setOpen] = useState(false);

  const playersOnline = useSelector(state => state.chat.playersOnline);
  const regionPlayers = useSelector(state => state.chat.regionPlayers);
  const activeChat = useSelector(state => state.chat.activeChat);

  const regions = [
    "english",
    "russian",
    "turkish",
    "spanish",
    "swedish",
  ];

  /**
   * Changes activeChat
   * @param {*} lang 
   */
  function changeLang(lang) {
    socket.emit("switchChat", {
      type: lang
    })
  }
  
  return (
    <React.Fragment>
      <div className="chat-langs__active-lang" onClick={e => setOpen(!open)}>
        
        <img src={process.env.PUBLIC_URL + `/images/${activeChat}.svg`} />

        <div className="hide-on-mobile">
          <div>{StringTools.capitalizeFirstLetter(activeChat)} Chat</div>
        </div>
        <div className="right">{regionPlayers[activeChat]} / {playersOnline}</div>

        <div className={"chat-langs__other-langs " + (!open ? "hidden" : "")}>
          {
            regions.map(region => {
              if(region != activeChat){
                return (
                  <div className="chat-langs__other-lang" onClick = {() => {changeLang(region)}}>
                    <img src={process.env.PUBLIC_URL + `/images/${region}.svg`} />
                    <div className="hide-on-mobile">
                      <div>{StringTools.capitalizeFirstLetter(region)} Chat</div>
                    </div>
                    <div>{regionPlayers[region]}</div>
                  </div>
                )
              }
            })
          }
        </div>
      </div>
    </React.Fragment>
  );
};

export default ChatBar;
