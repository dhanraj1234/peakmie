var cron = require('node-cron');
var fetch = require('node-fetch');

var job = cron.schedule('* * * * *', async() => {
  console.log('Function executed!');
  var url = 'http://localhost:1416/users/postTimeExpired';
  
  fetch(url, {
    method: "POST",
    body: '',
    headers: {
      "Content-Type": "application/json"
    },
  }).then(function() {
  }, function() {
  });
  
}, null, true);

job.start();