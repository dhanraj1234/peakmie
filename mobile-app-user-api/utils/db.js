var PgClient = require('pg');

var pg = null;

module.exports = {
	connectPg: function(url, done) {
		if (pg) {
			return done(null, pg);
		}

		PgClient.connect(url, function(err, result) {
			if (err) {
				return done(err);
			}
			pg = result;
			done(null, pg);
		})
	},

	getPg: function() {
		return pg;
	}
}
