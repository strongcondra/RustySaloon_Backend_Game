const db = require("./db");
const io = require('./io').io();


var users = {
    socket: {},
    info: {}
};

/**
    * Event called each 150ms telling the client the game is still alive
    * @param {number} updateDb - Updates the database with the new information given.
    * @param {number} sendToUser - Send 
*/

let updateDb = (id, type, data, update) => {
    db.Query(`UPDATE users SET ${type}=${update ? type+"+"+(type == "balance" ? (Number(data) * 100) : data) : "'"+data+"'"} WHERE id="${id}"`);
}

let sendToUser = (id, type, data) => {
    if(users.info[id]) {
        io.to(users.info[id].socketid).emit(type, data);
    }
}

let isJsonString = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

module.exports = {
    add: async (socket) => {
        let userData = "";
        await db.Query(`SELECT * FROM users WHERE steamid="${socket.handshake.session.passport.user.id}"`).then(async (data) => {
            if(data[0]) {
                users.info[data[0].id] = {
                    socketid: socket.id,
                    id: data[0].id,
                    verified: Number(data[0].verified),
                    steamid: data[0].steamid,
                    username: data[0].username,
                    withdrawOk: Number(data[0].withdrawOk),
                    withdrawableBalance: Number(data[0].withdrawableBalance),
                    avatar: data[0].avatar,
                    rank: Number(data[0].rank),
                    inDiscord: Number(data[0].inDiscord),
                    balance: Number(data[0].balance) < 0 ? 0 : Math.floor(Number(data[0].balance)) / 100,
                    wager: Number(data[0].wager) < 0 ? 0 : Math.floor(Number(data[0].wager) * 100) / 100,
                    rank: Number(data[0].rank),
                    latestFaucet: Number(data[0].latestFaucet),
                    totalDeposit: Number(data[0].totalDeposit),
                    muted: Number(data[0].muted),
                    tradeurl: data[0].tradeurl,
                    inventory: false,
                    transactions: isJsonString(data[0].transactions) ? JSON.parse(data[0].transactions) : [],
                    last_fetched: Number(data[0].last_fetched_inventory),
                    fee: data[0].fee,
                    activeChat: data[0].activeChat,
                    lastMessage: 0,
                    lastDeposit: data[0].lastDeposit,
                    lastWithdraw: Number(data[0].lastWithdraw),
                    lastFetch: 0,
                    lastRustFetch: 0,
                    lastReturn: 0,
                    tos: Number(data[0].tos),
                    code: data[0].code,
                    xp: Number(data[0].xp),
                    towers: isJsonString(data[0].towers) ? JSON.parse(data[0].towers) : {},
                    dice: 0,
                    lastChatMessage: 0,
                    gameHistory: [],
                };

                users.socket[socket.id] = data[0].id;
    
                userData = users.info[data[0].id];
            } else {
                
                console.log("BAD USER!", socket.handshake.session.passport.user.id);

                return;
            }
        })

        await db.Query(`SELECT * FROM gamehistory WHERE userid="${userData.id}"`).then(async (row) => {
            if(row) {
                row.map(game => {
                    users.info[userData.id].gameHistory.push(game);
                })
    
                userData = users.info[userData.id];
            } 
        })

        
        this.sendUsers;

        return userData;
    },

    /**
     * Sends the player counts and per region
     */
    sendUsers: () => {
        regionPlayers = {
            "english": 0,
            "russian": 0,
            "turkish": 0,
            "spanish": 0,
            "swedish": 0,
        }

        Object.keys(users.info).map(id => {
            regionPlayers[users.info[id].activeChat]++;
        }) 

        io.emit("playersOnline", {
            players: Object.keys(users.info).length,
            regionPlayers: regionPlayers,
        })
    },
    delete: (socket) => {
        const id = users.socket[socket.id];
        delete users.info[users.socket[socket.id]];
        delete users.socket[socket.id];
       
        this.sendUsers;

        return id;
    },
    getUsers: () => {
        return users.info;
    },
    getId: (socket) => {
        if(users.socket[socket.id]) {
            return users.socket[socket.id]
        } else {
            return false;
        }
    },
    information : (id, type) => {
        if(users.info[id]) {
            return users.info[id][type];
        } else {
            return false;
        }
    },
    update : (id, type, data, tier) => {
        if(type == "balance" && users.info[id] && tier == 3) {
            users.info[id][type] += data;
            users.info[id][type] = (Math.round(users.info[id][type] * 100) / 100);

            db.Query(`UPDATE users SET balance="${Math.round(users.info[id][type] * 100)}" WHERE id="${id}"`);
            sendToUser(id, type, users.info[id][type]);
        } else {
            if (tier != 0) tier % 2 == 0 ? updateDb(id, type, data, false) : updateDb(id, type, data, true) 
            if(users.info[id]) {
                if(tier % 2 == 0) {
                    users.info[id][type] = data;
                } else {
                    
                    users.info[id][type] += data;
                    users.info[id][type] = (Math.floor(users.info[id][type] * 100) / 100);
                }
    
                if (tier > 2) {sendToUser(id, type, users.info[id][type]);}
            }
        }
        
    },
    sendMsg : (id, msg, socketId) => {
        if(users.info[id]) {
            sendToUser(id, "message", msg);
        } else {
            io.to(socketId).emit("message", msg);
        }
    },
    sendBalance : async (id) => {
        await db.Query(`SELECT balance FROM users WHERE id = '${id}'`).then(data => {
            io.to(users.info[id].socketid).emit("balance", parseFloat(data[0].balance/100).toFixed(2));
        });
    },
    sendToUser : (id, type, msg) => {
        sendToUser(id, type, msg);
    }
}

// db.Query(`UPDATE users SET withdrawableBalance=()`);