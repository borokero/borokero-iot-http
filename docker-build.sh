
#!/usr/bin/env bash
# https://github.com/ryanramage/docker-build-run-push

if [ -z "$VERSION" ]; then
    VERSION=$(node -e "console.log(require('./package.json').version)")
fi

if [ -z "$NAME" ]; then
    NAME=$(node -e "console.log(require('./package.json').name.split('/').pop())")
fi

echo "$NAME"
echo "$VERSION"

docker build -t "$NAME:$VERSION" "$@" .