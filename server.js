const express = require('express')
const app = express()
const fileUpload = require('express-fileupload');
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
var routes = require('./imagefile');
var stringSimilarity = require('string-similarity');
var url = require('url');
var distance = require('google-distance');

app.use('/', routes);

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

 
app.use('/image', routes);
 
//URL : http://localhost:3000/images/
// To get all the images/files stored in MongoDB
app.get('/images', function(req, res) {
//calling the function from index.js class using routes object..
routes.getImages(function(err, genres) {
if (err) {
throw err;
 
}
res.json(genres);
 
});
});
 
// URL : http://localhost:3000/images/(give you collectionID)
// To get the single image/File using id from the MongoDB
app.get('/images/:id', function(req, res) {
 
//calling the function from index.js class using routes object..
routes.getImageById(req.params.id, function(err, genres) {
if (err) {
throw err;
}
//res.download(genres.path);
res.send(genres.path)
});
});

  var server = app.listen(8080, function () {
  var host = server.address().address
  var port = server.address().port
  console.log("Example app listening at http:"+host+":"+port)
 })

  app.post('/login', function(req, res) {
    console.log([req.body]);
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
    console.log('**************Welcome****************'); 
    res.send('success');   
    });

  app.post('/verifyUser', function(req, res) {
      console.log(req.body);
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
          conditionjson.msg="Organization email already registered";
          res.send(conditionjson); 
        } else {
            var orgJson = req.body;
            orgJson.orgLat= parseFloat(req.body.orgLat);
            orgJson.orgLon= parseFloat(req.body.orgLon);
            dbConn.insertDocuments([orgJson],'organization',(function(response){
            console.log(response);
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
               console.log(req.body);
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
   
    app.post('/updateorg',function(req,res){
     console.log([req.body]);
      var setjson = req.body;
      setjson.orgLat = parseFloat(setjson.orgLat);
      setjson.orgLon = parseFloat(setjson.orgLon);
      dbConn.updateDocument({"orgid" : req.body.orgid},setjson,'organization',(function(response){
        console.log([response]);
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
      console.log(req.body);
      mailService.sendmail(options);
      var conditionjson = {}
      conditionjson.code="200 Ok";
      conditionjson.msg="Mail Triggered sucessfully";
      res.send(conditionjson);   
      });
    
      app.post('/products', function (req, res) {
        console.log(req.body);
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
                       console.log(resp)
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
        console.log(req.body);
        dbConn.findDocuments({"orgid":req.body.orgid},'products',(function(response){
          console.log('response.length--------'+response.length);
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
        console.log(req.body);
        var param = {}
        param.maxlattitude= parseFloat(req.body.maxlattitude);
        param.minlattitude= parseFloat(req.body.minlattitude);
        param.maxlongitude= parseFloat(req.body.maxlongitude);
        param.minlongitude= parseFloat(req.body.minlongitude);
        console.log(param);
        var conditionJson = {"orgLat":{$lt:param.maxlattitude, $gt:param.minlattitude },"orgLon":{$lt:param.maxlongitude, $gt:param.minlongitude} };
        var aggregateJson ={};
        aggregateJson.from = 'organization-products';
        aggregateJson.localField = 'orgid';
        aggregateJson.foreignField = 'orgid';
        aggregateJson.as = 'products';
        dbConn.findDocumentsByJoin( 'organization', aggregateJson, conditionJson ,function(resp){
                       console.log(resp)
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
       console.log(queryJson);
       dbConn.findDocuments(queryJson,'category',(function(response){
        console.log('response.length--------'+response.length);
          if(response.length > 0){
            session.status == true;
            var conditionjson = {}    
              conditionjson.code = "200 OK";
              conditionjson.msg = "Verified";
              conditionjson.data = response;
              res.send(conditionjson);
          }
        }));  
       
       })
       
       
       app.get('/brands', function (req, res) {
       dbConn.findDocuments({},'brands',(function(response){
        console.log('response.length--------'+response.length);
          if(response.length > 0){
              res.send(response);
          } else {
            res.send([]);
          }
        }));  
       
       })

       app.get('/categorymaster', function (req, res) {
        dbConn.findDocuments({},'category-master',(function(response){
         console.log('response.length--------'+response.length);
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
                       console.log(resp)
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
            conditionjson.searchkey= {$regex:searchKey,$options:"$i"}
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
                     console.log(orIds);
                    
                    conditionjson.productDetails = { $elemMatch: { orgid: { "$in": orIds } } };
                    dbConn.findDocumentsByJoin( 'products', aggregateJson, conditionjson ,function(resp){
                       console.log(resp)
                    if(resp.length > 0) {
                        res.send(resp);
                    }else{
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
              
              console.log(conditionjson);
              dbConn.findDocumentsByJoin( 'products', aggregateJson, conditionjson ,function(resp){
                       console.log(resp)
                    if(resp.length > 0) {
                        res.send(resp);
                    } else {
                      res.send([]);
                    }
                    
                    });
            }
           
            })

            app.post('/orgsSearch', function (req, res) {

              console.log('searchKey :: '+searchKey);
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
              console.log(param);
              dbConn.findDocuments(conditionjson,'organization',(function(response){
                if(response.length > 0) {
                  res.send(response);
                } else
                  res.send([]);
                })); 
            })
              
             // findDocumentsByJoin('organization-products', aggregateJson, conditionjson, function(res){console.log(res);});

               app.post('/productDetails', function (req, res) {
                  console.log(req.body);
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
                
                console.log(req.body);

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
                  
                  console.log(req.body);
                  dbConn.findDocuments(conditionjson,table,(function(response){
                  var ratings;
                 // console.log(response);
                    if(response.length > 0) {
                      if(response[0].rating){
                        ratings = (response[0].rating + reviewJson.ratings)/2;
                      } else {
                         ratings = reviewJson.ratings
                      }
                      var setjson = {"rating": ratings}
                      console.log(setjson);
                      console.log(conditionjson);
                       dbConn.updateDocument(conditionjson,setjson,table,(function(response){
                          console.log(response);
                          
                      }));
                      
                      
                    }
                })); 
                res.send(response);

                })); 
            })
            
            
              app.post('/getProductsByCategory', function (req, res) {
                  console.log(req.body);
                  var aggregateJson ={};
                  aggregateJson.from = 'organization-products';
                  aggregateJson.localField = 'id';
                  aggregateJson.foreignField = 'masterid';
                  aggregateJson.as = 'productDetails';
                  var conditionjson = { };
                  if(req.body.category) {
                    conditionjson.category = req.body.category;
                  }
                  if(req.body.productIds){
                     conditionjson.id = { "$in": req.body.productIds }
                  }
                  dbConn.findDocumentsByJoin( 'products', aggregateJson, conditionjson ,(function(response){
                  if(response.length > 0) {
                      res.send(response);
                  } else
                     res.send([]);
                  })); 
              })
              
              app.post('/getProductsByBrandAndCategory', function (req, res) {
                  console.log(req.body);
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
                  console.log(req.body.product);
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
                        if(reqJson.ean) {
                          conditionjson.ean = reqJson.ean;
                          dbConn.findDocumentsByProject( conditionjson , projectJson, 'products', function(productresp) {
                          console.log(productresp);
                          
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
                 console.log(response);
             });
          }
          
          
          app.post('/syncUser', function (req, res) {
                  console.log(req.body);
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
          console.log(req.body);
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
                      console.log('followers '+followers);
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
        
        app.post('/orgDetails', function (req, res) {
        var conditionJson = {"orgid": req.body.orgid };
        var aggregateJson ={};
        aggregateJson.from = 'organization-products';
        aggregateJson.localField = 'orgid';
        aggregateJson.foreignField = 'orgid';
        aggregateJson.as = 'products';
        dbConn.findDocumentsByJoin( 'organization', aggregateJson, conditionJson ,function(resp){
            console.log(resp)
            if(resp.length > 0) {
                  res.send(resp[0]);
            } else {
                  res.send({});
            }
        });
        })
        
        
        app.post('/addToCart', function (req, res) {
              var conditionjson ={ "useremail": req.body.useremail };
               
              var product = JSON.parse(req.body.cart);
              console.log(product);
              dbConn.findDocuments(conditionjson,'users',function(response){
                if(response.length > 0) {
                  console.log(response[0]);
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
                  console.log(setJson);
                  dbConn.updateDocument(conditionjson,setJson,'users',(function(respons){
                          res.send(respons);
                  }));
                    
                }
              }); 
              
              
        })
        
        //
        
        app.post('/getProductsFromCart', function (req, res) {
              var useremail = req.body.useremail;
              var products = req.body.products;
              var prodIdArry = products.split(',') ;
              console.log(prodIdArry);
              var aggregateJson ={};
              aggregateJson.from = 'organization-products';
              aggregateJson.localField = 'cart.id';
              aggregateJson.foreignField = 'id';
              aggregateJson.as = 'products';
              var conditionjson = {"useremail" : useremail};
              dbConn.findDocumentsByJoin( 'users', aggregateJson, conditionjson ,function(resp){
              console.log(resp)
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
                 
                 console.log(conditionjson);
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
                          console.log(setJson);
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
                          console.log(setJson);
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
                       console.log(setJson);
                  }
               }
              res.send("Sucesss");
            });
             
            }
             
           
        })
        
        
        app.post('/saveOrder', function (req, res) {
          
            var order = JSON.parse(req.body.order);
            var useremail = order.useremail;
            console.log(order);
            var conditionjson = { useremail : useremail };
           dbConn.insertDocuments([order],'orders',(function(response) {
              var setJson = {"cart"  : []};
              dbConn.updateDocument(conditionjson,setJson,'users',(function(respons){
                res.send("OK")
              }));
          }));  
            
        })
        
        app.post('/getOrders', function (req, res) {
            var conditionjson = {};
            if(req.body.orgid)
                conditionjson.orgid = req.body.orgid;
            if(req.body.userid)
                 conditionjson.userid = req.body.userid;
            if(req.body.useremail)
                 conditionjson.useremail = req.body.useremail;
            dbConn.findDocuments(conditionjson,'orders',function(response){
              if(response.length > 0){
                 res.send(response);
              } else
                 res.send([]);
            }
            );
            
        })
        
        
         app.post('/notifyFollowers', function (req, res) {
            notifyFollowers(req.body.orgid, req.body.subject, req.body.content)
            res.send('OK');
        })
        
        function notifyFollowers(topic, subject, content) {
          var msg = {
            notification : { title : subject,  body: content },
            topic : topic
          };
          fcm.sendPushNotification(msg);
        }
        
        
        
         app.get('/getDistance', function (req, res) {
              var url_parts = url.parse(req.url, true);
              var query = url_parts.query;
              console.log(query);
             distance.get(
                    {
                      index: 1,
                      origin: query.lat1+','+query.lon1 ,
                      destination: query.lat2+','+query.lon2
                    },
                    function(err, data) {
                      if (err) return console.log(err);
                      console.log(data);
                      res.send(data);
                    });
              
          })
        
        
         app.get('/order/:id', function (req, res) {
              console.log(req.params);
               dbConn.findDocuments(req.params,'orders',function(response){
              if(response.length > 0) {
                 res.send(response[0]);
              } else
                 res.send({});
            }
            );
            
          })