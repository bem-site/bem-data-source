require('./src/titles');
require('./src/constants');
require('./src/gh-api');
require('./src/util');
require('./src/model/registry');

require('./src/targets/base');
require('./src/targets/publish');
require('./src/targets/prepare');
require('./src/targets/send');
require('./src/targets/view/api');
require('./src/targets/view/cli');

require('./src/tasks/base');
require('./src/tasks/read-md');
require('./src/tasks/read-deps');
require('./src/tasks/read-showcase');
require('./src/tasks/read-levels');
require('./src/tasks/write-result');
require('./src/tasks/remove-temp');
require('./src/tasks/create-temp');
require('./src/tasks/copy-to-temp');
require('./src/tasks/send-examples');
require('./src/tasks/send-doc');
require('./src/tasks/send-email');
require('./src/targets/remove');
require('./integration/prepare');
//require('./integration/send');
//require('./integration/publish');
require('./integration/all');

