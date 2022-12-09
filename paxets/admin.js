const user = require('./user');
const db = require('./db');

const io = require('./io').io();

let panel = {};

let fetchPanel = async () => {

    await db.Query(`SELECT * FROM controlpanel WHERE id="1"`).then(row => {
        if(row) {
            panel.roulette = row[0].roulette;
            panel.crash = row[0].crash;
            panel.wof = row[0].wof;
            panel.towers = row[0].towers;
            panel.dice = row[0].dice;
            panel.coinflip = row[0].coinflip;
        }
    })

    await db.Query(`SELECT timestamp FROM users ORDER BY timestamp ASC`).then((response) => {

        panel.userInfo = {
            totalUsers: response.length,
            month: 0,
            week: 0,
            today: 0,
        };
        let currentDate = new Date();
        let temp = new Date();
        temp.setDate(currentDate.getDate() - currentDate.getDay());
        let weekStamp = temp.getTime();
        response.map(localUser => {
            if(localUser.timestamp.getFullYear() == currentDate.getFullYear()) {
                if(localUser.timestamp.getMonth() == currentDate.getMonth()) {
                    panel.userInfo.month++;
                }
                if(weekStamp <= localUser.timestamp.getTime()) {
                    panel.userInfo.week++;
                }
                
                if(localUser.timestamp.getMonth() == currentDate.getMonth() && localUser.timestamp.getDate() == currentDate.getDate()) {
                    panel.userInfo.today++;
                }
            }
            
        }); 
    });

    // let admins = ["76561198348544784", "76561198392706445", "76561198188530481", "76561198328649538", "76561198201937441", "76561198142345181", "76561198966706521"];
    let admins = ["76561198348544784", "76561198392706445"];
    // let admins = [];

    await db.Query(`SELECT steamid FROM users WHERE rank >= 1`).then(row => {
        if(row) {
            row.map(admin => {
                admins.push(admin.steamid);
            })
        }
    });

    console.log("Admins", admins);

    await db.Query(`SELECT * FROM tradeoffers WHERE status="ACCEPTED" AND timestamp >= '2021-01-18' ORDER BY timestamp DESC`).then((row) => {
        console.log(row.length, "Rowlength");
        if(row) {
            panel.transactions = [];
            panel.transactionInfo = {
                total: 0,
                month: 0,
                week: 0,
                today: 0
            }
            let currentDate = new Date();
            // currentDate.setDate(currentDate.getDate() - 1);
            let temp = new Date();
            // temp.setDate(temp.getDate() - 1);
            temp.setDate(currentDate.getDate() - currentDate.getDay());
            let weekStamp = temp.getTime();
            row.map(transaction => {
                
                const userSteamid = JSON.parse(transaction.user).steamid;
                if(!admins.includes(userSteamid)) {

                    const timestamp = (transaction.timestamp);

                    panel.transactions.push(transaction);
                    if(timestamp.getFullYear() == currentDate.getFullYear()) {
                        if(timestamp.getMonth() == currentDate.getMonth()) {
                            panel.transactionInfo.month += Number(transaction.withdraw) == 1 ? Math.floor(-(1/1.2) * Number(transaction.value)) : Number(transaction.value);
                        }
                        if(weekStamp <= timestamp.getTime()) {
                            panel.transactionInfo.week += Number(transaction.withdraw) == 1 ? Math.floor(-(1/1.2) * Number(transaction.value)) : Number(transaction.value);
                        }
                        if(timestamp.getMonth() == currentDate.getMonth() && timestamp.getDate() == currentDate.getDate()) {
                            panel.transactionInfo.today += (Number(transaction.withdraw) == 1 ? Math.floor(-(1/1.2) * Number(transaction.value)) : Number(transaction.value));
                        }
                    }
                    panel.transactionInfo.total += Number(transaction.withdraw) == 1 ? Math.floor(-(1/1.2) * Number(transaction.value)) : Number(transaction.value);
                }
            });
        }
    });
}


fetchPanel();
// Fetching panel every hour!
setInterval(() => {
    fetchPanel();
}, 1000 * 60 * 5);


io.sockets.on("connection", function (socket) {
    socket.on("transactionConnect", () => {
        const userId = user.getId(socket);
        if(userId) {
            if(user.information(userId, "rank") > 1) {
                socket.emit("adminTransactions", panel);
            }
        }
    });

    socket.on("dashboardConnect", () => {
        const userId = user.getId(socket);
        if(userId) {
            if(user.information(userId, "rank") > 1) {
                socket.emit("adminDashboard", {
                    userInfo: panel.userInfo,
                    players: user.getUsers()
                });
            }
        }
    });


    socket.on("handlerConnect", () => {
        const userId = user.getId(socket);
        if(userId) {
            if(user.information(userId, "rank") > 1) {
                socket.emit("adminHandler", {
                    games: {
                        roulette: panel.roulette,
                        crash: panel.crash,
                        "50x": panel.wof,
                        towers: panel.towers,
                        dice: panel.dice,
                        coinflip: panel.coinflip,
                    },
                });
            }
        }
    });

    socket.on("toggleGamemode", (game) => {
        if(game == "50x") {game = "wof"};
        const userId = user.getId(socket);
        if(userId) {
            if(user.information(userId, "rank") > 1) {
                const res = module.exports.changeStatus(game, (panel[game] == 1 ? 0 : 1));
                if(!res.error) {
                    socket.emit("message", {
                        type: "msg",
                        msg: res.msg
                    })

                    socket.emit("adminHandler", {
                        games: {
                            roulette: panel.roulette,
                            crash: panel.crash,
                            "50x": panel.wof,
                            towers: panel.towers,
                            dice: panel.dice,
                            coinflip: panel.coinflip,
                        },
                    });
                }
            }
        }
        
    })

});


module.exports = {
    changeStatus: async (type, value) => {
        if(panel[type] != undefined && Number.isInteger(panel[type])) {
            if(value == 0 || value == 1) {
                panel[type] = value;
                await db.Query(`UPDATE controlpanel SET ${type}="${value}" WHERE id="1"`);
                return {error: false, msg: `Successfully turned ${value == 0 ? "off" : "on"} ${type}!`, value: value};
            } else {
                return {error: true, msg: `Not correct value!`};
            }
        } else {
            return {error: true, msg: `${type} not found!`};
        }
    },
    getStatus: (type) => {
        if(panel[type] != undefined && Number.isInteger(panel[type])) {
            return panel[type];
        }
    },
}