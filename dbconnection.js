var mysql = require("mysql");
var connection = mysql.createConnection({
	host:'localhost',
	user:'root',
	password:'',
	database: 'doctorhow'
});
module.exports=connection;