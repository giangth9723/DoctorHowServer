var express = require("express");
var bodyparser = require("body-parser");
var connection = require("./dbconnection");
var app = express();
app.use(bodyparser.urlencoded({extended: true}));
app.use(bodyparser.json());
var server = app.listen(process.env.PORT || 3000, function() {
	console.log('Server listening on port ' + server.address().port);
});
var io = require("socket.io").listen(server);
var fs = require("fs");
var OpenTok = require('opentok'),
    opentok = new OpenTok('46082492', 'd7fe12f01bf6a2c4cde533c72fb70bf8e8f8cbe0');


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
		var Patient_id;
		connection.query(sql,function(err,results,fields){
			if(err)throw err;
			for(var i=0;i<results.length;i++){
				if(info.Username == results[i].Username && info.Password == results[i].Password){
					Patient_id = results[i].Patient_id;
					check = true;
					break;
				}
			}
			if(check){
				console.log(Patient_id + "  "+ info.Username +"  " + socket.id);
				var sqlAdd = "insert into patient_online(Patient_id,Username,Status,Socket_id) values('" + Patient_id + "','" + info.Username + "','online','"+socket.id+"')";
				connection.query(sqlAdd,function(err,results,fields){
					if(err)throw err;
					console.log("record insert , 1 patient is online");
				});
				console.log("dang nhap thanh cong");
				socket.emit('server_check_login_patient',{ket_qua : check});
			}else{
				console.log("dang nhap that bai");
				socket.emit('server_check_login_patient',{ket_qua : check});
			}
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
		var sqlSelect = "select doctor_profile.Doctor_name, doctor_online.Doctor_id,doctor_online.Username,doctor_online.status,doctor_online.Socket_id from doctor_online join doctor_disease on doctor_online.Doctor_id = doctor_disease.Doctor_id join doctor_profile on doctor_profile.Doctor_id=doctor_disease.Doctor_id where doctor_disease.Disease_id="+data+"";                       
		connection.query(sqlSelect,function(err,results,fields){
			if(err)throw err;
			console.log(results);
			socket.emit('server_load_doctor_disease',{arrayDoctor : results});
		});
	});
	socket.on('patient_register',function(data){
		var info = JSON.parse(data);
		var check = true;
		console.log(info);
		var sqlSelect = "select Username from patient_profile";
		connection.query(sqlSelect,function(err,results,fields){
			if(err)throw err;
			for(var i = 0 ; i<results.length;i++){
				if(info.Username == results[i].Username){
					check = false;
					break;
				}
			}
			if(check){
				var sqlInsert = "insert into patient_profile(Username,Password,Name,Gender,Birthday,ID_Number,PhoneNumber,Address,RecordID) values('"+info.Username+"','"+info.Password+"','"+info.Name+"',"+info.Gender+",'"+info.Birthday+"','"+info.ID_Number+"','"+info.PhoneNumber+"','"+info.Address+"','')  ";
				connection.query(sqlInsert,function(err,results,fields){
					if(err)throw err;
					console.log("patient register successfull ");
					socket.emit("server_check_register_patient",{ket_qua :check});
				});
			}else{
				console.log("tai khoan da ton tai");
				socket.emit("server_check_register_patient",{ket_qua :check});
			}

		});
		
	});
	socket.on('patient_call',function(data){
		var doctorSocketID = data;

		opentok.createSession(function(err, session) {
			if (err) return console.log(err);
			var basket = [];
			console.log(session.sessionId);

     // save the sessionId
     // db.save('session', session.sessionId, done);
     var token = session.generateToken({
     	role :                   'moderator',
    expireTime :             (new Date().getTime() / 1000)+(7 * 24 * 60 * 60), // in one week
    data :                   'name=John',
    initialLayoutClassList : ['focus']
});
     console.log(token);
     basket.push(session.sessionId);
     basket.push(token);
     console.log(basket[0]);
     console.log(basket[1]);
     console.log(doctorSocketID);
     socket.emit('server_execute_call',{component : basket});
     io.to(doctorSocketID).emit('server_send_request_code',{component : basket});
     io.to(doctorSocketID).emit('server_request_call',{socket_id : socket.id});
     
});
	});


	// DOCTOR REQUEST 

	socket.on('doctor_accept_call',function(data){
		console.log(data);
		io.to(data).emit('server_send_acception',{abc : "abc"});
	});
	socket.on('doctor_login',function(data){
		var check = false;
		var info = JSON.parse(data);
		console.log(info);
		var sql = "select * from doctor_profile";
		var Doctor_id;
		connection.query(sql,function(err,results,fields){
			if(err)throw err;
			for(var i=0;i<results.length;i++){
				console.log(results[i].Username + " "+info.Username + " "+ results[i].Password + " " + info.Password);
				if(info.Username == results[i].Username && info.Password == results[i].Password){
					Doctor_id = results[i].Doctor_id;
					check = true;
					break;
				}
			}
			if(check){
				console.log(Doctor_id + "  "+ info.Username +"  " + socket.id);
				var sqlAdd = "insert into doctor_online(Doctor_id,Username,Status,Socket_id) values('" + Doctor_id + "','" + info.Username + "','online','"+socket.id+"')";
				connection.query(sqlAdd,function(err,results,fields){
					if(err)throw err;
					console.log("record insert 1 doctor is online");
				});
				console.log("dang nhap thanh cong");
				socket.emit('server_check_login_doctor',{ket_qua : check});
				reloadDoctor();
			}
			else{
				socket.emit('server_check_login_doctor',{ket_qua : check});
				console.log("dang nhap that bai");
			}
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
		reloadDoctor();
	});

	// DISCONNECT 


	socket.on('disconnect',function(){
		console.log(socket.id +"  disconnect");
		var sqlDelete = "delete from patient_online where Socket_id='"+ socket.id +"'" ;
		connection.query(sqlDelete,function(err,results,fields){
			if(err)throw err;
			console.log("delete complete");
		});
		var sqlDelete1 = "delete from doctor_online where Socket_id='"+ socket.id +"'" ;
		connection.query(sqlDelete1,function(err,results,fields){
			if(err)throw err;
			console.log("delete complete");
		});

		reloadDoctor();
		socket.disconnect();
	})
});
function reloadDoctor(){
	var sqlSelect1 = "select doctor_profile.Doctor_name, doctor_online.Doctor_id,doctor_online.Username,doctor_online.status,doctor_online.Socket_id from doctor_online join doctor_disease on doctor_online.Doctor_id = doctor_disease.Doctor_id join doctor_profile on doctor_profile.Doctor_id=doctor_disease.Doctor_id where doctor_disease.Disease_id=1";
	connection.query(sqlSelect1,function(err,results,fields){
		if(err)throw err;
		console.log(results);
		io.sockets.emit('server_reload_doctor_1',{arrayDoctor : results});
	});
	var sqlSelect2 = "select doctor_profile.Doctor_name, doctor_online.Doctor_id,doctor_online.Username,doctor_online.status,doctor_online.Socket_id from doctor_online join doctor_disease on doctor_online.Doctor_id = doctor_disease.Doctor_id join doctor_profile on doctor_profile.Doctor_id=doctor_disease.Doctor_id where doctor_disease.Disease_id=2";
	connection.query(sqlSelect2,function(err,results,fields){
		if(err)throw err;
		console.log(results);
		io.sockets.emit('server_reload_doctor_2',{arrayDoctor : results});
	});
	var sqlSelect3 = "select doctor_profile.Doctor_name, doctor_online.Doctor_id,doctor_online.Username,doctor_online.status,doctor_online.Socket_id from doctor_online join doctor_disease on doctor_online.Doctor_id = doctor_disease.Doctor_id join doctor_profile on doctor_profile.Doctor_id=doctor_disease.Doctor_id where doctor_disease.Disease_id=3";
	connection.query(sqlSelect3,function(err,results,fields){
		if(err)throw err;
		console.log(results);
		io.sockets.emit('server_reload_doctor_3',{arrayDoctor : results});
	});

}

// module.exports = app;