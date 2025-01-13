.PHONY: build

build:
	@docker build . -f demo/Dockerfile.neogrok -t docker-registry.local.gebit.de:5000/gebit-build/neogrok:latest

build-no-cache:
	@docker build --no-cache . -f demo/Dockerfile.neogrok -t docker-registry.local.gebit.de:5000/gebit-build/neogrok:latest

push:
	@docker push docker-registry.local.gebit.de:5000/gebit-build/neogrok:latest
