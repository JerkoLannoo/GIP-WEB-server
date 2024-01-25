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
var session=require("express-session");
const { error } = require('console');
const { rejects } = require('assert');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));
var pfcon = mysql.createConnection({
    host: "192.168.100.2",
    user: "pf",
    password: "ARF843U425>D<>[a",
    database:"pf",
    multipleStatements:true
  });
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
  pfcon.query("SELECT 1;", function (err, result) {
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
  httpreq.end()
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
app.get("/user/dashboard/get-data-usage", function(req,res){
  if(!req.session.login){
    res.sendStatus(401)
  }
  else {
    console.log(JSON.stringify(req.session.username+"%"))
    pfcon.query("SELECT * FROM node WHERE pid LIKE "+JSON.stringify(req.session.username+"%"), function(err, result){
      if(err){
        console.log(err)
        res.sendStatus(500)
      }
      else{
        var devices=result
        let arr =""
        arr+="'"+result[0].mac+"'"
        for(let i=1;i<result.length;i++) arr+=",'"+result[i].mac+"'"
        console.log(arr)
        pfcon.query("SELECT * FROM bandwidth_accounting WHERE mac IN ("+arr+")", function(err, result){
          if(err){
            console.log(err)
            res.sendStatus(500)
          }
          else {
            res.send([result, devices])
          }
        })
      }
    })
  }
})
app.get("/register/remote-registration", function(req,res){
  console.log(req.query)
  if(req.query.code!=undefined&&req.query.code.length==4){
    con.query("SELECT * FROM terminal_registration WHERE code="+JSON.stringify(req.query.code)+";", function(err, result){
      if(err) console.log(err)
      console.log(result)
       if(result.length){ //correcte code
        console.log("sending scan")
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
  con.query("SELECT * FROM verify WHERE email="+JSON.stringify(data.email)+"; SELECT * FROM users WHERE email="+JSON.stringify(data.email)+" OR bcode="+data.bcode+" OR username='"+data.username+"'", [1,2], function(err, result){
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
      con.query("INSERT INTO users VALUES ("+JSON.stringify(result[0].username)+","+JSON.stringify(result[0].email)+",'"+result[0].pin+"','"+result[0].password+"',"+result[0].bcode+",0)", function(err){
        if (err) {
          console.log(err)
          res.send("Er ging iets mis.")
        }
        else {
          res.render(__dirname+"/login.ejs", {status:3, fout:""})
        }
      })
      con.query("DELETE FROM verify WHERE code="+JSON.stringify(req.query.code), function(err){
        if (err) {
          console.log(err)
        }
      })
    }
    else{
      setTimeout(() => {
        res.render(__dirname+"/login.ejs", {status:2, fout:""})
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
else res.redirect("/user/dashboard")
})
app.post("/login/send-data", function(req,res){
  con.query("SELECT * FROM users WHERE email="+JSON.stringify(req.body.email)+" AND BINARY password=SHA2("+JSON.stringify(req.body.password)+", 512);", function(err,result){
    if(err) {
      console.log(err)
      res.render(__dirname+"/login", {fout: "Er ging iets mis.", status:0})
    } 
    else if(result.length) {
  req.session.login=true
  console.log(req.session.login)
  req.session.username=result[0].username
  req.session.email=result[0].email
  req.session.password=result[0].password
    res.redirect("/user/dashboard")
  }
  else res.render(__dirname+"/login", {fout: "Onjuist e-mail adres of wachwoord.", status:0})
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
    con.query("SELECT * FROM beurten WHERE email="+JSON.stringify(req.session.email), function(err,result){
      if(err){
        console.log(err)
        res.sendStatus(500)
      }
      else res.send(result)
     })
  }
  else res.sendStatus(401)
})
app.get("/user/dashboard/get-time-prices", function(req,res){
  if(req.session.login){
   con.query("SELECT * FROM tijdprijzen ORDER BY price DESC", function(err,result){
    if(err){
      console.log(err)
      res.sendStatus(500)
    }
    else res.send(result)
   })
  }
  else res.sendStatus(401)
})
app.get("/user/dashboard/get-data-prices", function(req,res){
  if(req.session.login){
   con.query("SELECT * FROM dataprijzen ORDER BY price DESC", function(err,result){
    if(err){
      console.log(err)
      res.sendStatus(500)
    }
    else res.send(result)
   })
  }
  else res.sendStatus(401)
})
app.post("/user/dashboard/create-new-time", function(req,res){
  if(req.session.login){
    con.query("SELECT * FROM tijdprijzen; SELECT saldo FROM users WHERE email='"+req.session.email+"'",[1,2], function(err ,result){
      if(err) console.log(err)
      else if(result.length){ 
       let price= calcPrice(result[0], req.body)
       let str = "0123456789azeretyuiopqsdfghjklmwxcvbn"
       let password=""
       let totprice = parseFloat(price[0])+parseFloat(price[1])//anders worden ze stringmatig opgetelt
       if(totprice<=result[1][0].saldo&&(req.body.devices>0||req.body.gDevices>0)){
        let suffix = ""
        for(let i=0;i<8;i++) password+=str.charAt(Math.random()*str.length)
           //voor normale apparaten
             var datum = new Date().getTime()
             if(req.body.devices>0&&req.body.gDevices>0){//req.body.devices werkte niet
               if(req.body.adblock)suffix="-adblock"
               con.query("INSERT INTO beurten VALUES('"+req.session.email+"',"+req.body.devices+","+req.body.duration+",null,'"+datum+"',"+price[0]+",0,"+req.body.activationDate+",0,'"+req.session.username+"_"+formatTime(req.body.duration)+suffix+"', '"+req.session.password+
               "', "+req.body.adblock+", NULL);INSERT INTO beurten VALUES('"+req.session.email+"',"+req.body.gDevices+","+req.body.gDuration+",null,'"+datum+"',"+price[1]+",1,"+req.body.activationDate+",0,'"+req.session.username+"@gast_"+formatTime(req.body.gDuration)+suffix+"', '"+password+"',"+req.body.adblock+", NULL); UPDATE users SET saldo=saldo-"+totprice+" WHERE email='"+req.session.email+"'",[1,2,3], function(err,result){
                 if(err){
                  console.log(err)
                  res.sendStatus(400)
                 }
                 else res.send({success:true})
                 })
             }
             else if(req.body.devices>0){
              suffix="_"+formatTime(req.body.duration)
              if(req.body.adblock) suffix+="-adblock"
               con.query("INSERT INTO beurten VALUES('"+req.session.email+"',"+req.body.devices+","+req.body.duration+",null,'"+datum+"',"+price[0]+",0,"+req.body.activationDate+",0,'"+req.session.username+suffix+"', '"+req.session.password+"', "+req.body.adblock+", NULL);UPDATE users SET saldo=saldo-"+(price[0])+" WHERE email='"+req.session.email+"'",[1,2], function(err,result){
                 if(err){
                  console.log(err)
                  res.sendStatus(400)
                 }
                 else res.send({success:true})
                 })
             }
             else if(req.body.gDevices>0){
              suffix="_"+formatTime(req.body.gDuration)
              if(req.body.adblock) suffix+="-adblock"
               con.query("INSERT INTO beurten VALUES('"+req.session.email+"',"+req.body.gDevices+","+req.body.gDuration+",null,'"+datum+"',"+price[1]+",1,"+req.body.activationDate+",0,'"+req.session.username+"@gast"+suffix+"', '"+password+"',"+req.body.adblock+", NULL);UPDATE users SET saldo=saldo-"+(price[1])+" WHERE email='"+req.session.email+"'",[1,2], function(err,result){
                 if(err){
                  console.log(err)
                  res.sendStatus(400)
                 }
                 else res.send({success:true})
                 })
             }
             else res.sendStatus(400)
       }
       else if(req.body.devices==0&&req.body.gDevices==0) res.send({success:false, msg: "Vul alle velden in."})
       else res.send({success:false, msg: "Niet genoeg saldo."})
    }
    })
  }
  else res.sendStatus(401)
})
app.post("/user/dashboard/create-new-data", function(req,res){
  if(req.session.login){
    con.query("SELECT * FROM dataprijzen; SELECT saldo FROM users WHERE email='"+req.session.email+"'",[1,2], function(err ,result){
      if(err) console.log(err)
      else if(result.length){ 
       let price= calcDataPrice(result[0], req.body)
       let str = "0123456789azeretyuiopqsdfghjklmwxcvbn"
       let password=""
       if(price!=null){
       let totprice = parseFloat(price[0])+parseFloat(price[1])//anders worden ze stringmatig opgetelt
       if(totprice<=result[1][0].saldo&&(req.body.devices>0||req.body.gDevices>0)){
          let suffix = ""
          for(let i=0;i<8;i++) password+=str.charAt(Math.random()*str.length)
             //voor normale apparaten
               var datum = new Date().getTime()
               if(req.body.devices>0&&req.body.gDevices>0){//req.body.devices werkte niet
                 if(req.body.adblock)suffix="-adblock"
                 con.query("INSERT INTO beurten VALUES('"+req.session.email+"',"+req.body.devices+",null,null,'"+datum+"',"+price[0]+",0,"+req.body.activationDate+",0,'"+req.session.username+"_"+req.body.data+"GB"+suffix+"', '"+req.session.password+
                 "', "+req.body.adblock+", "+req.body.data+");INSERT INTO beurten VALUES('"+req.session.email+"',"+req.body.gDevices+",null,null,'"+datum+"',"+price[1]+",1,"+req.body.activationDate+",0,'"+req.session.username+"@gast_"+req.body.gData+"GB"+suffix+"', '"+password+"',"+req.body.adblock+", "+req.body.data+"); UPDATE users SET saldo=saldo-"+totprice+" WHERE email='"+req.session.email+"'",[1,2,3], function(err,result){
                   if(err){
                    console.log(err)
                    res.sendStatus(400)
                   }
                   else res.send({success:true})
                   })
               }
               else if(req.body.devices>0){
                suffix="_"+req.body.data+"GB"
                if(req.body.adblock) suffix+="-adblock"
                 con.query("INSERT INTO beurten VALUES('"+req.session.email+"',"+req.body.devices+",null,null,'"+datum+"',"+price[0]+",0,"+req.body.activationDate+",0,'"+req.session.username+suffix+"', '"+req.session.password+"', "+req.body.adblock+", "+req.body.data+");UPDATE users SET saldo=saldo-"+(price[0])+" WHERE email='"+req.session.email+"'",[1,2], function(err,result){
                   if(err){
                    console.log(err)
                    res.sendStatus(400)
                   }
                   else res.send({success:true})
                   })
               }
               else if(req.body.gDevices>0){
                suffix="_"+req.body.gData+"GB"
                if(req.body.adblock) suffix+="-adblock"
                 con.query("INSERT INTO beurten VALUES('"+req.session.email+"',"+req.body.gDevices+",null,null,'"+datum+"',"+price[1]+",1,"+req.body.activationDate+",0,'"+req.session.username+"@gast"+suffix+"', '"+password+"',"+req.body.adblock+", "+req.body.data+");UPDATE users SET saldo=saldo-"+(price[1])+" WHERE email='"+req.session.email+"'",[1,2], function(err,result){
                   if(err){
                    console.log(err)
                    res.sendStatus(400)
                   }
                   else res.send({success:true})
                   })
               }
               else res.sendStatus(400)
        }
       else if(req.body.devices==0&&req.body.gDevices==0) res.send({success:false, msg: "Vul alle velden in."})
       else res.send({success:false, msg: "Niet genoeg saldo."})
       }
       else res.send({success:false, msg: "Deze optie is niet meer geldig."})
    }
    })
  }
  else res.sendStatus(401)
})
app.post("/user/dashboard/set-saldo", function(req,res){
  if(req.session.login){
    console.log(req.body)
con.query("UPDATE users SET saldo=saldo+"+req.body.saldo+" WHERE email='"+req.session.email+"'", function(err,result){
  if(err) {
    console.log(err)
    res.sendStatus(400)
  }
  else res.sendStatus(200)
})
  }
  else res.sendStatus(401)
})
app.get("/user/dashboard/get-saldo", function(req,res){
  if(req.session.login){
con.query("SELECT saldo FROM users WHERE email='"+req.session.email+"'", function(err,result){
  if(err) {
    console.log(err)
    res.sendStatus(400)
  }
  else res.send(result)
})
  }
  else res.sendStatus(401)
})
app.get("/", function(req,res){
  if(req.session.login)   res.redirect("/user/dashboard")
  else res.render(__dirname+"/home.ejs", {status: 0, popupbtntext:"Sluiten", bcode:""})
})
server.listen(8008, ()=>{
  console.log("luisteren")
})
function calcDataPrice(result, config){
  let prices=[]
  let price=0.00
  console.log(config)
  if(config.devices>0){
    for(let i=result.length-1;i>=0;i--){
      console.log("calcing price 1")
      if(result[i].data==config.data) {
          console.log(prices)
          prices.push((result[i].price*config.devices).toFixed(2));
          console.log("prijs 1: "+prices[0])
         // break
      }
      else if (i==0&&prices[0]==null) prices.push(null)
  }}
  else prices.push(0.00)
  if(config.gDevices>0){
      for(let i=result.length-1;i>=0;i--){
        console.log("calcing price 2")
        if(result[i].data==config.data) {
          console.log(prices)
          prices.push((result[i].price*config.devices).toFixed(2));
          console.log("prijs 2: "+prices[1])
         // break
      }
      else if (i==0&&prices[1]==null) prices.push(null)
    }
    }
  else prices.push(0.00)
  console.log("prices: "+prices)
  if(prices[0]!=null&&prices[1]!=null) return prices
  else return null
}
function calcPrice(result, config){//result = tijdprijzen
  let prices=[]
  let price=0.00
  console.log(config)
  if(config.devices>0){
    for(let i=result.length-1;i>=0;i--){
      console.log("calcing price 1")
      if(result[i].devices<=config.devices&&result[i].time<=config.duration) {
          console.log(prices)
          prices.push((result[i].price*config.devices*config.duration).toFixed(2));
          console.log("prijs 1: "+prices[0])
         // break
      }
  }}
  else prices.push(0.00)
  if(config.gDevices>0){
      for(let i=result.length-1;i>=0;i--){
        console.log("calcing price 2")
        if(result[i].devices<=config.gDevices&&result[i].time<=config.gDuration) {
            prices.push((result[i].price*config.gDevices*config.gDuration).toFixed(2));
            console.log("prijs 2: "+prices[1])
           // break
        }
    }
    }
    else prices.push(0.00)
  console.log("prices: "+prices)
  return prices
}
function formatTime(time){
  console.log("time: "+time)
  if(time<24) return time +"h"
  else if(time>=24&&time<720) {
      console.log("tijd groter dan 24: "+time/24+time%24)
      return (time/24)+"d"
  }
  else if(time>=720) {
      console.log("tijd groter dan 24")
      return (time/720)+"m"
  }
}