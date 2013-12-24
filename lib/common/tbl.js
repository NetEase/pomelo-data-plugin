var util = require('util');

/**
 * Tbl model `new Tbl()`
 *
 * @param {Array}
 *
 */
var Tbl = function(tmpL, idx) {
  var self = this;
  var fList = tmpL.splice(0, 1)[0];
  var fields = {};
  fList.forEach(function(k, v) {
    fields[k] = v;
  });

  self.data = {};
  tmpL.forEach(function(item) {
    var obj = {};
    for (var k in fields) {
      obj[k] = item[fields[k]];
    }
    if(obj[idx]) {
      self.data[obj[idx]] = obj;
    } else {
      console.error('No `%s` exists in tbl=%s', idx, util.inspect(fList, {showHidden: true, depth: 1}));
    }
  });
};

/**
 * find item by id
 *
 * @param id
 * @return {Obj}
 * @api public
 */
Tbl.prototype.findById = function(id) {
  return this.data[id];
};

/**
 * find all item
 *
 * @return {array}
 * @api public
 */
Tbl.prototype.all = function() {
  return this.data;
};

///////////////////////////////////////////////////////
/**
 * Expose 'Tbl' constructor.
 */
module.exports = Tbl;

