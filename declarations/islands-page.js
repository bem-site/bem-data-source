module.exports = {
    default: {
        builder: 'bem-tools',
        command: 'npm run build',
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
                '*.tr.html', '*.lang.ru.js', '*.ru.js'
            ],
            include: ['_.*js', '_*.ru.js', '_*.css', '_*.ie.css', '_*.ie6.css', '_*.ie7.css',
                '_*.ie8.css', '_*.ie9.css', '*.bemjson.js'
            ]
        },
        tasks: [
            require('../src/tasks/git-clone'),
            require('../src/tasks/git-checkout'),
            require('../src/tasks/npm-install'),
            require('../src/tasks/npm-run-deps'),
            require('../src/tasks/copy-borschik'),
            require('../src/tasks/npm-run-build'),
            require('../src/tasks/remove-output'),
            require('../src/tasks/create-output'),
            require('../src/tasks/copy-sets'),
            require('../src/tasks/collect-sets')
        ]
    }
};
