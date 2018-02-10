var express = require('express');
var WebSocket = require('ws');
var http = require('http');

var app = express();
var PORT = process.env.PORT || 8080;

var server = http.createServer(app);

var wss = new WebSocket.Server({ server });

var gameObjs = {
	puck: {
		x: 50,
		y: 20,
		w: 10,
		h: 10,
		velx: 0,
		vely: 0
	},
	leftpaddle: {
		x: 0,
		y: 0,
		w: 10,
		h: 50,
		velx: 0,
		vely: 5
	}
}

function puckYVal(paddlepos, puckpos) {
	var halfPaddle = paddlepos - 25;
	if (puckpos < halfPaddle) {
		var ratio = (halfPaddle - puckpos) / 100;
		return -20 * ratio;
	}
	else if (puckpos > halfPaddle) {
		var ratio = (puckpos - halfPaddle) / 100;
		return 20 * ratio;
		}
		//return 5;
	else 
		return 0;
}

var gameState = true;

var players = 0;

wss.on('connection', function(connection) {
	console.log((new Date()) + " Connection accepted.");
	players++;
	connection.send(players);
	
	if (players >= 2) {
		gameObjs.puck.velx = 5;
		gameObjs.puck.vely = 5;
		startGame();
	}
	
	function startGame() {
		setInterval(function() {
			if (!gameState) {
				return;
			}
			if (gameObjs.puck.x >= 740) {
				gameObjs.puck.velx = -5;
			}
			if (gameObjs.puck.y >= 490) {
				gameObjs.puck.vely = gameObjs.puck.vely * (-1);
			}
			// if (gameObjs.puck.x <= 0) {
				// gameObjs.puck.velx = 5;
			// }
			if (gameObjs.puck.y <=0) {
				gameObjs.puck.vely = gameObjs.puck.vely * (-1);
			}
			if (gameObjs.puck.y >= gameObjs.leftpaddle.y
				&& gameObjs.puck.y <= gameObjs.leftpaddle.y + gameObjs.leftpaddle.h
				&& gameObjs.puck.x <= gameObjs.leftpaddle.w) {
					var paddlePos = gameObjs.leftpaddle.y + gameObjs.leftpaddle.h;
					var puckPos = gameObjs.puck.y + gameObjs.puck.h;
					gameObjs.puck.vely = puckYVal(paddlePos, puckPos);
					gameObjs.puck.velx = 5;
				//gameObjs.puck.vely = -5;
			}
			// if (gameObjs.puck.y >= gameObjs.leftpaddle.y// + (gameObjs.leftpaddle.y + gameObjs.leftpaddle.h)/2
				// && gameObjs.puck.y <= gameObjs.leftpaddle.y + gameObjs.leftpaddle.h
				// && gameObjs.puck.x <= gameObjs.leftpaddle.w) {
				// gameObjs.puck.velx = 5;
				// gameObjs.puck.vely = 5;
			// }
				
			gameObjs.puck.x += gameObjs.puck.velx;
			gameObjs.puck.y += gameObjs.puck.vely;
			
			var gameObjsString = JSON.stringify(gameObjs);
			
			wss.clients.forEach(client => {
				client.send(gameObjsString);
			});
		}, 20);
	}
	
	connection.on('message', function(message) {
		if (message == 'disconnect') {
			connection.terminate();
		}
		
		if (message == '1 up') {
			if (gameObjs.leftpaddle.y >= 0) {
				gameObjs.leftpaddle.y -= gameObjs.leftpaddle.vely;
			}
		}
		
		if (message == '1 down') {
			if (gameObjs.leftpaddle.y <= 450) {
				gameObjs.leftpaddle.y += gameObjs.leftpaddle.vely;
			}
		}
		
		if (message == '2 up') {
			console.log("2 up");
		}
		
		if (message == '2 down') {
			console.log("2 down");
		}
		
		if (message == 'start') {
			console.log(players);
			gameObjs.puck.velx = 5;
			gameObjs.puck.vely = 5;
			if (players > 1) {
				gameState = false;
			}
			startGame();
		}
	});
	
	connection.on('close', function(close) {
		players--;
		console.log(`A client left the game there are ${players} players left.`);
	});
});

app.use(express.static('./public'));

server.listen(PORT, function () {
	console.log(`app listening on port ${PORT}`);
});