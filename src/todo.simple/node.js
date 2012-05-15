var express = require('express')
    , fs = require('fs');

// ---

var app
    , public = __dirname + '/public';

// ---

app = express.createServer();

// ---

app.configure(function() {
    app.use(express.static(public));
    app.use(app.router);
    app.listen(3000);
});

// ---

app.get('/', function(req, res) {

    fs.readFile(public + '/index.html', 'utf8', function(err, html){
        res.send(html);
    });

});




