

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const dbconfig = require('./dbconfig');
 
// Connection URL
const url = dbconfig.url;
 
// Database Name
const dbName = dbconfig.name;

function insertDocuments(insertjsonarry,documents, callback) {
	MongoClient.connect(url, function(err, client) {
		assert.equal(null, err);
		console.log("Connected successfully to server");
	   
			const db = client.db(dbName);	  
		// Get the documents collection
		const collection = db.collection(documents);
		// Insert some documents
		collection.insertMany(insertjsonarry, function(err, result) {
		assert.equal(err, null);
		//console.log("Inserted 3 documents into the collection");
		client.close();		
		callback(result);
		});
		client.close();		
	});
  }


function findDocuments(conditionjson,documents, callback) {
		
		// Use connect method to connect to the server
		MongoClient.connect(url, function(err, client) {
		assert.equal(null, err);
		console.log("Connected successfully to server");
		
		const db = client.db(dbName);
		//  Get the documents collection
		const collection = db.collection(documents);
			
		// Find some documents
		collection.find(conditionjson).toArray(function(err, docs) {
			assert.equal(err, null);
			console.log("Found the following records");
			console.log(docs)
			callback(docs);
		});
		client.close();
		});
    
  }


  
  function updateDocument(docidJson,setJson,documents, callback) {
		// Use connect method to connect to the server
	MongoClient.connect(url, function(err, client) {
		assert.equal(null, err);
		console.log("Connected successfully to server");
	
		const db = client.db(dbName);
	
		// Get the documents collection
		const collection = db.collection(documents);
		// Update document where a is 2, set b equal to 1
		collection.updateOne(docidJson
		, { $set: setJson }, function(err, result) {
		assert.equal(err, null);
		//assert.equal(1, result.result.n);
		console.log("Updated the document");
		callback(result);
		});
		client.close();
	});  
  }
  module.exports={insertDocuments:insertDocuments,updateDocument:updateDocument,findDocuments:findDocuments}
//   // Database Name
 
// // Use connect method to connect to the server
// MongoClient.connect(url, function(err, client) {
//   assert.equal(null, err);
//   console.log("Connected correctly to server");
 
//   const db = client.db(dbName);
 
//   insertDocuments(db, function() {
//     findDocuments(db, function() {
//       client.close();
//     });
//   });
// });



// const findDocuments = function(db, callback) {
//     // Get the documents collection
//     const collection = db.collection('documents');
//     // Find some documents
//     collection.find({'a': 3}).toArray(function(err, docs) {
//       assert.equal(err, null);
//       console.log("Found the following records");
//       console.log(docs);
//       callback(docs);
//     });
//   }



//   const updateDocument = function(db, callback) {
//     // Get the documents collection
//     const collection = db.collection('documents');
//     // Update document where a is 2, set b equal to 1
//     collection.updateOne({ a : 2 }
//       , { $set: { b : 1 } }, function(err, result) {
//       assert.equal(err, null);
//       assert.equal(1, result.result.n);
//       console.log("Updated the document with the field a equal to 2");
//       callback(result);
//     });  
//   }