var d10 = require("./d10"),
	exec = require('child_process').exec;

exports.oggLength = function(file,cb) {
	var ogginfo = exec(d10.config.cmds.ogginfo+" "+file,{maxBuffer: 2000*1024},function(err,stdout,stderr) {
		if ( stdout.length ) {
			var back = stdout.match(/Playback length: ([0-9]+)m:([0-9]+)/);
			if ( !back ) {
				cb("no match");
				return ;
			}
			if ( back.length > 2 ) {
				return cb(null,back);
			}
		}
		if ( err !== null ) {
			cb(err);
		} else {
			cb("no match");
		}
	});
};
/*
exports.flacLength = function(file,cb) {
	var pipe = exec(d10.config.cmds.metaflac+" --list "+file,{maxBuffer: 2000*1024},function(err,stdout,stderr) {
		if ( stdout.length ) {
			var samplerate = stdout.match(/sample_rate: ([0-9]+)/);
			var totalsamples = stdout.match(/total samples: ([0-9]+)/);
			if ( !samplerate || !totalsamples ) {
				cb("no match");
				return ;
			}
			if ( samplerate.length > 1 && totalsamples.length > 1  ) {
				samplerate = parseInt(samplerate[1],10);
				totalsamples = parseInt(totalsamples[1],10);
				if ( !isNaN(samplerate) && !isNaN(totalsamples) ) {
					return cb(null,Math.floor( (totalsamples/samplerate) ) );
				}
			}
		}
		if ( err !== null ) {
			cb(err);
		} else {
			cb("no match");
		}
	});
};
*/
exports.id3tags = function(file, cb, secondTry) {
	var utrac_opts = " -t UTF-8";
	if ( secondTry ) {
		utrac_opts += " -f LATIN1";
	}
	var tagsPipe = exec(d10.config.cmds.taginfo+" "+file+" | "+d10.config.cmds.utrac+utrac_opts,{maxBuffer: 2000*1024},function(err,stdout,stderr) {
		if ( err )	{
			if ( err.message.indexOf("error 303") > -1 ) {
				return cb(null,{});
			} else if ( !secondTry && err.message.indexOf("Command failed: Segmentation fault") > -1 ) {
				return exports.id3tags(file,cb,true);
			}
			return cb(null,{});
		}
		var tagnames = ['ALBUM','TRACK','ARTIST','TITLE','GENRE','YEAR'],
			tags = {};
		stdout.split("\n").forEach(function(v,k) {
			var tag = v.split("=",2);
			if ( tagnames.indexOf(tag[0]) >=0 ) {
				tags[tag[0]] = tag[1].replace(/^\s+/,"").replace(/\s+$/,"").replace(/"/g,"");
				if ( tag[0] == "TRACK" ) {
					tags["TRACKNUMBER"] = tags[tag[0]];
				} else if ( tag[0] == "YEAR" ) {
					tags["DATE"] = tags[tag[0]];
				}
			}
		});
		d10.log("debug",tags);
		cb(null,tags);
	});
};

exports.oggtags = function(file, cb) {
	var tagsPipe = exec(d10.config.cmds.vorbiscomment+" -l "+file+" | "+d10.config.cmds.utrac+" -t UTF-8",{maxBuffer: 2000*1024},function(err,stdout,stderr) {
		if ( err )	{
			if ( err.message.indexOf("error 303") > -1 ) {
				return cb(null,{});
			}
			return cb(err);
		}
		var tags = {};
		d10.log("debug","TAGS bruts: ",stdout);
		stdout.split("\n").forEach(function(v,k) {
			var tag = v.split("=",2);
			if ( tag.length > 1 ) {
				tags[tag[0]] = tag[1].replace(/^\s+/,"").replace(/\s+$/,"").replace(/"/g,"");
			}
		});
		d10.log("debug",tags);
		cb(null,tags);
	});
};

exports.flactags = function(file,cb) {
	d10.log("launching flactags");
	var tagsPipe = exec(d10.config.cmds.metaflac+" --list "+file+" | grep -F comment[ | "+d10.config.cmds.utrac+" -t UTF-8",{maxBuffer: 2000*1024},function(err,stdout,stderr) {
		if ( err )	{
			d10.log("err",err);
			if ( err.message.indexOf("error 303") > -1 ) {
				return cb(null,{});
			}
			return cb(err);
		}
		var tags = {};
		d10.log("debug","TAGS bruts: ",stdout);
		stdout.split("\n").forEach(function(v,k) {
			var tagline = v.split(": ",2);
			d10.log("tagline: ",tagline);
			if ( tagline.length == 2 ) {
				var tag = tagline[1].split("=",2);
				if ( tag.length > 1 ) {
					tags[tag[0]] = tag[1].replace(/^\s+/,"").replace(/\s+$/,"").replace(/"/g,"");
				}
			}
		});
		d10.log("debug","FLAC tags");
		d10.log("debug",tags);
		cb(null,tags);
	});
};

exports.escapeShellArg = function(s) {
	return "'"+s.replace(/'/g, "'\\''")+"'";
};

exports.setOggtags = function(file, tags, cb) {
	if ( !d10.count(tags) ) {
		return cb(null,tags);
	}
	var args = [];
	for ( var index in tags ) {
		args.push("-t "+exports.escapeShellArg(index+"="+tags[index]));
	}
	var tagsPipe = exec(d10.config.cmds.vorbiscomment+" -s "+args.join(" ")+" "+file,function(err,stdout,stderr) {
		if ( err )	{
			return cb(err);
		}
		cb(null,tags);
	});
};
