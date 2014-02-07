NPM_BIN = node_modules/.bin
JSHINT = $(NPM_BIN)/jshint
JSCS = $(NPM_BIN)/jscs

.PHONY: build
build: npm_deps
	cp config/_credentials.json config/credentials.json
	cp config/_repositories.json config/repositories.json

.PHONY: restart
restart: clean
	node src/make.js

.PHONY: clean
clean:
	rm -rf content
	rm -rf output
	rm config/repositories.json
	cp config/_repositories.json config/repositories.json

.PHONY: lint
lint: npm_deps
	$(JSHINT) .
	$(JSCS) .

.PHONY: npm_deps
npm_deps:
	npm install
