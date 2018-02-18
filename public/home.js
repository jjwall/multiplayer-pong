$(document).ready(function () {
	var totalGames = 0;
	var totalPlayers = 0;
	var route = "";
	
	function makeid() {
     var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
     for (var i = 0; i < 5; i++) {
        route += possible.charAt(Math.floor(Math.random() * possible.length));
      }
    }
	
	
	function populateGameList() {
		$.ajax({
			url: "/games",
			type: 'GET',
			success: function(data) {
				$('#games').empty();
				$('#games').append(`
					<tr>
						<th>Game ID</th>
						<th>Players</th>
						<th>Join / Spectate</th>
					</tr>`);
				Object.keys(data).forEach(game => {
					var joinSpectate;
					totalGames++;
					totalPlayers += data[game].players;
					
					if (data[game].players > 1)
						joinSpectate = "Spectate";
					else
						joinSpectate = "Join";
					
					$('#games').append(`
						<tr>
							<td>${game}</td>
							<td>(${data[game].players}/2)</td>
							<td><button class="gameJoin" data-index=${game}>${joinSpectate}</button></<td>
						</tr>`);
				});
				
				$('#status').empty();
				$('#status').append(`Total number of games: ${totalGames} <br>
									Players currently playing: ${totalPlayers}`);
				
				$('.gameJoin').each(function() {
					$(this).on("click", function(event){
						event.preventDefault();
						var gameRoute = $(this).data('index');
						window.location.href = '/' + gameRoute;
						//console.log(gameNum);
					});
				});
			}
		});
	}
	
	populateGameList();
	
	setInterval(function(){ 
		populateGameList();
	}, 60000);
	
	
	$('#createGame').on('click', function() {
		makeid();
		window.location.href = '/' + route;
	});
});