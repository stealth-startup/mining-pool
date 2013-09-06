#!/usr/bin/env python
import requests
import sys
import argparse
from argparse import RawTextHelpFormatter

parser = argparse.ArgumentParser(description='Controller Configuration\r\nDepends on module "requests":sudo easy_install requests',epilog='e.g. : python config.py -r 100 -s 1 -e 100 -u 192.168.0.2 -p 8334 -w tank_1',formatter_class=RawTextHelpFormatter)
parser.add_argument("-r", "--rack", help="192.168.rack.start~end",required=True,action="store")
parser.add_argument("-s", "--start", help="192.168.rack.start~end",required=True,action="store")
parser.add_argument("-e", "--end", help="192.168.rack.start~end",required=True,action="store")
parser.add_argument("-u", "--url", help="mining url",required=True,action="store")
parser.add_argument("-p", "--port", help="port",required=True,action="store")
parser.add_argument("-w", "--worker", help="worker name",required=True,action="store")

if len(sys.argv)==1:
    parser.print_help()
    sys.exit(1)

args = parser.parse_args()

rack        = args.rack
board_begin = args.start
board_end   = args.end
server      = args.url+','+args.url
port        = args.port+','+args.port
worker      = args.worker

boards=range(int(board_begin),int(board_end)+1)

count = 1 

for board in boards:
    print "Config Tank %d Board %d" % (int(rack),int(board))
    data = {
        'JMIP' : '192.168.' + str(rack) + '.' + str(board),
        'JMSK' : '255.255.0.0',
        'JGTW' : '192.168.1.1',
        'PDNS' : '8.8.8.8',
        'MURL' : server,
        'MPRT' : port,
        'USPA' : 'asicminer_' + worker + ':wasabi,asicminer_' +  worker + ':wasabi',
        'JGTV' : '0',
        }
    print data
    url     = 'http://192.168.1.254:8000/Upload_Data'
    while(True):
        try:
            r = requests.post(url, data)
            print r.content
            count+=1
        except(KeyboardInterrupt, SystemExit):   
            print '\nProgram Stopped Manually!'
            raise
        except:
            print "Cannot connect to rack " + str(rack) + ", board " + str(board)
            continue
        break

