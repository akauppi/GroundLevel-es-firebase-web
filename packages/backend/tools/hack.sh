#!/bin/bash

# $0 1    # predeploy
# $0 2    # postdeploy
#
# For the duration of 'firebase deploy', changes the 'engines.node' to be just "14". After deploy, changes it back.
#
# This hack allows no annoying warnings (also outside of the 'backend' project). The RIGHT way to do would be for
# Firebase CLI to be fine with '14 || >=15' -like strings.
#
if [ $# -eq 0 ]; then
    echo "Usage: $(basename $0) 1|2"
    exit 1
fi

MODE=$1

ORIG=functions/package.json
BU_EXT=bu

case $1 in
1)
  sed -i .$BU_EXT -E 's/("node": ")(.+)(")/\114\3/' $ORIG
;;
2)
  [ -f $ORIG.$BU_EXT ] && mv $ORIG.$BU_EXT $ORIG
;;
esac