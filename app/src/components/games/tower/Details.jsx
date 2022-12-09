import React, { useState, Fragment } from "react";
import BetAmount from "../../BetAmount";
import { socket } from "../../../Socket";
import { setMode, towersValues } from "../../../redux/ducks/towers";
import { useDispatch } from "react-redux";

const Details = React.forwardRef((props, ref) => {
  const dispatch = useDispatch();

  function setBet() {
    if (ref.current !== undefined) {
      const bet = ref.current.value;

      if (bet !== "" && bet > 0) {
        socket.emit("createTowers", {
          level: props.mode,
          betValue: bet,
        });
      }
    }
  }

  function cashout() {
    if (props.active) {
      socket.emit("towersCashout");
    }
  }

  return (
    <div className={"tower__details " + props.mode}>
      <DifficultyButtons mode={props.mode} betInput={ref} />
      <Board
        info={props.info}
        active={props.active}
        level={props.level}
        mode={props.mode}
      />

      <BetAmount
        ref={ref}
        gamemode={"towers"}
        handler={() => {
          dispatch(towersValues(ref.current.value));
        }}
      />

      <button
        className="button button--green button--play"
        onClick={() => {
          !props.active ? setBet() : cashout();
        }}
      >
        {!props.active ? "PLAY" : "CASHOUT"}
      </button>
    </div>
  );
});

const DifficultyButtons = props => {
  const dispatch = useDispatch();

  return (
    <div className="difficulty-buttons">
      <DifficultyButton
        onClick={() => {
          dispatch(setMode("easy"));
          dispatch(towersValues(props.betInput.current.value));
        }}
        difficulty="easy"
        activeDifficulty={props.mode}
      />
      <DifficultyButton
        onClick={() => {
          dispatch(setMode("medium"));
          dispatch(towersValues(props.betInput.current.value));
        }}
        difficulty="medium"
        activeDifficulty={props.mode}
      />
      <DifficultyButton
        onClick={() => {
          dispatch(setMode("hard"));
          dispatch(towersValues(props.betInput.current.value));
        }}
        difficulty="hard"
        activeDifficulty={props.mode}
      />
    </div>
  );
};

const DifficultyButton = props => (
  <button
    onClick={() => props.onClick()}
    className={
      "button button--difficulty " +
      (props.difficulty === props.activeDifficulty ? "active" : "")
    }
  >
    {props.difficulty.toUpperCase()}
  </button>
);

const Board = props => {
  return (
    <div className="tower__board">
      {props.info !== undefined
        ? props.info
            .slice(0)
            .reverse()
            .map((info, i) => {
              return (
                <TowerNumbers
                  gameActive={props.active}
                  number={info.number}
                  answer={info.answer}
                  mode={props.mode}
                  active={props.level === props.info.length - 1 - i}
                  handler={number => {
                    socket.emit("towersCheckAlternative", {
                      alternative: number,
                    });
                  }}
                />
              );
            })
        : ""}
    </div>
  );
};

const TowerNumbers = ({
  number,
  answer,
  mode,
  active,
  handler,
  gameActive,
}) => {
  return (
    <Fragment>
      <div
        onClick={() => {
          if (active) handler(1);
        }}
        style={{}}
        className={
          (!gameActive &&
            mode !== "hard" &&
            answer !== 1 &&
            answer !== undefined) ||
          (answer === 1 && (gameActive || mode === "hard"))
            ? "tower__board-value tower__board-value--green"
            : "tower__board-value tower__board-value--white"
        }
      >
        {number}
      </div>
      <div
        onClick={() => {
          if (active) handler(2);
        }}
        style={{}}
        className={
          (!gameActive &&
            mode !== "hard" &&
            answer !== 2 &&
            answer !== undefined) ||
          (answer === 2 && (gameActive || mode === "hard"))
            ? "tower__board-value tower__board-value--green"
            : "tower__board-value tower__board-value--white"
        }
      >
        {number}
      </div>
      <div
        onClick={() => {
          if (active) handler(3);
        }}
        style={{}}
        className={
          mode === "medium"
            ? "hidden"
            : (!gameActive &&
                mode !== "hard" &&
                answer !== 3 &&
                answer !== undefined) ||
              (answer === 3 && (gameActive || mode === "hard"))
            ? "tower__board-value tower__board-value--green"
            : "tower__board-value tower__board-value--white"
        }
      >
        {number}
      </div>
    </Fragment>
  );
};

export default Details;
