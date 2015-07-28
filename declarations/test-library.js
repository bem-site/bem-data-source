module.exports = {
    default: {
        builder: 'enb',
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.json'
        },
        docDirs: '*.docs',
        rsync: {
            targets: ['*.examples', '*.bundles', '*.bundles1'],
            exclude: ['*.browser.bemhtml.js', '*.en.js', '*.tr.js',
                '*.all.js', '*.keysets.ru.js', '*.keysets.ru.js', '*.pre.js',
                '*.json', '*.md', '*.deps.js', '*.bemdecl.js', '*.en.html',
                '*.tr.html', '*.ru.html', '*.lang.ru.js'
            ],
            include: ['_.*js', '_*.ru.js', '_*.css', '_*.ie.css', '_*.ie6.css', '_*.ie7.css',
                '_*.ie8.css', '_*.ie9.css', '*.bemjson.js'
            ]
        },
        showcase: {
            title: 'showcase',
            path: 'desktop.pages/showcase/showcase.html'
        },
        custom: [
            {
                title: {
                    en: 'Documentation',
                    ru: 'Документация'
                },
                url: '/tags/{lib}-{ref}'
            }
        ]
    }
};
