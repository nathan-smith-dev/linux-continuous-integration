const config = require('config');
const GithubWebHook = require('express-github-webhook');
const path = require('path');
const logger = require('../logger');
const buildService = require('../services/buildService');

const webhookHandler = GithubWebHook({ path: '/servers/build', secret: process.env.GITHUB_SECRET });

module.exports = (app) => {
    app.use(webhookHandler);

    webhookHandler.on('push', (repo) => {
        const repoPath = path.normalize(config.repos[repo]);
        if (repoPath) buildService(repo, repoPath);
        else logger.warn(`Repo not configured for ${repo}`);
    });
};
