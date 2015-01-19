var path = require('path'),

    vow = require('vow'),
    vowFs = require('vow-fs'),

    str = '<p>Внимание! Релиз islands_name X.Y.Z объявлен <strong>deprecated</strong> ' +
        'в связи с багами в bem-bl-xjst 2.1.1. ' +
        '<a href="https://ml.yandex-team.ru/thread/2370000001370527991/#message2370000001370926784">' +
        'Подробности</a></p>';

function fixVersionDocs(folderName) {
    var folderParts = folderName.split(':'),
        libName = folderParts[0 ],
        libVersion = folderParts[1],
        dataJsonPath = path.join(process.cwd(), folderName, 'data.json');

    console.log('libName: %s libVersion: %s dataJsonPath: %s', libName, libVersion, dataJsonPath);

    return vowFs.read(dataJsonPath, 'utf-8')
        .then(function (content) {
            content = JSON.parse(content);
            ['changelog', 'notes'].forEach(function (docType) {
                ['en', 'ru'].forEach(function (lang) {
                    if (content.docs[docType]) {
                        console.log('change %s %s of %s %s', docType, lang, libName, libVersion);
                        content.docs[docType].content[lang] = content.docs[docType].content[lang] +
                        str.replace('islands_name', libName).replace('X.Y.Z', libVersion);
                    }
                });
            });
            return vowFs.write(dataJsonPath, JSON.stringify(content), 'utf-8');
        });
}

vowFs
    .listDir(process.cwd()).then(function (folders) {
        folders = folders.filter(function (folder) {
            return folder !== '.DS_Store';
        });

        return vow.all(folders.map(function (folder) {
            console.log('fix version docs for folder: %s', folder);
            return fixVersionDocs(folder);
        }));
    }).done();
