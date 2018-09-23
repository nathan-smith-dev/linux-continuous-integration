const { exec } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const logger = require('../logger');

module.exports = async (repo, repoPath) => {
    logger.info(`Building ${repo} in ${repoPath}...`);

    // reset any changes that have been made locally
    exec(`git -C ${repoPath} reset --hard`, execCallback);

    // and ditch any files that have been added locally too
    exec(`git -C ${repoPath} clean -df`, execCallback);

    // now pull down the latest
    exec(`git -C ${repoPath} pull -f`, execCallback);

    // and npm install with --production
    exec(`npm -C ${repoPath} install --production`, execCallback);

    // restart server
    exec(`pm2 restart ${repo}`);

    logger.info(`Build successful for ${repo} in ${repoPath}`);

    await executePostBuildScripts(repoPath);
};

function execCallback(err, stdout, stderr) {
    if (err) logger.error(err);
    if (stdout) logger.info(stdout);
    if (stderr) logger.error(stderr);
}

async function executePostBuildScripts(repoPath) {
    const file = await fs.readFile(path.resolve(repoPath, 'package.json'));
    const json = JSON.parse(file);

    const postbuildScript = json['ns-postbuild'];
    if (postbuildScript) {
        logger.info(`Executing post build script for: ${postbuildScript}`);
        exec(postbuildScript);
    }
}
