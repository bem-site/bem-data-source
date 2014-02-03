module.exports = {
    init: require('./init'),
    getConfig: require('./get_config'),
    getRepositories: require('./get_repositories'),
    getTags: require('./get_tags'),
    getBranches: require('./get_branches'),
    createTargets: require('./create_targets'),
    executeTargets: require('./execute_targets'),
    updateConfig: require('./update_config'),
    collectResults: require('./collect_results')
};