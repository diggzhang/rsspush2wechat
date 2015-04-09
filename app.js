var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

//===========================================================
// require into config.js / wechat-enterprise-api / feed-read
//require('./db/modles');
//var pushFeedController = require('./db/controller');
var _ = require('lodash');
var config = require('./config');
var API = require('wechat-enterprise-api');
var feed = require('feed-read');
var mongoose = require('mongoose');
var Schema = mongoose.Schema;
//api(corpid, secret, product_id)
var api = new API(config.corpid, config.corpsecret, 10);
// mongoose schema
//var pushfeed = require('./models');
// invoke node cron
var CronJob = require('cron').CronJob;
var CronJobGlobalNum = 0;
// invoke later.js
//var later = require('later');
// later schedules basic
//var basic = {
//    h: [12],
//    m: [5]
//};
//later.date.localTime();

mongoose.connect('mongodb://localhost/wechatpusher');

// define user schema
var pushFeedSchema = new Schema({
    title: String,
    link: String,
    pushflag: { type: Boolean, default: false }
});

// create model
var pushfeed = mongoose.model('pushfeed', pushFeedSchema);
// message send configure
// send to @all(alluser)
var to = {
    "touser": "@all"
}
// send message format
var message = {
    "msgtype" : "news",
    "news" : {
        "articles" : [
            {
                "title":"Title",
                "description":"Description",
                "url":"URL",
                //"picurl":"http://i-store.qiniudn.com/RSbgrLMmjaDOieNPufTw.png"
                "picurl":""
            },
            {   
                "title":"Title",
                "description":"Description",
                "url":"URL",
                //"picurl":"http://i-store.qiniudn.com/eaTwVWYUMlKFmufkynXh.png"
                "picurl":""
            }
        ]
    },  
    "safe" : "0" 
};

// feed list
feedList = [
    //"http://dev.guanghe.tv/feed.xml",
    "https://github.com/blog.atom",
    //"http://www.ruanyifeng.com/blog/atom.xml"
];
// feed-read in feed-read>>>strore in DB>>>if(!push)push else findnext
feed(feedList, function (err, articles) {
    if (err) {
        throw err;
    };

    // test code
    // line 1 找到已存在,传递到exists
    // line 2 find的回调函数 docs == exists
    // line 3 排除已经有的title

    //var testarr = _.reject(articles, _.pluck(articles, 'title'));

    //console.log(pushfeed.find({title:{$in:_.pluck(articles, 'title')}}));
    //var exists_arr = pushfeed.find({title:{$in:_.pluck(articles, 'title')}});

    // exists docs
    pushfeed.find({title:{$in:_.pluck(articles, 'title')}}, function(err, docs){
        //console.log(articles);
        var toBePushed = _.reject(articles, function(x){
            return _.chain(docs).pluck('title').include(x).value();
        });
        //console.log(exists);
        //console.log(toBePushed[0].title);
        //console.log(toBePushed[1].title);
        //console.log(toBePushed[2].title);
        //pushfeed.save(toBePushed);
        //console.log(toBePushed[0].title);

        //message.news.articles[0].title = articles[0].title;
        // invoke wechat API to push toBePushed
        message.news.articles[0].title = toBePushed[0].title;
        message.news.articles[0].url   = toBePushed[0].link;
        console.log("push #1:"+articles[0].link);

        message.news.articles[1].title = toBePushed[1].title;
        message.news.articles[1].url   = toBePushed[1].link;
        console.log("push #2:"+articles[1].link);

     //   pushfeed.save();
    });
    //
    //message.news.articles[0].title = articles[0].title;
    //message.news.articles[0].url   = articles[0].link;
    //console.log("push #1:"+articles[0].link);
    //
    //message.news.articles[1].title = articles[1].title;
    //message.news.articles[1].url   = articles[1].link;
    //console.log("push #2:"+articles[1].link);

    api.send(to, message, function (err, data, res) {
        if (err) {
            console.log(err);
        };
        console.log("feed Already Push");
        process.exit(0);
    });
});

var app = express();

//===========================================================

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

// uncomment after placing your favicon in /public
// app.use(favicon(__dirname + '/public/favicon.ico'));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
      message: err.message,
      error: err
    });
  });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
  res.status(err.status || 500);
  res.render('error', {
    message: err.message,
    error: {}
  });
});

module.exports = app;
