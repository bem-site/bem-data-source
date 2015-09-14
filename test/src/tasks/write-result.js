var path = require('path'),
    vow = require('vow'),
    vowFs = require('vow-fs'),
    should = require('should'),
    Target = require('../../../src/targets/publish'),
    WriteResult = require('../../../src/tasks/write-result');

describe('tasks/write-result', function () {
    var target;
    before(function () {
        process.chdir(path.resolve(__dirname, '../../test-data'));
        target = new Target('v1.0.0', {});
    });

    it('should write doc structure into data.json file', function () {
        return vow.resolve(target.createResultBase())
            .then(function (result) {
                return (new WriteResult(target)).run(result)
            })
            .then(function () {
                return vowFs.read(path.join(process.cwd(), 'data.json'), 'utf-8')
            })
            .then(function (content) {
                content = JSON.parse(content);
                return should.deepEqual(content, target.createResultBase());
            });
    });

    after(function () {
        process.chdir(path.resolve(__dirname, '../../../'));
    });
});
