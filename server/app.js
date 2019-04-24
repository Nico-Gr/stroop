var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var yaml = require('yaml-config');
var indexRouter = require('./routes/index');
var fs = require('fs');
var bodyParser = require('body-parser');

var CONFIG_FILE = __dirname + '/config/server-config.yml';

console.log('Reading in config file: ' + CONFIG_FILE);

var app = express();

//create file structure and log files
fs.exists(CONFIG_FILE, function(exists) {
    if (exists) {
        var settings = yaml.readConfig(CONFIG_FILE),
        	logs = __dirname + settings.logDirectory;

        console.log('Server settings:');
        console.log(settings);

        fs.exists(logs, function(exists) {
		    if (!exists) {
		        fs.mkdir(logs, function(err) {
		           console.log('+ log directory created at: ' + logs); 
		        });
		    }
		});

	} else {
		console.log("[Error]: config file not found: " + CONFIG_FILE);
	}
});

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json()); 

app.use('/', indexRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;