
module.exports = {
    env: {
		"development": {
			"sessionName": "peakmie_admin_dev",
			"secret": "c6bc38fff44dab0b94eaf000ad613810837db1fc3ca6aa154295faaa2da70f03",
			"env": "development",
			"secure": false,
			"port": 1418,
			"bodyLimit": "200kb",
			"corsHeaders": [
				"Link"
			],
			"accessLogFile": "app_access.log",
			"errorLogFile": "app_error.log",
			"logDirectory": "./logs_dev"
		},
		"production": {
			"sessionName": "peakmie_admin_prod",
			"secret": "503b4a12eb4b5b664b80c7746faa4879ff580d55577a44b5aeac6604675d7ef8",
			"env": "production",
			"secure": true,
			"port": 1418,
			"bodyLimit": "200kb",
			"corsHeaders": [
				"Link"
			],
			"accessLogFile": "app_access.log",
			"errorLogFile": "app_error.log",
			"logDirectory": "./logs_prod"
		}
	}
}