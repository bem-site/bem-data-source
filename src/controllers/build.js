
module.exports = {
    index: function(req, res) {
        console.log('build index %s', req.path);
        res.send('Ok');
    },

    getTagsViaAPIByLib: function(req, res) {
        console.log('get tags via API by lib %s', req.path);
        res.send('Ok');
    },

    getBranchesViaAPIByLib: function(req, res) {
        console.log('get branches via API by lib %s', req.path);
        res.send('Ok');
    },

    build: function(req, res) {
        console.log('build received %s', req.path);
        res.send('Ok');
    }
};
