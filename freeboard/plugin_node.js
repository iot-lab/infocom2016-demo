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
				console.error("It was not possible to connect to Node.js at: %/%ss", self.url, self.nameSpace);
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
				type_name : "node_js",
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
}());
