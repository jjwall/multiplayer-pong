var express = require('express');
var WebSocket = require('ws');
var http = require('http');

var app = express();
var PORT = process.env.PORT || 8080;

var server = http.createServer(app);

var wss = new WebSocket.Server({ server });

var gameObjs = {
	puck: {
		x: 375,
		y: 250,
		w: 10,
		h: 10,
		velx: 0,
		vely: 0
	},
	leftpaddle: {
		x: 0,
		y: 225,
		w: 10,
		h: 50,
		velx: 0,
		vely: 8,
		score: 0,
		win: false
	},
	rightpaddle: {
		x: 740,
		y: 225,
		w: 10,
		h: 50,
		velx: 0,
		vely: 8,
		score: 0,
		win: false
	}
}

// function that calculates puck's Y velocity based on where puck hits the paddle
function puckYVal(paddlepos, puckpos) {
	var halfPaddle = paddlepos - 25;
	// i.e. top half of the paddle
	if (puckpos < halfPaddle) {
		var ratio = (halfPaddle - puckpos) / 100;
		return -20 * ratio;
	}
	// i.e. bottom half of the paddle
	else if (puckpos > halfPaddle) {
		var ratio = (puckpos - halfPaddle) / 100;
		return 20 * ratio;
		}
	else 
		return 0;
}

var gameObjsString;

var gameFrames;

var gameState;

var players = 0;

wss.on('connection', function(connection) {
	console.log((new Date()) + " Connection accepted.");
	players++;
	connection.send(players);
	
	function startGame() {
		gameFrames = setInterval(function() {
			if (!gameState) {
				clearInterval(gameFrames);
			}
			if (gameObjs.puck.x >= 740) {
				// player 1 scores
				gameObjs.leftpaddle.score++;
				resetPuck();
			}
			if (gameObjs.puck.y <=0 || gameObjs.puck.y >= 490) {
				gameObjs.puck.vely = gameObjs.puck.vely * (-1);
			}
			if (gameObjs.puck.x <= 0) {
				// player 2 scores
				gameObjs.rightpaddle.score++;
				resetPuck();
			 }
			// left paddle collision detection
			if (gameObjs.puck.y + gameObjs.puck.h >= gameObjs.leftpaddle.y
				&& gameObjs.puck.y <= gameObjs.leftpaddle.y + gameObjs.leftpaddle.h
				&& gameObjs.puck.x <= gameObjs.leftpaddle.w) {
					var paddlePos = gameObjs.leftpaddle.y + gameObjs.leftpaddle.h;
					var puckPos = gameObjs.puck.y + gameObjs.puck.h;
					gameObjs.puck.vely = puckYVal(paddlePos, puckPos);
					gameObjs.puck.velx = gameObjs.puck.velx * (-1);
			}
			// right paddle collision detection
			if (gameObjs.puck.y + gameObjs.puck.h >= gameObjs.rightpaddle.y
				&& gameObjs.puck.y <= gameObjs.rightpaddle.y + gameObjs.rightpaddle.h
				&& gameObjs.puck.x >= 740 - gameObjs.rightpaddle.w) {
					var paddlePos = gameObjs.rightpaddle.y + gameObjs.rightpaddle.h;
					var puckPos = gameObjs.puck.y + gameObjs.puck.h;
					gameObjs.puck.vely = puckYVal(paddlePos, puckPos);
					gameObjs.puck.velx = gameObjs.puck.velx * (-1);
			}
				
			gameObjs.puck.x += gameObjs.puck.velx;
			gameObjs.puck.y += gameObjs.puck.vely;
			
			gameObjsString = JSON.stringify(gameObjs);
			
			wss.clients.forEach(client => {
				client.send(gameObjsString);
			});
		}, 20);
	}
	
	// if a goal is scored this function is trigged
	function resetPuck() {
		clearInterval(gameFrames);
		
		if (gameObjs.leftpaddle.score === 1 || gameObjs.rightpaddle.score === 1) {
			gameState = false;
			if (gameObjs.leftpaddle.score === 1) {
				gameObjs.leftpaddle.win = true;
			}
			if (gameObjs.rightpaddle.score === 1) {
				gameObjs.rightpaddle.win = true;
			}
		}
		
		gameObjsString = JSON.stringify(gameObjs);
			// update score and send winner results
		wss.clients.forEach(client => {
			client.send(gameObjsString);
		});
		
		if (gameObjs.leftpaddle.score < 1 && gameObjs.rightpaddle.score < 1) {
			gameObjs.puck.x = 375;
			gameObjs.puck.y = 240;
			gameObjs.leftpaddle.y = 225;
			gameObjs.rightpaddle.y = 225;
			setTimeout(function(){
				if (gameState) {
					startGame();
				}
			}, 3000);
		}
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
			if (gameObjs.rightpaddle.y >= 0) {
				gameObjs.rightpaddle.y -= gameObjs.rightpaddle.vely;
			}
		}
		
		if (message == '2 down') {
			if (gameObjs.rightpaddle.y <= 450) {
				gameObjs.rightpaddle.y += gameObjs.rightpaddle.vely;
			}
		}
		
		if (message == 'start') {
			if (!gameState) {
				gameState = true;
				clearInterval(gameFrames);
				gameObjs.puck.x = 375;
				gameObjs.puck.y = 240;
				gameObjs.leftpaddle.y = 225;
				gameObjs.rightpaddle.y = 225;
				gameObjs.leftpaddle.score = 0;
				gameObjs.rightpaddle.score = 0;
				gameObjs.leftpaddle.win = false;
				gameObjs.rightpaddle.win = false;
				gameObjs.puck.velx = 9;
				gameObjs.puck.vely = 0;
				startGame();
			}
		}
	});
	
	connection.on('close', function(close) {
		players--;
		if (players === 0) {
			gameState = false;
			clearInterval(gameFrames);
		}
		console.log(`A client left the game there are ${players} players left.`);
	});
});

app.use(express.static('./public'));

server.listen(PORT, function () {
	console.log(`app listening on port ${PORT}`);
});