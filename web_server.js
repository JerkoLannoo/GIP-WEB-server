const express = require('express');
const fs = require('fs');
const app = express()
const http = require('http');
var server=http.createServer(app);
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
app.post("/register/check-code", function(req,res){
  res.send({login: false})
})
app.get("/register/remote-registration", function(req,res){
  console.log(req.query)
  if(req.query.bcode!=undefined&&req.query.bcode.length==4){
    con.query("SELECT * FROM terminal_registration WHERE code="+JSON.stringify(req.query.bcode)+";", function(err, result){
      if(err) console.log(err)
      console.log(result)
       if(result.length){ //correcte code
        res.render(__dirname+"\\home.ejs", {status: 1, popupbtntext:"Doorgaan"})
    }
    else{//foute code
      res.render(__dirname+"\\home.ejs", {status: 2, popupbtntext: "Sluiten"})
  }
    })
  }//foute code
  else  res.render(__dirname+"\\home.ejs", {status: 2, popupbtntext:"Sluiten"})
})
app.get("/", function(req,res){
  res.render(__dirname+"\\home.ejs", {status: 0, popupbtntext:"Sluiten"})
})
server.listen(8080, ()=>{
  console.log("luisteren")
})
 