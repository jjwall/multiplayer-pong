// TO DO:
// Create Join button
// Hide Start / Reset button
// Until at least 2 players have joined
// Create dynamic routes
// Create landing page

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
		vely: 6,
		score: 0
	},
	rightpaddle: {
		x: 740,
		y: 225,
		w: 10,
		h: 50,
		vely: 6,
		score: 0
	},
	players: 0
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

var concurrentGames = {};

var gameObjsString;

var gameFrames;

var serverOnline = false;

var players = 0;

wss.on('connection', function(connection) {
	console.log((new Date()) + " Connection accepted.");
	players++;
	connection.send(players);
	
	function startGame() {
		gameFrames = setInterval(function() {
			Object.keys(concurrentGames).forEach(gameObjs => {
				if (concurrentGames[gameObjs].puck.x >= 740) {
					// player 1 scores
					concurrentGames[gameObjs].leftpaddle.score++;
					resetPuck(gameObjs);
				}
				if (concurrentGames[gameObjs].puck.y <=0 || concurrentGames[gameObjs].puck.y >= 490) {
					concurrentGames[gameObjs].puck.vely = concurrentGames[gameObjs].puck.vely * (-1);
				}
				if (concurrentGames[gameObjs].puck.x <= 0) {
					// player 2 scores
					concurrentGames[gameObjs].rightpaddle.score++;
					resetPuck(gameObjs);
				 }
				// left paddle collision detection
				if (concurrentGames[gameObjs].puck.y + concurrentGames[gameObjs].puck.h >= concurrentGames[gameObjs].leftpaddle.y
					&& concurrentGames[gameObjs].puck.y <= concurrentGames[gameObjs].leftpaddle.y + concurrentGames[gameObjs].leftpaddle.h
					&& concurrentGames[gameObjs].puck.x <= concurrentGames[gameObjs].leftpaddle.w) {
						var paddlePos = concurrentGames[gameObjs].leftpaddle.y + concurrentGames[gameObjs].leftpaddle.h;
						var puckPos = concurrentGames[gameObjs].puck.y + concurrentGames[gameObjs].puck.h;
						concurrentGames[gameObjs].puck.vely = puckYVal(paddlePos, puckPos);
						concurrentGames[gameObjs].puck.velx = concurrentGames[gameObjs].puck.velx * (-1);
				}
				// right paddle collision detection
				if (concurrentGames[gameObjs].puck.y + concurrentGames[gameObjs].puck.h >= concurrentGames[gameObjs].rightpaddle.y
					&& concurrentGames[gameObjs].puck.y <= concurrentGames[gameObjs].rightpaddle.y + concurrentGames[gameObjs].rightpaddle.h
					&& concurrentGames[gameObjs].puck.x >= 740 - concurrentGames[gameObjs].rightpaddle.w) {
						var paddlePos = concurrentGames[gameObjs].rightpaddle.y + concurrentGames[gameObjs].rightpaddle.h;
						var puckPos = concurrentGames[gameObjs].puck.y + concurrentGames[gameObjs].puck.h;
						concurrentGames[gameObjs].puck.vely = puckYVal(paddlePos, puckPos);
						concurrentGames[gameObjs].puck.velx = concurrentGames[gameObjs].puck.velx * (-1);
				}
					
				concurrentGames[gameObjs].puck.x += concurrentGames[gameObjs].puck.velx;
				concurrentGames[gameObjs].puck.y += concurrentGames[gameObjs].puck.vely;
				
				gameObjsString = JSON.stringify(concurrentGames);
				
				wss.clients.forEach(client => {
					client.send(gameObjsString);
				});
			})
		}, 20);
	}
	
	// if a goal is scored this function is trigged
	function resetPuck(route) {
		// a player scored 11, end game and send resting values
		if (concurrentGames[route].leftpaddle.score === 11 || concurrentGames[route].rightpaddle.score === 11) {
			concurrentGames[route].puck.x = 375;
			concurrentGames[route].puck.y = 240;
			concurrentGames[route].leftpaddle.y = 225;
			concurrentGames[route].rightpaddle.y = 225;
			concurrentGames[route].puck.velx = 0;
			concurrentGames[route].puck.vely = 0;
		}
		// each players score is below 11, reset puck position and continue game
		if (concurrentGames[route].leftpaddle.score < 11 && concurrentGames[route].rightpaddle.score < 11) {
			concurrentGames[route].puck.x = 375;
			concurrentGames[route].puck.y = 240;
			var storeVelY = concurrentGames[route].puck.vely;
			var storeVelX = concurrentGames[route].puck.velx;
			concurrentGames["xxxxx"].puck.vely = 0;
			concurrentGames[route].puck.velx = 0;
			setTimeout(function(){
				// if undefined then don't execute this block of code or server will die.
				if (concurrentGames[route] != undefined) { 
					concurrentGames[route].puck.vely = storeVelY;
					concurrentGames[route].puck.velx = storeVelX * (-1);
				}
			}, 3000);
		}
	}
	
	connection.on('message', function(message) {
		
		// need to work on this more
		// will be utilizing -> concurrentGames["xxxxx"] = gameObjs;
		// for VERY FIRST player who joins game
		if (message == 'join') {
			// receive route + join
			// if (concurrentGames["xxxxx"] == undefined) {
				//concurrentGames["xxxxx"] = gameObjs;
			//}
			concurrentGames["xxxxx"].players++;
			connection.send(concurrentGames["xxxxx"].players);
		}
		
		// need to work on this more
		// see connection.on('close'...
		if (message == 'disconnect') {
			// receive route + disconnect
			if (concurrentGames["xxxxx"].players > 0) {
				concurrentGames["xxxxx"].players--;
			}
			if (concurrentGames["xxxxx"].players === 0) {
				delete concurrentGames["xxxxx"];
			}
			connection.terminate();
		}
		
		if (message == '1 up') {
			// receive route + 1 + up
			if (gameObjs.leftpaddle.y >= 0) {
				gameObjs.leftpaddle.y -= gameObjs.leftpaddle.vely;
			}
		}
		
		if (message == '1 down') {
			// receive route + 1 + down
			if (gameObjs.leftpaddle.y <= 450) {
				gameObjs.leftpaddle.y += gameObjs.leftpaddle.vely;
			}
		}
		
		if (message == '2 up') {
			// receive route + 2 + up
			if (gameObjs.rightpaddle.y >= 0) {
				gameObjs.rightpaddle.y -= gameObjs.rightpaddle.vely;
			}
		}
		
		if (message == '2 down') {
			// receive route + 2 + up
			if (gameObjs.rightpaddle.y <= 450) {
				gameObjs.rightpaddle.y += gameObjs.rightpaddle.vely;
			}
		}
		
		if (message == 'start') {
			// starting values
			concurrentGames["xxxxx"] = gameObjs; // -> will go on "join" block
			concurrentGames["xxxxx"].puck.x = 375;
			concurrentGames["xxxxx"].puck.y = 240;
			concurrentGames["xxxxx"].leftpaddle.y = 225;
			concurrentGames["xxxxx"].rightpaddle.y = 225;
			concurrentGames["xxxxx"].leftpaddle.score = 0;
			concurrentGames["xxxxx"].rightpaddle.score = 0;
			concurrentGames["xxxxx"].puck.velx = 9;
			concurrentGames["xxxxx"].puck.vely = 0;
		}
	});
	
	// this is temporary for testing purposes
	// these type of operations will be called in "disconnect" block
	connection.on('close', function(close) {
		players--;
		if (players === 0) {
			delete concurrentGames["xxxxx"];
		}
		console.log(`A client left the game there are ${players} players left.`);
	});
	
	if (!serverOnline) {
		serverOnline = true;
		startGame();
	}
});

app.use(express.static('./public'));

server.listen(PORT, function () {
	console.log(`app listening on port ${PORT}`);
});