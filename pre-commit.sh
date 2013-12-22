#!/bin/sh

git stash -q --keep-index
bin/compile && bin/test
RESULT=$?
git stash pop -q
exit $RESULT
