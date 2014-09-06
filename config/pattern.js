'use strict';

var tasks = require('./constants').TASKS;

module.exports = {
    'bem-history': {
        builder: 'enb',
        command: 'YENV=production enb make docs && enb make examples',
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
        tasks: [
            tasks.REMOVE_OUTPUT,
            tasks.CREATE_OUTPUT,
            tasks.GIT_CLONE,
            tasks.GIT_CHECKOUT,
            tasks.NPM_INSTALL,
            tasks.NPM_RUN_DEPS,
            tasks.COPY_BORSCHIK,
            tasks.NPM_RUN_BUILD,
            tasks.COPY_SETS,
            tasks.COLLECT_SETS
        ]
    },
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
        command: 'enb make __magic__ desktop.examples desktop.docs touch-pad.examples touch-pad.docs touch-phone.examples touch-phone.docs',
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
        },
        tasks: [
            tasks.REMOVE_OUTPUT,
            tasks.CREATE_OUTPUT,
            tasks.GIT_CLONE,
            tasks.GIT_CHECKOUT,
            tasks.NPM_INSTALL,
            tasks.COPY_BORSCHIK,
            tasks.NPM_RUN_BUILD,
            tasks.COPY_SETS,
            tasks.COLLECT_SETS
        ]
    },
    'bem-components': {
        builder: 'enb',
        command: 'YENV=production enb make __magic__ desktop.examples desktop.tests desktop.docs touch-pad.examples touch-pad.tests touch-pad.docs touch-phone.examples touch-phone.tests touch-phone.docs && enb make *.pages/*',
        copy: ['*.docs', '*.tests', '*.examples'],
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
        },
        tasks: [
            tasks.REMOVE_OUTPUT,
            tasks.CREATE_OUTPUT,
            tasks.GIT_CLONE,
            tasks.GIT_CHECKOUT,
            tasks.NPM_CACHE_CLEAN,
            tasks.NPM_INSTALL,
            tasks.NPM_RUN_DEPS,
            tasks.COPY_BORSCHIK,
            tasks.NPM_RUN_BUILD,
            tasks.COPY_SETS,
            tasks.COLLECT_SETS
        ]
    },
    'bem-core': {
        builder: 'enb',
        command: 'YENV=production bower install && npm run libs && enb make __magic__ desktop.examples ' +
            'desktop.tests desktop.docs touch-pad.examples touch-pad.tests touch-pad.docs ' +
            'touch-phone.examples touch-phone.tests touch-phone.docs',
        copy: ['*.docs', '*.tests', '*.examples'],
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
                url: '/tags/{lib}-v2.3.0'
            }
        ],
        tasks: [
            tasks.REMOVE_OUTPUT,
            tasks.CREATE_OUTPUT,
            tasks.GIT_CLONE,
            tasks.GIT_CHECKOUT,
            tasks.COPY_BORSCHIK,
            tasks.NPM_INSTALL,
            tasks.NPM_RUN_BUILD,
            tasks.COPY_SETS,
            tasks.COLLECT_SETS
        ]
    },
    islands: {
        command: 'npm run build'
    },
    'islands-components': {
        builder: 'enb',
        command: 'npm run build',
        pattern: {
            data: '%s.data.json',            
	    jsdoc: '%s.jsdoc.json'
        },
	copy: ['*.docs', '*.tests', '*.examples'],
        tasks: [
            tasks.REMOVE_OUTPUT,
            tasks.CREATE_OUTPUT,
            tasks.GIT_CLONE,
            tasks.GIT_CHECKOUT,
            tasks.NPM_CACHE_CLEAN,
            tasks.NPM_INSTALL,
            tasks.NPM_INSTALL_BEM_SETS,
	    tasks.NPM_INSTALL_BEM,
            tasks.NPM_RUN_DEPS,
            tasks.COPY_BORSCHIK,
            tasks.NPM_RUN_BUILD,
            tasks.COPY_SETS,
            tasks.COLLECT_SETS
        ]

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
        tasks: [
            tasks.REMOVE_OUTPUT,
            tasks.CREATE_OUTPUT,
            tasks.GIT_CLONE,
            tasks.GIT_CHECKOUT,
            tasks.COLLECT_SETS
        ]
    },
    'tableau-iframe': {
        docs: {
            readme: {
                folder: '',
                pattern: 'README.md'
            }
        },
        tasks: [
            tasks.REMOVE_OUTPUT,
            tasks.CREATE_OUTPUT,
            tasks.GIT_CLONE,
            tasks.GIT_CHECKOUT,
            tasks.COLLECT_SETS
        ]
    }
};
