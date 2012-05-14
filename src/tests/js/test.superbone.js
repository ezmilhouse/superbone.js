if (!chai) {
    var chai = require('../../');
}

var should = chai.should();

function err(fn, msg) {
    try {
        fn();
        throw new chai.AssertionError({ message: 'Expected an error' });
    } catch (err) {
        should.equal(msg, err.message);
    }
}

suite('superbone', function() {

    test('.version', function(){
        superbone.version.should.match(/^\d+\.\d+\.\d+$/);
    });

});