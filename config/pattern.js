'use strict';

module.exports = {
    'bem-mvc': {
        builder: 'enb',
        readme: {
            folder: '',
            pattern: {
                en: 'README.md',
                ru: 'README.ru.md'
            }
        },
        changelog: {
            folder: '',
            pattern: {
                en: 'CHANGELOG.md',
                ru: 'CHANGELOG.ru.md'
            }
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.js-doc.html'
        }
    },
    'bem-bl': {
        builder: 'enb',
        command: 'YENV=production enb make examples && enb make docs',
        copy: ['*.docs', '*.examples'],
        readme: {
            folder: '',
            pattern: {
                en: 'README.md',
                ru: 'README.ru.md'
            }
            //pattern: 'https://github.com/bem/bem-bl/blob/dev/README.ru.md'
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.html'
        }
    },
    'bem-components': {
        builder: 'enb',
        command: 'YENV=production enb make tests && enb make docs',
        copy: ['*.docs', '*.tests'],
        readme: {
            folder: '',
            pattern: 'README.md'
        },
        changelog: {
            folder: '',
            pattern: 'CHANGELOG.md'
        },
        migration: {
            folder: '',
            pattern: 'MIGRATION.md'
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.html'
        }
    },
    'bem-core': {
        builder: 'enb',
        command: 'YENV=production enb make examples && enb make docs',
        copy: ['*.docs', '*.examples'],
        readme: {
            folder: '',
            pattern: {
                en: 'README.md',
                ru: 'README.ru.md'
            }
        },
        changelog: {
            folder: '',
            pattern: {
                en: 'CHANGELOG.md',
                ru: 'CHANGELOG.ru.md'
            }
        },
        migration: {
            folder: '',
            pattern: {
                en: 'MIGRATION.md',
                ru: 'MIGRATION.ru.md'
            }
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.html'
        }
    },
    'islands': {
        builder: 'bem-tools',
        command: 'ulimit -n 8192 && npm run build',
        changelog: {
            folder: 'releases',
            pattern: 'changelog.md'
        },
        migration: {
            folder: 'releases',
            pattern: 'migration.md'
        },
        notes: {
            folder: 'releases',
            pattern: 'release-notes.md'
        }
    },
    'islands-components': {
        builder: 'bem-tools',
        changelog: {
            folder: 'releases',
            pattern: 'changelog.md'
        },
        migration: {
            folder: 'releases',
            pattern: 'migration.md'
        },
        notes: {
            folder: 'releases',
            pattern: 'release-notes.md'
        }
    },
    'islands-user': {
        builder: 'bem-tools',
        changelog: {
            folder: 'releases',
            pattern: 'changelog.md'
        },
        migration: {
            folder: 'releases',
            pattern: 'migration.md'
        },
        notes: {
            folder: 'releases',
            pattern: 'release-notes.md'
        }
    },
    'islands-page': {
        builder: 'bem-tools',
        changelog: {
            folder: 'releases',
            pattern: 'changelog.md'
        },
        migration: {
            folder: 'releases',
            pattern: 'migration.md'
        },
        notes: {
            folder: 'releases',
            pattern: 'release-notes.md'
        }
    },
    'islands-services': {
        builder: 'bem-tools',
        changelog: {
            folder: 'releases',
            pattern: 'changelog.md'
        },
        migration: {
            folder: 'releases',
            pattern: 'migration.md'
        },
        notes: {
            folder: 'releases',
            pattern: 'release-notes.md'
        }
    },
    'islands-search': {
        builder: 'bem-tools',
        changelog: {
            folder: 'releases',
            pattern: 'changelog.md'
        },
        migration: {
            folder: 'releases',
            pattern: 'migration.md'
        },
        notes: {
            folder: 'releases',
            pattern: 'release-notes.md'
        }
    },
    'islands-icons': {
        builder: 'bem-tools',
        command: 'ulimit -n 8192 && npm run build',
        changelog: {
            folder: 'releases',
            pattern: 'changelog.md'
        },
        migration: {
            folder: 'releases',
            pattern: 'migration.md'
        },
        notes: {
            folder: 'releases',
            pattern: 'release-notes.md'
        }
    },
    'islands-romochka': {
        builder: 'bem-tools',
        changelog: {
            folder: 'releases',
            pattern: 'changelog.md'
        },
        migration: {
            folder: 'releases',
            pattern: 'migration.md'
        },
        notes: {
            folder: 'releases',
            pattern: 'release-notes.md'
        }
    },
    'assistant-iframe': {
        readme: {
            folder: '',
            pattern: 'README.md'
        },
        changelog: {
            folder: '',
            pattern: 'CHANGELOG.md'
        },
        skip: ['npmInstall', 'npmInstallBemSets', 'npmInstallBem',
            'npmRunDeps', 'copyBorschik', 'npmRunBuild', 'copySets']
    }
};
