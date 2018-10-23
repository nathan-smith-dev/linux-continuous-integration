const app = require('express')();
require('dotenv').config();
const bodyParser = require('body-parser');
const morgan = require('morgan');
const log4js = require('log4js');
const logger = require('./logger');
const githubWebhookRoutes = require('./routes/githubWebookRoutes');

// logging
app.use(log4js.connectLogger(log4js.getLogger()));
app.use(morgan('tiny'));

// middlewares
app.use(bodyParser.json());

// routes
app.use('/servers', githubWebhookRoutes);
app.use('/development', require('./routes/developmentRoutes'));

app.get('*', (req, res) => {
    res.status(404).send('Not found on Linux continuous integration server');
});

const PORT = process.env.PORT || 1212;
app.listen(PORT, () => logger.info(`Running continuous integration server on ${PORT}`));
