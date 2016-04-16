# Copyright 2012-2016 Alex Sexton, Eemeli Aro, and Contributors
# Licensed under the MIT License

GREEN=\033[32;01m
RED=\033[31;01m
YELLOW=\033[33;01m
STOP=\033[0m
CHK=${GREEN} ✓${STOP}
ERR=${RED} ✖${STOP}

BIN=./node_modules/.bin
SRC=lib/index.js lib/compiler.js lib/parser.js

.PHONY: test test-browser release clean

messageformat.js: $(SRC)
	@${BIN}/browserify $< -s MessageFormat -o $@
	@echo "${CHK} $@ is now ready for browsers."

messageformat.min.js: messageformat.js
	@$(BIN)/uglifyjs $< --compress --mangle --output $@ --source-map $@.map
	@echo "${CHK} $@ is now ready for browsers."

lib/parser.js: lib/parser.pegjs
	@${BIN}/pegjs $< $@
	@echo "${CHK} parser re-compiled by PEGjs"


test: $(SRC)
	@${BIN}/mocha --require test/common --reporter spec --growl test/parser.js test/messageformat.js

test-browser: messageformat.js
	@open "http://127.0.0.1:3000/test/" & ${BIN}/serve .


doc: lib/index.js lib/compiler.js
	@${BIN}/jsdoc -c jsdoc-conf.json
	@echo "${CHK} API documentation generated with jsdoc"

example/i18n.js: bin/messageformat.js $(SRC)
	./$< --locale=en,fr --namespace=i18n $(dir $@) > $@


release: clean messageformat.min.js test example/i18n.js doc
	git add -f messageformat.*js* lib/parser.js doc/*html doc/styles/ doc/scripts/ example/i18n.js
	git commit -m 'Packaging files for release'
	git am jsdoc-fix-fonts.patch


clean:
	rm -rf messageformat.*js* lib/parser.js doc/
