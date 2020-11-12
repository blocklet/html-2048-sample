TOP_DIR=.
README=$(TOP_DIR)/README.md

VERSION=$(strip $(shell cat version))

build:
	@echo "Building the software..."

init: install dep
	@echo "Initializing the repo..."

github-action-init:
	@echo "Initializing the repo..."
	@sudo npm install -g @abtnode/cli

install:
	@echo "Install software required for this repo..."
	@npm install -g yarn @abtnode/cli

dep:
	@echo "Install dependencies required for this repo..."

test:
	@echo "Running test suites..."

lint:
	@echo "Linting the software..."

doc:
	@echo "Building the documenation..."

clean:
	@echo "Cleaning the build..."
	@rm -rf .blocklet

run:
	@echo "Running the software..."
	@DEBUG=@arcblock/* yarn start

include .makefiles/*.mk

.PHONY: build init install dep pre-build post-build all test doc precommit github-action-test clean watch run bump-version create-pr
