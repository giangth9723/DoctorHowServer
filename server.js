var express = require("express");
var bodyparser = require("body-parser");
var connection = require("./dbconnection");
var app = express();
app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());
var server = app.listen(3000, function() {
  console.log('Server listening on port ' + server.address().port);
});
var io = require("socket.io").listen(server);
var fs = require("fs");

  

connection.connect(function(err){
	if(err)throw err.stack;
	console.log("db connected");
	
});
io.sockets.on("connection",function(socket){
	console.log("DEVICE CONNECTED ID: " + socket.id);
	socket.on('patient_login',function(data){
		var check = false;
		var info = JSON.parse(data);
		console.log(info);
		var sql = "select * from patient_profile";
		var PatientID;
		connection.query(sql,function(err,results,fields){
			if(err)throw err;
			for(var i=0;i<results.length;i++){
				// console.log(results[i].Username + " "+info.username + " "+ results[i].Password + " " + info.password);
				if(info.Username == results[i].Username && info.Password == results[i].Password){
					PatientID = results[i].PatientID;
					check = true;
					break;
				}
			}
			if(check){
				console.log(PatientID + "  "+ info.Username +"  " + socket.id);
				var sqlAdd = "insert into patient_online(PatientID,Username,Status,SocketID) values('" + PatientID + "','" + info.Username + "','online','"+socket.id+"')";
				connection.query(sqlAdd,function(err,results,fields){
					if(err)throw err;
					console.log("record insert , 1 patient is online");
				});
				console.log("dang nhap thanh cong");
				socket.emit('server_check_login_patient',{ket_qua : check});
			}else{
				console.log("dang nhap that bai");
			}
		});
	});
	socket.on('patient_relogin',function(data){
		    console.log(data);
			var sqlUpdate = "update patient_online set SocketID='"+socket.id+"' where Username ='"+data+"'";
			connection.query(sqlUpdate,function(err,results,fields){
				if(err)throw err;
				console.log(results.affectedRows +" record(s) updated");
			});
	});
	socket.on('patient_logout',function(data){
			console.log(data);
			var sqlDelete = "delete from patient_online where Username='"+ data +"'" ;
			console.log(sqlDelete);
			connection.query(sqlDelete,function(err,results,fields){
				if(err)throw err;
				console.log("delete complete");
			});
	});
	socket.on('patient_load_doctor',function(data){
			console.log(data);
			var sqlSelect = "select "
	});
	socket.on('doctor_login',function(data){
		var check = false;
		var info = JSON.parse(data);
		console.log(info);
		var sql = "select * from doctor_profile";
		var DoctorID;
		connection.query(sql,function(err,results,fields){
			if(err)throw err;
			for(var i=0;i<results.length;i++){
				console.log(results[i].Username + " "+info.Username + " "+ results[i].Password + " " + info.Password);
				if(info.Username == results[i].Username && info.Password == results[i].Password){
					DoctorID = results[i].DoctorID;
					check = true;
					break;
				}
			}
			if(check){
				console.log(DoctorID + "  "+ info.Username +"  " + socket.id);
				var sqlAdd = "insert into doctor_online(DoctorID,Username,Status,SocketID) values('" + DoctorID + "','" + info.Username + "','online','"+socket.id+"')";
				connection.query(sqlAdd,function(err,results,fields){
					if(err)throw err;
					console.log("record insert 1 doctor is online");
				});
				console.log("dang nhap thanh cong");
				socket.emit('server_reload_doctor_list',{danhsach : alo});
				socket.emit('server_check_login_doctor',{ket_qua : check});
			}else{
				console.log("dang nhap that bai");
			}
		});
	});
	socket.on('doctor_relogin',function(data){
			console.log(data);
			var sqlUpdate = "update doctor_online set SocketID='"+socket.id+"' where Username ='"+data+"'";
			connection.query(sqlUpdate,function(err,results,fields){
				if(err)throw err;
				console.log(results.affectedRows +" record(s) updated");
			});
	});
	socket.on('doctor_logout',function(data){
			console.log(data);
			var sqlDelete = "delete from doctor_online where Username='"+ data +"'" ;
			console.log(sqlDelete);
			connection.query(sqlDelete,function(err,results,fields){
				if(err)throw err;
				console.log("delete complete");
			});
	});
	// socket.on('benhnhan_dangnhap',function(data){
	// 	var check=false;
	// 	for(var i=0;i<mangDangNhap.length;i++){
	// 		if(data==mangDangNhap[i]){
	// 		check=true;
	// 		break;
	// 		}
	// 	}
	// 	if(check){
	// 		pass=true;
	// 		socket.emit('server_thongqua_benhnhan', {ketqua: pass});
	// 		io.sockets.emit("server_gui_dsbacsi",{danhsach: mangBacsiOnline});
	// 		console.log("benh nhan dang nhap thanh cong");
	// 	}else{
	// 		pass=false;
	// 		console.log(data);
	// 		console.log("benh nhan dang nhap that bai");
	// 	}
	// });
	// socket.on('bacsi_dangnhap',function(data){
	// 	var check1 = false;
	// 	// for(var i=0;i<mangBacsi.length;i++){
	// 	// 	if(data==mangBacsi[i]){
	// 	// 		check1=true;
	// 	// 		mangBacsiOnline.push(mangBacsi[i]);
	// 	// 		break;
	// 	// 	}
	// 	// }
	// 	var info=JSON.parse(data);
	// 	var sql="select * from doctor_profile ";
	// 	connection.query(sql,function(err,results,fields){
	// 	if(err)throw err;
	// 	for(var i=0;i<results.length;i++){
	// 		var username = results[i].Username;
	// 		var password = results[i].Password;
	// 		if(info.username == username && info.password == password){
	// 			console.log('dang nhap thanh cong');
	// 			check1=true;
	// 			break;
	// 		}    
	// 	}
	// 	if(check1){
	// 		pass1=true;
	// 		console.log("bac si dang nhap thanh cong");
	// 		socket.emit("server_thongqua_bacsi",{ketqua1:pass1});
	// 		// io.sockets.emit("server_gui_dsbacsi",{danhsach: mangBacsiOnline});
	// 	}else{
	// 		pass1=false;
	// 		console.log("bac si dang nhap that bai");
	// 	}
	    
	// });

		
	// });
	// socket.on('bacsi_dangxuat',function(data){
	// 	var check2=false;
	// 	console.log(data);
	// 	console.log(socket.id);
	// 	// for(var i=0;i<mangBacsiOnline.length;i++){
	// 	// 	if(data==mangBacsiOnline[i]){
	// 	// 		mangBacsiOnline.splice(i,1);
	// 	// 		break;
	// 	// 	}
	// 	// }
	// 	// io.sockets.emit("server_gui_dsbacsi",{danhsach: mangBacsiOnline});
	// 	console.log("Bac si dang xuat");
	// });
	// socket.on('check socket',function(data){
	// 	console.log(socket.id);
	// 	console.log(data);
	// });
	socket.on('disconnect',function(){
		console.log(socket.id +"  disconnect");
		socket.disconnect();
	})
});

// module.exports = app;