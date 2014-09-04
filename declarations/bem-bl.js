module.exports = {
    default: {
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
    }
};
