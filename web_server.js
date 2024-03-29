const express = require('express');
const fs = require('fs');
const app = express()
const http = require('http');
const https = require('https');
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
const { send } = require('process');
var token;
pfLogin()
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
setInterval(() => {
  token = pfLogin()
  con.query("DELETE FROM verify WHERE time=1;", function (err, rows) {
    if (err) console.log(err);
    else console.log("DELETED "+rows+" from verify")
  });
  con.query("UPDATE verify SET time=1;", function (err, rows) {
    if (err) console.log(err);
    else console.log("UPDATED "+rows+" from verify")
  });
}, 60*15*1000);//15 minuten voor je opnieuw een mail kan krijgen.
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
      else if(result.length){
        var devices=result
        let arr =""
        arr+="'"+result[0].mac+"'"
        for(let i=1;i<result.length;i++) arr+=",'"+result[i].mac+"'"
        console.log(arr)
        pfcon.query("SELECT * FROM bandwidth_accounting WHERE mac IN ("+arr+"); SELECT * FROM bandwidth_accounting_history WHERE mac IN ("+arr+");", [1,2], function(err, result){
          if(err){
            console.log(err)
            res.sendStatus(500)
          }
          else {
            res.send([result, devices])
          }
        })
      }
      else res.send([[[],[]],[]])//lege array als er niks is
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
  let str="bcdfghjklmpqrstvwxyz0123456789BCDFGHJKLMPQRSTVWXZ"
  let code=""
  console.log("tries: "+req.session.tries)
  if(req.session.tries==null||isNaN(req.session.tries)) req.session.tries = 0
  console.log("tries: "+req.session.tries)
  for(let i=0; i<50;i++) code+=str.charAt(Math.random()*str.length)
  if(req.session.tries<2){
    con.query("SELECT * FROM verify WHERE email="+JSON.stringify(data.email)+"; SELECT * FROM users WHERE email="+JSON.stringify(data.email)+" OR bcode='"+data.bcode+"' OR username='"+data.username+"'", [1,2], function(err, result){
      if(err) {
        console.log(err)
        res.send(400)
      } 
      else if(result[0].length) res.send({success:false, msg: "Je hebt al een e-mail gekregen."})
      else if(result[1].length) res.send({success:false, msg: "Je bent al een gebruiker."})
      else{
        let username = data.email.substring(0,data.email.indexOf("@"))
        let emailDomain = data.email.substring(data.email.indexOf("@"), data.email.length)
        console.log("email domain: "+emailDomain)
        if(emailDomain==="@sgsintpaulus.eu"){
          console.log(username)
          username = username.split(".")[0].substring(0,1).toUpperCase() + username.split(".")[0].substring(1,username.split(".")[0].length) +" " + username.split(".")[1].substring(0,1).toUpperCase() + username.split(".")[1].substring(1,username.split(".")[1].length)
          console.log(username)
          con.query("INSERT INTO verify VALUES("+JSON.stringify(data.email)+","+JSON.stringify(username)+",SHA2("+JSON.stringify(data.pin)+",512),'"+data.bcode+"','"+code+"',SHA2("+JSON.stringify(data.password)+",512), 0);", function(err, result){
            if(err) {
              console.log(err)
              res.sendStatus(500)
            } 
            else {
              //verzend hier email
              //verzend hier naar terminal server
                req.session.tries++
                mail.mail(data.email, username, code, data.bcode)
                if(data.code!=="") postToTerminalServer(data.code, "/register/terminal/send-status");
                res.send({success:true})
            }
          })
        }
        else res.send({success: false, msg: "Dit is geen e-mail adres van Sint-Paulusschool."})
    }
    })
  }
  else res.send({success: false, msg: "Te veel registratie pogingen."})
})
app.get("/register/verify-email", function(req,res){
  con.query("SELECT * FROM verify WHERE BINARY code="+JSON.stringify(req.query.code)+" AND email="+JSON.stringify(req.query.email)+";SELECT * FROM users WHERE email="+JSON.stringify(req.query.email), [1,2], function(err, result){
    console.log(result)
    console.log("verify len: "+result[0].length)
    if(err) {
      console.log(err)
      res.send("Er ging iets mis.")
    }
    else if(result[0].length&&!result[1].length){
      con.query("INSERT INTO users VALUES ("+JSON.stringify(result[0][0].username)+","+JSON.stringify(result[0][0].email)+",'"+result[0][0].pin+"','"+result[0][0].password+"','"+result[0][0].bcode+"',0)", function(err){
        if (err) {
          console.log(err)
          res.send("Er ging iets mis.")
        }
        else {
          res.render(__dirname+"/login.ejs", {status:3, fout:""})
        }
      })
     /* con.query("DELETE FROM verify WHERE code="+JSON.stringify(req.query.code), function(err){ //web omdat de bots van microsoft deze link openen om te checken of het geen phishing is
        if (err) {
          console.log(err)
        }
      })*/
    }
    else if(result[0].length){
      res.render(__dirname+"/login.ejs", {status:3, fout:""})
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
else if(req.session.admin) res.redirect("/admin/dashboard")
else res.redirect("/user/dashboard")
})
app.post("/login/send-data", function(req,res){
  con.query("SELECT * FROM users WHERE email="+JSON.stringify(req.body.email)+" AND BINARY password=SHA2("+JSON.stringify(req.body.password)+", 512);"+
  "SELECT * FROM admin WHERE username="+JSON.stringify(req.body.email)+" AND BINARY password=SHA2("+JSON.stringify(req.body.password)+", 512);",[1,2], function(err,result){
    if(err) {
      console.log(err)
      res.render(__dirname+"/login", {fout: "Er ging iets mis.", status:0})
    } 
    else if(result[0].length) {
  req.session.admin = false;
  req.session.login=true
  console.log(req.session.login)
  req.session.username=result[0][0].username
  req.session.email=result[0][0].email
  req.session.password=result[0][0].password//kan misschien weg
  console.log(req.query)
  if(req.query.src!=null) res.redirect(req.query.src)
  else res.redirect("/user/dashboard")//de # wegdoen om problemen te voorkomen
  }
  else if(result[1].length){
    req.session.admin = true;
    req.session.login=true
    console.log(req.session.login)
    req.session.username=result[1][0].username
    req.session.password=result[1][0].password//kan misschien weg
    res.redirect("/admin/dashboard")
  }
  else res.render(__dirname+"/login", {fout: "Onjuist e-mail adres of wachwoord.", status:0})
  })
})
app.get("/user/dashboard", function(req,res){
  if(req.session.login && !req.session.admin){
    res.render(__dirname+"/dashboard.ejs", {username: req.session.username})
  }
  else res.redirect("/login?src="+url.parse(req.url).pathname)
})
app.get("/user/dashboard/get-history", function(req,res){
  if(req.session.login && !req.session.admin){
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
  if(req.session.login && !req.session.admin){
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
  if(req.session.login && !req.session.admin){
   con.query("SELECT * FROM dataprijzen ORDER BY price ASC", function(err,result){
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
  if(req.session.login && !req.session.admin){
    con.query("SELECT * FROM tijdprijzen; SELECT saldo FROM users WHERE email='"+req.session.email+"';SELECT * FROM settings; SELECT * FROM beurten WHERE email='"+req.session.email+"' AND used<devices",[1,2,3,4], function(err ,result){
      if(err) console.log(err)
      else if(result.length&&result[2][0].allow_new&&result[3].length<result[2][0].max_beurten){ 
       let price= calcPrice(result[0], req.body)
       let str = "0123456789azeretyuiopqsdfghjklmwxcvbn"
       let password=""
       let totprice = parseFloat(price[0])+parseFloat(price[1])//anders worden ze stringmatig opgetelt
       if(totprice<=result[1][0].saldo&&(req.body.devices>0||req.body.gDevices>0)&&!isNaN(req.body.activationDate)){
        let suffix = ""
        for(let i=0;i<8;i++) password+=str.charAt(Math.random()*str.length)
           //voor normale apparaten
             var datum = new Date().getTime()
             if(req.body.devices>0&&req.body.gDevices>0){//req.body.devices werkte niet
               if(req.body.adblock==="true")suffix="-adblock"
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
              if(req.body.adblock==="true") suffix+="-adblock"
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
              if(req.body.adblock==="true") suffix+="-adblock"
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
       else if((req.body.devices==0&&req.body.gDevices==0)||isNaN(req.body.activationDate)) res.send({success:false, msg: "Vul alle velden in."})
       else res.send({success:false, msg: "Niet genoeg saldo."})
    }
    else if(!result[2][0].allow_new) res.send({success:false, msg: "Het is momenteel niet mogelijk nieuwe beurten aan te maken."})
    else if(result[3].length>=result[2][0].max_beurten) res.send({success:false, msg: "Je hebt het maximum aantal beurten bereikt."})
    else res.send({success:false, msg: "Er ging iets mis."})
    })
  }
  else res.sendStatus(401)
})
app.post("/user/dashboard/create-new-data", function(req,res){
  if(req.session.login){
    con.query("SELECT * FROM dataprijzen; SELECT saldo FROM users WHERE email='"+req.session.email+"'; SELECT * FROM settings;SELECT * FROM beurten WHERE email='"+req.session.email+"' AND used<devices",[1,2, 3,4], function(err ,result){
      if(err) console.log(err)
      else if(result.length&&result[2][0].allow_new&&result[3].length<result[2][0].max_beurten){ 
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
                 if(req.body.adblock==="true")suffix="-adblock"
                 console.log(suffix)
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
                if(req.body.adblock==="true") suffix+="-adblock"
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
                if(req.body.adblock==="true") suffix+="-adblock"
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
    else if(!result[2][0].allow_new) res.send({success:false, msg: "Het is momenteel niet mogelijk nieuwe beurten aan te maken."})
    else if(result[3].length>=result[2][0].max_beurten) res.send({success:false, msg: "Je hebt het maximum aantal beurten bereikt."})
    else res.send({success:false, msg: "Er ging iets mis."})
    })
  }
  else res.sendStatus(401)
})
app.post("/user/dashboard/set-saldo", function(req,res){
  if(req.session.login && !req.session.admin){
    console.log(req.body)
    con.query("SELECT max_saldo FROM settings; SELECT saldo FROM users WHERE email='"+req.session.email+"'", [1,2], function(err, result){
      if(err){
        console.log(err)
        res.send(500)
      }
      else if(result[0][0].max_saldo>=parseFloat(req.body.saldo)+result[1][0].saldo){
        con.query("UPDATE users SET saldo=saldo+"+req.body.saldo+" WHERE email='"+req.session.email+"'", function(err,result){
          if(err) {
            console.log(err)
            res.send(400)
          }
          else res.send({success:true})
        })
      }
      else res.send({success:false, msg:"Je zit boven het maximum toegelaten saldo."})
    })
  }
  else res.send(401)
})
app.get("/user/dashboard/get-saldo", function(req,res){
  if(req.session.login && !req.session.admin){
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
app.get("/user/logout", (req,res)=>{
  req.session.admin = false;
  req.session.login=false;
  res.redirect("/")
})
app.get("/user/account", function(req,res){
  if(req.session.login && !req.session.admin) 
  {
    con.query("SELECT * FROM users WHERE email="+JSON.stringify(req.session.email), function(err,result){
      if(err){
        console.log(err)
        res.send("Er ging iets mis.")
      }
      else if(result.length){
        res.render(__dirname+"/account.ejs", {username: req.session.username, email: req.session.email, bcode: result[0].bcode, saldo: result[0].saldo.toFixed(2)})
      }
    })
  } 
  else res.redirect("/login?src="+url.parse(req.url).pathname)
})
app.put("/user/account/change-pin", function(req,res){
  if(req.session.login && !req.session.admin){
    con.query("SELECT * FROM users WHERE email="+JSON.stringify(req.session.email)+" AND pin=SHA2("+req.body.oldPin+",512)", function(err, result){
      if(err){
        console.log(err)
        res.send(500)
      }
      else if(result.length){
        if(req.body.newPin.length==4){
          con.query("UPDATE users SET pin=SHA2("+req.body.newPin+", 512)", function(err, result){
            if(err) {
              console.log(err)
              res.send(500)
            }
            else{
              res.send({success:true})
            }
          })
        }
        else res.send({success: false, msg: "De nieuwe PIN-code moet een lengte van 4 cijfers hebben."})
      }
      else res.send({success: false, msg: "De oude PIN-code is niet juist."})
    })
  }
  else res.send(401)
})
app.put("/user/account/change-pass", function(req,res){
  if(req.session.login && !req.session.admin){
    con.query("SELECT * FROM users WHERE email="+JSON.stringify(req.session.email)+" AND password=SHA2("+req.body.oldPass+",512)", function(err, result){
      if(err){
        console.log(err)
        res.send(500)
      }
      else if(result.length){
        if(req.body.newPass.length>=8&&req.body.newPass.length<=15){
          con.query("UPDATE users SET password=SHA2("+req.body.newPass+", 512)", function(err, result){
            if(err) {
              console.log(err)
              res.send(500)
            }
            else{
              res.send({success:true})
            }
          })
        }
        else res.send({success: false, msg: "Het nieuwe wachtwoord moet een lengte tussen 8 en 15 tekens hebben."})
      }
      else res.send({success: false, msg: "Het oud wachtwoord is niet juist."})
    })
  }
  else res.send(401)
})
app.get("/admin/dashboard", function(req,res){
  if(req.session.login&&req.session.admin){
    res.render(__dirname+"/admincenter.ejs", {username: req.session.username})
  }
  else res.redirect("/login")
})
app.put("/admin/dashboard/change-data-price", function(req,res){
  if(req.session.login&&req.session.admin){
    if(!isNaN(req.body.price )&&!isNaN(req.body.data)){
      con.query("UPDATE dataprijzen SET price="+req.body.price+" WHERE data="+req.body.data, function(err){
        if(err){
          console.log(err)
          res.send(500)
        }
        else {
              res.send({success:true})
            }
      })
    }
    else res.send({success:false, msg: "Ongeldige waarden."})
  }
  else res.send(401)
})
app.put("/admin/dashboard/change-time-price", function(req,res){
  if(req.session.login&&req.session.admin){
    if(!isNaN(req.body.price )&&!isNaN(req.body.time)){
      con.query("UPDATE tijdprijzen SET price="+req.body.price+" WHERE time="+req.body.time, function(err){
        if(err){
          console.log(err)
          res.send(500)
        }
        else {
              res.send({success:true})
            }
      })
    }
    else res.send({success:false, msg: "Ongeldige waarden."})
  }
  else res.send(401)
})
app.put("/admin/dashboard/add-time", function(req,res){
  if(req.session.login&&req.session.admin){
    if(!isNaN(req.body.price )&&!isNaN(req.body.time)){
      con.query("SELECT * FROM tijdprijzen WHERE time="+req.body.time, function(err, result){
        if(err){
          console.log(err)
          res.send(500)
        }
        else if(!result.length){
          con.query("INSERT INTO tijdprijzen VALUES("+req.body.time+", "+req.body.price+",1)", function(err){
            if(err){
              console.log(err)
              res.send(500)
            }
            else {
                  res.send({success:true})
                }
          })
          }
          else{
            res.send({success:false, msg:"Deze tijd bestaat al!"})
          }
      })
    }
    else res.send({success:false, msg: "Ongeldige waarden."})
  }
  else res.send(401)
})
app.put("/admin/dashboard/delete-time-beurt", function(req,res){
  if(req.session.login&&req.session.admin){
    if(!isNaN(req.body.price )&&!isNaN(req.body.time)){
      con.query("DELETE FROM tijdprijzen WHERE time="+req.body.time, function(err){
        if(err){
          console.log(err)
          res.send(500)
        }
        else {
              res.send({success:true})
            }
      })
    }
    else res.send({success:false, msg: "Ongeldige waarden."})
  }
  else res.send(401)
})
app.get("/admin/dashboard/get-all-prices", function(req,res){
if(req.session.login&&req.session.admin){
  con.query("SELECT * FROM tijdprijzen; SELECT * FROM dataprijzen;", [1,2], function(err, result){
    if(err){
      console.log(err)
      res.sendStatus(500)
    }
    else {
      res.send({time: result[0], data:result[1]})
    }
  })
}
else res.sendStatus(401)
})
app.get("/admin/dashboard/get-all-users", function(req,res){
  if(req.session.login&&req.session.admin){
    return new Promise((resolve, reject)=>{
      con.query("SELECT email, username FROM users; SELECT * FROM blacklist;",[1,2], function(err, result){
        if(err){
          console.log(err)
          res.sendStatus(500)
          reject("Er ging iets mis.")
        }
        else {
          resolve(result)
        }
      })
    }).then(value=>{
      pfcon.query("SELECT status, pid FROM node;", function(err, result){
        if(err){
          console.log(err)
          res.send(500)
        }
        else{
          let obj =[]
          let users= []
          for(let i=0; i<value[0].length;i++){
            let loop=false
            let active = 0;
            let user=null;
            for(let y=0;y<result.length;y++){
              //console.log("username: "+value[0][i].username)
              if(result[y].pid.startsWith(value[0][i].username)) {
                if(result[y].status==='reg') active++
              } 
            }
            obj.push(Object.assign({}, value[0][i], {active: active}))
          }
         // Array.prototype.push.apply(value,result); 
          res.send({user: obj, blacklist: value[1]})
        }
      })
    }).catch(err=>{
      res.send(500)
    })
  }
else res.sendStatus(401)
})
app.get("/admin/dashboard/get-all-settings", function(req,res){
  if(req.session.login&&req.session.admin){
    con.query("SELECT * FROM settings", function(err, result){
      if(err){
        console.log(err)
        res.send(500)
      }
      else {
        res.send(result)
      }
    })
  }
else res.sendStatus(401)
})
app.put("/admin/dashboard/change-network-settings", function(req,res){
  if(req.session.login&&req.session.admin){
    con.query("UPDATE settings SET max_users="+req.body.maxUsers+", max_beurten="+req.body.maxBeurten+", max_saldo="+req.body.maxSaldo+", allow_logins="+req.body.allowNewLogins+", allow_new="+req.body.allowNewBeurten+"", function(err, result){
      if(err){
        console.log(err)
        res.send(500)
      }
      else {
        res.send({success:true})
      }
    })
  }
else res.send(401)
})
app.post("/admin/dashboard/register-user", function(req, res){
  if(req.session.login&&req.session.admin){
    pfcon.query("SELECT mac FROM node WHERE pid LIKE "+JSON.stringify(req.body.username+"%"), function(err,result){
      if(err){
        console.log(err)
        res.send(500)
      }
      else if(result.length){
        let macs = []
        for (let i=0;i<result.length;i++) macs.push(result[i].mac)
        regUser(macs, (success)=>{//callback gebruiken om te wachten op resultaat
          console.log("is user registered? "+success)
          if(success.length){
            let devices=0;
            let alreadyRegistered=0;
            for(let i=0;i<success.length;i++) {
              if(success[i].status==="success") devices++
              else if(success[i].status==="skipped") alreadyRegistered++
            } 
            if(alreadyRegistered==1)  res.send({success: true, msg: "Er zijn "+devices+ " apparaten ingelogd.\n"+alreadyRegistered+ " was al ingelogd."})
            else  res.send({success: true, msg: "Er zijn "+devices+ " apparaten ingelogd.\n"+alreadyRegistered+ " waren al ingelogd."})
          }
          else res.send({success: false, msg: "Kon niet communiceren met het netwerk."})
        });
      }
      else res.send({success:false, msg:"Geen apparaten om te registreren."})
    })
  }
})
app.post("/admin/dashboard/ban-user", function(req,res){
  if(req.session.login&&req.session.admin){
    con.query("SELECT * FROM blacklist WHERE email="+JSON.stringify(req.body.email), function(err, result){
      if(err){
        console.log(err)
        res.send(500)
      }
      else if(result.length) {
        con.query("DELETE FROM blacklist WHERE email="+JSON.stringify(req.body.email), function(err, result){
          if(err){
            console.log(err)
            res.send(500)
          }
          else res.send({success:true, msg: "Gebruiker verwijderd van zwarte lijst."})
        })
      }
      else{
        con.query("INSERT INTO blacklist VALUES("+JSON.stringify(req.body.email)+", "+JSON.stringify(req.body.username)+")", function(err, result){
          if(err){
            console.log(err)
            res.send(500)
          }
          else res.send({success:true, msg: "Gebruiker toegevoegd aan zwarte lijst."})
        })
      }
    })
  }
  else res.send(401)
})
app.get("/admin/logout",function(req,res){
if(req.session.login&&req.session.admin){
  req.session.admin = false;
  req.session.login=false;
  res.redirect("/")
}
else res.redirect("/")
})
app.get("/", function(req,res){
  if(req.session.login)   res.redirect("/user/dashboard")
  else res.render(__dirname+"/home.ejs", {status: 0, popupbtntext:"Sluiten", bcode:""})
})
app.use(function(req,res){
  res.sendFile(__dirname+"/404.html")
})
server.listen(8008, ()=>{
  console.log("luisteren")
})
 function pfLogin (){
  console.log("logging in")
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
  data={"username":"admin", "password": "Gip"}
  var options = {
    host: '192.168.100.2',
    path: "/api/v1/login",
    port: 9999,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    }}
  var httpreq = https.request(options, function (response) {
    response.setEncoding('utf8');
    console.log(response.statusCode)
    response.on('data', (d) => {
      let res = JSON.parse(d)
      console.log("loged in, token:" +res.token)
      token = res.token
    });
    response.on('error', (d) => {
    });
})
  httpreq.end(JSON.stringify(data))
}
function regUser(macs, callback){
  process.env["NODE_TLS_REJECT_UNAUTHORIZED"] = 0;
    console.log("token: "+token + ", mac: "+macs)
    let data={
      "items": macs
    }
    var options = {
      host: '192.168.100.2',
      path: "/api/v1/nodes/bulk_register",
      port: 9999,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization' : token
      }
    }
    var httpreq = https.request(options, function (response) {
     // response.setEncoding('utf8');
     console.log(response.statusCode +" "+ response.statusMessage)
     if(response.statusCode==200){
      response.on('data', (d) => {
        let res = JSON.parse(d)
        console.log(res.items)
        callback(res.items) 
      });
     }
     else  callback("") 
     response.on("error", ()=>{
      callback("") 
     })
    });
    httpreq.end(JSON.stringify(data))
}
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