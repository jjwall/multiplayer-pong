$(document).ready(function () {
	
	window.WebSocket = window.WebSocket || window.MozWebSocket;
	
	//var connection = new WebSocket('ws://localhost:8080');
	var connection = new WebSocket('ws:https://png-game.herokuapp.com/');
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
		connection.send('start');
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
			connection.send(`${currentPlayer} up`);
		}
		if (keyDown) {
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
			if (gameObjs.leftpaddle.score !== player1Score || gameObjs.rightpaddle.score !== player2Score) {
				$('#player1Score').empty();
				$('#player2Score').empty();
				$('#player1Score').append(gameObjs.leftpaddle.score);
				$('#player2Score').append(gameObjs.rightpaddle.score);
				player1Score = gameObjs.leftpaddle.score;
				player2Score = gameObjs.rightpaddle.score;
			}
			if (gameObjs.leftpaddle.win) {
				winnerElem.append("player 1 wins");
			}
			if (gameObjs.rightpaddle.win) {
				winnerElem.append("player 2 wins");
			}
		}
	};
	
	$(window).on('unload', function(e) {
		connection.send('disconnect');
	});
});