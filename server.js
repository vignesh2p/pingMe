const express = require('express')
const app = express()
const fileUpload = require('express-fileupload');
var dbConn = require('./dbConnMongo')
var mailService = require('./mailService')
var Q = require("q");
var dateTime = require('node-datetime');
var cron = require('node-schedule');
var fs = require('fs');
var node_xj = require("xls-to-json");
var json2xls = require('json2xls');
var session = require('express-session');
var parseurl = require('parseurl');
var multer  = require('multer');
//var uuid = require('node-uuid');
var oppath = './Outputs/' ;
var shell = require('shelljs');
//var async = require('async');
//var passport     = require('passport');
//var  LdapStrategy = require('passport-ldapauth');
var bodyParser = require('body-parser');

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
})); 



app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true
  }))
  
  app.use(function (req, res, next) {
    if (!req.session.views) {
      req.session.views = {}
    }
   
    // get the url pathname
    var pathname = parseurl(req).pathname
   
    // count the views
    //req.session.views[pathname] = (req.session.views[pathname] || 0) + 1
   
    next()
  })
  
//  app.use(express.static('angularjs'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({extended: false}));
  //app.use(passport.initialize());
  

  var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http:"+host+":"+port)
 })

  app.post('/login', function(req, res) {
  console.log(req.body);
  fs.writeFile("./body.json", JSON.stringify(req.body), function(err) {
    if(err) {
        return console.log(err);
    }

    console.log("The file was saved!");
}); 
  dbConn.findDocuments({"orgemail":req.body.userid,"password":req.body.password},'organization',(function(response){
    if(response.length > 0){
      session.status == true;
      var conditionjson = {"orgid" : response[0].orgid}
     
      dbConn.findDocuments(conditionjson,'organization-data',(function(viewObj){
        conditionjson.code = "200 OK";
        conditionjson.msg = "Login success";
        conditionjson.data = viewObj[0];
        res.send(conditionjson);
      }));
    }else{
        var conditionjson = {}
        conditionjson.code = "401 Authentication Error";
        conditionjson.msg = "Invalid username or password";
        res.send(conditionjson);
    }
       
  }));
    
  });
  
  app.get('/', function(req, res) {
    console.log('**************Welcome****************'); 
    res.send('success');   
    });
  
  app.get('/test', function(req, res) {
    console.log('**************Welcome****************'); 
    res.send('success');   
    });
  
  app.post('/logout', function(req, res) {
  
     req.session.views['/login'] = 0
     req.session.views['user'] = undefined;
       res.send('success');
  });
  
  function checkSession(req, res){
    if(req.session.views['/login'] > 0 && req.session.views['user'] != undefined){
       return true
    }else{
      return false
    }
  }
  app.get('/pingme', function (req, res) {
     //res.sendFile( __dirname + "/angularjs/html/" + "MSM2.html" );
      res.sendFile( __dirname + "/angularjs/html/" + "LoginForm.html" );
  });

  app.get('/pingme/home', function (req, res) {
    if(checkSession(req, res)){
     res.sendFile( __dirname + "/angularjs/html/" +"MSM2.html" );
     }else{
       res.sendFile( __dirname + "/angularjs/html/" + "LoginForm.html" );
     }
    })
    
    
    app.post('/register',function(req,res){
      dbConn.findDocuments({"orgemail":req.body.orgemail},'organization',(function(response){
        if(response.length > 0){ 
          var conditionjson = {}
          conditionjson.code="412 Precondition Failed";
          conditionjson.msg="Organization already exists";
          res.send(conditionjson); 
        } else {
            dbConn.insertDocuments([req.body],'organization',(function(response){
            console.log(response);
            if(response.result != undefined){
                  var conditionjson = {"code" : "200 OK", "msg" : "Registered Sucessfuly"}
                  res.send(conditionjson);
            }  else{
              var conditionjson = {}
              conditionjson.code="412 Precondition Failed";
              conditionjson.msg="Error in registering Organization";
              res.send(conditionjson); 
            }
          }));
        }


      }));
       
    })
    
    
    app.post('/savedetails',function(req,res){
      console.log([req.body]);
      dbConn.findDocuments({"orgid" : req.body.orgid},'organization-data',(function(response){ 
        console.log(response); 
        if(response.length > 0){ 
          var setjson = req.body;
          delete setjson['orgid'];
          dbConn.updateDocument({"orgid" : response[0].orgid},setjson,'organization-data',(function(response){
            if(response.length > 0){
                res.send('success');
            }else{
                res.send('fail');
            }
        }));
        }else{
          dbConn.insertDocuments([req.body],'organization-data',(function(response){
            if(response.length > 0){
                res.send('success');
            }else{
                res.send('fail');
            }
        }));
        }
      }));
    })
   
    
    app.post('/sendMail', function(req, res) {
     var toEmails = req.body.toEmails;      
     var subject = req.body.subject;
     var content = req.body.content;
      var options  = {
      //  from: 'SUPPORT TEAM', // sender address
        fromname:   'Codette',
        to : toEmails, // comma separated list of receivers
        subject: subject,// Subject line
        text: content// plaintext body
      }
      console.log(req.body);
      mailService.sendmail(options);
      var conditionjson = {}
      conditionjson.code="200 Ok";
      conditionjson.msg="Mail Triggered sucessfully";
      res.send(conditionjson);   
      });
    


