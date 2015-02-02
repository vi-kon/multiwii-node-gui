# MultiWii Node GUI

This package is for MultiWii Fly Controller GUI based on [meteor](https://www.meteor.com/). This GUI has two layers, server and client. The server layer can accept multiple connection from multicopter clients and log data. The client layer is a simple webpages, where user can access multicopter settings, live data, map, or even control via keyboard.

Main features:

* **Fly**
	* Control multicopter form big distance via TCP/IP protocol
	* Live video
	* Show active sensors
	* Show and switch current modes (boxes)
	* Show battery status (TODO)
* **Map**
	* Show GPS status
	* Show multicopter position on map
	* Add new, modify or delete waypoints during flight (TODO)
* **Sensor graph**
	* Display live sensor data, RC data, motor throttle
* **Flight tuning**
	* Read and write PID settings (TODO)
	* Set rate and expo settings (TODO)

## Requirements

### Software

* web server with meteor support
* meteor packages:
  * meteor-platform
  * autopublish
  * insecure
  * less
  * nemo64:bootstrap
  * iron:router
  * alamont:chartjs
  * hedcet:noty
  * u2622:persistent-session
  * arunoda:streams
  * mrt:googlemaps

## Installation

Copy project files to destination directory in your server.

For example `/home/{username}/mwn-node-server/`.

## Configuration

No configuration file yet.

## Usage

To start server execute `meteor` inside project's root directory.

After it server open `3002` port to listen client connection and starts web server. The web server starts at `3000` port.

Now in web browser you can open `http://{server ip}:3000/`

## License

This package is licensed under the MIT License