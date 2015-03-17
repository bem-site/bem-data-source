var should = require('should'),
    titles = require('../../src/titles');

describe('titles', function () {
    describe('readme', function () {
        it('should have readme', function () {
            titles.should.have.property('readme');
        });

        it('should have valid readme.en', function () {
            titles.readme.should.have.property('en');
            titles.readme.en.should.equal('Readme');
        });

        it('should have valid readme.ru', function () {
            titles.readme.should.have.property('ru');
            titles.readme.ru.should.equal('Readme');
        });
    });

    describe('changelog', function () {
        it('should have changelog', function () {
            titles.should.have.property('changelog');
        });

        it('should have valid changelog.en', function () {
            titles.changelog.should.have.property('en');
            titles.changelog.en.should.equal('Changelog');
        });

        it('should have valid changelog.ru', function () {
            titles.changelog.should.have.property('ru');
            titles.changelog.ru.should.equal('История изменений');
        });
    });

    describe('migration', function () {
        it('should have migration', function () {
            titles.should.have.property('migration');
        });

        it('should have valid migration.en', function () {
            titles.migration.should.have.property('en');
            titles.migration.en.should.equal('Migration');
        });

        it('should have valid migration.ru', function () {
            titles.migration.should.have.property('ru');
            titles.migration.ru.should.equal('Миграция');
        });
    });

    describe('notes', function () {
        it('should have notes', function () {
            titles.should.have.property('notes');
        });

        it('should have valid notes.en', function () {
            titles.notes.should.have.property('en');
            titles.notes.en.should.equal('Release Notes');
        });

        it('should have valid notes.ru', function () {
            titles.notes.should.have.property('ru');
            titles.notes.ru.should.equal('Примечания к релизу');
        });
    });
});
