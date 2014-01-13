NPM_BIN = node_modules/.bin
JSHINT = $(NPM_BIN)/jshint
JSCS = $(NPM_BIN)/jscs

.PHONY: build
build: npm_deps
	node make.js

.PHONY: restart
restart: clean
	node make.js

.PHONY: clean
clean:
	rm -rf content
	rm config/repositories.json
	cp config/repositories.tmp.json config/repositories.json

.PHONY: lint
lint: npm_deps
	$(JSHINT) .
	$(JSCS) .

.PHONY: npm_deps
npm_deps:
	npm install