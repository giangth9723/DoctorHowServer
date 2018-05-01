var mysql = require("mysql");
var pool = mysql.createPool({
	connectionLimit : 10,
	host:'us-cdbr-iron-east-05.cleardb.net',
	user:'b03d48412a2911',
	password:'3fc638fc',
	database: 'heroku_10443ed5968f512',
	dateStrings : true
});
module.exports = pool;
// var connection = mysql.createConnection({
// 	host:'localhost',
// 	user:'root',
// 	password:'',
// 	database: 'doctorhow',
// 	dateStrings : true
// });
// module.exports=connection;