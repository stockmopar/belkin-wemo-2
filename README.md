#belkin-wemo-2

##Belkin Wemo Actuator and Sensor Driver
for Belkin Plugin Socket 1.0 PIR and Switch

###Overview
Discovers and provides control/feedback of Belkin WeMo devices on your network segment.

###Features
1. Actually discovers and connects to devices on your network.
2. Should be able to follow a device if it's IP or Port number change (port changes are a supposed security feature by belkin)
3. Can adjust the polling time via the config file
4. Includes an amazing amount of hackery - but still mostly works.

###Use
Luckily the Ninja Gods have permitted a WeMo device type for controllee sockets, and a PIR type exists for the motion sensor.

Once the driver is installed, it will locate and configure any Belkin WeMo devices. That's all there is to it.

###Important Notes
Delete all other "WeMo" devices, including the one that came with the NinjaBlock that doesn't work. DO IT.

When your device(s) is discovered, the dashboard widget is automatically created. The devices are not tracked through reboot - but given their UUID does not change this is not an issue.

I am yet to create a GUI for the configuration - you will just have to trust me that it is there.

Things of note in the configuration file are that the rate of polling can be adjusted.

###Wiki Entry
http://wiki.ninjablocks.com/drivers/5353b30ad8b9a20002000a36

###Forum Post
http://forums.ninjablocks.com/index.php?p=/discussion/2732/belkin-wemo-driver

###Installation

Install this Driver with:

ninja_install -g https://github.com/troykelly/belkin-wemo-2 (Requires ninja toolbelt)

####Manual Installation

1. cd into your drivers directory (/opt/ninja/drivers on your Ninja Block)
2. git clone https://github.com/troykelly/belkin-wemo-2.git
3. cd belkin-wemo-2 && npm install

###Issue Tracking
Please report bugs, issues, feature requests via the GitHub issue tracker. It's what it's for...

https://github.com/troykelly/ninja-itachir/issues

###History

v0.0.1

Status change polling.

Able to learn new commands.

v0.0.0

Connect, check status.