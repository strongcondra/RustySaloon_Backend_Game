const SteamTotp = require('steam-totp');
const SteamUser = require('steam-user');
const steamuserinfo = require('steam-userinfo');
const SteamCommunity = require('steamcommunity');
const TradeOfferManager = require('steam-tradeoffer-manager');
const axios = require('axios');
const request = require("request");

const yaml = require('js-yaml');
const fs = require('fs');

const proxy = require("./proxies");

require('dotenv').config({
    path: '../.env'
});

let withdrawableItems = [];
let withdrawPendingList = [];

let overstockConfig = yaml.load(fs.readFileSync("config/overstockList.yml", 'utf8'));

/**
 * A helper function to determine whether an item is overstocked 
 * or not based on it's market hash name.
 * 
 * @param {*} name The market hash name 
 * @param {*} count The amount the player wants to deposit
 * @returns Whether the item is overstocked
 */
function checkItemAmount(name, count){
        try {
            let max = overstockConfig.default;

            if(overstockConfig.items[name] != undefined){
                max = overstockConfig.items[name];
            }

            //Make sure the bot inventorys aren't empty
            if(withdrawableItems !== undefined && withdrawableItems != null){
                for(var i = 0; i < withdrawableItems.length; i++){

                    var item = withdrawableItems[i];

                    //make sure not null item in bot inv
                    if(item != undefined && item != null){

                        console.log(item);


                        if(item.market_hash_name == name){
                            count++;
                        }
                    }   
                }
            }
            
            let result = count >= max;

            return result;

        } catch(e) {
            console.log(e);
        }
} 

    
console.log('\x1b[36m%s\x1b[0m', "BOT IS STARTING");

const path = require("path");

const APPID = 252490;

const steamtradeEndpoint = "https://steamcommunity.com/tradeoffer/";

const referrals = require('./referrals');

const db = require("./db.js");
const user = require('./user');
const { formatWithOptions } = require('util');
const io = require('./io').io();

let priceFile = "priceList.json";
let apikey = "ylNVGGBhU6LCLeuzVnw6ip743zc";
let latestFetch = 0;

async function fetch_priceList() {

    
    await axios.get(`https://steamapis.com/market/items/${APPID}?api_key=${apikey}`).then((response) => {
        if (response.status != 200) {
            console.log(response);
            return
        };
        if (response) {
            if (response.data) {
                if (Array.isArray(response.data.data) && response.data.data.length > 1) {
                    var fetchedItems = response.data.data;

                    var prices = {};

                    for (let i = 0; i < fetchedItems.length; i++) {
                        prices[fetchedItems[i].market_hash_name] = {
                            price: Number(fetchedItems[i].prices.safe_ts.last_7d) == 0 ? (Number(fetchedItems[i].prices.safe_ts.last_30d)).toFixed(2) : (Number(fetchedItems[i].prices.safe_ts.last_7d)).toFixed(2),
                            name_color: fetchedItems[i].border_color
                        }
                    }

                    fs.writeFile(priceFile, '', function (err, res) {
                        if (err) console.log(err);
                    });
                    prices = JSON.stringify(prices).replace(/'/g, '');
                    fs.appendFile(priceFile, prices, function (err, response) {
                        if (err) console.log(err);
                    });

                    const currentBots = bots[currentDay];
                    let i = 0;
                    let botInterval = setInterval(() => {

                        if (Object.keys(bots[currentDay])[i]) {
                            bots[currentDay][Object.keys(bots[currentDay])[i]].fetchInventory(currentDay);
                            console.log("Fetching for", Object.keys(bots[currentDay])[i]);
                        }
                        i++;
                        if (i >= Object.keys(currentBots).length) {
                            clearInterval(botInterval);

                            setTimeout(() => {
                                withdrawInventory();
                            }, 6000);

                        }
                    }, 5000);

                    latestFetch = Date.now();


                } else {
                    console.log("Error fetching prices", response.data.data, Date.now());
                }
            }
        }
    });
}

setInterval(function () {
    console.log("Fetching new prices", Date.now());
    fetch_priceList()
}, (1000 * 60 * 60 * 2));

class Bot {
    constructor(username, password, shared_secret, identity_secret, steamid) {

        this.username = username;
        this.password = password;
        this.shared_secret = shared_secret
        this.identity_secret = identity_secret;
        this.steamid = steamid;

        this.cachedIv = [];

        this.tradeurl = "";

        this.pendingOffers = 0;
        this.offersToSend = [];

        this.pendingWithdraws = [];

        this.lastFetch = 0;

        this.lastFetchedInventory = 0;

        this.proxy = proxy.getProxy(); 

        this.client = new SteamUser({
            httpProxy: this.proxy
        });
        // this.client = new SteamUser();
        this.community = new SteamCommunity({ request: request.defaults({ proxy: this.proxy }) });
        // this.community = new SteamCommunity();
        this.manager = new TradeOfferManager({
            steam: this.client,
            community: this.community,
            language: 'en',
            cancelTime: 1000 * 5 * 60
        });

        this.client.on('webSession', (sessionId, cookies) => {
            this.manager.setCookies(cookies);
            this.community.setCookies(cookies);
            this.community.startConfirmationChecker(20000, this.identity_secret);

            this.offersToSend.map(offer => {
                this.makeOffer(offer.userInfo, offer.items);
            })
            this.pendingWithdraws.map(offer => {
                this.withdraw(offer.userInfo, offer.items);
            })
            this.offersToSend = [];
            this.pendingWithdraws = [];
        })

        this.client.setOption("promptSteamGuardCode", false);

        this.client.on('steamGuard', (domain, callback) => {
            setTimeout(() => {
                console.log("Steamguard for", this.steamid);
                var code = SteamTotp.generateAuthCode(this.shared_secret);
                callback(code);
            }, 10000)
        });

        this.client.on('error', (e) => {
            console.log("ERROR OCCURED", this.username);

            console.log(e);

            if (e !== "" && String(e).includes("Error: RateLimitExceeded")) {
                delete bots[currentDay][this.steamid];
                console.log("REMOVING BOTACCOUNT!");
            }
        });

        this.client.on('loggedOn', () => {
            console.log(this.username, "Successfully logged in!");
            this.client.setPersona(5);

            this.offersToSend.map(offer => {
                this.makeOffer(offer.userInfo, offer.items);
            })
            this.pendingWithdraws.map(offer => {
                this.withdraw(offer.userInfo, offer.items);
            })
            this.offersToSend = [];
            this.pendingWithdraws = [];
        })

        this.manager.on("sentOfferChanged", async (offer) => {
            handleOffer(offer, this.steamid);
        })

        this.manager.on("newOffer", async (offer) => {
            console.log("New offer, very good", offer);

            if (offer.itemsToGive.length == 0) {
                offer.accept();
            } else {
                console.log("SHITTY SHITTY OFFER");
            }

        })

    }


    getInfo() {
        return {
            username: this.username,
            password: this.password,
            shared_secret: this.shared_secret,
            identity_secret: this.identity_secret,
            steamid: this.steamid
        }
    }

    login(login) {
        setTimeout(() => {
            console.log(this.steamid, "Logging in!");

            if (this.client.steamID) {
                this.client.webLogOn();
                console.log(this.client.steamID, "WEBLOGON");
            } else {
                this.client.logOn({
                    accountName: this.username,
                    password: this.password,
                    twoFactorCode: SteamTotp.generateAuthCode(this.shared_secret)
                });
            }
        }, login ? 10 : 1200)
    }

    logout() {
        console.log("LOGOUT!");
        this.client.logOff();
        this.community.stopConfirmationChecker();
        this.loggedOn = false;
    }

    getManager() {
        return this.manager;
    }

    getCommunity () {
        return this.community;
    }

    async fetchInventory(day) {
        if ((this.lastFetchedInventory + 1000 * 60 * 0.1) < Date.now()) {
            let currentIv = await fetch_inventory(day, this.steamid, true);
            this.lastFetchedInventory = Date.now();
            console.log("Fetching bot iv", this.username);
            if (currentIv) {
                this.cachedIv = currentIv;
                return true;
            } else {
                console.log("false", this.username, "inventory fetch!");
                return false;
            }
        } else {
            setTimeout(() => {
                console.log("trying to fetch again!");
                this.fetchInventory();
            }, (1000 * 60 * 0.15));
            console.log("false", this.username, "inventory fetch! LASTLASTLASTLAST");
            return false;
        }
    }

    getInventory() {
        return this.cachedIv;
    }

    getHealthStatus(fetch) {
        if (fetch) {
            return (Number(Date.now()) - this.lastFetch);
        } else {
            return {
                trades: this.pendingOffers,
                items: this.cachedIv.length
            };
        }
    }

    async getTradeurl () {
        if (this.tradeurl == "") {
            return new Promise(async (resolve, reject) => {
                this.client.getTradeURL((err, callback) => {
                    this.tradeurl = callback.url;
                    resolve(this.tradeurl);
                })
            })
        } else {
            return this.tradeurl;
        }
    }

    updateFetch() {
        console.log("Fetched from bot", this.username);
        this.lastFetch = Date.now();
    }

    removeFromPending() {
        console.log("Removing from pending", this.username, this.steamid, this.pendingOffers);
        if (this.pendingOffers > 0) {
            this.pendingOffers--;
        } else {
            console.log("Bot is having negative thoughts!", this.username, this.steamid);
        }
    }


    async makeOffer(userInfo, items) {

        const securityCode = Math.random().toString(36).substring(2);
        if (userInfo.tradeurl != "" && userInfo.tradeurl != null) {
            userInfo.tradeurl = userInfo.tradeurl.trim();
            const offer = this.manager.createOffer(userInfo.tradeurl);
            let offerItems = [];
            let sum = 0;

            console.log("Creating offer", this.username);

            items.map(item => {
                offerItems.push({
                    appid: APPID,
                    contextid: 2,
                    assetid: item.assetid
                });
                sum += Number(item.price);
            })

            offer.addTheirItems(offerItems);
            offer.setMessage(`Please verify security code : ${securityCode}`);
            offer.send(async (err, status) => {
                if (err) console.log(err);
                if (err !== "" && String(err).includes("Error: Not Logged In")) {
                    console.log("WE ARE NOT LOGGED IN! TRYING TO LOG IN AGAIN.");

                    this.offersToSend.push({
                        userInfo: userInfo,
                        items: items
                    });

                    this.login();

                    return;
                } else if (err !== "" && String(err).includes("Please try again later. (26)")) {
                    console.log("ERROR 26!");
                    user.sendMsg(userInfo.id, {
                        type: "error",
                        msg: "Tradeerror 26!"
                    });

                    for (var i = 0; i < offerItems.length; i++) {
                        var index = withdrawPendingList.indexOf(offerItems[i].assetid);
                        if (index != -1) {
                            withdrawPendingList.splice(index, 1);
                        }
                    }

                    console.log("WithdrawPendingList", withdrawPendingList);

                    io.emit("requestInventoryResponse", {
                        iv: withdrawableItems,
                        type: "bot",
                        pending: withdrawPendingList
                    });

                    return;
                }
                if (!err) {

                    console.log("Offer sent", this.username);

                    user.sendToUser(userInfo.id, "depositOfferCallback", {
                        securityCode: securityCode,
                        link: steamtradeEndpoint + offer.id,
                        items: items,
                    });
                    user.update(userInfo.id, "lastDeposit", Date.now(), 2);

                    this.pendingOffers++;

                    let newIv = await fetch_inventory(currentDay, userInfo.steamid, false, this.steamid);
                    this.updateFetch();
                    if (!Array.isArray(newIv)) newIv = [];
                    user.update(userInfo.id, "inventory", newIv, 0);
                    user.sendToUser(userInfo.id, "requestInventoryResponse", {
                        iv: newIv,
                        bonus: getUsername(userInfo.steamid)
                    });

                    await db.Query(`INSERT INTO tradeoffers (user, userId, items, offerid, value, status) VALUES ('${JSON.stringify(userInfo)}', '${userInfo.id}', '${JSON.stringify(items)}', "${offer.id}", "${sum}", "pending")`);

                } else {
                    console.log("[TRADE ERROR] user tries to deposit faulty items");
                    let newIv = await fetch_inventory(currentDay, userInfo.steamid, false, this.steamid);
                    this.updateFetch();
                    if (!Array.isArray(newIv)) newIv = [];
                    user.update(userInfo.id, "inventory", newIv, 0);
                    user.sendToUser(userInfo.id, "requestInventoryResponse", {
                        iv: newIv,
                        bonus: getUsername(userInfo.steamid)
                    });
                }
            });
        } else {
            user.sendMsg(userInfo.id, {
                type: "error",
                msg: "Change your tradeurl!"
            });
            return;
        }
    }

    async withdraw(userInfo, items, cost, multipleTrades) {
        var securityCode = Math.random().toString(36).substring(2);
        var Uoffer = this.manager.createOffer(userInfo.tradeurl);
        var itemsToSend = [];

        // GO THROUGH LIST AND CHECK FOR ITEMS

        console.log("Withdraw handled", this.username);
        for (var i = 0; i < items.length; i++) {
            itemsToSend[i] = {
                appid: APPID,
                contextid: 2,
                assetid: items[i].assetid
            }
        }

        console.log(itemsToSend);

        console.log("Cost for items", cost);

        Uoffer.addMyItems(itemsToSend);
        Uoffer.setMessage(`Code:${securityCode}. GLHF with your new skins!`);

        return Uoffer.send(async (err, status) => {

            if (status == "pending") {
                console.log(err, "err");

                if (err !== "" && String(err).includes("Error: Not Logged In")) {
                    console.log("WE ARE NOT LOGGED IN! TRYING TO LOG IN AGAIN.");

                    this.pendingWithdraws.push({
                        userInfo: userInfo,
                        items: items,
                        cost: cost
                    });

                    this.login();
                    return;
                } else if (err !== "" && String(err).includes("Please try again later. (26)")) {
                    console.log("ERROR 26!");
                    user.sendMsg(userInfo.id, {
                        type: "error",
                        msg: "Item error 26. Contact support"
                    });

                    user.update(userInfo.id, "balance", cost, 3);
                    user.update(userInfo.id, "withdrawableBalance", (cost * 100), 3);

                    for (var i = 0; i < itemsToSend.length; i++) {
                        var index = withdrawPendingList.indexOf(itemsToSend[i].assetid);
                        if (index != -1) {
                            withdrawPendingList.splice(index, 1);
                        }
                    }

                    console.log("WithdrawPendingList", withdrawPendingList);

                    await this.fetchInventory(currentDay);
                    console.log("WE ARE REFETCHING INVENTORY FOR BOT", this.username, "Error 26 has occured!");
                    withdrawInventory();


                    io.emit("requestInventoryResponse", {
                        iv: withdrawableItems,
                        type: "bot",
                        pending: withdrawPendingList
                    });

                    return false;
                }

                user.sendMsg(userInfo.id, {
                    type: "info",
                    msg: "Generating tradeoffer"
                })

                // setTimeout(() => {
                    this.community.acceptConfirmationForObject(this.identity_secret, Uoffer.id, function (err, result) {
                        console.log(err, "err");

                        if (!multipleTrades) {
                            user.sendToUser(userInfo.id, "withdrawResponse", {
                                cost: Number(cost),
                                steamid: userInfo.steamid,
                                url: (steamtradeEndpoint + Uoffer.id),
                                items: items,
                            })
                        }
                        user.sendMsg(userInfo.id, {
                            type: "info",
                            msg: "If the trade does not show up within 10 seconds, Check your tradeoffers on Steam!"
                        })

                        console.log(result, "result");
                    })
                // }, 1000)


                


                this.pendingOffers++;

                console.log("ITEM/s HAS BEEN WITHDRAWN!");
                console.log(status);
                await db.Query(`INSERT INTO tradeoffers (user, userId, items, offerid, value, status, withdraw) VALUES ('${JSON.stringify(userInfo)}', '${userInfo.id}', '${JSON.stringify(itemsToSend)}', "${Uoffer.id}", "${cost}", "pending", "1")`);

                return true;
            } else {

                console.log("error", userInfo.id, err, status);
                // REMOVE TRADEURL FROM USER

                user.sendMsg(userInfo.id, {
                    type: "error",
                    msg: "Problem sending trade. You have been refunded!"
                });

                user.update(userInfo.id, "balance", cost, 3);
                user.update(userInfo.id, "withdrawableBalance", (cost * 100), 3);

                for (var i = 0; i < itemsToSend.length; i++) {
                    var index = withdrawPendingList.indexOf(itemsToSend[i].assetid);
                    if (index != -1) {
                        withdrawPendingList.splice(index, 1);
                    }
                }

                io.emit("requestInventoryResponse", {
                    iv: withdrawableItems,
                    type: "bot",
                    pending: withdrawPendingList
                });

                await db.Query(`INSERT INTO tradeoffers (user, userId, items, offerid, value, status, withdraw) VALUES ('${JSON.stringify(userInfo)}', '${userInfo.id}', '${JSON.stringify(itemsToSend)}', "badUrl", "${cost}", "fail", "1")`);

                return false;
            }
        });
    }
}

const botDepositMultiplier = 1.2;
const userDepositMultiplier = 1;
// FETCHES 
function fetch_price(item, bot) {
    return new Promise(async function (resolve, reject) {
        var output = {};
        fs.readFile(priceFile, 'utf8', function (err, data) {
            if (err) console.log(err);
            data = isJsonString(data) ? JSON.parse(data) : {};
            if (Object.keys(data).length > 0) {
                for (var i = 0; i < item.length; i++) {
                    if (data[item[i]] && data[item[i]].price) {
                        data[item[i]].price = (Number(data[item[i]].price) * Number(bot == true ? botDepositMultiplier : userDepositMultiplier)).toFixed(2);
                        output[item[i]] = data[item[i]];
                    }
                }
            }

            resolve(output);
        });
    })
};


let fetch_inventory = async (day, steamid, bot, botSteamid) => {
    console.log("[INVENTORY] Refreshing");

    return new Promise(function (resolve, reject) {

        // NEW API, FETCHING ITEMS FROM STEAMAPIS API.

        let inv_steamid = steamid;

        console.log(`fetch_inventory debug:`, day, steamid, bot, botSteamid);

        if(!inv_steamid || inv_steamid == undefined) return resolve(false);

        axios.get(`https://steamapis.com/steam/inventory/${inv_steamid}/252490/2?api_key=ylNVGGBhU6LCLeuzVnw6ip743zc`).then(async response => {

            if(response.status != 200) {
                console.error(`Status not 200!`);
                resolve(false);
                return;
            }
            
            if(response.data && response.data.assets && response.data.descriptions) {

                let { assets, descriptions } = response.data;

                let items = [];
                let priceList = [];

                // Load prices for specific items
                for(pitem of assets) {
                    let item = descriptions.filter( itemul => itemul.classid == pitem.classid )[0];
                    if(!priceList.includes(item.market_hash_name)) priceList.push(item.market_hash_name);
                }

                let prices = await fetch_price(priceList, bot);
                // 

                for(let x in assets) {
                    let itemv = assets[x];
                    let item = descriptions.filter( itemul => itemul.classid == itemv.classid )[0];
                    
                    if(!item.tradable) continue;

                    let minDep = 0.01;
                    console.log(prices);
                    if(!prices.hasOwnProperty(item.market_hash_name) || Number(prices[item.market_hash_name].price) < minDep) continue;

                    let price = Number(prices[item.market_hash_name].price);
                    price = (!bot && price <= 1) ? (price * 0.5) : price;

                    let props = {
                        market_hash_name: item.market_hash_name,
                        image: item.icon_url,
                        assetid: itemv.assetid,
                        steamid: inv_steamid,
                        color: `#${prices[item.market_hash_name].name_color}`,
                        amount: itemv.amount,
                        price: Math.floor( price * 100 ) / 100
                    };

                    items.push(props);
                }
                resolve(items);

            } else resolve(false);

        }).catch(error => {
            console.error(error);
            console.log("ERROR - Something went wrong. " + error);
            resolve(false);
            return;
        });

        // OLD FETCH INVENTORY THROUGH BOTS.
        // bots[day][bot ? steamid : botSteamid].getManager().getUserInventoryContents(steamid, APPID, 2, true, async (error, inventory) => {
        //     if (error) {
        //         console.log("ERROR - Something went wrong. " + error);
        //         resolve(false);
        //         return;
        //     }
        //     if (inventory.length > 0) {
        //         inventory = JSON.stringify(inventory).replace(/'/g, '');
        //         inventory = JSON.parse(inventory);
        //         var items = [];
        //         var priceList = [];
        //         for (var i = 0; i < inventory.length; i++) {
        //             if (!priceList.includes(inventory[i].market_hash_name)) {
        //                 priceList.push(inventory[i].market_hash_name);
        //             }
        //         }
        //         var prices = await fetch_price(priceList, bot);
        //         for (var i = 0; i < inventory.length; i++) {
        //             if (inventory[i].tradable) {

        //                 if (prices[inventory[i].market_hash_name]) {

        //                     var minDep = 0.01;

        //                     if (Number(prices[inventory[i].market_hash_name].price) >= minDep) {

        //                         let price = Number(prices[inventory[i].market_hash_name].price);
        //                         price = (!bot && price <= 1) ? (price * 0.5) : price;
        //                         items.push({
        //                             market_hash_name: inventory[i].market_hash_name,
        //                             image: inventory[i].icon_url,
        //                             assetid: inventory[i].assetid,
        //                             steamid: (bot ? steamid : botSteamid),
        //                             color: `#${prices[inventory[i].market_hash_name].name_color}`,
        //                             amount: inventory[i].amount,
        //                             price: Math.floor(price * 100) / 100,
        //                         });
        //                     }
        //                 }
        //             }
        //         }
        //         resolve(items);
        //     } else {
        //         resolve(false);
        //     }
        // })
    })
}

let isJsonString = (str) => {
    try {
        JSON.parse(str);
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * Gets the username of a user from a steam id and checks
 * to see if they contain rustysaloon.com in their name
 * @param {*} steamid the steam id of the user
 * @returns whether they contain rusty saloon in their name or not
 */
let getUsername = async (steamid) => {
    return await axios.get(`https://steamapis.com/steam/profile/${steamid}?api_key=${apikey}`).then((response) => {
        if (response && response.data) {
            try
            {
                if (response.data.name) {
                    return String(response.data.name).toUpperCase().includes("RUSTYSALOON.COM");
                } else {
                    return user.information(userId, "steamid").toUpperCase().includes("RUSTYSALOON.COM");
                }
            } catch {
                return user.information(userId, "steamid").toUpperCase().includes("RUSTYSALOON.COM");
            }
            
        } else {
            return false;
        }
    })
}

let withdrawItemResponse = async (data, botSteamid) => {
    if (data.state == "REFUND") {
        user.update(data.userId, "balance", (Math.round(Number(data.value) * 100) / 100), 3);
        user.update(data.userId, "withdrawableBalance", (Math.round(Number(data.value) * 100)), 3);
        user.sendMsg(data.userId, {
            type: "info",
            msg: "You have been refunded"
        });
    }

    for (var i = 0; i < data.items.length; i++) {
        var index = withdrawPendingList.indexOf(data.items[i].assetid);
        if (index != -1) {
            withdrawPendingList.splice(index, 1);
        }
    }

    console.log("WithdrawPendingList", withdrawPendingList);

    if (data.state == "CONFIRMED") {
        await bots[currentDay][botSteamid].fetchInventory(currentDay);
    }
    withdrawInventory();
}

let offerCallback = async (data) => {
    if (data.state == "CONFIRMED") {

         let bonus = getUsername(user.information(data.user.id, "steamid"));

         if(bonus) {
            user.update(data.user.id, "balance", (Math.round((data.value * 1.1) * 100) / 100), 3);
         } else {
            user.update(data.user.id, "balance", (Math.round((data.value) * 100) / 100), 3);
        }

        


        user.sendMsg(data.user.id, {
            type: "success",
            msg: `Your transaction is confirmed! ${Math.round((data.value) * 100) / 100}`
        })

        // Affiliate! 
        referrals.addBalance({
            id: data.user.id,
            value: (Math.round((data.value) * 100))
        });


    } else if (data.state == "DENIED") {
        console.log("BAD TRADEOFFER!");
        user.sendMsg(data.user.id, {
            type: "error",
            msg: "Your tradeoffer was not confirmed!"
        })
    }
};

let handleOffer = async (offer, botSteamid) => {
    await db.Query(`SELECT * FROM tradeoffers WHERE offerid="${offer.id}" AND status="pending"`).then(async (response) => {
        if (response[0]) {
            if (response[0].withdraw == 1) {
                if (offer.state == 3) {
                    withdrawItemResponse({
                        state: "CONFIRMED",
                        value: parseFloat(response[0].value),
                        items: isJsonString(response[0].items) ? JSON.parse(response[0].items) : response[0].items,
                    }, botSteamid);
                    await db.Query(`UPDATE tradeoffers SET status="ACCEPTED" WHERE offerid="${offer.id}"`);

                    let userId = JSON.parse(response[0].user).id;
                    await db.Query(`SELECT transactions FROM users WHERE id="${userId}"`).then(async (row) => {
                        if (row[0] && row[0].transactions) {
                            let transactions = JSON.parse(row[0].transactions);
                            if (!Array.isArray(transactions)) {
                                transactions = [];
                            }
                            transactions.push({
                                type: "withdraw",
                                amount: Number(response[0].value).toFixed(2),
                                timestamp: Date.now(),
                            })
                            user.update(userId, "transactions", transactions, 0);
                            await db.Query(`UPDATE users SET transactions='${JSON.stringify(transactions)}' WHERE id="${userId}"`);
                        }
                    })
                } else if (offer.state == 2) {} else {

                    const userId = isJsonString(response[0].user) ? JSON.parse(response[0].user).id : response[0].user.id;
                    if (offer.state == 4) {
                        user.sendMsg(userId, {
                            type: "error",
                            msg: "Trade failed - Tampering"
                        })
                        withdrawItemResponse({
                            state: "REFUND",
                            value: parseFloat(response[0].value),
                            items: isJsonString(response[0].items) ? JSON.parse(response[0].items) : response[0].items,
                            steamid: isJsonString(response[0].user) ? JSON.parse(response[0].user).steamid : response[0].user.steamid,
                            userId: userId
                        });

                        console.log("USER TRIES TO TAMPER WITH THE TRADES!", userId);

                    }
                    if (offer.state > 4 && offer.state <= 9) {
                        console.log("Refunding player!");
                        withdrawItemResponse({
                            state: "REFUND",
                            value: parseFloat(response[0].value),
                            items: isJsonString(response[0].items) ? JSON.parse(response[0].items) : response[0].items,
                            steamid: isJsonString(response[0].user) ? JSON.parse(response[0].user).steamid : response[0].user.steamid,
                            userId: userId
                        });
                    } else {
                        withdrawItemResponse({
                            state: "DENIED",
                            items: isJsonString(response[0].items) ? JSON.parse(response[0].items) : response[0].items
                        });

                    }
                    await db.Query(`UPDATE tradeoffers SET status="DENIED" WHERE offerid="${offer.id}"`);
                }
                console.log("Withdraw item!");

            } else {
                var sum = parseFloat(response[0].value);
                var userInfo = isJsonString(response[0].user) ? JSON.parse(response[0].user) : response[0].user;
                var items = isJsonString(response[0].items) ? JSON.parse(response[0].items) : response[0].items;

                if (offer.state == 3) {
                    if (response[0].status == "pending") {
                        console.log("Good offer");

                        await db.Query(`UPDATE tradeoffers SET status="ACCEPTED" WHERE offerid="${offer.id}"`);

                        offerCallback({
                            state: "CONFIRMED",
                            user: userInfo,
                            value: sum,
                        });
                        let newIv = await fetch_inventory(currentDay, (userInfo.steamid), false, botSteamid);
                        bots[currentDay][botSteamid].updateFetch();
                        user.update(userInfo.id, "inventory", newIv, 0);
                        user.sendToUser(userInfo.id, "requestInventoryResponse", {
                            iv: newIv,
                            bonus: getUsername(userInfo.steamid)
                        });

                        await bots[currentDay][botSteamid].fetchInventory(currentDay);

                        withdrawInventory();

                        let userId = userInfo.id;

                        console.log("id dada", userId);

                        await db.Query(`SELECT transactions FROM users WHERE id="${userId}"`).then(async (row) => {
                            if (row[0] && row[0].transactions) {
                                let transactions = JSON.parse(row[0].transactions);
                                if (!Array.isArray(transactions)) {
                                    transactions = [];
                                }
                                transactions.push({
                                    type: "deposit",
                                    amount: Number(response[0].value).toFixed(2),
                                    timestamp: Date.now(),
                                })
                                user.update(userId, "transactions", transactions, 0);
                                await db.Query(`UPDATE users SET transactions='${JSON.stringify(transactions)}' WHERE id="${userId}"`);
                            }
                        })
                    } else {
                        console.log("Offer", offer.id, "Already handled for user", userInfo);
                    }


                } else if (offer.state == 2) {

                } else {
                    console.log("[bot tradeoffer changed] Received bad tradeoffer status.", offer.state);
                    await db.Query(`UPDATE tradeoffers SET status="BAD" WHERE offerid="${offer.id}"`);
                    offerCallback({
                        state: "DENIED",
                        user: userInfo,
                        items: items,
                        value: sum,
                    });
                }
            }
            if (offer.state != 2) {
                bots[currentDay][botSteamid] ? bots[currentDay][botSteamid].removeFromPending() : "";
            }
        } else {
            console.log("Tradeoffer was not found.");
        }
    })
}


let date = new Date();

let currentDay = date.getDay();

const tradeUrls = {
    "76561198212734111": "https://steamcommunity.com/tradeoffer/new/?partner=172967722&token=z-KUTccY",
    "76561199023967895": "https://steamcommunity.com/tradeoffer/new/?partner=1063702167&token=qJngQdxK",
    "76561199022570016": "https://steamcommunity.com/tradeoffer/new/?partner=1062304288&token=_8UWFtyu",
    "76561199023769291": "https://steamcommunity.com/tradeoffer/new/?partner=1063503563&token=XV1UdDSD",
    "76561199022938522": "Don't use this one, its bugged",
    "76561199023996907": "https://steamcommunity.com/tradeoffer/new/?partner=1063731179&token=AIzTGGrr",
    "76561199023865982": "https://steamcommunity.com/tradeoffer/new/?partner=1063600254&token=zXW6TxTG",
    "76561199022933469": "https://steamcommunity.com/tradeoffer/new/?partner=1062667741&token=5Kdoa1WU",
    "76561199022859094": "https://steamcommunity.com/tradeoffer/new/?partner=1062593366&token=tufjybEk",
    "76561199022652554": "https://steamcommunity.com/tradeoffer/new/?partner=1063731179&token=AIzTGGrr",
    "76561199072137171": "https://steamcommunity.com/tradeoffer/new/?partner=1111871443&token=-4uR2bXR",
    "76561199072156602": "https://steamcommunity.com/tradeoffer/new/?partner=1111890874&token=KhUWGS72",
    "76561199071970403": "https://steamcommunity.com/tradeoffer/new/?partner=1111704675&token=WsRKCHpC",
    "76561199072100414": "https://steamcommunity.com/tradeoffer/new/?partner=1111834686&token=GD7vEyZX",
    "76561199072135673": "https://steamcommunity.com/tradeoffer/new/?partner=1111869945&token=A5UcWPY0",
    "76561199072378357": "https://steamcommunity.com/tradeoffer/new/?partner=1112112629&token=FJHYVSO-",
    "76561199072365822": "https://steamcommunity.com/tradeoffer/new/?partner=1112100094&token=ugVJfPZH",
    "76561199072166347": "https://steamcommunity.com/tradeoffer/new/?partner=1111900619&token=_r5uhTl4",
    "76561199072202112": "https://steamcommunity.com/tradeoffer/new/?partner=1111936384&token=27i1WMl_",
    "76561199072337163": "https://steamcommunity.com/tradeoffer/new/?partner=1112071435&token=f3UBX_Vy",
    "76561199072104206": "https://steamcommunity.com/tradeoffer/new/?partner=1111838478&token=N_w6f16J",
    "76561199072087217": "https://steamcommunity.com/tradeoffer/new/?partner=1111821489&token=0Sgorhds",
    "76561199072087430": "https://steamcommunity.com/tradeoffer/new/?partner=1111821702&token=jn3noOF7",
    "76561199072295575": "https://steamcommunity.com/tradeoffer/new/?partner=1112029847&token=XYqsiyfi",
    "76561199072293746": "https://steamcommunity.com/tradeoffer/new/?partner=1112028018&token=0kOrtq-V",
    "76561199072234055": "https://steamcommunity.com/tradeoffer/new/?partner=1111968327&token=r7FotI2e",
    "76561199072227152": "https://steamcommunity.com/tradeoffer/new/?partner=1111961424&token=2ijbjNPC",
    "76561199072127919": "https://steamcommunity.com/tradeoffer/new/?partner=1111862191&token=MQI2oWbZ",
    "76561199072587284": "https://steamcommunity.com/tradeoffer/new/?partner=1112321556&token=zOthTjps",
    "76561199072105530": "https://steamcommunity.com/tradeoffer/new/?partner=1111839802&token=Ivrfeosx"
}

async function addBot(filename, localBots) {
    return new Promise(async function (resolve, reject) {
        fs.readFile(path.join(__dirname, "./config/bots/") + filename, 'utf-8', function (err, content) {

            if (err) {
                console.log(err);
                return;
            }
            if (filename.includes(".maFile")) {
                var botInfo = JSON.parse(content);

                let username = filename.split(".maFile")[0];

                if (!localBots[username]) {
                    localBots[username] = {}
                }
                localBots[username].steamid = botInfo.Session.SteamID;
                localBots[username].shared_secret = botInfo.shared_secret
                localBots[username].identity_secret = botInfo.identity_secret

            } else if (filename.includes("INFO")) {
                let array = content.split("\r\n");
                console.log(array);
                array.map((row) => {
                    if (row) {
                        let username = row.split(":")[0].trim();
                        if (!localBots[username]) {
                            localBots[username] = {}
                        }
                        localBots[username].username = username;
                        localBots[username].password = row.split(":")[1].trim();
                    }
                })
            }
            resolve(localBots);
        })
    })
}

let fetchBots = async () => {
    let localBots = {};
    return new Promise(async function (resolve, reject) {

        console.log("hello");


        fs.readdir(path.join(__dirname, "./config/bots/"), async (err, filenames) => {

            if (err) {
                console.log(err);
                return;
            }

            for (var i = 0; i < filenames.length; i++) {
                localBots = await addBot(filenames[i], localBots);
            }

            resolve(localBots);
        })

    });
}
let bots = [];
const botAmount = 3;
let setupBots = async () => {
    if (process.env.TESTMODE == "false") {
        let localBots = await fetchBots();

        let correctBots = [];
        for (let bot in localBots) {
            if (!correctBots[correctBots.length - 1] || Object.keys(correctBots[correctBots.length - 1]).length >= botAmount) {
                correctBots.push({});
            }
            correctBots[correctBots.length - 1][localBots[bot].steamid] = {
                username: localBots[bot].username,
                password: localBots[bot].password,
                shared_secret: localBots[bot].shared_secret,
                identity_secret: localBots[bot].identity_secret,
                steamid: localBots[bot].steamid
            };
        }


        for (var i = correctBots.length; i < 7; i++) {
            correctBots.push(correctBots[i - 2]);
        }


        bots = correctBots;
    } else {
        bots = [
            {
                "76561198212734111": {
                    username: "wizardtheother",
                    password: "Lucas1337",
                    shared_secret: "NtDL7zTMfjHYiuMqkfMQxrUmfoY=",
                    identity_secret: "TPE0U2ukPi3y69UpZ/llun+QFVg=",
                    steamid: "76561198212734111"
                }
            },
            {
                "76561198212734111": {
                    username: "wizardtheother",
                    password: "Lucas1337",
                    shared_secret: "NtDL7zTMfjHYiuMqkfMQxrUmfoY=",
                    identity_secret: "TPE0U2ukPi3y69UpZ/llun+QFVg=",
                    steamid: "76561198212734111"
                }
            },
            {
                "76561198212734111": {
                    username: "wizardtheother",
                    password: "Lucas1337",
                    shared_secret: "NtDL7zTMfjHYiuMqkfMQxrUmfoY=",
                    identity_secret: "TPE0U2ukPi3y69UpZ/llun+QFVg=",
                    steamid: "76561198212734111"
                }
            },
            {
                "76561198212734111": {
                    username: "wizardtheother",
                    password: "Lucas1337",
                    shared_secret: "NtDL7zTMfjHYiuMqkfMQxrUmfoY=",
                    identity_secret: "TPE0U2ukPi3y69UpZ/llun+QFVg=",
                    steamid: "76561198212734111"
                }
            },
            {
                "76561198212734111": {
                    username: "wizardtheother",
                    password: "Lucas1337",
                    shared_secret: "NtDL7zTMfjHYiuMqkfMQxrUmfoY=",
                    identity_secret: "TPE0U2ukPi3y69UpZ/llun+QFVg=",
                    steamid: "76561198212734111"
                }
            },
            {
                "76561198212734111": {
                    username: "wizardtheother",
                    password: "Lucas1337",
                    shared_secret: "NtDL7zTMfjHYiuMqkfMQxrUmfoY=",
                    identity_secret: "TPE0U2ukPi3y69UpZ/llun+QFVg=",
                    steamid: "76561198212734111"
                }
            },
            {
                "76561198212734111": {
                    username: "wizardtheother",
                    password: "Lucas1337",
                    shared_secret: "NtDL7zTMfjHYiuMqkfMQxrUmfoY=",
                    identity_secret: "TPE0U2ukPi3y69UpZ/llun+QFVg=",
                    steamid: "76561198212734111"
                }
            }
        ]
    }


    fetch_priceList();

    await proxy.storeProxyList();

    setup();
}
setupBots();


// DISABLED BOT ROTATION

// setInterval(async () => {
//     let date = new Date();
//     let current = date.getDay();

//     if (current != currentDay) {

//         const beforeDay = currentDay;

//         setTimeout(() => {
//             console.log("Logging out bots!", beforeDay);
//             for (var bot in bots[beforeDay]) {
//                 bots[beforeDay][bot].logout();
//                 bots[beforeDay][bot] = bots[beforeDay][bot].getInfo();
//             }
//         }, 1000 * 60 * 10);

        
//         currentDay = current; // getMinutes
//         console.log("Changing active bots!", currentDay);

//         await proxy.refreshProxyList().then(() => {
//             setTimeout(async () => {
//                 console.log("Yoohooo, timeout out!");
//                 await proxy.storeProxyList().then(() => {
//                     console.log("IN CALLBACK FOR STOREPROXYLIST");
//                     setup();

//                     setTimeout(() => {
//                         console.log("Fetching new iv for bots");
//                         sendItems(beforeDay, currentDay);
//                         withdrawInventory();
//                     }, 1000 * 10);
//                 });
//             }, 5000);
//         })
//     }
// }, 1000 * 60 * 1);




let sendItems = async (from, to) => {

    console.log("Sending items!", from, to);
    for (let bot in bots[from]) {
        console.log("Trying to fetch iv");
        await bots[from][bot].fetchInventory(from);
        console.log("Fetched");
        let iv = bots[from][bot].getInventory();
        console.log("Fetched iv", iv.length);

        let takenItemNames = [];
        let tradeItems = [];

        for (var i = 0; i < iv.length; i++) {
            // if (Number(iv[i].price) > 0 && !takenItemNames.includes(iv[i].market_hash_name)) {
                // takenItemNames.push(iv[i].market_hash_name);
                if(!withdrawPendingList.includes(iv[i].assetid)) {
                    tradeItems.push({
                        appid: APPID,
                        contextid: 2,
                        assetid: iv[i].assetid
                    });
                } else {
                    console.log(iv[i], "Taken from things");
                }
            // }
        }
        console.log(tradeItems.length, "tradeItems");

        if (tradeItems.length > 0) {
            console.log("Sending from bot", bot, tradeItems.length);

            // SendItems to new bot!

            let botSteamid = callDoctor(false);
            if (botSteamid) {
                let tradeurl = await bots[to][botSteamid].getTradeurl();
                console.log("Got real tradeurl for ", botSteamid, tradeurl);

                var Uoffer = bots[from][bot].getManager().createOffer(tradeurl);
                
                console.log(tradeItems);

                Uoffer.addMyItems(tradeItems);
                Uoffer.setMessage(`Transfer between accounts`);

                Uoffer.send(async (err, status) => {

                    console.log(err, "err");
                    if (Uoffer.id != null) {

                        bots[from][bot].getCommunity().acceptConfirmationForObject(bots[from][bot].getInfo().identity_secret, Uoffer.id, function (err, result) {
                            console.log(err, "err");

                            console.log("ACCEPTING TRADEOFFER FOR BOT TRANSFER!");
    
                            console.log(result, "result");
                        })

                        if (err !== "" && String(err).includes("Error: Not Logged In")) {
                            console.log("WE ARE NOT LOGGED IN! TRYING TO LOG IN AGAIN.");
                            return;
                        }
                    } else {
                        console.log("ERROR SENDING THIS TRADEOFFER!");
                    }
                })
            } else {
                console.log("NO BOT TO SEND TO - TRANSFER");
            }
        } else {
            console.log(iv);
        }
    }
}

async function setup() {
    for (var bot in bots[currentDay]) {
        const botInfo = bots[currentDay][bot];

        bots[currentDay][bot] = new Bot(botInfo.username, botInfo.password, botInfo.shared_secret, botInfo.identity_secret, botInfo.steamid)

        bots[currentDay][bot].login(true);
    }
}


/**
 * Updates the bots withdrawable items 
 * from fetching each inventory and settings
 * the withdrawableItems variable
 */
let withdrawInventory = async () => {
    let tempAllItems = [];

    let currentBot = callDoctor(true); // längst tid från senaste fetch!

    for (var bot in bots[currentDay]) {
        let botItems = bots[currentDay][bot].getInventory();
        tempAllItems = tempAllItems.concat(botItems);
    }
    withdrawableItems = tempAllItems;
    io.emit("requestInventoryResponse", {
        iv: withdrawableItems,
        type: "bot",
        pending: withdrawPendingList
    });
}

function callDoctor(fetch) {

    let fittest = {
        steamid: "none",
        trades: fetch ? (1000 * 60 * 0.3) : 25,
        inventoryItems: 1999
    };

    for (var bot in bots[currentDay]) {
        let health = bots[currentDay][bot].getHealthStatus(fetch);
        console.log("health", health, bot);

        if ((fetch && health > fittest.trades) || (!fetch && health.trades < fittest.trades) || ((!fetch && health.trades == fittest.trades && fittest.inventoryItems > health.items))) {
            fittest = {
                steamid: bot,
                trades: fetch ? health : health.trades,
                inventoryItems: health.items,
            }
        };
    }
    console.log("Fittest", fittest);

    if (fittest.steamid == "none") {
        return false;
    } else {
        return fittest.steamid
    }
}

// USER STUFF
const regex = /steamcommunity\.com\/tradeoffer\/new\/\?partner=[0-9]*&token=[a-zA-Z0-9_-]*/i;
let validTradeurl = (url) => {
    return (regex.test(url));
}

io.sockets.on("connection", function (socket) {
    socket.on("requestInventory", async function () {
        const userId = user.getId(socket);
        if (userId) {
            // CACHE THIS SHIIIT
            let userInventory = user.information(userId, "inventory");
            if (userInventory == false || user.information(userId, "lastFetch") <= latestFetch) {

                user.update(userId, "lastFetch", Date.now(), 0);
                let bot = callDoctor(true); // längst tid från senaste fetch!
                // if (bot) {
                    await fetch_inventory(currentDay, user.information(userId, "steamid"), false, bot).then((inventory) => {

                        bots[currentDay][bot] ? bots[currentDay][bot].updateFetch() : "";

                        if (!Array.isArray(inventory)) inventory = [];
                        user.update(userId, "inventory", inventory, 0);
                        socket.emit("requestInventoryResponse", {
                            iv: inventory,
                            bonus: getUsername(user.information(userId, "steamid"))
                        });
                    });
                // } else {
                //     socket.emit("message", {
                //         type: "error",
                //         msg: "Bot is overworked!"
                //     });
                // }
            } else {
                socket.emit("requestInventoryResponse", {
                    iv: userInventory
                });
            }
        } else {
            socket.emit("message", {
                type: "error",
                msg: "You are not logged in!"
            });
        }
    })

    socket.on("requestBotInventory", async function () {
        io.emit("requestInventoryResponse", {
            iv: withdrawableItems,
            type: "bot",
            pending: withdrawPendingList
        });
        // CACHE FUNKTION --> Spara inventory
    });

    socket.on("getTradeUrl", () => {
        const userId = user.getId(socket);
        if (userId) {
            socket.emit("getTradeUrlResponse", user.information(userId, "tradeurl"));
        } else {
            socket.emit("message", {
                type: "error",
                msg: "You are not logged in!"
            });
        }
    });

    socket.on("requestWithdraws", () => {
        const userId = user.getId(socket);
        if (userId) {
            if (user.information(userId, "rank") > 1) {
                socket.emit("activeSTEAMWithdraws", activeWithdrawals);
            }
        }

    })

    socket.on("enterTradeurl", function (url) {
        const userId = user.getId(socket);
        if (userId) {
            if (url != "" && url.trim().split(" ").length == 1 && url.trim().length <= 77) {

                console.log("ENTER TRADE URL", url, userId);

                if (validTradeurl(url.trim())) {
                    user.update(userId, "tradeurl", url.trim(), 2);
                    socket.emit("message", {
                        type: "success",
                        msg: "Tradeurl set!"
                    })
                } else {
                    socket.emit("message", {
                        type: "error",
                        msg: "Bad tradeurl!"
                    });
                }
            } else {
                socket.emit("message", {
                    type: "error",
                    msg: "Bad tradeurl!"
                });
            }
        } else {
            socket.emit("message", {
                type: "error",
                msg: "You are not logged in!"
            });
        }
    });

    socket.on("withdrawItems", async function (items) {
        const userId = user.getId(socket);
        if (userId != undefined) {
            if (user.information(userId, "tradeurl")) {
                if (user.information(userId, "withdrawOk") == 1) {
                    // if (user.information(userId, "wager") <= 0) {
                    if (Date.now() > (Number(user.information(userId, "lastWithdraw")) + (.05 * 1000 * 60))) {
                        if (typeof items === 'object' && items !== null) {
                            // SUM ALL ITEMS


                            let allBots = {};
                            for (var item in items) {
                                for (var i = 0; i < items[item].selectedAmount; i++) {
                                    if (items[item].assetIds[i] != undefined && items[item].steamIds[i] != undefined) {
                                        if (!allBots[items[item].steamIds[i]]) {
                                            allBots[items[item].steamIds[i]] = []
                                        };
                                        allBots[items[item].steamIds[i]].push({
                                            market_hash_name: items[item].market_hash_name,
                                            image: items[item].image,
                                            price: items[item].price,
                                            assetid: items[item].assetIds[i],
                                        })

                                    }
                                }
                            }

                            console.log("Divided items", userId, allBots);



                            for (var bot in allBots) {
                                if (bots[currentDay][bot] != undefined) {
                                    items = allBots[bot];

                                    var withdrawList = [];

                                    for (var i = 0; i < items.length; i++) {
                                        if (items[i].market_hash_name) {

                                            if (!withdrawPendingList.includes(items[i].assetid)) {
                                                if (!withdrawList.includes(items[i].market_hash_name)) {
                                                    withdrawList.push(items[i].market_hash_name);
                                                }

                                            } else {
                                                socket.emit("message", {
                                                    type: "error",
                                                    msg: "Sorry, someone has already claimed this item"
                                                });
                                                return;
                                            }
                                        }
                                    }

                                    var withdrawPriceList = await fetch_price(withdrawList, true);
                                    var withdrawCost = 0;

                                    for (var i = 0; i < items.length; i++) {
                                        if (withdrawPriceList[items[i].market_hash_name]) {
                                            withdrawCost += Number(Number(withdrawPriceList[items[i].market_hash_name].price).toFixed(2));
                                            items[i].price = Number(Number(withdrawPriceList[items[i].market_hash_name].price).toFixed(2));
                                        } else {
                                            socket.emit("message", {
                                                type: "error",
                                                msg: "All items don't have a price!"
                                            });
                                            return;
                                        }
                                    }

                                    if (user.information(userId, "balance") >= withdrawCost) {
                                        // WITHDRAW IS OK

                                        for (var i = 0; i < items.length; i++) {
                                            if (!withdrawPendingList.includes(items[i].assetid)) {
                                                withdrawPendingList.push(items[i].assetid);
                                            } else {
                                                socket.emit("message", {
                                                    type: "error",
                                                    msg: "Sorry, someone has already claimed this item"
                                                });
                                                return;
                                            }
                                        }

                                        io.emit("requestInventoryResponse", {
                                            iv: withdrawableItems,
                                            type: "bot",
                                            pending: withdrawPendingList
                                        });


                                        socket.emit("message", {
                                            type: "success",
                                            msg: "Withdraw is being handled by the bot."
                                        });

                                        user.update(userId, "balance", (-withdrawCost), 3);
                                        user.update(userId, "withdrawableBalance", (-withdrawCost * 100), 3);
                                        user.update(userId, "lastWithdraw", Date.now(), 2);

                                        console.log("USERID", userId, "Is trying to withdraw! Cost:", withdrawCost);

                                        bots[currentDay][bot].withdraw({
                                            steamid: user.information(userId, "steamid"),
                                            tradeurl: user.information(userId, "tradeurl"),
                                            id: userId,
                                        }, items, withdrawCost, (Object.keys(allBots).length > 1));

                                    } else {
                                        socket.emit("message", {
                                            type: "error",
                                            msg: "insufficient funds!"
                                        });
                                    } 
                                }
                            }

                            if (Object.keys(allBots).length > 1) {
                                user.sendToUser(userId, "redirect", {
                                    url: "https://steamcommunity.com/id/me/tradeoffers/"
                                })
                            }
                        }


                    } else {
                        socket.emit("message", {
                            type: "error",
                            msg: "You can only withdraw once every 5 minutes!"
                        });
                    }
                } else {
                    socket.emit("message", {
                        type: "error",
                        msg: "You are not allowed to withdraw! Please contact support."
                    });
                }

                // } else {
                //     socket.emit("message", {
                //         type: "error",
                //         msg: `You need to wager ${Number(user.information(userId, "wager")).toFixed(2)} before withdrawing!`
                //     });
                // }
            } else {
                socket.emit("message", {
                    type: "error",
                    msg: "Please enter a tradeurl!"
                });
            }

        } else {
            socket.emit("message", {
                type: "error",
                msg: "Please login!"
            });
        }
    });

    socket.on("balance", () => {
        const userId = user.getId(socket);
        if (userId) {
            socket.emit("balance", user.information(userId, "balance"));
        }
    })

    socket.on("depositItems", async function (data) {
        const userId = user.getId(socket);
        if (userId) {
            if(true) {//if (user.information(userId, "tos") == 1) {
                if (user.information(userId, "tradeurl")) {
                    if ((Number(user.information(userId, "lastDeposit")) + (1000 * 60 * 0.2)) <= Date.now()) {
                        if (typeof data.items === 'object' && data.items !== null) {
                            let bot = callDoctor(false);
                            if (bot) {
                                let items = [];
                                for (var item in data.items) {

                                    await withdrawInventory();
                                    let isOverstocked = checkItemAmount(data.items[item].market_hash_name, data.items[item].selectedAmount);

                                    if(!isOverstocked){
                                        for (var i = 0; i < data.items[item].selectedAmount; i++) {
                                            if (data.items[item].assetIds[i] != undefined) {
                                                items.push({
                                                    market_hash_name: data.items[item].market_hash_name,
                                                    image: data.items[item].image,
                                                    price: data.items[item].price,
                                                    assetid: data.items[item].assetIds[i],
                                                })
                                            }
                                        }
                                    } else {
                                        socket.emit("message", {
                                            type: "error",
                                            msg: data.items[item].market_hash_name + " is currently overstocked! Check how many you're depositing!"
                                        });
                                    }

                                    
                                }

                                if (items.length <= 30) {
                                    if(items.length == 0){
                                        socket.emit("message", {
                                            type: "error",
                                            msg: "You must deposit atleast one item!"
                                        });
                                    } else {
                                        var currentItems = [];

                                        for (var i = 0; i < items.length; i++) {
                                            currentItems.push(items[i].assetid);
                                        }
                                        let userIv = user.information(userId, "inventory");

                                        var correctItems = [];
                                        for (var i = 0; i < userIv.length; i++) {
                                            if (currentItems.includes(userIv[i].assetid)) {
                                                correctItems.push(userIv[i]);
                                            }
                                        }

                                        bots[currentDay][bot].makeOffer({
                                            steamid: user.information(userId, "steamid"),
                                            tradeurl: user.information(userId, "tradeurl"),
                                            id: userId,
                                        }, correctItems);

                                        socket.emit("message", {
                                            type: "info",
                                            msg: "Generating steamtrade! Please wait."
                                        });
                                    }
                                } else {
                                    socket.emit("message", {
                                        type: "error",
                                        msg: "Too many items deposited"
                                    });
                                }
                            } else {
                                socket.emit("message", {
                                    type: "error",
                                    msg: "Bots are over capacity! Please wait"
                                });
                            }
                        }
                    } else {
                        socket.emit("message", {
                            type: "error",
                            msg: "You can only deposit every 1 minute!"
                        });
                    }

                } else {
                    socket.emit("message", {
                        type: "error",
                        msg: "Please enter a tradeurl!"
                    });
                    socket.emit("tradeUrl");
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
                msg: "Please login!"
            });
        }
    })
});