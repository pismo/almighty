const fs = require('fs');
const path = require('path');
const AWS = require('aws-sdk');
const mime = require('mime-types');
const chalk = require('chalk');

const log = console.log.bind(console);

const project = require(path.join(process.cwd(), 'package.json')).name;

// AWS
const branch = process.env.GIT_BRANCH;
const region = process.env.AWS_REGION;

const bucket = (process.env.AWS_BUCKET || `${project}-${branch}` || '')
  .replace(/\/|_/g, '-')
  .toLowerCase();

module.exports = function deploy(dist = 'dist') {
  const distPath = dist;

  const s3 = new AWS.S3({
    region
  });

  log(chalk.cyan(`Starting to create a bucket for ${bucket}`));

  return s3.createBucket({
    Bucket: bucket,
    ACL: 'public-read',
    CreateBucketConfiguration: {
      LocationConstraint: region
    }
  }, transformToWebsite);

  function transformToWebsite(error) {
    if (error) {
      if (error.code === 'BucketAlreadyExists') {
        return readDir(distPath)
                 .then(bucketDone)
                 .catch(exit);

      } else if (error.code !== 'BucketAlreadyOwnedByYou') {
        throw error;
      }
    }

    log(chalk.cyan(`Transforming ${bucket} into a website`));
    return s3.putBucketWebsite({
      Bucket: bucket,
      WebsiteConfiguration: {
        IndexDocument: {
          Suffix: 'index.html'
        },
        ErrorDocument: {
          Key: '404.html'
        }
      }
    }, (err) => {
      if (err) {
        throw error;
      }

      readDir(distPath)
        .then(bucketDone)
        .catch(exit);
    });
  }

  function uploadToS3(params) {
    return new Promise((resolve, reject) => {
      s3.upload(params, (err, data) => {
        if (err) {
          reject(err);
        }

        resolve(data);
      });
    });
  }

  function doUpload(currentPath) {
    return new Promise((resolve, reject) => {
      const key = currentPath.replace(`${distPath}/`, '');
      const currentYear = (new Date()).getFullYear();
      const params = {
        Bucket: bucket,
        Key: key,
        RequestPayer: 'requester',
        ACL: 'public-read',
        CacheControl: 'public, max-age=3200000000000',
        Expires: new Date(currentYear + 1, 10, 2)
      };

      if (path.extname(currentPath) === '') {
        return resolve();
      }

      return fs.readFile(currentPath, (err, data) => {
        if (err) {
          return reject(err);
        }

        const extname = path.extname(currentPath);

        params.Body = data;

        if (currentPath.match(/(\.html|\.json)/g)) {
          params.CacheControl = 'no-cache';
          delete params.Expires;
        }

        if (extname === '.gz') {
          const file = currentPath.replace('.gz', '');

          params.ContentEncoding = 'gzip';
          params.ContentType = mime.contentType(path.extname(file));
        } else {
          params.ContentType = mime.contentType(extname);

          if (!params.ContentType) {
            throw Error(`Missing content type for ${currentPath}`);
          }
        }

        return resolve(uploadToS3(params));
      });
    });
  }

  function processFile(file) {
    return new Promise((resolve, reject) => {
      fs.stat(file, (err, stat) => {
        if (err) {
          return reject(err);
        }

        let result;

        if (stat.isFile()) {
          result = doUpload(file);
        } else if (stat.isDirectory()) {
          result = readDir(file);
        }

        return resolve(result);
      });
    });
  }

  function readDir(base) {
    return new Promise((resolve, reject) => {
      fs.readdir(base, (err, files) => {
        if (err) {
          reject(err);
        }

        return Promise
                  .all(files.map((file) => processFile(path.join(base, file))))
                  .then(resolve);
      });
    });
  }

  function exit(err) {
    log(chalk.red('Something went wrong'), err);
    process.exit(1);
  }

  function bucketDone() {
    log(chalk.green(`Url to test: http://${bucket}.s3-website-${region}.amazonaws.com`));
  }
};
