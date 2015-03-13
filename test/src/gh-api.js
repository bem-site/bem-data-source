var should = require('should'),
    Github = require('../../src/gh-api');

describe('api/github', function () {
    describe('initialization', function () {
        it('without tokens', function () {
            new Github({});
        });
    });

    describe('after initialization', function () {
        var gh;

        before(function () {
            gh = new Github({});
        });

        it('should have private API', function () {
            gh.get({ type: 'private' }).should.be.ok;
            gh.get({ type: 'private' }).type.should.equal('private');
        });

        it('should have public API', function () {
            gh.get({ type: 'public' }).should.be.ok;
            gh.get({ type: 'public' }).type.should.equal('public');
        });
    });

    describe('api calls', function () {
        var gh;
        before(function () {
            gh = new Github({});
        });

        it('should get content of given file', function (done) {
            var o = {
                type: 'public',
                user: 'bem-site',
                repo: 'bse-admin',
                ref: 'master',
                path: 'README.md'
            };
            gh.get(o).getContent(o, null, function (error, result) {
                should(error).not.be.ok;
                result.should.be.ok;
                result.content.should.be.ok;
                result.name.should.equal('README.md');
                result.type.should.equal('file');
                result['html_url' ].should.equal('https://github.com/bem-site/bse-admin/blob/master/README.md');
                done();
            });
        });
    });
});
