# all: install lint build test

# test: index.ts test.ts index.js test.js
# 	node test.js

# install: package.json typings.json
# 	npm install

# lint: index.ts test.ts tslint.json
# 	tslint --config tslint.json index.ts test.ts

# build: index.ts test.ts tsconfig.json
# 	tsc --declaration
# 	rm test.d.ts

# clean:
# 	rm index.js test.js rm index.d.ts

main:
	rm -rf dist
	tsc -p tsconfig-main.json
	echo 'module.exports = require("./main/beautiful-log");' > dist/index.js

client:
	rm -rf bin
	tsc -p tsconfig-client.json
	echo '#!/usr/bin/env node\nrequire("./client/beautiful-log-client");' > bin/client.js
