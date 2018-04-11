var mysql = require("mysql");
var connection = mysql.createConnection({
	host:'sql12.freemysqlhosting.net',
	user:'sql12232037',
	password:'EtYXDgmaph',
	database: 'sql12232037'
});
module.exports=connection;
// var connection = mysql.createConnection({
// 	host:'localhost',
// 	user:'root',
// 	password:'',
// 	database: 'doctorhow'
// });
// module.exports=connection;