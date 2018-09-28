const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../logger');

module.exports = async (repo, repoPath) => {
    logger.info(`[START]=== Building ${repo} in ${repoPath}... ===[START]`);

    await executeGitCommands(repoPath);
    await executeInstallProductionModules(repoPath);
    await executePostBuildScripts(repoPath);

    // restart server
    exec(`pm2 restart ${repo}`);

    logger.info(`[END]=== Build successful for ${repo} in ${repoPath} ===[END]`);
};


/**
 * Logs err, stdout, or stderr to logfile
 * @param {*} err
 * @param {*} stdout
 * @param {*} stderr
 */
function execCallback(err, stdout, stderr) {
    if (err) logger.error(err);
    if (stdout) logger.info(stdout);
    if (stderr) logger.warn(stderr);
}

/**
 * Executes all post build scripts in package.json with the fieldname 'ns-postbuild'
 * @param {String} repoPath path of the project on the server
 */
async function executePostBuildScripts(repoPath) {
    const file = await fs.readFile(path.resolve(repoPath, 'package.json'));
    const json = JSON.parse(file);

    const postbuildScript = json.scripts['ns-postbuild'];
    return new Promise((resolve, reject) => {
        if (postbuildScript) {
            logger.info(`--- Executing post build script for: ${postbuildScript} ---`);
            exec(postbuildScript, { cwd: repoPath }, (err, stdout, stderr) => {
                execCallback(err, stdout, stderr);
                if (err) reject(err);
                resolve();
            });
        }
    });
}

/**
 * Resets local changes, clears local changes, pulls latest files from github
 * @param {String} repoPath path of the project on the server
 */
async function executeGitCommands(repoPath) {
    logger.info('--- Executing Git Commands ---');

    return new Promise((resolve, reject) => {
        logger.info('Resetting any changes that have been made locally');
        exec(`git -C ${repoPath} reset --hard`, (err, stdout, stderr) => {
            execCallback(err, stdout, stderr);
            if (err) reject(err);

            logger.info('Clearing locally made changes.');
            exec(`git -C ${repoPath} clean -df`, (err, stdout, stderr) => {
                execCallback(err, stdout, stderr);
                if (err) reject(err);

                logger.info('Pulling latest code from repository');
                exec(`git -C ${repoPath} pull origin master`, (err, stdout, stderr) => {
                    execCallback(err, stdout, stderr);
                    if (err) reject(err);

                    resolve();
                });
            });
        });
    });
}

/**
 * Installs production npm modules
 * @param {String} repoPath path of the project on the server
 */
async function executeInstallProductionModules(repoPath) {
    logger.info('--- Installing Production Modules ---');
    return new Promise((resolve, reject) => {
        exec(`npm -C ${repoPath} install --production`, (err, stdout, stderr) => {
            execCallback(err, stdout, stderr);
            if (err) reject(err);

            resolve();
        });
    });
}
