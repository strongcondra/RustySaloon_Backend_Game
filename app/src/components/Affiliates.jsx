import React, { createRef } from "react";
import { socket } from "../Socket";
import FakeCaptcha from "./Captcha";

class Affiliates extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      captchaActive: false,
      code: "None",
      balance: 0,
      wager: 0,
      earnings: 0,
      info: [],
      users: 0,
    };

    this.code = createRef();
  }

  componentDidMount() {
    document.title = "RustySaloon | Affiliate";

    socket.emit("referralConnect");

    socket.on("referralConnectResponse", (data) => {
      console.log("referralRes", data);
      this.setState({
        balance: data.balance,
        code: data.code,
        wager: data.wager,
        earnings: data.earnings,
        info: data.info,
        users: data.users,
      });
    });

    socket.on("claimRewardResponse", () => {
      this.setState({ balance: 0 });
    });
  }

  componentWillUnmount() {
    socket.off("referralConnectResponse");
    //
  }

  render() {
    return (
      <div className="affiliates">
        <div className="affiliates__header">
          <div className="affiliates__header-item">
            <div className="affiliates__header-item-label">Code</div>
            <div className="affiliates__header-item-value">
              {this.state.code}
            </div>
          </div>

          <div className="affiliates__header-item">
            <div className="affiliates__header-item-label">Total Referrals</div>
            <div className="affiliates__header-item-value">
              {this.state.info.length}
            </div>
          </div>

          <div className="affiliates__header-item">
            <div className="affiliates__header-item-label">
              Generated Comission
            </div>
            <div className="affiliates__header-item-value">
              {(Number(this.state.earnings) / 100).toFixed(2)} (5%)
            </div>
          </div>

          <div
            className={
              this.state.code === "None"
                ? "hidden"
                : "affiliates__header-item right"
            }
          >
            <div className="affiliates__header-item-label">
              Available Comission
            </div>
            <div className="affiliates__header-item-value">
              {(Number(this.state.balance) / 100).toFixed(2)}
            </div>
          </div>

          <button
            className={
              this.state.code === "None" ? "hidden" : "button button--green"
            }
            onClick={() => {
              socket.emit("referralClaimReward");
            }}
          >
            Claim
          </button>

          <div
            className={
              this.state.code === "None"
                ? "affiliates__header-item right"
                : "hidden"
            }
          >
            <div className={this.state.code === "None" ? "" : "hidden"}>
              <article
                className={this.state.captchaActive ? "flexCol" : "hidden"}
              >
                <FakeCaptcha
                  submit={(captcha) => {
                    socket.emit("createReferralCode", {
                      captcha: captcha,
                      code: this.code.current.value,
                    });
                    this.setState({ captchaActive: false });
                  }}
                  key="6LefWTAaAAAAAIeeXuXO0VJ0RjioqSGXbNBvaJc_"
                />
              </article>
            </div>

            <div>
              <p
                style={{
                  color: "lightgrey",
                  marginLeft: "55px",
                  display: "flex",
                }}
              >
                Set your Code
              </p>

              <div
                className={this.state.code !== "None" ? "hidden" : "right-input"}
                style={{ display: "flex", height: "30px" }}
              >
                <input class="input" ref={this.code} />
                <div
                  className="button button--green"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginLeft: "5px",
                  }}
                  onClick={() => {
                    this.setState({ captchaActive: true });
                  }}
                >
                  <b>SAVE</b>
                </div>
              </div>
            </div>
          </div>
        </div>

        <table className="table">
          <thead>
            <tr>
              <th>Username</th>
              <th>Date/Time</th>
              <th>Total Deposited</th>
              <th>Payout</th>
            </tr>
          </thead>
          <tbody>
            <tr></tr>
            {this.state.info.map((user) => {
              const date = new Date(user.timestamp);
              return (
                <React.Fragment>
                  <td>{user.username}</td>
                  <td>
                    {date.getDate()}/{date.getMonth()}/{date.getFullYear()}{" "}
                    {date.getHours()}:{date.getMinutes()}
                  </td>
                  <td>{((user.earning * 20) / 100).toFixed(2)}0</td>
                  <td className="green">{(user.earning / 100).toFixed(2)}</td>
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  }
}
export default Affiliates;
