var admin = require("firebase-admin");

var serviceAccount = require("./privateKey.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://geobuy-7a1fa.firebaseio.com"
});
/*
// See documentation on defining a message payload.
var message = {
  "notification": {
    "title": "New Offers",
    "body": "Check out the offers in geobuy",
  },
  "topic" : "2a93b134-c7cd-4897-9576-3708fa939c5c"
};

// Send a message to the device corresponding to the provided
// registration token.
admin.messaging().send(message)
  .then((response) => {
    // Response is a message ID string.
    console.log('Successfully sent message:', response);
  })
  .catch((error) => {
    console.log('Error sending message:', error);
  });
  */
  
  function sendPushNotification(message) {
		    admin.messaging().send(message)
        .then((response) => {
          // Response is a message ID string.
          console.log('Successfully sent message:', response);
        })
        .catch((error) => {
          console.log('Error sending message:', error);
        });
    
  }
  
module.exports = {
	sendPushNotification : sendPushNotification
}
