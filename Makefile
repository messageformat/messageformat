REPORTER = dot

test:
	@./node_modules/.bin/mocha \
		--require test/common \
		--reporter $(REPORTER) \
		--growl \
		test/tests.js

test-browser:
	@open "http://127.0.0.1:3000/test/" & ./node_modules/.bin/serve . 

.PHONY: test
