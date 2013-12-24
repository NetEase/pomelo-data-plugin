pomelo-data-plugin

Config data plugin for Pomelo(a fast,scalable,distributed game server framework for Node.js. http://pomelo.netease.com), it can be used in Pomelo(>=0.7.0).

pomelo-data-plugin is a config data(.csv) plugin for Pomelo. pomelo-data-plugin can watch all config files in the given dir and reload the file automatically when it is modified.

##Installation

```
npm install pomelo-data-plugin
```

##Usage

```
var dataPlugin = require('pomelo-data-plugin');
... ...
app.configure('production|development', function() {
  ...
  app.use(dataPlugin, {
    watcher: {
      dir: __dirname + '/config/data',
      idx: 'id',
      interval: 3000
    }
  });
  ...
});
... ...
... ...
var npcTalkConf = app.get('dataService').get('npc_talk');
... ...
... ...
```

Please refer to [pomelo-data-plugin-demo](https://github.com/palmtoy/pomelo-data-plugin-demo)

