const router = require('express').Router();
const config = require('config');
const path = require('path');
const buildService = require('../services/buildService');


router.get('/', (req, res) => {
    const { repo, branchName } = req.query;

    const paths = config.repos[repo];
    if (!paths || !(paths.development && paths.production)) {
        return res.status(400).send(`Server configuration not found for ${repo}`);
    }

    buildService(repo, path.normalize(paths.development), branchName);
    return res.status(200).send(`Development configuration found for ${repo}`);
});


module.exports = router;
