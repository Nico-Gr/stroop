# Stroop Test

An implementation of the Stroop Test with difficulty settings and logging capabilities.

## General information
From the respective [Wikipedia article](https://en.wikipedia.org/wiki/Stroop_effect#Stroop_test):
> The Stroop effect has been used to investigate a person's psychological capacities; since its discovery during the twentieth century, it has become a popular neuropsychological test. In psychology, the Stroop effect is a demonstration of interference in the reaction time of a task.
When the name of a color (e.g., "blue", "green", or "red") is printed in a color which is not denoted by the name (i.e., the word "red" printed in blue ink instead of red ink), naming the color of the word takes longer and is more prone to errors than when the color of the ink matches the name of the color.
The effect is named after John Ridley Stroop, who first published the effect in English in 1935.

## Installation
[download](https://github.com/Til-D/stroop/archive/master.zip) the ZIP file, unzip it, install node, express, and other dependencies specified in the package.json, fire up the express server and navigate to localhost.

For detailed instruction on how to install express, go to [https://expressjs.com/](https://expressjs.com/)

## Stroop Tasks Settings 

### in the UI:
- number of rounds
- duration of each round
- stroop speed

### via code parameters
in [default.js](https://github.com/Til-D/stroop/blob/master/server/public/javascripts/default.js):
- COLLECT_DEMOGRAPHICS: optionally, demographic information is collected
- KEYCODE_YES: sets the match key
- KEYCODE_NO: sets the mismatch key
- COLORS: sets the colors and corresponding color codes (currently: 6)
- SPEEDS: sets the speed selection
- DURATIONS: sets the selection for the duration of each stroop task

## Author
- [Tilman Dingler](https://github.com/Til-D/)

## Used libraries and utilities
- [jQuery](http://jquery.com/) ([MIT license](https://github.com/jquery/jquery/blob/master/MIT-LICENSE.txt))
- [jQuery UI](http://jqueryui.com/) ([MIT license](http://www.opensource.org/licenses/mit-license) or [GPL v2](http://opensource.org/licenses/GPL-2.0))
- [express](https://expressjs.com/) ([Creative Commons](https://creativecommons.org/licenses/by-sa/3.0/us/))

## License
This Stroop Test implementation is published under the [MIT license](http://www.opensource.org/licenses/mit-license) and [GPL v3](http://opensource.org/licenses/GPL-3.0).