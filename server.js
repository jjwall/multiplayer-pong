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
		vely:0
	}
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
				gameObjs.puck.vely = -5;
			}
			if (gameObjs.puck.x <= 0) {
				gameObjs.puck.velx = 5;
			}
			if (gameObjs.puck.y <=0){
				gameObjs.puck.vely = 5;
			}
			gameObjs.puck.x += gameObjs.puck.velx;
			gameObjs.puck.y += gameObjs.puck.vely;
			
			var gameObjsString = JSON.stringify(gameObjs);
			
			wss.clients.forEach(client => {
				client.send(gameObjsString);
			});
		}, 20);
	}
	
	connection.on('message', function(message) {
		console.log(`received: ${message}`);
		
		if (message == 'disconnect') {
			connection.terminate();
		}
		
		if (message == '1 up') {
			console.log("1 up");
		}
		
		if (message == '1 down') {
			console.log("1 down");
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