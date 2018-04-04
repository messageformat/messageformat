.PHONY: docs

docs:
	@./node_modules/.bin/jsdoc -c jsdoc-conf.json
	@sed -i 's/tutorial/page/g;s/ Tutorial:/:/g;s/"index\.html"/".\/"/g;s/"\([^"\/]\+\)\.html"/"\1"/g' docs/*.html
	@for f in docs/tutorial*; do mv $$f $${f/tutorial/page}; done
	@cp -r logo docs/
	@echo "Documentation updated"
