// * ———————————————————————————————————————————————————————— * //
// * 	juice helpers
// *	TODO: nicer logging
// * ———————————————————————————————————————————————————————— * //
var juice_helpers = function () {}

// vendor dependencies
var dircompare = require('dir-compare');
var path = require('path')
var fs = require('fs')
var ncp = require('ncp').ncp // Handles copying files

// local dependencies
var kiska_logger = require(ENDURO_FOLDER + '/libs/kiska_logger')


juice_helpers.prototype.diff_with_cms = function(folder) {
	return new Promise(function(resolve, reject){

		var options = {compareSize: true};
		var path1 = path.join(CMD_FOLDER, 'cms');
		var path2 = path.join(CMD_FOLDER, folder);
		var res = dircompare.compareSync(path1, path2, options);

		// console.log('equal: ' + res.equal);
		// console.log('distinct: ' + res.distinct);
		// console.log('local: ' + res.left);
		// console.log('juiced: ' + res.right);
		// console.log('differences: ' + res.differences);
		// console.log('same: ' + res.same);
		res.diffSet.forEach(function (entry) {
			console.log(entry.type1, entry.type2)
			var state = {
				'equal' : ' == ',
				'left' : ' -> ',
				'right' : ' <- ',
				'distinct' : ' <> '
			}[entry.state];
			var name1 = entry.name1 ? entry.name1 : '';
			var name2 = entry.name2 ? entry.name2 : '';

			// files are different
			if(entry.state == 'distinct') {
				console.log(name1 + ' ' + (entry.date1 > entry.date2 ? 'local file newer' : 'remote file newer'))
				//console.log(format('%s(%s)[%s]%s%s(%s)[%s]', name1, entry.type1, entry.date1, state, name2, entry.type2, entry.date2));
			}
		});
	})
}

juice_helpers.prototype.spill_newer = function(folder) {
	return new Promise(function(resolve, reject){
		diff = get_diff(folder)

		copy_stack = []

		diff.diffSet.forEach(function (entry) {

			if(entry.type1 != 'directory') {
				// remote is newer
				if(entry.date2 > entry.date1) {
					kiska_logger.twolog('newer in juicebar', entry.name2)
					copy_stack.push(copy_file_to_cms(entry))
				}

				// only on remote
				if(entry.state == 2) {
					kiska_logger.twolog('new file in juicebar', entry.name2)
					copy_stack.push(copy_file_to_cms(entry))
				}
			}
		})

		Promise.all(copy_stack)
			.then(() => {
				resolve()
			})
	})
}

function get_diff(folder) {
	var path1 = path.join(CMD_FOLDER, 'cms');
	var path2 = path.join(CMD_FOLDER, folder, 'cms');
	return dircompare.compareSync(path1, path2, {compareSize: true});
}

function copy_file_to_cms(entry) {
	return new Promise(function(resolve, reject){

		ncp(path.join(entry.path2, entry.name2), path.join(entry.path1, entry.name1), () => {
			resolve()
		})
	})
}

module.exports = new juice_helpers()