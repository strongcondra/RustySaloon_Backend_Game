import React from "react";
import { useSelector } from "react-redux";

const MeBar = props => {

  const username = useSelector(state => state.profile.username);
  const avatar = useSelector(state => state.profile.avatar);
  const loggedIn = useSelector(state => state.profile.loggedIn);
  
  return (
    <div className= "me-bar">
      
      <div className = {"info " + (!loggedIn ? "hidden" : "")}>
        <img
          className="profile-pic"
          src={avatar}
        />
        <a href="/profile">{username}</a>
        <img
          className="hide-on-mobile logout"
          src={process.env.PUBLIC_URL + "/images/logout.svg"}
          onClick={() => {document.location.replace('/logout')}}
        />
      </div>

      <img
          className={"login " + (loggedIn ? "hidden" : "")}
          src={process.env.PUBLIC_URL + "/images/login.png"}
          onClick={ () => {document.location.replace('/auth/steam')}}
        />
    </div>
  );
};

export default MeBar;
