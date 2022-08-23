const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const Schema = require('./Schema.js');
const bcrypt = require("bcryptjs");

const DB = "mongodb+srv://snips:snips@cluster0.hscsw.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const jwtKey = "stps1attendence2system3";
const cors=require("cors");


app.use(cors({
    origin: 'https://62fe78df0cb12a11ab6a65d7--fancy-piroshki-efb2da.netlify.app/'
}));
const port = process.env.PORT || 8080;

mongoose.connect(DB).then(() => {
	console.log("CONNECTED TO DB");
}).catch(err => console.log(err));


const Teacher = new mongoose.model("teachersdata", Schema.teacherSchema);
const Student = new mongoose.model("studentdata", Schema.studentSchema);


app.get('/api/createTeacher', async(req, res) => {
	var name = req.query.name;
	var pass = req.query.pass;
	var phone = req.query.phone;
	var cls = req.query.cls;
	var sec = req.query.sec;
	var hashedPassword = bcrypt.hashSync(pass, 10);
	try {
		var data = {
			name:name,
			pass:hashedPassword,
			phone:phone,
			cls:cls,
			section: sec
		};
		const r = await new Teacher(data).save();
		res.json({
			message : "Account Created!"
		});

	} catch(err) {
		res.json({
			message : "Error!"
		});
	}
});


app.get("/api/loginTeacher", async(req,res) => {
	var name = req.query.name;
	var pass = req.query.pass;
	try{
		var data = await Teacher.find({name});
		if(data.length>0){
			if(bcrypt.compareSync(pass, data[0].pass)){
                
				var d = {
					name : data[0]['name'],
					cls : data[0]['cls'],
					sec : data[0]['section'],
					role: "teacher",
					_id : data[0]['_id']
				};
				var token = jwt.sign(d, jwtKey);
				res.json({
					message:"Success",
					token:token,
					data : d
				});
			}else{
				res.json({
					message:"Teacher not found"
				});
			}
		}else{
			res.json({
				message:"Teacher not found"
			});
		}
	}catch(err){
		res.json({
			msg:"Teacher not found",
			err
		});
	}
	
});

app.get("/api/addStudent", async(req,res) => {
	var token = req.query.token;
	var name = req.query.name;
	var admNo = req.query.admNo;
	var cls = req.query.cls;
	var sec = req.query.sec;
	var gender = req.query.gender;
	var phone1 = req.query.phone1;
	var roll = req.query.roll;
	try{
                var data = jwt.verify(token, jwtKey);
		if(data.role=="teacher"){
		    var newStd = new Student({
			    name,admNo,cls,sec,phone1, gender, roll
		    });
		    var result = await newStd.save();
		    res.json({
		    	msg:"student added",
		    	data:result
		    });
	        }
		
		
	}catch(err){
		res.json({
			msg:"error",
			err
		});
	}
});



app.get("/api/todayReports", async(req, res) => {
	var date = new Date().getDate();
	var month = new Date().getMonth()<3?new Date().getMonth()+9:new Date().getMonth()-3;
	var cls = req.query.cls;
	var token = req.query.token;
	var sec = req.query.sec;
	var avg = 0;
	var arr = [];
	var a = 0;
	try {
		let data = await Student.find({cls : cls, sec : sec});
		for(let i = 0;i<data.length;i++) {
			arr.push({
				name : data[i]['name'],
				admNo : data[i]['admNo'],
				_id : data[i]['_id'],
				att : data[i]['attendance'][month][date-1]
			});
			data[i]['attendance'][month][date-1]?avg++:null;
			a++;
		}
		avg = (avg/data.length).toFixed(1);
		avg*=100;
		res.json({
			message: 'Success',
			data: arr,
			strength: data.length,
			presentPer : avg,
			absentPer : 100 - avg,
			present : (avg/100)*data.length,
			absent : data.length - (avg/100)*data.length,
		});
	} catch(err) {
		res.json({
			msg:"error",
			err
		});
	}
});





app.get("/api/maintainAtt", async(req, res) => {
	var token = req.query.token;
	sec = req.query.sec;
	var cls = req.query.cls;
	var date = new Date().getDate();
	var month = new Date().getMonth()<3?new Date().getMonth()+9:new Date().getMonth()-3;
	var id = req.query.id;
	var hour = new Date().getHours();
	hour*=60;
	hour+=new Date().getMinutes();
		try {

			let data = await Student.find({_id : id});
			if(data.length!=1) {
				res.json({
					message : 'notstudent'
				});
			}
			else {
				data = data[0];
				data['attendance'][month][date-1] = !data['attendance'][month][date-1];
				const result = await Student.updateOne({_id : id}, {
					$set:{
						name : data['name'],
						cls : data['cls'],
						sec: data['sec'],
						admNo : data['roll'],
						gender: data['gender'],
						attendance : data['attendance']
					}
				});
				res.json({
					message: 'success'
				})
			}

		} catch(err) {
			console.log(err)
			res.json({
				message: "Error!"
			});
		}
});


const getMonthPer = async(arr, month) => {
	var avg = 0;
	var eachAvg = 0;
	var eachArr = [];
	var c = 0;
	console.log("Month = "+month)
	var check = new Date().getMonth()<3?new Date().getMonth()+9:new Date().getMonth()-3;
	if(check==month) {
		for(var i = 0;i<arr.length;i++) {
			eachArr = arr[i];
			for(var j = 0;j<new Date().getDate(); j++) {
				c++;
				eachAvg+= eachArr['att'][j]?1:0;
			}
			eachAvg = (eachAvg/c)*100;
			avg = avg+eachAvg;
			eachAvg=0;
			c = 0;
		}
		avg = (avg/arr.length)
		return avg;
	}
	else {
		for(var i = 0;i<arr.length;i++) {
			eachArr = arr[i];
			for(var j = 0;j<eachArr['att'].length; j++) {
				eachAvg+= eachArr['att'][j]?1:0;
			}
			eachAvg = (eachAvg/eachArr['att'].length)*100;
			avg = avg+eachAvg;
			eachAvg=0;
		}
		avg = (avg/arr.length)
		return avg;
	}
}


const getDayPer = async(arr, month, day) => {
	var avg = 0;
	for(var i = 0;i<arr.length;i++) {
		var per = arr[i]['att'];
		avg = avg+(per?1:0);
	}
	avg = (avg/arr.length)*100;
	console.log(avg)
	return avg;
}


app.get("/api/getOverallReports", async(req, res) => {
	var month = req.query.month;
	var date = req.query.date;
	var token = req.query.token;
	var cls = req.query.cls;
	var sec = req.query.sec;
	var arr = [];
    const monthNames = ["April","May","June","July","August","September","October","November","December","January","February","March"];
	month = monthNames.indexOf(month);
	try {
		
		if(date=="0") {
			var data = await Student.find({cls:cls, sec:sec});
			for(let i = 0;i<data.length;i++) {
				arr.push({
					name : data[0]['name'],
					admNo : data[0]['admNo'],
					_id : data[0]['_id'],
					att : data[0]['attendance'][month]
				});
			}
			var per = await getMonthPer(arr, month);
			res.json({
				message: 'Success',
				data :{present : per.toFixed(1),
				absent : (100-per).toFixed(1)}
			});
		}
		else {
			var avg = 0;
			var arr = [];
			var a = 0;
			let data = await Student.find({cls : cls, sec : sec});
			for(let i = 0;i<data.length;i++) {
				arr.push({
					name : data[i]['name'],
					admNo : data[i]['admNo'],
					_id : data[i]['_id'],
					att : data[i]['attendance'][month][date-1]
				});
			}
			var per = await getDayPer(arr, month, date);
			
			res.json({
				message: 'Success',
				data :{
					present : per,
					absent : 100-per,
					list : arr
				}
			});
	}
}
	 catch(err) {
		console.log(err)
		res.json({
			msg:"error",
			err
		});
	}
});


const calcThis = async(arr, month, bool) => {
	let a = arr[month];
	let avg = 0;
	var ii = 0;
	if(bool) {
		for(var i = 0;i<new Date().getDate();i++) {
			avg = avg + (a[i]?1:0);
			ii++;
		}
		avg = (avg/ii)*100;
		return avg;
	}
	else {
		for(var i = 0;i<a.length;i++) {
			avg = avg + (a[i]?1:0);
			ii++;
		}
		avg = (avg/ii)*100;
		return avg;
	}
};


const convertToDate = async(arr, month) => {
	let arr2 = [];
	console.log(arr)
	for(var i = 0; i<new Date().getDate(); i++) {
		arr2.push({
			date : `${i+1}/${month}/2022`,
			att : arr[i]
		});
	}
	return arr2;
};


app.get("/api/getProf", async(req, res) => {
	var token = req.query.token;
	var id = req.query.id;
	var month = new Date().getMonth()<3?new Date().getMonth()+9:new Date().getMonth()-3;
	var month2 = month==0?11:month-1;
	try {
		let st = await Student.find({_id:id});
		st = st[0];
		let thisMonth = await calcThis(st['attendance'], month, true);
		let prevMonth = await calcThis(st['attendance'], month2, false);
		let arr = st['attendance'][month];
		arr = await convertToDate(arr, `${new Date().getMonth()+1}`.length==1?`0${new Date().getMonth()+1}`:`${new Date().getMonth()+1}`);
		res.json({
			message: 'Success',
			thisMonth : thisMonth.toFixed(1),
			prevMonth : prevMonth.toFixed(1),
			info : {
				name : st['name'],
				admNo: st['admNo'],
				list : arr
			}
		});
	} catch(err) {
		console.log(err);
		res.json({
			message:'err'
		})
	}
});


app.get("/api/getStudents", async(req, res) => {
	var cls = req.query.cls;
	var token = req.query.token;
	var sec = req.query.sec;
	try {
		var data = jwt.verify(token, jwtKey);
		let st = await Student.find({cls:cls, sec:sec});
		res.json({
			message:'Sucess',
			data:st
		});
	} catch(err) {
		console.log(err)
		res.json({
			message:'err'
		});
	}
});

app.get("/api/deleteStudent", async(req, res) => {
	var id = req.query.id;
	var token = req.query.token;
	try {
		var data = jwt.verify(token, jwtKey);
		let st = await Student.deleteOne({_id:id});
		console.log(st);
		res.json({
			message:'Sucess',
		});
	} catch(err) {
		console.log(err)
		res.json({
			message:'err'
		});
	}
});

app.listen(port, () => {
	console.log(`Server running on port ${port}`);
});


