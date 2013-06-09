#!/bin/bash
cp ../namecoin.patch ~/.
cd 
git clone git://github.com/khalahan/namecoin.git
cd namecoin/src
patch -p2 < ~/namecoin.patch
make -f makefile.unix

