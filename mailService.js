var nodemailer = require('nodemailer');
var smtpTransport = require('nodemailer-smtp-transport');    
var transport = nodemailer.createTransport(smtpTransport({
 host: 'smarthost.enterprisenet.org',
 secureConnection: false, // use SSL
 port: 25, // port for secure SMTP 587
 tls:{rejectUnauthorized: false}//,

}));



var options  = {
  from: 'SUPPORT TEAM', // sender address
  to: 'viki19nesh@gmail.com', // comma separated list of receivers
  subject: 'test me ',// Subject line
  html: 'Hi</br></br>Please find the report as per your request</br></br>Thanks,</br>Support Team'// plaintext body
 /// attachments: [{'filename': response.spec.reportName+'.xls', 'content': data}]
  }
// sendmail(options)
// function sendmail(options){
//logger.debug("Sending mail to:::::"+options.to);
transport.sendMail(options, function(error, response){
  if(error){
console.log("Error occured.."+error)
  }else{
     console.log("Mail send successfully..")
  }
});
//}

//module.exports={sendmail:sendmail}