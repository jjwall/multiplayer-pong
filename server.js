// TO DO:

// 1. 
// Make Error 404 page
// 2.
// Swap out start button with "ready up" system so game doesn't
// start until both players have clicked "ready"
// 3.
// Make angle sharper for paddle / puck bounce off collision
// 4.
// Enhance collision using AABB function
// 5.
// Add acceleration to paddle movement
// 6.
// Add message screen to games that notifies when players have joined
// the game, when they are ready, and when they have left games
// -> Can also notify players of spectators joining the game
// 7.
// Add mobile support and controls

var express = require('express');
var WebSocket = require('ws');
var http = require('http');
var path = require('path');

var app = express();
var PORT = process.env.PORT || 8080;

var server = http.createServer(app);

var wss = new WebSocket.Server({ server });

// game objects constructor
function gameObjs(puck, leftpaddle, rightpaddle, players = 0) {
	this.puck = 
		{
			x: 375,
			y: 250,
			w: 10,
			h: 10,
			velx: 0,
			vely: 0
		};
	this.leftpaddle = 
		{
			x: 0,
			y: 225,
			w: 10,
			h: 50,
			vely: 6,
			up: false,
			down: false,
			score: 0
		};
	this.rightpaddle = 
		{
		x: 740,
		y: 225,
		w: 10,
		h: 50,
		vely: 6,
		up: false,
		down: false,
		score: 0
	};
	this.players = players;
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

wss.on('connection', function(connection) {
	console.log((new Date()) + " Connection accepted.");
	
	function startGame() {
		gameFrames = setInterval(function() {
			Object.keys(concurrentGames).forEach(gameObjs => {
				// gameObjs are the "keys" for the concurrentGames object, i.e. the routes
				
				// controls for left paddle
				if (concurrentGames[gameObjs].leftpaddle.up && concurrentGames[gameObjs].leftpaddle.y >= 0) {
					concurrentGames[gameObjs].leftpaddle.y -= concurrentGames[gameObjs].leftpaddle.vely;
				}
				if (concurrentGames[gameObjs].leftpaddle.down && concurrentGames[gameObjs].leftpaddle.y <= 450) {
					concurrentGames[gameObjs].leftpaddle.y += concurrentGames[gameObjs].leftpaddle.vely;
				}
				// controls for right paddle
				if ( concurrentGames[gameObjs].rightpaddle.up && concurrentGames[gameObjs].rightpaddle.y >= 0) {
					concurrentGames[gameObjs].rightpaddle.y -= concurrentGames[gameObjs].rightpaddle.vely;
				}
				if (concurrentGames[gameObjs].rightpaddle.down && concurrentGames[gameObjs].rightpaddle.y <= 450) {
					concurrentGames[gameObjs].rightpaddle.y += concurrentGames[gameObjs].rightpaddle.vely;
				}
				// player 1 scores
				if (concurrentGames[gameObjs].puck.x >= 740) {
					concurrentGames[gameObjs].leftpaddle.score++;
					resetPuck(gameObjs);
				}
				// top and bottom wall collision for puck
				if (concurrentGames[gameObjs].puck.y <=0 || concurrentGames[gameObjs].puck.y >= 490) {
					concurrentGames[gameObjs].puck.vely = concurrentGames[gameObjs].puck.vely * (-1);
				}
				// player 2 scores
				if (concurrentGames[gameObjs].puck.x <= 0) {
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
				// update the puck position	
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
			concurrentGames[route].puck.vely = 0;
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
		var route = message.substring(0, 5);
		
		if (message.substring(6, 10) == 'join') {
			//route = message.substring(0, 5);
			if (concurrentGames[route] == undefined) {
				concurrentGames[route] = new gameObjs();
			}
			concurrentGames[route].players++;
			//console.log(concurrentGames);
			
			// should send only to client who clicked "join"
			connection.send(concurrentGames[route].players);
		}
		
		if (message.substring(6, 16) == 'disconnect') {
			//route = message.substring(0, 5);
			connection.terminate();
			if (concurrentGames[route]) {
				if (concurrentGames[route].players > 0) {
					concurrentGames[route].players--;
					if (concurrentGames[route].players === 0) {
						delete concurrentGames[route];
					}
				}
			}
		}
		
		if (message.substring(6, 10) == '1 up') {
			concurrentGames[route].leftpaddle.up = true;
		}
		
		if (message.substring(6, 16) == '1 up false') {
			concurrentGames[route].leftpaddle.up = false;
		}
		
		if (message.substring(6, 12) == '1 down') {
			concurrentGames[route].leftpaddle.down = true;
		}
		
		if (message.substring(6, 18) == '1 down false') {
			concurrentGames[route].leftpaddle.down = false;
		}
		
		if (message.substring(6, 10) == '2 up') {
			concurrentGames[route].rightpaddle.up = true;
			//if (concurrentGames[route].rightpaddle.y >= 0) {
				//concurrentGames[route].rightpaddle.y -= concurrentGames[route].rightpaddle.vely;
			//}
		}
		
		if (message.substring(6, 16) == '2 up false') {
			concurrentGames[route].rightpaddle.up = false;
		}
		
		if (message.substring(6, 12) == '2 down') {
			concurrentGames[route].rightpaddle.down = true;
			//if (concurrentGames[route].rightpaddle.y <= 450) {
				//concurrentGames[route].rightpaddle.y += concurrentGames[route].rightpaddle.vely;
			//}
		}
		
		if (message.substring(6, 18) == '2 down false') {
			concurrentGames[route].rightpaddle.down = false;
		}
		
		if (message.substring(6, 11) == 'start') {
			//route = message.substring(0, 5);
			// this undefined check may be unnecessary, might be able to
			// hide start button until 2 players have joined
			if (concurrentGames[route] != undefined) {
				// starting values
				concurrentGames[route].puck.x = 375;
				concurrentGames[route].puck.y = 240;
				concurrentGames[route].leftpaddle.y = 225;
				concurrentGames[route].rightpaddle.y = 225;
				concurrentGames[route].leftpaddle.score = 0;
				concurrentGames[route].rightpaddle.score = 0;
				concurrentGames[route].puck.velx = 9;
				concurrentGames[route].puck.vely = 0;
			}
		}
	});
	
	if (!serverOnline) {
		serverOnline = true;
		startGame();
	}
});

app.use(express.static('./public'));

app.get("/", function(req, res) {
	res.sendFile(path.join(__dirname, "/public/home.html"));
});

app.get("/games", function(req, res) {
	res.send(concurrentGames);
});

app.get("/:route", function(req, res) {
	res.sendFile(path.join(__dirname, "/public/game.html"));
});

server.listen(PORT, function () {
	console.log(`app listening on port ${PORT}`);
});