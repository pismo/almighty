const http = require('http');
const chalk = require('chalk');

const log = console.log.bind(console);

const {
  ROLLBAR_SERVER_TOKEN,
  ROLLBAR_ENVIRONMENT,
  BUILD_TAG,
  USER,
  GIT_COMMIT
} = process.env;

module.exports = function rollbar(data) {
  notify(data).catch(() => {
    process.exit(1);
  });
};

function notify({
  token = ROLLBAR_SERVER_TOKEN,
  env = ROLLBAR_ENVIRONMENT,
  tag = BUILD_TAG,
  user = USER,
  comment = GIT_COMMIT
}) {

  const data = {
    access_token: token,
    environment: env,
    revision: tag,
    local_username: user,
    comment
  };

  return Promise.resolve(data).then(makeRequest);
}

function handler(res) {
  return new Promise((resolve, reject) => {
    let body = '';
    log(chalk.cyan('Rollbar response status'), res.statusCode);

    res.on('data', (data) => body += data);

    res.on('end', () => {
      log(chalk.cyan('Rollbar response'), body);

      if (res.statusCode !== 200) {
        return reject(res);
      }

      return resolve(body);
    });
  });
}

function makeRequest(body) {
  return new Promise((resolve, reject) => {
    const request = http.request({
      host: 'api.rollbar.com',
      path: '/api/1/deploy/',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': JSON.stringify(body).length
      }
    },

    (res) => resolve(handler(res)));

    request.on('error', (error) => {
      log(chalk.red('Something bad happened'), error);
      reject(error);
    });

    request.write(JSON.stringify(body));
    request.end();
  });
}
