var mysql = require("mysql");
var connection = mysql.createConnection({
	host:'sql12.freemysqlhosting.net',
	user:'sql12230427',
	password:'yg2s91JkUX',
	database: 'sql12230427'
});
module.exports=connection;