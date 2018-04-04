# Copyright 2012-2018 Alex Sexton, Eemeli Aro, and Contributors
# Licensed under the MIT License

BIN=./node_modules/.bin
SRC=lib/messageformat.js lib/compiler.js lib/formatters/* lib/plurals.js lib/runtime.js messages.js

.PHONY: all docs test test-browser release clean-docs clean

all: messageformat.min.js test example/i18n.js docs/index.html

cli/node_modules:
	cd cli && npm install && npm install --no-save ../

node_modules: ; npm install

messageformat.js: $(SRC) | node_modules
	@${BIN}/browserify $< -s MessageFormat -o $@
	@echo "$@ is now ready for browsers."

messageformat.min.js: messageformat.js
	@$(BIN)/uglifyjs $< --compress --mangle --output $@ --source-map $@.map
	@echo "$@ is now ready for browsers."


test: $(SRC)
	@${BIN}/mocha

test-browser: messageformat.js
	@open "http://127.0.0.1:3000/test/" & ${BIN}/serve .

docs: clean-docs docs/index.html

docs/index.html: $(SRC) pages/ | node_modules
	@${BIN}/jsdoc -c jsdoc-conf.json
	@sed -i 's/tutorial/page/g;s/ Tutorial:/:/g;s/"index\.html"/".\/"/g;s/"\([^"\/]\+\)\.html"/"\1"/g' docs/*.html
	@for f in docs/tutorial*; do mv $$f $${f/tutorial/page}; done
	@cp -r logo docs/
	@echo "API documentation generated"

example/i18n.js: cli/messageformat.js $(SRC) | cli/node_modules
	./$< --locale=en,fr --namespace=i18n $(dir $@) > $@


release: clean all
	git add -f messageformat.*js* docs example/i18n.js
	git commit -m 'Packaging files for release'


clean-docs:
	rm -rf docs/*html docs/fonts docs/img docs/logo docs/scripts docs/styles

clean: clean-docs
	rm -rf messageformat.*js*
