window.onload = () => {
                    $.ajax({
                    url: "players",                      // goes to https://user.tjhsst.edu/pckosek/kitchen
                    type: "get",
                    success: function(response) {
                        document.getElementById('players').innerHTML = response;
                    },
                    error: function (stat, err) {
                        console.log('failed');
                    }   
                });
}