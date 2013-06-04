import sys
import yaml
from urllib2 import urlopen
import re
import time


def cur_time():
    return time.strftime("%Y-%m-%d %H:%M:%S",time.localtime())

def load_yaml(fname):
    f=open(fname)
    data=yaml.safe_load(f)
    f.close()
    return data

def make_range(s):
    return eval('range'+s)

def parse(obj):
    if isinstance(obj,str):
        return make_range(obj)
    else:
        return [obj]

def make_ip(a,b):
    return 'http://192.168.'+str(a)+'.'+str(b)+':8000'

failed = []

def get_info(ip):
    print 'connecting to '+ip
    try:
        page = urlopen(ip,timeout=2).read()
        try:
            find_per = re.search("Per Minute:</td><td align='left'>([0-9]+)",page)
            (per,)=find_per.groups()
        except:
            find_per = re.search("Utility:([0-9]+)",page)
            (per,)=find_per.groups()
            
        ip_on_page = re.findall(r'[0-9]+(?:\.[0-9]+){3}',page)
        mining_url = ip_on_page[-1]
        mining_port = (re.findall('(8[0-9]{3})+,',page))[0]
        return {'Per':per,'IP':ip,'Server':mining_url,'Port':mining_port,'Alive':True}
    except:
        print 'fail to connect ' + ip
        failed.append(ip)
        return {'IP':ip,'Alive':False}

def work(config):
    data = {}
    print cur_time()
    for k in config.keys():
        res=map(parse,config[k])
        domain = [item for sublist in res for item in sublist]
        ips = map(lambda x:make_ip(k,x),domain)
        for ip in ips:
            info = get_info(ip)
            if(ip in data.keys()):
                prev = data[ip]
                if('Accept' in prev.keys() and 'Accept' in info.keys()):
                    if(len(prev['Accept'])<300):
                        info['Accept'] = prev['Accept'] + info['Accept']
                    else:
                        info['Accept'] = prev['Accept'][1:] + info['Accept']
            data[ip]=info
            print info
    return data

config={}
name="ports.yaml"

try:
    config=load_yaml(name)
except:
    print "can't find config file "+name
print config
work(config)
print failed
        
    
