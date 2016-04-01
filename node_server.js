/*
 * Configurations and helpers
 */
var coAPPath = ["light", "serial", "acc"];
//var coAPPath = ["light", "serial"];
//var coAPPath = ["serial"];
var serverPort = 8080;

/*
 * Project dependencies
 */
var io = require('socket.io')(serverPort);
var coap = require('coap');
var url = require('url');
var http = require('http');

if (process.argv.length <= 2) {
    console.log("Usage: " + __filename + " br_ipv6");
    process.exit(-1);
}
 
var brHostName = process.argv[2];
var networkSubnet = brHostName.split('::')[0]

/*
 * Collect data
 */

function getCoAPClients() {
   req = http.request({host : brHostName}, function(res) {
         var clients = [];
         res.on('data', function (chunk) {
             var line = chunk.toString();
             if (line.lastIndexOf(networkSubnet, 0) == 0) {
                 line = line.replace(/(\n)/gm,"");
                 clients.push(line.split('/')[0]);
             };
         });
         res.on('end', function() {
             for (var i = 0; i < clients.length; i++) { 
                for (var j = 0; j < coAPPath.length; j++) {
                    var coAPClient = new CoAPClient(clients[i], coAPPath[j]); 
                    coAPClient.get();
                }
             } 
         });
         
   });
   req.end();
}

var CoAPClient = function (hostname, path) {
    this._hostname = hostname;
    this._path = path;
};

CoAPClient.prototype.get = function () {
    var self = this;
    //coap get -o coap://[2001:660:5307:31C0::c269]:5683/light
    var urlString = 'coap://['.concat(this._hostname).concat(']:5683/').concat(this._path);
    var coapUrl = url.parse(urlString);
    coapUrl.observe = true;
    coapUrl.method = 'GET';
    req = coap.request(coapUrl);
    req.on('response', function(res) {
           res.on('data', function (chunk) {
               var data = JSON.parse(chunk.toString());
               var json = {
                   value: data.value,
                   time_stamp: new Date().getTime()
               }
               // socket io : namespace = node uid / eventName = path
               //var nameSpace = (self._hostname.split('::'))[1];
               var nameSpace = data.node;
               var eventName = self._path;
               io.of('/'+nameSpace).emit(eventName, JSON.stringify(json));
               console.log("New event : Hostname=%s Namespace=%s EventName=%s Value=%s", self._hostname, nameSpace, eventName, data.value);
           });
    });
    req.end();
}


/*
 * Handle Sockets.io connections
 */

// Event handlers
io.sockets.on('connection', function(socket) {
	
    console.log("New client connected.");
        
    // On disconnect events
    socket.on('disconnect', function(socket) {
    	console.log("Client disconnect");
    });
    
});


/*
 *  Run
 */
 
console.log("Starting Node.js server on port " + serverPort);
getCoAPClients();
