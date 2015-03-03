module.exports = {
    default: {
        builder: 'enb',
        command: 'YENV=production enb make __magic__ desktop.examples desktop.docs touch-pad.examples ' +
            'touch-pad.docs touch-phone.examples touch-phone.docs',
        docDirs: '*.docs',
        rsync: {
            targets: ['*.examples']
        },
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
            require('../src/tasks/collect-sets')
        ]
    }
};
