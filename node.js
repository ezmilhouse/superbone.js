var express = require('express')
    , fs = require('fs');

// ---

var app
    , public = __dirname + '/src';

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

	res.send('Superbone.js');

});

// ---

app.get('/tests', function(req, res) {

	fs.readFile(public + '/tests/index.html', 'utf8', function(err, html){
		res.send(html);
	});

});



