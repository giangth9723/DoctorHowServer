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

	// PATIENT REQUEST 


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
			var sqlSelect = "select doctor_profile.Name, doctor_online.DoctorID,doctor_online.Username,doctor_online.status,doctor_online.SocketID from doctor_online join doctor_list on doctor_online.DoctorID = doctor_list.DoctorID join doctor_profile on doctor_profile.DoctorID=doctor_list.DoctorID where doctor_list.DiseaseID="+data+"";                       
			connection.query(sqlSelect,function(err,results,fields){
				if(err)throw err;
				socket.emit('server_load_doctor_list',{arrayDoctor : results});
			});
	});


	// DOCTOR REQUEST 


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
				socket.emit('server_check_login_doctor',{ket_qua : check});
			}
			else{
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
			socket.emit("server_check_logout_doctor",{ket_qua : "1" });
	});
	socket.on('doctor_request_reload_doctor',function(data){
		    var arrayDoctorList = new Array();
			var sqlSelect1 = "select doctor_profile.Name, doctor_online.DoctorID,doctor_online.Username,doctor_online.status,doctor_online.SocketID from doctor_online join doctor_list on doctor_online.DoctorID = doctor_list.DoctorID join doctor_profile on doctor_profile.DoctorID=doctor_list.DoctorID where doctor_list.DiseaseID=1";
			connection.query(sqlSelect1,function(err,results,fields){
				if(err)throw err;
				console.log(results);
				io.sockets.emit('server_reload_doctor_1',{arrayDoctor : results});
			});
			var sqlSelect2 = "select doctor_profile.Name, doctor_online.DoctorID,doctor_online.Username,doctor_online.status,doctor_online.SocketID from doctor_online join doctor_list on doctor_online.DoctorID = doctor_list.DoctorID join doctor_profile on doctor_profile.DoctorID=doctor_list.DoctorID where doctor_list.DiseaseID=2";
			connection.query(sqlSelect2,function(err,results,fields){
				if(err)throw err;
				console.log(results);
				io.sockets.emit('server_reload_doctor_2',{arrayDoctor : results});
			});
			var sqlSelect3 = "select doctor_profile.Name, doctor_online.DoctorID,doctor_online.Username,doctor_online.status,doctor_online.SocketID from doctor_online join doctor_list on doctor_online.DoctorID = doctor_list.DoctorID join doctor_profile on doctor_profile.DoctorID=doctor_list.DoctorID where doctor_list.DiseaseID=3";
			connection.query(sqlSelect3,function(err,results,fields){
				if(err)throw err;
				console.log(results);
				io.sockets.emit('server_reload_doctor_3',{arrayDoctor : results});
			});
			var sqlSelect4 = "select doctor_profile.Name, doctor_online.DoctorID,doctor_online.Username,doctor_online.status,doctor_online.SocketID from doctor_online join doctor_list on doctor_online.DoctorID = doctor_list.DoctorID join doctor_profile on doctor_profile.DoctorID=doctor_list.DoctorID where doctor_list.DiseaseID=4";
			connection.query(sqlSelect4,function(err,results,fields){
				if(err)throw err;
				console.log(results);
				io.sockets.emit('server_reload_doctor_4',{arrayDoctor : results});
			});
	});

	// DISCONNECT 


	socket.on('disconnect',function(){
		console.log(socket.id +"  disconnect");
		socket.disconnect();
	})
});

// module.exports = app;