# HTTP Broker for IoT based on aedes

[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.png?v=103)](https://github.com/ellerbrock/open-source-badges/) [![Build Status](https://travis-ci.org/borokero/http.svg)](https://travis-ci.com/borokero/http)

HTTP Broker is based on [Ponte](https://github.com/eclipse/ponte) project a  great work of Matteo Collina but with AEDES core and service REST API for IoT or Internet of Things.

## Installation
* Clone this repo. `git clone https://github.com/borokero/http`
* Change directory. `cd http`
* `npm install`
* If you running in Development mode, for loading environment variable, it's necessary to change env.sample file name to .env and customize it.
* Run Example with: `npm start`
* for getting the content of a topic {url} use `curl http://localhost:3000/resources/hello`

* for Updating a topic {url} use `curl -X PUT -d "Hello World" http://localhost:3000/resources/hello`

## Contributing [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/dwyl/esta/issues)
Anyone with interest in or experience with the following technologies are encouraged to join the project.
And if you fancy it, join the [Telegram group](https://t.me/joinchat/TkI0VBxSU3swjFUT) here for Devs and say Hello!
# borokero-iot-http
