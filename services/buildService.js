const { exec } = require('child_process');
const logger = require('../logger');

function execCallback(err, stdout, stderr) {
    if (err) logger.error(err);
    if (stdout) logger.info(stdout);
    if (stderr) logger.error(stderr);
}


module.exports = (repo, repoPath) => {
    logger.info(`Building ${repo} in ${repoPath}...`);

    // reset any changes that have been made locally
    exec(`git -C ${repoPath} reset --hard`, execCallback);

    // and ditch any files that have been added locally too
    exec(`git -C ${repoPath} clean -df`, execCallback);

    // now pull down the latest
    exec(`git -C ${repoPath} pull -f`, execCallback);

    // and npm install with --production
    exec(`npm -C ${repoPath} install --production`, execCallback);

    logger.info(`Build successful for ${repo} in ${repoPath}`);
};
