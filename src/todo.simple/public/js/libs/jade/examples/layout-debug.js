
/**
 * Module dependencies.
 */

var jade = require('../lib/jade.js');

jade.renderFile(__dirname + '/layout.jade', { debug: true }, function(err, html){
    if (err) throw err;
    console.log(html);
});