var mysql = require("mysql");
var connection = mysql.createConnection({
	host:'localhost',
	user:'giangthse04148',
	password:'',
	database: 'doctorhow'
});
module.exports=connection;