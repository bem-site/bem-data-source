module.exports = {
    default: {
        builder: 'enb',
        command: 'npm run build',
        pattern: {
            data: '%s.data.json',
            jsdoc: '%s.jsdoc.json'
        },
        copy: ['*.docs', '*.tests', '*.examples'],
        tasks: [
            require('../src/commands/remove-output'),
            require('../src/commands/create-output'),
            require('../src/commands/git-clone'),
            require('../src/commands/git-checkout'),
            require('../src/commands/npm-install'),
            require('../src/commands/npm-run-deps'),
            require('../src/commands/copy-borschik'),
            require('../src/commands/npm-run-build'),
            require('../src/commands/copy-sets'),
            require('../src/commands/collect-sets')
        ]
    }
};
