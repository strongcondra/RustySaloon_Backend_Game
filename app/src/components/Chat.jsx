import React, { createRef, useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import ChatBar from "./ChatBar";
import MeBar from "./MeBar";
import { socket } from "../Socket";
import { chat, playersOnline, changedLan } from "../redux/ducks/chat";
import { toggleChatCollapsed } from "../redux/ducks/app";
import { userData } from "../redux/ducks/profile";

const chatInput = createRef();

const Chat = props => {
  const dispatch = useDispatch();
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [rulesVisible, setRulesVisible] = useState(false);
  const chatCollapsed = useSelector(state => state.app.chatCollapsed);

  const messages = useSelector(state => state.chat.messages);

  function scrollToBottom() {
    const messages = document.getElementsByClassName("chat__messages");
    messages.scrollTop = messages.scrollHeight;
  }

  function sendMsg() {
    const msg = chatInput.current.value;

    if (msg !== "") {
      socket.emit("sendMessage", { msg: msg });
      chatInput.current.value = null;
    }
  }

  function enterPressed(event) {
    var code = event.keyCode || event.which;
    if (code === 13) {
      //13 is the enter keycode
      sendMsg();
    }
  }

  useEffect(() => {
    socket.on("userData", data => {
      dispatch(userData(data));
    });

    socket.on("chat", data => {
      dispatch(chat(data));
      scrollToBottom();
    });

    socket.on("playersOnline", data => {
      dispatch(playersOnline(data));
    });

    socket.on("changedLan", data => {
      dispatch(changedLan(data));
    });
  }, []);

  return (
    <React.Fragment>
      <div className={"chat " + (!chatCollapsed ? "visible" : "")}>
        <div className="hide-on-mobile">
          <MeBar />
        </div>

        <ChatBar />

        <div className="chat__messages">
          <div>
            {messages
              ? messages.map(msg => {
                  return (
                    <Message
                      username={msg.username}
                      avatar={msg.avatar}
                      steamid={msg.steamid}
                      rank={msg.rank}
                      chatId={msg.chatId}
                      timestamp={msg.timestamp}
                      id={msg.id}
                    >
                      {msg.msg}
                    </Message>
                  );
                })
              : ""}
          </div>
        </div>
        <div className="chat__input-container">
          <input
            className="input chat__input"
            type="text"
            placeholder="Type Message..."
            onKeyPress={enterPressed.bind(this)}
            ref={chatInput}
          />
          <img
            className="chat__three-dots"
            src={process.env.PUBLIC_URL + `/images/three-dots.svg`}
            onClick={e => setSettingsVisible(!settingsVisible)}
          />
          <div
            className={"chat__settings " + (!settingsVisible ? "hidden" : "")}
          >
            <div
              className="chat__setting"
              onClick={e => dispatch(toggleChatCollapsed())}
            >
              <div className="img-container">
                <img
                  className="img--chat"
                  src={process.env.PUBLIC_URL + `/images/hide-chat.svg`}
                />
              </div>
              Hide Chat
            </div>
            <div
              className="chat__setting"
              onClick={e => setRulesVisible(!rulesVisible)}
            >
              <div className="img-container">
                <img
                  className="img--rules"
                  src={process.env.PUBLIC_URL + `/images/rules.svg`}
                />
              </div>
              Chat Rules
            </div>
            <div className="chat__setting">
              <div className="img-container">
                <img
                  className="img--sound"
                  src={process.env.PUBLIC_URL + `/images/sound.svg`}
                />
              </div>
              Toggle Sound
            </div>
          </div>
        </div>
      </div>

      <div className={"modal modal--rules " + (!rulesVisible ? "hidden" : "")}>
        <div className="modal--bg">
          <div className="modal--content">
            <img
              onClick={e => setRulesVisible(false)}
              className="modal__close"
              src={process.env.PUBLIC_URL + "/images/x.svg"}
            />
            <h3>Chat Rules</h3>
            <p>
              While RustySaloon believes in an open chat, we have a few general
              rules for everyones safety and best interest.
            </p>
            <p>1. No spam or harassment of any kind. </p>
            <p>2. No continuous spam of game predictions.</p>
            <p>3. No promoting other sites or referral codes.</p>
            <p>4. Please refer to and use the chat of your region.</p>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

const Message = props => (
  <div className="chat__message">
    <img
      src={props.avatar}
      className="message__pic profile-pic"
      onClick={() => {
        chatInput.current.value += String(props.id);
      }}
    />
    <div className="message__body">
      <div
        className="message__name"
        onClick={() =>
          window.open(`https://steamcommunity.com/profiles/${props.steamid}`)
        }
      >
        {props.username}
      </div>
      <div className="message__text">{props.children}</div>
    </div>
  </div>
);

Message.defaultProps = {
  username: "Name",
  avatar: process.env.PUBLIC_URL + "/images/profile-pic-blank.png",
  children: "Message",
};

export default Chat;
