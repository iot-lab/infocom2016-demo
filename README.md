# infocom2016-demo

INFOCOM2016 ipv6 demonstration description ...

### Requirement

* Install IoT-LAB tools :
    ```
    $ apt-get install python-pip git python-dev python-ecdsa fabric
    $ pip install -e git+https://github.com/iot-lab/cli-tools.git#egg=iotlabcli[secure]
    ```
    
* Install node.js and dependencies
    ```
    $ apt-get install nodejs npm
    $ npm install socket.io coap
    ```

* Install lighttpd and [freeboard.io](https://freeboard.io/) dashboard
   ```
   $ apt-get install lighttpd
   $ cd /var/www
   $ git clone https://github.com/Freeboard/freeboard.git
   ```

* Configure IoT-LAB authentication
   ```  
   $ auth-cli -u <iotlab_login>
   $ experiment-cli info -li
   ```
   
* Configure IoT-LAB SSH frontend access
   ```
   # Generate a ssh key pair
   $ ssh-keygen -f ~/.ssh/id_iotlab_rsa
   # Edit a ssh config file
   $ cat ~/.ssh/config
   Host <iotlab_site_name>
        HostName  <iotlab_site_name>.iot-lab.info
        User <iotlab_login>
        IdentityFile ~/.ssh/id_iotlab_rsa
    ```
    Upload your public ssh key (~/.ssh/id_iotlab_rsa.pub) on the IoT-LAB website        
    ```
    # Test ssh connexion
    ssh <iotlab_site_name>
    ```

### Launch IoT-LAB experiment
We book some M3 nodes on the IoT-LAB testbed and deploy automatically an IPv6 6LoWPAN network.

1. choose randomly in the experiment nodes list a border router node
2. run on the frontend SSH a background tunslip6 process with border router node serial port in charge of connection to other IPv6 networks (eg: Cloud infrastructure)
3. flash ContikiOS border router firmware on the border router 
4. flash ContikiOS CoAP server firmware on the other nodes

It uses by default an IoT-LAB public ipv6 subnet (eg. 2001:660:5307:3100/64). If you want to understand the IoT-LAB 
testbed ipv6 subnetting you can read [this tutorial](https://www.iot-lab.info/tutorials/understand-ipv6-subnetting-on-the-fit-iot-lab-testbed/).

```
# Book 10 M3 nodes on the Grenoble site for 1 hour 
$ ./exp_iotlab.py --duration 60 --nodes 10,archi=m3:at86rf231+site=grenoble
# Book 10 M3 nodes (m3-1 -> m3-10) on the Grenoble site for 1 hour 
$ ./exp_iotlab.py --duration 60 --nodes grenoble,m3,1-10
# Book 10 M3 nodes on the Grenoble site for 1 hour and specify an IPv6 subnet
$ ./exp_iotlab.py --duration 60 --nodes 10,archi=m3:at86rf231+site=grenoble --ipv6prefix 2001:660:5307:3103
```
    
The script returns the border router public ipv6 address and you can test the connectivity. You also can visualize
the 6LoWPAN network topology (CoAP servers public IPv6 address) with a http request on the border router.

```
$ ping6 <br_ipv6_address>
$ curl -g "http://[<br_ipv6_address>]"
<html><head><title>ContikiRPL</title></head><body>
...
Routes<pre>
2001:660:5307:3100::9176/128 (via fe80::9176) 16711393s
2001:660:5307:3100::b868/128 (via fe80::b868) 16711393s
```
You can see in the section Routes the CoAP servers ipv6 address list ( &lt;ipv6_subnet&gt;::&lt;m3_node_uid&gt;) of your 6LoWPAN network.

    
### Launch nodejs server

The node.js server get all CoAP servers IPv6 address and launch CoAP clients to "observe" CoAP server resources. These CoAP clients send Websockets events (Socket.io) when they receive update values. 
```
$ node node_server.js <br_ipv6_address>
```

It separates CoAP clients communication channel with Websockets namespaces :
```
# namespace = m3 node uid = end of the CoAP server ipv6 address
# eventname = CoAP resource like light or serial
io.of(/<namespace>).emit(<eventname>, value)
```

### Configure IoT dashboard (Freeboard.io)

Copy datasource plugin to connect freeboard.io dashboard to real-time node.js server. It subscribe to real-time event using
WebSockets (Sockets.io)

```
$ cp freeboard/plugin_node.js /var/www/freeboard/plugins/thirdparty/
```

Edit your freeboard.io main HTML file and add the plugin to the header

```
$ vi /var/www/freeboard/index.html
<script type="text/javascript">
    head.js(
            ...
            "js/freeboard/plugins/plugin_node.js",
```

Open dashboard in your browser

```
http://<your_cloud_instance>/freeboard
```

You can add a new datasource :

* Type : Node.js (Socket.io)
* Name : Choose a name 
* Server URL : http://localhost:8080 (Node.js server address)
* NameSpace : m3 node uid
* Event : light|serial

Add a widget to visualize the datasource values.

TODO complete with widget screenshot




