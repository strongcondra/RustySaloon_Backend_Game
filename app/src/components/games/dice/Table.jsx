import React, {useEffect,} from "react";
import {socket} from '../../../Socket';
import { useDispatch, useSelector } from "react-redux";
import { setHistory } from "../../../redux/ducks/dice";

const Table = props => {

  const history = useSelector(state => state.dice.history);
  const dispatch = useDispatch();

  useEffect(() => {
    socket.on("diceHistory", (data) => {
        dispatch(setHistory(data));
    });
  }, []);

  return (
    <table className="table dice__table">
      <thead>
        <tr>
          <th>User</th>
          <th>Time</th>
          <th>Wager</th>
          <th>Multiplier</th>
          <th>Payout</th>
        </tr>
      </thead>
      <tbody>
        {
          history ? history.map((info, i) => {
            return <Row info = {info}/>
          }): ""
        }
      </tbody>
    </table>
  );
};


const Row = props => {
  let date = new Date(props.info.timestamp);

  return (
    <tr>
      <td>{props.info.username}</td>
      <td>{(date.getHours())+":"+(date.getMinutes() < 10 ? ("0"+date.getMinutes()) : date.getMinutes())+":"+date.getSeconds()}</td>
      <td>{Number(props.info.betValue).toFixed(2)}</td>
      <td>{props.info.betType == "over" ? "<" : ">"}{(Number(props.info.multiplier)).toFixed(2)}x</td>
      <td className={Number(props.info.winnings) > 0 ? "green" : "red"}>{(Math.floor(Number(props.info.winnings) * 100) / 100).toFixed(2)}</td>
    </tr>
  )
};

export default Table;
