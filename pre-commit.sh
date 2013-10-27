#!/bin/sh

git stash -q --keep-index
bin/compile && bin/test
git stash pop -q
1
