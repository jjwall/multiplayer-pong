$(document).ready(function () {
	var route = "";
	
	function makeid() {
     var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
     for (var i = 0; i < 5; i++) {
        route += possible.charAt(Math.floor(Math.random() * possible.length));
      }
    }
	
	$('#joinGame').on('click', function() {
		makeid();
		window.location.href = '/' + route;
	});
});