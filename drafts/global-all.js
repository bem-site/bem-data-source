var path = require('path'),
    glob = require('glob-all'),
    options = {
        cwd: path.resolve('/Users/user/Work/recearch/bem-components/'),
        nodir: true
    },
    targets = ['*.examples', '*.pages'],
    exclude = ['*.bemdecl.js', '*.browser.bemhtml.js', '*.browser.js',
        '*.deps.js', '*.js-js.bemdecl.js', '*.js.bemdecl.js', '*.js.deps.js', '*.pre.js',
        '*.template.bemdecl.js', '*.template.deps.js'],
    patterns = [];

targets.forEach(function (target) {
    patterns.push(target + '/**');
    exclude.forEach(function (pattern) {
        patterns.push('!' + target + '/*/*/' + pattern);
    });
});

glob(patterns, options, function (error, files) {
    console.log(files);
});
