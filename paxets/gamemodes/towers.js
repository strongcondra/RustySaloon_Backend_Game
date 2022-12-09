const CryptoJS = require("crypto-js");
const crypto = require("crypto");

const user = require("../user");
const db = require("../db");
const admin = require("../admin");

const io = require('../io').io();

const towersLevel = {
    easy: 2 / 3,
    medium: 1 / 2,
    hard: 1 / 3
};

const towersMaxReward = 200 * 1000;

let calcReward = (type, level) => {
    return (1 / ((towersLevel[type]) ** level)) * (1 - 0.03 * level);
}


let getRndInteger = (min, max) => {
    return Math.floor(Math.random() * (max + 1 - min)) + min;
}

let fairRound = (from, to) => { // 0-14
    const secret = crypto.randomBytes(11).toString('hex');
    const ticket = [getRndInteger(from, to), getRndInteger(from, to), getRndInteger(from, to), getRndInteger(from, to), getRndInteger(from, to), getRndInteger(from, to), getRndInteger(from, to), getRndInteger(from, to)];
    const hashAsString = CryptoJS.SHA256(`${secret}:${ticket}`); // ROLL ID
    const hash = hashAsString.toString(CryptoJS.enc.Hex);

    return {
        type: "towers",
        hash: hash,
        ticket: ticket,
        secret: secret,
    };
}

io.sockets.on("connection", function (socket) {
    socket.on("createTowers", async function (data) {
        module.exports.create(socket, data);
    });

    socket.on("towersCheckAlternative", async function (data) {
        module.exports.checkAlternative(socket, data);
    });

    socket.on("towersCashout", () => {
        module.exports.cashout(socket);
    });
    socket.on("towersConnect", () => {
        let userId = user.getId(socket);
        if (userId) {
            let towersInfo = user.information(userId, "towers");
            if (towersInfo && Object.keys(towersInfo).length > 0) {
                user.sendToUser(userId, "towersCheckAlternativeResponse", {
                    rightAnswer: true,
                    done: false,
                    level: towersInfo.currentLevel,
                    mode: towersInfo.level,
                    answers: towersInfo.answers,
                    bet: towersInfo.betValue
                });
            }
        };
        socket.emit("towersHistory", history);
        socket.emit("towersConnect", {
            balance: (Math.floor(user.information(userId, "balance") * 100) / 100)
        });
    })
});


let history = [];


module.exports = {
    create: (socket, data) => {
        const userId = user.getId(socket);
        if (userId) {
            if(admin.getStatus("towers") == 1) {
                if (true){ //(user.information(userId, "tos") == 1) {
                    let towersInfo = user.information(userId, "towers");
                    if (!towersInfo || Object.keys(towersInfo).length == 0) {
                        if (data.level && towersLevel[data.level]) {
                            if (data.betValue && Number(data.betValue) != NaN && Number(data.betValue) == (Math.round(Number(data.betValue) * 100) / 100) && Number(data.betValue) > 0) {
                                if (Math.round(user.information(userId, "balance") * 100) >= Math.round(Number(data.betValue) * 100)) {
                                    let fairRoundRound = fairRound(1, data.level == "medium" ? 2 : 3);
    
                                    user.update(userId, "balance", Number(-data.betValue), 3);
    
                                    // if (user.information(userId, "wager") >= Number(data.betValue)) {
                                    //     user.update(userId, "wager", (-1 * Number(-data.betValue)), 3);
                                    // } else {
                                    //     user.update(userId, "wager", 0, 2);
                                    // }
                                    // user.update(userId, "xp", Number(data.betValue), 3);
    
                                    let towersInfo = {
                                        fairRound: fairRoundRound,
                                        betValue: data.betValue,
                                        level: data.level,
                                        currentLevel: 0,
                                        answers: [],
                                    }
    
    
    
                                    user.update(userId, "towers", towersInfo, 0);
    
                                    db.Query(`UPDATE users SET towers='${JSON.stringify(towersInfo)}' WHERE id="${userId}"`);
    
                                    user.sendToUser(userId, "createTowersResponse", {
                                        level: 0,
                                    })
    
                                } else {
                                    user.sendMsg(userId, {
                                        type: "error",
                                        msg: "Not enough balance!"
                                    });
                                }
                            } else {
                                user.sendMsg(userId, {
                                    type: "error",
                                    msg: "Bet is not correct!"
                                });
                            }
                        } else {
                            user.sendMsg(userId, {
                                type: "error",
                                msg: "Wrong mode!"
                            });
                        }
                    } else {
                        user.sendMsg(userId, {
                            type: "error",
                            msg: "Already in towers!"
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
                    type: "info",
                    msg: "Towers is turned off!"
                });
            }
        } else {
            user.sendMsg(userId, {
                type: "error",
                msg: "Please login!"
            }, socket.id);
        }
    },

    checkAlternative: async (socket, data) => {
        
        const userId = user.getId(socket);
        
        if (userId) {
            let towersInfo = user.information(userId, "towers");
            if (towersInfo && Object.keys(towersInfo).length > 0) {
                if (data.alternative && Number(data.alternative) == Math.floor(Number(data.alternative)) && Number(data.alternative) >= 1 && data.alternative <= (towersInfo.level == "medium" ? 2 : 3)) {
                    if ((towersInfo.level == "hard" && Number(data.alternative) == towersInfo.fairRound.ticket[towersInfo.currentLevel]) || (towersInfo.level != "hard" && Number(data.alternative) != towersInfo.fairRound.ticket[towersInfo.currentLevel])) {

                        towersInfo.currentLevel += 1;
                        towersInfo.answers.push(Number(data.alternative));

                        user.update(userId, "towers", towersInfo, 0);


                        if (towersInfo.currentLevel == towersInfo.fairRound.ticket.length || (Math.floor(Number(towersInfo.betValue) * calcReward(towersInfo.level, towersInfo.currentLevel + 1))) > towersMaxReward) {
                            let currentbalance = Math.floor(Number(towersInfo.betValue) * calcReward(towersInfo.level, towersInfo.currentLevel) * 100) / 100;
                            user.update(userId, "balance", Number(currentbalance), 3);
                            user.update(userId, "withdrawableBalance", Math.floor((currentbalance - Number(towersInfo.betValue)) * 100), 3);

                            user.sendMsg(userId, {
                                type: "success",
                                msg: `Congratulations, you completed towers and got ${currentbalance} coins!`
                            });
                            user.sendToUser(userId, "towersCheckAlternativeResponse", {
                                rightAnswer: true,
                                done: true,
                                tickets: towersInfo.fairRound.ticket,
                                level: towersInfo.currentLevel,
                                mode: towersInfo.level,
                                answers: towersInfo.answers,
                                bet: towersInfo.betValue
                            });


                            history.unshift({
                                winnings: currentbalance,
                                username: user.information(userId, "username"),
                                betValue: Number(towersInfo.betValue),
                                timestamp: Date.now()
                            });
                            if(history.length > 13) {
                                history.pop();
                            }

                            io.emit("towersHistory", history);

                            db.Query(`INSERT INTO gamehistory (mode, userId, betvalue, winnings, altInfo) VALUES ("towers", "${userId}", "${towersInfo.betValue * 100}", "${currentbalance * 100}", "${towersInfo.level}-${towersInfo.currentLevel}")`);

                            user.update(userId, "towers", {}, 0);

                            if(user.information(userId, "muted") == 0) {
                                user.sendToUser(userId, "towersSound", {
                                    type: "win"
                                });
                            }

                            db.Query(`UPDATE users SET towers="{}" WHERE id="${userId}"`);
                        } else {
                            user.sendToUser(userId, "towersCheckAlternativeResponse", {
                                rightAnswer: true,
                                done: false,
                                level: towersInfo.currentLevel,
                                mode: towersInfo.level,
                                answers: towersInfo.answers,
                                bet: towersInfo.betValue
                            });

                            if(user.information(userId, "muted") == 0) {
                                user.sendToUser(userId, "towersSound", {
                                    type: "advance"
                                });
                            }

                            await db.Query(`UPDATE users SET towers='${JSON.stringify(towersInfo)}' WHERE id="${userId}"`);
                        }

                    } else {
                        user.sendToUser(userId, "towersCheckAlternativeResponse", {
                            rightAnswer: false,
                            tickets: towersInfo.fairRound.ticket,
                            level: towersInfo.currentLevel,
                            mode: towersInfo.level,
                            bet: towersInfo.betValue
                        });

                        history.unshift({
                            winnings: -Number(towersInfo.betValue),
                            username: user.information(userId, "username"),
                            betValue: Number(towersInfo.betValue),
                            timestamp: Date.now()
                        });
                        if(history.length > 13) {
                            history.pop();
                        }

                        io.emit("towersHistory", history);

                        db.Query(`INSERT INTO gamehistory (mode, userId, betvalue, winnings, altInfo) VALUES ("towers", "${userId}", "${towersInfo.betValue * 100}", "${towersInfo.betValue * -100}", "${towersInfo.level}-${towersInfo.currentLevel}")`);

                        const currentBalance = Math.floor(user.information(userId, "balance") * 100);
                        if(!currentBalance) {
                            await db.Query(`SELECT * FROM users WHERE id="${userId}"`).then((row) => {
                                if(row[0]) {
                                    if((Number(row[0].balance) * 100) < Number(row[0].withdrawableBalance)) {
                                        user.update(userId, "withdrawableBalance", (Number(row[0].balance) * 100 * 1.5), 2);
                                    }
                                }
                            });
                        } else {
                            if(currentBalance < user.information(userId, "withdrawableBalance")) {
                                user.update(userId, "withdrawableBalance", currentBalance, 2);
                            }
                        }



                        user.update(userId, "towers", {}, 0);

                        if(user.information(userId, "muted") == 0) {
                            user.sendToUser(userId, "towersSound", {
                                type: "loose"
                            });
                        }

                        db.Query(`UPDATE users SET towers="{}" WHERE id="${userId}"`);
                    }
                }
            }
        }
    },

    cashout: (socket) => {
        let userId = user.getId(socket);
        if (userId) {
            let towersInfo = user.information(userId, "towers");
            if (towersInfo && Object.keys(towersInfo).length > 0) {
                if(towersInfo.currentLevel > 0) {
                    let currentbalance = Math.floor(Number(towersInfo.betValue) * calcReward(towersInfo.level, towersInfo.currentLevel) * 100) / 100;
                    user.update(userId, "balance", Number(currentbalance), 3);
                    user.update(userId, "withdrawableBalance", Math.floor((currentbalance - Number(towersInfo.betValue)) * 100), 3);
                    // user.sendMsg(userId, {
                    //     type: "success",
                    //     msg: "Successful cashout from towers, won " + currentbalance + " coins"
                    // });
    
    
                    user.sendToUser(userId, "towersCheckAlternativeResponse", {
                        rightAnswer: false,
                        tickets: towersInfo.fairRound.ticket,
                        level: towersInfo.currentLevel,
                        mode: towersInfo.level,
                        bet: towersInfo.betValue,
                    });

                    history.unshift({
                        winnings: currentbalance,
                        username: user.information(userId, "username"),
                        betValue: Number(towersInfo.betValue),
                        timestamp: Date.now()
                    });
                    if(history.length > 13) {
                        history.pop();
                    }


                    io.emit("towersHistory", history);

                    

                    db.Query(`INSERT INTO gamehistory (mode, userId, betvalue, winnings, altInfo) VALUES ("towers", "${userId}", "${towersInfo.betValue * 100}", "${currentbalance * 100}", "${towersInfo.level}-${towersInfo.currentLevel}")`);

                    if(user.information(userId, "muted") == 0) {
                        user.sendToUser(userId, "towersSound", {
                            type: "win"
                        });
                    }
                    user.update(userId, "towers", {}, 0);
    
                    db.Query(`UPDATE users SET towers="{}" WHERE id="${userId}"`);
                } else {
                    user.sendMsg(userId, {
                        type: "error",
                        msg: "You cannot cashout at once!"
                    })
                }
            }
        }
    }
}