import sys
import argparse

parser = argparse.ArgumentParser(description='Generate Config Scripts',epilog='e.g. : python gen_config.py -t 100 101 102 103 -r 100 191')

parser.add_argument("-t", "--tank",  nargs="+",help="tank",required=True,action="store")
parser.add_argument("-r", "--range", nargs="+",help="ip",required=True,action="store")

if len(sys.argv)==1:
    parser.print_help()
    sys.exit(1)

args = parser.parse_args()

print args
