import React, { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import TabComponent from "./TabComponent";
import { socket } from "../Socket";
import { updateHashes } from "../redux/ducks/pf";

const ProvablyFair = (props) => {
  const dispatch = useDispatch();
  const hashes = useSelector((state) => state.pf.hashes);

  const roulette = useSelector((state) => state.pf.roulette);
  const crash = useSelector((state) => state.pf.crash);
  const dice = useSelector((state) => state.pf.dice);
  const fiftyx = useSelector((state) => state.pf.fiftyx);

  useEffect(() => {
    socket.emit("pfHistory");

    document.title = "RustySaloon | Provably Fair";

    socket.on("pfHistoryRef", (data) => {
      dispatch(updateHashes(data));
    });
  }, []);

  return (
    <div className="provably-fair">
      <h1>Provably Fair</h1>

      <TabComponent>
        <div label="Overview">
          <p>
            Here you can verify all games. Our results are always random. Our
            system is designed so that nobody can know the outcome before the
            round has ended. Games are determined by two randomly generated
            seeds that when combined, decide the outcome of the game.
          </p>

          <p>
            We have no control over what the result will be, our system will
            always be provably fair.
          </p>

          <p>
            You are able to verify each round by inputting the round outcome and
            the round secret given below. From this, it will give the matching
            hash from that round, ensuring that the round was randomly generated
            and fair. Try it for yourself! Use this
          </p>

          {/*<div className="provably-fair__code-pen">Code Pen</div>*/}

          <iframe
            height="518"
            style={{ width: "100%" }}
            scrolling="no"
            title="Rusty Saloon Provably Fair"
            src="https://codepen.io/winjw7/embed/preview/ExZpNrz?height=518&theme-id=light&default-tab=js,result"
            frameborder="no"
            loading="lazy"
            allowtransparency="true"
            allowfullscreen="true"
          >
            See the Pen{" "}
            <a href="https://codepen.io/winjw7/pen/ExZpNrz">
              Rusty Saloon Provably Fair
            </a>{" "}
            by winjw7 (<a href="https://codepen.io/winjw7">@winjw7</a>) on{" "}
            <a href="https://codepen.io">CodePen</a>.
          </iframe>
        </div>

        <div label="Roulette" className = "provfair__container">
          <div className="provfair__currentHash">
            <b>Current Hash: {hashes.roulette}</b>
          </div>
          <div className="provfair__pastHashes-container">
            {roulette ? roulette.map((info) => {
              return (
                <MapPF info={info.fairRound}></MapPF>
              );
            }): ""}
          </div>
        </div>
        <div label="Crash" className = "provfair__container">
          <div className="provfair__currentHash">
            <b>Current Hash: {hashes.crash}</b>
          </div>
          <div className="provfair__pastHashes-container">
            {crash ? crash.map((info) => {
              return (
                <MapPF info={info.info.fairRound}></MapPF>
              );
            }): ""}
          </div>
        </div>
        <div label="50x" className = "provfair__container">
          <div className="provfair__currentHash">
            <b>Current Hash: {hashes.wof}</b>
          </div>
          <div className="provfair__pastHashes-container">
            {fiftyx ? fiftyx.map((info) => {
              return (
                <MapPF info={info.fairRound}></MapPF>
              );
            }): ""}
          </div>
        </div>
        <div label="Dice" className = "provfair__container">
          <div className="provfair__pastHashes-container">
            {dice ? dice.map((info) => {
              return (
                <MapPF won={info.winnings > 0} info={info.fairRound}></MapPF>
              );
            }): ""}
          </div>
        </div>
      </TabComponent>
    </div>
  );
};

const MapPF = props => {

  return (
    <div
      className="provfair__pastHashes-hash"
    >
      <div
        className="roll-circle" id = "prov"
        style={{
          backgroundColor: `var(--${
            props.info.type === "roulette"
              ? props.info.ticket === 0
                ? "green"
                : props.info.ticket <= 7
                ? "red"
                : "purple"
              : props.info.type === "crash"
              ? props.info.ticket > 5
                ? "yellow"
                : props.info.ticket > 2
                ? "green"
                : "red"
              : props.info.type === "dice"
              ? props.won
                ? "green"
                : "red"
              : props.info.color === "black"
              ? "purple"
              : props.info.color
          })`,
          height: "50px",
          width: "50px",
        }}
      >
        <p>{props.info.ticket}</p>
      </div>
      <div className="provfair__pastHashes-hash-details">
        <p>
          Hash: <span style={{ fontSize: "12px" }}>{props.info.hash}</span>
        </p>

        <p>
          Secret: <span style={{ fontSize: "12px" }}>{props.info.secret}</span>
        </p>
      </div>
    </div>
  );
}

export default ProvablyFair;
