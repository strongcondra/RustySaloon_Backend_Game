// CRYPTO
const CryptoJS = require("crypto-js");
const crypto = require("crypto");

const user = require('../user.js');
const io = require('../io').io();
const db = require('../db.js');

const admin = require('../admin');

var crashInfo = {
    fairRound: "",
    players: {},
    counter: 10,
    status: "closed",
};

let calcTicket = () => {
    var currentNumber = (100* Math.pow((104*Math.random()), -1));
    return Number((Math.floor(currentNumber) % 120 == 0 ? 1 : (currentNumber)).toFixed(4));
}

function fairRound() { // 0-14
    const secret = crypto.randomBytes(11).toString('hex');
    const ticket = calcTicket();
    const hashAsString = CryptoJS.SHA256(`${secret}:${ticket}`); // ROLL ID
    const hash = hashAsString.toString(CryptoJS.enc.Hex);

    return {
        type: "crash",
        hash: hash,
        ticket: ticket,
        secret: secret,
    };
}

let calcY = (ms) => {
    // return (Math.E ** (0.065 * x)).toFixed(2);
    var r = 0.00006;
    return Math.floor(100 * Math.pow(Math.E, r * ms)) / 100;
}
let inverseGrowth = (result) => {
    var c = 16666.666667;
    return c * Math.log(0.01 * result * 100);
}


let checkForCashout = (y) => {
    for(var player in crashInfo.players) {
        if(crashInfo.players[player].cashedOut == false) {
            if(crashInfo.players[player].autocashout != "None" && crashInfo.players[player].autocashout <= y) {
                crashInfo.players[player].cashedOut = crashInfo.players[player].autocashout;


                const winnings = (Math.floor((crashInfo.players[player].autocashout * crashInfo.players[player].betValue) * 100) / 100);
                user.sendToUser(player, "cashoutResponse", {
                    status: "success"
                });

                user.update(player, "balance", winnings, 3);

                user.update(player, "withdrawableBalance", Math.floor((winnings - crashInfo.players[player].betValue) * 100), 3);

                db.Query(`INSERT INTO gamehistory (mode, userId, betvalue, winnings, altInfo) VALUES ("crash", "${player}", "${crashInfo.players[player].betValue * 100}", "${winnings * 100}", "${crashInfo.players[player].cashedOut}x")`)



                // if(crashInfo.players[player].autocashout > 1.7) {
                //     if(user.information(userId, "wager") >=crashInfo.players[player].betValue) {
                //         user.update(userId, "wager", (-1 * crashInfo.players[player].betValue), 3);
                //     } else {
                //         user.update(userId, "wager", 0, 2);
                //     }
                //     user.update(userId, "xp", crashInfo.players[player].betValue, 3);
                // }

                io.emit("crashPlayers", crashInfo.players);
                user.sendMsg(player, {
                    type: "success",
                    msg: `You won ${winnings.toFixed(2)} coins`
                })
            }
        }
    }
}

const minBet = 0.01;
const maxBet = 500;
const minCashout = 1.01;
let crashHistory = [];

let getRndInteger = (min, max) => {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}


io.sockets.on("connection", (socket) => {
    socket.on("crashConnected", () => {
        if (crashInfo.status && crashInfo.status != "off") {
            const userId = user.getId(socket);
            socket.emit("crashConnect", {
                hash: crashInfo.fairRound.hash,
                history: crashHistory,
                bets: crashInfo.players,
                balance: userId ? (Math.floor(user.information(userId, "balance") * 100) / 100) : 0
            });

            if(crashInfo.startTime) {
                var elapsed = Date.now() - crashInfo.startTime;
                if((crashInfo.gameDuration - elapsed) > 0) {
                    var y = calcY(elapsed);
                    socket.emit("crashGraph", {x: (elapsed / 1000), y: y});
                }
            } else {
                socket.emit("crashCounter", {
                    hash: crashInfo.fairRound.hash,
                    counter: crashInfo.counter
                });
            }

            
            if(userId) {
                for (var player in crashInfo.players) {
                    if (player == userId) {
                        if(!crashInfo.players[player].cashedOut) {
                            socket.emit("crashPlayer", {
                                betValue: crashInfo.players[player].betValue,
                                autocashout: crashInfo.players[player].autocashout,
                            });
                        }
                        break;
                    }
                }
            }
        }
    });

    socket.on("crashPlaceBet", (data) => {
        module.exports.join(socket, data);
    });

    socket.on("crashCashout", () => {
        const userId = user.getId(socket);
        if(userId) {
            if(crashInfo.status == "closed") {
                if(crashInfo.status != "crashed") {
                    if(crashInfo.players[userId]) {
                        if(!crashInfo.players[userId].cashedOut) {

                            var elapsed = Date.now() - crashInfo.startTime;
                            var y = calcY(elapsed);
                            crashInfo.players[userId].cashedOut = y;


                            const winnings = (Math.floor((crashInfo.players[userId].cashedOut * crashInfo.players[userId].betValue) * 100) / 100);
        
                            user.update(userId, "balance", winnings, 3);

                            user.update(userId, "withdrawableBalance", Math.floor((winnings - crashInfo.players[userId].betValue) * 100), 3);
        
                            io.emit("crashPlayers", crashInfo.players);
                            user.sendMsg(userId, {
                                type: "success",
                                msg: `You won ${(winnings).toFixed(2)} coins`
                            })
    
                            if(user.information(userId, "muted") == 0) {
                                socket.emit("sound", {
                                    type: "win"
                                });
                            }
    
                            db.Query(`INSERT INTO gamehistory (mode, userId, betvalue, winnings, altInfo) VALUES ("crash", "${userId}", "${crashInfo.players[userId].betValue * 100}", "${winnings * 100}", "${crashInfo.players[userId].cashedOut}x")`)
    
                            socket.emit("cashoutResponse", {
                                status: "success"
                            });
    
                        } else {
                            socket.emit("message", {
                                type: "error",
                                msg: "Already cashed out!"
                            });
                        }
                    } else {
                        socket.emit("message", {
                            type: "error",
                            msg: "Not in crash!"
                        });
                    }
                } else {
                    socket.emit("message", {
                        type: "error",
                        msg: "Nice try, loser."
                    });
                    console.log("Nice try, loser.", userId);
                    user.update(userId, "withdrawOk", 0, 2);
                }
            } else {
                socket.emit("message", {
                    type: "error",
                    msg: "Round must be closed!"
                });
            }
            
        } else {
            socket.emit("message", {
                type: "error",
                msg: "Not logged in!"
            });
        }
    });
});

const tickRate = 150;
let crashRender = 0;
let callTick = (elapsed) => {
    var left = crashInfo.gameDuration - elapsed;
    var nextTick = Math.max(0, Math.min(left, tickRate));
    setTimeout(runTick, nextTick);
}

let tick = (elapsed, y) => {
    if (crashRender % 6 == 0) {
        io.emit("crashGraph", {x: (elapsed / 1000), y: y});
    }
    callTick(elapsed);
}

let runTick = async () => {
    var elapsed = Date.now() - crashInfo.startTime;
    var y = calcY(elapsed);

    checkForCashout(y);
    crashRender++;

    if(y >= crashInfo.fairRound.ticket) {
        crashInfo.status = "crashed";

        if (crashHistory.length >= 10) {
            crashHistory.pop()
        };
        crashHistory.unshift({
            coords: {x: (elapsed / 1000), y: y},
            info: crashInfo,
            type: "crash",
        });
        io.emit("crashHistory", crashHistory);

        io.emit("crashCrashed", {x: (elapsed / 1000), y: y});


        for(var player in crashInfo.players) {
            if(crashInfo.players[player].cashedOut == false) {
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

                db.Query(`INSERT INTO gamehistory (mode, userId, betvalue, winnings, altInfo) VALUES ("crash", "${player}", "${crashInfo.players[player].betValue * 100}", "${crashInfo.players[player].betValue * -100}", "${crashInfo.players[player].autocashout}x")`)
            }
        }
    
    
        setTimeout(function () {
            module.exports.start();
        }, 5000);


        return;
    }

    tick(elapsed, y);
}


module.exports = {
    start: () => {
        if(admin.getStatus("crash") == 1) {
            crashInfo = {
                fairRound: fairRound(),
                players: {},
                counter: 10,
                status: "open",
            };
            crashRender = 0;
            io.emit("crashCounter", {
                hash: crashInfo.fairRound.hash,
                counter: crashInfo.counter
            });
            var timer = setInterval(() => {
                crashInfo.counter--;
                if(crashInfo.counter <= 0) {
                    crashInfo.status = "closed";
                    clearInterval(timer);
                    crashInfo.counter = 0;
                    crashInfo.startTime = Date.now();
                    crashInfo.gameDuration = Math.ceil(inverseGrowth(crashInfo.fairRound.ticket));


                    io.emit("crashGraph", {x: crashInfo.counter, y: calcY(crashInfo.counter)});

                    callTick(0);

                } else {
                    if(crashInfo.counter % 2 == 0) {
                        io.emit("crashCounter", {
                            hash: crashInfo.fairRound.hash,
                            counter: crashInfo.counter
                        });
                    }
                }
            }, 1000);
        } else {
            setTimeout(() => {
                module.exports.start();
            }, 10 * 1000);
        }
        
    },
    join: (socket, betInfo) => { // {id, avatar, username} {betValue, autocashout}
        const userId = user.getId(socket);
        if(userId) {

            if(true){//user.information(userId, "tos") == 1) {
                if(crashInfo.status == "open") {
                    if(betInfo.betValue <= maxBet && betInfo.betValue >= minBet && Math.round(Number(betInfo.betValue) * 100) / 100 == Number(betInfo.betValue)) {
                        if(!crashInfo.players[userId] || (crashInfo.players[userId].betValue + Number(betInfo.betValue)) <= maxBet) {
                            if(Math.round(betInfo.betValue * 100) <= Math.round(user.information(userId, "balance") * 100)) {
                                if(betInfo.autocashout >= minCashout || betInfo.autocashout == 0) {
                                    if(crashInfo.players[userId]) {
                                        crashInfo.players[userId].betValue += betInfo.betValue;
                                    } else {
                                        crashInfo.players[userId] = {
                                            autocashout: betInfo.autocashout == 0 ? "None" : betInfo.autocashout,
                                            betValue: betInfo.betValue,
                                            avatar: user.information(userId, "avatar"),
                                            username: user.information(userId, "username"),
                                            cashedOut: false,
                                        }
                                    }
        
                                    user.sendMsg(userId, {
                                        type: "success",
                                        msg: "Placed bet!"
                                    });
                                    user.update(userId, "balance", (-1 * betInfo.betValue), 3);
            
                                    user.sendToUser(userId, "crashPlayer", {
                                        betValue: crashInfo.players[userId].betValue,
                                        autocashout: crashInfo.players[userId].autocashout,
                                    })
                                    io.emit("crashPlayers", crashInfo.players);
                                } else {
                                    user.sendMsg(userId, {
                                        type: "error",
                                        msg: `Lowest autocashout is ${minCashout}!`
                                    })
                                }
                            } else {
                                user.sendMsg(userId, {
                                    type: "error",
                                    msg: `Insufficient funds!`
                                })
                            }
                        } else {
                            user.sendMsg(userId, {
                                type: "error",
                                msg: `Maxbet is 500!`
                            })
                        }
                        
                    } else {
                        user.sendMsg(userId, {
                            type: "error",
                            msg: "Your bet was not correct!"
                        })
                    }
                } else {
                    user.sendMsg(userId, {
                        type: "error",
                        msg: "Crash is not open!"
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
                type: "error",
                msg: "Not logged in!"
            }, socket.id);
        }      
    },
    cashout: (playerInfo) => {
        if(crashInfo.status == "closed") {
            for(var player in crashInfo.players) {
                if(player == playerInfo.id) {
                    if(!crashInfo.players[player].cashedOut) {
                        var elapsed = Date.now() - crashInfo.startTime;
                        var y = calcY(elapsed);
                        crashInfo.players[player].cashedOut = y;

                        console.log("Cashing out", elapsed, y);


                        // if(crashInfo.players[player].cashedOut > 1.7) {
                        //     if(user.information(userId, "wager") >=crashInfo.players[player].betValue) {
                        //         user.update(userId, "wager", (-1 * crashInfo.players[player].betValue), 3);
                        //     } else {
                        //         user.update(userId, "wager", 0, 2);
                        //     }
                        //     user.update(userId, "xp", crashInfo.players[player].betValue, 3);
                        // }
        

                        giveReward(playerInfo.id, Number(Math.floor(crashInfo.players[player].cashedOut * Number(crashInfo.players[player].betValue) * 100) / 100));
                        socket.emit("updatePlayers", crashInfo.players);
                        return "Ok";
                    }
                }
            }
        }
    },
    getHistory: () => {
        return crashHistory;
    },
    getCurrentHash: () => {
        return crashInfo.fairRound.hash
    }
};