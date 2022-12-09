const user = require("./user");
const db = require("./db");
const axios = require("axios");
const io = require('./io').io();
require('dotenv').config({
    path: '../.env'
});

const Rust = require("./rust.js");


// id, userId, code, wager, earning, timestamp
// id, owner, users (int), balance, timestamp, wager, earnings

// *100 på allt

io.sockets.on("connection", function (socket) {
    socket.on("addReferralCode", async (data) => {
        console.log("Adding code", data.code);
        const userId = user.getId(socket);
        if (userId) {
            if (data.captcha != "") {
                await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GSECRET}&response=${data.captcha}`).then(async (response) => {
                    if (response.data.success) {
                        if ((user.information(userId, "lastRustFetch") + 1000 * 10) < Date.now()) {
                            user.update(userId, "lastRustFetch", Date.now(), 0);

                            const steamid = user.information(userId, "steamid");

                            if(steamid) {
                                let rustRes = (Number(user.information(userId, "verified")) == 1) ? {
                                    error: false
                                } : await Rust.ownsRust(steamid, userId);
    
                                if (rustRes.error == false) {
    
                                    if (!user.information(userId, "code")) {
                                        code = String(data.code).toLowerCase().replace(/[^a-z0-9]/gm,"").toUpperCase().trim();
                                        if(code.length < 20 && code.length > 0) {
                                            let foundCode = findInfo("code", code);
                                            console.log("Code found!", foundCode, code);
                                            if (foundCode != "None") {
                                                if(codes[foundCode].owner != userId) {
                                                    addUser(foundCode, code, userId);
                                                } else {
                                                    socket.emit("message", {
                                                        type: "error",
                                                        msg: "You cannot add your own code!"
                                                    });
                                                }
                                            } else {
                                                socket.emit("message", {
                                                    type: "error",
                                                    msg: "Code does not exist!"
                                                });
                                            }
                                        }
                                        
                                    } else {
                                        socket.emit("message", {
                                            type: "error",
                                            msg: "You have already claimed a code!"
                                        });
                                    }
                                } else {
                                    if (rustRes.msg == "Rate limit") {
                                        socket.emit("message", {
                                            type: "error",
                                            msg: "Please try again in 10 seconds!"
                                        })
                                    } else if (rustRes.msg == "No Games") {
                                        socket.emit("message", {
                                            type: "error",
                                            msg: "You need to own Rust in order to claim the Referral bonus!"
                                        })
                                    } else if (rustRes.msg == "No Rust") {
                                        socket.emit("message", {
                                            type: "error",
                                            msg: "You need to own Rust in order to claim the Referral bonus!"
                                        })
                                    }
                                    else if (rustRes.msg == "Time") {
                                        socket.emit("message", {
                                            type: "error",
                                            msg: "You need to have played Rust for atleast 5 hours! (Make sure game information is public!)"
                                        })
                                    } else {
                                        socket.emit("message", {
                                            type: "error",
                                            msg: "Please try again in 15 seconds!"
                                        })
                                    }
                                }
                            } else {
                                socket.emit("message", {
                                    type: "error",
                                    msg: "Steamid not found, please reload the page!"
                                })
                            }
                        } else {
                            socket.emit("message", {
                                type: "error",
                                msg: "You need to wait 10 seconds before trying again!"
                            });
                        }
                    } else {
                        socket.emit("message", {
                            type: "error",
                            msg: "Bad captcha!"
                        });
                    }
                })
            } else {
                socket.emit("message", {
                    type: "error",
                    msg: "Bad captcha! . "
                });
            }
        } else {
            socket.emit("message", {
                type: "error",
                msg: "Please login!"
            });
        }
    });


    socket.on("createReferralCode", async (data) => {
        if (data.captcha != "" && data.captcha) {
            socket.emit("resetCaptcha");
            await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GSECRET}&response=${data.captcha}`).then(async (response) => {
                if (response.data.success) {
                    console.log("Create");
                    createCode(socket, data.code);
                } else {
                    socket.emit("message", {
                        type: "error",
                        msg: "Captcha error!"
                    });
                }
            })
        } else {
            socket.emit("message", {
                type: "error",
                msg: "Captcha error!"
            });
        }
    })
    socket.on("referralClaimReward", () => {
        claimReward(socket);
    });


    socket.on("referralConnect", () => {
        const userId = user.getId(socket);
        console.log("ref connect");
        if(userId) {
            console.log("logged in", userId)
            let foundCode = findInfo("owner", userId);
            if(foundCode != "None") {
                db.Query(`SELECT * FROM referralusers WHERE code="${codes[foundCode].code}" ORDER BY timestamp DESC`).then((row) => {
                    if(Array.isArray(row)) {
                        socket.emit("referralConnectResponse", {
                            code: codes[foundCode].code,  
                            balance: codes[foundCode].balance,
                            wager: codes[foundCode].wager,
                            earnings: codes[foundCode].earnings,
                            users: codes[foundCode].users,
                            info: row,
                        });
                    }
                })
            }
        }
    })
});


let claimReward = async (socket) => {
    let userId = user.getId(socket);
    if(userId) {
        let foundCode = findInfo("owner", userId);
        if(foundCode != "None") {
            if(Number(codes[foundCode].balance) > 0) {

                const balance = Math.round(Number(codes[foundCode].balance));

                user.update(userId, "balance", (balance / 100), 3);
                user.update(userId, "withdrawableBalance", balance, 3);

                user.sendMsg(userId, {
                    type: "success",
                    msg: `Claimed ${(balance / 100).toFixed(2)}`
                });
                codes[foundCode].balance = 0;
                await db.Query(`UPDATE referrals SET balance="${codes[foundCode].balance}" WHERE id="${codes[foundCode].id}"`);
                
                user.sendToUser(userId, "claimRewardResponse", "");
            } else {
                user.sendMsg(userId, {
                    type: "error",
                    msg: "No balance to claim!"
                });
            }
            
        } else {
            user.sendMsg(userId, {
                type: "error",
                msg: "Code not found!"
            });
        }
    } else {
        user.sendMsg(userId, {
            type: "error",
            msg: "Please login!"
        }, socket);
    }
}

let createCode = async (socket, code) => {
    const userId = user.getId(socket);
    if(userId) {
        if(code) {
            let foundUser = findInfo("owner", userId);
            if(foundUser == "None") {
                if(code != "" && code != null && code != "null") {
                    code = String(code).toLowerCase().replace(/[^a-z0-9]/gm,"").toUpperCase().trim();
                    if(code.length < 20 && code.length > 0) {
                        let foundCode = findInfo("code", code);
                    
                        if(foundCode == "None") {
                            console.log("New code", code);
                            
                            await db.Query(`INSERT INTO referrals (code, owner) VALUES ("${code}", "${userId}")`).then(() => {
                                fetchCodes();
                            });
                            console.log("Code created", code);
        
                            user.sendToUser(userId, "referralConnectResponse", {
                                code: code,  
                                balance: 0,
                                wager: 0,
                                earnings: 0,
                                users: 0,
                                info: [],
                            });
                            user.sendMsg(userId, {
                                type: "success",
                                msg: "Created code!"
                            });
                        } else {
                            user.sendMsg(userId, {
                                type: "error",
                                msg: "Code has already been taken!"
                            });
                        }
                    } else {
                        user.sendMsg(userId, {
                            type: "error",
                            msg: "Code must be between 1-20 characters long!"
                        });
                    }
                    
                    
                } else {
                    user.sendMsg(userId, {
                        type: "error",
                        msg: "Code not in valid format"
                    });
                }
            } else {
                user.sendMsg(userId, {
                    type: "error",
                    msg: "You are already an onwer of a code!"
                });
            }
        }
    } else {
        user.sendMsg(userId, {
            type: "error",
            msg: "Please login!"
        });
    }
};

let codes = [];
const fee = 0.05;
let fetchCodes = () => {
    db.Query(`SELECT * FROM referrals`).then((response) => {
        codes = response;
    });
}

fetchCodes();

let findInfo = (type, value) => {
    for (var i = 0; i < codes.length; i++) {
        if (codes[i][type] == value) {
            return i;
        }
    }
    return "None";
}

let addUser = async (index, code, id) => {
    if (codes[index].code == code) {

        codes[index].users += 1;
        db.Query(`UPDATE referrals SET users="${codes[index].users}" WHERE id="${codes[index].id}"`);
        user.update(id, "balance", 0.5, 3);
        user.update(id, "code", code, 2);

        user.sendMsg(id, {
            type: "success",
            msg: "Successfully added code!",
        });
    }
}

let addBalance = async (index, userId, bet, code) => {
    if(code == codes[index].code) {
        codes[index].balance += Math.floor(bet * fee);
        codes[index].wager += Math.floor(bet);
        codes[index].earnings += Math.floor(bet * fee);


        console.log("added", codes[index]);


        db.Query(`INSERT INTO referralusers (userId, username, code, wager, earning) VALUES ("${userId}", "${user.information(userId, "username")}", "${code}", "${Math.floor(bet)}", "${ Math.floor(bet * fee)}")`);
    
        await db.Query(`UPDATE referrals SET balance="${codes[index].balance}", wager="${codes[index].wager}", earnings="${codes[index].earnings}" WHERE id="${codes[index].id}"`);
    }

}

module.exports = {
    addBalance: (data) => {
        const userCode = user.information(data.id, "code");
        let foundCode = findInfo("code", userCode);
        if (foundCode != "None") {
            console.log("balance ok", foundCode);
            addBalance(foundCode, data.id, data.value, userCode);
        }
    },
    findInfo: (type, value) => {
        let index = findInfo(type, value);
        return codes[index] ? codes[index].code : "";
    }
}