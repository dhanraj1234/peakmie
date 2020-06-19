module.exports = {
	env: {
		"development": {
			"sessionName": "peakmie_dev",
			"secret": "fda23ac925a39b393d0799d2ada759e03add920f2a7d45da82cbea9177c1c395",
			"env": "development",
			"secure": false,
			"port": 1416,
			"bodyLimit": "200kb",
			"corsHeaders": [
				"Link"
			],
			"accessLogFile": "app_access.log",
			"errorLogFile": "app_error.log",
			"logDirectory": "./logs_dev",
			"postgresdb": "postgres://postgres:123@128.199.98.106/peakmie-mobile-appdb-dev"
		},
		"production": {
			"sessionName": "peakmie_prod",
			"secret": "234afe6a0ac174cca796cbd729ff556c337f643564d819287250435c26c43ee3",
			"env": "production",
			"secure": true,
			"port": 1416,
			"bodyLimit": "200kb",
			"corsHeaders": [
				"Link"
			],
			"accessLogFile": "app_access.log",
			"errorLogFile": "app_error.log",
			"logDirectory": "./logs_prod",
			"postgresdb": "postgres://postgres:123@128.199.98.106/peakmie-mobile-appdb-dev"
		}
	}
}