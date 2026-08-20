_ := $(shell mkdir -p .make)

NIX  := nix
YARN ?= yarn

TS_SRC  != find . -name '*.ts' -not -path '**/node_modules/**'
JS_SRC  != find . \( -name '*.js' -o -name '*.mjs' \) -not -path '**/node_modules/**'
JSON_SRC != find . -name '*.json' -not -path '**/node_modules/**'
MD_SRC  != find . -name '*.md' -not -path '**/node_modules/**'
NIX_SRC != find . -name '*.nix'

.PHONY: lint format install

install: .make/yarn_install

lint: install
	$(YARN) eslint .

format fmt: .make/nix_fmt
update: flake.lock

flake.lock: flake.nix
	$(NIX) flake update

.make/yarn_install: yarn.lock
	$(YARN) install
	@touch $@

.make/nix_fmt: $(NIX_SRC) $(TS_SRC) $(JS_SRC) $(JSON_SRC) $(MD_SRC)
	$(NIX) fmt
	@touch $@
