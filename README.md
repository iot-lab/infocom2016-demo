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
This script book some M3 nodes on the IoT-LAB testbed and deploy automatically an IPv6 6LoWPAN network.

1. choose randomly in the experiment nodes list a border router node
2. run on the frontend SSH a background tunslip6 process with border router node serial port in charge of connection to other IPv6 networks (eg: Cloud infrastructure)
3. flash ContikiOS border router firmware on the border router 
4. flash CoAP server firmware on the other nodes

It uses by default an IoT-LAB public ipv6 subnet (eg. 2001:660:5307:3100/64). If you want to understand the IoT-LAB 
testbed ipv6 subnetting you can read [this tutorial](https://www.iot-lab.info/tutorials/understand-ipv6-subnetting-on-the-fit-iot-lab-testbed/).

```
# Book 10 M3 nodes on the Grenoble site for 1 hour 
$ ./exp_iotlab.py --duration 60 --nodes 10,archi=m3:at86rf231+site=grenoble
# Book 10 M3 nodes (m3-1 -> m3-10) on the Grenoble site for 1 hour 
$ ./exp_iotlab.py --duration 60 --nodes grenoble,m3,1-10
# Book 10 M3 nodes on the Grenoble site for 1 hour and specify a new IPv6 subnet
$ ./exp_iotlab.py --duration 60 --nodes 10,archi=m3:at86rf231+site=grenoble --ipv6prefix 2001:660:5307:3103
```
    
At the end of the script get the border router public ipv6 address and test the connectivity. You also can visualize
the 6LoWPAN network topology with a request on the border router http server.

```
$ ping6 <br_ipv6_address>
$ curl -g "http://[<br_ipv6_address>]"
```
    
### Launch nodejs server

The node.js server get all CoAP servers IPv6 address and launch CoAP clients to "observe" CoAP server resources. These CoAP clients send websocket events (socket.io) when they receive update values. 

```
$ node server.js <br_ipv6_address>
```

### Configure IoT dashboard (Freeboard.io)

Open freeboard dashboard in your browser (eg. freeboard/index.html)

You can add a new datasource :

* Type : Node.js (Socket.io)
* Name : Choose a name 
* Server URL : http://localhost:8080
* NameSpace : m3 node uid (Coap server ipv6 address = &lt;ipv6_subnet&gt;::uid)
* Event : light|serial

Add a widget to visualize the datasource values ....

TODO complete




