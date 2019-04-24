var express = require('express'),
	router = express.Router(),
	fs = require('fs'),
	yaml = require('yaml-config');

var settings = yaml.readConfig(__dirname + '/../config/server-config.yml'),
    LOGDIRECTORY = __dirname + '/../' + settings.logDirectory,
    LOGFILEEXTENSION = '.log',
    OKRESPONSE = {'status': 'ok'};
    FORMATERROR = {'status': 'error', 'info': 'malformed json request'};

/* GET home page. */
router.get('/', function(req, res, next) {
  // res.render('index', { title: 'Log Server' });
  res.sendFile(path.join(__dirname + '/views/index.html'));
});

/* save POST request to file */
router.post('/', function(req, res, next) {

    // req.body = JSON.stringify(req.body);

    console.log("POST request received:");
    console.log(req.body);

  	var settings,
  		data,
  		participant_id,
  		ts = Date.now(),
        logfile,
        valid_request = true,
        NEWLINE = '\r\n';

    if(req.body.settings) {
        settings = req.body.settings;
    } else {
        valid_request = false;
        FORMATERROR['err'] = 'missing settings object';
    }

    if(req.body.data) {
        data = req.body.data;
    } else {
        valid_request = false;
        FORMATERROR['err'] = 'missing data object';
    }

    if(valid_request && settings.participant_id) {
        participant_id = settings.participant_id;
    } else {
        valid_request = false;
        FORMATERROR['err'] = 'missing participant_id in settings object';
    }

    if(valid_request) {
        logfile = LOGDIRECTORY + participant_id + LOGFILEEXTENSION;

        // add timestamp
        req.body['ts'] = ts;

        fs.exists(logfile, function(exists) {
            var line = JSON.stringify(req.body) + NEWLINE;
            if (!exists) {
                fs.writeFile(logfile, line, function(err) {
                    if(err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        console.log("+post request written to: " + logfile);
                        res.send(OKRESPONSE);
                    }
                })
            } else {
                fs.appendFile(logfile, line, function(err) {
                    if(err) {
                        console.log(err);
                        res.send(err);
                    } else {
                        console.log("+post request appended to: " + logfile); //" to: " + postRequestsLog);
                        res.send(OKRESPONSE);
                    }
                }); 
            }
        });
    } else {
        res.send(FORMATERROR);
    }
});

module.exports = router;