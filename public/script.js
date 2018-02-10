$(document).ready(function () {
	
	window.WebSocket = window.WebSocket || window.MozWebSocket;
	
	var connection = new WebSocket('ws://localhost:8080');
	var canvas = document.getElementById("pongTable");
	var ctx = canvas.getContext("2d");
	var currentPlayer;
	var keyUp = false;
	var keyDown = false;
	ctx.strokeStyle = 'white';
	
	connection.onopen = function () {
		console.log(connection);
	};
	
	// window.onkeydown = function (e) {
		// if (e.keyCode === 13) {
			// puckStart();
		// }
	// };
	
	window.onkeydown = function(e) {
		if (e.keyCode === 38) {
			keyUp = true;
		}
		if (e.keyCode === 40) {
			keyDown = true;
		}
	}
	
	window.onkeyup = function(e) {
		if (e.keyCode === 38) {
			keyUp = false;
		}
		if (e.keyCode === 40) {
			keyDown = false;
		}
	}

	connection.onmessage = function (message) {
		if (keyUp) {
			//console.log("up");
			connection.send(`${currentPlayer} up`);
		}
		if (keyDown) {
			//console.log("down");
			connection.send(`${currentPlayer} down`);
		}
		if (message.data.length === 1) {
			currentPlayer = message.data;
			console.log(`you are player ${message.data}`);
		}
		else {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.beginPath();
			var gameObjs = JSON.parse(message.data);
			ctx.rect(gameObjs.puck.x, gameObjs.puck.y, gameObjs.puck.w, gameObjs.puck.h);
			ctx.rect(gameObjs.leftpaddle.x, gameObjs.leftpaddle.y, gameObjs.leftpaddle.w, gameObjs.leftpaddle.h);
			ctx.rect(gameObjs.rightpaddle.x, gameObjs.rightpaddle.y, gameObjs.rightpaddle.w, gameObjs.rightpaddle.h);
			ctx.stroke();
		}
	};
	
	function puckStart() {
		connection.send("start");
	};
	
	$(window).on("unload", function(e) {
		connection.send("disconnect");
	});
});