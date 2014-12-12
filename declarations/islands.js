module.exports = {
    default: {
        builder: 'enb',
        command: 'npm run build',
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.json'
        },
        docDirs: '*.docs',
        rsync: {
            targets: ['*.docs', '*.examples'],
            exclude: ['*.browser.bemhtml.js', '*.css', '*.en.js', '*.tr.js',
                '*.all.js', '*.keysets.ru.js', '*.keysets.ru.js', '*.pre.js',
                '*.json', '*.md', '*.deps.js', '*.bemdecl.js', '*.en.html',
                '*.tr.html', '*.ru.html', '*.lang.ru.js', '*.ru.js'
            ],
            include: ['_.*js', '_*.ru.js', '_*.css', '_*.ie.css', '_*.ie6.css', '_*.ie7.css',
                '_*.ie8.css', '_*.ie9.css', '*.bemjson.js'
            ]
        },
        tasks: [
            require('../src/tasks/collect-sets')
        ]
    }
};
