#!/usr/bin/env python
import sys
import argparse


parser = argparse.ArgumentParser(description='Generate Monitor Page',epilog='e.g. : python gen_page.py -u 192.168.0.20 -p 8334 8335 8336')

parser.add_argument("-u", "--url", help="server url",required=True,action="store")
parser.add_argument("-p", "--port", nargs="+",help="port",required=True,action="store")

if len(sys.argv)==1:
    parser.print_help()
    sys.exit(1)

args = parser.parse_args()

ports =  args.port
url = args.url

with open("demo.html") as demo:
    template = demo.read()

for port in ports:
    server_url='http://'+url+':'+port
    addr=url.split('.')[-2:]
    addr.append(port)
    fname="-".join(addr) + '.html'
    content = template.replace('SERVER_URL',server_url)
    print "Generate file "+fname
    with open(fname,"w") as output:
        output.write(content)






