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
var uuid = require('node-uuid');
var oppath = './Outputs/' ;
var shell = require('shelljs');
//var async = require('async');
//var passport     = require('passport');
//var  LdapStrategy = require('passport-ldapauth');
var bodyParser = require('body-parser')
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
  

  var server = app.listen(8282, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http://%s:%s", host, port)
 })

  app.post('/login', function(req, res) {
  dbConn.findDocuments({"uname":req.body.uname,"pass":req.body.pass},'organization',(function(response){
    if(response.length >0){
      session.status == true;
     req.session.views['/login'] = (req.session.views['/login'] || 0) + 1
      req.session.views['user'] = req.body.uname;
      var conditionjson = {"OrgId" : response[0].OrgId}
      dbConn.findDocuments(conditionjson,'users',(function(viewObj){
        res.send(viewObj[0]);
      }));
    }else{
        res.send('wrong username or password');
    }
       
  }));
    
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
      console.log([req.body]);
        dbConn.insertDocuments([req.body],'organization',(function(response){
            if(response.length > 0){
                res.send('success');
            }else{
                res.send('fail');
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
    