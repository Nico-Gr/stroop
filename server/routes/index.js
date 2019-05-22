var express = require('express'),
	router = express.Router(),
	fs = require('fs'),
	yaml = require('yaml-config');

var settings = yaml.readConfig(__dirname + '/../config/server-config.yml'),
		LOGDIRECTORY = require('os').homedir() + "/stroop-logs/";
    //LOGDIRECTORY = __dirname + '/../' + settings.logDirectory,
    LOGFILEEXTENSION = '.log',
		LOGFILEEXTENSION_NOTJSON = '.csv',
    OKRESPONSE = {'status': 'ok'};
    FORMATERROR = {'status': 'error', 'info': 'malformed json request'};

		// helper function to calculate avg of array
		Math.avg = function(input) {
		  this.output = 0;
		  for (this.i = 0; this.i < input.length; this.i++) {
		    this.output+=Number(input[this.i]);
		  }
		  return this.output/input.length;
		}

		Math.twodec = function(input) {
			return Math.round(input * 100) / 100
		}


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
				logfile_nojson = LOGDIRECTORY + participant_id + LOGFILEEXTENSION_NOTJSON;

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

				fs.exists(logfile_nojson, function(exists) {
				  	var line_header_nojson = 'participant_id;speed;duration;rounds;current_round;variant;hits;false_positives;false_negatives;missed;congruent_mean;incongruent_mean;congruent_rts;incongruent_rts;status;time;timestamp' +	NEWLINE;
						var datum = new Date();
						var line_nojson =
															req.body['settings']['participant_id'] + ';' +
															req.body['settings']['speed'] + ';' +
															req.body['settings']['duration'] + ';' +
															req.body['settings']['rounds'] + ';' +
															req.body['settings']['current_round'] + ';' +
															req.body['settings']['variant'] + ';' +
															req.body['data']['hits'] + ';' +
															req.body['data']['false_positives'] + ';' +
															req.body['data']['false_negatives'] + ';' +
															req.body['data']['missed'] + ';' +
															Math.twodec(Math.avg(req.body['data']['congruent_rts'])) + ';' +
															Math.twodec(Math.avg(req.body['data']['incongruent_rts'])) + ';' +
															req.body['data']['congruent_rts'] + ';' +
															req.body['data']['incongruent_rts'] + ';' +
															req.body['status'] + ';' +
															datum.toUTCString() + ';' +
															req.body['ts'] + ';' +
															NEWLINE;

						// write csv log file
						if (!exists) {
                fs.writeFile(logfile_nojson, line_header_nojson + line_nojson, function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("+post request written to: " + logfile_nojson);
                    }
                })
            } else {
                fs.appendFile(logfile_nojson, line_nojson, function(err) {
                    if(err) {
                        console.log(err);
                    } else {
                        console.log("+post request appended to: " + logfile_nojson); //" to: " + postRequestsLog);
                    }
                });
            }
        });

    } else {
        res.send(FORMATERROR);
    }
});

module.exports = router;
