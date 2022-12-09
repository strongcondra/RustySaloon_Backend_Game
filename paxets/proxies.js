const axios = require("axios");

const apikey = "34ae2a9bf2b450a9e0be5d447ba0c2afe6521fef";

var proxyList = [];

async function retrieveProxyList () {
    return await axios.get("https://proxy.webshare.io/api/proxy/list", { 'headers': { 'Authorization': "Token " + apikey }}).then((response) => {
        return response.data.results
    })
}

module.exports.storeProxyList = async () => {
    return await retrieveProxyList().then((proxies) => {
        let temp = [];
        proxies.map((proxy) => {
            if (proxy.valid) {
                temp.push(`http://${proxy.username}:${proxy.password}@${proxy.proxy_address}:${proxy.ports.http}`);
            }
        })
        proxyList = temp;
        return;
    })
}

module.exports.refreshProxyList = async () => {

    return await axios.post("https://proxy.webshare.io/api/proxy/replacement/info/refresh/", null, { 'headers': { 'Authorization': "Token " + apikey }}).then((response) => {
        return response.data.results
    })
}


module.exports.getProxy = () => {
    if (proxyList.length > 0) {
        var Proxy = proxyList[0];
        proxyList.shift();
        
        return Proxy;
    } else {
        return false;
    }
}