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
const mail=require("./mail.js")
var session=require("express-session")
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "6IctGip2023",
    database:"gip",
    multipleStatements:true
  });
  app.set('view engine', 'ejs');
con.connect(function(err) {
    if (err) throw err;
    console.log("Connected!");
})
app.use(express.static(__dirname+'/public/'));
app.use(session({
  secret: setId(),
  resave: false,
  httpOnly:false,
  saveUninitialized: true,
  cookie: { secure: false }
}))
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
  httpreq.en
}
function setId(){
  let code=""
  let str="0123456789AZERTYUIOPQSDFGHJKLMWXCVBNazertyuiopqsdfghjklmwxcvbn"
  for(let i=0;i<50;i++){
    code+=str.charAt(Math.random()*str.length)
  }
  console.log(code)
  return code
}
app.get("/register/remote-registration", function(req,res){
  console.log(req.query)
  if(req.query.code!=undefined&&req.query.code.length==4){
    con.query("SELECT * FROM terminal_registration WHERE code="+JSON.stringify(req.query.code)+";", function(err, result){
      if(err) console.log(err)
      console.log(result)
       if(result.length){ //correcte code
        postToTerminalServer(req.query.code, "/register/terminal/send-scan")
        res.render(__dirname+"/home.ejs", {status: 1, popupbtntext:"Doorgaan", bcode: result[0].bcode})
    }
    else{//foute code
      res.render(__dirname+"/home.ejs", {status: 2, popupbtntext: "Sluiten", bcode:""})
  }
    })
  }//foute code
  else  res.render(__dirname+"/home.ejs", {status: 2, popupbtntext:"Sluiten", bcode:""})
})
app.post("/register/remote-login/send-data", function(req,res){
  let data=req.body
  //PASSWORD functie toevoegen voor PIN en password
  let str="bcdfghjklmpqrstvwxyz0123456789BCDFGHJKLMPQRSTVWXZ"
  let code=""
  for(let i=0; i<50;i++) code+=str.charAt(Math.random()*str.length)
  con.query("SELECT * FROM verify WHERE email="+JSON.stringify(data.email)+"; SELECT * FROM users WHERE email="+JSON.stringify(data.email), [1,2], function(err, result){
    if(err) console.log(err)
    else if(result[0].length) res.send({success:false, msg: "Je hebt al een e-mail gekregen."})
    else if(result[1].length) res.send({success:false, msg: "Je bent al een gebruiker."})
    else{
      con.query("INSERT INTO verify VALUES("+JSON.stringify(data.email)+","+JSON.stringify(data.username)+",SHA2("+JSON.stringify(data.pin)+",512),"+data.bcode+",'"+code+"',SHA2("+JSON.stringify(data.password)+",512), 0);", function(err, result){
        if(err) {
          console.log(err)
          res.sendStatus(500)
        } 
        else {
          //verzend hier email
          //verzend hier naar terminal server
          mail.mail(data.email, data.username, code, data.bcode)
          if(data.code!=="") postToTerminalServer(data.code, "/register/terminal/send-status");
          res.send({success:true})
        }
      })
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
      con.query("INSERT INTO users VALUES ("+JSON.stringify(result[0].username)+","+JSON.stringify(result[0].email)+",'"+result[0].pin+"','"+result[0].password+"',"+result[0].bcode+")", function(err){
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
      console.log(result)
      postToTerminalServer(req.body.code, "/register/terminal/send-scan");
      res.setHeader("Content-Type", "application/x-www-form-urlencoded")
      res.send({success:true,bcode:result[0].bcode})
    }
    else{
      res.setHeader("Content-Type", "application/x-www-form-urlencoded")
      res.send({success:false})
    }
  })
})
app.get("/login", (req, res)=>{
if(!req.session.login){
  res.render(__dirname+"/login.ejs", {status:0, fout:""})
}
else res.send("ok")
})
app.post("/login/send-data", function(req,res){
  con.query("SELECT * FROM users WHERE email="+JSON.stringify(req.body.email)+" AND BINARY password=SHA2("+JSON.stringify(req.body.password)+", 512);", function(err,result){
    if(err) {
      console.log(err)
      res.render(__dirname+"/login", {fout: "Er ging iets mis.", status:0})
    } 
     if(result.length) {
  req.session.login=true
  console.log(req.session.login)
  req.session.username=result[0].username
  req.session.email=result[0].email
  setTimeout(()=>{
    res.redirect("/user/dashboard")
  },1000)
  }
  else res.render(__dirname+"/login", {fout: "Onjuist e-mail addres of wachwoord.", status:0})
  })
})
app.get("/user/dashboard", function(req,res){
  if(req.session.login){
    res.render(__dirname+"/dashboard.ejs")
  }
  else res.redirect("/login")
})
app.get("/user/dashboard/get-history", function(req,res){
  if(req.session.login){
    res.send([{duration: 24, date: "24/01/2023", price: 0.50, devices: 1, ldate: "25/01/2023"}])
  }
  else res.sendStatus(501)
})
app.get("/user/dashboard/get-prices", function(req,res){
  if(req.session.login){
   con.query("SELECT * FROM prijzen ORDER BY price DESC", function(err,result){
    if(err){
      console.log(err)
      res.sendStatus(500)
    }
    else res.send(result)
   })
  }
  else res.sendStatus(501)
})
app.get("/", function(req,res){
  res.render(__dirname+"/home.ejs", {status: 0, popupbtntext:"Sluiten", bcode:""})
})
server.listen(8080, ()=>{
  console.log("luisteren")
})
 