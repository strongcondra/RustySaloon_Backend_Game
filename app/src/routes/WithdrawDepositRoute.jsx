import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Chat from "../components/Chat";
import MobileHeader from "../components/desktop/Header";
import DesktopHeader from "../components/mobile/Header";
import MobileNav from "../components/mobile/Nav";
import { socket } from "../Socket";
import { Range } from "react-range";

import {
  setBalance,
  searchForItem,
  updateInventory,
  setSelected,
  removeSelected,
  toggleDescending,
  setMinAmount,
  setMaxAmount,
  setBonus,
} from "../redux/ducks/shop";

const QuestionMark = () => {
  return <svg aria-hidden="true" focusable="false" data-prefix="fas" data-icon="question-circle" role="img" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="svg-inline--fa fa-question-circle fa-w-16 fa-9x"><path fill="currentColor" d="M504 256c0 136.997-111.043 248-248 248S8 392.997 8 256C8 119.083 119.043 8 256 8s248 111.083 248 248zM262.655 90c-54.497 0-89.255 22.957-116.549 63.758-3.536 5.286-2.353 12.415 2.715 16.258l34.699 26.31c5.205 3.947 12.621 3.008 16.665-2.122 17.864-22.658 30.113-35.797 57.303-35.797 20.429 0 45.698 13.148 45.698 32.958 0 14.976-12.363 22.667-32.534 33.976C247.128 238.528 216 254.941 216 296v4c0 6.627 5.373 12 12 12h56c6.627 0 12-5.373 12-12v-1.333c0-28.462 83.186-29.647 83.186-106.667 0-58.002-60.165-102-116.531-102zM256 338c-25.365 0-46 20.635-46 46 0 25.364 20.635 46 46 46s46-20.636 46-46c0-25.365-20.635-46-46-46z" class=""></path></svg>
}

const WithdrawDepositRoute = (props) => {
  const dispatch = useDispatch();

  const searched = useSelector((state) => state.shop.searched);
  const displayIv = useSelector((state) => state.shop.displayIv);
  const selected = useSelector((state) => state.shop.selected);
  const selectedValue = useSelector((state) => state.shop.selectedValue);
  const bonus = useSelector((state) => state.shop.bonus);
  const descending = useSelector((state) => state.shop.descending);
  const profile = useSelector(state => state.profile);

  function displayItem(info, selectedAmount) {
    if (selectedAmount !== undefined) {
      if (selected[info.market_hash_name]) {
        dispatch(setSelected({ info: info, selectedAmount: selectedAmount }));
      }
    } else {
      if (selected[info.market_hash_name]) {
        dispatch(
          removeSelected({ info: info, selectedAmount: selectedAmount })
        );
      } else {
        dispatch(setSelected({ info: info, selectedAmount: selectedValue }));
      }
    }
  }

  function depositItems() {
    if (Object.keys(selected).length > 0) {
      socket.emit("depositItems", {
        items: selected,
      });
    }
  }

  function withdrawItems() {
    if (Object.keys(selected).length > 0) {
      socket.emit("withdrawItems", selected);
    }
  }

  useEffect(() => {
    props.name === "Withdraw"
      ? socket.emit("requestBotInventory")
      : socket.emit("requestInventory");
    socket.emit("balance");

    document.title =
      props.name === "Withdraw"
        ? "RustySaloon | Withdraw"
        : "RustySaloon | Deposit";

    socket.on("balance", (withdraw) => {
      dispatch(setBalance(withdraw));
    });

    socket.on("requestInventoryResponse", (data) => {
      if (
        data.type === undefined ||
        (data.type === "bot" && props.name === "Withdraw")
      ) {
        let stackedItems = {};

        data.pending = data.pending ? data.pending : [];

        for (var i = 0; i < data.iv.length; i++) {
          if (!data.pending.includes(data.iv[i].assetid)) {
            if (!stackedItems[data.iv[i].market_hash_name]) {
              stackedItems[data.iv[i].market_hash_name] = {
                amount: 0,
                selectedAmount: 1,
                color: data.iv[i].color,
                image: data.iv[i].image,
                price: data.iv[i].price,
                market_hash_name: data.iv[i].market_hash_name,
                assetIds: [],
                steamIds: [],
              };
            }
            stackedItems[data.iv[i].market_hash_name].amount += 1;
            stackedItems[data.iv[i].market_hash_name].assetIds.push(
              data.iv[i].assetid
            );
            stackedItems[data.iv[i].market_hash_name].steamIds.push(
              data.iv[i].steamid
            );
          }
        }

        dispatch(setBonus(data.bonus));
        dispatch(searchForItem(searched));
        dispatch(updateInventory(stackedItems));
      }
    });
  }, []);

  return (
    <React.Fragment>
      <DesktopHeader />
      <MobileHeader />
      <Chat />
      <MobileNav />

      <div className="page-content">
        <div className="withdraw-deposit">
          <div className="withdraw">
            <div>{Object.keys(selected).length} Items Selected</div>

            <div className="withdraw__items">
              {Object.keys(selected).length === 0
                ? ""
                : Object.keys(selected)
                    .sort((a, b) => {
                      return descending
                        ? Number(selected[b].price) - Number(selected[a].price)
                        : Number(selected[a].price) - Number(selected[b].price);
                    })
                    .map((item) => {
                      return (
                        <SelectedItems
                          id="wide"
                          info={selected[item]}
                          handler={displayItem}
                        />
                      );
                    })}
            </div>

            <div className="withdraw__bottom">
              <div className="key-value">
                <div>Value</div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={process.env.PUBLIC_URL + "/images/coins.png"}
                    style={{ padding: "5px" }}
                    alt="coinimg"
                  />
                  {selectedValue.toFixed(2)}
                </div>
              </div>

              {props.name === "Withdraw" ? (
                ""
              ) : (
                <div className="key-value green">
                  <div className="green">Bonus (5%)</div>
                  <div
                    className="green"
                    style={{ display: "flex", alignItems: "center" }}
                  >
                    <span>+{profile.signedIn && profile.username.toLowerCase().contains('rustysaloon.com') ? (bonus ? selectedValue * 0.05 : 0.0).toFixed(2) : '0.00'}</span>

                    <div className="bonus-info">
                    <QuestionMark />
                    <p>If you have <i>rustysaloon.com</i> in your name at the time of the deposit, you will receive an extra 5% bonus on your deposit!</p>
                  </div>
                  </div>


                </div>
              )}

              <div className="key-value key-value--total">
                <div>Total</div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={process.env.PUBLIC_URL + "/images/coins.png"}
                    style={{ padding: "5px" }}
                    alt="coinimg"
                  />
                  {bonus
                    ? (selectedValue * 1.1).toFixed(2)
                    : selectedValue.toFixed(2)}
                </div>
              </div>

              <button
                className="button button--red"
                onClick={() =>
                  props.name === "Withdraw" ? withdrawItems() : depositItems()
                }
              >
                {props.name === "Withdraw" ? "Withdraw" : "Deposit"}
              </button>
            </div>
          </div>
          <div className="inventory">
            <div className="inventory-inner">
              <div className="inventory__filters">
                <input
                  type="text"
                  className="input"
                  placeholder="Search"
                  onChange={(e) => dispatch(searchForItem(e))}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Min Price"
                  onChange={(e) => {
                    dispatch(setMinAmount(e.target.value));
                    dispatch(searchForItem(searched));
                  }}
                />
                <input
                  type="number"
                  className="input"
                  placeholder="Max Price"
                  onChange={(e) => {
                    dispatch(setMaxAmount(e.target.value));
                    dispatch(searchForItem(searched));
                  }}
                />
                <button
                  className="inventory__descending input"
                  onClick={() => {
                    dispatch(toggleDescending());
                  }}
                >
                  {descending ? "High to Low 🡣" : "Low to High 🡡"}
                </button>
              </div>

              <div className="inventory-items">
                {Object.keys(displayIv).length === 0 ? (
                  <p style={{fontWeight: '500'}}>
                    No Items - Make sure you have linked your trade url and that
                    your account is public
                  </p>
                ) : (
                  Object.keys(displayIv)
                    .sort((a, b) => {
                      return descending
                        ? Number(displayIv[b].price) -
                            Number(displayIv[a].price)
                        : Number(displayIv[a].price) -
                            Number(displayIv[b].price);
                    })
                    .map((item) => {
                      return (
                        <SelectedItems
                          id=""
                          info={displayIv[item]}
                          handler={displayItem}
                        />
                      );
                    })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
};

function SelectedItems({ info, id, handler }) {
  const [currentValue, setValue] = useState(1);
  return (
    <button className="inventory-item" id={id}>
      <div
        className={"inventory-item__image-container"}
        onClick={() => {
          handler(info);
        }}
      >
        <img
          src={
            "https://steamcommunity-a.akamaihd.net/economy/image/" + info.image
          }
          alt={info.name + " Image"}
        />
      </div>
      <div
        className={"inventory-item__color-bar"}
        style={{ background: info.color ? info.color : "#0aa847" }}
      ></div>
      <div
        className="inventory-item__name"
        onClick={() => {
          handler(info);
        }}
      >
        {info.market_hash_name}
      </div>
      <div
        className="inventory-item__values"
        onClick={() => {
          handler(info);
        }}
      >
        <div>{id === "wide" ? currentValue : info.amount}x</div>

        <div style={{ display: "flex", alignItems: "flex-start" }}>
          <img
            src={process.env.PUBLIC_URL + "/images/coins.png"}
            style={{ marginTop: "5px",  marginRight: "5px" }}
            alt="coinimg"
          />
          {(currentValue * info.price).toFixed(2)}
        </div>
      </div>

      {id === "wide" && info.amount > 1 ? (
        <div className="inventory-item__slider">
          <div className="flex">
            <Range
              step={1}
              min={1}
              max={info.amount}
              values={[currentValue]}
              onChange={(values) => {
                setValue(values[0]);
                handler(info, values[0]);
              }}
              renderTrack={({ props, children }) => (
                <div
                  {...props}
                  style={{
                    ...props.style,
                    height: "4px",
                    width: "100%",
                    background: `linear-gradient(to right, #cd412a 0%, #cd412a ${
                      ((currentValue - 1) / (info.amount - 1)) * 100
                    }%, #31353d ${
                      ((currentValue - 1) / (info.amount - 1)) * 100
                    }%, #31353d 100%)`,
                  }}
                >
                  {children}
                </div>
              )}
              renderThumb={({ props }) => (
                <div
                  {...props}
                  style={{
                    ...props.style,
                    height: "10px",
                    width: "10px",
                    borderRadius: "3px",
                    backgroundColor: "white",
                  }}
                />
              )}
            />
          </div>
        </div>
      ) : (
        ""
      )}
    </button>
  );
}

export default WithdrawDepositRoute;
