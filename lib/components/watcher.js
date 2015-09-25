var fs = require('fs');
var csv = require('csv');
var path = require('path');
var util = require('util');
var utils = require('../util/utils');
var Tbl = require('../common/tbl');
var EventEmitter = require('events').EventEmitter;
var logger = require('pomelo-logger').getLogger('pomelo-data', __filename);


var instance = null;

module.exports = function(app, opts) {
  // singleton
  if(instance) {
    return instance;
  }

  instance = new Component(app, opts);
  app.set('dataService', instance);
  return instance;
};

var Component = function(app, opts) {
  this.app = app;
  this.dir = opts.dir;
  this.idx = opts.idx;
  this.interval = opts.interval;
  this.numDict = {cur: 0, total: 0}; // config files' amount
  this.tmpConfigDataTbl = {};
  this.configDataTbl = {};
  this.csvParsers = {};
  this.onLoad = opts.onLoad;

  if(!fs.existsSync(this.dir)) {
    logger.error('Dir %s not exist!', this.dir);
    return;
  }
};

util.inherits(Component, EventEmitter);

Component.prototype.start = function(cb) {
  this.loadAll(cb);
};

Component.prototype.stop = function(force, cb) {
  this.tmpConfigDataTbl = null;
  this.configDataTbl = null;
  this.csvParsers = null;
  utils.invokeCallback(cb);
};

Component.prototype.loadFileFunc = function(filename, isLoadAll, cb) {
  var self = this;
  var curFileIdx = path.basename(filename, '.csv');
  self.tmpConfigDataTbl[curFileIdx] = [];

  self.csvParsers[curFileIdx] = csv();
  var tmpParser = self.csvParsers[curFileIdx];

  tmpParser.from.path(filename, {comment: '#'});

  tmpParser.on('record', function(row, index){
    // console.log('#' + index + ' ' + JSON.stringify(row));
    var tmpL = self.tmpConfigDataTbl[curFileIdx];
    if(tmpL) {
      tmpL.push(row);
    }
  });

  tmpParser.on('end', function(){
    // console.log('csvParsers ~ on.end is running ...');
    self.configDataTbl[curFileIdx] = new Tbl(self.tmpConfigDataTbl[curFileIdx], self.idx);
    if(isLoadAll) {
      self.numDict.cur++;
      if(self.numDict.cur === self.numDict.total) {
        utils.invokeCallback(cb);
        self.tmpConfigDataTbl = {}; // release temp data
      }
    }

    if (self.onLoad) {
      self.onLoad(filename); 
    }
  });

  tmpParser.on('error', function(err){
    logger.error(err.message);
    utils.invokeCallback(cb, err);
  });
};

Component.prototype.listener4watch = function(filename) {
  var self = this;
  return function(curr, prev) {
    if(curr.mtime.getTime() > prev.mtime.getTime()) {
      self.loadFileFunc(filename);
      /*
      setTimeout(function() {
        console.warn('\n', Date(), ': Listener4watch ~ configDataTbl = ', util.inspect(self.configDataTbl, {showHidden: true, depth: null}))
      }, 2000);
      */
    }
  };
};

Component.prototype.loadAll = function(cb) {
  var self = this;
  self.tmpConfigDataTbl = {};
  self.configDataTbl = {};

  fs.readdirSync(self.dir).forEach(function(filename) {
    if (!/\.csv$/.test(filename)) {
      return;
    }
    var absolutePath = path.join(self.dir, filename);
    if(fs.existsSync(absolutePath)) {
      self.numDict.total++;
    }
  });
  // console.log('self.numDict.total = ', self.numDict.total);

  fs.readdirSync(self.dir).forEach(function(filename) {
    if (!/\.csv$/.test(filename)) {
      return;
    }
    var absolutePath = path.join(self.dir, filename);
    if(!fs.existsSync(absolutePath)) {
      logger.error('Config file %s not exist at %s!', filename, absolutePath);
    } else {
      // console.warn('!!! filename = %s, absolutePath = %s', filename, absolutePath);
      // invoke cb(start next component) when all files have been loaded
      self.loadFileFunc(absolutePath, true, cb);
      fs.watchFile(absolutePath, { persistent: true, interval: self.interval }, self.listener4watch(absolutePath));
    }
  });
  /*
  setTimeout(function() {
    console.warn('\n', Date(), ': LoadAll ~ configDataTbl = ', util.inspect(self.configDataTbl, {showHidden: true, depth: null}))
  }, 2000);
  */
};

Component.prototype.get = function(tblName) {
  return this.configDataTbl[tblName];
};

