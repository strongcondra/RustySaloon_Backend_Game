import React from "react";
import {socket} from '../Socket';

const BettingButton = React.forwardRef((props, ref) => {

    return (
      <button 
        className={props.className}
        onClick={ () => {
            
            if(props.add){
              
              ref ? 
                ref.current.value = Math.round(eval(ref.current.value + "+" + props.add) * 100) / 100 : 
                props.setBetInput(Math.round(eval(props.betInput + "+" + props.add) * 100) / 100);
            } else if(props.multiply){
              ref ?   
                ref.current.value = Math.round(eval(ref.current.value + "*" + props.multiply) * 100) / 100 : 
                props.setBetInput(Math.round(eval(props.betInput + "*" + props.multiply) * 100) / 100);
            } else if(props.set) {
              ref ? 
                ref.current.value = props.set : 
                props.setBetInput(props.set);
            } else if(props.max){
              socket.emit("maxButton");
            }

            props.handler()
          }
        }
      >
        {props.children}
      </button>
    )
});

  export default BettingButton;