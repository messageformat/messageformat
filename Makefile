.PHONY: test
GREEN=\033[32;01m
RED=\033[31;01m
YELLOW=\033[33;01m
STOP=\033[0m
REPORTER=dot
CHK=${GREEN} ✓${STOP}
ERR=${RED} ✖${STOP}
PEGJS_ERR="${ERR} Error: pegjs is not installed! Please do:\n\n\tnpm install pegjs -g\n"

test:
	@./node_modules/.bin/mocha \
		--require test/common \
		--reporter $(REPORTER) \
		--growl \
		test/tests.js

test-browser:
	@open "http://127.0.0.1:3000/test/" & ./node_modules/.bin/serve . 

parser: ;@which pegjs > /dev/null || { echo ${PEGJS_ERR}; exit 1; }
	@pegjs ./lib/message_parser.pegjs ./lib/message_parser.js
	@echo "${CHK} parser re-compiled by pegjs"

publish: parser
	@rm -f ./messageformat.js;
	@template=`cat ./lib/messageformat.dev.js`
	@echo "  // This is generated and pulled in for browsers." > ./parser.tmp.js
	@sed -e 's/module.exports/var mparser/; s/^/  /' ./lib/message_parser.js >> ./parser.tmp.js
	@cp ./lib/messageformat.dev.js template.js
	@sed -e "/var mparser = require/r parser.tmp.js" -e "/var mparser = require/d" template.js > messageformat.js
	@rm -f parser.tmp.js template.js
	@echo "${CHK} messageformat.js ready for browsers"