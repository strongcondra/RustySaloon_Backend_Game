const CryptoJS = require("crypto-js");
const crypto = require("crypto");

const user = require('../user.js');
const io = require('../io').io();
const db = require('../db.js');

const admin = require('../admin');

let getRndInteger = (min, max) => {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}

let fairRound = () => {
    const secret = crypto.randomBytes(11).toString('hex');
    const ticket = getRndInteger(0, 9999);
    const hashAsString = CryptoJS.SHA256(`${secret}:${ticket}`); // ROLL ID
    const hash = hashAsString.toString(CryptoJS.enc.Hex);

    return {
        type: "dice",
        hash: hash,
        ticket: ticket,
        secret: secret,
    };
}
const houseEdge = 0.95;
let diceHistory = [];

io.sockets.on("connection", function (socket) {
    socket.on("diceStart", async (data) => {
        startDice(socket, data);
    });

    socket.on("diceConnect", () => {
        socket.emit("diceHistory", diceHistory);
        
        const userId = user.getId(socket);
        if(userId) socket.emit("diceConnect", {balance: (Math.floor(user.information(userId, "balance") * 100) / 100)});
    })
});

let startDice = async (socket, data) => {
    const userId = user.getId(socket);
    if(userId) {
        if(admin.getStatus("dice") == 1) {
            if(true) {//(user.information(userId, "tos") == 1) {
                if((user.information(userId, "dice") + 100) < Date.now()) {
                    if (Number(data.betValue) >= 0.1) {
                        if((Math.round(Number(data.betValue) * 100) / 100) == Number(data.betValue)) {
                            if(Number(data.betValue) <= 500) {
                                if(Number(data.number) > 0 && Number(data.number) < 10000) {
                                    if(Math.round(user.information(userId, "balance") * 100) >= Math.round(Number(data.betValue) * 100)) {
                                        if(data.type == "under" || data.type == "over") {
                                            let localRound = fairRound();
                                            let updateBalance = Math.floor(Number(data.betValue) * 100) / 100;
                                            user.update(userId, "balance", (-1 * updateBalance), 3);
                                            user.update(userId, "dice", Date.now(), 0);
            
                    
            
                                            let winning = ((data.type == "under" && Number(data.number)) > localRound.ticket) || (data.type == "over" && (Number(data.number)) < localRound.ticket);
                
                                            const multiplier = calcMultiplier(data.type, (Number(data.number)));
                                            // if(multiplier > 1.5) {
                                            //     if(user.information(userId, "wager") >= updateBalance) {
                                            //         user.update(userId, "wager", (-1 * updateBalance), 3);
                                            //     } else {
                                            //         user.update(userId, "wager", 0, 2);
                                            //     }
                                            //     user.update(userId, "xp", (updateBalance), 3);
                                            // }
                                            let winningAmount = winning ? (Math.floor((multiplier) * Number(data.betValue) * 100) / 100) : -data.betValue;
                                            user.sendToUser(userId, "diceResponse", {
                                                fairRound: localRound,
                                                won: winning
                                            });
                
                                            if(winning) {
                                                if(user.information(userId, "muted") == 0) {
                                                    user.sendToUser(userId, "diceSound", {
                                                        type: "winning",
                                                    });
                                                }
                                                // user.sendMsg(userId, {
                                                //     type: "success",
                                                //     msg: `You won ${Number(winningAmount).toFixed(2)}!`,
                                                // });
                                                user.update(userId, "withdrawableBalance", Math.floor((winningAmount - updateBalance) * 100 * 1.5), 3);
                                                user.update(userId, "balance", Number(winningAmount), 3);
                                                db.Query(`INSERT INTO gamehistory (mode, userId, betvalue, winnings, altInfo) VALUES ("dice", "${userId}", "${updateBalance * 100}", "${winningAmount * 100}", "${data.type}-${data.number}")`);
                                            } else {
                                                if(user.information(userId, "muted") == 0) {
                                                    user.sendToUser(userId, "diceSound", {
                                                        type: "loose",
                                                    });
                                                }

                                                const currentBalance = Math.floor(user.information(userId, "balance") * 100);
                                                if(!currentBalance) {
                                                    await db.Query(`SELECT * FROM users WHERE id="${userId}"`).then((row) => {
                                                        if(row[0]) {
                                                            if((Number(row[0].balance) * 100) < Number(row[0].withdrawableBalance)) {
                                                                user.update(userId, "withdrawableBalance", (Number(row[0].balance) * 100), 2);
                                                            }
                                                        }
                                                    });
                                                } else {
                                                    if(currentBalance < user.information(userId, "withdrawableBalance")) {
                                                        user.update(userId, "withdrawableBalance", currentBalance, 2);
                                                    }
                                                }

                                                db.Query(`INSERT INTO gamehistory (mode, userId, betvalue, winnings, altInfo) VALUES ("dice", "${userId}", "${updateBalance * 100}", "${updateBalance * -100}", "${data.type}-${data.number}")`);
                                            }
                                            
                
                                            const currentHistory = {
                                                username: user.information(userId, "username"),
                                                avatar: user.information(userId, "avatar"),
                                                winnings: winningAmount,
                                                multiplier: winning ? calcMultiplier(data.type, (Number(data.number))) : 0,
                                                betValue: Number(data.betValue),
                                                type: "dice",
                                                fairRound: localRound,
                                                betType : data.type,
                                                timestamp: Date.now()
                                            }
                                            
                                            diceHistory.unshift(currentHistory);
                                            if(diceHistory.length > 20) {
                                                diceHistory.pop();
                                            }
                                            io.emit("diceHistory", diceHistory);
                                        }
                                    } else {
                                        user.sendMsg(userId, {
                                            type: "error",
                                            msg: "Insufficent funds!"
                                        })
                                    }
                                } else {
                                    user.sendMsg(userId, {
                                        type: "error",
                                        msg: "Invalid Number!"
                                    })
                                }
                            } else {
                                user.sendMsg(userId, {
                                    type: "error",
                                    msg: "Maxbet is 500!"
                                })
                            }
                        }else {
                            user.sendMsg(userId, {
                                type: "error",
                                msg: "No bets with more that 2 decimals"
                            })
                        }
                        
                    } else {
                        user.sendMsg(userId, {
                            type: "error",
                            msg: "Minbet is 0.10!"
                        })
                    }
                } else {
                    user.sendMsg(userId, {
                        type: "error",
                        msg: "Don't spam!"
                    })
                }
            } else {
                user.sendToUser(userId, "tosPopup", "");
                user.sendMsg(userId, {
                    type: "error",
                    msg: "Please confirm TOS"
                })
            }
        } else {
            user.sendMsg(userId, {
                type: "info",
                msg: `Dice is turned off!`,
            });
        }

        
        
    } else {
        user.sendMsg(userId, {
            type: "error",
            msg: "Not logged in!"
        }, socket.id);
    }
}

let calcMultiplier = (type, number) => {
    return Number(((10000 / ((type == "over" ? 10000 - number : number))) * houseEdge).toFixed(2));
}


module.exports = {
    getHistory: () => {
        return diceHistory;
    }
}