$(document).ready(function() {

	// ??? FUTURE WORK
	// [ ] skip to next color once key is pressed
	// [ ] prevent same subsequent color pairs

	/* constants & variables */
	const VERSION = '1.2'; 						// to keep track of changes affecting log file format
	const DEBUG = false;

	const STATUS_COMPLETE = 'complete';			// indicates complete dataset on server
	const STATUS_INCOMPLETE = 'partial';		// indicates partial dataset (contingency plan in case user refreshes website)
	const MAX_ROUNDS = 10;
	const SECOND = 1000; //ms
	const COLLECT_DEMOGRAPHICS = false;			// optionally, demographics are collected
	const ENFORCE_USER_INPUT = true;
	const COUNTDOWN = 3;
	const PROGRESS_FRAMERATE = 100; 				// ms
	const KEYCODE_YES = 102;						// f
	const KEYCODE_NO = 106;							// j
	const TIME_TO_WAIT = 7000;						//time between rounds in ms, minus 3 seconds for the countdown screen
	const ROUND_DURATION = 10000;				// duration of one round

	// Farben in deutsch
	const COLORS = [
			['schwarz', '#000000'],
			['rot', '#ff0000'],
			['blau', '#3333ff'],
			['grün', '#009933'],
			['orange', '#ff9900'],
			['gelb', '#ffdd00']
	];

	const SPEEDS = [
			['A', 'A, 1200, 1000, 700, 850'],
			['B', 'B, 850, 1200, 700, 1000'],
			['C', 'C, 850, 700, 1000, 1200'],
			['D', 'D, 700, 1200, 850, 1000']
	];

	var settings = {},
		current_round = 1,
		color_pack = [],
		color_index = 0,
		current_color_item = [],
		progressbar_timer = {},
		stroop_in_progress = false,
		response_given = false,					// ensures that only first response is logged
		results = {
			'hits': 0,
			'false_positives': 0,
			'false_negatives': 0,
			'missed': 0,
			'congruent_rts': [],						// array for collecting reaction times for congruent items (hits only)
			'incongruent_rts': []					// array for collecting reaction times for incongruent items (hits only)
		},
		start_time;

	var results_summary = JSON.parse(JSON.stringify(results));	// array for the mean results of all rounds
	var allspeeds = ''; // string of all the available round speeds

	/* INIT */

	$('#participant_id').focus();
	//init variant dropdown from const SPEED (default = preselected)
	for (var i = 0; i < SPEEDS.length; i++) {
		var item = SPEEDS[i];
		if(item.length > 2 && item[2]=='default') {
			item = {value: SPEEDS[i][1], text: SPEEDS[i][0], selected: 'selected'}
		} else {
			item = {value: SPEEDS[i][1], text: SPEEDS[i][0]}
		}
	  	$('#speed').append($('<option>', item));
	}


	/* functions */

	/* randomly shuffle an array */

	function shuffle(array) {
		var top = array.length,
			tmp, current;

		if(top) {
			while(--top) {
				current = Math.floor(Math.random() * (top + 1));
				tmp = array[current];
				array[current] = array[top];
				array[top] = tmp;
			}
		}

		return array;
	}

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



	function create_data_log(status) {
		settings['variant'] = allspeeds.split(",")[0];
		return {
			'settings': settings,
			'data': results,
			'version': VERSION,
			'status': status
		}
	}

	function log_partial_data() {

		data = create_data_log(STATUS_INCOMPLETE);
		console.log(data);

		$.ajax ({
	        type: "POST",
	        url: '/',
	        dataType: 'json',
	        contentType: "application/json",
	        data: JSON.stringify(data),
	        success: function (result,status,xhr) {
	        	// console.log("Partial dataset saved!");
	        },
	        error: function(xhr,status,error) {
	        	// console.log("Error when transmitting partial data!");
	        }
	    });
	}

	function log_final_results() {

		data = create_data_log(STATUS_COMPLETE);

		$.ajax ({
	        type: "POST",
	        url: '/',
	        dataType: 'json',
	        contentType: "application/json",
	        data: JSON.stringify(data),
	        success: function (result,status,xhr) {
	        	if(result.status == 'ok') {
	        		$(".alert").html('<h4>Erfolg:</h4><p>Daten gespeichert.</p>');
	     			$(".alert").show();
	        	} else {
	        		$(".alert").html('<h3>There seems to be a problem with the log server!</h3><p>Please manually save the following data objects:</p><h4>Settings:</h4><p>' + JSON.stringify(settings) + '</p><h4>Data</h4>' + JSON.stringify(data) + '</p>');
	     			$(".alert").show();
	        	}
	        },
	        error: function(xhr,status,error) {
	        	console.log("Error when transmitting data!");
	        	console.log(status);
	        	console.log(error);
	        	$(".alert").html('<h3>There seems to be a problem with the log server!</h3><p>Please manually save the following data objects:</p><h4>Settings:</h4><p>' + JSON.stringify(settings) + '</p><h4>Data</h4>' + JSON.stringify(data) + '</p>');
	     		$(".alert").show();
	        }
	    });
	}



	function init_stroop() {

		// console.log('--init_stroop()');
		$('#progressbar').hide();
		color_index = 0;
		color_pack = [];
		// calculate number of stroop combinations, make sure it's even
		var combination_count = Math.trunc(settings.duration / settings.speed);
		if(combination_count % 2 == 1) {
			combination_count++;
		}

		//fill color_pack array, 50/50: congruent/incongruent
		for(var i=0; i<combination_count; i+=2) {

			var randomColor = COLORS[Math.floor(Math.random()*COLORS.length)]
				item_congruent = [randomColor[0], randomColor[1], true],
				j = COLORS[Math.floor(Math.random()*COLORS.length)],
				k = COLORS[Math.floor(Math.random()*COLORS.length)];

			while(j==k) {
				k = COLORS[Math.floor(Math.random()*COLORS.length)];
			}
			var item_incongruent = [j[0], k[1], false];

			color_pack.push(item_congruent);
			color_pack.push(item_incongruent);

		}

		// randomize the congruent and incongruent items
		color_pack = shuffle(color_pack);

		// shuffle as long as there are no duplicate items directly after each other
		var time_before_shuffle = Date.now();
		var duplicate_found = true;
		while (duplicate_found) {
			duplicate_found = false;
			for (var i=0; i<color_pack.length-1; i++) {
				if ((color_pack[i][0] == color_pack[i+1][0]) && (color_pack[i][1] == color_pack[i+1][1])) {
					color_pack = shuffle(color_pack);
					duplicate_found = true;
					i = color_pack.length;
					console.log("reshuffle!");
				}
			}
		}
		var time_lost = Date.now() - time_before_shuffle;
		console.log("time lost due to reshuffle: " + time_lost.toString() + " ms");



			function shuffle(array) {
		var top = array.length,
			tmp, current;

		if(top) {
			while(--top) {
				current = Math.floor(Math.random() * (top + 1));
				tmp = array[current];
				array[current] = array[top];
				array[top] = tmp;
			}
		}

		return array;
	}



		countdown(COUNTDOWN);

	}

	function start_stroop() {

		var canvas = $('#text_canvas');
		round_start_time = Date.now();

		clearInterval(progressbar_timer);

		if(color_index!=0 && !response_given) {
			results['missed']++;
		}

		if(color_index < color_pack.length) {

			stroop_in_progress = true;
			response_given = false;
			start_time = Date.now();

			current_color_item = color_pack[color_index];
			console.log(current_color_item);

			canvas.css('color', current_color_item[1]);
			canvas.html(current_color_item[0]);

			var decrement = 100 / (settings.speed / PROGRESS_FRAMERATE);

			$('#progressbar').show();
			$('#progressbar').css('width', '100%');
		    $("#progressbar").animate({
				width: '0%'
			}, parseInt(settings.speed-100), 'linear');

			setTimeout(function() {
				color_index++;
				start_stroop();
			}, settings.speed);

		} else {
			stroop_in_progress = false;
			// console.log('done');
			canvas.html('');
			$('#progressbar').hide();
			$('.stroop').hide();

			// console.log("RESULTS:");
			console.log(results);
			console.log(results_summary);
			// log partial results
			settings['round_start_time'] = round_start_time;
			settings['current_round'] = current_round;
			log_partial_data();
			results_summary['hits'] = results_summary['hits'] + results['hits'];
			results_summary['false_negatives'] = results_summary['false_negatives'] + results['false_negatives'];
			results_summary['false_positives'] = results_summary['false_positives'] + results['false_positives'];
			results_summary['missed'] = results_summary['missed'] + results['missed'];

			if(current_round<settings.rounds) {
				// init next round



				var rounds_left = parseInt(settings.rounds)-current_round;
				current_round++;
				console.log(current_round);

				// set speed for the current round
				settings['speed'] = parseInt(allspeeds.split(",")[current_round]);

				// console.log('round done');
				$('#rounds_left').html('Eine kleine Pause von ' + ((TIME_TO_WAIT/1000)+3) + ' Sekunden, dann geht es weiter.');


				$('.break').show();

				results['hits'] = 0;
				results['false_negatives'] = 0;
				results['false_positives'] = 0;
				results['congruent_rts'] = [];
				results['incongruent_rts'] = [];
				results['missed'] = 0;
				document.querySelector("#breakbutton").style.visibility = "hidden";
				setTimeout(function(){
					$(".alert").hide();
					$(".break").hide();
					$(".stroop").show();
					init_stroop();}
					, TIME_TO_WAIT);

			} else {
				// finished
				// console.log('finished');
				console.log(results);
				console.log(results_summary);
				results = results_summary;
				console.log(results);
				// log final results
				settings['round_start_time'] = 'summary';
				settings['speed'] = 'summary';
				settings['current_round'] = 'summary';
				log_final_results();

				var resultstring = '<ul><li>Richtig: ' + results['hits'] + '</li><li>Falsch positiv: ' + results['false_positives'] + '</li><li>Falsch negativ: ' + results['false_negatives'] + '</li><li>Verpasst: ' + results['missed'] + '</li>';

					if(results['congruent_rts'].length>0) {
						resultstring += '<li>Durchschnittliche Reaktionszeit bei Übereinstimmung: ' + Math.twodec(Math.avg(results['congruent_rts'])) + '</li>';
					}
					if(results['incongruent_rts'].length>0) {
						resultstring += '<li>Durchschnittliche Reaktionszeit bei Nicht-Übereinstimmung: ' + Math.twodec(Math.avg(results['incongruent_rts'])) + '</li>';
					}
					resultstring += '</ul>';

				$('#results').html(resultstring);
				$('.thanks').show();
			}

		}
	}

	function countdown(count) {

		var node = $('#counter');
		var txt = "Beginnt in <br />" + count;

		// console.log('-countdown(' + count + ')');

		if(count>0) {
			node.html(txt);
			node.show();

			setTimeout(function() {
				// console.log(count);
				countdown(--count);
			}, SECOND);

		} else {

			node.hide();
			start_stroop();

		}

	}

	/* hide future steps */

	$(".demographics, .instructions, .stroop, .break, .thanks, .alert").hide();
	document.getElementById("divrounds").style.display = "none";
	document.getElementById("divdurations").style.display = "none";
	var myDivSpeed = document.getElementById("divspeedlabel");
	myDivSpeed.innerHTML = "Variante";

	/* STROOP SETUP */

	$(".setup button").live("click", function() {

		if($('#participant_id').val() != '') {
			settings['participant_id'] = $('#participant_id').val();
		} else {
			settings['participant_id'] = 'unspecified';
		}

		allspeeds = $("#speed").val();
		settings['speed'] = parseInt(allspeeds.split(",")[1]);
		settings['duration'] = ROUND_DURATION;
		settings['rounds'] = allspeeds.split(",").length-1;
		//settings['rounds'] = $("#rounds").val();
		//settings['duration'] = $("#durations").val();

		if (ENFORCE_USER_INPUT && (settings['participant_id'] == "unspecified")) {
		     // do something
		     $(".alert").html('ERROR: Please provide a participant ID!');
		     $(".alert").show();

		} else {

			$(".setup").hide();
			$(".alert").hide();

			if(COLLECT_DEMOGRAPHICS) {
				$(".demographics").show();
			} else {
				$(".instructions").show();
			}

		}

		if(DEBUG) {
	     	console.log(settings);
	    }

	});

	/* step 1: Demographics */

	$(".demographics button").click(function() {

		settings['age'] = $('#age').val();
		settings['gender'] = $("input[name='gender']:checked").val();
		settings['profession'] = $('#profession').val();

		if (ENFORCE_USER_INPUT && (settings['age'] == "" || settings['gender'] == null || settings['profession'] == "")) {
		     // do something
		     $(".alert").html('ERROR: some data has not been provided!');
		     $(".alert").show();

		} else {

		$(".demographics").hide();
		$(".instructions").show();

		}

		if(DEBUG) {
			console.log(settings);
		}
	});

	/* STROOP TEST */

	$(".instructions button").live("click", function() {
		$(".alert").hide();

		$(".instructions").hide();
		$(".stroop").show();

		init_stroop();

	});

	$(".break button").live("click", function() {
		$(".alert").hide();

		$(".break").hide();
		$(".stroop").show();

		init_stroop();

	});

	/* KEY CONTROLS */

	$(document).keypress(function (event) {
		if(stroop_in_progress && !response_given) {

			if(event.charCode==KEYCODE_YES) {
				if(current_color_item[2]) {
					console.log('YES: correct');
					results['congruent_rts'].push(Date.now() - start_time);
					results_summary['congruent_rts'].push(Date.now() - start_time);
					results['hits']++;
				} else {
					console.log('YES: wrong');
					results['false_positives']++;
				}
				response_given = true;
			} else if(event.charCode==KEYCODE_NO) {
				if(current_color_item.length>2 && !current_color_item[2]) {
					console.log('NO: correct');
					results['incongruent_rts'].push(Date.now() - start_time);
					results_summary['incongruent_rts'].push(Date.now() - start_time);
					results['hits']++;
				} else {
					console.log('NO: wrong');
					results['false_negatives']++;
				}
				response_given = true;
			}
		}
		// else {
			// console.log('no stroop in progress');
		// }

	});

});
