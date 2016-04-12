(function() {
	
	var nodeJSDatasource = function(settings, updateCallback) {

		var self = this,
			currentSettings = settings,
			url,
			socket,
			newMessageCallback;

		function onNewMessageHandler(message) {
			var objdata = JSON.parse(message);
			if (typeof objdata == "object") {
				updateCallback(objdata);
			} else {
				updateCallback(data);
			}
		}

		function discardSocket() {
			// Disconnect datasource websocket
			if (self.socket) {
				self.socket.disconnect();
			}
		}
		
		function connectToServer(url, nameSpace) {
			// Establish connection with server
			self.url = url;
                        self.nameSpace = nameSpace;
			self.socket = io.connect(self.url+'/'+self.nameSpace);

			self.socket.on('connect', function() {
				console.info("Connecting to Node.js at: %s/%s", self.url, self.nameSpace);
			});
			
			self.socket.on('connect_error', function(object) {
				console.error("It was not possible to connect to Node.js at: %s/%s", self.url, self.nameSpace);
			});
			
			self.socket.on('reconnect_error', function(object) {
				console.error("Still was not possible to re-connect to Node.js at: %s/%s", self.url, self.nameSpace);
			});
			
			self.socket.on('reconnect_failed', function(object) {
				console.error("Re-connection to Node.js failed at: %s/%s", self.url, self.nameSpace);
				discardSocket();
			});
			
		}


		function initializeDataSource() {
			// Reset connection to server
			discardSocket();
			connectToServer(currentSettings.url, currentSettings.nameSpace);
                        var eventName = currentSettings.eventName
                        // subscribe to event
                        self.newMessageCallback = onNewMessageHandler;
                        self.socket.on(eventName, function(message) {
                                self.newMessageCallback(message);
                        });
		}

		this.updateNow = function() {
			// Just seat back, relax and wait for incoming events
			return;
		};

		this.onDispose = function() {
			// Stop responding to messages
			self.newMessageCallback = function(message) {
				return;
			};
			discardSocket();
		};

		this.onSettingsChanged = function(newSettings) {
			currentSettings = newSettings;
			initializeDataSource();
		};
		
		initializeDataSource();
	};

	freeboard
			.loadDatasourcePlugin({
				type_name : "node_js_plugin",
				display_name : "Node.js (Socket.io)",
				description : "A real-time stream datasource from node.js servers using socket.io.",
				external_scripts : [ "https://cdn.socket.io/socket.io-1.4.5.js" ],
				settings : [
						{
							name : "url",
							display_name : "Server URL",
							description : "(Optional) In case you are using custom namespaces, add the name of the namespace (e.g. chat) at the end of your URL.<br>For example: http://localhost/chat",
							type : "text",
						},
                                                { 
                                                        name : "nameSpace",
                                                        display_name : "Namespace",
                                                        description : "The namespace you want this datasource to subscribe to.",
                                                        type : "text",
                                                },
						{
							name : "eventName",
							display_name : "Event Name",
							description : "The name of the event you want this datasource to subscribe to.",
							type : "text",
						}],
				newInstance : function(settings, newInstanceCallback,
						updateCallback) {
					newInstanceCallback(new nodeJSDatasource(settings,
							updateCallback));
				}
			});

         freeboard.loadWidgetPlugin({
		"type_name"   : "indicator_robot_plugin",
		"display_name": "Indicator Robot",
                "description" : "Indicator robot tracking",
		// **external_scripts** : Any external scripts that should be loaded before the plugin instance is created.
		"external_scripts": [
			"http://mydomain.com/myscript1.js", "http://mydomain.com/myscript2.js"
		],
		"fill_size" : true,
		"settings"    : [
			{
				"name"        : "acc_peak",
				"display_name": "value",
				"type"        : "calculated"
			}
		],
		// Same as with datasource plugin, but there is no updateCallback parameter in this case.
		newInstance   : function(settings, newInstanceCallback)
		{
			newInstanceCallback(new RobotPlugin(settings));
		}
	});

	
	freeboard.addStyle('.indicator-light', "border-radius:50%;width:22px;height:22px;border:2px solid #3d3d3d;margin-top:5px;float:left;background-color:#222;margin-right:10px;");
        freeboard.addStyle('.indicator-light.on', "background-color:#FFC773;box-shadow: 0px 0px 15px #FF9900;border-color:#FDF1DF;");
	
	var RobotPlugin = function(settings)
	{
		var self = this;
		var currentSettings = settings;
                var indicatorElement = $('<div class="indicator-light"></div>');
		var isPeak = false;

		function resetState() {
                        indicatorElement.toggleClass("on", false);
                }

		function updateState() {
            		indicatorElement.toggleClass("on", isPeak);
                        // wait 3 seconds
			setTimeout(resetState, 3000)
		}

		self.render = function(containerElement) {
                        $(containerElement).append(indicatorElement);
		}

		self.getHeight = function() {
			return 1;
		}

		self.onSettingsChanged = function(newSettings) {
			currentSettings = newSettings;
		}

		self.onCalculatedValueChanged = function(settingName, newValue) {
			if (settingName == "acc_peak") {
                		isPeak = Boolean(newValue);
            		}
			updateState();
		}

		self.onDispose = function() {
		}
	}

}());
