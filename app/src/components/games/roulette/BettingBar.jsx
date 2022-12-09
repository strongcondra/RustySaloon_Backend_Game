import React, { useEffect } from "react";
import { socket } from "../../../Socket";
import CoinInput from "../../CoinInput";
import BettingButton from "../../BettingButton";

const BettingBar = React.forwardRef((props, ref) => {
  useEffect(() => {
    socket.on("maxButton", (bal) => {
      ref.current.value = Number(bal > 500 ? 500 : bal);
    });
  });

  return (
    <div className="betting-bar">
      <div>
        <div className="betting-bar__title">Bet Amount</div>
        <CoinInput containerClass="betting-bar-input-container" ref={ref} />
      </div>

      <div className="hide-on-mobile">
        <BettingButton
          add={0.05}
          ref={ref}
          className="button betting-bar__betting-button"
        >
          +0.05
        </BettingButton>
        <BettingButton
          add={0.5}
          ref={ref}
          className="button betting-bar__betting-button"
        >
          +0.5
        </BettingButton>
        <BettingButton
          add={1}
          ref={ref}
          className="button betting-bar__betting-button"
        >
          +1
        </BettingButton>
        <BettingButton
          add={10}
          ref={ref}
          className="button betting-bar__betting-button"
        >
          +10
        </BettingButton>
        <BettingButton
          multiply={0.5}
          ref={ref}
          className="button betting-bar__betting-button"
        >
          1/2
        </BettingButton>
        <BettingButton
          multiply={2}
          ref={ref}
          className="button betting-bar__betting-button"
        >
          x2
        </BettingButton>
        <BettingButton
          max={1}
          ref={ref}
          className="button betting-bar__betting-button"
        >
          Max
        </BettingButton>
      </div>
    </div>
  );
});

export default BettingBar;
