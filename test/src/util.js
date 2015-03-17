var fs = require('fs'),
    should = require('should'),
    util = require('../../src/util');

describe('util', function () {
    describe('mdToHtml', function () {
        var md = fs.readFileSync('README.md', { encoding: 'utf-8' }),
            html = util.mdToHtml(md);

        html.should.be.ok;
        html.should.be.instanceOf(String);
    });

    describe('parseGhUrl', function () {
        it('should parse github url', function () {
            var p = util.parseGhUrl('https://github.com/bem-site/bem-data-source/blob/master/README.md');
            p.should.be.ok;
            p.should.be.instanceOf(Object);
            p.should.have.property('type');
            p.should.have.property('user');
            p.should.have.property('repo');
            p.should.have.property('ref');
            p.should.have.property('path');

            p.type.should.equal('public');
            p.user.should.equal('bem-site');
            p.repo.should.equal('bem-data-source');
            p.ref.should.equal('master');
            p.path.should.equal('README.md');
        });

        it ('should throw error on non-gihub url', function () {
            var url = 'https://www.yandex.ru/';
            (function () { return util.parseGhUrl(url); }).should.throw('Invalid format of url ' + url);
        });
    });

    describe('separateArrayOnChunks', function () {
        var arr;

        before(function () {
           arr = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
        });

        it('should separate array on chunks', function () {
            var a = util.separateArrayOnChunks(arr, 3);
            a.should.be.ok;
            a.should.be.instanceOf(Array);
            a.should.have.length(4);
            for (var i = 0; i < 4; i++) {
                a[i].should.be.instanceOf(Array);
                a[i].should.have.length(i < 3 ? 3 : 1);
            }
        });
    });
});
