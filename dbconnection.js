var mysql = require("mysql");
// var connection = mysql.createPool({
// 	connectionLimit : 10,
// 	host:'us-cdbr-iron-east-05.cleardb.net',
// 	user:'b03d48412a2911',
// 	password:'3fc638fc',
// 	database: 'heroku_10443ed5968f512',
// 	dateStrings : true
// });
// module.exports = connection;
// var connection = mysql.createConnection({
// 	host:'localhost',
// 	user:'root',
// 	password:'',
// 	database: 'doctorhow',
// 	dateStrings : true
// });
// module.exports=connection;
var connection = mysql.createConnection({
	host:'sql12.freemysqlhosting.net',
	user:'sql12235712',
	password:'VSaK75UxLG',
	database: 'sql12235712',
	dateStrings : true
});
module.exports = connection;