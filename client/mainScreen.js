const sock = io();
//Global Variables
var obj = null;
let questions = null;
let score = {};
let questionNo = 0;
let globcrc = "";
let room = null;
let noOfplayers = null;
let ready = 0;
let players = {};
let avail;
let gameState = false;
function getQ (url) {
	
	var Httpreq = new XMLHttpRequest();
	Httpreq.open("GET",url,false);
	Httpreq.send(null);
	return Httpreq.responseText;
	
}

function shuffleArray(array) {
	
	for(let i = array.length - 1; i > 0; i--) {
		
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
		
	}
	return array;
	
}


sock.on("players", function(data){
	noOfplayers = data - 1;
	//console.log(noOfplayers);
});

sock.on("available", function(data){
    avail = data;
});

sock.on("joined", function(data){
	//console.log(data[0] + " " + data[1]);
	players[data[0]] = data[1];
	score[data[0]] = 0;
	document.getElementById("lobby").innerHTML += "<br>" + data[1];



});

sock.on("ans", function(data){
	//console.log(data[1]);
	checkAns(data);
});

sock.on("dc", function(data){
	if(gameState) {
		document.getElementById("roomCode").style.display = "none";
		document.getElementById("waiting").style.display = "none";
		document.getElementById("lobby").style.display = "none";
		document.getElementById("begin").style.display = "none";
		
		document.getElementById("q").innerHTML = "";
		document.getElementById("answers").innerHTML = "";
		document.getElementById("disconnect").style.display ="";
		document.getElementById("disconnect").innerHTML = players[data] + " has disconnected! Game Over."
		let selection = document.createElement("DIV");
		let txt = document.createTextNode("Main Menu");
		selection.appendChild(txt);
		selection.setAttribute("onClick",'location.href="index.html"');
		selection.setAttribute("class","option");
		selection.setAttribute("id","restart");
		document.getElementById("answers").appendChild(selection); 
	} else {
		let h = document.getElementById("lobby").innerHTML;
		let nh = h.replace(("<br>"  + players[data]), "");
		document.getElementById("lobby").innerHTML = nh;
	}

});

function load() {
    document.getElementById("begin").style.display ="none";
	document.getElementById("waiting").style.display ="none";
	document.getElementById("disconnect").style.display ="none";
	document.getElementById("lobby").style.display = "none";
	document.getElementById("roomCode").style.display = "none";
    let catUrl = "https://opentdb.com/api_category.php";
	let catObj = JSON.parse(getQ(catUrl));
	let categories = catObj.trivia_categories;
	
	
	for(let i = 0; i < categories.length; i++) {
	let catID = categories[i].id;
	let catName = categories[i].name;
	
	let opt = document.createElement("OPTION");
	opt.text = catName;
	opt.value = catID;
	document.getElementById("cat").appendChild(opt);
	
	}

	let selection = document.createElement("DIV");
    let txt = document.createTextNode("Join existing lobby");
    selection.appendChild(txt);
    selection.setAttribute("onClick",'location.href="join.html"');
    selection.setAttribute("class","option");
    selection.setAttribute("id","restart");
    document.getElementById("answers").appendChild(selection); 


}

document.addEventListener("DOMContentLoaded", function() {
    load();
});

function checkRoom() {
    let rc = document.getElementById("room").value.trim();
	if(rc == "") {
		alert("Error! Please enter a room code to continue.");
        document.getElementById("room").value = "";
		return;
    } 

    sock.emit("checkRoom", document.getElementById("room").value);

    setTimeout(function(){
        //Timeout function to ensure that we have recieved a response from the server before executing the next block of code.
        if(!avail) {
           gameConfig();
        } else {
            alert("The room you entered already exists. Please enter another code. Remember room codes are case sensitive and may include spaces.");
            return;
        }
        
    },1000);
}



function gameConfig() {

	let noQ = (document.getElementById("noq").value).toString();
	let cat = (document.getElementById("cat").value).toString();
    let dif = (document.getElementById("dif").value).toString();
	
	room = (document.getElementById("room").value).toString();
    document.getElementById("config").style.display = "none"; 
    document.getElementById("start").style.display = "none";
    sock.emit("hostConnect", [room, name]);

	let gameURL = "";
	if((cat == "" && dif == "")) {
		gameURL = "https://opentdb.com/api.php?amount=" + noQ;
	} else if(cat == "" && dif != "") {
		gameURL = "https://opentdb.com/api.php?amount=" + noQ + "&difficulty=" + dif;
	} else if(cat != "" && dif == "") {
		gameURL ="https://opentdb.com/api.php?amount=" + noQ + "&category=" + cat;
	} else {
		gameURL = "https://opentdb.com/api.php?amount=" + noQ + "&category=" + cat + "&difficulty=" + dif;

	}


	obj = JSON.parse(getQ(gameURL));
	questions = obj.results;
	
	//https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=Example
	document.getElementById("waiting").innerHTML = "Room Code: " + room + " <br> Go to https://alingam-quizdemo.herokuapp.com/join.html";
	let roomInfo = "https://alingam-quizdemo.herokuapp.com/join.html?room=" + room; 
	let qr = "https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=" + roomInfo;


	document.getElementById("code").setAttribute("src",qr);
	document.getElementById("waiting").style.display ="";
	document.getElementById("roomCode").style.display ="";
	document.getElementById("begin").style.display ="";
	document.getElementById("lobby").style.display = "";
	document.getElementById("restart").style.display = "none";
}

function nextQuestion(){

	if(questions.length > 0) {
		ready = 0;
		document.getElementById("start").style.display = "none";
		document.getElementById("config").style.display = "none";
		document.getElementById("answers").innerHTML = "";
		sock.emit("question", [questions[0], room]);
		
		
		let inc = questions[0].incorrect_answers;
		let crc = questions[0].correct_answer;
		globcrc = crc;
		let options = inc.concat(crc);
		shuffleArray(options);
		questionNo = questionNo + 1;
		document.getElementById("q").innerHTML = questionNo + ") " + questions[0].question;
	
		for(let i = 0; i < options.length; i++) {
			let selection = document.createElement("DIV");
			let txt = document.createTextNode(options[i]);
			selection.appendChild(txt);
			selection.setAttribute("value",options[i]);
			selection.setAttribute("class","modifiers");
			document.getElementById("answers").appendChild(selection);
		} 
	} else {

		
		document.getElementById("answers").innerHTML = "";
		document.getElementById("q").innerHTML = "";
		let y = Object.keys(score);
		sock.emit("end", score);
		y.forEach(function(prop) {
			//console.log(prop, " = ", score[prop]);
			let selection = document.createElement("DIV");
			let txt = document.createTextNode(players[prop] + " Score: " + score[prop]);
			selection.appendChild(txt);
			selection.setAttribute("class","modifiers");
			document.getElementById("answers").appendChild(selection);
		});

		let selection = document.createElement("DIV");
		let txt = document.createTextNode("Main Menu");
		selection.appendChild(txt);
		selection.setAttribute("onClick",'location.href="index.html"');
		selection.setAttribute("class","option");
		selection.setAttribute("id","restart");
		document.getElementById("answers").appendChild(selection); 

	}
}


function checkAns(data) {

	let ans = data[1];
	let playerID = data[0];

	if(ans == globcrc) {
		//console.log(players[data[0]] + " is correct!");
		score[playerID] += 1;
		//console.log(players[playerID] + " Score: " + score[playerID]);
		ready += 1;

		sock.emit("correct", [playerID, score[playerID], ans]);

	} else {
		//console.log(players[data[0]] + " is incorrect!");
		ready += 1;

		sock.emit("incorrect", [playerID, score[playerID], globcrc]);
	}

//	console.log(score[0]);
	if(ready == noOfplayers) {
		questions.shift();
		setTimeout(function(){
			nextQuestion()
		},1000);
	}


}


function beginGame() {
	sock.emit("noOfPlayers", room);

	setTimeout(function(){
		if(noOfplayers > 0) {
			document.getElementById("begin").style.display = "none";
			document.getElementById("lobby").style.display = "none";
			document.getElementById("waiting").style.display = "none";
			document.getElementById("roomCode").style.display ="none";
			sock.emit("close", room);
			gameState = true;
			nextQuestion();
		} else {
			alert("You need atleast 1 player to start the game.")
		}
	},500);


}



