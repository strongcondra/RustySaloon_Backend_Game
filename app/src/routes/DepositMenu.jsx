import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import Chat from "../components/Chat";
import MobileHeader from "../components/desktop/Header";
import DesktopHeader from "../components/mobile/Header";
import MobileNav from "../components/mobile/Nav";
import { socket } from "../Socket";

const Deposit_Menu = () => {
  var [ cryptoSel, setCryptoSel ] = useState("");
  var [ wallets, setWallets ] = useState({});
  var [ deposits5, setDeposits5 ] = useState([]);
  var [ giftcardText, setGiftCardText ] = useState("");
  var [ linkName, setLinkName ] = useState("");

  useEffect(() => {
    socket.emit("balance");

    // Request Wallet Addresses
    socket.emit("userWallet");

    // Get Wallet Addresses
    socket.on("userWallets", (wallets) => setWallets(wallets));

    // On last 5 deposits
    socket.on("userDeposits", (deposits) => {
        setDeposits5(deposits);
    });

    document.title = "RustySaloon | Deposit Menu";
  }, []);

  const SkinMethods = {
    Rust: {
        name: "Rust Skins",
        extra: 5,
        logo: "rust_logo.png"
    }
  };

  const CryptoMethods = {
    BTC: {
        name: "Bitcoin",
        extra: 5,
        logo: "btc_logo.svg"
    },
    ETH: {
        name: "Ethereum",
        extra: 5,
        logo: "eth_logo.svg"
    },
    LTC: {
        name: "Litecoin",
        extra: 5,
        logo: "ltc_logo.svg"
    },
    DOGE: {
        name: "Dogecoin",
        extra: 5,
        logo: "doge_logo.svg"
    },
    XRP: {
        name: "Ripple",
        extra: 5,
        logo: "xrp_logo.svg"
    },
  };

  const GCMethods = {
    VISA: {
        name: "Visa",
        logo: "visa_logo.svg",
        extra: 5
    },
    PP: {
        name: "PayPal",
        logo: "pp_logo.svg",
        extra: 5
    },
    MASTER: {
        name: "MasterCard",
        logo: "master_logo.svg",
        extra: 5
    },
    GPAY: {
        name: "Google Play",
        logo: "gpay_logo.svg",
        extra: 5
    },
    PCARD: {
        name: "Paysafecard",
        logo: "pcard_logo.svg",
        extra: 5
    },
    TLY: {
        name: "Trustly",
        logo: "tly_logo.svg",
        extra: 5
    }
  };

  const GCPrices = {
    5: {
        logo: "/images/codes/Giftcard5.png",
        link: "#5USD_Kinguin_Link_Here"
    },
    10: {
        logo: "/images/codes/Giftcard10.png",
        link: "#10USD_Kinguin_Link_Here"
    },
    15: {
        logo: "/images/codes/Giftcard15.png",
        link: "#15USD_Kinguin_Link_Here"
    },
    25: {
        logo: "/images/codes/Giftcard25.png",
        link: "#25USD_Kinguin_Link_Here"
    },
    50: {
        logo: "/images/codes/Giftcard50.png",
        link: "#50USD_Kinguin_Link_Here"
    },
    100: {
        logo: "/images/codes/Giftcard100.png",
        link: "#100USD_Kinguin_Link_Here"
    },
    250: {
        logo: "/images/codes/Giftcard250.png",
        link: "#250USD_Kinguin_Link_Here"
    },
    500: {
        logo: "/images/codes/Giftcard500.png",
        link: "#500USD_Kinguin_Link_Here"
    }
  };

  function changeMethod(type, short, name) {
    if(name == linkName) return setLinkName("");
    if(short == cryptoSel) return setCryptoSel("");
    if(type == "skins") return window.location.href = '/deposit';
    if(type == "crypto") setCryptoSel(short);
    if(type == "giftcards") setLinkName(name);
  }

    function CryptoDetails() {
        return (
            <div className="cdetails">
                <div className="text">{cryptoSel} DEPOSIT</div>
                <div className="cbox">
                    <img src={"https://chart.googleapis.com/chart?cht=qr&chl="+wallets[cryptoSel]+"&chs=250x250"} alt="QR Deposit Image" />
                    <div className="texts">
                        <div>
                            Send the amount of crypto your choice to the following
                            address to receive that amount in coins.
                        </div>
                        <div>
                            Minimum 1 confirmation to get credited. The minimum Deposit is $10. All deposits
                            less won't be credited.
                        </div>
                        <div className="grey">
                            Permanent Deposit Address
                        </div>
                        <div className="inputted">
                            <input disabled type="text" value={wallets[cryptoSel]} />
                            <img src="/images/copy_btn.svg" alt="Copy Button" onClick={() => {navigator.clipboard.writeText(wallets[cryptoSel])}} />
                        </div>
                    </div>
                    <div className="left">
                        <div className="text">
                            LAST 5 DEPOSITS
                        </div>
                        <div className="data">
                            <div className="pheader">
                                <div>
                                    Date/Time
                                </div>
                                <div>
                                    Amount
                                </div>
                                <div>
                                    Status
                                </div>
                            </div>
                            {
                                deposits5.length > 0 ? 
                                    deposits5.map(i => {
                                        return <Last5Deposits props={i} />
                                    })
                                : null
                            }
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    function Last5Deposits({ props }) {
        return (
            <div className="hdeposit">
                <div>{props.time}</div>
                <div>${props.amount}</div>
                <div>{props.status ? "Credited" : "Pending"}</div>
            </div>
        );
    }

    function Box({ short, name, logo, extra, type }) {
        return (
            <div className="box" data-type={short} onClick={ () => {
                    changeMethod(type, short, name);
                    socket.emit("userDepositLastDeposits", short);
                    setDeposits5([]);
                }}>
                <img src={"/images/" + logo} alt={short + " Logo"} />
                <div className="line"></div>
                <div className="bottom">
                    <div>{name}</div>
                    <div>
                        {
                            extra > 0 ? <div>+{extra}%</div> : null
                        }
                    </div>
                </div>
            </div>
        )
    }

    function GCard({price, link, image}) {
        return (
            <div className="card" onClick={() => {
                window.open(link);
            }}>
                <img src={image} alt={price + "USD Gift Card"} />
                <div>Click here to purchase ${price} USD Gift Card</div>
            </div>
        );
    }

    function GCChoose() {
        return (
            <div>
                <div className="gctext">{linkName} Gift Card</div>
                <div className="gcChoose">
                    {
                        Object.keys(GCPrices).map((key, y) => {
                            let i = GCPrices[key];
                            return <GCard price={key} link={i.link} image={i.logo} />
                        })
                    }
                </div>
            </div>
        );
    }

    function updateGCText(e) {
        setGiftCardText(e.target.value);
    }

  return (
    <React.Fragment>
      {/* <DesktopHeader />
      <MobileHeader />
      <Chat />
      <MobileNav /> */}

      <div className="page-content">
        <div className="deposit">
            <h2>DEPOSIT METHODS</h2>
            <h4 className="grey">Skin Deposits</h4>
            <div className="boxes">
                { Object.keys(SkinMethods).map((key, x) => {
                    let i = SkinMethods[key];
                    return <Box short={key} name={i.name} logo={i.logo} extra={i.extra} type="skins" />
                }) }
            </div>
            <div class="space"></div>
            <h4 className="grey">Crypto Deposits</h4>
            <div className="boxes">
                { Object.keys(CryptoMethods).map((key, x) => {
                    let i = CryptoMethods[key];
                    return <Box short={key} name={i.name} logo={i.logo} extra={i.extra} type="crypto" />
                }) }
            </div>
            {
                cryptoSel != "" ? <CryptoDetails /> : null
            }
            <h4 className="grey">Giftcard Deposits</h4>
            <div className="gcInput">
                <div className="gcText">Redeem Giftcard</div>
                <div className="gcRedeem">
                    <div className="txt" onClick={() => {
                        socket.emit("userGiftCard", giftcardText);
                    }}>
                        Claim
                    </div>
                </div>
                <input className="gcinput" type="text" placeholder="adbb916f-f180-4b7c-ab07-04181c58eacd" onChange={updateGCText} />
            </div>
            <div className="boxes">
                { Object.keys(GCMethods).map((key, x) => {
                    let i = GCMethods[key];
                    return <Box short={key} name={i.name} logo={i.logo} extra={i.extra} type="giftcards" />
                }) }
            </div>
            {
                linkName != "" ? <GCChoose /> : null
            }
        </div>
      </div>
    </React.Fragment>
  );
};

export default Deposit_Menu;
