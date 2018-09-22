const express = require('express')
const app = express()
//const fileUpload = require('express-fileupload');
var dbConn = require('./dbConnMongo');
var fcm = require('./fcmService.js');
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
var uuid = require('uuid-random');
var path = require('path');
var shell = require('shelljs');
//var async = require('async');
//var passport     = require('passport');
//var  LdapStrategy = require('passport-ldapauth');
var bodyParser = require('body-parser');
//var routes = require('./imagefile');
var stringSimilarity = require('string-similarity');
var url = require('url');
var distance = require('google-distance');
//var sleep = require('thread-sleep');
var arraySort = require('array-sort');
var moment = require('moment-timezone');
const queries = require('./queries');
//app.use('/', routes);

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
  

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));
  //app.use(passport.initialize());

// connect to mongo,
//i have created mongo collection in mlab.com.. the below is my database access url..
//So make sure you give your connection details..

 
//app.use('/image', routes);
 
//URL : http://localhost:3000/images/
// To get all the images/files stored in MongoDB


  var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port
  log("Example app listening at http:"+host+":"+port)
 })

  app.post('/login', function(req, res) {
    traceLog([req.body]);
    dbConn.findDocuments({"orgemail":req.body.orgemail,"password":req.body.password},'organization',(function(response){
      if(response.length > 0){
        session.status == true;
        var conditionjson = {"orgid" : response[0].orgid};
        if(response[0].status == '1') {
          conditionjson.code = "200 OK";
          conditionjson.msg = "Login success";
          conditionjson.data = response[0];
          res.send(conditionjson);
        } else {
          conditionjson.code = "201 OK";
          conditionjson.msg = "Status In Active";
        }
      }else{
          var conditionjson = {}
          conditionjson.code = "401 Authentication Error";
          conditionjson.msg = "Invalid username or password";
          res.send(conditionjson);
      }
        
    }));
    
  });
  
  app.get('/', function(req, res) {
    log('**************Welcome****************'); 
    res.send('success');   
    });

  app.post('/verifyUser', function(req, res) {
      traceLog(req.body);
      dbConn.findDocuments({"orgemail":req.body.userid},'organization',(function(response){
        if(response.length > 0){
          session.status == true;
          var conditionjson = {"orgid" : response[0].orgid}    
            conditionjson.code = "200 OK";
            conditionjson.msg = "Verified";
            conditionjson.data = response[0];
            res.send(conditionjson);

        }
      }));   
  });
  
  app.get('/test', function(req, res) {
    log('**************Welcome****************'); 
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
          conditionjson.msg="Organization email already registered";
          res.send(conditionjson); 
        } else {
            var orgJson = req.body;
            orgJson.orgLat= parseFloat(req.body.orgLat);
            orgJson.orgLon= parseFloat(req.body.orgLon);
            dbConn.insertDocuments([orgJson],'organization',(function(response){
            traceLog(response);
            if(response.result != undefined) {
              var toEmails = 'viki19nesh@gmail.com';      
              var subject = 'Please confirm store registration with Codette';
              var content = 'Dear Team, \n A New Busisness ('+req.body.orgemail+','+req.body.orgphoneno+') has been registered kindly verify it. \nRegards \nCodette';
              var fromMail = '"GeoBuy"<sales@codette.in>'
               var options  = {
                 from: fromMail, // sender address
                // fromname:   'admin@codette.in',
                 to : toEmails, // comma separated list of receivers
                 subject: subject,// Subject line
                 text: content// plaintext body
               }
               traceLog(req.body);
               mailService.sendmail(options);

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
      log([req.body]);
      dbConn.findDocuments({"orgid" : req.body.orgid},'organization-data',(function(response){ 
        traceLog(response); 
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
   
    app.post('/updateorg',function(req,res){
     traceLog([req.body]);
      var setjson = req.body;
      setjson.orgLat = parseFloat(setjson.orgLat);
      setjson.orgLon = parseFloat(setjson.orgLon);
      dbConn.updateDocument({"orgid" : req.body.orgid},setjson,'organization',(function(response){
        traceLog([response]);
        if(response.length > 0){
            res.send('OK');
        }else{
            res.send('fail');
        }
    }));
    })


    app.post('/sendMail', function(req, res) {
     var toEmails = req.body.toEmails;      
     var subject = req.body.subject;
     var content = req.body.content;
     var fromMail = '"'+req.body.orgname+'"<sales@codette.in>'
      var options  = {
        from: fromMail, // sender address
       // fromname:   'admin@codette.in',
        to : toEmails, // comma separated list of receivers
        subject: subject,// Subject line
        text: content// plaintext body
      }
      traceLog(req.body);
      mailService.sendmail(options);
      var conditionjson = {}
      conditionjson.code="200 Ok";
      conditionjson.msg="Mail Triggered sucessfully";
      res.send(conditionjson);   
      });
    
      app.post('/products', function (req, res) {
        traceLog(req.body);
        /*dbConn.findDocuments({"orgid":req.body.orgid},'organization-products',(function(response){
          console.log('response.length--------'+response.length);
          if(response.length > 0){
            session.status == true;
            var conditionjson = {"orgid" : response[0].orgid}    
              conditionjson.code = "200 OK";
              conditionjson.msg = "Verified";
              conditionjson.data = response[0].products;
              res.send(conditionjson);
  
          }
        })); */
        
            var aggregateJson ={};
            aggregateJson.from = 'products';
            aggregateJson.localField = 'masterid';
            aggregateJson.foreignField = 'id';
            aggregateJson.as = 'productDetails';
            var conditionJson = {"orgid":req.body.orgid};
            dbConn.findDocumentsByJoin( 'organization-products', aggregateJson, conditionJson ,function(resp){
                       traceLog(resp)
                    if(resp.length > 0) {
                        res.send(resp);
                    }else{
                      res.send([]);
                    }
                    
            });
      })


      app.post('/saveReceipt', function (req, res) {
       // console.log(req.body);
        var receipt = req.body;
        var products = JSON.parse(receipt.products);
        receipt.products = products;
        dbConn.insertDocuments([receipt],'receipts',(function(response) {
          if(response.length > 0)
              res.send('1');
          else
              res.send('0');
          
        }));   
      })

      app.post('/receipts', function (req, res) {
        // console.log(req.body);
        traceLog(req.body);
        dbConn.findDocuments({"orgid":req.body.orgid},'products',(function(response){
          if(response.length > 0){
            session.status == true;
            var conditionjson = {"orgid" : response[0].orgid}    
              conditionjson.code = "200 OK";
              conditionjson.msg = "Verified";
              conditionjson.data = response[0];
              res.send(conditionjson);
  
          }
        })); 
        
        
       })
       
       
      app.post('/storesByPosition', function (req, res) {
        //traceLog(req.body);
        var param = {}
        param.maxlattitude= parseFloat(req.body.maxlattitude);
        param.minlattitude= parseFloat(req.body.minlattitude);
        param.maxlongitude= parseFloat(req.body.maxlongitude);
        param.minlongitude= parseFloat(req.body.minlongitude);
        traceLog(param);
        var conditionJson = {"orgLat":{$lt:param.maxlattitude, $gt:param.minlattitude },"orgLon":{$lt:param.maxlongitude, $gt:param.minlongitude} };
        var aggregateJson ={};
        aggregateJson.from = 'organization-products';
        aggregateJson.localField = 'orgid';
        aggregateJson.foreignField = 'orgid';
        aggregateJson.as = 'products';
        dbConn.findDocumentsByJoin( 'organization', aggregateJson, conditionJson ,function(resp){
                       traceLog(resp)
                    if(resp.length > 0) {
                        var conditionjson = {}    
                        conditionjson.code = "200 OK";
                        conditionjson.msg = "Verified";
                        conditionjson.data = resp;
                        res.send(conditionjson);
                    }else{
                      res.send({data :[]});
                    }
                    
        });
       
      /* 
       dbConn.findDocuments(
        {"orgLat":{$lt:param.maxlattitude,
                  $gt:param.minlattitude
                },
        "orgLon":{$lt:param.maxlongitude,
          $gt:param.minlongitude
        }       
        },'organization',(function(response){
        console.log('response.length--------'+response.length);
        if(response.length > 0){
          session.status == true;
          var conditionjson = {}    
            conditionjson.code = "200 OK";
            conditionjson.msg = "Verified";
            conditionjson.data = response;
            res.send(conditionjson);

        } else{
           var conditionjson = {}    
            conditionjson.code = "200 OK";
            conditionjson.msg = "Verified";
            conditionjson.data = [];
            res.send(conditionjson);
          // res.send(conditionjson);
        }
        })); */ 
       // res.send("1");
       })
        


    
       app.get('/categories', function (req, res) {
       var queryJson = req.body;
      // queryJson.isBanner = (queryJson.isBanner == 'true');
        log(queryJson);
        queryJson.status = 1;
        var aggregateJson ={};
        aggregateJson.from = 'sub-category';
        aggregateJson.localField = 'id';
        aggregateJson.foreignField = 'category';
        aggregateJson.as = 'subcategory';
        dbConn.findDocumentsByJoin('category',aggregateJson, queryJson, function (response) {
          if(response.length > 0){
            session.status == true;
            var conditionjson = {}    
              conditionjson.code = "200 OK";
              conditionjson.msg = "Verified";
              conditionjson.data = arraySort(response, 'gpriority', {reverse: true});
              res.send(conditionjson);
          }
        });
       })
       
       
       app.get('/brands', function (req, res) {
         var url_parts = url.parse(req.url, true);
         var param = url_parts.query;
         if(param.subcategory) {
           dbConn.findDistinctDocuments('brand', {subcategory: param.subcategory}, 'organization-products', 
           function(response) {
              if(response){
                  var brands = response;
                  dbConn.findDocuments({ "id" : {"$in": brands}},'brands',(function(response){
                      if(response.length > 0){
                          log(response);
                          res.send(response);
                      } else {
                        res.send([]);
                      }
                    })); 
              }
           });
         } else {
                 dbConn.findDocuments({},'brands',(function(response){
                    if(response.length > 0){
                        res.send(response);
                    } else {
                      res.send([]);
                    }
                  })); 
         }
       })

       app.get('/categorymaster', function (req, res) {
        dbConn.findDocuments({"status" : 1},'category-master',(function(response){
           if(response.length > 0){
             session.status == true;
             res.send(response);
           }
         }));  
        
        })   

        app.get('/trendings', function (req, res) {
            var aggregateJson ={};
            aggregateJson.from = 'organization-products';
            aggregateJson.localField = 'id';
            aggregateJson.foreignField = 'masterid';
            aggregateJson.as = 'productDetails';
            dbConn.findDocumentsByJoin( 'trendings', aggregateJson, {} ,function(resp){
                       traceLog(resp)
                    if(resp.length > 0) {
                        res.send(resp);
                    }else{
                      res.send([]);
                    }
                    
            });
          
          })

            app.post('/productsSearch', function (req, res) {
            var searchKey = req.body.searchkey;
            var param = {}
            var aggregateJson ={};
            aggregateJson.from = 'organization-products';
            aggregateJson.localField = 'id';
            aggregateJson.foreignField = 'masterid';
            aggregateJson.as = 'productDetails';
            var conditionjson = { };
            conditionjson.text = {$regex:searchKey,$options:"$i"}
            if(req.body.maxlattitude)
            {
                param.maxlattitude= parseFloat(req.body.maxlattitude);
                param.minlattitude= parseFloat(req.body.minlattitude);
                param.maxlongitude= parseFloat(req.body.maxlongitude);
                param.minlongitude= parseFloat(req.body.minlongitude);
               // console.log(param);
                dbConn.findDocuments(
                                  {
                                    "orgLat":{
                                            $lt:param.maxlattitude,
                                            $gt:param.minlattitude
                                          },
                                    "orgLon":{
                                            $lt:param.maxlongitude,
                                            $gt:param.minlongitude
                                          }
                                  },'organization',(function(response){
                if(response.length > 0){
                var orIds = [];var i = 0;
                
                response.forEach(function(org){
                  orIds.push(org.orgid);
                  i++;
                  if(response.length == i){
                     traceLog(orIds);
                      conditionjson.orgid= { "$in": orIds } ;
                   // conditionjson.productDetails = { $elemMatch: { orgid: { "$in": orIds } } };
                    /*dbConn.findDocumentsByJoin( 'products', aggregateJson, conditionjson ,function(resp){
                       traceLog(resp)
                    if(resp.length > 0) {
                        res.send(resp);
                    }else{
                      res.send([]);
                    }
                    
                    });*/
                     dbConn.findDocuments(conditionjson,  'geobuy-search', function(resp){
                          if(resp.length > 0) {
                              res.send(resp);
                          } else {
                            res.send([]);
                          }
                     });
                    
                  }
                  },this);
              
                } else {
                  res.send([]);
                }
              })); 
            } else {
              
              log(conditionjson);
             /* dbConn.findDocumentsByJoin( 'geobuy-search', aggregateJson, conditionjson ,function(resp){
                       traceLog(resp)
                    if(resp.length > 0) {
                        res.send(resp);
                    } else {
                      res.send([]);
                    }
                    
                    });*/
                    
                    dbConn.findDocuments(conditionjson,  'geobuy-search', function(resp){
                          if(resp.length > 0) {
                              res.send(resp);
                          } else {
                            res.send([]);
                          }
                     });
            }
           
            })

            app.post('/orgsSearch', function (req, res) {

              traceLog('searchKey :: '+searchKey);
              var searchKey = req.body.searchkey;
              var param = {}
              var conditionjson ={}
              if(req.body.maxlattitude) {
                param.maxlattitude= parseFloat(req.body.maxlattitude);
                param.minlattitude= parseFloat(req.body.minlattitude);
                param.maxlongitude= parseFloat(req.body.maxlongitude);
                param.minlongitude= parseFloat(req.body.minlongitude);
                conditionjson.orgLat = {
                                            $lt:param.maxlattitude,
                                            $gt:param.minlattitude
                                          };
                conditionjson.orgLon = {
                                            $lt:param.maxlongitude,
                                            $gt:param.minlongitude
                                          };
              }
              conditionjson.orgname =  {$regex:searchKey,$options:"$i"};
              log(param);
              dbConn.findDocuments(conditionjson,'organization',(function(response){
                if(response.length > 0) {
                  res.send(response);
                } else
                  res.send([]);
                })); 
            })
              
             // findDocumentsByJoin('organization-products', aggregateJson, conditionjson, function(res){console.log(res);});

               app.post('/productDetails', function (req, res) {
                  traceLog(req.body);
                  var aggregateJson ={};
                  aggregateJson.from = 'organization-products';
                  aggregateJson.localField = 'id';
                  aggregateJson.foreignField = 'masterid';
                  aggregateJson.as = 'productDetails';
                  var conditionjson = {};
                  if(req.body.id)
                    conditionjson.id = req.body.id;
                  if(req.body.barcode)
                    conditionjson.ean = req.body.barcode;
                  dbConn.findDocumentsByJoin( 'products', aggregateJson, conditionjson ,function(response){
                  if(response){
                      res.send(response[0]);
                  }
                  }); 
              })
              
              
                app.post('/rateAndReview', function (req, res) {
                
              //  console.log(req.body);

                var reviewJson =req.body;
                reviewJson.rating = parseFloat(reviewJson.rating);
                var table = req.body.table;
                var conditionjson = {};
                if(table =='organization')
                    conditionjson.orgid = req.body.id;
                else
                    conditionjson.id = req.body.id;
                delete reviewJson['id']; 
                delete reviewJson['table']; 
                dbConn.updatePushDocument(conditionjson, {"reviews":reviewJson},table, (function(response){
                  // if(response.length > 0) {
                  
                 // console.log(req.body);
                  dbConn.findDocuments(conditionjson,table,(function(response){
                  var ratings;
                  var rat = 0;
                   // console.log('rating-------------------------------'+response);
                    if(response.length > 0) {
                      if(response[0].reviews != undefined){
                         for(var i=0; i< response[0].reviews.length; i++) {
                           rat = rat + parseFloat(response[0].reviews[i].ratings);
                           if(i == response[0].reviews.length-1) {
                              rat = rat / response[0].reviews.length;
                               var setjson = {"rating": rat}
                               traceLog(setjson);
                               dbConn.updateDocument(conditionjson,setjson,table,(function(response){
                                  traceLog(response);
                                  
                              }));
                           }
                         }
                      } else {
                        var setjson = {"rating": reviewJson.ratings};
                         traceLog(setjson);
                         dbConn.updateDocument(conditionjson,setjson,table,(function(response){
                            traceLog(response);
                            
                              }));
                      }
                  }
                })); 
                res.send(response);

                })); 
            })
            
            
              app.post('/getProductsByCategory', function (req, res) {
                  log(req.body);
                  var aggregateJson ={};
                  aggregateJson.from = 'organization-products';
                  aggregateJson.localField = 'id';
                  aggregateJson.foreignField = 'masterid';
                  aggregateJson.as = 'productDetails';
                  var conditionjson = { };
                  if(req.body.category) 
                    conditionjson.category = req.body.category;
                  
                  if(req.body.subcategory)
                    conditionjson.subcategory= req.body.subcategory;
                    
                  if(req.body.brand)
                    conditionjson.brand = { "$in": req.body.brand.split(',') };
                  
                  
                  if(req.body.productIds)
                     conditionjson.id = { "$in": req.body.productIds }
                  traceLog(conditionjson);
                  
                  dbConn.findDocumentsByJoin( 'products', aggregateJson, conditionjson ,(function(response){
                  if(response.length > 0) {
                      res.send(response);
                  } else
                     res.send([]);
                  })); 
              })
              
              app.post('/getProductsByBrandAndCategory', function (req, res) {
                  log(req.body);
                  var conditionjson = {};
                  if(req.body.category)
                    conditionjson.category = req.body.category;
                  
                  if(req.body.brand)
                    conditionjson.brand = req.body.brand;

                  var projectJson = { id: 1, title: 1 };

                  dbConn.findDocumentsByProject( conditionjson , projectJson, 'products', (function(response){
                  if(response.length > 0) {
                      res.send(response);
                  } else
                     res.send([]);
                  })); 
              })
              
              app.post('/saveProduct', function (req, res) {
                  log(req.body.product);
                  var reqJson ={};
                 
                  res.send([]);
                  reqJson = JSON.parse(req.body.product);
                  if(reqJson.brand) {
                    var projectJson = { id: 1 };
                    var conditionjson = {};
                    conditionjson.tittle = reqJson.brand.trim();
                    dbConn.findDocumentsByProject( conditionjson , projectJson, 'brands', function(response){
                        var brandId;
                        if(response.length > 0)
                            brandId = response[0].id;
                        else {
                              brandId = uuid();
                              insertDoc({id: brandId, tittle: reqJson.brand.trim()},'brands')
                        }
                        reqJson.brand = brandId;
                        conditionjson = {};
                        projectJson = {id: 1, title:1 };
                        var productId;
                        if(reqJson.ean || reqJson.masterid) {
                          if(reqJson.ean)
                              conditionjson.ean = reqJson.ean;
                          else
                              conditionjson.masterid = reqJson.masterid;
                          dbConn.findDocumentsByProject( conditionjson , projectJson, 'products', function(productresp) {
                          traceLog(productresp);
                          
                            if(productresp.length > 0) {
                                  productId = uuid();
                                  reqJson.id= productId;
                                  reqJson.masterid= productresp[0].id;
                                  insertDoc(reqJson,'organization-products');
                            } else {
                                  productId = uuid();
                                  reqJson.id= productId;
                                  reqJson.masterid = productId;
                                  insertDoc(reqJson,'products')
                                  insertDoc(reqJson,'organization-products');
                            }
                                
                        });
                        } else {
                                  productId = uuid();
                                  reqJson.id= productId;
                                  reqJson.masterid = productId;
                                  insertDoc(reqJson,'products')
                                  insertDoc(reqJson,'organization-products')
                        }
                        
                        
                        
                        
                    }); 
                  }

            
              })
              
          function insertDoc(brandJson, collection){
             dbConn.insertDocuments([brandJson],collection,function(response) {
                 traceLog(response);
             });
          }
          
          
          app.post('/syncUser', function (req, res) {
                  log(req.body);
                  var reqJson = req.body;
                  var conditionjson = {"useremail" : reqJson.useremail };
                  dbConn.findDocuments(conditionjson,'users',(function(response){
                  if(response.length > 0) {
                      res.send(response[0]);
                  } else {
                      dbConn.insertDocuments([reqJson],'users',function(respons){
                        dbConn.findDocuments(conditionjson,'users',(function(response){
                            if(response.length > 0) {
                                res.send(response[0]);
                            }
                        }))
                      });
                  }
                     
                  })); 
              })
              
              
        app.post('/followOrg', function (req, res) {
          log(req.body);
          var conditionjson = { "orgid" :req.body.orgid};
          var follower =  req.body.follower;
          if(req.body.follow == 'true') {
                
                dbConn.updatePushDocument(conditionjson, {"followers": follower },'organization', (function(response){
               //  if(response.length > 0) {
                    res.send(response);
              //  }
               })); 
          } else {
                var  nFollowers=[];
                var followers =[];
                dbConn.findDocuments(conditionjson,'organization',(function(response) {
                  if(response.length > 0) {
                      followers = response[0].followers;
                      traceLog('followers '+followers);
                      for(var i=0; i<followers.length; i++){
                        if(followers.length > 0) {
                          if(follower != followers[i]) {
                          nFollowers.push(followers[i])
                        }
                        
                        if(i== (followers.length-1)){
                            dbConn.updateDocument(conditionjson,{'followers' : nFollowers},'organization',(function(respons){
                               //  if(response.length > 0) {
                                    res.send(respons);
                              //  }
                            })); 
                        }
                        }
                        
                        
                      }
                      
                  } 
                }));
          }
         
           
        })
        
        app.get('/org/:orgid', function (req, res) {
        var conditionJson = {"orgid": req.params.orgid };
        var aggregateJson ={};
        aggregateJson.from = 'organization-products';
        aggregateJson.localField = 'orgid';
        aggregateJson.foreignField = 'orgid';
        aggregateJson.as = 'products';
        dbConn.findDocumentsByJoin( 'organization', aggregateJson, conditionJson ,function(resp){
            traceLog(resp)
            if(resp.length > 0) {
                  res.send(resp[0]);
            } else {
                  res.send({});
            }
        });
        })
        
        
        app.post('/addToCart', function (req, res) {
              var conditionjson ={ "useremail": req.body.useremail };
              if(req.body.cart) {
                var product = JSON.parse(req.body.cart);
                log(product);
                dbConn.findDocuments(conditionjson,'users',function(response){
                if(response.length > 0) {
                  traceLog(response[0]);
                  var user = response[0];
                  var cart;
                  if(user.cart)
                    cart = user.cart;
                  else
                    cart =[];
                    
                  var contains = false, position;
                  for(var i=0; i<cart.length; i++) {
                    if(product.id == cart[i].id){
                      contains = true;
                      position = i;
                    }
                  }
                  if(contains)
                    cart.splice(position, 1);
                  
                  if(product.quanity != 0)
                    cart.push(product);
                  
                  var setJson = { "cart" : cart };
                  traceLog(setJson);
                  dbConn.updateDocument(conditionjson,setJson,'users',(function(respons){
                          res.send(respons);
                  }));
                    
                  }
                }); 
              } else {
                var wishlist = req.body.wishlist;
                var setJson ={wishlist : wishlist};
                traceLog(setJson);
                dbConn.updateDocument(conditionjson,setJson,'users',(function(respons){
                          res.send(respons);
                  }));
              }
        })
        
        //
        
        app.post('/getProductsFromCart', function (req, res) {
              var useremail = req.body.useremail;
              var products = req.body.products;
              var prodIdArry = products.split(',') ;
              traceLog(prodIdArry);
              var aggregateJson ={};
              aggregateJson.from = 'organization-products';
              aggregateJson.localField = 'cart.id';
              aggregateJson.foreignField = 'id';
              aggregateJson.as = 'products';
              var conditionjson = {"useremail" : useremail};
              dbConn.findDocumentsByJoin( 'users', aggregateJson, conditionjson ,function(resp){
              traceLog(resp)
                  if(resp.length > 0) {
                        res.send(resp[0]);
                  } else {
                        res.send([]);
                  }
              });
              /*var conditionjson = { "id": { "$in": prodIdArry} };
              
              
              dbConn.findDocuments(conditionjson,'organization-products',function(response){
              if(response.length > 0){
                  res.send(response);
              }
              }); */
        })
        
        
        app.get('/products', function (req, res) {
                 var url_parts = url.parse(req.url, true);
                  var query = url_parts.query;
                  log(query);
                  var aggregateJson ={};
                  aggregateJson.from = 'organization-products';
                  aggregateJson.localField = 'masterid';
                  aggregateJson.foreignField = 'masterid';
                  aggregateJson.as = 'productDetails';
                  var conditionjson = { };
                  if(query.category) 
                    conditionjson.category = req.body.category;
                  
                  if(query.subcategory)
                    conditionjson.subcategory= req.body.subcategory;
                    
                  if(query.brand)
                    conditionjson.brand= req.body.brand;
                  
                  
                  if(query.products)
                     conditionjson.id = { "$in": query.products.split(',') }
                  traceLog(conditionjson);
                  
                  dbConn.findDocumentsByJoin( 'organization-products', aggregateJson, conditionjson ,(function(response){
                    traceLog(response);
                  if(response.length > 0) {
                      res.send(response);
                  } else
                     res.send([]);
                  })); 
              })
        
        app.get('/banners', function (req, res) {
              var url_parts = url.parse(req.url, true);
              var query = url_parts.query;
              //console.log(query); 
              
              var conditionjson = {  };
              if(query.maxlattitude) {
                 var param = {}
                 param.maxlattitude= parseFloat(query.maxlattitude);
                 param.minlattitude= parseFloat(query.minlattitude);
                 param.maxlongitude= parseFloat(query.maxlongitude);
                 param.minlongitude= parseFloat(query.minlongitude);
                 conditionjson = {
                    $or : [
                        {"lat":{$lt:param.maxlattitude, $gt:param.minlattitude },"lon":{$lt:param.maxlongitude, $gt:param.minlongitude} },
                        {  "isBanner": false}
                      ]
                 }
                 
                 log(conditionjson);
               //  conditionjson = {"lat":{$lt:param.maxlattitude, $gt:param.minlattitude },"lon":{$lt:param.maxlongitude, $gt:param.minlongitude} };
              }
              dbConn.findDocuments(conditionjson,'banners',function(response){
                if(response.length > 0){
                    res.send(response);
                } else
                    res.send([]);
              });
          })
          
        app.post('/saveAddress', function (req, res) {
            var useremail = req.body.useremail;
            var address = JSON.parse(req.body.address);
            //console.log(address);
            var conditionjson = { useremail : useremail };
            
            if(req.body.delete){
              dbConn.findDocuments(conditionjson,'users',function(response){
                 var user = response[0];
                 var newAddress=[];
                 var addressArr = user.address;
                  for(var i=0 ; i < addressArr.length; i++) {
                    if(address.id != addressArr[i].id) {
                      newAddress[i] = addressArr[i];
                    }
                    
                    if(i==(addressArr.length-1)) {
                      var setJson = {address : newAddress };
                          traceLog(setJson);
                          dbConn.updateDocument(conditionjson,setJson,'users',(function(respo){
                            //res.send(respo);
                            
                          }));
                    }
                  }
                   res.send("Sucesss");
              });
             
            } else {
                 dbConn.findDocuments(conditionjson,'users',function(response){
                  if(response.length > 0){
                  var matches = false;
                  var position;
                  var user = response[0];
                  var addressArr = user.address;
                  if(addressArr && addressArr.length > 0) {
                      for(var i=0 ; i< addressArr.length; i++) {
                        if(address.id == addressArr[i].id) {
                          matches = true;
                          position= i;
                        }
                        
                        if(address.isdefault)
                          addressArr[i].isdefault = false;
                        
                        
                        if(i==(addressArr.length-1)) {
                          
                          if(matches == true)
                            addressArr[position] = address;
                          else 
                            addressArr[addressArr.length] = address;
                          
                          var setJson = {address : addressArr };
                          traceLog(setJson);
                          dbConn.updateDocument(conditionjson,setJson,'users',(function(respo){
                            //res.send(respo);
                          }));
                        }
                      }
                  } else {
                     var setJson = {address : [address] };
                      dbConn.updateDocument(conditionjson,setJson,'users',(function(respons){
                        //res.send(respons);
                      }));
                       traceLog(setJson);
                  }
               }
              res.send("Sucesss");
            });
             
            }
             
           
        })
        
        app.post('/saveOrder2', function (req, res) {
            var orders = [];
            var date = new Date();
            var order = JSON.parse(req.body.order);
             
            var useremail = order.useremail;
            var products = order.products;
            //  delete order['products'];
            var momtz = moment(date);
            for(var j=0; j< products.length; j++) {
               var product = products[j];
                var shiipp= {
                  "mMessage": "Order placed successfully",
                  "mDate": momtz.tz('Asia/Kolkata').format('dddd, MMMM Do YYYY, h:mm a'),
                  "timestamp": date
                }
                shiipp.id = products[j].id;
                var orderItem = order;
                //orderItem.products =[];
                orderItem.shippings =[];
                orderItem.shippings.push(shiipp);
               // orderItem.id= uuid();
                orderItem.ordertime = date;
              //  orderItem.products.push(product);
                orders[j] = orderItem;
                //console.log(orderItem.id);
                traceLog(orderItem);
                if(j == products.length-1) {
                  
                //  orders.forEach((item) => {
                    
                    dbConn.insertDocuments([orderItem],'orders',(function(response) {
                     // var setJson = {"cart"  : []};
                     // dbConn.updateDocument(conditionjson,setJson,'users',(function(respons){
                        res.send("OK")
                     // }));
                    notifyFollowers(orderItem.id,"Order placed successfully", product.title+" order has been placed successfully", 'order' , orderItem.orderNo+'#'+product.id);
                  })); 
                //  sleep(5000);
                //  
                //  });
                  
                  
             //     traceLog('************************************');
                 
                //  console.log(orders);
                }
            }
           
            
        })
        
        app.post('/saveOrder', function (req, res) {
            var orders = [];
            var date = new Date();
            var order = JSON.parse(req.body.order);
            Object.keys(order).forEach(function(key) {
                  var suborder = JSON.parse(JSON.stringify(order[key])); 
                  suborder.orgid = key;
                  var momtz = moment(date);
                  var shiipp= {
                    "mMessage": "Order placed successfully",
                    "mDate": momtz.tz('Asia/Kolkata').format('dddd, MMMM Do YYYY, h:mm a'),
                    "timestamp": date
                  };
                  suborder.shippings =[];
                  suborder.shippings.push(shiipp);
                  suborder.ordertime = date;
                  dbConn.insertDocuments([suborder],'orders',(function(response) {
                      notifyFollowers(suborder.id,"Order placed successfully", " Order has been placed successfully", 'order' , suborder.id);
                     
                  })); 
              })
               res.send("OK");
        });
        
        app.get('/orders', function (req, res) {
           var url_parts = url.parse(req.url, true);
           var query = url_parts.query;
            var conditionjson = {};
            if(query.orgid)
                conditionjson.orgid = query.orgid;
            if(query.userid)
                 conditionjson.userid = query.userid;
            if(query.useremail)
                 conditionjson.useremail = query.useremail;
            if(query.status)
                conditionjson.status =  { "$in": query.status.split(',')};
            if(query.id)
                conditionjson.id = query.id;
            console.log(conditionjson);
            var aggregateJson ={};
            aggregateJson.from = 'organization';
            aggregateJson.localField = 'orgid';
            aggregateJson.foreignField = 'orgid';
            aggregateJson.as = 'orgDetails';
            dbConn.findDocumentsByJoin( 'orders', aggregateJson, conditionjson ,function(response){
           // dbConn.findDocuments(conditionjson,'orders',function(response){
              if(response.length > 0) {
                 var resp = arraySort(response, 'ordertime', {reverse: true});
                 res.send(resp);
              } else
                 res.send([]);
            }
            );
            
        })
        
        
         app.post('/notifyFollowers', function (req, res) {
            notifyFollowers(req.body.orgid, req.body.subject, req.body.content,'ALL','')
            res.send('OK');
        })
        
        function notifyFollowers(topic, subject, content, link, linkids) {
          var msg = {
            notification : { title : subject,  body: content },
            topic : topic
          };
          fcm.sendPushNotification(msg);
          insertNotification(msg, topic, link, linkids);
        }
        
        function insertNotification(notification, topic, link, linkids) {
          var msg = notification;
          var date =  new Date();
          var topicA =[];
          topicA[0] = topic;
          var momtz = moment(date);
          var dateT = momtz.tz('Asia/Kolkata').format('dddd, MMMM Do YYYY, h:mm a');
          //msg.notification = notification;
          msg.notifiedtime = date;
          msg.gnotifiedtime = dateT;
          msg.id = uuid();
          msg.topic = topicA;
          msg.link = link;
          msg.linkId=[linkids];
          dbConn.insertDocuments([msg],'notifications',(function(response){
            log('inserted');
            
          }));
        }
        
         app.get('/getDistance', function (req, res) {
              var url_parts = url.parse(req.url, true);
              var query = url_parts.query;
              traceLog(query);
              if(query.orgId != null ) {
                var conditionjson = {};
                conditionjson.orgid = query.orgId;
               dbConn.findDocuments(conditionjson,'organization',(function(response){
                    if(response.length > 0) {
                        var org = response[0];
                         traceLog(org);
                         distance.get(
                          {
                            index: 1,
                            origin: org.orgLat+','+org.orgLon ,
                            destination: query.lat2+','+query.lon2
                          },
                          function(err, data) {
                            if (err) return console.log(err);
                            log(data);
                            res.send(data);
                          });
                    }
                }))
              } else {
                    distance.get(
                    {
                      index: 1,
                      origin: query.lat1+','+query.lon1 ,
                      destination: query.lat2+','+query.lon2
                    },
                    function(err, data) {
                      if (err) return console.log(err);
                      log(data);
                      res.send(data);
                    });
              }
              
                    
              
          })
        
        
         app.get('/order/:id', function (req, res) {
              log(req.params);
              
              var aggregateJson ={};
              aggregateJson.from = 'organization';
              aggregateJson.localField = 'orgid';
              aggregateJson.foreignField = 'orgid';
              aggregateJson.as = 'orgDetails';
              var qry ={id:req.params.id}
              dbConn.findDocumentsByJoin( 'orders', aggregateJson, qry ,function(response){
           //    dbConn.findDocuments(qry,'orders',function(response){
              if(response.length > 0) {
                 res.send(response[0]);
              } else
                 res.send({});
            }
            );
            
          })
          
          app.get('/notifications', function (req, res) {
              var topic = req.params.topic;
              var conditionJson ={};
               dbConn.findDocuments(conditionJson,'notifications',function(response){
              if(response.length > 0) {
                 res.send(response);
              } else
                 res.send({});
            }
            );
            
          })
          
          
           app.post('/product/:id/update', function (req, res) {
              var productId = req.params.id;
              var product = JSON.parse(req.body.product);
              var conditionjson = {"id" : productId};
              var setJson = product;
              log(conditionjson);
              delete setJson['id'];
              delete setJson['rating'];
              delete setJson['reviews'];
              dbConn.updateDocument(conditionjson,setJson,'organization-products',(function(respons){
                   dbConn.updateDocument({"id":productId},{
                      "brand": product.brand,
                      "category" : product.category,
                      "subcategory" : product.subcategory
                   },'products',(function(prespons){}));

                 res.send('OK');
              }));
          })
          
          app.post('/payment/:orderNo/:suborder/update', function (req, res) {
              var orderNo = req.params.orderNo;
              var suborder = req.params.suborder;
              var setJson = req.body;
              dbConn.updateDocument({orderNo: orderNo, id : suborder},setJson,'orders',function(respo){
                         notifyFollowers(req.params.suborder, 'Your order update', setJson.message,'order', orderNo+'#'+suborder);
                         res.send('OK');
              });
            
          });
          
           app.post('/order/:id/update', function (req, res) {
              var orderid = req.params.id;
              console.log(req.body);
              var shippings;
              var setJson={};
              dbConn.findDocuments({id: orderid},'orders',function(response){
                if(response.length > 0) {
                   var order = response[0];
                   var status = order.status;
                   if(order.shippings) {
                     shippings = order.shippings;
                   } else{
                     shippings=[];
                   }
                   var shipp = {};
                   var d = new Date();
                   var momtz = moment(d);
                   var date = momtz.tz('Asia/Kolkata').format('dddd, MMMM Do YYYY, h:mm a');
                   if(req.body.status == 'A' )
                   {
                     shipp.mMessage= 'Order confirmed by seller';
                     shipp.mDate = date;
                     shipp.timestamp = d;
                     shippings.push(shipp);
                     status ='A';
                   } else if(req.body.status =='R')
                   {
                     shipp.mMessage= 'Order rejected by seller';
                     shipp.mDate = date;
                     shipp.timestamp = d;
                     shippings.push(shipp);
                     status ='R';
                   } else if(req.body.status =='Y') {
                     shipp.mMessage= 'Packed, Yet to dispatch';
                     shipp.mDate = date;
                     shipp.timestamp = d;
                     shippings.push(shipp);
                     status = req.body.status;
                   } else if(req.body.status =='D') {
                     shipp.mMessage= 'Delivered';
                     shipp.mDate = date;
                     shipp.timestamp = d;
                     shippings.push(shipp);
                     status =  req.body.status;
                   } else if(req.body.status =='DI') {
                     shipp.mMessage= 'Dispatched, Delivery by '+(req.body.isGeoubuyDelivery == 'true' ? 'Geobuy':'Store');
                     shipp.mDate = date;
                     shipp.timestamp = d;
                     setJson.isGeoubuyDelivery =  (req.body.isGeoubuyDelivery == 'true');
                     shippings.push(shipp);
                     status =  req.body.status;
                   } else if(req.body.status =='RP') {
                     shipp.mMessage= 'Ready for pickup';
                     shipp.mDate = date;
                     shipp.timestamp = d;
                     shippings.push(shipp);
                     status =  req.body.status;
                   }
                   setJson = {'shippings' : shippings};
                   setJson.status = status;
                   dbConn.updateDocument({id: orderid},setJson,'orders',function(respo){
                         notifyFollowers(orderid, 'Your order update', shipp.mMessage,'order', order.orderNo+'#'+order.id);
                         res.send('OK');
                  });
                } 
              }
             );
             
            
            
            
          })
          
          
          app.get('/queries', function(req, res) {
            res.send(queries);   
          });
          
          app.post('/query', function(req, res) {
            var date = new Date();
            var momtz = moment(date);
            var tm = momtz.tz('Asia/Kolkata').format('dddd, MMMM Do YYYY, h:mm a');
            var query = req.body;
            query.status ='1';
            query.raisedTime = date;
            query.graisedTime = tm;
            query.id =uuid();
            log(query);
            insertDoc(query, 'customer-service-requests');
            res.send('OK');   
          });
          
          function traceLog(msg) {
              console.log(msg);
          }
          
          function log(msg) {
              console.log(msg);
          }
          
          app.post('/testAddProduct', function (req, res) {
            log(req.body);
            res.send('ok');
          });
          
          
