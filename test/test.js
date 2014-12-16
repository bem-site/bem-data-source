var path = require('path'),
    assert = require('assert');

describe('bem-data-source', function(){
    before(function() {
        process.chdir(path.join(__dirname, './test-data'));
    });

    describe('#publish', function(){
        it('should be valid done', function(done) {
            var ds = require('../index.js'),
                options = {
                    debug: true,
                    namespace: 'bem-data-source:test'
                };
            ds.publish('v1.0.0', options, false)
                .then(function() {
                    done();
                }).done();
        });
    });
});
