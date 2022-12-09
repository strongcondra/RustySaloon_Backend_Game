import React, {useEffect, useRef} from "react";
import { useSelector, useDispatch } from "react-redux";
import Details from "./Details";
import Table from "./Table";

import {socket} from '../../../Socket';
import { towersHistory, towersConnect, createTowersResponse, towersCheckAlternativeResponse, towersValues } from "../../../redux/ducks/towers";


const Tower = props => {

  const dispatch = useDispatch();
  const betInput = useRef();

  const active = useSelector(state => state.towers.active);
  const level = useSelector(state => state.towers.level);
  const info = useSelector(state => state.towers.info);
  const history = useSelector(state => state.towers.history);
  const mode = useSelector(state => state.towers.mode);

  useEffect(() => {
    document.title = "RustySaloon | Towers";

    socket.on("towersHistory", (history) => {
      dispatch(towersHistory(history))
    })

    socket.emit("towersConnect");

    socket.on("createTowersResponse", (data) => {
      dispatch(createTowersResponse(data));
      dispatch(towersValues(betInput.current ? betInput.current.value : 0)); 
    });

    socket.on("towersConnect", (data) => {
      dispatch(towersConnect(data.balance));
    })

    socket.on("towersSound", (data) => {
      var audio = new Audio(
        data.type === "win" ? process.env.PUBLIC_URL + "/audio/win.mp3" : 
        data.type === "loose" ? process.env.PUBLIC_URL + "/audio/fail.mp3" : 
        process.env.PUBLIC_URL + "/audio/advance.mp3");
      audio.play();
    })

    dispatch(towersValues(betInput.current ? betInput.current.value : 0)); 

  
    socket.on("towersCheckAlternativeResponse", (data) => {
      betInput.current.value = data.bet;
      dispatch(towersValues(betInput.current.value)); 
      dispatch(towersCheckAlternativeResponse(data));
    });
  }, []);

  return (
   
    <div className="tower">
      <Details ref={betInput} info ={info} active = {active} level = {level} mode = {mode}/>
      <Table history = {history}/>
    </div>
  );
};

export default Tower;
