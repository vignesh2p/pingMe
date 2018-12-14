

const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');
const dbconfig = require('./dbconfig');
//var mongoose = require('mongoose');
 
// Connection URL
const url = dbconfig.url;
//mongoose.connect(url);
// Database Name
const dbName = dbconfig.name;
var Mclient;

function connectDB(callback){
	
	MongoClient.connect(url, function(err, client) {
		//assert.equal(null, err);
		console.log("Connected successfully to DB");
		Mclient = client;
		callback(err, client);
	});
	
}



function insertDocuments(insertjsonarry,documents, callback) {
//	MongoClient.connect(url, function(err, client) {
//		assert.equal(null, err);
	//	console.log("Connected successfully to server");
	   
			const db = Mclient.db(dbName);	  
		// Get the documents collection
		const collection = db.collection(documents);
		// Insert some documents
	//	collection.dropIndex('$_id');
		collection.insertMany(insertjsonarry, function(err, result) {
		if(err){console.log(err)};
		//console.log("Inserted 3 documents into the collection");
//		client.close();		
		callback(result);
		});
//		client.close();		
//	});
  }


function findDocuments(conditionjson,documents, callback) {
		
		// Use connect method to connect to the server
	//	MongoClient.connect(url, function(err, client) {
	//	assert.equal(null, err);
	//	console.log("Connected successfully to server");
		
		const db = Mclient.db(dbName);
		//  Get the documents collection
		const collection = db.collection(documents);
			
		// Find some documents
		collection.find(conditionjson).sort({gpriority:-1}).toArray(function(err, docs) {
			assert.equal(err, null);
			//console.log("Found the following records");
			//console.log(docs)
			callback(docs);
		});
//		client.close();
	//	});
    
  }
  
  
function findDistinctDocuments(distinctCol, conditionjson,documents, callback) {
		
		// Use connect method to connect to the server
	//	MongoClient.connect(url, function(err, client) {
//		assert.equal(null, err);
	//	console.log("Connected successfully to server");
		
		const db = Mclient.db(dbName);
		//  Get the documents collection
		const collection = db.collection(documents);
			
		// Find some documents
		collection.distinct(distinctCol, conditionjson, function(err, docs) {
			assert.equal(err, null);
			callback(docs);
		});
	//	client.close();
		//});
    
  }
  
  
  
function findDocumentsAndSort(conditionjson,documents, sortJson, callback) {
		
		// Use connect method to connect to the server
	//	MongoClient.connect(url, function(err, client) {
	//	assert.equal(null, err);
	//	console.log("Connected successfully to server");
		
		const db = Mclient.db(dbName);
		//  Get the documents collection
		const collection = db.collection(documents);
			
		// Find some documents
		collection.find(conditionjson).sort(sortJson).toArray(function(err, docs) {
			assert.equal(err, null);
			//console.log("Found the following records");
			//console.log(docs)
			callback(docs);
		});
	//	client.close();
	//	});
    
  }


function findDocumentsByProject(conditionjson, projectJson, documents, callback) {
		
		// Use connect method to connect to the server
	//	MongoClient.connect(url, function(err, client) {
	//	assert.equal(null, err);
	//	console.log("Connected successfully to server");
		
		const db = Mclient.db(dbName);
		//  Get the documents collection
		const collection = db.collection(documents);
			
		// Find some documents
		collection.find(conditionjson).sort({gpriority:-1}).project(projectJson).toArray(function(err, docs) {
			assert.equal(err, null);
			callback(docs);
		});

	//	client.close();
	//	});
    
  }

  

function findDocumentsByJoin(document, aggregateJson, conditionjson, callback) {
		
	// Use connect method to connect to the server
//	MongoClient.connect(url, function(err, client) {
//	assert.equal(null, err);
//	console.log("Connected successfully to server");
	const db = Mclient.db(dbName);
	const collection = db.collection(document);
	collection.aggregate([
	  { $lookup:
		 {
		   from: aggregateJson.from,
		   localField: aggregateJson.localField,
		   foreignField: aggregateJson.foreignField,
		   as: aggregateJson.as
		 }
	   },
	   {
		  $match: conditionjson
	   }
	  ]).sort({gpriority:-1}).toArray(function(err, res) {
	  if (err) { 
	  	console.log(err);
	  	throw err;}
	  callback(res);
	});
//	client.close();
//	});

}

  
  function updateDocument(docidJson,setJson,documents, callback) {
		// Use connect method to connect to the server
//	MongoClient.connect(url, function(err, client) {
	//	assert.equal(null, err);
	//	console.log("Connected successfully to server");
	
		const db = Mclient.db(dbName);
	
		// Get the documents collection
		const collection = db.collection(documents);
		// Update document where a is 2, set b equal to 1
		collection.updateMany(docidJson, {$set: setJson }, function(err, res) {
			if (err) throw err;
			console.log(res.result.nModified + " document(s) updated");
			callback(res.result);
			//client.close();
		});  
  //});
}

function updatePushDocument(queryJson,pushJson,documents, callback) {
	// Use connect method to connect to the server
//MongoClient.connect(url, function(err, client) {
//	assert.equal(null, err);
//	console.log("Connected successfully to server");

	const db = Mclient.db(dbName);

	// Get the documents collection
	const collection = db.collection(documents);
	// Update document where a is 2, set b equal to 1
	collection.update(queryJson, {$push: pushJson }, function(err, res) {
		if (err) throw err;
		console.log(res.result.nModified + " document(s) updated");
		callback(res.result);
	//	client.close();
	});  
//});
}


function findDocumentsByJoin(document, aggregateJson, conditionjson, callback) {
		
	// Use connect method to connect to the server
//	MongoClient.connect(url, function(err, client) {
	//assert.equal(null, err);
//	console.log("Connected successfully to server");
	const db = Mclient.db(dbName);
	const collection = db.collection(document);
	collection.aggregate([
	  { $lookup:
		 {
		   from: aggregateJson.from,
		   localField: aggregateJson.localField,
		   foreignField: aggregateJson.foreignField,
		   as: aggregateJson.as
		 }
	   },
	   {
	      $match: conditionjson
	   }
	  ]).toArray(function(err, res) {
	  if (err) throw err;
	  callback(res);
	});
//	client.close();
//	});

}

function findDocumentsByJoinAndUnwind(document, aggregateJson, conditionjson, unwindJson, projectJson, callback) {
		
	// Use connect method to connect to the server
//	MongoClient.connect(url, function(err, client) {
	//assert.equal(null, err);
//	console.log("Connected successfully to server");
	const db = Mclient.db(dbName);
	const collection = db.collection(document);
	if(projectJson){
		collection.aggregate([
		  { $lookup:
			 {
			   from: aggregateJson.from,
			   localField: aggregateJson.localField,
			   foreignField: aggregateJson.foreignField,
			   as: aggregateJson.as
			 }
		   },
		   {
		      $unwind: unwindJson
			},
		   { $project: projectJson },
		   {
		      $match: conditionjson
		   }
		  ]).toArray(function(err, res) {
			  if (err) throw err;
			  callback(res);
			});
		
	} else {
		collection.aggregate([
		  { $lookup:
			 {
			   from: aggregateJson.from,
			   localField: aggregateJson.localField,
			   foreignField: aggregateJson.foreignField,
			   as: aggregateJson.as
			 }
		   },
		   {
		      $unwind: unwindJson
			},
		   {
		      $match: conditionjson
		   }
		  ]).toArray(function(err, res) {
			  if (err) throw err;
			  callback(res);
			});
		
	}
	
	
//	client.close();
//	});

}

  module.exports={
  	connectDB : connectDB,
	insertDocuments : insertDocuments,
	updateDocument : updateDocument,
	findDocuments : findDocuments, 
	findDocumentsByJoin : findDocumentsByJoin,
	updatePushDocument : updatePushDocument,
	findDocumentsByProject : findDocumentsByProject,
	findDocumentsAndSort : findDocumentsAndSort,
	findDistinctDocuments : findDistinctDocuments,
	findDocumentsByJoinAndUnwind : findDocumentsByJoinAndUnwind
}
