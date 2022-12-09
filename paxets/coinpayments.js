const io = require('./io').io();
const user = require('./user.js');
const db = require('./db.js');
const cp_keys = {
    public: "2b7b974f42b4659f6eec303ecc4e5d2fc4a8b646cc6d9f8777ebb99d9b2d2ecc",
    private: "5d91818677Cbf9E6a1325ad4023f5e0dbA9Ca1bd326eF33ec5598151ddbEb76b"
};


const cryptocurrencies = ["BTC", "ETH", "LTC", "DOGE", "XRP"];

var InCreation = {};

class Coinpayments {

    contructor() {
        
    }

    // API Callback to listen for Deposits.
    APICoinpayments(req, res) {
        console.log(req.body);
        let _this = this;
        let { ipn_type, status, address, txn_id, currency, fiat_amount } = req.body;
        let amount = parseInt(fiat_amount*100);

        // Get Deposit only from API.
        if(ipn_type == "deposit") {

            if(status == "0") {
                // Deposit - status == 0 - just seen by the network.
                _this.getCryptoHolder(
                    currency, address, (error, uid) => {
                        if(error) 
                            return console.error(`The deposit made on address ${address} (${currency}) is not on our website!`)
                        db.Query(
                            `INSERT INTO transactions SET cpid = "${req.body.deposit_id}", userid = "${uid}",
                            type = "deposit", status = "0", amount = "${amount}", crypto_type = "${currency}",
                            txid = "${txn_id}", time = "${_this.time()}"`
                        ).then(function(ree) {
                            console.log(`User ${uid} has deposited ${amount}, waiting for confirmations!`);
                            user.sendMsg(uid, {type: "success", msg: `The Deposit has been successfully seen on network!`});
                            res.json({success: true});
                        });
                    }
                );

            } else if(status == "100") {
                // Deposit - status == 100 - reached full confirmations.
                db.Query(`SELECT id FROM transactions WHERE cpid = "${req.body.deposit_id}"`).then(function(re) {
                    if(re.length == 0) {
                        // Sometimes the status == "0" is not executed (Coinpayments Issue) and we wanna make sure the transaction is on Database.
                        _this.getCryptoHolder(
                            currency, address, (error, uid) => {
                                if(error) 
                                    return console.error(`The deposit made on address ${address} (${currency}) is not on our website!`)
                                db.Query(
                                    `INSERT INTO transactions SET cpid = "${req.body.deposit_id}", userid = "${uid}",
                                    type = "deposit", status = "1", amount = "${amount}", crypto_type = "${currency}",
                                    txid = "${txn_id}", time = "${_this.time()}"`
                                ).then(function(ree) {
                                    console.log(`User ${uid} has deposited ${amount} and got credited (full confirmations - 1)!`);
                                    _this.creditUser(uid, amount);
                                    user.sendMsg(uid, {type: "success", msg: `The Deposit has been successfully confirmed!`});
                                    res.json({success: true});
                                });
                            }
                        )
                    } else {
                        // Update the status of the Transaction inserted before (status = 0).
                        _this.getCryptoHolder(
                            currency, address, (error, uid) => {
                                if(error) 
                                    return console.error(`The deposit made on address ${address} (${currency}) is not on our website!`)
                                db.Query(
                                    `UPDATE transactions SET status = "1", txid = "${txn_id}" WHERE cpid = "${req.body.deposit_id}"`
                                ).then(function(ree) {
                                    console.log(`User ${uid} has deposited ${amount} and got credited (full confirmations - 2)!`);
                                    user.sendMsg(uid, {type: "success", msg: `The Deposit has been successfully confirmed!`});
                                    _this.creditUser(uid, amount);
                                    res.json({success: true});
                                });
                            }
                        );
                    }

                });

            }


        } else {
            // Other IPN Types -> make them completed.
            res.json({success: true});
        }
    }

    // Get/Create user wallets
    APIUserWallet(socket) {
        // Check user wallet function
        let _this = this;
        let user_id = user.getId(socket);
        if(!user_id) return;

        // Limit to one request
        if(InCreation.hasOwnProperty(user_id)) return;
        InCreation[user_id] = 1;

        console.log(`API User Wallet`);
        console.log(user_id);

        db.Query(`SELECT * FROM wallets WHERE uid = '${user_id}'`).then(function(re) {
            if(re.length >= cryptocurrencies) {
                // Function to get wallets and send to user
                let wallets = {};
                for(let x in re) {
                    wallets[re[x].currency] = re[x].address;
                }
                socket.emit("userWallets", wallets);

                console.log(`Sent addresses:`);
                console.log(wallets);

                // Remove limitation of one request
                delete InCreation[user_id];
            } else {
                // Function to create wallets for user
                let wallets = {};

                let to_create = cryptocurrencies;
                for(let x in re) {
                    if(to_create.indexOf(re[x].currency) >= 0) {
                        to_create.splice(to_create.indexOf(re[x].currency), 1);
                        wallets[re[x].currency] = re[x].address;
                    }
                }

                // Return wallets if there's no need to create them.
                if(to_create.length == 0)
                    return [
                        socket.emit("userWallets", wallets),
                        // Remove limitation of one request
                        delete InCreation[user_id]
                    ]

                _this.createWallets(user_id, to_create, (created) => {
                    for(let x in created) {
                        wallets[created[x].currency] = created[x].address;
                    }

                    // Return wallets after creation of them
                    socket.emit("userWallets", wallets);

                    // Remove limitation of one request
                    delete InCreation[user_id];
                });
            }
        });
    }

    // Use GiftCards code ( Kinguin || CUSTOM )
    APIUserUseGC(socket, code) {
        // Check user in socket
        let _this = this;
        let user_id = user.getId(socket);
        if(!user_id) return;

        _this.checkGCode(code, (available, amount) => {
            if(!available) return socket.emit("message", {type: "error", msg: `The Gift Card you entered does not exists!`});
            _this.removeGCode(user_id, code, amount);
            _this.creditUser(user_id, amount);
            socket.emit("message", {type: "success", msg: `You have successfully redeemed the code and received ${parseFloat(amount/100).toFixed(2)} credits!`})
        });
    }

    APIGetLast5Deposits(uid, type, cb) {
        db.Query(`SELECT * FROM transactions WHERE userid = '${uid}' AND crypto_type = '${type}' ORDER BY id DESC LIMIT 5`).then(function(r) {
            cb(r);
        });
    }

    // Check the GiftCard code in database.
    checkGCode(code, cb) {
        db.Query(`SELECT id, amount FROM giftcards WHERE code = '${code}'`).then(function(r) {
            if(r.length > 0) return cb(1, parseInt(r[0].amount));
            cb(0);
        });
    }

    // Remove GiftCard code from database.
    removeGCode(uid, code, amount) {
        db.Query(`DELETE FROM giftcards WHERE code = '${code}'`).then(function(r) {
            db.Query(`INSERT INTO usedgc SET uid = '${uid}', code = '${code}', amount = '${amount}', time = '${new Date().getTime()}'`).then(function(rr) {
                console.log(`Code ${code} (C: ${amount}) was deleted after UserID ${uid} used it!`);
            });
        });
    }

    createWallets(uid, currencies, cb) {
        let _this = this;
        let __created = {};

        let $currencies = currencies;

        console.log(`Creating addresses:`);
        console.log($currencies);
        console.log(`For USERID: ${uid}`);

        __createWallet();
        function __createWallet() {
            _this.createWallet($currencies[0], (currency, address) => {
                $currencies.splice(0, 1);
                __created[currency] = address;
                db.Query(`INSERT INTO wallets SET uid = '${uid}', currency = '${currency}', address = '${address}'`).then(function(r) {
                    if($currencies.length == 0) cb(__created);
                    else __createWallet();
                });
            });
        }
    }



    creditUser(user_id, amount) {
        let _this = this;
        // Credit the user by the amount deposited.
        db.Query(
            `UPDATE users SET balance = balance + "${amount}" WHERE id = "${user_id}"`
        ).then(function(r) {
            // Send balance (socket)
            _this.refreshBalance(user_id);
            // 
            console.log(`User ${user_id} got credited - DB Query.`);
        });
    }

    refreshBalance(user_id) {
        db.Query(`SELECT balance FROM users WHERE id = '${user_id}'`).then(function(r) {
            if(r.length > 0) {
                user.sendToUser(user_id, "balance", parseFloat(r[0].balance/100).toFixed(2));
            }
        });
    }

    getCryptoHolder(currency, address, cb) {
        db.Query(`SELECT uid FROM wallets WHERE currency = "${currency}" AND address = "${address}"`).then(function(r) {
            if(r.length == 0) return cb(`No wallet found!`);
            cb(0, r[0].uid);
        });
    }

    time() {
        return new Date().getTime();
    }

}

module.exports = Coinpayments;