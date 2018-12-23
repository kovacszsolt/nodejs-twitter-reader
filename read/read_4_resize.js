const config = require('../common/config');
const util = require('../common/util');
const fs = require('fs-extra');
const gm = require('gm').subClass({imageMagick: true});
let tweetCount = 0;
const MongoClient = require('mongodb').MongoClient;
const mongoClient = new MongoClient(config.mongo_server, {useNewUrlParser: true});
mongoClient.connect(function (err, client) {
    const db = client.db(config.mongo_database);
    const tweetCollection = db.collection('tweet');
    const targetPath = process.cwd() + config.image_store + '/original/';
    fs.ensureDirSync(targetPath);
    config.image_sizes.forEach((size) => {
        const targetPath = process.cwd() + config.image_store + '/' + size.name + '/';
        fs.ensureDirSync(targetPath);
    });
    tweetCollection.find({'status': 2}).toArray(function (findErr, tweetList) {
        tweetCount = tweetList.length * config.image_sizes.length;
        tweetList.forEach((tweet) => {
            const sourceFile = process.cwd() + config.image_store + '/original/' + tweet._id + '.' + tweet.extension;
            config.image_sizes.forEach((size) => {
                const targetPath = process.cwd() + config.image_store + '/' + size.name + '/';
                const targetFile = targetPath + tweet._id + '.' + tweet.extension;
                imageResize(tweetCollection, tweet, sourceFile, targetFile, size.width);
            });
        });
    });
});

const imageResize = (collection, tweet, sourceFile, destionationFile, width) => {
    gm(sourceFile)
        .resize(width)
        .noProfile()
        .write(destionationFile, function (err) {
            if (err === undefined) {
                collection.updateOne(tweet, {$set: {status: 3}}, function (updateErr, result) {
                    if (updateErr === null) {
                        tweetCount--;
                        console.log(tweetCount);
                        if (tweetCount === 0) {
                            process.exit(0);
                        }
                    } else {
                        console.log(err);
                    }
                });
            } else {
                console.log(err);
            }
        });
}
