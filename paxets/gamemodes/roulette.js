const CryptoJS = require("crypto-js");
const crypto = require("crypto");

const user = require("../user");
const admin = require("../admin");
const db = require("../db");

const io = require('../io').io();

var rouletteInfo = {
    status: "closed",
    fairRound: "",
    counter: 20 * 10,
    players: {
        red: {},
        green: {},
        black: {},
    }
};
var rouletteHistory = [];

const maxBet = 500;


let getRndInteger = (min, max) => {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}

let fairRound = (from, to) => { // 0-14
    const secret = crypto.randomBytes(11).toString('hex');
    const ticket = getRndInteger(from, to);
    const hashAsString = CryptoJS.SHA256(`${secret}:${ticket}`); // ROLL ID
    const hash = hashAsString.toString(CryptoJS.enc.Hex);

    return {
        type: "roulette",
        hash: hash,
        ticket: ticket,
        secret: secret,
        indicator: getRndInteger(-53, 53)
    };
}

io.sockets.on("connection", (socket) => {
    socket.on("roulettePlaceBet", (data) => {
        let userId = user.getId(socket);
        if (userId) {
            if(true) {//if(user.information(userId, "tos") == 1) {
                if (rouletteInfo.status == "open") {
                    if(data.color == "green" || (data.color == "red" && rouletteInfo.players.black[userId] == undefined) || (data.color == "black" && rouletteInfo.players.red[userId] == undefined)) {
                        if (rouletteInfo.players[data.color]) {
                            if (Number(data.bet) > 0 && (Math.round(Number(data.bet) * 100) / 100) == Number(data.bet)) {
                                if (Math.round(Number(user.information(userId, "balance")) * 100) >= Math.round(data.bet * 100)) {
        
                                    var totalBetAmount = 0;
                                    for(var current in rouletteInfo.players) {
                                        if(rouletteInfo.players[current][userId]) {
                                            totalBetAmount +=rouletteInfo.players[current][userId].bet;
                                        }
                                    }
                                    if(totalBetAmount + Number(data.bet) <= maxBet) {
                                        module.exports.join(data.color, userId, user.information(userId, "username"), user.information(userId, "avatar"), Number(data.bet));
        
                                        socket.emit("roulettePlaceBetRes", {
                                            color: data.color,
                                            bet: Number(data.bet),
                                        });
                                    } else {
                                        socket.emit("message", {
                                            type: "error",
                                            msg: `Max bet is ${maxBet}!`,
                                        });
                                    }
                                } else {
                                    socket.emit("message", {
                                        type: "error",
                                        msg: "insufficient funds!"
                                    });
                                }
                            } else {
                                socket.emit("message", {
                                    type: "error",
                                    msg: "Bad bet value"
                                });
                            }
                        }
                    } else {
                        socket.emit("message", {
                            type: "error",
                            msg: "You cannot bet on both red and black!"
                        });
                    }
                    
                } else {
                    socket.emit("message", {
                        type: "info",
                        msg: "Round is closed!"
                    });
                }
            } else {
                socket.emit("tosPopup");
                socket.emit("message", {
                    type: "error",
                    msg: "Please confirm TOS"
                })
            }
        } else {
            socket.emit("message", {
                type: "error",
                msg: "Please log in!"
            });
        }
    });

    socket.on("rouletteConnected", () => {
        socket.emit("rouletteConnect", {
            counter: rouletteInfo.counter,
            hash: rouletteInfo.fairRound.hash,
            spinnerActive : rouletteInfo.status == "closed" ? rouletteInfo.end - Date.now() : 0,
            fairRound: rouletteInfo.status == "closed" ? rouletteInfo.fairRound : "",
            players: rouletteInfo.players,
            history: rouletteHistory,
            balance: (Math.floor(user.information(user.getId(socket), "balance") * 100) / 100)
        });
    })
});


module.exports = {
    start: () => {
        if(admin.getStatus("roulette") == 1) {
            rouletteInfo = {
                status: "open",
                fairRound: fairRound(0, 14),
                counter: 20,
                players: {
                    red: {},
                    green: {},
                    black: {},
                }
            };

            io.emit("rouletteTimer", {
                hash: rouletteInfo.fairRound.hash,
                counter: rouletteInfo.counter,
                spinning: false
            })
            var timer = setInterval( () => {
                rouletteInfo.counter--;

                if(rouletteInfo.counter % 5 == 0) {
                    io.emit("rouletteTimer", {
                        hash: rouletteInfo.fairRound.hash,
                        counter: rouletteInfo.counter,
                        spinning: false,
                    });
                }

                if(rouletteInfo.counter <= 0) {
                    rouletteInfo.status = "closed";
                    rouletteInfo.end = Date.now() + 8000;
                    clearInterval(timer);
                    rouletteInfo.counter = 8;
    
                    io.emit("rouletteTimer", {
                        hash: rouletteInfo.fairRound.hash,
                        counter: rouletteInfo.counter,
                        spinning: true,
                    })
    
                    io.emit("rouletteSpin", rouletteInfo.fairRound);
    
                    var timer2 = setInterval( () => {
                        rouletteInfo.counter--;
                        if(rouletteInfo.counter <= 0) {
                            clearInterval(timer2);
                            
    
                            if (rouletteHistory.length >= 100) {
                                rouletteHistory.pop();
                            }
                            rouletteInfo.type = "roulette";
                            rouletteHistory.unshift(rouletteInfo);
                            module.exports.giveRewards();
                        }
                        io.emit("rouletteTimer", {
                            hash: rouletteInfo.fairRound.hash,
                            counter: rouletteInfo.counter,
                            spinning: true,
                        })
                    }, 1000)
                }
            }, 1000);
        } else {
            setTimeout(() => {
                module.exports.start();
            }, 10 * 1000);
        }
    },
    join: async (color, id, username, avatar, bet) => {
        if(rouletteInfo.players[color][id]) {
            rouletteInfo.players[color][id].bet += Number(bet);
            rouletteInfo.players[color][id].bet = Math.floor(rouletteInfo.players[color][id].bet * 100) / 100;
        } else {
            rouletteInfo.players[color][id] = {
                bet: Number(bet),
                username: username, 
                avatar: avatar
            };
        }
        
        user.update(id, "balance", Number(-bet), 3);

        io.emit("roulettePlayers", rouletteInfo.players);
    },
    giveRewards: async () => {
        const winningColor = rouletteInfo.fairRound.ticket == 0 ? "green" : rouletteInfo.fairRound.ticket <= 7 ? "red" : "black";
        
        for(var color in rouletteInfo.players) {
            for(var player in rouletteInfo.players[color]) {
                var currentPlayer = rouletteInfo.players[color][player];
                if(color == winningColor) {
                    let getBalance = (Math.floor(Number(currentPlayer.bet) * (winningColor == "green" ? 14 : 2) * 100) / 100);
                    
                   
                    rouletteInfo.players[winningColor][player].winnings = getBalance;
                    user.update(player, "balance", Number(getBalance), 3);
                    user.update(player, "withdrawableBalance", Math.floor((getBalance - Number(currentPlayer.bet)) * 100 * 1.5), 3);
                    

                    db.Query(`INSERT INTO gamehistory (mode, userId, betvalue, winnings, altInfo) VALUES ("roulette", "${player}", "${Number(currentPlayer.bet) * 100}", "${getBalance * 100}", "${color}")`);
                } else {

                    const currentBalance = Math.floor(user.information(player, "balance") * 100);
                    if(!currentBalance) {
                        await db.Query(`SELECT * FROM users WHERE id="${player}"`).then((row) => {
                            if(row[0]) {
                                if((Number(row[0].balance) * 100) < Number(row[0].withdrawableBalance)) {
                                    user.update(player, "withdrawableBalance", (Number(row[0].balance) * 100), 2);
                                }
                            }
                        });
                    } else {
                        if(currentBalance < user.information(player, "withdrawableBalance")) {
                            user.update(player, "withdrawableBalance", currentBalance, 2);
                        }
                    }

                    db.Query(`INSERT INTO gamehistory (mode, userId, betvalue, winnings, altInfo) VALUES ("roulette", "${player}", "${Number(currentPlayer.bet) * 100}", "${Number(currentPlayer.bet) * -100}", "${color}")`);
                }
                
            }
        }

        

        io.emit("roulettePlayers", rouletteInfo.players);
        io.emit("rouletteDone");
        setTimeout(() => {
            io.emit("rouletteReset", {
                history: rouletteHistory,
                info: rouletteInfo.fairRound
            }); 
            module.exports.start();
        }, 2000)
    },
    getHistory: () => {
        return rouletteHistory;
    },
    getCurrentHash: () => {
        return rouletteInfo.fairRound.hash
    }
};