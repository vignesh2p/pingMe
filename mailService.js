var nodemailer = require('nodemailer');
const mailConfig = require('./mailConfig');

var transport = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: mailConfig.username,
    pass: mailConfig.password
  }
});

// sendmail(options)
function sendmail(options){
 // logger.debug("Sending mail to:::::"+options.to);
  transport.sendMail(options, function(error, response){
    if(error){
      console.log("Error occured.."+error)
    }else{
      console.log("Mail send successfully..")
    }
});
}

module.exports={sendmail:sendmail}