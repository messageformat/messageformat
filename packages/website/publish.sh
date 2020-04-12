#!/bin/bash

GSED=$(which gsed)

# Rename "tutorials" as "pages" and drop .html from links
${GSED:-"sed"} -i '
    s/tutorial/page/g
    s/ Tutorial:/:/g
    s/"index\.html"/".\/"/g
    s/"\([^"\/]\+\)\.html\(["#]\)/"\1\2/g' docs/*.html

for f in docs/tutorial*; do
    mv $f ${f/tutorial/page}
done

cp -r logo docs/
rm -rf ../../docs/v3
mv docs ../../docs/v3
