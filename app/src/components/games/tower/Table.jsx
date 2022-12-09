import React from "react";

const Table = props => {
  return (
    <table className="table tower__table">
      <thead>
        <tr>
          <th>Username</th>
          <th>Time</th>
          <th>Value</th>
          <th>Payout</th>
        </tr>
      </thead>
      <tbody>
        {
          props.history ? props.history.map((info, i) => {
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
      <td className={Number(props.info.winnings) > 0 ? "green" : "red"}>{(Math.floor(Number(props.info.winnings) * 100) / 100).toFixed(2)}</td>
    </tr>
  )
};

export default Table;
