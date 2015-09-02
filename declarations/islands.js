module.exports = {
    default: {
        builder: 'enb',
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.json'
        },
        docDirs: '*.docs',
        rsync: {
            targets: ['*.examples', '*.bundles'],
            exclude: ['*.browser.bemhtml.js', '*.tr.js',
                '*.all.js', '*.keysets.ru.js', '*.keysets.en.js', '*.pre.js',
                '*.json', '*.md', '*.deps.js', '*.bemdecl.js', '*.en.html', '*.optimized.js',
                '*.tr.html', '*.ru.html', '*.lang.ru.js', '*.map', '*.symlink', '*.includes.js'
            ]
        },
        showcase: {
            title: {
                en: 'Showcase',
                ru: 'Витрина'
            },
            path: 'desktop.bundles/showcase/showcase.html'
        }
    }
};
