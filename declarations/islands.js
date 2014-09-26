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
            targets: ['*.examples'],
            exclude: ['*.browser.bemhtml.js', '*.css', '*.ru.js', '*.en.js', '*.tr.js', '*.all.js',
                '*.pre.js', '*.html', '*.json', '*.md', '*.deps.js', '*.bemdecl.js', '*.html'
            ],
            include: ['*.ru.html', '_.*js', '_*.css', '_*.ie.css', '_*.ie6.css', '_*.ie7.css',
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
