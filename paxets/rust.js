const axios = require("axios");
const user = require('./user');

var lastFetchedAPI = 0;
module.exports = {
    ownsRust: async (steamid, userId) => {
        if ((lastFetchedAPI + 1500) < Date.now()) {

            return await axios.get(`http://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=${process.env.STEAMAPI}&steamid=${steamid}&format=json`).then((response) => {
                lastFetchedAPI = Date.now();
                if (response.status != 200) {
                    console.log(response);
                    return false;
                }
                if (response) {
                    if (response.data) {
                        if (response.data.response) {
                            if (response.data.response.games) {
                                let games = response.data.response.games;

                                for (var i = 0; i < games.length; i++) {
                                    if (Number(games[i].appid) == 252490) {

                                        if ((games[i].playtime_forever / 60) >= 5) {
                                            user.update(userId, "verified", 1, 2);
                                            return {
                                                error: false,
                                            }
                                        } else {
                                            return {
                                                error: true,
                                                msg: "Time"
                                            }
                                        }
                                    }
                                }
                                return {
                                    error: true,
                                    msg: "No Rust"
                                }
                            } else {
                                return {
                                    error: true,
                                    msg: "No Games"
                                }
                            }
                        } else {
                            return {
                                error: true,
                                msg: "No Data Response"
                            }
                        }
                    } else {
                        return {
                            error: true,
                            msg: "No Data"
                        }
                    }
                } else {
                    return {
                        error: true,
                        msg: "No Response"
                    }
                }
            });
        } else {
            return {
                error: true,
                msg: "Rate limit"
            }
        }
    }
}



// 1/x