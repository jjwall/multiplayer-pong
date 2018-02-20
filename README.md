# Multi-player Online Pong Game
___

This is a hobby project to further my understanding of WebSockets and to practice building 
a game engine from scratch.  It is a multi-player pong clone that is built primarily with 
JavaScript, jQuery and Node.js. JQuery UI is used for the messaging system and NippleJS
was used for joystick controls on mobile devices.

### To run the app
```
npm install
node server.js
```

___
### Try it out online!
Currently, the game is hosted on Heroku: [https://png-game.herokuapp.com/](https://png-game.herokuapp.com/)

### Creating or Joining a Game
+ Clicking "New Game" will take you straight to the game and generates a game ID the new game
+ The game will not officially be created until a player clicks "Join" in the game
+ Game IDs are just 5 random letters and numbers that will route to your game
+ If you want to join an existing game, click "Join" on the row that corresponds to the desired Game ID
+ If There already 2 players in the game you can still join but only as a spectator

### Controls
+ First player that joins a game will be the left paddle
+ Second player that joins a game will be the right paddle
+ Use arrow keys to move up or down
+ NippleJS' joystick allows for mobile play as well!
+ A joystick will be created wherever you touch on the screen
+ The joystick will move to a new spot if you touch far enough away