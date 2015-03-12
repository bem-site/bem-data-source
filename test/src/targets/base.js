var should = require('should'),
    Target = require('../../../src/targets/base');

describe('targets base', function () {
    it('should be initialized', function () {
        new Target({
            name: 'test-library',
            url: 'git://github.com/test/test-library.git'
        }, 'v1.0.0');
    });

    describe('after initialization', function () {
        var t,
            ref = 'v1.0.0',
            name = 'test-library',
            url = 'git://github.com/test/test-library.git';

        before(function () {
            t = new Target({
                name: name,
                url: url
            }, ref);
        });

        it('should return valid name', function () {
            t.name.should.be.ok;
            t.name.should.be.instanceOf(String);
            t.name.should.equal(name + ' ' + ref);
        });

        it('should return valid sourceName', function () {
            t.sourceName.should.be.ok;
            t.sourceName.should.be.instanceOf(String);
            t.sourceName.should.equal(name);
        });

        it('should return valid url', function () {
            t.url.should.be.ok;
            t.url.should.be.instanceOf(String);
            t.url.should.equal(url);
        });

        it('should return mdTargets', function () {
            t.mdTargets.should.be.ok;
            t.mdTargets.should.be.instanceOf(Object);
            t.mdTargets.should.have.property('readme');
            t.mdTargets.should.have.property('changelog');
            t.mdTargets.should.have.property('migration');
            t.mdTargets.should.have.property('notes');
        });

        it('should have blockTargets', function () {
            t.blockTargets.should.be.ok;
            t.blockTargets.should.be.instanceOf(Object);
            t.blockTargets.should.have.property('data');
            t.blockTargets.should.have.property('jsdoc');
        });

        it('should have rsyncConfiguration', function () {
            t.rsyncConfiguration.should.be.ok;
            t.rsyncConfiguration.should.be.instanceOf(Object);
            t.rsyncConfiguration.should.have.property('targets');
        });

        it('should have valid docPatterns', function () {
            t.docPatterns.should.be.ok;
            t.docPatterns.should.be.instanceOf(String);
            t.docPatterns.should.equal('*.docs');
        });

        it('should have titles', function () {
            t.titles.should.be.ok;
            t.titles.should.be.instanceOf(Object);
        });

        it('should process custom nodes', function () {
            t.custom.should.be.ok;
            t.custom.should.be.instanceOf(Array);
        });

        it('should not have showcase', function () {
            should(t.showCase).not.be.ok;
        });

        it('should createResultBase', function () {
            var rb = t.createResultBase();
            rb.should.be.ok;
            rb.should.be.instanceOf(Object);

            rb.should.have.property('repo');
            rb.should.have.property('ref');
            rb.should.have.property('enb');
            rb.should.have.property('url');
            rb.should.have.property('custom');
            rb.should.have.property('showcase');
            rb.should.have.property('docs');

            rb.repo.should.equal(name);
            rb.ref.should.equal(ref);
            rb.enb.should.be.instanceOf(Boolean).and.equal(true);
            rb.url.should.equal('http://github.com/test/test-library');

            rb.custom.should.be.instanceOf(Array).and.have.length(0);
            should(rb.showCase).not.be.ok;

            rb.docs.should.be.instanceOf(Object);
            Object.keys(rb.docs).should.have.length(0);
        });
    });
});
