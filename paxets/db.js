const mysql = require('mysql');
require('dotenv').config({ path: './config/.env' })

// DATABASE
var db = mysql.createPool({
    connectionLimit: 15,
    host: 'localhost',
    user: 'root',
    
    database: 'db_saloon',
    charset: 'utf8_general_ci'
});

if(process.env.TESTMODE == "true"){
    db = mysql.createPool({
    connectionLimit: 15,
    host: process.env.TEST_DBHOST,
    user: process.env.TEST_DB_USER,
    password: process.env.TEST_DB_PASSWORD,
    database: process.env.TEST_DB,
    charset: 'utf8_general_ci'
});
}

module.exports = {
    /**
        * Module DB
        * @param {function} Query - Updates the database with the new information given.
    */


    Query: async function (input) {
        return new Promise(async function (resolve, reject) {
            db.getConnection(function (err, connection) {
                if (err) throw err;
                connection.query(input, (error, row) => {
                    if (error) return console.log(error);
                    resolve(row);
                    connection.release();
                })
            })
        })
    },
};
