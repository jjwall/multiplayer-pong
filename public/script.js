$(document).ready(function () {
	
	window.WebSocket = window.WebSocket || window.MozWebSocket;
	
	var connection = new WebSocket('ws://localhost:8080');
	//var connection = new WebSocket('wss://png-game.herokuapp.com/');
	
	var route;
	
	console.log(window.location.href);

	if (window.location.href.substring(7,8) === "l") {
		route = window.location.href.substring(22,27);
		console.log(route);
	}
	else if (window.location.href.substring(8,9) === "p") {
		route = window.location.href.substring(28,33);
	}
	
	var canvas = document.getElementById('pongTable');
	var ctx = canvas.getContext('2d');
	var winnerElem = $('#winner');
	var currentPlayer;
	var keyUp = false;
	var keyDown = false;
	var player1Score = 0;
	var player2Score = 0;
	ctx.strokeStyle = 'white';
	ctx.rect(375, 240, 10, 10);
	ctx.rect(0, 225, 10, 50);
	ctx.rect(740, 225, 10, 50);
	ctx.stroke();
	
	connection.onopen = function () {
		console.log(connection);
	};
	
	$('#startButton').on('click', function() {
		// send route + start
		connection.send(route + ' start');
	});
	
	$('#joinButton').on('click', function() {
		connection.send(route + ' join');
		$('#joinButton').hide();
	});
	
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
		winnerElem.empty();
		if (keyUp) {
			connection.send(route + ' ' + currentPlayer + ' up');
		}
		else {
			connection.send(route + ' ' + currentPlayer + ' up false');
		}
		if (keyDown) {
			connection.send(route + ' ' + currentPlayer + ' down');
		}
		else {
			connection.send(route + ' ' + currentPlayer + ' down false');
		}
		if (message.data.length === 1) {
			// if message data length is 1 then we are receiving player join info
			currentPlayer = message.data;
			console.log(`you are player ${message.data}`);
		}
		else {
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			ctx.beginPath();
			var gameObjs = JSON.parse(message.data);
			ctx.rect(gameObjs[route].puck.x, gameObjs[route].puck.y, gameObjs[route].puck.w, gameObjs[route].puck.h);
			ctx.rect(gameObjs[route].leftpaddle.x, gameObjs[route].leftpaddle.y, gameObjs[route].leftpaddle.w, gameObjs[route].leftpaddle.h);
			ctx.rect(gameObjs[route].rightpaddle.x, gameObjs[route].rightpaddle.y, gameObjs[route].rightpaddle.w, gameObjs[route].rightpaddle.h); 
			ctx.stroke();
			if (gameObjs[route].leftpaddle.score !== player1Score || gameObjs[route].rightpaddle.score !== player2Score) {
				$('#player1Score').empty();
				$('#player2Score').empty();
				$('#player1Score').append(gameObjs[route].leftpaddle.score);
				$('#player2Score').append(gameObjs[route].rightpaddle.score);
				player1Score = gameObjs[route].leftpaddle.score;
				player2Score = gameObjs[route].rightpaddle.score;
			}
			if (gameObjs[route].leftpaddle.score === 11) {
				winnerElem.append("player 1 wins");
			}
			if (gameObjs[route].rightpaddle.score === 11) {
				winnerElem.append("player 2 wins");
			}
		}
	};
	
	$(window).on('unload', function(e) {
		// send route + disconnect
		connection.send(route + ' disconnect');
	});
});