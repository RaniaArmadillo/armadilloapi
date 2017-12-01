var debug = require('debug')('arma:app');
var errorLog = require('debug')('arma:error');
var assert = require('assert');

var express = require('express');
var path = require('path');
global.appRoot = path.resolve(__dirname);
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var expressSession = require('express-session');
var flash = require('connect-flash');

var bodyParser = require('body-parser');
var config = require('./modules/config').all();
///////////
//Swagger
var swaggerUi = require('swagger-ui-express');
var argv = require('minimist')(process.argv.slice(2));
var swaggerDocument = require('./swagger.json');
 var swagger = require("swagger-node-express");
 const mime = require('mime');

//
var apiRoutes = require('./routes/api');
var uuid = require('node-uuid');
var db = require('./modules/db').db;
var User= require('./modules/user/user.js');
var _ = require('lodash');
var pageUtils = require('./utils/page-utils');


var webpack, webpackMiddleware, webpackConfig, webpackCompiler, hmr;

///Configure app
var cors = require('cors');

var app = express();
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(bodyParser.json());

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(cookieParser());
app.use(flash());


var isDevEnv = (app.get('env') === 'development');
console.log('isDevEnv', isDevEnv);
var hasWebpack = isDevEnv && (process.env.SERVER_MODE !== "api");
if (hasWebpack){
    hmr = require("webpack-dev-hmr");
    webpack = require("webpack");
    webpackMiddleware = require("webpack-dev-middleware");
    webpackConfig = require("./webpack.config.js");
    webpackCompiler = webpack(webpackConfig);

    app.use(webpackMiddleware(webpackCompiler, {
        publicPath: webpackConfig.output.publicPath,
        hot: true,
        watchDelay: 300,
        stats: {
            colors: true
        }
    }));
}

// Aggressive Cache-Control for font files
app.use(function (req, res, next) {
    if (req.url.match(/^\/stylesheets\/fonts\/.+/)) {
        var maxAge = 3600*24*7; // 1 week
        res.setHeader('Cache-Control', 'public, max-age=' + maxAge);
    }

    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

// Static assets management
var staticAsset = require('static-asset');

 var staticStrategy = require('./modules/cache-strategies/strategy-date');
  app.use(staticAsset(path.join(__dirname, 'public'), staticStrategy));
   app.use(express.static(path.join(__dirname, 'public')));
 
// Define default route for a generic site
var router = express.Router();
var webRouter = express.Router();


_.forIn(require('./modules'), function(module, moduleName) {
  if (moduleName == 'admin'){
    debug('add admin routes for ' + moduleName);
    webRouter.use(module.router);
  } else if (module.router){
    debug('add routes for ' + moduleName);
    webRouter.use(module.router);
  }
});
router.use(webRouter);
router.use('/api',      apiRoutes);


app.use('/ping', function(req, res){
  res.json({result: 'pong'});
});

var dd=new Date();
var multer  = require('multer');
var storage = multer.diskStorage({
  destination: function (req, file, callback) {
    //callback(null, './public/files');
  },
  filename: function (req, file, callback) {
    callback(null,  req.pref +file.originalname);
    //console.log(file);
  }
});
var upload = multer({ storage : storage}).single('userPhoto');

app.post('/api/photo',function(req,res,next){
  debug("image upload");
  var pre=(Math.floor((Math.random() * 1000) + 1)).toString();
  req.pref=pre;
  upload(req,res,function(err) {        
    if(err) {
      console.log(err);
     
      return res.end(err);
    }
    debug("File is uploaded");
    res.end( pre + req.file.originalname);
  });
});



// And apply route to all sites
app.use('/:site', function(req, res, next){
    var site = req.params.site;
    res.locals.site = req.params.site;
    res.locals.baseUrl = '/' + req.params.site + '/';
    res.locals.api = res.locals.baseUrl + 'api';
    if (config.sites.indexOf(site) == -1){
        // Failed to find site !
        //var err = new Error('Site ' + site + ' not found in "' + req.path + '"');
        //err.status = 404;
        //next(err);
    } else {
        req.site = site; // Make the 'site' variable accessible to anyone
        // if (site == "psa"){
        //   psaRouter(req, res, next);
        // } else {
          router(req, res, next);
        // }

    }
});



app.get('/', function (req, res) {
  debug('redirect to root site');
  res.statusCode = 302;
  res.setHeader("Location", '/campus');
  res.end();
});

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
    errorLog(err.stack);

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




var options = {
  validatorUrl : null,
  oauth: {
   clientId: "your-client-id1",
   clientSecret: "your-client-secret-if-required1",
   realm: "your-realms1",
   appName: "your-app-name1",
   scopeSeparator: ",",
   additionalQueryStringParams: {}
 }
};

router.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, false, options, '.swagger-ui .topbar { background-color: bleu }'));




/////////////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////////////




//create an http server that listens for requests
var server = app.listen(process.env.SERVER_PORT || process.env.PORT, function () {
  var host = server.address().address;
  var port = server.address().port;

  console.log('Listening at http://%s:%s', host, port);
    if (hasWebpack){
        hmr.listen(server, webpackCompiler);
    }
}).on('close', function(){
    logger.info('closing server');

    if (hasWebpack){
        hmr.close();
    }
});

module.exports = app;