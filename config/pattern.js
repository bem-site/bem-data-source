'use strict';

module.exports = {
    'bem-mvc': {
        builder: 'enb',
        docs: {
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
        docs: {
            readme: {
                folder: '',
                pattern: {
                    en: 'README.md',
                    ru: 'README.ru.md'
                }
            }
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
        docs: {
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
            }
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
        docs: {
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
            }
        },
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.html'
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
    },
    'islands': {
        command: 'ulimit -n 8192 && npm run build'
    },
    'islands-components': {
        builder: 'enb',
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.ru.doc.html'
        }
    },
    'islands-user': {},
    'islands-page': {},
    'islands-services': {},
    'islands-search': {},
    'islands-icons': {
        command: 'ulimit -n 8192 && npm run build'
    },
    'islands-romochka': {},
    'assistant-iframe': {
        docs: {
            readme: {
                folder: '',
                pattern: 'README.md'
            },
            changelog: {
                folder: '',
                pattern: 'CHANGELOG.md'
            }
        },
        skip: ['npmInstall', 'npmInstallBemSets', 'npmInstallBem',
            'npmRunDeps', 'copyBorschik', 'npmRunBuild', 'copySets']
    },
    'tableau-iframe': {
        docs: {
            readme: {
                folder: '',
                pattern: 'README.md'
            }
        },
        skip: ['npmInstall', 'npmInstallBemSets', 'npmInstallBem',
            'npmRunDeps', 'copyBorschik', 'npmRunBuild', 'copySets']
    }
};
