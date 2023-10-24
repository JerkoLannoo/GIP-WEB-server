const express = require('express');
const fs = require('fs');
const app = express()
const http = require('http');
var server=http.createServer(app);
var querystring = require("querystring")
const url = require('url');
const path = require('path');
var mysql = require('mysql');
const bodyParser = require('body-parser')

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "6IctGip2023",
    database:"gip"
  });
  app.set('view engine', 'ejs');
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
})
app.use(express.static(__dirname+'\\public\\'));
setInterval(() => {
  con.query("SELECT 1;", function (err, result) {
    if (err) console.log(err);
    else console.log("SELECT 1")
  });
}, 3600000);
function postToTerminalServer(code, path){
  var options = {
    host: '127.0.0.1',
    path: path,
    port: 80,
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }}
  var httpreq = http.request(options, function (response) {
    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      console.log("body: " + chunk);
    });
    response.on('end', function() {
     
    })
  });
  httpreq.write("success=true&code="+code);
  httpreq.end();
}
app.get("/register/remote-registration", function(req,res){
  console.log(req.query)
  if(req.query.code!=undefined&&req.query.code.length==4){
    con.query("SELECT * FROM terminal_registration WHERE code="+JSON.stringify(req.query.code)+";", function(err, result){
      if(err) console.log(err)
      console.log(result)
       if(result.length){ //correcte code
        postToTerminalServer(req.query.code, "/register/terminal/send-scan")
        res.render(__dirname+"\\home.ejs", {status: 1, popupbtntext:"Doorgaan", bcode: result[0].barcode})
    }
    else{//foute code
      res.render(__dirname+"\\home.ejs", {status: 2, popupbtntext: "Sluiten", bcode:""})
  }
    })
  }//foute code
  else  res.render(__dirname+"\\home.ejs", {status: 2, popupbtntext:"Sluiten", bcode:""})
})
app.post("/register/remote-login/send-data", function(req,res){
  let data=req.body
  //PASSWORD functie toeveogen voor PIN en password
  let str="bcdfghjklmpqrstvwxyz0123456789BCDFGHJKLMPQRSTVWXZ"
  let code=""
  for(let i=0; i<50;i++) code+=str.charAt(Math.random()*str.length)
  con.query("INSERT INTO verify VALUES("+JSON.stringify(data.email)+","+JSON.stringify(data.username)+","+JSON.stringify(data.pin)+","+data.bcode+","+JSON.stringify(data.code)+","+JSON.stringify(data.password)+", 0);", function(err, result){
    if(err) {
      console.log(err)
      res.sendStatus(500)
    } 
    else {
      //verzend hier email
      //verzend hier naar terminal server
      postToTerminalServer(data.code, "/register/terminal/send-status");
      res.sendStatus(200)
    }
  })
})
app.get("/register/verify-email", function(req,res){
  con.query("SELECT * FROM verify WHERE BINARY code="+JSON.stringify(req.query.code)+" AND email="+JSON.stringify(req.query.email), function(err, result){
    if(err) {
      console.log(err)
      res.send("Er ging iets mis.")
    }
    else if(result.length){
      con.query("INSERT INTO users VALUES ("+JSON.stringify(result[0].username)+","+JSON.stringify(result[0].email)+","+result[0].pin+","+JSON.stringify(result[0].password)+","+result[0].bcode+")", function(err){
        if (err) {
          console.log(err)
          res.send("Er ging iets mis.")
        }
        else res.send("ok")
      })
      con.query("DELETE FROM verify WHERE code="+JSON.stringify(req.query.code), function(err){
        if (err) {
          console.log(err)
        }
      })
    }
    else{
      setTimeout(() => {
        res.send("Ongeldige link.")
      }, 2000);
    }
  })
})
app.post("/register/check-code", function(req, res){
  console.log(req.body)
  con.query("SELECT * FROM terminal_registration WHERE code="+JSON.stringify(req.body.code), function(err, result){
    if(err) {
      console.log(err)
      res.send(500)
    }
    else if(result.length){
      postToTerminalServer(req.body.code, "/register/terminal/send-scan");
      res.setHeader("Content-Type", "application/x-www-form-urlencoded")
      res.send({success:true,bcode:result[0].barcode})
    }
    else{
      res.setHeader("Content-Type", "application/x-www-form-urlencoded")
      res.send({success:false})
    }
  })
})
app.get("/", function(req,res){
  res.render(__dirname+"\\home.ejs", {status: 0, popupbtntext:"Sluiten", bcode:""})
})
server.listen(8080, ()=>{
  console.log("luisteren")
})
 