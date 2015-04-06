module.exports = {
    default: {
        builder: 'bem-tools',
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.json'
        },
        docDirs: '*.sets',
        rsync: {
            targets: ['*.sets'],
            exclude: ['*.browser.bemhtml.js', '*.css', '*.en.js', '*.tr.js',
                '*.all.js', '*.keysets.ru.js', '*.keysets.ru.js', '*.pre.js',
                '*.json', '*.md', '*.deps.js', '*.bemdecl.js', '*.en.html',
                '*.tr.html', '*.ru.html', '*.lang.ru.js', '*.ru.js'
            ],
            include: ['_.*js', '_*.ru.js', '_*.css', '_*.ie.css', '_*.ie6.css', '_*.ie7.css',
                '_*.ie8.css', '_*.ie9.css', '*.bemjson.js'
            ]
        }
    }
};

