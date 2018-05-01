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
		var Patient_info = [];
		var Patient_id;
		connection.query(sql,function(err,results,fields){
			if(err)throw err;
			for(var i=0;i<results.length;i++){
				if(info.Username == results[i].Username && info.Password == results[i].Password){
					Patient_id = results[i].Patient_id;
					Patient_info.push(results[i]);
					check = true;
					break;
				}
			}
			if(check){
				console.log(Patient_id + "  "+ info.Username +"  " + socket.id);
				var sqlOnline = "update patient_profile set Socket_id ='"+socket.id+"',Online_status='online' where Patient_id="+ Patient_id +" ";
				connection.query(sqlOnline,function(err,results,fields){
					if(err)throw err;
					console.log("record insert , 1 patient is online");
				});
				console.log("dang nhap thanh cong");
				Patient_info.push(check);
				Patient_info[0].Online_status = 'online';
				Patient_info[0].Socket_id = socket.id;
				for(var i = 0 ;i< Patient_info.length;i++){
					console.log(Patient_info[i]);
				}
				socket.emit('server_check_login_patient',{ket_qua : Patient_info});
			}else{
				Patient_info.push("fail");
				Patient_info.push(check);
				console.log("dang nhap that bai");
				socket.emit('server_check_login_patient',{ket_qua : Patient_info});
			}
		});
	});

	socket.on('patient_logout',function(data){
		console.log(data);
		var sqlDelete = "update patient_profile set Online_status='offline',Socket_id='' where Username='"+data+"'" ;
		console.log(sqlDelete);
		connection.query(sqlDelete,function(err,results,fields){
			if(err)throw err;
			console.log("delete complete");
		});
	});
	socket.on('patient_load_doctor',function(data){
		console.log(data);
		var sqlSelect = "SELECT doctor_profile.`Doctor_id`, `Username`, `Password`, `Doctor_name`, `Profile_picture`, `Gender`, `Clinic`, `Degree`, `Birthday`, `ID_Number`, `Phone_number`, `Address_number`, `Address_street`, `Address_distric`, `Address_city`, `Description`, `Online_status`, `Socket_id` FROM `doctor_profile` join doctor_disease on doctor_profile.Doctor_id=doctor_disease.Doctor_id WHERE doctor_disease.Disease_id ="+data+"";                       
		connection.query(sqlSelect,function(err,results,fields){
			if(err)throw err;
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
				var sqlInsert = "INSERT INTO `patient_profile`(`Username`, `Password`, `Patient_name`, `Profile_picture`, `Gender`, `Birthday`, `Phone_number`, `Height`, `Weight`, `Id_number`, `Address_number`, `Address_street`, `Address_distric`, `Address_city`, `Socket_id`, `Online_status`) VALUES('"+info.Username+"','"+info.Password+"','"+info.Patient_name+"','',"+info.Gender+",'"+info.Birthday+"','"+info.Phone_number+"',"+info.Height+","+info.Weight+",'"+info.Id_number+"','"+info.Address_number+"','"+info.Address_street+"','"+info.Address_distric+"','"+info.Address_city+"','','')  ";
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
		var info = JSON.parse(data);
		var doctorSocketID = info.Doctor_socket_id;
		var activity_before = info.Activity_name;
		var patient_info = JSON.parse(info.Patient_info);
		console.log(info);
				opentok.createSession(function(err, session) {
			if (err) return console.log(err);
			var basket_for_doctor = [];
			var basket_for_patient = [];
			console.log(session.sessionId);

     // save the sessionId
     // db.save('session', session.sessionId, done);
     var token = session.generateToken({
     	role :                   'moderator',
    expireTime :             (new Date().getTime() / 1000)+(7 * 24 * 60 * 60), // in one week
    data :                   'name=John',
    initialLayoutClassList : ['focus']
});

     basket_for_doctor.push(patient_info);
     basket_for_doctor.push(activity_before);
     basket_for_doctor.push(session.sessionId);
     basket_for_doctor.push(token);
     basket_for_patient.push(session.sessionId);
     basket_for_patient.push(token);
     console.log(patient_info);
     socket.emit('server_execute_call',{call_info : basket_for_patient});
     io.to(doctorSocketID).emit('server_request_call',{call_info : basket_for_doctor});
     
});
	});
	socket.on('patient_cancel_call',function(data){
		io.to(data).emit('server_send_cancelation_call_to_doctor',{abc : "abc"});

	});
	socket.on('patient_accept_request_emr',function(data){
		io.to(data).emit('server_send_finish_call_to_doctor',{answer : "yes"});
	});
	socket.on('patient_decline_request_emr',function(data){
		io.to(data).emit('server_send_finish_call_to_doctor',{answer : "no"});
	});
	socket.on('patient_finish_call',function(data){
		io.to(data).emit('server_send_finish_call_to_doctor',{answer : "alo"});
	});
	socket.on('patient_get_emr_dermatology',function(data){
		sqlSelect = "SELECT `Emr_id`, emr_dermatology.`Patient_id`, emr_dermatology.`Doctor_id`,patient_profile.Patient_name,doctor_profile.Doctor_name, `Emr_date`, `Pathology`, `History_disease`, `Family`, `Allergy`, `Drug`, `Alcohol`, `Tobacco`, `Pipe_tobacco`, `Others_rf`, `Vascular`, `Temperature`, `Blood_pressure`, `Breathing`, emr_dermatology.`Weight`, `Body`, `Functional_symtoms`, `Basic_injury`, `Clinical_test`, `Summary`, `Cyclic`, `Respiratory`, `Digest`, `Kug`, `Peripheral_neuropathy`, `Others_o`, `Main_disease`, `Secondary_disease`, `Distinguish`, `Prognosis`, `Treatment_direction_dt`, `Pathology_process`, `Labs_result`, `Treatments`, `Patient_status`, `Treatment_direction_s`, `File_pic`, `Emr_status` FROM `emr_dermatology` join patient_profile on emr_dermatology.Patient_id = patient_profile.Patient_id join doctor_profile on emr_dermatology.Doctor_id = doctor_profile.Doctor_id WHERE emr_dermatology.Patient_id ="+data+" ORDER BY emr_dermatology.Emr_date";
		connection.query(sqlSelect,function(err,results,fields){
			if(err)throw err;
			console.log(results);
			socket.emit('server_response_emr_dermatology_for_patient',{danhsach_benhan : results});
		});
	});
	socket.on('patient_get_emr_female',function(data){
		sqlSelect = "SELECT `Emr_id`,emr_gynecological.`Patient_id`, emr_gynecological.`Doctor_id`,doctor_profile.Doctor_name,patient_profile.Patient_name,`Emr_date`, `Pathology`, `History_disease`, `Family`, `Periods_year`, `Periods_age`, `Periods_nature`, `Periods_cycle`, `Periods_noofdate`, `Periods_amount`, `Periods_lastdate`, `Stomachache`, `Marriage_year`, `Marriage_age`, `Periods_endyear`, `Periods_endage`, `Periods_treatment`, `Vascular`, `Temperature`, `Blood_pressure`, `Breathing`, emr_gynecological.`Weight`, `Body`, `Cyclic`, `Respiratory`, `Digest`, `Nerve`, `Bone`, `Kidney`, `Others_o`, `Secondary_signs`, `Big_lips`, `Baby_lips`, `Clitoris`, `Vulva`, `Hymen`, `Perineal`, `Vagina`, `Cervical`, `The_uterus`, `Extra`, `Douglas`, `Clinical_test`, `Summary`, `Main_disease`, `Secondary_disease`, `Distinguish`, `Prognosis`, `Treatment_direction_dt`, `Pathology_process`, `Labs_result`, `Treatments`, `Patient_status`, `Treatment_direction_s`, `File_pic`, `Emr_status` FROM `emr_gynecological` join doctor_profile on emr_gynecological.Doctor_id = doctor_profile.Doctor_id join patient_profile on emr_gynecological.Patient_id = patient_profile.Patient_id WHERE patient_profile.Patient_id ="+data+" ORDER BY emr_gynecological.Emr_date";
		connection.query(sqlSelect,function(err,results,fields){
			if(err)throw err;
			console.log(results);
			socket.emit('server_response_emr_female_for_patient',{danhsach_benhan : results});
		});
	});
	socket.on('patient_get_emr_mental',function(data){
		sqlSelect = "SELECT `Emr_id`,emr_mental.Patient_id, emr_mental.Doctor_id,doctor_profile.Doctor_name,patient_profile.Patient_name, `Emr_date`, `Pathology`, `History_disease`, `Allergy`, `Drug`, `Alcohol`, `Tobacco`, `Pipe_tobacco`, `Others_rf`, `Family`, `Vascular`, `Temperature`, `Blood_pressure`, `Breathing`, emr_mental.Weight, `Body`, `Cyclic`, `Respiratory`, `Digest`, `Kidney`, `Bone`, `Ear_nose_throat`, `Teeth`, `Eye`, `Endocrine`, `Cranial_nerves`, `Bottom_of_eye`, `Motor`, `Field_force`, `Feel`, `Reflex`, `General_expression`, `Space`, `Time`, `Myself`, `Affection`, `Sense`, `Form`, `Content`, `Spirit`, `Instinct`, `Mechanically`, `Understandably`, `Analytical`, `Comprehensive`, `Attention`, `Clinical_test`, `Summary`, `Main_disease`, `Secondary_disease`, `Distinguish`, `Prognosis`, `Treatment_direction_dt`, `Pathology_process`, `Labs_result`, `Treatments`, `Patient_status`, `Treatment_direction_s`, `File_pic`, `Emr_status` FROM `emr_mental` join doctor_profile on emr_mental.Doctor_id = doctor_profile.Doctor_id join patient_profile on emr_mental.Patient_id=patient_profile.Patient_id WHERE patient_profile.Patient_id ="+data+" ORDER BY emr_mental.Emr_date";
		connection.query(sqlSelect,function(err,results,fields){
			if(err)throw err;
			console.log(results);
			socket.emit('server_response_emr_mental_for_patient',{danhsach_benhan : results});
		});
	});
	socket.on('patient_save_history_call',function(data){
		var info = JSON.parse(data);
		console.log(info);
		sqlInsert = "INSERT INTO `history_call`(`Day`, `Start_time`, `End_time`, `Duration`, `Patient_id`, `Doctor_id`, `Emr_type`, `Emr_id`, `Emr_status`) VALUES ('"+info.Day+"','"+info.Start_time+"','"+info.End_time+"','"+info.Duration+"',"+info.Patient_id+","+info.Doctor_id+",'"+info.Emr_type+"',1,0)";
		connection.query(sqlInsert,function(err,results,fields){
			if(err)throw err;
			console.log("insert thanh cong");
		});
	});
	socket.on('patient_load_history_call',function(data){
		sqlSelect ="SELECT `Call_id`, `Day`, `Start_time`, `End_time`, `Duration`, history_call.`Patient_id`,history_call.`Doctor_id`,doctor_profile.Doctor_name,patient_profile.Patient_name, `Emr_type`, `Emr_id`, `Emr_status` FROM `history_call` join doctor_profile on history_call.Doctor_id = doctor_profile.Doctor_id join patient_profile on history_call.Patient_id = patient_profile.Patient_id where history_call.Patient_id="+data+"";
		connection.query(sqlSelect,function(err,results,fields){
			if(err)throw err;
			console.log(results);
			socket.emit("server_load_history_call",{historyList : results});
		});
	});


	// DOCTOR REQUEST 
	socket.on('doctor_load_history_call',function(data){
		sqlSelect ="SELECT `Call_id`, `Day`, `Start_time`, `End_time`, `Duration`, history_call.`Patient_id`,history_call.`Doctor_id`,doctor_profile.Doctor_name,patient_profile.Patient_name, `Emr_type`, `Emr_id`, `Emr_status` FROM `history_call` join doctor_profile on history_call.Doctor_id = doctor_profile.Doctor_id join patient_profile on history_call.Patient_id = patient_profile.Patient_id where history_call.Doctor_id="+data+"";
		connection.query(sqlSelect,function(err,results,fields){
			if(err)throw err;
			console.log(results);
			socket.emit("server_load_history_call_for_doctor",{historyList : results});
		});
	});
	socket.on('doctor_save_emr_dermatology',function(data){
		var info = JSON.parse(data);
		console.log(info);
		var sqlInsert = "INSERT INTO `emr_dermatology`(`Patient_id`, `Doctor_id`, `Emr_date`, `Pathology`, `History_disease`, `Family`, `Allergy`, `Drug`, `Alcohol`, `Tobacco`, `Pipe_tobacco`, `Others_rf`, `Vascular`, `Temperature`, `Blood_pressure`, `Breathing`, `Weight`, `Body`, `Functional_symtoms`, `Basic_injury`, `Clinical_test`, `Summary`, `Cyclic`, `Respiratory`, `Digest`, `Kug`, `Peripheral_neuropathy`, `Others_o`, `Main_disease`, `Secondary_disease`, `Distinguish`, `Prognosis`, `Treatment_direction_dt`, `Pathology_process`, `Labs_result`, `Treatments`, `Patient_status`, `Treatment_direction_s`, `File_pic`,`Emr_status`) VALUES ("+info.Patient_id+","+info.Doctor_id+",'"+info.Emr_date+"','"+info.Pathology+"','"+info.History_disease+"','"+info.Family+"','"+info.Allergy+"','"+info.Drug+"','"+info.Alcohol+"','"+info.Tobacco+"','"+info.Pipe_tobacco+"','"+info.Others_rf+"',"+info.Vascular+","+info.Temperature+","+info.Blood_pressure+","+info.Breathing+","+info.Weight+",'"+info.Body+"','"+info.Functional_symtoms+"','"+info.Basic_injury+"','"+info.Clinical_test+"','"+info.Summary+"','"+info.Cyclic+"','"+info.Respiratory+"','"+info.Digest+"','"+info.Kug+"','"+info.Peripheral_neuropathy+"','"+info.Others_o+"','"+info.Main_disease+"','"+info.Secondary_disease+"','"+info.Distinguish+"','"+info.Prognosis+"','"+info.Treatment_direction_dt+"','"+info.Pathology_process+"','"+info.Labs_result+"','"+info.Treatments+"','"+info.Patient_status+"','"+info.Treatment_direction_s+"','"+info.File_pic+"',1)";
		connection.query(sqlInsert,function(err,results,fields){
			if(err)throw err;
			console.log(results);
			console.log("insert thanh cong");
			var id = results.insertId;
			var sqlUpdate = "UPDATE `history_call` SET Emr_id ="+id+",Emr_status = 1 where Patient_id ="+info.Patient_id+" and Doctor_id="+info.Doctor_id+" and Emr_type='dermatology'" ;
			connection.query(sqlUpdate,function(err,results,fields){
				if(err)throw err;
				console.log("update nice");
			});
		});

	});
	socket.on('doctor_save_emr_female',function(data){
		var info = JSON.parse(data);
		console.log(info);
		var sqlInsert = "INSERT INTO `emr_gynecological`(`Patient_id`, `Doctor_id`, `Emr_date`, `Pathology`, `History_disease`, `Family`, `Periods_year`, `Periods_age`, `Periods_nature`, `Periods_cycle`, `Periods_noofdate`, `Periods_amount`, `Periods_lastdate`, `Stomachache`, `Marriage_year`, `Marriage_age`, `Periods_endyear`, `Periods_endage`, `Periods_treatment`, `Vascular`, `Temperature`, `Blood_pressure`, `Breathing`, `Weight`, `Body`, `Cyclic`, `Respiratory`, `Digest`, `Nerve`, `Bone`, `Kidney`, `Others_o`, `Secondary_Signs`, `Big_lips`, `Baby_lips`, `Clitoris`, `Vulva`, `Hymen`, `Perineal`, `Vagina`, `Cervical`, `The_uterus`, `Extra`, `Douglas`, `Clinical_test`, `Summary`, `Main_disease`, `Secondary_disease`, `Distinguish`, `Prognosis`, `Treatment_direction_dt`, `Pathology_process`, `Labs_result`, `Treatments`, `Patient_status`, `Treatment_direction_s`, `File_pic`, `Emr_status`) VALUES ("+info.Patient_id+","+info.Doctor_id+",'"+info.Emr_date+"','"+info.Pathology+"','"+info.History_disease+"','"+info.Family+"',"+info.Periods_year+","+info.Periods_age+",'"+info.Periods_nature+"',"+info.Periods_cycle+","+info.Periods_noofdate+",'"+info.Periods_amount+"','"+info.Periods_lastdate+"',"+info.Stomachache+","+info.Marriage_year+","+info.Marriage_age+","+info.Periods_endyear+","+info.Periods_endage+",'"+info.Periods_treatment+"',"+info.Vascular+","+info.Temperature+","+info.Blood_pressure+","+info.Breathing+","+info.Weight+",'"+info.Body+"','"+info.Cyclic+"','"+info.Respiratory+"','"+info.Digest+"','"+info.Nerve+"','"+info.Bone+"','"+info.Kidney+"','"+info.Others_o+"','"+info.Secondary_Signs+"','"+info.Big_lips+"','"+info.Baby_lips+"','"+info.Clitoris+"','"+info.Vulva+"','"+info.Hymen+"','"+info.Perineal+"','"+info.Vagina+"','"+info.Cervical+"','"+info.The_uterus+"','"+info.Extra+"','"+info.Douglas+"','"+info.Clinical_test+"','"+info.Summary+"','"+info.Main_disease+"','"+info.Secondary_disease+"','"+info.Distinguish+"','"+info.Prognosis+"','"+info.Treatment_direction_dt+"','"+info.Pathology_process+"','"+info.Labs_result+"','"+info.Treatments+"','"+info.Patient_status+"','"+info.Treatment_direction_s+"','"+info.File_pic+"',1)";
		connection.query(sqlInsert,function(err,results,fields){
			if(err)throw err;
			console.log("insert thanh cong");
			var id = results.insertId;
			var sqlUpdate = "UPDATE `history_call` SET Emr_id ="+id+",Emr_status = 1 where Patient_id ="+info.Patient_id+" and Doctor_id="+info.Doctor_id+" and Emr_type='female'" ;
			connection.query(sqlUpdate,function(err,results,fields){
				if(err)throw err;
				console.log("update nice");
			});
		});

	});
	socket.on('doctor_save_emr_mental',function(data){
		var info = JSON.parse(data);
		console.log(info);
		var sqlInsert = "INSERT INTO `emr_mental`(`Patient_id`, `Doctor_id`, `Emr_date`, `Pathology`, `History_disease`, `Allergy`, `Drug`, `Alcohol`, `Tobacco`, `Pipe_tobacco`, `Others_rf`, `Family`, `Vascular`, `Temperature`, `Blood_pressure`, `Breathing`, `Weight`, `Body`, `Cyclic`, `Respiratory`, `Digest`, `Kidney`, `Bone`, `Ear_nose_throat`, `Teeth`, `Eye`, `Endocrine`, `Cranial_nerves`, `Bottom_of_eye`, `Motor`, `Field_force`, `Feel`, `Reflex`, `General_expression`, `Space`, `Time`, `Myself`, `Affection`, `Sense`, `Form`, `Content`, `Spirit`, `Instinct`, `Mechanically`, `Understandably`, `Analytical`, `Comprehensive`, `Attention`, `Clinical_test`, `Summary`, `Main_disease`, `Secondary_disease`, `Distinguish`, `Prognosis`, `Treatment_direction_dt`, `Pathology_process`, `Labs_result`, `Treatments`, `Patient_status`, `Treatment_direction_s`, `File_pic`, `Emr_status`) VALUES ("+info.Patient_id+","+info.Doctor_id+",'"+info.Emr_date+"','"+info.Pathology+"','"+info.History_disease+"','"+info.Allergy+"','"+info.Drug+"','"+info.Alcohol+"','"+info.Tobacco+"','"+info.Pipe_tobacco+"','"+info.Others_rf+"','"+info.Family+"',"+info.Vascular+","+info.Temperature+","+info.Blood_pressure+","+info.Breathing+","+info.Weight+",'"+info.Body+"','"+info.Cyclic+"','"+info.Respiratory+"','"+info.Digest+"','"+info.Kidney+"','"+info.Bone+"','"+info.Ear_nose_throat+"','"+info.Teeth+"','"+info.Eye+"','"+info.Endocrine+"','"+info.Cranial_nerves+"','"+info.Bottom_of_eye+"','"+info.Motor+"','"+info.Field_force+"','"+info.Feel+"','"+info.Reflex+"','"+info.General_expression+"','"+info.Space+"','"+info.Time+"','"+info.Myself+"','"+info.Affection+"','"+info.Sense+"','"+info.Form+"','"+info.Content+"','"+info.Spirit+"','"+info.Instinct+"','"+info.Mechanically+"','"+info.Understandably+"','"+info.Analytical+"','"+info.Comprehensive+"','"+info.Attention+"','"+info.Clinical_test+"','"+info.Summary+"','"+info.Main_disease+"','"+info.Secondary_disease+"','"+info.Distinguish+"','"+info.Prognosis+"','"+info.Treatment_direction_dt+"','"+info.Pathology_process+"','"+info.Labs_result+"','"+info.Treatments+"','"+info.Patient_status+"','"+info.Treatment_direction_s+"','"+info.File_pic+"',1)";
		connection.query(sqlInsert,function(err,results,fields){
			if(err)throw err;
			console.log("insert thanh cong");
			var id = results.insertId;
			var sqlUpdate = "UPDATE `history_call` SET Emr_id ="+id+",Emr_status = 1 where Patient_id ="+info.Patient_id+" and Doctor_id="+info.Doctor_id+" and Emr_type='mental'" ;
			connection.query(sqlUpdate,function(err,results,fields){
				if(err)throw err;
				console.log("update nice");
			});
		});

	});
	socket.on('doctor_get_emr_dermatology_for_patient',function(data){
		sqlSelect = "SELECT `Emr_id`, emr_dermatology.`Patient_id`, emr_dermatology.`Doctor_id`,patient_profile.Patient_name,doctor_profile.Doctor_name, `Emr_date`, `Pathology`, `History_disease`, `Family`, `Allergy`, `Drug`, `Alcohol`, `Tobacco`, `Pipe_tobacco`, `Others_rf`, `Vascular`, `Temperature`, `Blood_pressure`, `Breathing`, emr_dermatology.`Weight`, `Body`, `Functional_symtoms`, `Basic_injury`, `Clinical_test`, `Summary`, `Cyclic`, `Respiratory`, `Digest`, `Kug`, `Peripheral_neuropathy`, `Others_o`, `Main_disease`, `Secondary_disease`, `Distinguish`, `Prognosis`, `Treatment_direction_dt`, `Pathology_process`, `Labs_result`, `Treatments`, `Patient_status`, `Treatment_direction_s`, `File_pic`, `Emr_status` FROM `emr_dermatology` join patient_profile on emr_dermatology.Patient_id = patient_profile.Patient_id join doctor_profile on emr_dermatology.Doctor_id = doctor_profile.Doctor_id WHERE emr_dermatology.Patient_id ="+data+" ORDER BY emr_dermatology.Emr_date";
		connection.query(sqlSelect,function(err,results,fields){
			if(err)throw err;
			console.log(results);
			socket.emit('server_response_emr_dermatology_for_doctor',{danhsach_benhan : results});
		});
	});
	socket.on('doctor_get_emr_female_for_patient',function(data){
		sqlSelect = "SELECT `Emr_id`,emr_gynecological.`Patient_id`, emr_gynecological.`Doctor_id`,doctor_profile.Doctor_name,patient_profile.Patient_name,`Emr_date`, `Pathology`, `History_disease`, `Family`, `Periods_year`, `Periods_age`, `Periods_nature`, `Periods_cycle`, `Periods_noofdate`, `Periods_amount`, `Periods_lastdate`, `Stomachache`, `Marriage_year`, `Marriage_age`, `Periods_endyear`, `Periods_endage`, `Periods_treatment`, `Vascular`, `Temperature`, `Blood_pressure`, `Breathing`, emr_gynecological.`Weight`, `Body`, `Cyclic`, `Respiratory`, `Digest`, `Nerve`, `Bone`, `Kidney`, `Others_o`, `Secondary_signs`, `Big_lips`, `Baby_lips`, `Clitoris`, `Vulva`, `Hymen`, `Perineal`, `Vagina`, `Cervical`, `The_uterus`, `Extra`, `Douglas`, `Clinical_test`, `Summary`, `Main_disease`, `Secondary_disease`, `Distinguish`, `Prognosis`, `Treatment_direction_dt`, `Pathology_process`, `Labs_result`, `Treatments`, `Patient_status`, `Treatment_direction_s`, `File_pic`, `Emr_status` FROM `emr_gynecological` join doctor_profile on emr_gynecological.Doctor_id = doctor_profile.Doctor_id join patient_profile on emr_gynecological.Patient_id = patient_profile.Patient_id WHERE patient_profile.Patient_id ="+data+" ORDER BY emr_gynecological.Emr_date";
		connection.query(sqlSelect,function(err,results,fields){
			if(err)throw err;
			console.log(results);
			socket.emit('server_response_emr_female_for_doctor',{danhsach_benhan : results});
		});
	});
	socket.on('doctor_get_emr_mental_for_patient',function(data){
		sqlSelect = "SELECT `Emr_id`,emr_mental.Patient_id, emr_mental.Doctor_id,doctor_profile.Doctor_name,patient_profile.Patient_name, `Emr_date`, `Pathology`, `History_disease`, `Allergy`, `Drug`, `Alcohol`, `Tobacco`, `Pipe_tobacco`, `Others_rf`, `Family`, `Vascular`, `Temperature`, `Blood_pressure`, `Breathing`, emr_mental.Weight, `Body`, `Cyclic`, `Respiratory`, `Digest`, `Kidney`, `Bone`, `Ear_nose_throat`, `Teeth`, `Eye`, `Endocrine`, `Cranial_nerves`, `Bottom_of_eye`, `Motor`, `Field_force`, `Feel`, `Reflex`, `General_expression`, `Space`, `Time`, `Myself`, `Affection`, `Sense`, `Form`, `Content`, `Spirit`, `Instinct`, `Mechanically`, `Understandably`, `Analytical`, `Comprehensive`, `Attention`, `Clinical_test`, `Summary`, `Main_disease`, `Secondary_disease`, `Distinguish`, `Prognosis`, `Treatment_direction_dt`, `Pathology_process`, `Labs_result`, `Treatments`, `Patient_status`, `Treatment_direction_s`, `File_pic`, `Emr_status` FROM `emr_mental` join doctor_profile on emr_mental.Doctor_id = doctor_profile.Doctor_id join patient_profile on emr_mental.Patient_id=patient_profile.Patient_id WHERE patient_profile.Patient_id ="+data+" ORDER BY emr_mental.Emr_date";
		connection.query(sqlSelect,function(err,results,fields){
			if(err)throw err;
			console.log(results);
			socket.emit('server_response_emr_mental_for_doctor',{danhsach_benhan : results});
		});
	});
	// socket.on('doctor_request_patient_info_emr',function(data){
	// 	sqlSelect = "select * from patient_profile where patient_id ="+data+"";
	// 	connection.query(sqlSelect,function(err,results,fields){
	// 		if(err)throw err;
	// 		console.log(results);
	// 		socket.emit('server_send_patient_info_emr',{patient_full_info : results});
	// 	});
		
	// });
	socket.on('doctor_finish_call',function(data){
		io.to(data).emit('server_send_finish_call_to_patient',{abc : "abc"})
	});
	socket.on('doctor_cancel_call',function(data){
		io.to(data).emit('server_send_cancelation_call_to_patient',{abc : "abc"});
	});
	socket.on('doctor_accept_call',function(data){
		io.to(data).emit('server_send_acception_call_to_patient',{abc : "abc"});
	});
	socket.on('doctor_login',function(data){
		var check = false;
		var info = JSON.parse(data);
		console.log(info);
		var sql = "select * from doctor_profile";
		var Doctor_id;
		var Doctor_info = [];
		connection.query(sql,function(err,results,fields){
			if(err)throw err;
			for(var i=0;i<results.length;i++){
				console.log(results[i].Username + " "+info.Username + " "+ results[i].Password + " " + info.Password);
				if(info.Username == results[i].Username && info.Password == results[i].Password){
					Doctor_id = results[i].Doctor_id;
					Doctor_info.push(results[i]);
					check = true;
					break;
				}
			}
			if(check){
				console.log(Doctor_id + "  "+ info.Username +"  " + socket.id);
				var sqlOnline = "update doctor_profile set Socket_id ='"+socket.id+"',Online_status='online' where Doctor_id="+Doctor_id+"" ;
				connection.query(sqlOnline,function(err,results,fields){
					if(err)throw err;
					console.log("record insert 1 doctor is online");
				});
				Doctor_info.push(check);
				Doctor_info[0].Online_status = 'online';
				Doctor_info[0].Socket_id = socket.id;
				console.log("dang nhap thanh cong");
				for(var i = 0 ;i< Doctor_info.length;i++){
					console.log(Doctor_info[i]);
				}
				socket.emit('server_check_login_doctor',{ket_qua : Doctor_info});
				reloadDoctor();
			}
			else{
				socket.emit('server_check_login_doctor',{ket_qua : Doctor_info});
				console.log("dang nhap that bai");
			}
		});

	});
	
	socket.on('doctor_logout',function(data){
		console.log(data);
		var sqlDelete = "update doctor_profile set Online_status='offline',Socket_id='' where Username='"+data+"'" ;
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
		var sqlOffline = "update patient_profile set Online_status='offline',Socket_id='' where Socket_id='"+ socket.id +"'" ;
		connection.query(sqlOffline,function(err,results,fields){
			if(err)throw err;
			console.log("delete complete");
		});
		var sqlOffline1 = "update doctor_profile set Online_status='offline',Socket_id='' where Socket_id='"+ socket.id +"'" ;
		connection.query(sqlOffline1,function(err,results,fields){
			if(err)throw err;
			console.log("delete complete");
		});
		reloadDoctor();
		socket.disconnect();
	})
});
function reloadDoctor(){
	var sqlSelect1 = "SELECT doctor_profile.`Doctor_id`, `Username`, `Password`, `Doctor_name`, `Profile_picture`, `Gender`, `Clinic`, `Degree`, `Birthday`, `ID_Number`, `Phone_number`, `Address_number`, `Address_street`, `Address_distric`, `Address_city`, `Description`, `Online_status`, `Socket_id` FROM `doctor_profile` join doctor_disease on doctor_profile.Doctor_id=doctor_disease.Doctor_id WHERE doctor_disease.Disease_id = 1";
	connection.query(sqlSelect1,function(err,results,fields){
		if(err)throw err;
		io.sockets.emit('server_reload_doctor_1',{arrayDoctor : results});
	});
	var sqlSelect2 = "SELECT doctor_profile.`Doctor_id`, `Username`, `Password`, `Doctor_name`, `Profile_picture`, `Gender`, `Clinic`, `Degree`, `Birthday`, `ID_Number`, `Phone_number`, `Address_number`, `Address_street`, `Address_distric`, `Address_city`, `Description`, `Online_status`, `Socket_id` FROM `doctor_profile` join doctor_disease on doctor_profile.Doctor_id=doctor_disease.Doctor_id WHERE doctor_disease.Disease_id = 2";
	connection.query(sqlSelect2,function(err,results,fields){
		if(err)throw err;
		io.sockets.emit('server_reload_doctor_2',{arrayDoctor : results});
	});
	var sqlSelect3 = "SELECT doctor_profile.`Doctor_id`, `Username`, `Password`, `Doctor_name`, `Profile_picture`, `Gender`, `Clinic`, `Degree`, `Birthday`, `ID_Number`, `Phone_number`, `Address_number`, `Address_street`, `Address_distric`, `Address_city`, `Description`, `Online_status`, `Socket_id` FROM `doctor_profile` join doctor_disease on doctor_profile.Doctor_id=doctor_disease.Doctor_id WHERE doctor_disease.Disease_id = 3";
	connection.query(sqlSelect3,function(err,results,fields){
		if(err)throw err;
		io.sockets.emit('server_reload_doctor_3',{arrayDoctor : results});
	});

}

// module.exports = app;