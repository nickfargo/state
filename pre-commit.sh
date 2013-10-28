#!/bin/sh

git stash -q --keep-index
bin/compile && bin/test
RESULT=$?
if [ $RESULT ]; then
  echo "Failed tests ($RESULT)"
fi
git stash pop -q
exit $RESULT
