const http = require('http');

const passport = require('passport');
const SteamStrategy = require('passport-steam').Strategy;

const express = require('express');
const app = express();
const server = http.createServer(app);
const path = require('path');

const db = require("./db");

const axios = require("axios");
require('dotenv').config({ path: './config/.env' });

const port = 1337;

const redis = require('redis')
const sharedsession = require('express-socket.io-session');
const session = require("express-session");

const levelSystem = require("./levelSystem");

let RedisStore = require('connect-redis')(session)
const redisClient = redis.createClient()

redisClient.on('error', function (err) {
  console.log('Could not establish a connection with redis. ' + err);
});
redisClient.on('connect', function (err) {
  console.log('Connected to redis successfully');
});

var sessionMiddleware = session({
  key: 'express.sid',
  secret: "WDadw243#23¤#FWAVaW#¤23",
  name: "AsapSkins",
  resave: true,
  httpOnly: true,
  saveUninitialized: false,
  cookie: {
    secure: process.env.TESTMODE ? false : true,
    expires: new Date(Date.now() + 60 * 10000),
    maxAge: null
  },
  store: new RedisStore({
    client: redisClient
  }),
});

const io = require('./io').initialize(server);
io.use(sharedsession(sessionMiddleware));
app.use(sessionMiddleware);

app.use(passport.initialize());
app.use(passport.session());

// Coinpayments body extended
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// 

server.listen(port, () => console.log(`Listening on port ${port}`));

passport.serializeUser((user, cb) => {
  cb(null, user);
});

passport.deserializeUser((user, cb) => {
  cb(null, user);
});

passport.use(new SteamStrategy({
    returnURL: 'http://46.101.59.185/auth/steam/return',
    realm: 'http://46.101.59.185/',
    apiKey: 'E7B7486D06D133BE086B85A05A311137'
  },

  function (identifier, profile, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // To keep the example simple, the user's Steam profile is returned to
      // represent the logged-in user.  In a typical application, you would want
      // to associate the Steam account with a user record in your database,
      // and return that user instead.
      profile.identifier = identifier;

      db.Query(`SELECT * FROM users WHERE steamid="${profile.id}"`).then((rows) => {
        let username = validUsername(profile.displayName);

        let nameParts = username.split(" ");
        for (var i = 0; i < nameParts.length; i++) {
          nameParts[i] = nameParts[i].toUpperCase();
          if ((nameParts[i].includes(".COM") || nameParts[i].includes(".GG") || nameParts[i].includes(".NET") || nameParts[i].includes(".IO") || nameParts[i].includes(".MONEY") || nameParts[i].includes(".APP")) && nameParts[i] !== "rustysaloon.com") {
            username = username.replace(nameParts[i], "*");
          }
        }

        if (rows.length > 0) {
          // EXISTING PLAYER
          console.log("[Server] Returning player: " + username + " (" + profile.id + ") !");
          db.Query(`UPDATE users SET username="${username}", avatar="${profile.photos[2].value}" WHERE steamid="${profile.id}"`);
        } else {
          // NEW PLAYER
          console.log("[Server] New player: " + username + " (" + profile.id + ") !");
          db.Query(`INSERT INTO users (steamid, username, avatar) VALUES ("${profile.id}", "${username}", "${profile.photos[2].value}")`);
        }
      })


      return done(null, profile);
    });
  }
));

var allowedChar = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789ß. ";

let validUsername = (username) => {
  var clean = "";
  for (var i = 0; i < username.length; i++) {
    if (allowedChar.includes(username[i])) {
      clean += username[i]
    } else {
      clean += "*"
    }
  }
  return clean;
}

const user = require('./user.js');

const chat = require('./chat.js');

const bot = require('./bots.js');

const coinpayments = require('./coinpayments.js');
const CPayments = new coinpayments();

const dice = require('./gamemodes/dice');

const towers = require('./gamemodes/towers');

const roulette = require('./gamemodes/roulette.js');
roulette.start();

const crash = require('./gamemodes/crash');
crash.start();

const wheelofFortune = require('./gamemodes/wheelofFortune.js');
wheelofFortune.start();

const referrals = require('./referrals');

const admin = require('./admin');

const Rust = require("./rust.js");

io.on("connection", async (socket) => {
    
    if (socket.handshake != undefined && socket.handshake.session != undefined && socket.handshake.session.passport != undefined  && socket.handshake.session.passport.user != undefined) {
        await user.add(socket).then((info) => {
            socket.emit("userData", {
                id: info.id,
                steamid: info.steamid,
                username: info.username,
                avatar: info.avatar,
            });
            
            socket.emit("balance", info.balance);

            const activeLan = info.activeChat;
            socket.emit("changedLan", {
                messages: chat.getChat(activeLan),
                type: activeLan,
            })

            if (info.tos == 0) {
                socket.emit("tosPopup");
            }
        });
    };

    user.sendUsers();

    socket.on("tosConfirmed", () => {
        const userId = user.getId(socket);
        if (userId) {
            user.update(userId, "tos", 1, 2);
            socket.emit("tosConfirmed");
            socket.emit("message", {
                type: "success",
                msg: "TOS confirmed!"
            })
        } else {
            socket.emit("message", {
                type: "error",
                msg: "Please login!"
            });
        }
    })


    socket.on("codeInfo", () => {
        const userId = user.getId(socket);
        if (userId) {
            let yourCode = referrals.findInfo("owner", userId);


            socket.emit("code", {
                yourCode: yourCode,
                code: user.information(userId, "code")
            })
        }

    })

    socket.on("maxButton", () => {
        const userId = user.getId(socket);
        if (userId) {

            var balance = Number(user.information(userId, "balance"));

            if (balance > 0) {
                if (balance > 500) {
                    socket.emit("maxButton", 500);
                } else {
                    user.update(userId, "balance", Number((balance).toFixed(2)), 0);
                    socket.emit("maxButton", Number(balance).toFixed(2));
                }
            } else {
                socket.emit("maxButton", 0);
            }
        } else {
            socket.emit("maxButton", 0);
        }
    });


    socket.on("pfHistory", () => {
        socket.emit("pfHistoryRef", {
            roulette: roulette.getHistory(),
            crash: crash.getHistory(),
            dice: dice.getHistory(),
            "50x": wheelofFortune.getHistory(),
            hashes: {
                roulette: roulette.getCurrentHash(),
                crash: crash.getCurrentHash(),
                wof: wheelofFortune.getCurrentHash()
            }
        })
    })



    socket.on("claimFaucet", async (data) => {
        const userId = user.getId(socket);
        if (userId) {
            let latestFaucet = user.information(userId, "latestFaucet");
            if(latestFaucet != false) {
                if ((latestFaucet + 60 * 15 * 1000) < Date.now()) {
                    if ((Math.floor(user.information(userId, "balance") * 100) / 100) == 0) {
                        if (user.information(userId, "username")) {
                            if (String(user.information(userId, "username")).toLowerCase().includes("rustysaloon.com")) {
                                if (data.captcha != "") {
                                    await axios.post(`https://www.google.com/recaptcha/api/siteverify?secret=${process.env.GSECRET}&response=${data.captcha}`).then(async (response) => {
                                        if (response.data.success) {
    
                                            const steamid = user.information(userId, "steamid");
                                            if(steamid) {
                                                let rustRes = (Number(user.information(userId, "verified")) == 1) ? {
                                                    error: false
                                                } : await Rust.ownsRust(steamid, userId);
        
                                                if (rustRes.error == false) {
                                                    let latest = user.information(userId, "latestFaucet");

                                                    if(latest != false) {
                                                        if ((user.information(userId, "latestFaucet") + 60 * 15 * 1000) < Date.now()) {
                                                            user.update(userId, "balance", .03, 3);
                                                            user.update(userId, "latestFaucet", Date.now(), 2);
                
                                                            socket.emit("message", {
                                                                type: "success",
                                                                msg: "Claimed faucet!"
                                                            })
                
                                                            if (user.information(userId, "inDiscord") == 0) {
                                                                user.update(userId, "inDiscord", 1, 2);
                                                                socket.emit("faucetConnectResponse", {
                                                                    available: false,
                                                                    completed: true,
                                                                });
                                                            }
                                                        } else {
                                                            socket.emit("message", {
                                                                type: "error",
                                                                msg: `You need to wait ${Math.floor(((user.information(userId, "latestFaucet") + 60* 15 * 1000) - Date.now()) / 60000)} minutes before you can claim again!`
                                                            })
                                                        }
                                                    } else {
                                                        socket.emit("message", {
                                                            type: "error",
                                                            msg: "Please reload the page!"
                                                        })
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
                                                            msg: "You need to own Rust in order to claim the Faucet!"
                                                        })
                                                    } else if (rustRes.msg == "No Rust") {
                                                        socket.emit("message", {
                                                            type: "error",
                                                            msg: "You need to own Rust in order to claim the Faucet!"
                                                        })
                                                    } else if (rustRes.msg == "Time") {
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
                                                msg: "Bad captcha"
                                            })
                                        }
                                    })
                                } else {
                                    socket.emit("message", {
                                        type: "error",
                                        msg: "Please complete the captcha!"
                                    })
                                }
                            } else {
                                socket.emit("message", {
                                    type: "error",
                                    msg: "Your steam name must include rustysaloon.com"
                                })
                            }
                        }
    
                    } else {
                        socket.emit("message", {
                            type: "error",
                            msg: "Your balance must be zero to be able to claim faucet!"
                        })
                    }
                } else {
                    socket.emit("message", {
                        type: "error",
                        msg: `You need to wait ${Math.floor(((user.information(userId, "latestFaucet") + 60* 15 * 1000) - Date.now()) / 60000)} minutes before you can claim again!`
                    })
                }
            } else {
                socket.emit("message", {
                    type: "error",
                    msg: "Please reload the page!"
                })
            }
        } else {
            socket.emit("message", {
                type: "error",
                msg: `Not logged in!`
            })
        }
    })

    socket.on("faucetConnect", () => {
        const userId = user.getId(socket);
        if (userId) {
            socket.emit("faucetConnectResponse", {
                available: ((user.information(userId, "latestFaucet") + 60 * 60 * 1000) < Date.now())
            })
        }
    })


    socket.on("profile", () => {
        socket.emit("changePage", "profile");
        const userId = user.getId(socket);
        if (userId) {
            socket.emit("profileResponse", {
                username: user.information(userId, "username"),
                avatar: user.information(userId, "avatar"),
                balance: user.information(userId, "balance"),
                tradeurl: user.information(userId, "tradeurl"),
                transactions: user.information(userId, "transactions"),
                muted: user.information(userId, "muted"),
                gameHistory: user.information(userId, "gameHistory"),
                levelInfo: levelSystem.calcLevel(user.information(userId, "xp")),
            });
        }
    });

    socket.on("changeMuted", () => {
        const userId = user.getId(socket);
        if (userId) {
            user.update(userId, "muted", (user.information(userId, "muted") == 0 ? 1 : 0), 2);
            socket.emit("profileResponse", {
                username: user.information(userId, "username"),
                avatar: user.information(userId, "avatar"),
                balance: user.information(userId, "balance"),
                tradeurl: user.information(userId, "tradeurl"),
                transactions: user.information(userId, "transactions"),
                muted: user.information(userId, "muted"),
                levelInfo: levelSystem.calcLevel(user.information(userId, "xp")),
            });
        }
    });

    socket.on("userWallet", () => {
        CPayments.APIUserWallet(socket);
    });

    socket.on("userDepositLastDeposits", (type) => {
        CPayments.APIGetLast5Deposits(user.getId(socket), type, (deposits) => {
            let __deps = [];
            for(let x in deposits) {
                __deps.push({
                    time: new Date(parseInt(deposits[x].time)).toLocaleString(),
                    amount: parseFloat(deposits[x].amount/100).toFixed(2),
                    status: deposits[x].status
                });
            }
            socket.emit("userDeposits", __deps);
        });
    });

    socket.on("userGiftCard", (code) => {
        CPayments.APIUserUseGC(socket, code);
    });

    socket.on("disconnect", () => {
        user.delete(socket);
    });
})


app.post("/api/coinpayments", function(req, res) {
    CPayments.APICoinpayments(req, res);
});

app.get('/logout', function (req, res) {
  req.logout();
  res.redirect('/');
});

app.get('/auth/steam', passport.authenticate('steam'), function (req, res) {
  res.redirect('/')
});

app.get('/auth/steam/return',
  passport.authenticate('steam', {
    failureRedirect: '/'
  }),
  function (req, res) {
    res.redirect('/');
});

app.get("/dashboard", async (req, res) => {
  if (req.session && req.user && req.user.steamid) {
      await db.Query(`SELECT * FROM users WHERE steamid="${req.user.steamid}"`).then((row) => {
          if (row[0]) {
              if (Number(row[0].rank) > 3) {
                  console.log("User accessed dashboard: ", row[0].username);
                  res.sendFile(path.join(__dirname, '../panel/build', 'index.html'))
              } else {
                  res.redirect('/');
              }
          } else {
              res.redirect('/');
          }
      })
  }
});

app.use(express.static(path.join(__dirname, '../app/build')));
app.use(express.static(path.join(__dirname, '../panel/build')));

app.get("*", async (req, res) => {
  res.sendFile(path.join(__dirname, '../app/build', 'index.html'));
});

module.exports = app;