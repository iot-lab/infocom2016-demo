#!/usr/bin/env python
# -*- coding:utf-8
"""This script submits an experiment with M3 nodes on
the FIT IoT-LAB testbed and deploys automatically a
6LoWPAN network .It chooses randomly a border router node
and runs on the frontend SSH a background tunslip6 process
 with its serial port. It also flashes a ContikiOS border
router firmware on it. Finally it flashes ContikiOS CoAP
 server firmware on the other nodes.
"""

import fabric.operations
import fabric.tasks
from fabric.api import env

from iotlabcli import experiment, get_user_credentials
from iotlabcli import helpers
import iotlabcli.parser.common
from iotlabcli.parser.experiment import exp_resources_from_str
import argparse
import time
import os
import json

PARSER = argparse.ArgumentParser()
iotlabcli.parser.common.add_auth_arguments(PARSER)
PARSER.add_argument('--name', default=None)
PARSER.add_argument('--duration', default=720, type=int)
PARSER.add_argument('--ipv6prefix', default='2001:660:5307:3100')
PARSER.add_argument('--nodes', action='append',
                               dest='nodes_list', required=True,
                               type=exp_resources_from_str,
                               help="experiment nodes list")


#FW_DIR = 'firmwares/contiki3/'
FW_DIR = 'firmwares/contiki27/'
FW_DICT = {
    'border_router': os.path.join(FW_DIR, 'border-router.iotlab-m3'),
    'coap_server': os.path.join(FW_DIR, 'er-coap-server.iotlab-m3'),
}


def _launch_tunslip6_interface(ipv6prefix, node):
    """ Launch tunslip6 interface on SSH frontend site
    with border router serial port (screen background mode) """
    cmd = 'screen -dm sudo tunslip6.py %s::1/64 -L -a %s -p 20000; sleep 1'
    fabric.operations.run(cmd % (ipv6prefix, node))


def _wait_exp(api, exp_id):
    """ Wait experiment started """
    time.sleep(10)  # wait 10s so that 'start date' is set
    timestamp = experiment.get_experiment(
            api, exp_id, 'start')['start_time']
    start_date = time.ctime(timestamp) if timestamp else 'Unknown'
    print "Start-date: %s" % start_date
    experiment.wait_experiment(api, exp_id)
    print "Exp-started: %s" % time.ctime(int(time.time()))


def _update_firm_nodes(api, exp_id, nodes_list, firmware_path):
    """ Update firmware on nodes list """
    files = helpers.FilesDict()
    files.add_firmware(firmware_path)
    files['nodes.json'] = json.dumps(nodes_list)
    return api.node_update(exp_id, files)


def _submit_exp(api, name, duration, resources):
    """ Submit experiment """
    return experiment.submit_experiment(api, name, duration,
                                        resources)['id']


def _get_exp_nodes(api, exp_id):
    """ Return experiment nodes properties """
    exp_res = {}
    res_list = experiment.get_experiment(api, exp_id, 'resources')['items']
    for res in res_list:
        exp_res[res['network_address']] = res
    return exp_res


def _get_exp_results(api, exp_id):
    """ Return a list of nodes with deployment success """
    return experiment.get_experiment(api, exp_id)['deploymentresults']['0']


def _teardown_exp(api, exp_id):
    """ Stop experiment an cleanup stuff maybe """
    if exp_id is not None:
        experiment.stop_experiment(api, exp_id)


def main():
    """ Start experiment"""
    opts = PARSER.parse_args()
    user, passwd = get_user_credentials(opts.username, opts.password)
    # Fabric configuration with env environment
    # use ~/.ssh/config file
    env.use_ssh_config = True
    # use IoT-LAB login for ssh connexion
    env.user = user
    api = iotlabcli.Api(user, passwd)
    exp_id = _submit_exp(api,
                         opts.name,
                         opts.duration,
                         opts.nodes_list)
    _wait_exp(api, exp_id)
    exp_nodes = _get_exp_nodes(api, exp_id)
    exp_results = _get_exp_results(api, exp_id)
    # We choose a border router (BR)
    br_node = exp_results.pop(0)
    # br_node = m3-<id>.site.iot-lab.info
    br_node_site = br_node.split('.')[1]
    fabric.tasks.execute(_launch_tunslip6_interface, opts.ipv6prefix,
                         br_node, hosts=[br_node_site])
    # flash BR firmware on the border router
    _update_firm_nodes(api, exp_id, [br_node], FW_DICT['border_router'])
    # flash Coap server firmware on the other nodes
    _update_firm_nodes(api, exp_id, exp_results, FW_DICT['coap_server'])
    print 'Border router :'
    print '%s - %s::%s' % (br_node,
                           opts.ipv6prefix,
                           exp_nodes[br_node]['uid'])


if __name__ == '__main__':
    main()
