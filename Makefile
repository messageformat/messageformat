# 
# Copyright 2014
# 
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# 
#     http://www.apache.org/licenses/LICENSE-2.0
# 
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.
# 

.PHONY: test
GREEN=\033[32;01m
RED=\033[31;01m
YELLOW=\033[33;01m
STOP=\033[0m
REPORTER=dot
CHK=${GREEN} ✓${STOP}
ERR=${RED} ✖${STOP}

test:
	@./node_modules/.bin/mocha \
		--require test/common \
		--reporter $(REPORTER) \
		--growl \
		test/tests.js

test-browser:
	@open "http://127.0.0.1:3000/test/" & ./node_modules/.bin/serve .

./lib/message_parser.js: ./lib/message_parser.pegjs
	@./node_modules/.bin/pegjs $< $@
	@echo "${CHK} parser re-compiled by pegjs"

parser: ./lib/message_parser.js

publish: ./lib/message_parser.js ./lib/messageformat.dev.js
	@sed \
		-e '1i\  // This is generated and pulled in for browsers.' \
		-e 's/module.exports/var mparser/' \
		-e 's/^/  /' \
		$< > ./parser.tmp.js
	@sed \
		-e "/var mparser = require/{r ./parser.tmp.js" \
		-e "d}" \
		$(word 2,$^) > messageformat.js
	@rm ./parser.tmp.js
	@echo "${CHK} messageformat.js ready for browsers"
