// CRYPTO
const CryptoJS = require("crypto-js");
const crypto = require("crypto");

const user = require("../user");
const db = require("../db");
const admin = require("../admin");

const io = require('../io').io();

let game = {
    players: {
        red: {},
        black: {},
        green: {},
        yellow: {},
    },
    status: "closed",
    counter: 200,
    fairRound: "",
};
let colorReward = {
    red: 2,
    black: 3,
    green: 5,
    yellow: 50,
}
let history = [];
const minBet = 1;
const maxBet = 500;

const wheelColors = ["yellow", "green", "red", "black", "red", "black", "red", "black", "red", "green", "red", "green", "red", "black", "red", "black", "red", "black", "red", "green", "red", "green", "red", "black", "red", "black", "red", "black", "red", "black", "red", "black", "red", "green", "red", "green", "red", "black", "red", "black", "red", "black", "red", "green", "red", "green", "red", "black", "red", "black", "red", "black", "red", "green"];


// 26 
// 17
// 10
// 1

// 10 / 54

// röd -20
// black -5
// green 

// 1 --> 2
// 0.5 --> 1.5

// Så 26 / 54 att gå + 1/3 av bet

// Och 17 / 54 att gå +- 0

// Lämnar 11 / 54 till - 100%

// 54 in total

let getRndInteger = (min, max) => {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}

let fairRound = () => { // 0-14
    const secret = crypto.randomBytes(11).toString('hex');
    const ticket = getRndInteger(1, 54);
    const hashAsString = CryptoJS.SHA256(`${secret}:${ticket}`); // ROLL ID
    const hash = hashAsString.toString(CryptoJS.enc.Hex);

    return {
        type: "teamup",
        hash: hash,
        ticket: ticket,
        secret: secret,
    };
}

let getWinningColor = (ticket) => {
    return wheelColors[ticket - 1];
}

io.sockets.on("connection", function (socket) {
    socket.on("WOFPlacebet", (data) => {
        module.exports.placebet(data, socket);
    });
    socket.on("WOFConnect", () => {
        socket.emit("WOFConnect", {
            counter: game.counter,
            hash: game.fairRound.hash,
            players: game.players,
            balance: (Math.floor(user.information(user.getId(socket), "balance") * 100) / 100),
            history: history,
            end: game.end,
            fairRound: game.end ? game.fairRound : "",
            color: game.end ? getWinningColor(game.fairRound.ticket) : false,
            userId: user.getId(socket),
        });
    })
});
module.exports = {
    start: () => {
        if (admin.getStatus("wof") == 1) {
            game = {
                players: {
                    red: {},
                    black: {},
                    green: {},
                    yellow: {},
                },
                status: "open",
                counter: 20,
                fairRound: fairRound(),
            }
            io.emit("WOFPlayers", game.players);
            io.emit("WOFCounter", {
                counter: game.counter,
                hash: game.fairRound.hash,
                history: history,
            });
            let counterInterval = setInterval(() => {
                game.counter -= 1;
                if(game.counter % 5 == 0) {
                    io.emit("WOFCounter", {
                        counter: game.counter,
                        hash: game.fairRound.hash
                    });
                }
                if (game.counter <= 0) {
                    clearInterval(counterInterval);
                    module.exports.spin();
                }
            }, 1000);
        } else {
            setTimeout(() => {
                module.exports.start();
            }, 10 * 1000);
        }

    },
    spin: () => {
        game.status = "closed";
        game.end = Date.now() + 5000;
        io.emit("WOFSpin", {
            fairRound: game.fairRound,
            color: getWinningColor(game.fairRound.ticket)
        });
        setTimeout(() => {
            module.exports.giveRewards();
        }, 5000);
    },
    giveRewards: async () => {
        var winningColor = getWinningColor(game.fairRound.ticket);

        

        for(var color in game.players) {
            for (var player in game.players[color]) {
                if(color == winningColor) {
                    let winningAmount = Math.floor(game.players[winningColor][player].bet * colorReward[winningColor] * 100) / 100;
                    user.update(game.players[winningColor][player].id, "balance", Number(winningAmount), 3);

                    user.update(game.players[winningColor][player].id, "withdrawableBalance", Math.floor((winningAmount - Number(game.players[winningColor][player].bet)) * 100 * 1.5), 3);
                    
                    db.Query(`INSERT INTO gamehistory (mode, userId, betvalue, winnings, altInfo) VALUES ("50x", "${player}", "${game.players[winningColor][player].bet * 100}", "${winningAmount * 100}", "${color}")`);

                    // user.sendMsg(game.players[winningColor][player].id, {
                    //     type: "success",
                    //     msg: `You won ${winningAmount.toFixed(2)}!`
                    // });
                } else {

                    const currentBalance = Math.floor(user.information(game.players[color][player].id, "balance") * 100);
                    if(!currentBalance) {
                        await db.Query(`SELECT * FROM users WHERE id="${game.players[color][player].id}"`).then((row) => {
                            if(row[0]) {
                                if((Number(row[0].balance) * 100) < Number(row[0].withdrawableBalance)) {
                                    user.update(game.players[color][player].id, "withdrawableBalance", (Number(row[0].balance) * 100), 2);
                                }
                            }
                        });
                    } else {
                        if(currentBalance < user.information(game.players[color][player].id, "withdrawableBalance")) {
                            user.update(game.players[color][player].id, "withdrawableBalance", currentBalance, 2);
                        }
                    }

                    db.Query(`INSERT INTO gamehistory (mode, userId, betvalue, winnings, altInfo) VALUES ("50x", "${player}", "${game.players[color][player].bet * 100}", "${game.players[color][player].bet * -100}", "${color}")`);
                }
                
            }
        }
        
        game.fairRound.color = winningColor;
        if (history.length >= 100) {
            history.pop();
        }
        game.type = "50x";
        history.unshift(game);
        io.emit("WOFHistory", history, game.fairRound);

        setTimeout(() => {
            module.exports.start();
        }, 2000)
    },
    placebet: (data, socket) => { // DATA (bet & color) och SOCKET
        if (game.status != "closed") {
            let userId = user.getId(socket);
            if (userId) {
                if (true) {//if (user.information(userId, "tos") == 1) {
                    if (data.color && game.players[data.color] != undefined) {
                        if (Number(data.bet) >= 0.01) {
                            if(Number(data.bet) == (Math.round(Number(data.bet) * 100) / 100)) {
                                let combined = (game.players.red[userId] ? game.players.red[userId].bet : 0) + (game.players.black[userId] ? game.players.black[userId].bet : 0) + (game.players.green[userId] ? game.players.green[userId].bet : 0) + (game.players.yellow[userId] ? game.players.yellow[userId].bet : 0)
                                if ((combined + Number(data.bet)) <= maxBet) {
                                    if (Math.round(user.information(userId, "balance") * 100) >= Math.round(data.bet * 100)) {
                                        user.update(userId, "balance", Number(-data.bet), 3);
    
                                        // let times = 0;
                                        // for(var color in game.players) {
                                        //     if(game.players[color][userId]) times++;
                                        // }
                                        // if(times == 0 || (times == 1 && game.players[data.color][userId])) {
                                        //     user.update(userId, "withdrawableBalance", Math.floor((data.bet) * 100), 3);
                                        // }
    
                                        if (game.players[data.color][userId]) {
                                            game.players[data.color][userId].bet += Number(data.bet);
                                        } else {
                                            game.players[data.color][userId] = {
                                                id: userId,
                                                username: user.information(userId, "username"),
                                                avatar: user.information(userId, "avatar"),
                                                bet: Number(data.bet)
                                            };
                                        }
                                        io.emit("WOFPlayers", game.players);
                                    } else {
                                        user.sendMsg(userId, {
                                            type: "error",
                                            msg: "insufficient funds!"
                                        });
                                    }
                                } else {
                                    user.sendMsg(userId, {
                                        type: "error",
                                        msg: `Maxbet is ${maxBet}!`
                                    });
                                }
                            } else {
                                user.sendMsg(userId, {
                                    type: "error",
                                    msg: `Bad betvalue!`
                                });
                            }
                        } else {
                            user.sendMsg(userId, {
                                type: "error",
                                msg: "Your bet must be equal to or over 0.01!"
                            });
                        }
                    } else {
                        user.sendMsg(userId, {
                            type: "error",
                            msg: "Color is not correct!"
                        });
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
                    type: "error",
                    msg: "Please login!"
                }, socket.id);
            }
        }
    },
    getHistory: () => {
        return history;
    },
    getCurrentHash: () => {
        return game.fairRound.hash
    }
}



