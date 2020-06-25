var express = require('express')
var app = express();
var request = require('request');
var path = require('path');
var fs = require('fs');
var cookieSession = require('cookie-session')
var simpleoauth2 = require("simple-oauth2")
var mysql = require('mysql');

var ion_client_id = "H1I7obJTcTDW7HhLZ13KIHBk8DGiy46VO61lHiPK"
var ion_client_secret = "KADCJwHtTrB0WXeaEtPiYcqVbZbhcL292Sie4fLxuICgDtJI42xkFyN4d0FwARHMyYcSXBDyRJAGP0198ZMS85oeWocdPwjA3PxxgUWxYUc7GUqB2xOtpqBc6xJC225A"
var ion_redirect_uri = 'https://nbah2h.sites.tjhsst.edu/login_worker';

var pool  = mysql.createPool({
  connectionLimit : 10,
  user            : 'site_nbah2h',
  password        : 'Mbh6mdmVJQNpHTjHT7hvQs2P',
  host            : 'mysql1.csl.tjhsst.edu',
  port            : 3306,
  database        : 'site_nbah2h',
  multipleStatements:true 
});

app.use(cookieSession({
  name: 'cookie',                            
  keys: ['key']  
}))


var oauth2 = simpleoauth2.create({
  client: {
    id: ion_client_id,
    secret: ion_client_secret,
  },
  auth: {
    tokenHost: 'https://ion.tjhsst.edu/oauth/',
    authorizePath: 'https://ion.tjhsst.edu/oauth/authorize',
    tokenPath: 'https://ion.tjhsst.edu/oauth/token/'
  }
});

var authorizationUri = oauth2.authorizationCode.authorizeURL({
    scope: "read",
    redirect_uri: ion_redirect_uri
});

app.set('port', process.env.PORT || 8080 );
app.set('view engine',"hbs");

app.use('/img', express.static(path.join(__dirname, 'img')))
app.use('/css', express.static(path.join(__dirname, 'css')))
app.use('/js', express.static(path.join(__dirname, 'js')))
app.use('/files', express.static(path.join(__dirname, 'files')))

app.get('/nba_bg.jpg',function(req,res){
    res.sendFile(__dirname+'/img/nba_bg.jpg')
});

function checkLoggedIn(req,res,next){
    if (typeof(req.session.token) == 'undefined') {
        res.locals.loggedIn = false
        res.render("homepage",{loginUrl:authorizationUri,notLoggedIn:true});
    }else{
        next()
    }
}

function getProfile(req,res,next){
    var access_token = req.session.token.token.access_token;
        var my_ion_request = 'https://ion.tjhsst.edu/api/profile?format=json&access_token='+access_token;
        request.get( {url:my_ion_request}, function (e, r, body) {
            var res_object = JSON.parse(body);
            res.locals.user_name = res_object['short_name'];
            //res.locals.counselor_name = res_object['counselor']["username"];
            res.locals.e = res_object["tj_email"]
            res.locals.loggedIn = true
            next()
        });
}

app.get("/request_player_data",function(req,res){
    if(typeof(req.query.player_id)=="undefined"){
        res.send("what you doing here")
    }else{
        var params = {
            url : "",
                headers:{
                    'User-agent':'avyuk'
                }
        }
        shot_chart_url0 = "http://stats.nba.com/stats/shotchartdetail?AheadBehind=&CFID=33&CFPARAMS=2018-19&ClutchTime=&Conference=&ContextFilter=&ContextMeasure=FGA&DateFrom=&DateTo=&Division=&EndPeriod=10&EndRange=28800&GROUP_ID=&GameEventID=&GameID=&GameSegment=&GroupID=&GroupMode=&GroupQuantity=5&LastNGames=0&LeagueID=00&Location=&Month=0&OnOff=&OpponentTeamID=0&Outcome=&PORound=0&Period=0&PlayerID="

        shot_chart_url1 = "&PlayerID1=&PlayerID2=&PlayerID3=&PlayerID4=&PlayerID5=&PlayerPosition=&PointDiff=&Position=&RangeType=0&RookieYear=&Season=2018-19&SeasonSegment=&SeasonType=Regular+Season&ShotClockRange=&StartPeriod=1&StartRange=0&StarterBench=&TeamID=0&VsConference=&VsDivision=&VsPlayerID1=&VsPlayerID2=&VsPlayerID3=&VsPlayerID4=&VsPlayerID5=&VsTeamID="
        params.url = shot_chart_url0 + String(req.query.player_id) + shot_chart_url1;
        console.log("About to make request.")
        request.get(params,function(e,r,body){
            console.log("Made request")
            var obj = JSON.parse(body);
            res.send(obj)
        })
    }
})
/*app.get("/draft_home_page", function(req,res){
    if(typeof(req.session.token) == 'undefined'){
        res.send("Please Login!")
    }else{
        console.log(req.session.user_name)
        pool.query("SELECT COUNT(1) FROM Users WHERE username = ?;",[req.session.user_name], function(error,results,fields){
            firstTime = Object.values(results[0])[0]
            if(firstTime == 0){
                //this doesn't work for some reason
                pool.query('INSERT INTO Users VALUES(?,null,null,null,null,null,0)',[req.session.user_name],function(error,results,fields){
                    res.redirect("/draft_sim")
                })
            }else{
                res.send("UR SET")
            }
            res.send("hello")
        });
    }
})*/
app.get("/logout",function(req,res){
    req.session = null
    res.redirect("/")
})
app.get('/',[checkLoggedIn,getProfile], function(req,res){
        //res.render("homepage",)
        req.session.user_name = res.locals.user_name
        pool.query("SELECT COUNT(1) FROM Users WHERE username = ?;",[req.session.user_name], function(error,results,fields){
            firstTime = Object.values(results[0])[0]
            console.log(firstTime)
            if(firstTime == 0){
                pool.query('INSERT INTO Users VALUES(?,null,null,null,null,null,0)',[req.session.user_name],function(error,results,fields){
                    res.redirect("/draft_sim")
                })
                //this doesnt work for some reason idk why
            }else{
                pool.query("SELECT cash FROM Users WHERE username = ?", [req.session.user_name], function(error,results,fields){
                    res.render("homepage",{"cash":results[0].cash});
                })
            }
        });
        //res.render("homepage",{name:res.locals.user_name,notLoggedIn:false});
});
//referenced this website - https://medium.com/@HolmesLaurence/integrating-node-and-python-6b8454bfc272
function call_simulator(req, res) {
  var child_process = require("child_process");
  //var spawn = require("pty.js").spawn;

  //res.send(t1roster)
  //res.send(req.query.t1roster)
//   var process = spawn('python', ["./sim.py",
//     req.query.t1name, 
//     req.query.t1roster, 
//     req.query.t2name, 
//     req.query.t2roster 
//   ]);
  dataString = ""
  py = child_process.spawnSync('python', ["./sim.py",req.query.t1name,req.query.t1roster,req.query.t2name,req.query.t2roster ] );
    
    // extract the result of the python operation
    dataString = py['stdout'].toString();
    py_error = py['stderr'].toString();
    
    // send the result back to the user
    all_stats = dataString.split(", ")
    team1_stats = all_stats.slice(0,7)
    team2_stats = all_stats.slice(7,14)
    final_score = all_stats.slice(14,all_stats.length-1)
    winner = all_stats[all_stats.length-1]
    res.render("sim_page",{t1name:req.query.t1name, t2name:req.query.t2name,winner:winner,final_score:final_score,team1_stats:team1_stats,team2_stats:team2_stats})
    
    if(typeof(winner)=="undefined" || winner.length == 0 || winner.trim() == ""){
      // res.redirect("/game_sim_worker?opp=" + req.query.t2name)
      res.redirect("/game_sim_worker")
    }
    else{
        if(winner.includes(req.query.t1name)){
            pool.query('UPDATE Users SET cash = cash + 100 WHERE username = ?;',[req.query.t1name], function(error,results,fields){
                res.render("sim_page",{t1name:req.query.t1name, t2name:req.query.t2name,winner:winner,final_score:final_score,team1_stats:team1_stats,team2_stats:team2_stats})
            });
                //pool.query('UPDATE Users SET cash = cash - 50 WHERE username = ?;',[req.query.t2name], function(error,results,fields){
                //});
        }else if(winner.includes("Tie")){
            res.render("sim_page",{t1name:req.query.t1name, t2name:req.query.t2name,winner:winner,final_score:final_score,team1_stats:team1_stats,team2_stats:team2_stats})
        }
        else{
                //pool.query('UPDATE Users SET cash = cash + 100 WHERE username = ?;',[req.query.t2name], function(error,results,fields){
                //    res.render("sim_page",{t1name:req.query.t1name, t2name:req.query.t2name,winner:winner,final_score:final_score,team1_stats:team1_stats,team2_stats:team2_stats})
                //});
                pool.query('UPDATE Users SET cash = cash - 50 WHERE username = ?;',[req.query.t1name], function(error,results,fields){
                res.render("sim_page",{t1name:req.query.t1name, t2name:req.query.t2name,winner:winner,final_score:final_score,team1_stats:team1_stats,team2_stats:team2_stats})

                    
                });
        }
    }
//   process.stdout.on('data', function (data) {
//       dataString += data.toString()
//       console.log(dataString)
//   });
  //process.stdout.on('end', function (data) {

    //res.render("sim_page",{t1name:req.query.t1name, t2name:req.query.t2name,winner:winner,final_score:final_score,team1_stats:team1_stats,team2_stats:team2_stats})
    /*if(typeof(winner)=="undefined" || winner.length == 0 || winner.trim() == ""){
      // res.redirect("/game_sim_worker?opp=" + req.query.t2name)
      res.redirect("/game_sim_worker")
    }*/
    //res.redirect(":" + dataString)

  //});


}

app.get("/game_sim",call_simulator)

app.get("/play_with_friends",function(req,res){
    pool.query("SELECT username FROM Users",function(error,results,fields){
        res.render("choose_opponent",{people:results[0]});
    })
})

app.get("/draft_sim_worker",function(req,res){
    if(typeof(req.query.name) != undefined){
        if(typeof(req.session.team) != undefined){
            if(req.session.team.length < 5){
                req.session.team.push(req.query.name);
                colupdate = "player" + String(req.session.team.length);
                console.log("------------")
                console.log(colupdate)
                console.log(req.query.name)
                console.log(req.session.user_name)
                console.log("__________________")
                pool.query('UPDATE Users SET ' + colupdate + ' = ? WHERE username = ?;',[req.query.name,req.session.user_name], function(error,results,fields){
                    console.log("ALL THE WAY")
                    res.redirect("https://nbah2h.sites.tjhsst.edu/draft_sim")
                });
                            
            }else{
                res.send("You already have a team.")
            }
        }else{
            res.send("STOP BEING SUS")
        }
    }else{
        res.redirect("https://user.tjhsst.edu/2020adixit/")
    }
})

app.get("/edit_team_worker",function(req,res){
    if(typeof(req.query.column)!='undefined'){
        pool.query("UPDATE Users SET "+ req.query.column + " = ? WHERE username = ?", [req.session.temp_name,req.session.user_name],function(error,results,fields){
            req.session.temp_name = ""
            res.redirect("/")
        })
    }else{
        res.send("no code attached")
    }
})

app.get("/team_switch",function(req,res){
    if(typeof(req.query.name)!='undefined'){
        req.session.temp_name = req.query.name
        pool.query("SELECT * FROM Users WHERE username = ?", [req.session.user_name],function(error,results,fields){
        names = [results[0].player1, results[0].player2, results[0].player3,results[0].player4,results[0].player5]
        urls = []
        body = fs.readFileSync('files/card_urls.txt', 'utf8')
        all_player_urls = JSON.parse(body);
        body2 = fs.readFileSync('files/image_urls.txt', 'utf8')
        all_image_urls = JSON.parse(body2);
        for(var i = 0; i < names.length; i++){
            
            for(var j = 0; j < all_player_urls.length;j++){
                first_last = names[i].split(" ")
                if(all_player_urls[j].toUpperCase().includes(first_last[0].toUpperCase()) && all_player_urls[j].toUpperCase().includes(first_last[1].toUpperCase())){
                    console.log(all_player_urls[j])
                    
                    urls.push({"url":String(all_image_urls[j]),"player_number":"player"+String(i+1)})
                    break
                }
            }
        }
        })
        res.render("edit_pagev2",{"name":req.query.name,"display":urls})
    }else{
        res.send("Nothing to see here.")   
    }
})
app.get("/roster",function(req,res){
    pool.query("SELECT * FROM Users WHERE username = ?", [req.session.user_name],function(error,results,fields){
        names = [results[0].player1, results[0].player2, results[0].player3,results[0].player4,results[0].player5]
        urls = []
        body = fs.readFileSync('files/card_urls.txt', 'utf8')
        all_player_urls = JSON.parse(body);
        body2 = fs.readFileSync('files/image_urls.txt', 'utf8')
        all_image_urls = JSON.parse(body2);
        for(var i = 0; i < names.length; i++){
            
            for(var j = 0; j < all_player_urls.length;j++){
                first_last = names[i].split(" ")
                if(all_player_urls[j].toUpperCase().includes(first_last[0].toUpperCase()) && all_player_urls[j].toUpperCase().includes(first_last[1].toUpperCase())){
                    console.log(all_player_urls[j])
                    urls.push(String(all_image_urls[j]))
                    break
                }
            }
        }
        res.render("team",{"display":urls,"name":String(results[0].username)})
    });
})

app.get("/game_select",function(req,res){
    res.render('players')
})
app.get("/game_sim_worker",function(req,res){
    const url = require('url');    
    pool.query("SELECT * FROM Users WHERE username = ?", [req.session.user_name],function(error,results,fields){
       t1name = results[0].username
       //t1roster = "Kawhi Leonard, Danny Green, Pascal Siakam, LeBron James, Marc Gasol".toUpperCase()
       //Reference: https://stackoverflow.com/questions/4328500/how-can-i-strip-all-punctuation-from-a-string-in-javascript-using-regex
      results[0].player1 = results[0].player1.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
      results[0].player2 = results[0].player2.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
      results[0].player3 = results[0].player3.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
      results[0].player4 = results[0].player4.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
      results[0].player5 = results[0].player5.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
       
      results[0].player1 = results[0].player1.toUpperCase()
      results[0].player2 = results[0].player2.toUpperCase()
      results[0].player3 = results[0].player3.toUpperCase()
      results[0].player4 = results[0].player4.toUpperCase()
      results[0].player5 = results[0].player5.toUpperCase()
       t1roster = results[0].player5 + ", " + results[0].player1 + ", " + results[0].player2 + ", " + results[0].player3 + ", " + results[0].player4
       t1roster = t1roster.trim()
       
       
    //           if (req.query.opp == "CPU")
    //   {
           t2name = "CPU"
           
          body = fs.readFileSync('files/card_urls.txt', 'utf8')
          all_player_urls = JSON.parse(body);
          body2 = fs.readFileSync('files/image_urls.txt', 'utf8')
          all_image_urls = JSON.parse(body2);
          indices = []
          players = []
          while(indices.length != 5){
                check = Math.floor(Math.random()*all_player_urls.length)
                if(!indices.includes(check)){
                    indices.push(check)
                }
          }
          for(var i = 0; i < indices.length; i++){
                raw = all_player_urls[indices[i]].split("/")  
                raw_name = raw[raw.length-1]
                clean_name = raw_name.split("-")
                final_name = ""
                for(var k = 0; k < clean_name.length; k++){
                    final_name += returnUppercase(clean_name[k]) + " "
                }
                players.push(final_name.trim())
            }
            
          players[0] = players[0].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
          players[1] = players[1].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
          players[2] = players[2].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
          players[3] = players[3].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
          players[4] = players[4].replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
           
          players[0] = players[0].toUpperCase()
          players[1] = players[1].toUpperCase()
          players[2] = players[2].toUpperCase()
          players[3] = players[3].toUpperCase()
          players[4] = players[4].toUpperCase()
        // t2roster = "Kawhi Leonard, Danny Green, Pascal Siakam, LeBron James, Marc Gasol".toUpperCase()  
        t2roster = players[0] + ", " + players[1] + ", " + players[2] + ", " + players[3] + ", " + players[4]
        t2roster = t2roster.trim()
        res.redirect(url.format({
              pathname:"/game_sim",
              query: {
                  t1name: t1name,
                  t1roster: '"' + t1roster + '"',
                  t2name:t2name,
                  t2roster:'"' + t2roster + '"'
                }
            }));
       //}
       
    //   else
    //   {
    //   pool.query("SELECT * FROM Users WHERE username = ?", [req.query.opp],function(error,results2,fields){
    //       t2name = results2[0].username

    //       results2[0].player1 = results2[0].player1.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
    //       results2[0].player2 = results2[0].player2.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
    //       results2[0].player3 = results2[0].player3.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
    //       results2[0].player4 = results2[0].player4.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
    //       results2[0].player5 = results2[0].player5.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")
           
    //       results2[0].player1 = results2[0].player1.toUpperCase()
    //       results2[0].player2 = results2[0].player2.toUpperCase()
    //       results2[0].player3 = results2[0].player3.toUpperCase()
    //       results2[0].player4 = results2[0].player4.toUpperCase()
    //       results2[0].player5 = results2[0].player5.toUpperCase()
    //       t2roster = results2[0].player5 + ", " + results2[0].player1 + ", " + results2[0].player2 + ", " + results2[0].player3 + ", " + results2[0].player4
    //       t2roster = t2roster.trim()
    //       res.redirect(url.format({
    //           pathname:"/game_sim",
    //           query: {
    //               t1name: t1name,
    //               t1roster: '"' + t1roster + '"',
    //               t2name:t2name,
    //               t2roster:'"' + t2roster + '"'
    //             }
    //         }));
    //   });
    //   }
    });
})

app.get("/draft_sim", function(req,res){
    if(typeof(req.session.team)=='undefined'){
        req.session.team = []
    }
    if(req.session.team.length == 5){
        res.redirect("/")
    }else{
        body = fs.readFileSync('files/card_urls.txt', 'utf8')
        all_player_urls = JSON.parse(body);
        body2 = fs.readFileSync('files/image_urls.txt', 'utf8')
        all_image_urls = JSON.parse(body2);
        indices = []
        players = []
        while(indices.length != 5){
            check = Math.floor(Math.random()*all_player_urls.length)
            if(!indices.includes(check)){
                indices.push(check)
            }
        }
        for(var i = 0; i < indices.length; i++){
            raw = all_player_urls[indices[i]].split("/")  
            raw_name = raw[raw.length-1]
            clean_name = raw_name.split("-")
            final_name = ""
            for(var k = 0; k < clean_name.length; k++){
                final_name += returnUppercase(clean_name[k]) + " "
            }
            if (final_name.indexOf('III') > -1)
            {
                final_name = final_name.slice(0, final_name.indexOf('III'))
            }
            else if (final_name.indexOf('II') > -1)
            {
                final_name = final_name.slice(0, final_name.indexOf('II'))
            }
            else if (final_name.indexOf('IV') > -1)
            {
                final_name = final_name.slice(0, final_name.indexOf('IV'))
            }
            //if(checkPlayer(final_name)){
                players.push({"name":final_name.trim(),"url":all_image_urls[indices[i]]})
            //}
        }
        res.render("draft_page.hbs",{display:players})
    }
    
})
//https://stackabuse.com/reading-and-writing-csv-files-with-node-js/
function checkPlayer(name){
    const csv = require('csv-parser');  
    fs.createReadStream('info/players.csv')  
      .pipe(csv())
      .on('data', (row) => {
        if(row.DISPLAY_FIRST_LAST == name){
            return true
        }
      })
      .on('end', () => {
          return false
      });
}

//https://dzone.com/articles/how-to-capitalize-the-first-letter-of-a-string-in
function returnUppercase(string) 
{
    return string.charAt(0).toUpperCase() + string.slice(1);
}
app.get('/pack', function (req, res) {
    pool.query("SELECT cash FROM Users WHERE username = ?", [req.session.user_name], function(error,results,fields){
        cash = results[0].cash
        names = [results[0].player1, results[0].player2, results[0].player3,results[0].player4,results[0].player5]
        if(cash >= 500){
            pool.query('UPDATE Users SET cash = cash - 500 WHERE username = ?;',[req.session.user_name], function(error,results,fields){
                body = fs.readFileSync('files/card_urls.txt', 'utf8')
                all_player_urls = JSON.parse(body);
                body2 = fs.readFileSync('files/image_urls.txt', 'utf8')
                all_image_urls = JSON.parse(body2);
                indices = []
                players = []
                while(indices.length != 5){
                    check = Math.floor(Math.random()*all_player_urls.length)
                    if(!indices.includes(check)){
                        raw = all_player_urls[check].split("/")  
                        raw_name = raw[raw.length-1]
                        clean_name = raw_name.split("-")
                        final_name = ""
                        for(var k = 0; k < clean_name.length; k++){
                            final_name += returnUppercase(clean_name[k]) + " "
                        }
                        if (!names.includes(final_name))
                        {
                            indices.push(check)
                            players.push({"name":final_name.trim(),"url":all_image_urls[check]})
                        }
                    }
                }
                res.render("pack_page",{display:players})
            });
        }else{
            res.redirect("https://nbah2h.sites.tjhsst.edu/")
        }
    })

});

app.get('/players', function(req, res){
            returnstr = ""
            url = "/game_sim_worker?opp=CPU"
            returnstr += '<a href=' + url + '>';
            returnstr += 'CPU';
            returnstr += "</a>";
            returnstr += "\n";
            // SQL DATABASE TIME!!!
            pool.query('SELECT * FROM Users ORDER by username ASC', function (error, results, fields) {
            if (error) throw error;
                
                // CONSTRUCT AND SEND A RESPONSE
                for (var i = 0; i < results.length; i++)
                {
                    if (results[i].username != req.session.user_name)
                    {
                        url = "/game_sim_worker?opp=" + results[i].username
                        returnstr += '<a href=' + url + '>';
                        returnstr += results[i].username;
                        returnstr += "</a>";
                        returnstr += "\n";
                    }
                }
                res.send(returnstr);
            });
            
})

app.get('/login_worker', async function (req, res) {
  if (typeof req.query.code != 'undefined') {
        var theCode = req.query.code 
        var options = {
            code: theCode,
            redirect_uri: ion_redirect_uri,
            scope: 'read'
         };
        var result = await oauth2.authorizationCode.getToken(options);      // await serializes asyncronous fcn call
        var token = oauth2.accessToken.create(result);
        req.session.token = token;
        res.redirect("/");

    } else {
        res.send('no code attached')
    }
});

var listener = app.listen(app.get('port'), function() {
  console.log( 'Express server started on port: '+listener.address().port );
});
listener.timeout = 1000000