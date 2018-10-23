const router = require('express').Router();
const crypto = require('crypto');
const path = require('path');
const axios = require('axios');
const config = require('config');
const bufferEqual = require('buffer-equal-constant-time');
const logger = require('../logger');
const buildService = require('../services/buildService');


router.post('/', async (req, res) => {
    if (!containsValidHeaders(req.headers)) {
        res.status(400).send('Incorrect headers');
    }

    const secret = process.env.GITHUB_SECRET;
    const signature = req.headers['x-hub-signature'];
    const data = req.body;
    if (!verifySignature(secret, JSON.stringify(data), signature)) {
        logger.warn('Received invalid secret');
        return res.status(401).send('Invalid secret.');
    }

    const repo = data.repository.name;
    const paths = config.repos[repo];
    if (!paths || !(paths.development && paths.production)) {
        return res.status(400).send(`Server configuration not found for ${repo}`);
    }

    const branchName = getBranchNameFromRef(data.ref);
    if (branchName !== 'master') { // non master branch, build in dev server
        try {
            axios.get(`${config.developmentServerAddress}?repo=${repo}&branchName=${branchName}`);
            logger.info(`Push received from ${repo} on branch: ${branchName}. Forwarding to deveopment server`);
            return res.status(202).send('Sending to development server');
        } catch (err) {
            return res.status(400).send('Error contacting or building on the development server');
        }
    } else {
        logger.info(`Push received from ${repo} on branch: ${branchName}.`);
        buildService(repo, path.normalize(paths.production), branchName);
        return res.status(200).send('Building on production server');
    }
});

function getBranchNameFromRef(ref) {
    const refSplit = ref.split('/');
    return refSplit[refSplit.length - 1];
}


function containsValidHeaders(headers) {
    return headers['x-github-delivery']
        && headers['x-github-event']
        && headers['x-hub-signature'];
}

function signData(secret, data) {
    return `sha1=${crypto.createHmac('sha1', secret).update(data).digest('hex')}`;
}

function verifySignature(secret, data, signature) {
    if (!secret) return false;

    return bufferEqual(Buffer.from(signature), Buffer.from(signData(secret, data)));
}


module.exports = router;
