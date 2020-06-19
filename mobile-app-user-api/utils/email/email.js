var fs = require('fs');
// // import config from 'config';
var handlebars = require('handlebars');
var nodemailer = require('nodemailer');
var hbs = require('hbs');
var compile = require('string-template/compile');
var multer = require('multer');

var transporter = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: "raginiswarn@gmail.com",
        pass: "ragini@123",
    }
});

  // setup email data with unicode symbols
var sendHtmlMail = function(data,to,subject, templateUrl){
    return new Promise((resolve,reject) =>{
        readHTMLFile(templateUrl, function(err, html) {
            var template = handlebars.compile(html);
            var replacements = data;
            var htmlToSend = template(replacements);
            var msg = {
                from: "raginiswarn@gmail.com",
                to: to,
                subject: subject,
                html: htmlToSend,//if you want to send html file
            };
            transporter.sendMail(msg, function(error, info){
                if(error){
                    return reject("mail not sent",error);
                } else {
                    return resolve("mail has been sent");
                }
            });
        });
    });
}

function readHTMLFile(path, callback) {
    fs.readFile(path,{encoding: 'utf-8'},function (err, html) {
        if (err) {        
            callback(err);
        } else {
            
            callback(null, html);
        }
    });
};

module.exports= sendHtmlMail;