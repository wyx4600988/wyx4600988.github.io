(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
window.pug = require('pug');

},{"pug":21}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":6}],3:[function(require,module,exports){
'use strict';

module.exports = TokenStream;
function TokenStream(tokens) {
  if (!Array.isArray(tokens)) {
    throw new TypeError('tokens must be passed to TokenStream as an array.');
  }
  this._tokens = tokens;
}
TokenStream.prototype.lookahead = function (index) {
  if (this._tokens.length <= index) {
    throw new Error('Cannot read past the end of a stream');
  }
  return this._tokens[index];
};
TokenStream.prototype.peek = function () {
  if (this._tokens.length === 0) {
    throw new Error('Cannot read past the end of a stream');
  }
  return this._tokens[0];
};
TokenStream.prototype.advance = function () {
  if (this._tokens.length === 0) {
    throw new Error('Cannot read past the end of a stream');
  }
  return this._tokens.shift();
};
TokenStream.prototype.defer = function (token) {
  this._tokens.unshift(token);
};

},{}],4:[function(require,module,exports){
module.exports = function isBuffer(arg) {
  return arg && typeof arg === 'object'
    && typeof arg.copy === 'function'
    && typeof arg.fill === 'function'
    && typeof arg.readUInt8 === 'function';
}
},{}],5:[function(require,module,exports){
(function (process,global){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

var formatRegExp = /%[sdj%]/g;
exports.format = function(f) {
  if (!isString(f)) {
    var objects = [];
    for (var i = 0; i < arguments.length; i++) {
      objects.push(inspect(arguments[i]));
    }
    return objects.join(' ');
  }

  var i = 1;
  var args = arguments;
  var len = args.length;
  var str = String(f).replace(formatRegExp, function(x) {
    if (x === '%%') return '%';
    if (i >= len) return x;
    switch (x) {
      case '%s': return String(args[i++]);
      case '%d': return Number(args[i++]);
      case '%j':
        try {
          return JSON.stringify(args[i++]);
        } catch (_) {
          return '[Circular]';
        }
      default:
        return x;
    }
  });
  for (var x = args[i]; i < len; x = args[++i]) {
    if (isNull(x) || !isObject(x)) {
      str += ' ' + x;
    } else {
      str += ' ' + inspect(x);
    }
  }
  return str;
};


// Mark that a method should not be used.
// Returns a modified function which warns once by default.
// If --no-deprecation is set, then it is a no-op.
exports.deprecate = function(fn, msg) {
  // Allow for deprecating things in the process of starting up.
  if (isUndefined(global.process)) {
    return function() {
      return exports.deprecate(fn, msg).apply(this, arguments);
    };
  }

  if (process.noDeprecation === true) {
    return fn;
  }

  var warned = false;
  function deprecated() {
    if (!warned) {
      if (process.throwDeprecation) {
        throw new Error(msg);
      } else if (process.traceDeprecation) {
        console.trace(msg);
      } else {
        console.error(msg);
      }
      warned = true;
    }
    return fn.apply(this, arguments);
  }

  return deprecated;
};


var debugs = {};
var debugEnviron;
exports.debuglog = function(set) {
  if (isUndefined(debugEnviron))
    debugEnviron = process.env.NODE_DEBUG || '';
  set = set.toUpperCase();
  if (!debugs[set]) {
    if (new RegExp('\\b' + set + '\\b', 'i').test(debugEnviron)) {
      var pid = process.pid;
      debugs[set] = function() {
        var msg = exports.format.apply(exports, arguments);
        console.error('%s %d: %s', set, pid, msg);
      };
    } else {
      debugs[set] = function() {};
    }
  }
  return debugs[set];
};


/**
 * Echos the value of a value. Trys to print the value out
 * in the best way possible given the different types.
 *
 * @param {Object} obj The object to print out.
 * @param {Object} opts Optional options object that alters the output.
 */
/* legacy: obj, showHidden, depth, colors*/
function inspect(obj, opts) {
  // default options
  var ctx = {
    seen: [],
    stylize: stylizeNoColor
  };
  // legacy...
  if (arguments.length >= 3) ctx.depth = arguments[2];
  if (arguments.length >= 4) ctx.colors = arguments[3];
  if (isBoolean(opts)) {
    // legacy...
    ctx.showHidden = opts;
  } else if (opts) {
    // got an "options" object
    exports._extend(ctx, opts);
  }
  // set default options
  if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
  if (isUndefined(ctx.depth)) ctx.depth = 2;
  if (isUndefined(ctx.colors)) ctx.colors = false;
  if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
  if (ctx.colors) ctx.stylize = stylizeWithColor;
  return formatValue(ctx, obj, ctx.depth);
}
exports.inspect = inspect;


// http://en.wikipedia.org/wiki/ANSI_escape_code#graphics
inspect.colors = {
  'bold' : [1, 22],
  'italic' : [3, 23],
  'underline' : [4, 24],
  'inverse' : [7, 27],
  'white' : [37, 39],
  'grey' : [90, 39],
  'black' : [30, 39],
  'blue' : [34, 39],
  'cyan' : [36, 39],
  'green' : [32, 39],
  'magenta' : [35, 39],
  'red' : [31, 39],
  'yellow' : [33, 39]
};

// Don't use 'blue' not visible on cmd.exe
inspect.styles = {
  'special': 'cyan',
  'number': 'yellow',
  'boolean': 'yellow',
  'undefined': 'grey',
  'null': 'bold',
  'string': 'green',
  'date': 'magenta',
  // "name": intentionally not styling
  'regexp': 'red'
};


function stylizeWithColor(str, styleType) {
  var style = inspect.styles[styleType];

  if (style) {
    return '\u001b[' + inspect.colors[style][0] + 'm' + str +
           '\u001b[' + inspect.colors[style][1] + 'm';
  } else {
    return str;
  }
}


function stylizeNoColor(str, styleType) {
  return str;
}


function arrayToHash(array) {
  var hash = {};

  array.forEach(function(val, idx) {
    hash[val] = true;
  });

  return hash;
}


function formatValue(ctx, value, recurseTimes) {
  // Provide a hook for user-specified inspect functions.
  // Check that value is an object with an inspect function on it
  if (ctx.customInspect &&
      value &&
      isFunction(value.inspect) &&
      // Filter out the util module, it's inspect function is special
      value.inspect !== exports.inspect &&
      // Also filter out any prototype objects using the circular check.
      !(value.constructor && value.constructor.prototype === value)) {
    var ret = value.inspect(recurseTimes, ctx);
    if (!isString(ret)) {
      ret = formatValue(ctx, ret, recurseTimes);
    }
    return ret;
  }

  // Primitive types cannot have properties
  var primitive = formatPrimitive(ctx, value);
  if (primitive) {
    return primitive;
  }

  // Look up the keys of the object.
  var keys = Object.keys(value);
  var visibleKeys = arrayToHash(keys);

  if (ctx.showHidden) {
    keys = Object.getOwnPropertyNames(value);
  }

  // IE doesn't make error fields non-enumerable
  // http://msdn.microsoft.com/en-us/library/ie/dww52sbt(v=vs.94).aspx
  if (isError(value)
      && (keys.indexOf('message') >= 0 || keys.indexOf('description') >= 0)) {
    return formatError(value);
  }

  // Some type of object without properties can be shortcutted.
  if (keys.length === 0) {
    if (isFunction(value)) {
      var name = value.name ? ': ' + value.name : '';
      return ctx.stylize('[Function' + name + ']', 'special');
    }
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    }
    if (isDate(value)) {
      return ctx.stylize(Date.prototype.toString.call(value), 'date');
    }
    if (isError(value)) {
      return formatError(value);
    }
  }

  var base = '', array = false, braces = ['{', '}'];

  // Make Array say that they are Array
  if (isArray(value)) {
    array = true;
    braces = ['[', ']'];
  }

  // Make functions say that they are functions
  if (isFunction(value)) {
    var n = value.name ? ': ' + value.name : '';
    base = ' [Function' + n + ']';
  }

  // Make RegExps say that they are RegExps
  if (isRegExp(value)) {
    base = ' ' + RegExp.prototype.toString.call(value);
  }

  // Make dates with properties first say the date
  if (isDate(value)) {
    base = ' ' + Date.prototype.toUTCString.call(value);
  }

  // Make error with message first say the error
  if (isError(value)) {
    base = ' ' + formatError(value);
  }

  if (keys.length === 0 && (!array || value.length == 0)) {
    return braces[0] + base + braces[1];
  }

  if (recurseTimes < 0) {
    if (isRegExp(value)) {
      return ctx.stylize(RegExp.prototype.toString.call(value), 'regexp');
    } else {
      return ctx.stylize('[Object]', 'special');
    }
  }

  ctx.seen.push(value);

  var output;
  if (array) {
    output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
  } else {
    output = keys.map(function(key) {
      return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
    });
  }

  ctx.seen.pop();

  return reduceToSingleString(output, base, braces);
}


function formatPrimitive(ctx, value) {
  if (isUndefined(value))
    return ctx.stylize('undefined', 'undefined');
  if (isString(value)) {
    var simple = '\'' + JSON.stringify(value).replace(/^"|"$/g, '')
                                             .replace(/'/g, "\\'")
                                             .replace(/\\"/g, '"') + '\'';
    return ctx.stylize(simple, 'string');
  }
  if (isNumber(value))
    return ctx.stylize('' + value, 'number');
  if (isBoolean(value))
    return ctx.stylize('' + value, 'boolean');
  // For some reason typeof null is "object", so special case here.
  if (isNull(value))
    return ctx.stylize('null', 'null');
}


function formatError(value) {
  return '[' + Error.prototype.toString.call(value) + ']';
}


function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
  var output = [];
  for (var i = 0, l = value.length; i < l; ++i) {
    if (hasOwnProperty(value, String(i))) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          String(i), true));
    } else {
      output.push('');
    }
  }
  keys.forEach(function(key) {
    if (!key.match(/^\d+$/)) {
      output.push(formatProperty(ctx, value, recurseTimes, visibleKeys,
          key, true));
    }
  });
  return output;
}


function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
  var name, str, desc;
  desc = Object.getOwnPropertyDescriptor(value, key) || { value: value[key] };
  if (desc.get) {
    if (desc.set) {
      str = ctx.stylize('[Getter/Setter]', 'special');
    } else {
      str = ctx.stylize('[Getter]', 'special');
    }
  } else {
    if (desc.set) {
      str = ctx.stylize('[Setter]', 'special');
    }
  }
  if (!hasOwnProperty(visibleKeys, key)) {
    name = '[' + key + ']';
  }
  if (!str) {
    if (ctx.seen.indexOf(desc.value) < 0) {
      if (isNull(recurseTimes)) {
        str = formatValue(ctx, desc.value, null);
      } else {
        str = formatValue(ctx, desc.value, recurseTimes - 1);
      }
      if (str.indexOf('\n') > -1) {
        if (array) {
          str = str.split('\n').map(function(line) {
            return '  ' + line;
          }).join('\n').substr(2);
        } else {
          str = '\n' + str.split('\n').map(function(line) {
            return '   ' + line;
          }).join('\n');
        }
      }
    } else {
      str = ctx.stylize('[Circular]', 'special');
    }
  }
  if (isUndefined(name)) {
    if (array && key.match(/^\d+$/)) {
      return str;
    }
    name = JSON.stringify('' + key);
    if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
      name = name.substr(1, name.length - 2);
      name = ctx.stylize(name, 'name');
    } else {
      name = name.replace(/'/g, "\\'")
                 .replace(/\\"/g, '"')
                 .replace(/(^"|"$)/g, "'");
      name = ctx.stylize(name, 'string');
    }
  }

  return name + ': ' + str;
}


function reduceToSingleString(output, base, braces) {
  var numLinesEst = 0;
  var length = output.reduce(function(prev, cur) {
    numLinesEst++;
    if (cur.indexOf('\n') >= 0) numLinesEst++;
    return prev + cur.replace(/\u001b\[\d\d?m/g, '').length + 1;
  }, 0);

  if (length > 60) {
    return braces[0] +
           (base === '' ? '' : base + '\n ') +
           ' ' +
           output.join(',\n  ') +
           ' ' +
           braces[1];
  }

  return braces[0] + base + ' ' + output.join(', ') + ' ' + braces[1];
}


// NOTE: These type checking functions intentionally don't use `instanceof`
// because it is fragile and can be easily faked with `Object.create()`.
function isArray(ar) {
  return Array.isArray(ar);
}
exports.isArray = isArray;

function isBoolean(arg) {
  return typeof arg === 'boolean';
}
exports.isBoolean = isBoolean;

function isNull(arg) {
  return arg === null;
}
exports.isNull = isNull;

function isNullOrUndefined(arg) {
  return arg == null;
}
exports.isNullOrUndefined = isNullOrUndefined;

function isNumber(arg) {
  return typeof arg === 'number';
}
exports.isNumber = isNumber;

function isString(arg) {
  return typeof arg === 'string';
}
exports.isString = isString;

function isSymbol(arg) {
  return typeof arg === 'symbol';
}
exports.isSymbol = isSymbol;

function isUndefined(arg) {
  return arg === void 0;
}
exports.isUndefined = isUndefined;

function isRegExp(re) {
  return isObject(re) && objectToString(re) === '[object RegExp]';
}
exports.isRegExp = isRegExp;

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}
exports.isObject = isObject;

function isDate(d) {
  return isObject(d) && objectToString(d) === '[object Date]';
}
exports.isDate = isDate;

function isError(e) {
  return isObject(e) &&
      (objectToString(e) === '[object Error]' || e instanceof Error);
}
exports.isError = isError;

function isFunction(arg) {
  return typeof arg === 'function';
}
exports.isFunction = isFunction;

function isPrimitive(arg) {
  return arg === null ||
         typeof arg === 'boolean' ||
         typeof arg === 'number' ||
         typeof arg === 'string' ||
         typeof arg === 'symbol' ||  // ES6 symbol
         typeof arg === 'undefined';
}
exports.isPrimitive = isPrimitive;

exports.isBuffer = require('./support/isBuffer');

function objectToString(o) {
  return Object.prototype.toString.call(o);
}


function pad(n) {
  return n < 10 ? '0' + n.toString(10) : n.toString(10);
}


var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep',
              'Oct', 'Nov', 'Dec'];

// 26 Feb 16:19:34
function timestamp() {
  var d = new Date();
  var time = [pad(d.getHours()),
              pad(d.getMinutes()),
              pad(d.getSeconds())].join(':');
  return [d.getDate(), months[d.getMonth()], time].join(' ');
}


// log is just a thin wrapper to console.log that prepends a timestamp
exports.log = function() {
  console.log('%s - %s', timestamp(), exports.format.apply(exports, arguments));
};


/**
 * Inherit the prototype methods from one constructor into another.
 *
 * The Function.prototype.inherits from lang.js rewritten as a standalone
 * function (not on Function.prototype). NOTE: If this file is to be loaded
 * during bootstrapping this function needs to be rewritten using some native
 * functions as prototype setup using normal JavaScript does not work as
 * expected during bootstrapping (see mirror.js in r114903).
 *
 * @param {function} ctor Constructor function which needs to inherit the
 *     prototype.
 * @param {function} superCtor Constructor function to inherit prototype from.
 */
exports.inherits = require('inherits');

exports._extend = function(origin, add) {
  // Don't do anything if add isn't an object
  if (!add || !isObject(add)) return origin;

  var keys = Object.keys(add);
  var i = keys.length;
  while (i--) {
    origin[keys[i]] = add[keys[i]];
  }
  return origin;
};

function hasOwnProperty(obj, prop) {
  return Object.prototype.hasOwnProperty.call(obj, prop);
}

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./support/isBuffer":4,"_process":6,"inherits":22}],6:[function(require,module,exports){
// shim for using process in browser
var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

function defaultSetTimout() {
    throw new Error('setTimeout has not been defined');
}
function defaultClearTimeout () {
    throw new Error('clearTimeout has not been defined');
}
(function () {
    try {
        if (typeof setTimeout === 'function') {
            cachedSetTimeout = setTimeout;
        } else {
            cachedSetTimeout = defaultSetTimout;
        }
    } catch (e) {
        cachedSetTimeout = defaultSetTimout;
    }
    try {
        if (typeof clearTimeout === 'function') {
            cachedClearTimeout = clearTimeout;
        } else {
            cachedClearTimeout = defaultClearTimeout;
        }
    } catch (e) {
        cachedClearTimeout = defaultClearTimeout;
    }
} ())
function runTimeout(fun) {
    if (cachedSetTimeout === setTimeout) {
        //normal enviroments in sane situations
        return setTimeout(fun, 0);
    }
    // if setTimeout wasn't available but was latter defined
    if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
        cachedSetTimeout = setTimeout;
        return setTimeout(fun, 0);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedSetTimeout(fun, 0);
    } catch(e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't trust the global object when called normally
            return cachedSetTimeout.call(null, fun, 0);
        } catch(e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error
            return cachedSetTimeout.call(this, fun, 0);
        }
    }


}
function runClearTimeout(marker) {
    if (cachedClearTimeout === clearTimeout) {
        //normal enviroments in sane situations
        return clearTimeout(marker);
    }
    // if clearTimeout wasn't available but was latter defined
    if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
        cachedClearTimeout = clearTimeout;
        return clearTimeout(marker);
    }
    try {
        // when when somebody has screwed with setTimeout but no I.E. maddness
        return cachedClearTimeout(marker);
    } catch (e){
        try {
            // When we are in I.E. but the script has been evaled so I.E. doesn't  trust the global object when called normally
            return cachedClearTimeout.call(null, marker);
        } catch (e){
            // same as above but when it's a version of I.E. that must have the global object for 'this', hopfully our context correct otherwise it will throw a global error.
            // Some versions of I.E. have different rules for clearTimeout vs setTimeout
            return cachedClearTimeout.call(this, marker);
        }
    }



}
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = runTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    runClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        runTimeout(drainQueue);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;
process.prependListener = noop;
process.prependOnceListener = noop;

process.listeners = function (name) { return [] }

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],7:[function(require,module,exports){
var bind = require('function-bind');

module.exports = bind.call(Function.call, Object.prototype.hasOwnProperty);

},{"function-bind":13}],8:[function(require,module,exports){
'use strict';

module.exports = stringify;
function stringify(obj) {
  if (obj instanceof Date) {
    return 'new Date(' + stringify(obj.toISOString()) + ')';
  }
  if (obj === undefined) {
    return 'undefined';
  }
  return JSON.stringify(obj)
             .replace(/\u2028/g, '\\u2028')
             .replace(/\u2029/g, '\\u2029')
             .replace(/</g, '\\u003C')
             .replace(/>/g, '\\u003E')
             .replace(/\//g, '\\u002F');
}

},{}],9:[function(require,module,exports){
'use strict';

var error = require('pug-error');

module.exports = stripComments;

function unexpectedToken (type, occasion, filename, line) {
  var msg = '`' + type + '` encountered when ' + occasion;
  throw error('UNEXPECTED_TOKEN', msg, { filename: filename, line: line });
}

function stripComments (input, options) {
  options = options || {};

  // Default: strip unbuffered comments and leave buffered ones alone
  var stripUnbuffered = options.stripUnbuffered !== false;
  var stripBuffered   = options.stripBuffered   === true;
  var filename        = options.filename;

  var out = [];
  // If we have encountered a comment token and are not sure if we have gotten
  // out of the comment or not
  var inComment = false;
  // If we are sure that we are in a block comment and all tokens except
  // `end-pipeless-text` should be ignored
  var inPipelessText = false;

  return input.filter(function (tok) {
    switch (tok.type) {
      case 'comment':
        if (inComment) {
          unexpectedToken(
            'comment', 'already in a comment', filename, tok.line
          );
        } else {
          inComment = tok.buffer ? stripBuffered : stripUnbuffered;
          return !inComment;
        }
      case 'start-pipeless-text':
        if (!inComment) return true;
        if (inPipelessText) {
          unexpectedToken(
            'start-pipeless-text', 'already in pipeless text mode',
            filename, tok.line
          );
        }
        inPipelessText = true;
        return false;
      case 'end-pipeless-text':
        if (!inComment) return true;
        if (!inPipelessText) {
          unexpectedToken(
            'end-pipeless-text', 'not in pipeless text mode',
            filename, tok.line
          );
        }
        inPipelessText = false;
        inComment = false;
        return false;
      // There might be a `text` right after `comment` but before
      // `start-pipeless-text`. Treat it accordingly.
      case 'text':
        return !inComment;
      default:
        if (inPipelessText) return false;
        inComment = false;
        return true;
    }
  });
}

},{"pug-error":17}],10:[function(require,module,exports){
'use strict';

var has = require('has');
var regexExec = RegExp.prototype.exec;
var gOPD = Object.getOwnPropertyDescriptor;

var tryRegexExecCall = function tryRegexExec(value) {
	try {
		var lastIndex = value.lastIndex;
		value.lastIndex = 0;

		regexExec.call(value);
		return true;
	} catch (e) {
		return false;
	} finally {
		value.lastIndex = lastIndex;
	}
};
var toStr = Object.prototype.toString;
var regexClass = '[object RegExp]';
var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

module.exports = function isRegex(value) {
	if (!value || typeof value !== 'object') {
		return false;
	}
	if (!hasToStringTag) {
		return toStr.call(value) === regexClass;
	}

	var descriptor = gOPD(value, 'lastIndex');
	var hasLastIndexDataProperty = descriptor && has(descriptor, 'value');
	if (!hasLastIndexDataProperty) {
		return false;
	}

	return tryRegexExecCall(value);
};

},{"has":7}],11:[function(require,module,exports){
'use strict';

module.exports = {
  'html': '<!DOCTYPE html>',
  'xml': '<?xml version="1.0" encoding="utf-8" ?>',
  'transitional': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
  'strict': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">',
  'frameset': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Frameset//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-frameset.dtd">',
  '1.1': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.1//EN" "http://www.w3.org/TR/xhtml11/DTD/xhtml11.dtd">',
  'basic': '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML Basic 1.1//EN" "http://www.w3.org/TR/xhtml-basic/xhtml-basic11.dtd">',
  'mobile': '<!DOCTYPE html PUBLIC "-//WAPFORUM//DTD XHTML Mobile 1.2//EN" "http://www.openmobilealliance.org/tech/DTD/xhtml-mobile12.dtd">',
  'plist': '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">'
};

},{}],12:[function(require,module,exports){
var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
var slice = Array.prototype.slice;
var toStr = Object.prototype.toString;
var funcType = '[object Function]';

module.exports = function bind(that) {
    var target = this;
    if (typeof target !== 'function' || toStr.call(target) !== funcType) {
        throw new TypeError(ERROR_MESSAGE + target);
    }
    var args = slice.call(arguments, 1);

    var bound;
    var binder = function () {
        if (this instanceof bound) {
            var result = target.apply(
                this,
                args.concat(slice.call(arguments))
            );
            if (Object(result) === result) {
                return result;
            }
            return this;
        } else {
            return target.apply(
                that,
                args.concat(slice.call(arguments))
            );
        }
    };

    var boundLength = Math.max(0, target.length - args.length);
    var boundArgs = [];
    for (var i = 0; i < boundLength; i++) {
        boundArgs.push('$' + i);
    }

    bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

    if (target.prototype) {
        var Empty = function Empty() {};
        Empty.prototype = target.prototype;
        bound.prototype = new Empty();
        Empty.prototype = null;
    }

    return bound;
};

},{}],13:[function(require,module,exports){
var implementation = require('./implementation');

module.exports = Function.prototype.bind || implementation;

},{"./implementation":12}],14:[function(require,module,exports){
'use strict';

var doctypes = require('doctypes');
var makeError = require('pug-error');
var buildRuntime = require('pug-runtime/build');
var runtime = require('pug-runtime');
var compileAttrs = require('pug-attrs');
var selfClosing = require('void-elements');
var constantinople = require('constantinople');
var stringify = require('js-stringify');
var addWith = require('with');

// This is used to prevent pretty printing inside certain tags
var WHITE_SPACE_SENSITIVE_TAGS = {
  pre: true,
  textarea: true
};

var INTERNAL_VARIABLES = [
  'pug',
  'pug_mixins',
  'pug_interp',
  'pug_debug_filename',
  'pug_debug_line',
  'pug_debug_sources',
  'pug_html'
];

module.exports = generateCode;
module.exports.CodeGenerator = Compiler;
function generateCode(ast, options) {
  return (new Compiler(ast, options)).compile();
}


function isConstant(src) {
  return constantinople(src, {pug: runtime, 'pug_interp': undefined});
}
function toConstant(src) {
  return constantinople.toConstant(src, {pug: runtime, 'pug_interp': undefined});
}

/**
 * Initialize `Compiler` with the given `node`.
 *
 * @param {Node} node
 * @param {Object} options
 * @api public
 */

function Compiler(node, options) {
  this.options = options = options || {};
  this.node = node;
  this.bufferedConcatenationCount = 0;
  this.hasCompiledDoctype = false;
  this.hasCompiledTag = false;
  this.pp = options.pretty || false;
  if (this.pp && typeof this.pp !== 'string') {
    this.pp = '  ';
  }
  this.debug = false !== options.compileDebug;
  this.indents = 0;
  this.parentIndents = 0;
  this.terse = false;
  this.mixins = {};
  this.dynamicMixins = false;
  this.eachCount = 0;
  if (options.doctype) this.setDoctype(options.doctype);
  this.runtimeFunctionsUsed = [];
  this.inlineRuntimeFunctions = options.inlineRuntimeFunctions || false;
  if (this.debug && this.inlineRuntimeFunctions) {
    this.runtimeFunctionsUsed.push('rethrow');
  }
};

/**
 * Compiler prototype.
 */

Compiler.prototype = {

  runtime: function (name) {
    if (this.inlineRuntimeFunctions) {
      this.runtimeFunctionsUsed.push(name);
      return 'pug_' + name;
    } else {
      return 'pug.' + name;
    }
  },

  error: function (message, code, node) {
    var err = makeError(code, message, {
      line: node.line,
      filename: node.filename,
    });
    throw err;
  },

  /**
   * Compile parse tree to JavaScript.
   *
   * @api public
   */

  compile: function(){
    this.buf = [];
    if (this.pp) this.buf.push("var pug_indent = [];");
    this.lastBufferedIdx = -1;
    this.visit(this.node);
    if (!this.dynamicMixins) {
      // if there are no dynamic mixins we can remove any un-used mixins
      var mixinNames = Object.keys(this.mixins);
      for (var i = 0; i < mixinNames.length; i++) {
        var mixin = this.mixins[mixinNames[i]];
        if (!mixin.used) {
          for (var x = 0; x < mixin.instances.length; x++) {
            for (var y = mixin.instances[x].start; y < mixin.instances[x].end; y++) {
              this.buf[y] = '';
            }
          }
        }
      }
    }
    var js = this.buf.join('\n');
    var globals = this.options.globals ? this.options.globals.concat(INTERNAL_VARIABLES) : INTERNAL_VARIABLES;
    if (this.options.self) {
      js = 'var self = locals || {};' + js;
    } else {
      js = addWith('locals || {}', js, globals.concat(this.runtimeFunctionsUsed.map(function (name) { return 'pug_' + name; })));
    }
    if (this.debug) {
      if (this.options.includeSources) {
        js = 'var pug_debug_sources = ' + stringify(this.options.includeSources) + ';\n' + js;
      }
      js = 'var pug_debug_filename, pug_debug_line;' +
        'try {' +
        js +
        '} catch (err) {' +
        (this.inlineRuntimeFunctions ? 'pug_rethrow' : 'pug.rethrow') +
        '(err, pug_debug_filename, pug_debug_line' +
        (
          this.options.includeSources
          ? ', pug_debug_sources[pug_debug_filename]'
          : ''
        ) +
        ');' +
        '}';
    }
    return buildRuntime(this.runtimeFunctionsUsed) + 'function ' + (this.options.templateName || 'template') + '(locals) {var pug_html = "", pug_mixins = {}, pug_interp;' + js + ';return pug_html;}';
  },

  /**
   * Sets the default doctype `name`. Sets terse mode to `true` when
   * html 5 is used, causing self-closing tags to end with ">" vs "/>",
   * and boolean attributes are not mirrored.
   *
   * @param {string} name
   * @api public
   */

  setDoctype: function(name){
    this.doctype = doctypes[name.toLowerCase()] || '<!DOCTYPE ' + name + '>';
    this.terse = this.doctype.toLowerCase() == '<!doctype html>';
    this.xml = 0 == this.doctype.indexOf('<?xml');
  },

  /**
   * Buffer the given `str` exactly as is or with interpolation
   *
   * @param {String} str
   * @param {Boolean} interpolate
   * @api public
   */

  buffer: function (str) {
    var self = this;

    str = stringify(str);
    str = str.substr(1, str.length - 2);

    if (this.lastBufferedIdx == this.buf.length && this.bufferedConcatenationCount < 100) {
      if (this.lastBufferedType === 'code') {
        this.lastBuffered += ' + "';
        this.bufferedConcatenationCount++;
      }
      this.lastBufferedType = 'text';
      this.lastBuffered += str;
      this.buf[this.lastBufferedIdx - 1] = 'pug_html = pug_html + ' + this.bufferStartChar + this.lastBuffered + '";';
    } else {
      this.bufferedConcatenationCount = 0;
      this.buf.push('pug_html = pug_html + "' + str + '";');
      this.lastBufferedType = 'text';
      this.bufferStartChar = '"';
      this.lastBuffered = str;
      this.lastBufferedIdx = this.buf.length;
    }
  },

  /**
   * Buffer the given `src` so it is evaluated at run time
   *
   * @param {String} src
   * @api public
   */

  bufferExpression: function (src) {
    if (isConstant(src)) {
      return this.buffer(toConstant(src) + '')
    }
    if (this.lastBufferedIdx == this.buf.length && this.bufferedConcatenationCount < 100) {
      this.bufferedConcatenationCount++;
      if (this.lastBufferedType === 'text') this.lastBuffered += '"';
      this.lastBufferedType = 'code';
      this.lastBuffered += ' + (' + src + ')';
      this.buf[this.lastBufferedIdx - 1] = 'pug_html = pug_html + (' + this.bufferStartChar + this.lastBuffered + ');';
    } else {
      this.bufferedConcatenationCount = 0;
      this.buf.push('pug_html = pug_html + (' + src + ');');
      this.lastBufferedType = 'code';
      this.bufferStartChar = '';
      this.lastBuffered = '(' + src + ')';
      this.lastBufferedIdx = this.buf.length;
    }
  },

  /**
   * Buffer an indent based on the current `indent`
   * property and an additional `offset`.
   *
   * @param {Number} offset
   * @param {Boolean} newline
   * @api public
   */

  prettyIndent: function(offset, newline){
    offset = offset || 0;
    newline = newline ? '\n' : '';
    this.buffer(newline + Array(this.indents + offset).join(this.pp));
    if (this.parentIndents)
      this.buf.push('pug_html = pug_html + pug_indent.join("");');
  },

  /**
   * Visit `node`.
   *
   * @param {Node} node
   * @api public
   */

  visit: function(node, parent){
    var debug = this.debug;

    if (!node) {
      var msg;
      if (parent) {
        msg = 'A child of ' + parent.type + ' (' + (parent.filename || 'Pug') + ':' + parent.line + ')';
      } else {
        msg = 'A top-level node';
      }
      msg += ' is ' + node + ', expected a Pug AST Node.';
      throw new TypeError(msg);
    }

    if (debug && node.debug !== false && node.type !== 'Block') {
      if (node.line) {
        var js = ';pug_debug_line = ' + node.line;
        if (node.filename) js += ';pug_debug_filename = ' + stringify(node.filename);
        this.buf.push(js + ';');
      }
    }

    if (!this['visit' + node.type]) {
      var msg;
      if (parent) {
        msg = 'A child of ' + parent.type
      } else {
        msg = 'A top-level node';
      }
      msg += ' (' + (node.filename || 'Pug') + ':' + node.line + ')'
           + ' is of type ' + node.type + ','
           + ' which is not supported by pug-code-gen.'
      switch (node.type) {
      case 'Filter':
        msg += ' Please use pug-filters to preprocess this AST.'
        break;
      case 'Extends':
      case 'Include':
      case 'NamedBlock':
      case 'FileReference': // unlikely but for the sake of completeness
        msg += ' Please use pug-linker to preprocess this AST.'
        break;
      }
      throw new TypeError(msg);
    }

    this.visitNode(node);
  },

  /**
   * Visit `node`.
   *
   * @param {Node} node
   * @api public
   */

  visitNode: function(node){
    return this['visit' + node.type](node);
  },

  /**
   * Visit case `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitCase: function(node){
    this.buf.push('switch (' + node.expr + '){');
    this.visit(node.block, node);
    this.buf.push('}');
  },

  /**
   * Visit when `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitWhen: function(node){
    if ('default' == node.expr) {
      this.buf.push('default:');
    } else {
      this.buf.push('case ' + node.expr + ':');
    }
    if (node.block) {
      this.visit(node.block, node);
      this.buf.push('  break;');
    }
  },

  /**
   * Visit literal `node`.
   *
   * @param {Literal} node
   * @api public
   */

  visitLiteral: function(node){
    this.buffer(node.str);
  },

  visitNamedBlock: function(block){
    return this.visitBlock(block);
  },
  /**
   * Visit all nodes in `block`.
   *
   * @param {Block} block
   * @api public
   */

  visitBlock: function(block){
    var escapePrettyMode = this.escapePrettyMode;
    var pp = this.pp;

    // Pretty print multi-line text
    if (pp && block.nodes.length > 1 && !escapePrettyMode &&
        block.nodes[0].type === 'Text' && block.nodes[1].type === 'Text' ) {
      this.prettyIndent(1, true);
    }
    for (var i = 0; i < block.nodes.length; ++i) {
      // Pretty print text
      if (pp && i > 0 && !escapePrettyMode &&
          block.nodes[i].type === 'Text' && block.nodes[i-1].type === 'Text' &&
          /\n$/.test(block.nodes[i - 1].val)) {
        this.prettyIndent(1, false);
      }
      this.visit(block.nodes[i], block);
    }
  },

  /**
   * Visit a mixin's `block` keyword.
   *
   * @param {MixinBlock} block
   * @api public
   */

  visitMixinBlock: function(block){
    if (this.pp) this.buf.push("pug_indent.push('" + Array(this.indents + 1).join(this.pp) + "');");
    this.buf.push('block && block();');
    if (this.pp) this.buf.push("pug_indent.pop();");
  },

  /**
   * Visit `doctype`. Sets terse mode to `true` when html 5
   * is used, causing self-closing tags to end with ">" vs "/>",
   * and boolean attributes are not mirrored.
   *
   * @param {Doctype} doctype
   * @api public
   */

  visitDoctype: function(doctype){
    if (doctype && (doctype.val || !this.doctype)) {
      this.setDoctype(doctype.val || 'html');
    }

    if (this.doctype) this.buffer(this.doctype);
    this.hasCompiledDoctype = true;
  },

  /**
   * Visit `mixin`, generating a function that
   * may be called within the template.
   *
   * @param {Mixin} mixin
   * @api public
   */

  visitMixin: function(mixin){
    var name = 'pug_mixins[';
    var args = mixin.args || '';
    var block = mixin.block;
    var attrs = mixin.attrs;
    var attrsBlocks = mixin.attributeBlocks && mixin.attributeBlocks.slice();
    var pp = this.pp;
    var dynamic = mixin.name[0]==='#';
    var key = mixin.name;
    if (dynamic) this.dynamicMixins = true;
    name += (dynamic ? mixin.name.substr(2,mixin.name.length-3):'"'+mixin.name+'"')+']';

    this.mixins[key] = this.mixins[key] || {used: false, instances: []};
    if (mixin.call) {
      this.mixins[key].used = true;
      if (pp) this.buf.push("pug_indent.push('" + Array(this.indents + 1).join(pp) + "');")
      if (block || attrs.length || attrsBlocks.length) {

        this.buf.push(name + '.call({');

        if (block) {
          this.buf.push('block: function(){');

          // Render block with no indents, dynamically added when rendered
          this.parentIndents++;
          var _indents = this.indents;
          this.indents = 0;
          this.visit(mixin.block, mixin);
          this.indents = _indents;
          this.parentIndents--;

          if (attrs.length || attrsBlocks.length) {
            this.buf.push('},');
          } else {
            this.buf.push('}');
          }
        }

        if (attrsBlocks.length) {
          if (attrs.length) {
            var val = this.attrs(attrs);
            attrsBlocks.unshift(val);
          }
          if (attrsBlocks.length > 1) {
            this.buf.push('attributes: ' + this.runtime('merge') + '([' + attrsBlocks.join(',') + '])');
          } else {
            this.buf.push('attributes: ' + attrsBlocks[0]);
          }
        } else if (attrs.length) {
          var val = this.attrs(attrs);
          this.buf.push('attributes: ' + val);
        }

        if (args) {
          this.buf.push('}, ' + args + ');');
        } else {
          this.buf.push('});');
        }

      } else {
        this.buf.push(name + '(' + args + ');');
      }
      if (pp) this.buf.push("pug_indent.pop();")
    } else {
      var mixin_start = this.buf.length;
      args = args ? args.split(',') : [];
      var rest;
      if (args.length && /^\.\.\./.test(args[args.length - 1].trim())) {
        rest = args.pop().trim().replace(/^\.\.\./, '');
      }
      // we need use pug_interp here for v8: https://code.google.com/p/v8/issues/detail?id=4165
      // once fixed, use this: this.buf.push(name + ' = function(' + args.join(',') + '){');
      this.buf.push(name + ' = pug_interp = function(' + args.join(',') + '){');
      this.buf.push('var block = (this && this.block), attributes = (this && this.attributes) || {};');
      if (rest) {
        this.buf.push('var ' + rest + ' = [];');
        this.buf.push('for (pug_interp = ' + args.length + '; pug_interp < arguments.length; pug_interp++) {');
        this.buf.push('  ' + rest + '.push(arguments[pug_interp]);');
        this.buf.push('}');
      }
      this.parentIndents++;
      this.visit(block, mixin);
      this.parentIndents--;
      this.buf.push('};');
      var mixin_end = this.buf.length;
      this.mixins[key].instances.push({start: mixin_start, end: mixin_end});
    }
  },

  /**
   * Visit `tag` buffering tag markup, generating
   * attributes, visiting the `tag`'s code and block.
   *
   * @param {Tag} tag
   * @param {boolean} interpolated
   * @api public
   */

  visitTag: function(tag, interpolated){
    this.indents++;
    var name = tag.name
      , pp = this.pp
      , self = this;

    function bufferName() {
      if (interpolated) self.bufferExpression(tag.expr);
      else self.buffer(name);
    }

    if (WHITE_SPACE_SENSITIVE_TAGS[tag.name] === true) this.escapePrettyMode = true;

    if (!this.hasCompiledTag) {
      if (!this.hasCompiledDoctype && 'html' == name) {
        this.visitDoctype();
      }
      this.hasCompiledTag = true;
    }

    // pretty print
    if (pp && !tag.isInline)
      this.prettyIndent(0, true);
    if (tag.selfClosing || (!this.xml && selfClosing[tag.name])) {
      this.buffer('<');
      bufferName();
      this.visitAttributes(tag.attrs, tag.attributeBlocks.slice());
      if (this.terse && !tag.selfClosing) {
        this.buffer('>');
      } else {
        this.buffer('/>');
      }
      // if it is non-empty throw an error
      if (tag.code ||
          tag.block &&
          !(tag.block.type === 'Block' && tag.block.nodes.length === 0) &&
          tag.block.nodes.some(function (tag) {
            return tag.type !== 'Text' || !/^\s*$/.test(tag.val)
          })) {
        this.error(name + ' is a self closing element: <'+name+'/> but contains nested content.', 'SELF_CLOSING_CONTENT', tag);
      }
    } else {
      // Optimize attributes buffering
      this.buffer('<');
      bufferName();
      this.visitAttributes(tag.attrs, tag.attributeBlocks.slice());
      this.buffer('>');
      if (tag.code) this.visitCode(tag.code);
      this.visit(tag.block, tag);

      // pretty print
      if (pp && !tag.isInline && WHITE_SPACE_SENSITIVE_TAGS[tag.name] !== true && !tagCanInline(tag))
        this.prettyIndent(0, true);

      this.buffer('</');
      bufferName();
      this.buffer('>');
    }

    if (WHITE_SPACE_SENSITIVE_TAGS[tag.name] === true) this.escapePrettyMode = false;

    this.indents--;
  },

  /**
   * Visit InterpolatedTag.
   *
   * @param {InterpolatedTag} tag
   * @api public
   */

  visitInterpolatedTag: function(tag) {
    return this.visitTag(tag, true);
  },

  /**
   * Visit `text` node.
   *
   * @param {Text} text
   * @api public
   */

  visitText: function(text){
    this.buffer(text.val);
  },

  /**
   * Visit a `comment`, only buffering when the buffer flag is set.
   *
   * @param {Comment} comment
   * @api public
   */

  visitComment: function(comment){
    if (!comment.buffer) return;
    if (this.pp) this.prettyIndent(1, true);
    this.buffer('<!--' + comment.val + '-->');
  },

  /**
   * Visit a `YieldBlock`.
   *
   * This is necessary since we allow compiling a file with `yield`.
   *
   * @param {YieldBlock} block
   * @api public
   */

  visitYieldBlock: function(block) {},

  /**
   * Visit a `BlockComment`.
   *
   * @param {Comment} comment
   * @api public
   */

  visitBlockComment: function(comment){
    if (!comment.buffer) return;
    if (this.pp) this.prettyIndent(1, true);
    this.buffer('<!--' + (comment.val || ''));
    this.visit(comment.block, comment);
    if (this.pp) this.prettyIndent(1, true);
    this.buffer('-->');
  },

  /**
   * Visit `code`, respecting buffer / escape flags.
   * If the code is followed by a block, wrap it in
   * a self-calling function.
   *
   * @param {Code} code
   * @api public
   */

  visitCode: function(code){
    // Wrap code blocks with {}.
    // we only wrap unbuffered code blocks ATM
    // since they are usually flow control

    // Buffer code
    if (code.buffer) {
      var val = code.val.trim();
      val = 'null == (pug_interp = '+val+') ? "" : pug_interp';
      if (code.mustEscape !== false) val = this.runtime('escape') + '(' + val + ')';
      this.bufferExpression(val);
    } else {
      this.buf.push(code.val);
    }

    // Block support
    if (code.block) {
      if (!code.buffer) this.buf.push('{');
      this.visit(code.block, code);
      if (!code.buffer) this.buf.push('}');
    }
  },

  /**
   * Visit `Conditional`.
   *
   * @param {Conditional} cond
   * @api public
   */

  visitConditional: function(cond){
    var test = cond.test;
    this.buf.push('if (' + test + ') {');
    this.visit(cond.consequent, cond);
    this.buf.push('}')
    if (cond.alternate) {
      if (cond.alternate.type === 'Conditional') {
        this.buf.push('else')
        this.visitConditional(cond.alternate);
      } else {
        this.buf.push('else {');
        this.visit(cond.alternate, cond);
        this.buf.push('}');
      }
    }
  },

  /**
   * Visit `While`.
   *
   * @param {While} loop
   * @api public
   */

  visitWhile: function(loop){
    var test = loop.test;
    this.buf.push('while (' + test + ') {');
    this.visit(loop.block, loop);
    this.buf.push('}');
  },

  /**
   * Visit `each` block.
   *
   * @param {Each} each
   * @api public
   */

  visitEach: function(each){
    var indexVarName = each.key || 'pug_index' + this.eachCount;
    this.eachCount++;

    this.buf.push(''
      + '// iterate ' + each.obj + '\n'
      + ';(function(){\n'
      + '  var $$obj = ' + each.obj + ';\n'
      + '  if (\'number\' == typeof $$obj.length) {');

    if (each.alternate) {
      this.buf.push('    if ($$obj.length) {');
    }

    this.buf.push(''
      + '      for (var ' + indexVarName + ' = 0, $$l = $$obj.length; ' + indexVarName + ' < $$l; ' + indexVarName + '++) {\n'
      + '        var ' + each.val + ' = $$obj[' + indexVarName + '];');

    this.visit(each.block, each);

    this.buf.push('      }');

    if (each.alternate) {
      this.buf.push('    } else {');
      this.visit(each.alternate, each);
      this.buf.push('    }');
    }

    this.buf.push(''
      + '  } else {\n'
      + '    var $$l = 0;\n'
      + '    for (var ' + indexVarName + ' in $$obj) {\n'
      + '      $$l++;\n'
      + '      var ' + each.val + ' = $$obj[' + indexVarName + '];');

    this.visit(each.block, each);

    this.buf.push('    }');
    if (each.alternate) {
      this.buf.push('    if ($$l === 0) {');
      this.visit(each.alternate, each);
      this.buf.push('    }');
    }
    this.buf.push('  }\n}).call(this);\n');
  },

  /**
   * Visit `attrs`.
   *
   * @param {Array} attrs
   * @api public
   */

  visitAttributes: function(attrs, attributeBlocks){
    if (attributeBlocks.length) {
      if (attrs.length) {
        var val = this.attrs(attrs);
        attributeBlocks.unshift(val);
      }
      if (attributeBlocks.length > 1) {
        this.bufferExpression(this.runtime('attrs') + '(' + this.runtime('merge') + '([' + attributeBlocks.join(',') + ']), ' + stringify(this.terse) + ')');
      } else {
        this.bufferExpression(this.runtime('attrs') + '(' + attributeBlocks[0] + ', ' + stringify(this.terse) + ')');
      }
    } else if (attrs.length) {
      this.attrs(attrs, true);
    }
  },

  /**
   * Compile attributes.
   */

  attrs: function(attrs, buffer){
    var res = compileAttrs(attrs, {
      terse: this.terse,
      format: buffer ? 'html' : 'object',
      runtime: this.runtime.bind(this)
    });
    if (buffer)  {
      this.bufferExpression(res);
    }
    return res;
  }
};

function tagCanInline(tag) {
  function isInline(node){
    // Recurse if the node is a block
    if (node.type === 'Block') return node.nodes.every(isInline);
    // When there is a YieldBlock here, it is an indication that the file is
    // expected to be included but is not. If this is the case, the block
    // must be empty.
    if (node.type === 'YieldBlock') return true;
    return (node.type === 'Text' && !/\n/.test(node.val)) || node.isInline;
  }

  return tag.block.nodes.every(isInline);
}

},{"constantinople":39,"doctypes":11,"js-stringify":8,"pug-attrs":24,"pug-error":17,"pug-runtime":26,"pug-runtime/build":25,"void-elements":23,"with":46}],15:[function(require,module,exports){
'use strict';

module.exports = walkAST;
function walkAST(ast, before, after, options) {
  if (after && typeof after === 'object' && typeof options === 'undefined') {
    options = after;
    after = null;
  }
  options = options || {includeDependencies: false};
  var parents = options.parents = options.parents || [];

  var replace = function replace(replacement) {
    if (Array.isArray(replacement) && !replace.arrayAllowed) {
      throw new Error('replace() can only be called with an array if the last parent is a Block or NamedBlock');
    }
    ast = replacement;
  };
  replace.arrayAllowed = parents[0] && (
    /^(Named)?Block$/.test(parents[0].type) ||
    parents[0].type === 'RawInclude' && ast.type === 'IncludeFilter');

  if (before) {
    var result = before(ast, replace);
    if (result === false) {
      return ast;
    } else if (Array.isArray(ast)) {
      // return right here to skip after() call on array
      return walkAndMergeNodes(ast);
    }
  }

  parents.unshift(ast);

  switch (ast.type) {
    case 'NamedBlock':
    case 'Block':
      ast.nodes = walkAndMergeNodes(ast.nodes);
      break;
    case 'Case':
    case 'Filter':
    case 'Mixin':
    case 'Tag':
    case 'InterpolatedTag':
    case 'When':
    case 'Code':
    case 'While':
      if (ast.block) {
        ast.block = walkAST(ast.block, before, after, options);
      }
      break;
    case 'Each':
      if (ast.block) {
        ast.block = walkAST(ast.block, before, after, options);
      }
      if (ast.alternate) {
        ast.alternate = walkAST(ast.alternate, before, after, options);
      }
      break;
    case 'Conditional':
      if (ast.consequent) {
        ast.consequent = walkAST(ast.consequent, before, after, options);
      }
      if (ast.alternate) {
        ast.alternate = walkAST(ast.alternate, before, after, options);
      }
      break;
    case 'Include':
      walkAST(ast.block, before, after, options);
      walkAST(ast.file, before, after, options);
      break;
    case 'Extends':
      walkAST(ast.file, before, after, options);
      break;
    case 'RawInclude':
      ast.filters = walkAndMergeNodes(ast.filters);
      walkAST(ast.file, before, after, options);
      break;
    case 'Attrs':
    case 'BlockComment':
    case 'Comment':
    case 'Doctype':
    case 'IncludeFilter':
    case 'MixinBlock':
    case 'YieldBlock':
    case 'Text':
      break;
    case 'FileReference':
      if (options.includeDependencies && ast.ast) {
        walkAST(ast.ast, before, after, options);
      }
      break;
    default:
      throw new Error('Unexpected node type ' + ast.type);
      break;
  }

  parents.shift();

  after && after(ast, replace);
  return ast;

  function walkAndMergeNodes(nodes) {
    return nodes.reduce(function (nodes, node) {
      var result = walkAST(node, before, after, options);
      if (Array.isArray(result)) {
        return nodes.concat(result);
      } else {
        return nodes.concat([result]);
      }
    }, []);
  }
}

},{}],16:[function(require,module,exports){

},{}],17:[function(require,module,exports){
'use strict';

module.exports = makeError;
function makeError(code, message, options) {
  var line = options.line;
  var column = options.column;
  var filename = options.filename;
  var src = options.src;
  var fullMessage;
  var location = line + (column ? ':' + column : '');
  if (src && line >= 1 && line <= src.split('\n').length) {
    var lines = src.split('\n');
    var start = Math.max(line - 3, 0);
    var end = Math.min(lines.length, line + 3);
    // Error context
    var context = lines.slice(start, end).map(function(text, i){
      var curr = i + start + 1;
      var preamble = (curr == line ? '  > ' : '    ')
        + curr
        + '| ';
      var out = preamble + text;
      if (curr === line && column > 0) {
        out += '\n';
        out += Array(preamble.length + column).join('-') + '^';
      }
      return out;
    }).join('\n');
    fullMessage = (filename || 'Pug') + ':' + location + '\n' + context + '\n\n' + message;
  } else {
    fullMessage = (filename || 'Pug') + ':' + location + '\n\n' + message;
  }
  var err = new Error(fullMessage);
  err.code = 'PUG:' + code;
  err.msg = message;
  err.line = line;
  err.column = column;
  err.filename = filename;
  err.src = src;
  err.toJSON = function () {
    return {
      code: this.code,
      msg: this.msg,
      line: this.line,
      column: this.column,
      filename: this.filename
    };
  };
  return err;
}

},{}],18:[function(require,module,exports){
(function (global){
'use strict';

// compare and isBuffer taken from https://github.com/feross/buffer/blob/680e9e5e488f22aac27599a57dc844a6315928dd/index.js
// original notice:

/*!
 * The buffer module from node.js, for the browser.
 *
 * @author   Feross Aboukhadijeh <feross@feross.org> <http://feross.org>
 * @license  MIT
 */
function compare(a, b) {
  if (a === b) {
    return 0;
  }

  var x = a.length;
  var y = b.length;

  for (var i = 0, len = Math.min(x, y); i < len; ++i) {
    if (a[i] !== b[i]) {
      x = a[i];
      y = b[i];
      break;
    }
  }

  if (x < y) {
    return -1;
  }
  if (y < x) {
    return 1;
  }
  return 0;
}
function isBuffer(b) {
  if (global.Buffer && typeof global.Buffer.isBuffer === 'function') {
    return global.Buffer.isBuffer(b);
  }
  return !!(b != null && b._isBuffer);
}

// based on node assert, original notice:

// http://wiki.commonjs.org/wiki/Unit_Testing/1.0
//
// THIS IS NOT TESTED NOR LIKELY TO WORK OUTSIDE V8!
//
// Originally from narwhal.js (http://narwhaljs.org)
// Copyright (c) 2009 Thomas Robinson <280north.com>
//
// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the 'Software'), to
// deal in the Software without restriction, including without limitation the
// rights to use, copy, modify, merge, publish, distribute, sublicense, and/or
// sell copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:
//
// The above copyright notice and this permission notice shall be included in
// all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN
// ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
// WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

var util = require('util/');
var hasOwn = Object.prototype.hasOwnProperty;
var pSlice = Array.prototype.slice;
var functionsHaveNames = (function () {
  return function foo() {}.name === 'foo';
}());
function pToString (obj) {
  return Object.prototype.toString.call(obj);
}
function isView(arrbuf) {
  if (isBuffer(arrbuf)) {
    return false;
  }
  if (typeof global.ArrayBuffer !== 'function') {
    return false;
  }
  if (typeof ArrayBuffer.isView === 'function') {
    return ArrayBuffer.isView(arrbuf);
  }
  if (!arrbuf) {
    return false;
  }
  if (arrbuf instanceof DataView) {
    return true;
  }
  if (arrbuf.buffer && arrbuf.buffer instanceof ArrayBuffer) {
    return true;
  }
  return false;
}
// 1. The assert module provides functions that throw
// AssertionError's when particular conditions are not met. The
// assert module must conform to the following interface.

var assert = module.exports = ok;

// 2. The AssertionError is defined in assert.
// new assert.AssertionError({ message: message,
//                             actual: actual,
//                             expected: expected })

var regex = /\s*function\s+([^\(\s]*)\s*/;
// based on https://github.com/ljharb/function.prototype.name/blob/adeeeec8bfcc6068b187d7d9fb3d5bb1d3a30899/implementation.js
function getName(func) {
  if (!util.isFunction(func)) {
    return;
  }
  if (functionsHaveNames) {
    return func.name;
  }
  var str = func.toString();
  var match = str.match(regex);
  return match && match[1];
}
assert.AssertionError = function AssertionError(options) {
  this.name = 'AssertionError';
  this.actual = options.actual;
  this.expected = options.expected;
  this.operator = options.operator;
  if (options.message) {
    this.message = options.message;
    this.generatedMessage = false;
  } else {
    this.message = getMessage(this);
    this.generatedMessage = true;
  }
  var stackStartFunction = options.stackStartFunction || fail;
  if (Error.captureStackTrace) {
    Error.captureStackTrace(this, stackStartFunction);
  } else {
    // non v8 browsers so we can have a stacktrace
    var err = new Error();
    if (err.stack) {
      var out = err.stack;

      // try to strip useless frames
      var fn_name = getName(stackStartFunction);
      var idx = out.indexOf('\n' + fn_name);
      if (idx >= 0) {
        // once we have located the function frame
        // we need to strip out everything before it (and its line)
        var next_line = out.indexOf('\n', idx + 1);
        out = out.substring(next_line + 1);
      }

      this.stack = out;
    }
  }
};

// assert.AssertionError instanceof Error
util.inherits(assert.AssertionError, Error);

function truncate(s, n) {
  if (typeof s === 'string') {
    return s.length < n ? s : s.slice(0, n);
  } else {
    return s;
  }
}
function inspect(something) {
  if (functionsHaveNames || !util.isFunction(something)) {
    return util.inspect(something);
  }
  var rawname = getName(something);
  var name = rawname ? ': ' + rawname : '';
  return '[Function' +  name + ']';
}
function getMessage(self) {
  return truncate(inspect(self.actual), 128) + ' ' +
         self.operator + ' ' +
         truncate(inspect(self.expected), 128);
}

// At present only the three keys mentioned above are used and
// understood by the spec. Implementations or sub modules can pass
// other keys to the AssertionError's constructor - they will be
// ignored.

// 3. All of the following functions must throw an AssertionError
// when a corresponding condition is not met, with a message that
// may be undefined if not provided.  All assertion methods provide
// both the actual and expected values to the assertion error for
// display purposes.

function fail(actual, expected, message, operator, stackStartFunction) {
  throw new assert.AssertionError({
    message: message,
    actual: actual,
    expected: expected,
    operator: operator,
    stackStartFunction: stackStartFunction
  });
}

// EXTENSION! allows for well behaved errors defined elsewhere.
assert.fail = fail;

// 4. Pure assertion tests whether a value is truthy, as determined
// by !!guard.
// assert.ok(guard, message_opt);
// This statement is equivalent to assert.equal(true, !!guard,
// message_opt);. To test strictly for the value true, use
// assert.strictEqual(true, guard, message_opt);.

function ok(value, message) {
  if (!value) fail(value, true, message, '==', assert.ok);
}
assert.ok = ok;

// 5. The equality assertion tests shallow, coercive equality with
// ==.
// assert.equal(actual, expected, message_opt);

assert.equal = function equal(actual, expected, message) {
  if (actual != expected) fail(actual, expected, message, '==', assert.equal);
};

// 6. The non-equality assertion tests for whether two objects are not equal
// with != assert.notEqual(actual, expected, message_opt);

assert.notEqual = function notEqual(actual, expected, message) {
  if (actual == expected) {
    fail(actual, expected, message, '!=', assert.notEqual);
  }
};

// 7. The equivalence assertion tests a deep equality relation.
// assert.deepEqual(actual, expected, message_opt);

assert.deepEqual = function deepEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'deepEqual', assert.deepEqual);
  }
};

assert.deepStrictEqual = function deepStrictEqual(actual, expected, message) {
  if (!_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'deepStrictEqual', assert.deepStrictEqual);
  }
};

function _deepEqual(actual, expected, strict, memos) {
  // 7.1. All identical values are equivalent, as determined by ===.
  if (actual === expected) {
    return true;
  } else if (isBuffer(actual) && isBuffer(expected)) {
    return compare(actual, expected) === 0;

  // 7.2. If the expected value is a Date object, the actual value is
  // equivalent if it is also a Date object that refers to the same time.
  } else if (util.isDate(actual) && util.isDate(expected)) {
    return actual.getTime() === expected.getTime();

  // 7.3 If the expected value is a RegExp object, the actual value is
  // equivalent if it is also a RegExp object with the same source and
  // properties (`global`, `multiline`, `lastIndex`, `ignoreCase`).
  } else if (util.isRegExp(actual) && util.isRegExp(expected)) {
    return actual.source === expected.source &&
           actual.global === expected.global &&
           actual.multiline === expected.multiline &&
           actual.lastIndex === expected.lastIndex &&
           actual.ignoreCase === expected.ignoreCase;

  // 7.4. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if ((actual === null || typeof actual !== 'object') &&
             (expected === null || typeof expected !== 'object')) {
    return strict ? actual === expected : actual == expected;

  // If both values are instances of typed arrays, wrap their underlying
  // ArrayBuffers in a Buffer each to increase performance
  // This optimization requires the arrays to have the same type as checked by
  // Object.prototype.toString (aka pToString). Never perform binary
  // comparisons for Float*Arrays, though, since e.g. +0 === -0 but their
  // bit patterns are not identical.
  } else if (isView(actual) && isView(expected) &&
             pToString(actual) === pToString(expected) &&
             !(actual instanceof Float32Array ||
               actual instanceof Float64Array)) {
    return compare(new Uint8Array(actual.buffer),
                   new Uint8Array(expected.buffer)) === 0;

  // 7.5 For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else if (isBuffer(actual) !== isBuffer(expected)) {
    return false;
  } else {
    memos = memos || {actual: [], expected: []};

    var actualIndex = memos.actual.indexOf(actual);
    if (actualIndex !== -1) {
      if (actualIndex === memos.expected.indexOf(expected)) {
        return true;
      }
    }

    memos.actual.push(actual);
    memos.expected.push(expected);

    return objEquiv(actual, expected, strict, memos);
  }
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function objEquiv(a, b, strict, actualVisitedObjects) {
  if (a === null || a === undefined || b === null || b === undefined)
    return false;
  // if one is a primitive, the other must be same
  if (util.isPrimitive(a) || util.isPrimitive(b))
    return a === b;
  if (strict && Object.getPrototypeOf(a) !== Object.getPrototypeOf(b))
    return false;
  var aIsArgs = isArguments(a);
  var bIsArgs = isArguments(b);
  if ((aIsArgs && !bIsArgs) || (!aIsArgs && bIsArgs))
    return false;
  if (aIsArgs) {
    a = pSlice.call(a);
    b = pSlice.call(b);
    return _deepEqual(a, b, strict);
  }
  var ka = objectKeys(a);
  var kb = objectKeys(b);
  var key, i;
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length !== kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] !== kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!_deepEqual(a[key], b[key], strict, actualVisitedObjects))
      return false;
  }
  return true;
}

// 8. The non-equivalence assertion tests for any deep inequality.
// assert.notDeepEqual(actual, expected, message_opt);

assert.notDeepEqual = function notDeepEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, false)) {
    fail(actual, expected, message, 'notDeepEqual', assert.notDeepEqual);
  }
};

assert.notDeepStrictEqual = notDeepStrictEqual;
function notDeepStrictEqual(actual, expected, message) {
  if (_deepEqual(actual, expected, true)) {
    fail(actual, expected, message, 'notDeepStrictEqual', notDeepStrictEqual);
  }
}


// 9. The strict equality assertion tests strict equality, as determined by ===.
// assert.strictEqual(actual, expected, message_opt);

assert.strictEqual = function strictEqual(actual, expected, message) {
  if (actual !== expected) {
    fail(actual, expected, message, '===', assert.strictEqual);
  }
};

// 10. The strict non-equality assertion tests for strict inequality, as
// determined by !==.  assert.notStrictEqual(actual, expected, message_opt);

assert.notStrictEqual = function notStrictEqual(actual, expected, message) {
  if (actual === expected) {
    fail(actual, expected, message, '!==', assert.notStrictEqual);
  }
};

function expectedException(actual, expected) {
  if (!actual || !expected) {
    return false;
  }

  if (Object.prototype.toString.call(expected) == '[object RegExp]') {
    return expected.test(actual);
  }

  try {
    if (actual instanceof expected) {
      return true;
    }
  } catch (e) {
    // Ignore.  The instanceof check doesn't work for arrow functions.
  }

  if (Error.isPrototypeOf(expected)) {
    return false;
  }

  return expected.call({}, actual) === true;
}

function _tryBlock(block) {
  var error;
  try {
    block();
  } catch (e) {
    error = e;
  }
  return error;
}

function _throws(shouldThrow, block, expected, message) {
  var actual;

  if (typeof block !== 'function') {
    throw new TypeError('"block" argument must be a function');
  }

  if (typeof expected === 'string') {
    message = expected;
    expected = null;
  }

  actual = _tryBlock(block);

  message = (expected && expected.name ? ' (' + expected.name + ').' : '.') +
            (message ? ' ' + message : '.');

  if (shouldThrow && !actual) {
    fail(actual, expected, 'Missing expected exception' + message);
  }

  var userProvidedMessage = typeof message === 'string';
  var isUnwantedException = !shouldThrow && util.isError(actual);
  var isUnexpectedException = !shouldThrow && actual && !expected;

  if ((isUnwantedException &&
      userProvidedMessage &&
      expectedException(actual, expected)) ||
      isUnexpectedException) {
    fail(actual, expected, 'Got unwanted exception' + message);
  }

  if ((shouldThrow && actual && expected &&
      !expectedException(actual, expected)) || (!shouldThrow && actual)) {
    throw actual;
  }
}

// 11. Expected to throw an error:
// assert.throws(block, Error_opt, message_opt);

assert.throws = function(block, /*optional*/error, /*optional*/message) {
  _throws(true, block, error, message);
};

// EXTENSION! This is annoying to write outside this module.
assert.doesNotThrow = function(block, /*optional*/error, /*optional*/message) {
  _throws(false, block, error, message);
};

assert.ifError = function(err) { if (err) throw err; };

var objectKeys = Object.keys || function (obj) {
  var keys = [];
  for (var key in obj) {
    if (hasOwn.call(obj, key)) keys.push(key);
  }
  return keys;
};

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"util/":5}],19:[function(require,module,exports){
arguments[4][16][0].apply(exports,arguments)
},{"dup":16}],20:[function(require,module,exports){
module.exports = {
  handleFilters: function(ast) {
    return ast;
  }
}

},{}],21:[function(require,module,exports){
(function (process){
'use strict';

/*!
 * Pug
 * Copyright(c) 2010 TJ Holowaychuk <tj@vision-media.ca>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var fs = require('fs');
var path = require('path');
var lex = require('pug-lexer');
var stripComments = require('pug-strip-comments');
var parse = require('pug-parser');
var load = require('pug-load');
var filters = require('pug-filters');
var link = require('pug-linker');
var generateCode = require('pug-code-gen');
var runtime = require('pug-runtime');
var runtimeWrap = require('pug-runtime/wrap');

/**
 * Name for detection
 */

exports.name = 'Pug';

/**
 * Pug runtime helpers.
 */

exports.runtime = runtime;

/**
 * Template function cache.
 */

exports.cache = {};

function applyPlugins(value, options, plugins, name) {
  return plugins.reduce(function (value, plugin) {
    return (
      plugin[name]
      ? plugin[name](value, options)
      : value
    );
  }, value);
}

function findReplacementFunc(plugins, name) {
  var eligiblePlugins = plugins.filter(function (plugin) {
    return plugin[name];
  });

  if (eligiblePlugins.length > 1) {
    throw new Error('Two or more plugins all implement ' + name + ' method.');
  } else if (eligiblePlugins.length) {
    return eligiblePlugins[0][name].bind(eligiblePlugins[0]);
  }
  return null;
}

/**
 * Object for global custom filters.  Note that you can also just pass a `filters`
 * option to any other method.
 */
exports.filters = {};

/**
 * Compile the given `str` of pug and return a function body.
 *
 * @param {String} str
 * @param {Object} options
 * @return {Object}
 * @api private
 */

function compileBody(str, options){
  var debug_sources = {};
  debug_sources[options.filename] = str;
  var dependencies = [];
  var plugins = options.plugins || [];
  var ast = load.string(str, {
    filename: options.filename,
    basedir: options.basedir,
    lex: function (str, options) {
      var lexOptions = {};
      Object.keys(options).forEach(function (key) {
        lexOptions[key] = options[key];
      });
      lexOptions.plugins = plugins.filter(function (plugin) {
        return !!plugin.lex;
      }).map(function (plugin) {
        return plugin.lex;
      });
      return applyPlugins(lex(str, lexOptions), options, plugins, 'postLex');
    },
    parse: function (tokens, options) {
      tokens = tokens.map(function (token) {
        if (token.type === 'path' && path.extname(token.val) === '') {
          return {
            type: 'path',
            line: token.line,
            col: token.col,
            val: token.val + '.pug'
          };
        }
        return token;
      });
      tokens = stripComments(tokens, options);
      tokens = applyPlugins(tokens, options, plugins, 'preParse');
      var parseOptions = {};
      Object.keys(options).forEach(function (key) {
        parseOptions[key] = options[key];
      });
      parseOptions.plugins = plugins.filter(function (plugin) {
        return !!plugin.parse;
      }).map(function (plugin) {
        return plugin.parse;
      });

      return applyPlugins(
        applyPlugins(parse(tokens, parseOptions), options, plugins, 'postParse'),
        options, plugins, 'preLoad'
      );
    },
    resolve: function (filename, source, loadOptions) {
      var replacementFunc = findReplacementFunc(plugins, 'resolve');
      if (replacementFunc) {
        return replacementFunc(filename, source, options);
      }

      return load.resolve(filename, source, loadOptions);
    },
    read: function (filename, loadOptions) {
      dependencies.push(filename);

      var contents;

      var replacementFunc = findReplacementFunc(plugins, 'read');
      if (replacementFunc) {
        contents = replacementFunc(filename, options);
      } else {
        contents = load.read(filename, loadOptions);
      }

      var str = applyPlugins(contents, {filename: filename}, plugins, 'preLex');
      debug_sources[filename] = str;
      return str;
    }
  });
  ast = applyPlugins(ast, options, plugins, 'postLoad');
  ast = applyPlugins(ast, options, plugins, 'preFilters');

  var filtersSet = {};
  Object.keys(exports.filters).forEach(function (key) {
    filtersSet[key] = exports.filters[key];
  });
  if (options.filters) {
    Object.keys(options.filters).forEach(function (key) {
      filtersSet[key] = options.filters[key];
    });
  }
  ast = filters.handleFilters(ast, filtersSet, options.filterOptions, options.filterAliases);

  ast = applyPlugins(ast, options, plugins, 'postFilters');
  ast = applyPlugins(ast, options, plugins, 'preLink');
  ast = link(ast);
  ast = applyPlugins(ast, options, plugins, 'postLink');

  // Compile
  ast = applyPlugins(ast, options, plugins, 'preCodeGen');
  var js = generateCode(ast, {
    pretty: options.pretty,
    compileDebug: options.compileDebug,
    doctype: options.doctype,
    inlineRuntimeFunctions: options.inlineRuntimeFunctions,
    globals: options.globals,
    self: options.self,
    includeSources: options.includeSources ? debug_sources : false,
    templateName: options.templateName
  });
  js = applyPlugins(js, options, plugins, 'postCodeGen');

  // Debug compiler
  if (options.debug) {
    console.error('\nCompiled Function:\n\n\u001b[90m%s\u001b[0m', js.replace(/^/gm, '  '));
  }

  return {body: js, dependencies: dependencies};
}

/**
 * Get the template from a string or a file, either compiled on-the-fly or
 * read from cache (if enabled), and cache the template if needed.
 *
 * If `str` is not set, the file specified in `options.filename` will be read.
 *
 * If `options.cache` is true, this function reads the file from
 * `options.filename` so it must be set prior to calling this function.
 *
 * @param {Object} options
 * @param {String=} str
 * @return {Function}
 * @api private
 */
function handleTemplateCache (options, str) {
  var key = options.filename;
  if (options.cache && exports.cache[key]) {
    return exports.cache[key];
  } else {
    if (str === undefined) str = fs.readFileSync(options.filename, 'utf8');
    var templ = exports.compile(str, options);
    if (options.cache) exports.cache[key] = templ;
    return templ;
  }
}

/**
 * Compile a `Function` representation of the given pug `str`.
 *
 * Options:
 *
 *   - `compileDebug` when `false` debugging code is stripped from the compiled
       template, when it is explicitly `true`, the source code is included in
       the compiled template for better accuracy.
 *   - `filename` used to improve errors when `compileDebug` is not `false` and to resolve imports/extends
 *
 * @param {String} str
 * @param {Options} options
 * @return {Function}
 * @api public
 */

exports.compile = function(str, options){
  var options = options || {}

  str = String(str);

  var parsed = compileBody(str, {
    compileDebug: options.compileDebug !== false,
    filename: options.filename,
    basedir: options.basedir,
    pretty: options.pretty,
    doctype: options.doctype,
    inlineRuntimeFunctions: options.inlineRuntimeFunctions,
    globals: options.globals,
    self: options.self,
    includeSources: options.compileDebug === true,
    debug: options.debug,
    templateName: 'template',
    filters: options.filters,
    filterOptions: options.filterOptions,
    filterAliases: options.filterAliases,
    plugins: options.plugins,
  });

  var res = options.inlineRuntimeFunctions
    ? new Function('', parsed.body + ';return template;')()
    : runtimeWrap(parsed.body);

  res.dependencies = parsed.dependencies;

  return res;
};

/**
 * Compile a JavaScript source representation of the given pug `str`.
 *
 * Options:
 *
 *   - `compileDebug` When it is `true`, the source code is included in
 *     the compiled template for better error messages.
 *   - `filename` used to improve errors when `compileDebug` is not `true` and to resolve imports/extends
 *   - `name` the name of the resulting function (defaults to "template")
 *   - `module` when it is explicitly `true`, the source code include export module syntax
 *
 * @param {String} str
 * @param {Options} options
 * @return {Object}
 * @api public
 */

exports.compileClientWithDependenciesTracked = function(str, options){
  var options = options || {};

  str = String(str);
  var parsed = compileBody(str, {
    compileDebug: options.compileDebug,
    filename: options.filename,
    basedir: options.basedir,
    pretty: options.pretty,
    doctype: options.doctype,
    inlineRuntimeFunctions: options.inlineRuntimeFunctions !== false,
    globals: options.globals,
    self: options.self,
    includeSources: options.compileDebug,
    debug: options.debug,
    templateName: options.name || 'template',
    filters: options.filters,
    filterOptions: options.filterOptions,
    filterAliases: options.filterAliases,
    plugins: options.plugins
  });

  var body = parsed.body;

  if(options.module) {
    if(options.inlineRuntimeFunctions === false) {
      body = 'var pug = require("pug-runtime");' + body;
    }
    body += ' module.exports = ' + (options.name || 'template') + ';';
  }

  return {body: body, dependencies: parsed.dependencies};
};

/**
 * Compile a JavaScript source representation of the given pug `str`.
 *
 * Options:
 *
 *   - `compileDebug` When it is `true`, the source code is included in
 *     the compiled template for better error messages.
 *   - `filename` used to improve errors when `compileDebug` is not `true` and to resolve imports/extends
 *   - `name` the name of the resulting function (defaults to "template")
 *
 * @param {String} str
 * @param {Options} options
 * @return {String}
 * @api public
 */
exports.compileClient = function (str, options) {
  return exports.compileClientWithDependenciesTracked(str, options).body;
};

/**
 * Compile a `Function` representation of the given pug file.
 *
 * Options:
 *
 *   - `compileDebug` when `false` debugging code is stripped from the compiled
       template, when it is explicitly `true`, the source code is included in
       the compiled template for better accuracy.
 *
 * @param {String} path
 * @param {Options} options
 * @return {Function}
 * @api public
 */
exports.compileFile = function (path, options) {
  options = options || {};
  options.filename = path;
  return handleTemplateCache(options);
};

/**
 * Render the given `str` of pug.
 *
 * Options:
 *
 *   - `cache` enable template caching
 *   - `filename` filename required for `include` / `extends` and caching
 *
 * @param {String} str
 * @param {Object|Function} options or fn
 * @param {Function|undefined} fn
 * @returns {String}
 * @api public
 */

exports.render = function(str, options, fn){
  // support callback API
  if ('function' == typeof options) {
    fn = options, options = undefined;
  }
  if (typeof fn === 'function') {
    var res;
    try {
      res = exports.render(str, options);
    } catch (ex) {
      return fn(ex);
    }
    return fn(null, res);
  }

  options = options || {};

  // cache requires .filename
  if (options.cache && !options.filename) {
    throw new Error('the "filename" option is required for caching');
  }

  return handleTemplateCache(options, str)(options);
};

/**
 * Render a Pug file at the given `path`.
 *
 * @param {String} path
 * @param {Object|Function} options or callback
 * @param {Function|undefined} fn
 * @returns {String}
 * @api public
 */

exports.renderFile = function(path, options, fn){
  // support callback API
  if ('function' == typeof options) {
    fn = options, options = undefined;
  }
  if (typeof fn === 'function') {
    var res;
    try {
      res = exports.renderFile(path, options);
    } catch (ex) {
      return fn(ex);
    }
    return fn(null, res);
  }

  options = options || {};

  options.filename = path;
  return handleTemplateCache(options)(options);
};


/**
 * Compile a Pug file at the given `path` for use on the client.
 *
 * @param {String} path
 * @param {Object} options
 * @returns {String}
 * @api public
 */

exports.compileFileClient = function(path, options){
  var key = path + ':client';
  options = options || {};

  options.filename = path;

  if (options.cache && exports.cache[key]) {
    return exports.cache[key];
  }

  var str = fs.readFileSync(options.filename, 'utf8');
  var out = exports.compileClient(str, options);
  if (options.cache) exports.cache[key] = out;
  return out;
};

/**
 * Express support.
 */

exports.__express = function(path, options, fn) {
  if(options.compileDebug == undefined && process.env.NODE_ENV === 'production') {
    options.compileDebug = false;
  }
  exports.renderFile(path, options, fn);
}

}).call(this,require('_process'))
},{"_process":6,"fs":16,"path":2,"pug-code-gen":14,"pug-filters":20,"pug-lexer":40,"pug-linker":37,"pug-load":31,"pug-parser":35,"pug-runtime":26,"pug-runtime/wrap":30,"pug-strip-comments":9}],22:[function(require,module,exports){
if (typeof Object.create === 'function') {
  // implementation from standard node.js 'util' module
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    ctor.prototype = Object.create(superCtor.prototype, {
      constructor: {
        value: ctor,
        enumerable: false,
        writable: true,
        configurable: true
      }
    });
  };
} else {
  // old school shim for old browsers
  module.exports = function inherits(ctor, superCtor) {
    ctor.super_ = superCtor
    var TempCtor = function () {}
    TempCtor.prototype = superCtor.prototype
    ctor.prototype = new TempCtor()
    ctor.prototype.constructor = ctor
  }
}

},{}],23:[function(require,module,exports){
/**
 * This file automatically generated from `pre-publish.js`.
 * Do not manually edit.
 */

module.exports = {
  "area": true,
  "base": true,
  "br": true,
  "col": true,
  "embed": true,
  "hr": true,
  "img": true,
  "input": true,
  "keygen": true,
  "link": true,
  "menuitem": true,
  "meta": true,
  "param": true,
  "source": true,
  "track": true,
  "wbr": true
};

},{}],24:[function(require,module,exports){
'use strict';

var assert = require('assert');
var constantinople = require('constantinople');
var runtime = require('pug-runtime');
var stringify = require('js-stringify');

function isConstant(src) {
  return constantinople(src, {pug: runtime, 'pug_interp': undefined});
}
function toConstant(src) {
  return constantinople.toConstant(src, {pug: runtime, 'pug_interp': undefined});
}

module.exports = compileAttrs;
/**
 * options:
 *  - terse
 *  - runtime
 *  - format ('html' || 'object')
 */
function compileAttrs(attrs, options) {
  assert(Array.isArray(attrs), 'Attrs should be an array');
  assert(attrs.every(function (attr) {
    return attr &&
      typeof attr === 'object' &&
      typeof attr.name === 'string' &&
      (typeof attr.val === 'string' || typeof attr.val === 'boolean') &&
      typeof attr.mustEscape === 'boolean';
  }), 'All attributes should be supplied as an object of the form {name, val, mustEscape}');
  assert(options && typeof options === 'object', 'Options should be an object');
  assert(typeof options.terse === 'boolean', 'Options.terse should be a boolean');
  assert(
    typeof options.runtime === 'function',
    'Options.runtime should be a function that takes a runtime function name and returns the source code that will evaluate to that function at runtime'
  );
  assert(
    options.format === 'html' || options.format === 'object',
    'Options.format should be "html" or "object"'
  );

  var buf = [];
  var classes = [];
  var classEscaping = [];

  function addAttribute(key, val, mustEscape, buf) {
    if (isConstant(val)) {
      if (options.format === 'html') {
        var str = stringify(runtime.attr(key, toConstant(val), mustEscape, options.terse));
        var last = buf[buf.length - 1];
        if (last && last[last.length - 1] === str[0]) {
          buf[buf.length - 1] = last.substr(0, last.length - 1) + str.substr(1);
        } else {
          buf.push(str);
        }
      } else {
        val = toConstant(val);
        if (mustEscape) {
          val = runtime.escape(val);
        }
        buf.push(stringify(key) + ': ' + stringify(val));
      }
    } else {
      if (options.format === 'html') {
        buf.push(options.runtime('attr') + '("' + key + '", ' + val + ', ' + stringify(mustEscape) + ', ' + stringify(options.terse) + ')');
      } else {
        if (mustEscape) {
          val = options.runtime('escape') + '(' + val + ')';
        }
        buf.push(stringify(key) + ': ' + val);
      }
    }
  }

  attrs.forEach(function(attr){
    var key = attr.name;
    var val = attr.val;
    var mustEscape = attr.mustEscape;

    if (key === 'class') {
      classes.push(val);
      classEscaping.push(mustEscape);
    } else {
      if (key === 'style') {
        if (isConstant(val)) {
          val = stringify(runtime.style(toConstant(val)));
        } else {
          val = options.runtime('style') + '(' + val + ')';
        }
      }
      addAttribute(key, val, mustEscape, buf);
    }
  });
  var classesBuf = [];
  if (classes.length) {
    if (classes.every(isConstant)) {
      addAttribute(
        'class',
        stringify(runtime.classes(classes.map(toConstant), classEscaping)),
        false,
        classesBuf
      );
    } else {
      classes = classes.map(function (cls, i) {
        if (isConstant(cls)) {
          cls = stringify(classEscaping[i] ? runtime.escape(toConstant(cls)) : toConstant(cls));
          classEscaping[i] = false;
        }
        return cls;
      });
      addAttribute(
        'class',
        options.runtime('classes') + '([' + classes.join(',') + '], ' + stringify(classEscaping) + ')',
        false,
        classesBuf
      );
    }
  }
  buf = classesBuf.concat(buf);
  if (options.format === 'html') return buf.length ? buf.join('+') : '""';
  else return '{' + buf.join(',') + '}';
}

},{"assert":18,"constantinople":39,"js-stringify":8,"pug-runtime":26}],25:[function(require,module,exports){
'use strict';

var fs = require('fs');
var dependencies = require('./lib/dependencies.js');
var internals = require('./lib/internals.js');
var sources = require('./lib/sources.js');

module.exports = build;

function build(functions) {
  var fns = [];
  functions = functions.filter(function (fn) {
    return !internals[fn];
  });
  for (var i = 0; i < functions.length; i++) {
    if (fns.indexOf(functions[i]) === -1) {
      fns.push(functions[i]);
      functions.push.apply(functions, dependencies[functions[i]]);
    }
  }
  return fns.sort().map(function (name) {
    return sources[name];
  }).join('\n');
}

},{"./lib/dependencies.js":27,"./lib/internals.js":28,"./lib/sources.js":29,"fs":16}],26:[function(require,module,exports){
'use strict';

var pug_has_own_property = Object.prototype.hasOwnProperty;

/**
 * Merge two attribute objects giving precedence
 * to values in object `b`. Classes are special-cased
 * allowing for arrays and merging/joining appropriately
 * resulting in a string.
 *
 * @param {Object} a
 * @param {Object} b
 * @return {Object} a
 * @api private
 */

exports.merge = pug_merge;
function pug_merge(a, b) {
  if (arguments.length === 1) {
    var attrs = a[0];
    for (var i = 1; i < a.length; i++) {
      attrs = pug_merge(attrs, a[i]);
    }
    return attrs;
  }

  for (var key in b) {
    if (key === 'class') {
      var valA = a[key] || [];
      a[key] = (Array.isArray(valA) ? valA : [valA]).concat(b[key] || []);
    } else if (key === 'style') {
      var valA = pug_style(a[key]);
      var valB = pug_style(b[key]);
      a[key] = valA + valB;
    } else {
      a[key] = b[key];
    }
  }

  return a;
};

/**
 * Process array, object, or string as a string of classes delimited by a space.
 *
 * If `val` is an array, all members of it and its subarrays are counted as
 * classes. If `escaping` is an array, then whether or not the item in `val` is
 * escaped depends on the corresponding item in `escaping`. If `escaping` is
 * not an array, no escaping is done.
 *
 * If `val` is an object, all the keys whose value is truthy are counted as
 * classes. No escaping is done.
 *
 * If `val` is a string, it is counted as a class. No escaping is done.
 *
 * @param {(Array.<string>|Object.<string, boolean>|string)} val
 * @param {?Array.<string>} escaping
 * @return {String}
 */
exports.classes = pug_classes;
function pug_classes_array(val, escaping) {
  var classString = '', className, padding = '', escapeEnabled = Array.isArray(escaping);
  for (var i = 0; i < val.length; i++) {
    className = pug_classes(val[i]);
    if (!className) continue;
    escapeEnabled && escaping[i] && (className = pug_escape(className));
    classString = classString + padding + className;
    padding = ' ';
  }
  return classString;
}
function pug_classes_object(val) {
  var classString = '', padding = '';
  for (var key in val) {
    if (key && val[key] && pug_has_own_property.call(val, key)) {
      classString = classString + padding + key;
      padding = ' ';
    }
  }
  return classString;
}
function pug_classes(val, escaping) {
  if (Array.isArray(val)) {
    return pug_classes_array(val, escaping);
  } else if (val && typeof val === 'object') {
    return pug_classes_object(val);
  } else {
    return val || '';
  }
}

/**
 * Convert object or string to a string of CSS styles delimited by a semicolon.
 *
 * @param {(Object.<string, string>|string)} val
 * @return {String}
 */

exports.style = pug_style;
function pug_style(val) {
  if (!val) return '';
  if (typeof val === 'object') {
    var out = '';
    for (var style in val) {
      /* istanbul ignore else */
      if (pug_has_own_property.call(val, style)) {
        out = out + style + ':' + val[style] + ';';
      }
    }
    return out;
  } else {
    val += '';
    if (val[val.length - 1] !== ';') 
      return val + ';';
    return val;
  }
};

/**
 * Render the given attribute.
 *
 * @param {String} key
 * @param {String} val
 * @param {Boolean} escaped
 * @param {Boolean} terse
 * @return {String}
 */
exports.attr = pug_attr;
function pug_attr(key, val, escaped, terse) {
  if (val === false || val == null || !val && (key === 'class' || key === 'style')) {
    return '';
  }
  if (val === true) {
    return ' ' + (terse ? key : key + '="' + key + '"');
  }
  if (typeof val.toJSON === 'function') {
    val = val.toJSON();
  }
  if (typeof val !== 'string') {
    val = JSON.stringify(val);
    if (!escaped && val.indexOf('"') !== -1) {
      return ' ' + key + '=\'' + val.replace(/'/g, '&#39;') + '\'';
    }
  }
  if (escaped) val = pug_escape(val);
  return ' ' + key + '="' + val + '"';
};

/**
 * Render the given attributes object.
 *
 * @param {Object} obj
 * @param {Object} terse whether to use HTML5 terse boolean attributes
 * @return {String}
 */
exports.attrs = pug_attrs;
function pug_attrs(obj, terse){
  var attrs = '';

  for (var key in obj) {
    if (pug_has_own_property.call(obj, key)) {
      var val = obj[key];

      if ('class' === key) {
        val = pug_classes(val);
        attrs = pug_attr(key, val, false, terse) + attrs;
        continue;
      }
      if ('style' === key) {
        val = pug_style(val);
      }
      attrs += pug_attr(key, val, false, terse);
    }
  }

  return attrs;
};

/**
 * Escape the given string of `html`.
 *
 * @param {String} html
 * @return {String}
 * @api private
 */

var pug_match_html = /["&<>]/;
exports.escape = pug_escape;
function pug_escape(_html){
  var html = '' + _html;
  var regexResult = pug_match_html.exec(html);
  if (!regexResult) return _html;

  var result = '';
  var i, lastIndex, escape;
  for (i = regexResult.index, lastIndex = 0; i < html.length; i++) {
    switch (html.charCodeAt(i)) {
      case 34: escape = '&quot;'; break;
      case 38: escape = '&amp;'; break;
      case 60: escape = '&lt;'; break;
      case 62: escape = '&gt;'; break;
      default: continue;
    }
    if (lastIndex !== i) result += html.substring(lastIndex, i);
    lastIndex = i + 1;
    result += escape;
  }
  if (lastIndex !== i) return result + html.substring(lastIndex, i);
  else return result;
};

/**
 * Re-throw the given `err` in context to the
 * the pug in `filename` at the given `lineno`.
 *
 * @param {Error} err
 * @param {String} filename
 * @param {String} lineno
 * @param {String} str original source
 * @api private
 */

exports.rethrow = pug_rethrow;
function pug_rethrow(err, filename, lineno, str){
  if (!(err instanceof Error)) throw err;
  if ((typeof window != 'undefined' || !filename) && !str) {
    err.message += ' on line ' + lineno;
    throw err;
  }
  try {
    str = str || require('fs').readFileSync(filename, 'utf8')
  } catch (ex) {
    pug_rethrow(err, null, lineno)
  }
  var context = 3
    , lines = str.split('\n')
    , start = Math.max(lineno - context, 0)
    , end = Math.min(lines.length, lineno + context);

  // Error context
  var context = lines.slice(start, end).map(function(line, i){
    var curr = i + start + 1;
    return (curr == lineno ? '  > ' : '    ')
      + curr
      + '| '
      + line;
  }).join('\n');

  // Alter exception message
  err.path = filename;
  err.message = (filename || 'Pug') + ':' + lineno
    + '\n' + context + '\n\n' + err.message;
  throw err;
};

},{"fs":16}],27:[function(require,module,exports){
module.exports = {
  "has_own_property": [],
  "merge": [
    "style"
  ],
  "classes_array": [
    "classes",
    "escape"
  ],
  "classes_object": [
    "has_own_property"
  ],
  "classes": [
    "classes_array",
    "classes_object"
  ],
  "style": [
    "has_own_property"
  ],
  "attr": [
    "escape"
  ],
  "attrs": [
    "attr",
    "classes",
    "has_own_property",
    "style"
  ],
  "match_html": [],
  "escape": [
    "match_html"
  ],
  "rethrow": []
}

},{}],28:[function(require,module,exports){
module.exports = {
  "dependencies": true,
  "internals": true,
  "has_own_property": true,
  "classes_array": true,
  "classes_object": true,
  "match_html": true
}

},{}],29:[function(require,module,exports){
module.exports = {
  "has_own_property": "var pug_has_own_property=Object.prototype.hasOwnProperty;",
  "merge": "function pug_merge(r,e){if(1===arguments.length){for(var t=r[0],a=1;a<r.length;a++)t=pug_merge(t,r[a]);return t}for(var g in e)if(\"class\"===g){var l=r[g]||[];r[g]=(Array.isArray(l)?l:[l]).concat(e[g]||[])}else if(\"style\"===g){var l=pug_style(r[g]),n=pug_style(e[g]);r[g]=l+n}else r[g]=e[g];return r}",
  "classes_array": "function pug_classes_array(r,a){for(var s,e=\"\",u=\"\",c=Array.isArray(a),g=0;g<r.length;g++)s=pug_classes(r[g]),s&&(c&&a[g]&&(s=pug_escape(s)),e=e+u+s,u=\" \");return e}",
  "classes_object": "function pug_classes_object(r){var a=\"\",n=\"\";for(var o in r)o&&r[o]&&pug_has_own_property.call(r,o)&&(a=a+n+o,n=\" \");return a}",
  "classes": "function pug_classes(s,r){return Array.isArray(s)?pug_classes_array(s,r):s&&\"object\"==typeof s?pug_classes_object(s):s||\"\"}",
  "style": "function pug_style(r){if(!r)return\"\";if(\"object\"==typeof r){var t=\"\";for(var e in r)pug_has_own_property.call(r,e)&&(t=t+e+\":\"+r[e]+\";\");return t}return r+=\"\",\";\"!==r[r.length-1]?r+\";\":r}",
  "attr": "function pug_attr(t,e,n,f){return e!==!1&&null!=e&&(e||\"class\"!==t&&\"style\"!==t)?e===!0?\" \"+(f?t:t+'=\"'+t+'\"'):(\"function\"==typeof e.toJSON&&(e=e.toJSON()),\"string\"==typeof e||(e=JSON.stringify(e),n||e.indexOf('\"')===-1)?(n&&(e=pug_escape(e)),\" \"+t+'=\"'+e+'\"'):\" \"+t+\"='\"+e.replace(/'/g,\"&#39;\")+\"'\"):\"\"}",
  "attrs": "function pug_attrs(t,r){var a=\"\";for(var s in t)if(pug_has_own_property.call(t,s)){var u=t[s];if(\"class\"===s){u=pug_classes(u),a=pug_attr(s,u,!1,r)+a;continue}\"style\"===s&&(u=pug_style(u)),a+=pug_attr(s,u,!1,r)}return a}",
  "match_html": "var pug_match_html=/[\"&<>]/;",
  "escape": "function pug_escape(e){var a=\"\"+e,t=pug_match_html.exec(a);if(!t)return e;var r,c,n,s=\"\";for(r=t.index,c=0;r<a.length;r++){switch(a.charCodeAt(r)){case 34:n=\"&quot;\";break;case 38:n=\"&amp;\";break;case 60:n=\"&lt;\";break;case 62:n=\"&gt;\";break;default:continue}c!==r&&(s+=a.substring(c,r)),c=r+1,s+=n}return c!==r?s+a.substring(c,r):s}",
  "rethrow": "function pug_rethrow(n,e,r,t){if(!(n instanceof Error))throw n;if(!(\"undefined\"==typeof window&&e||t))throw n.message+=\" on line \"+r,n;try{t=t||require(\"fs\").readFileSync(e,\"utf8\")}catch(e){pug_rethrow(n,null,r)}var i=3,a=t.split(\"\\n\"),o=Math.max(r-i,0),h=Math.min(a.length,r+i),i=a.slice(o,h).map(function(n,e){var t=e+o+1;return(t==r?\"  > \":\"    \")+t+\"| \"+n}).join(\"\\n\");throw n.path=e,n.message=(e||\"Pug\")+\":\"+r+\"\\n\"+i+\"\\n\\n\"+n.message,n}"
}

},{}],30:[function(require,module,exports){
var runtime = require('./');

module.exports = wrap;
function wrap(template, templateName) {
  templateName = templateName || 'template';
  return Function('pug',
    template + '\n' +
    'return ' + templateName + ';'
  )(runtime);
}

},{"./":26}],31:[function(require,module,exports){
'use strict';

var fs = require('fs');
var path = require('path');
var walk = require('pug-walk');
var assign = require('object-assign');

module.exports = load;
function load(ast, options) {
  options = getOptions(options);
  // clone the ast
  ast = JSON.parse(JSON.stringify(ast));
  return walk(ast, function (node) {
    if (node.str === undefined) {
      if (node.type === 'Include' || node.type === 'RawInclude' || node.type === 'Extends') {
        var file = node.file;
        if (file.type !== 'FileReference') {
          throw new Error('Expected file.type to be "FileReference"');
        }
        var path, str;
        try {
          path = options.resolve(file.path, file.filename, options);
          file.fullPath = path;
          str = options.read(path, options);
        } catch (ex) {
          ex.message += '\n    at ' + node.filename + ' line ' + node.line;
          throw ex;
        }
        file.str = str;
        if (node.type === 'Extends' || node.type === 'Include') {
          file.ast = load.string(str, assign({}, options, {
            filename: path
          }));
        }
      }
    }
  });
}

load.string = function loadString(src, options) {
  options = assign(getOptions(options), {
    src: src
  });
  var tokens = options.lex(src, options);
  var ast = options.parse(tokens, options);
  return load(ast, options);
};
load.file = function loadFile(filename, options) {
  options = assign(getOptions(options), {
    filename: filename
  });
  var str = options.read(filename);
  return load.string(str, options);
}

load.resolve = function resolve(filename, source, options) {
  filename = filename.trim();
  if (filename[0] !== '/' && !source)
    throw new Error('the "filename" option is required to use includes and extends with "relative" paths');

  if (filename[0] === '/' && !options.basedir)
    throw new Error('the "basedir" option is required to use includes and extends with "absolute" paths');

  filename = path.join(filename[0] === '/' ? options.basedir : path.dirname(source.trim()), filename);

  return filename;
};
load.read = function read(filename, options) {
  return fs.readFileSync(filename, 'utf8');
};

load.validateOptions = function validateOptions(options) {
  /* istanbul ignore if */
  if (typeof options !== 'object') {
    throw new TypeError('options must be an object');
  }
  /* istanbul ignore if */
  if (typeof options.lex !== 'function') {
    throw new TypeError('options.lex must be a function');
  }
  /* istanbul ignore if */
  if (typeof options.parse !== 'function') {
    throw new TypeError('options.parse must be a function');
  }
  /* istanbul ignore if */
  if (options.resolve && typeof options.resolve !== 'function') {
    throw new TypeError('options.resolve must be a function');
  }
  /* istanbul ignore if */
  if (options.read && typeof options.read !== 'function') {
    throw new TypeError('options.read must be a function');
  }
};

function getOptions(options) {
  load.validateOptions(options);
  return assign({
    resolve: load.resolve,
    read: load.read
  }, options);
}

},{"fs":19,"object-assign":45,"path":2,"pug-walk":15}],32:[function(require,module,exports){
'use strict';

var acorn = require('acorn');
var objectAssign = require('object-assign');

module.exports = isExpression;

var DEFAULT_OPTIONS = {
  throw: false,
  strict: false,
  lineComment: false
};

function isExpression(src, options) {
  options = objectAssign({}, DEFAULT_OPTIONS, options);

  try {
    var parser = new acorn.Parser(options, src, 0);

    if (options.strict) {
      parser.strict = true;
    }

    if (!options.lineComment) {
      parser.skipLineComment = function (startSkip) {
        this.raise(this.pos, 'Line comments not allowed in an expression');
      };
    }

    parser.nextToken();
    parser.parseExpression();

    if (parser.type !== acorn.tokTypes.eof) {
      parser.unexpected();
    }
  } catch (ex) {
    if (!options.throw) {
      return false;
    }

    throw ex;
  }

  return true;
}

},{"acorn":41,"object-assign":45}],33:[function(require,module,exports){
'use strict';

var objIsRegex = require('is-regex');

exports = (module.exports = parse);

var TOKEN_TYPES = exports.TOKEN_TYPES = {
  LINE_COMMENT: '//',
  BLOCK_COMMENT: '/**/',
  SINGLE_QUOTE: '\'',
  DOUBLE_QUOTE: '"',
  TEMPLATE_QUOTE: '`',
  REGEXP: '//g'
}

var BRACKETS = exports.BRACKETS = {
  '(': ')',
  '{': '}',
  '[': ']'
};
var BRACKETS_REVERSED = {
  ')': '(',
  '}': '{',
  ']': '['
};

exports.parse = parse;
function parse(src, state, options) {
  options = options || {};
  state = state || exports.defaultState();
  var start = options.start || 0;
  var end = options.end || src.length;
  var index = start;
  while (index < end) {
    try {
      parseChar(src[index], state);
    } catch (ex) {
      ex.index = index;
      throw ex;
    }
    index++;
  }
  return state;
}

exports.parseUntil = parseUntil;
function parseUntil(src, delimiter, options) {
  options = options || {};
  var start = options.start || 0;
  var index = start;
  var state = exports.defaultState();
  while (index < src.length) {
    if ((options.ignoreNesting || !state.isNesting(options)) && matches(src, delimiter, index)) {
      var end = index;
      return {
        start: start,
        end: end,
        src: src.substring(start, end)
      };
    }
    try {
      parseChar(src[index], state);
    } catch (ex) {
      ex.index = index;
      throw ex;
    }
    index++;
  }
  var err = new Error('The end of the string was reached with no closing bracket found.');
  err.code = 'CHARACTER_PARSER:END_OF_STRING_REACHED';
  err.index = index;
  throw err;
}

exports.parseChar = parseChar;
function parseChar(character, state) {
  if (character.length !== 1) {
    var err = new Error('Character must be a string of length 1');
    err.name = 'InvalidArgumentError';
    err.code = 'CHARACTER_PARSER:CHAR_LENGTH_NOT_ONE';
    throw err;
  }
  state = state || exports.defaultState();
  state.src += character;
  var wasComment = state.isComment();
  var lastChar = state.history ? state.history[0] : '';


  if (state.regexpStart) {
    if (character === '/' || character == '*') {
      state.stack.pop();
    }
    state.regexpStart = false;
  }
  switch (state.current()) {
    case TOKEN_TYPES.LINE_COMMENT:
      if (character === '\n') {
        state.stack.pop();
      }
      break;
    case TOKEN_TYPES.BLOCK_COMMENT:
      if (state.lastChar === '*' && character === '/') {
        state.stack.pop();
      }
      break;
    case TOKEN_TYPES.SINGLE_QUOTE:
      if (character === '\'' && !state.escaped) {
        state.stack.pop();
      } else if (character === '\\' && !state.escaped) {
        state.escaped = true;
      } else {
        state.escaped = false;
      }
      break;
    case TOKEN_TYPES.DOUBLE_QUOTE:
      if (character === '"' && !state.escaped) {
        state.stack.pop();
      } else if (character === '\\' && !state.escaped) {
        state.escaped = true;
      } else {
        state.escaped = false;
      }
      break;
    case TOKEN_TYPES.TEMPLATE_QUOTE:
      if (character === '`' && !state.escaped) {
        state.stack.pop();
        state.hasDollar = false;
      } else if (character === '\\' && !state.escaped) {
        state.escaped = true;
        state.hasDollar = false;
      } else if (character === '$' && !state.escaped) {
        state.hasDollar = true;
      } else if (character === '{' && state.hasDollar) {
        state.stack.push(BRACKETS[character]);
      } else {
        state.escaped = false;
        state.hasDollar = false;
      }
      break;
    case TOKEN_TYPES.REGEXP:
      if (character === '/' && !state.escaped) {
        state.stack.pop();
      } else if (character === '\\' && !state.escaped) {
        state.escaped = true;
      } else {
        state.escaped = false;
      }
      break;
    default:
      if (character in BRACKETS) {
        state.stack.push(BRACKETS[character]);
      } else if (character in BRACKETS_REVERSED) {
        if (state.current() !== character) {
          var err = new SyntaxError('Mismatched Bracket: ' + character);
          err.code = 'CHARACTER_PARSER:MISMATCHED_BRACKET';
          throw err;
        };
        state.stack.pop();
      } else if (lastChar === '/' && character === '/') {
        // Don't include comments in history
        state.history = state.history.substr(1);
        state.stack.push(TOKEN_TYPES.LINE_COMMENT);
      } else if (lastChar === '/' && character === '*') {
        // Don't include comment in history
        state.history = state.history.substr(1);
        state.stack.push(TOKEN_TYPES.BLOCK_COMMENT);
      } else if (character === '/' && isRegexp(state.history)) {
        state.stack.push(TOKEN_TYPES.REGEXP);
        // N.B. if the next character turns out to be a `*` or a `/`
        //      then this isn't actually a regexp
        state.regexpStart = true;
      } else if (character === '\'') {
        state.stack.push(TOKEN_TYPES.SINGLE_QUOTE);
      } else if (character === '"') {
        state.stack.push(TOKEN_TYPES.DOUBLE_QUOTE);
      } else if (character === '`') {
        state.stack.push(TOKEN_TYPES.TEMPLATE_QUOTE);
      }
      break;
  }
  if (!state.isComment() && !wasComment) {
    state.history = character + state.history;
  }
  state.lastChar = character; // store last character for ending block comments
  return state;
}

exports.defaultState = function () { return new State() };
function State() {
  this.stack = [];

  this.regexpStart = false;
  this.escaped = false;
  this.hasDollar = false;

  this.src = '';
  this.history = ''
  this.lastChar = ''
}
State.prototype.current = function () {
  return this.stack[this.stack.length - 1];
};
State.prototype.isString = function () {
  return (
    this.current() === TOKEN_TYPES.SINGLE_QUOTE ||
    this.current() === TOKEN_TYPES.DOUBLE_QUOTE ||
    this.current() === TOKEN_TYPES.TEMPLATE_QUOTE
  );
}
State.prototype.isComment = function () {
  return this.current() === TOKEN_TYPES.LINE_COMMENT || this.current() === TOKEN_TYPES.BLOCK_COMMENT;
}
State.prototype.isNesting = function (opts) {
  if (
    opts && opts.ignoreLineComment &&
    this.stack.length === 1 && this.stack[0] === TOKEN_TYPES.LINE_COMMENT
  ) {
    // if we are only inside a line comment, and line comments are ignored
    // don't count it as nesting
    return false;
  }
  return !!this.stack.length;
}

function matches(str, matcher, i) {
  if (objIsRegex(matcher)) {
    return matcher.test(str.substr(i || 0));
  } else {
    return str.substr(i || 0, matcher.length) === matcher;
  }
}

exports.isPunctuator = isPunctuator
function isPunctuator(c) {
  if (!c) return true; // the start of a string is a punctuator
  var code = c.charCodeAt(0)

  switch (code) {
    case 46:   // . dot
    case 40:   // ( open bracket
    case 41:   // ) close bracket
    case 59:   // ; semicolon
    case 44:   // , comma
    case 123:  // { open curly brace
    case 125:  // } close curly brace
    case 91:   // [
    case 93:   // ]
    case 58:   // :
    case 63:   // ?
    case 126:  // ~
    case 37:   // %
    case 38:   // &
    case 42:   // *:
    case 43:   // +
    case 45:   // -
    case 47:   // /
    case 60:   // <
    case 62:   // >
    case 94:   // ^
    case 124:  // |
    case 33:   // !
    case 61:   // =
      return true;
    default:
      return false;
  }
}

exports.isKeyword = isKeyword
function isKeyword(id) {
  return (id === 'if') || (id === 'in') || (id === 'do') || (id === 'var') || (id === 'for') || (id === 'new') ||
         (id === 'try') || (id === 'let') || (id === 'this') || (id === 'else') || (id === 'case') ||
         (id === 'void') || (id === 'with') || (id === 'enum') || (id === 'while') || (id === 'break') || (id === 'catch') ||
         (id === 'throw') || (id === 'const') || (id === 'yield') || (id === 'class') || (id === 'super') ||
         (id === 'return') || (id === 'typeof') || (id === 'delete') || (id === 'switch') || (id === 'export') ||
         (id === 'import') || (id === 'default') || (id === 'finally') || (id === 'extends') || (id === 'function') ||
         (id === 'continue') || (id === 'debugger') || (id === 'package') || (id === 'private') || (id === 'interface') ||
         (id === 'instanceof') || (id === 'implements') || (id === 'protected') || (id === 'public') || (id === 'static');
}

function isRegexp(history) {
  //could be start of regexp or divide sign

  history = history.replace(/^\s*/, '');

  //unless its an `if`, `while`, `for` or `with` it's a divide, so we assume it's a divide
  if (history[0] === ')') return false;
  //unless it's a function expression, it's a regexp, so we assume it's a regexp
  if (history[0] === '}') return true;
  //any punctuation means it's a regexp
  if (isPunctuator(history[0])) return true;
  //if the last thing was a keyword then it must be a regexp (e.g. `typeof /foo/`)
  if (/^\w+\b/.test(history) && isKeyword(/^\w+\b/.exec(history)[0].split('').reverse().join(''))) return true;

  return false;
}

},{"is-regex":10}],34:[function(require,module,exports){
arguments[4][32][0].apply(exports,arguments)
},{"acorn":43,"dup":32,"object-assign":45}],35:[function(require,module,exports){
'use strict';

var assert = require('assert');
var TokenStream = require('token-stream');
var error = require('pug-error');
var inlineTags = require('./lib/inline-tags');

module.exports = parse;
module.exports.Parser = Parser;
function parse(tokens, options) {
  var parser = new Parser(tokens, options);
  var ast = parser.parse();
  return JSON.parse(JSON.stringify(ast));
};

/**
 * Initialize `Parser` with the given input `str` and `filename`.
 *
 * @param {String} str
 * @param {String} filename
 * @param {Object} options
 * @api public
 */

function Parser(tokens, options) {
  options = options || {};
  if (!Array.isArray(tokens)) {
    throw new Error('Expected tokens to be an Array but got "' + (typeof tokens) + '"');
  }
  if (typeof options !== 'object') {
    throw new Error('Expected "options" to be an object but got "' + (typeof options) + '"');
  }
  this.tokens = new TokenStream(tokens);
  this.filename = options.filename;
  this.src = options.src;
  this.inMixin = 0;
  this.plugins = options.plugins || [];
};

/**
 * Parser prototype.
 */

Parser.prototype = {

  /**
   * Save original constructor
   */

  constructor: Parser,

  error: function (code, message, token) {
    var err = error(code, message, {
      line: token.line,
      column: token.col,
      filename: this.filename,
      src: this.src
    });
    throw err;
  },

  /**
   * Return the next token object.
   *
   * @return {Object}
   * @api private
   */

  advance: function(){
    return this.tokens.advance();
  },

  /**
   * Single token lookahead.
   *
   * @return {Object}
   * @api private
   */

  peek: function() {
    return this.tokens.peek();
  },

  /**
   * `n` token lookahead.
   *
   * @param {Number} n
   * @return {Object}
   * @api private
   */

  lookahead: function(n){
    return this.tokens.lookahead(n);
  },

  /**
   * Parse input returning a string of js for evaluation.
   *
   * @return {String}
   * @api public
   */

  parse: function(){
    var block = this.emptyBlock(0);

    while ('eos' != this.peek().type) {
      if ('newline' == this.peek().type) {
        this.advance();
      } else if ('text-html' == this.peek().type) {
        block.nodes = block.nodes.concat(this.parseTextHtml());
      } else {
        var expr = this.parseExpr();
        if (expr) {
          if (expr.type === 'Block') {
            block.nodes = block.nodes.concat(expr.nodes);
          } else {
            block.nodes.push(expr);
          }
        }
      }
    }

    return block;
  },

  /**
   * Expect the given type, or throw an exception.
   *
   * @param {String} type
   * @api private
   */

  expect: function(type){
    if (this.peek().type === type) {
      return this.advance();
    } else {
      this.error('INVALID_TOKEN', 'expected "' + type + '", but got "' + this.peek().type + '"', this.peek());
    }
  },

  /**
   * Accept the given `type`.
   *
   * @param {String} type
   * @api private
   */

  accept: function(type){
    if (this.peek().type === type) {
      return this.advance();
    }
  },

  initBlock: function(line, nodes) {
    /* istanbul ignore if */
    if ((line | 0) !== line) throw new Error('`line` is not an integer');
    /* istanbul ignore if */
    if (!Array.isArray(nodes)) throw new Error('`nodes` is not an array');
    return {
      type: 'Block',
      nodes: nodes,
      line: line,
      filename: this.filename
    };
  },

  emptyBlock: function(line) {
    return this.initBlock(line, []);
  },

  runPlugin: function(context, tok) {
    var rest = [this];
    for (var i = 2; i < arguments.length; i++) {
      rest.push(arguments[i]);
    }
    var pluginContext;
    for (var i = 0; i < this.plugins.length; i++) {
      var plugin = this.plugins[i];
      if (plugin[context] && plugin[context][tok.type]) {
        if (pluginContext) throw new Error('Multiple plugin handlers found for context ' + JSON.stringify(context) + ', token type ' + JSON.stringify(tok.type));
        pluginContext = plugin[context];
      }
    }
    if (pluginContext) return pluginContext[tok.type].apply(pluginContext, rest);
  },

  /**
   *   tag
   * | doctype
   * | mixin
   * | include
   * | filter
   * | comment
   * | text
   * | text-html
   * | dot
   * | each
   * | code
   * | yield
   * | id
   * | class
   * | interpolation
   */

  parseExpr: function(){
    switch (this.peek().type) {
      case 'tag':
        return this.parseTag();
      case 'mixin':
        return this.parseMixin();
      case 'block':
        return this.parseBlock();
      case 'mixin-block':
        return this.parseMixinBlock();
      case 'case':
        return this.parseCase();
      case 'extends':
        return this.parseExtends();
      case 'include':
        return this.parseInclude();
      case 'doctype':
        return this.parseDoctype();
      case 'filter':
        return this.parseFilter();
      case 'comment':
        return this.parseComment();
      case 'text':
      case 'interpolated-code':
      case 'start-pug-interpolation':
        return this.parseText({block: true});
      case 'text-html':
        return this.initBlock(this.peek().line, this.parseTextHtml());
      case 'dot':
        return this.parseDot();
      case 'each':
        return this.parseEach();
      case 'code':
        return this.parseCode();
      case 'blockcode':
        return this.parseBlockCode();
      case 'if':
        return this.parseConditional();
      case 'while':
        return this.parseWhile();
      case 'call':
        return this.parseCall();
      case 'interpolation':
        return this.parseInterpolation();
      case 'yield':
        return this.parseYield();
      case 'id':
      case 'class':
        this.tokens.defer({
          type: 'tag',
          val: 'div',
          line: this.peek().line,
          filename: this.filename
        });
        return this.parseExpr();
      default:
        var pluginResult = this.runPlugin('expressionTokens', this.peek());
        if (pluginResult) return pluginResult;
        this.error('INVALID_TOKEN', 'unexpected token "' + this.peek().type + '"', this.peek());
    }
  },

  parseDot: function() {
    this.advance();
    return this.parseTextBlock();
  },

  /**
   * Text
   */

  parseText: function(options){
    var tags = [];
    var lineno = this.peek().line;
    var nextTok = this.peek();
    loop:
      while (true) {
        switch (nextTok.type) {
          case 'text':
            var tok = this.advance();
            tags.push({
              type: 'Text',
              val: tok.val,
              line: tok.line,
              filename: this.filename
            });
            break;
          case 'interpolated-code':
            var tok = this.advance();
            tags.push({
              type: 'Code',
              val: tok.val,
              buffer: tok.buffer,
              mustEscape: tok.mustEscape !== false,
              isInline: true,
              line: tok.line,
              filename: this.filename
            });
            break;
          case 'newline':
            if (!options || !options.block) break loop;
            var tok = this.advance();
            if (this.peek().type === 'text') {
              tags.push({
                type: 'Text',
                val: '\n',
                line: tok.line,
                filename: this.filename
              });
            }
            break;
          case 'start-pug-interpolation':
            this.advance();
            tags.push(this.parseExpr());
            this.expect('end-pug-interpolation');
            break;
          default:
            var pluginResult = this.runPlugin('textTokens', nextTok, tags);
            if (pluginResult) break;
            break loop;
        }
        nextTok = this.peek();
      }
    if (tags.length === 1) return tags[0];
    else return this.initBlock(lineno, tags);
  },

  parseTextHtml: function () {
    var nodes = [];
    var currentNode = null;
loop:
    while (true) {
      switch (this.peek().type) {
        case 'text-html':
          var text = this.advance();
          if (!currentNode) {
            currentNode = {
              type: 'Text',
              val: text.val,
              filename: this.filename,
              line: text.line,
              isHtml: true
            };
            nodes.push(currentNode);
          } else {
            currentNode.val += '\n' + text.val;
          }
          break;
        case 'indent':
          var block = this.block();
          block.nodes.forEach(function (node) {
            if (node.isHtml) {
              if (!currentNode) {
                currentNode = node;
                nodes.push(currentNode);
              } else {
                currentNode.val += '\n' + node.val;
              }
            } else {
              currentNode = null;
              nodes.push(node);
            }
          });
          break;
        case 'code':
          currentNode = null;
          nodes.push(this.parseCode(true));
          break;
        case 'newline':
          this.advance();
          break;
        default:
          break loop;
      }
    }
    return nodes;
  },

  /**
   *   ':' expr
   * | block
   */

  parseBlockExpansion: function(){
    var tok = this.accept(':');
    if (tok) {
      const expr = this.parseExpr();
      return expr.type === 'Block' ? expr : this.initBlock(tok.line, [expr]);
    } else {
      return this.block();
    }
  },

  /**
   * case
   */

  parseCase: function(){
    var tok = this.expect('case');
    var node = {type: 'Case', expr: tok.val, line: tok.line, filename: this.filename};

    var block = this.emptyBlock(tok.line + 1);
    this.expect('indent');
    while ('outdent' != this.peek().type) {
      switch (this.peek().type) {
        case 'comment':
        case 'newline':
          this.advance();
          break;
        case 'when':
          block.nodes.push(this.parseWhen());
          break;
        case 'default':
          block.nodes.push(this.parseDefault());
          break;
        default:
          var pluginResult = this.runPlugin('caseTokens', this.peek(), block);
          if (pluginResult) break;
          this.error('INVALID_TOKEN', 'Unexpected token "' + this.peek().type
                          + '", expected "when", "default" or "newline"', this.peek());
      }
    }
    this.expect('outdent');

    node.block = block;

    return node;
  },

  /**
   * when
   */

  parseWhen: function(){
    var tok = this.expect('when');
    if (this.peek().type !== 'newline') {
      return {
        type: 'When',
        expr: tok.val,
        block: this.parseBlockExpansion(),
        debug: false,
        line: tok.line,
        filename: this.filename
      };
    } else {
      return {
        type: 'When',
        expr: tok.val,
        debug: false,
        line: tok.line,
        filename: this.filename
      };
    }
  },

  /**
   * default
   */

  parseDefault: function(){
    var tok = this.expect('default');
    return {
      type: 'When',
      expr: 'default',
      block: this.parseBlockExpansion(),
      debug: false,
      line: tok.line,
      filename: this.filename
    };
  },

  /**
   * code
   */

  parseCode: function(noBlock){
    var tok = this.expect('code');
    assert(typeof tok.mustEscape === 'boolean', 'Please update to the newest version of pug-lexer.');
    var node = {
      type: 'Code',
      val: tok.val,
      buffer: tok.buffer,
      mustEscape: tok.mustEscape !== false,
      isInline: !!noBlock,
      line: tok.line,
      filename: this.filename
    };
    // todo: why is this here?  It seems like a hacky workaround
    if (node.val.match(/^ *else/)) node.debug = false;

    if (noBlock) return node;

    var block;

    // handle block
    block = 'indent' == this.peek().type;
    if (block) {
      if (tok.buffer) {
        this.error('BLOCK_IN_BUFFERED_CODE', 'Buffered code cannot have a block attached to it', this.peek());
      }
      node.block = this.block();
    }

    return node;
  },
  parseConditional: function(){
    var tok = this.expect('if');
    var node = {
      type: 'Conditional',
      test: tok.val,
      consequent: this.emptyBlock(tok.line),
      alternate: null,
      line: tok.line,
      filename: this.filename
    };

    // handle block
    if ('indent' == this.peek().type) {
      node.consequent = this.block();
    }

    var currentNode = node;
    while (true) {
      if (this.peek().type === 'newline') {
        this.expect('newline');
      } else if (this.peek().type === 'else-if') {
        tok = this.expect('else-if');
        currentNode = (
          currentNode.alternate = {
            type: 'Conditional',
            test: tok.val,
            consequent: this.emptyBlock(tok.line),
            alternate: null,
            line: tok.line,
            filename: this.filename
          }
        );
        if ('indent' == this.peek().type) {
          currentNode.consequent = this.block();
        }
      } else if (this.peek().type === 'else') {
        this.expect('else');
        if (this.peek().type === 'indent') {
          currentNode.alternate = this.block();
        }
        break;
      } else {
        break;
      }
    }

    return node;
  },
  parseWhile: function(){
    var tok = this.expect('while');
    var node = {
      type: 'While',
      test: tok.val,
      line: tok.line,
      filename: this.filename
    };

    // handle block
    if ('indent' == this.peek().type) {
      node.block = this.block();
    } else {
      node.block = this.emptyBlock(tok.line);
    }

    return node;
  },

  /**
   * block code
   */

  parseBlockCode: function(){
    var line = this.expect('blockcode').line;
    var body = this.peek();
    var text = '';
    if (body.type === 'start-pipeless-text') {
      this.advance();
      while (this.peek().type !== 'end-pipeless-text') {
        var tok = this.advance();
        switch (tok.type) {
          case 'text':
            text += tok.val;
            break;
          case 'newline':
            text += '\n';
            break;
          default:
            var pluginResult = this.runPlugin('blockCodeTokens', tok, tok);
            if (pluginResult) {
              text += pluginResult;
              break;
            }
            this.error('INVALID_TOKEN', 'Unexpected token type: ' + tok.type, tok);
        }
      }
      this.advance();
    }
    return {
      type: 'Code',
      val: text,
      buffer: false,
      mustEscape: false,
      isInline: false,
      line: line,
      filename: this.filename
    };
  },
  /**
   * comment
   */

  parseComment: function(){
    var tok = this.expect('comment');
    var block;
    if (block = this.parseTextBlock()) {
      return {
        type: 'BlockComment',
        val: tok.val,
        block: block,
        buffer: tok.buffer,
        line: tok.line,
        filename: this.filename
      };
    } else {
      return {
        type: 'Comment',
        val: tok.val,
        buffer: tok.buffer,
        line: tok.line,
        filename: this.filename
      };
    }
  },

  /**
   * doctype
   */

  parseDoctype: function(){
    var tok = this.expect('doctype');
    return {
      type: 'Doctype',
      val: tok.val,
      line: tok.line,
      filename: this.filename
    };
  },

  parseIncludeFilter: function() {
    var tok = this.expect('filter');
    var attrs = [];

    if (this.peek().type === 'start-attributes') {
      attrs = this.attrs();
    }

    return {
      type: 'IncludeFilter',
      name: tok.val,
      attrs: attrs,
      line: tok.line,
      filename: this.filename
    };
  },

  /**
   * filter attrs? text-block
   */

  parseFilter: function(){
    var tok = this.expect('filter');
    var block, attrs = [];

    if (this.peek().type === 'start-attributes') {
      attrs = this.attrs();
    }

    if (this.peek().type === 'text') {
      var textToken = this.advance();
      block = this.initBlock(textToken.line, [
        {
          type: 'Text',
          val: textToken.val,
          line: textToken.line,
          filename: this.filename
        }
      ]);
    } else if (this.peek().type === 'filter') {
      block = this.initBlock(tok.line, [this.parseFilter()]);
    } else {
      block = this.parseTextBlock() || this.emptyBlock(tok.line);
    }

    return {
      type: 'Filter',
      name: tok.val,
      block: block,
      attrs: attrs,
      line: tok.line,
      filename: this.filename
    };
  },

  /**
   * each block
   */

  parseEach: function(){
    var tok = this.expect('each');
    var node = {
      type: 'Each',
      obj: tok.code,
      val: tok.val,
      key: tok.key,
      block: this.block(),
      line: tok.line,
      filename: this.filename
    };
    if (this.peek().type == 'else') {
      this.advance();
      node.alternate = this.block();
    }
    return node;
  },

  /**
   * 'extends' name
   */

  parseExtends: function(){
    var tok = this.expect('extends');
    var path = this.expect('path');
    return {
      type: 'Extends',
      file: {
        type: 'FileReference',
        path: path.val.trim(),
        line: tok.line,
        filename: this.filename
      },
      line: tok.line,
      filename: this.filename
    };
  },

  /**
   * 'block' name block
   */

  parseBlock: function(){
    var tok = this.expect('block');

    var node = 'indent' == this.peek().type ? this.block() : this.emptyBlock(tok.line);
    node.type = 'NamedBlock';
    node.name = tok.val.trim();
    node.mode = tok.mode;
    node.line = tok.line;

    return node;
  },

  parseMixinBlock: function () {
    var tok = this.expect('mixin-block');
    if (!this.inMixin) {
      this.error('BLOCK_OUTISDE_MIXIN', 'Anonymous blocks are not allowed unless they are part of a mixin.', tok);
    }
    return {type: 'MixinBlock', line: tok.line, filename: this.filename};
  },

  parseYield: function() {
    var tok = this.expect('yield');
    return {type: 'YieldBlock', line: tok.line, filename: this.filename};
  },

  /**
   * include block?
   */

  parseInclude: function(){
    var tok = this.expect('include');
    var node = {
      type: 'Include',
      file: {
        type: 'FileReference',
        line: tok.line,
        filename: this.filename
      },
      line: tok.line,
      filename: this.filename
    };
    var filters = [];
    while (this.peek().type === 'filter') {
      filters.push(this.parseIncludeFilter());
    }
    var path = this.expect('path');

    node.file.path = path.val.trim();

    if ((/\.jade$/.test(node.file.path) || /\.pug$/.test(node.file.path)) && !filters.length) {
      node.block = 'indent' == this.peek().type ? this.block() : this.emptyBlock(tok.line);
      if (/\.jade$/.test(node.file.path)) {
        console.warn(
          this.filename + ', line ' + tok.line +
          ':\nThe .jade extension is deprecated, use .pug for "' + node.file.path +'".'
        );
      }
    } else {
      node.type = 'RawInclude';
      node.filters = filters;
      if (this.peek().type === 'indent') {
        this.error('RAW_INCLUDE_BLOCK', 'Raw inclusion cannot contain a block', this.peek());
      }
    }
    return node;
  },

  /**
   * call ident block
   */

  parseCall: function(){
    var tok = this.expect('call');
    var name = tok.val;
    var args = tok.args;
    var mixin = {
      type: 'Mixin',
      name: name,
      args: args,
      block: this.emptyBlock(tok.line),
      call: true,
      attrs: [],
      attributeBlocks: [],
      line: tok.line,
      filename: this.filename
    };

    this.tag(mixin);
    if (mixin.code) {
      mixin.block.nodes.push(mixin.code);
      delete mixin.code;
    }
    if (mixin.block.nodes.length === 0) mixin.block = null;
    return mixin;
  },

  /**
   * mixin block
   */

  parseMixin: function(){
    var tok = this.expect('mixin');
    var name = tok.val;
    var args = tok.args;

    if ('indent' == this.peek().type) {
      this.inMixin++;
      var mixin = {
        type: 'Mixin',
        name: name,
        args: args,
        block: this.block(),
        call: false,
        line: tok.line,
        filename: this.filename
      };
      this.inMixin--;
      return mixin;
    } else {
      this.error('MIXIN_WITHOUT_BODY', 'Mixin ' + name + ' declared without body', tok);
    }
  },

  /**
   * indent (text | newline)* outdent
   */

  parseTextBlock: function(){
    var tok = this.accept('start-pipeless-text');
    if (!tok) return;
    var block = this.emptyBlock(tok.line);
    while (this.peek().type !== 'end-pipeless-text') {
      var tok = this.advance();
      switch (tok.type) {
        case 'text':
          block.nodes.push({type: 'Text', val: tok.val, line: tok.line});
          break;
        case 'newline':
          block.nodes.push({type: 'Text', val: '\n', line: tok.line});
          break;
        case 'start-pug-interpolation':
          block.nodes.push(this.parseExpr());
          this.expect('end-pug-interpolation');
          break;
        case 'interpolated-code':
          block.nodes.push({
            type: 'Code',
            val: tok.val,
            buffer: tok.buffer,
            mustEscape: tok.mustEscape !== false,
            isInline: true,
            line: tok.line,
            filename: this.filename
          });
          break;
        default:
          var pluginResult = this.runPlugin('textBlockTokens', tok, block, tok);
          if (pluginResult) break;
          this.error('INVALID_TOKEN', 'Unexpected token type: ' + tok.type, tok);
      }
    }
    this.advance();
    return block;
  },

  /**
   * indent expr* outdent
   */

  block: function(){
    var tok = this.expect('indent');
    var block = this.emptyBlock(tok.line);
    while ('outdent' != this.peek().type) {
      if ('newline' == this.peek().type) {
        this.advance();
      } else if ('text-html' == this.peek().type) {
        block.nodes = block.nodes.concat(this.parseTextHtml());
      } else {
        var expr = this.parseExpr();
        if (expr.type === 'Block') {
          block.nodes = block.nodes.concat(expr.nodes);
        } else {
          block.nodes.push(expr);
        }
      }
    }
    this.expect('outdent');
    return block;
  },

  /**
   * interpolation (attrs | class | id)* (text | code | ':')? newline* block?
   */

  parseInterpolation: function(){
    var tok = this.advance();
    var tag = {
      type: 'InterpolatedTag',
      expr: tok.val,
      selfClosing: false,
      block: this.emptyBlock(tok.line),
      attrs: [],
      attributeBlocks: [],
      isInline: false,
      line: tok.line,
      filename: this.filename
    };

    return this.tag(tag, {selfClosingAllowed: true});
  },

  /**
   * tag (attrs | class | id)* (text | code | ':')? newline* block?
   */

  parseTag: function(){
    var tok = this.advance();
    var tag = {
      type: 'Tag',
      name: tok.val,
      selfClosing: false,
      block: this.emptyBlock(tok.line),
      attrs: [],
      attributeBlocks: [],
      isInline: inlineTags.indexOf(tok.val) !== -1,
      line: tok.line,
      filename: this.filename
    };

    return this.tag(tag, {selfClosingAllowed: true});
  },

  /**
   * Parse tag.
   */

  tag: function(tag, options) {
    var seenAttrs = false;
    var attributeNames = [];
    var selfClosingAllowed = options && options.selfClosingAllowed;
    // (attrs | class | id)*
    out:
      while (true) {
        switch (this.peek().type) {
          case 'id':
          case 'class':
            var tok = this.advance();
            if (tok.type === 'id') {
              if (attributeNames.indexOf('id') !== -1) {
                this.error('DUPLICATE_ID', 'Duplicate attribute "id" is not allowed.', tok);
              }
              attributeNames.push('id');
            }
            tag.attrs.push({
              name: tok.type,
              val: "'" + tok.val + "'",
              mustEscape: false
            });
            continue;
          case 'start-attributes':
            if (seenAttrs) {
              console.warn(this.filename + ', line ' + this.peek().line + ':\nYou should not have pug tags with multiple attributes.');
            }
            seenAttrs = true;
            tag.attrs = tag.attrs.concat(this.attrs(attributeNames));
            continue;
          case '&attributes':
            var tok = this.advance();
            tag.attributeBlocks.push(tok.val);
            break;
          default:
            var pluginResult = this.runPlugin('tagAttributeTokens', this.peek(), tag, attributeNames);
            if (pluginResult) break;
            break out;
        }
      }

    // check immediate '.'
    if ('dot' == this.peek().type) {
      tag.textOnly = true;
      this.advance();
    }

    // (text | code | ':')?
    switch (this.peek().type) {
      case 'text':
      case 'interpolated-code':
        var text = this.parseText();
        if (text.type === 'Block') {
          tag.block.nodes.push.apply(tag.block.nodes, text.nodes);
        } else {
          tag.block.nodes.push(text);
        }
        break;
      case 'code':
        tag.block.nodes.push(this.parseCode(true));
        break;
      case ':':
        this.advance();
        const expr = this.parseExpr();
        tag.block = expr.type === 'Block' ? expr : this.initBlock(tag.line, [expr]);
        break;
      case 'newline':
      case 'indent':
      case 'outdent':
      case 'eos':
      case 'start-pipeless-text':
      case 'end-pug-interpolation':
        break;
      case 'slash':
        if (selfClosingAllowed) {
          this.advance();
          tag.selfClosing = true;
          break;
        }
      default:
        var pluginResult = this.runPlugin('tagTokens', this.peek(), tag, options);
        if (pluginResult) break;
        this.error('INVALID_TOKEN', 'Unexpected token `' + this.peek().type + '` expected `text`, `interpolated-code`, `code`, `:`' + (selfClosingAllowed ? ', `slash`' : '') + ', `newline` or `eos`', this.peek())
    }

    // newline*
    while ('newline' == this.peek().type) this.advance();

    // block?
    if (tag.textOnly) {
      tag.block = this.parseTextBlock() || this.emptyBlock(tag.line);
    } else if ('indent' == this.peek().type) {
      var block = this.block();
      for (var i = 0, len = block.nodes.length; i < len; ++i) {
        tag.block.nodes.push(block.nodes[i]);
      }
    }

    return tag;
  },

  attrs: function(attributeNames) {
    this.expect('start-attributes');

    var attrs = [];
    var tok = this.advance();
    while (tok.type === 'attribute') {
      if (tok.name !== 'class' && attributeNames) {
        if (attributeNames.indexOf(tok.name) !== -1) {
          this.error('DUPLICATE_ATTRIBUTE', 'Duplicate attribute "' + tok.name + '" is not allowed.', tok);
        }
        attributeNames.push(tok.name);
      }
      attrs.push({
        name: tok.name,
        val: tok.val,
        mustEscape: tok.mustEscape !== false
      });
      tok = this.advance();
    }
    this.tokens.defer(tok);
    this.expect('end-attributes');
    return attrs;
  }
};

},{"./lib/inline-tags":36,"assert":18,"pug-error":17,"token-stream":3}],36:[function(require,module,exports){
'use strict';

module.exports = [
    'a'
  , 'abbr'
  , 'acronym'
  , 'b'
  , 'br'
  , 'code'
  , 'em'
  , 'font'
  , 'i'
  , 'img'
  , 'ins'
  , 'kbd'
  , 'map'
  , 'samp'
  , 'small'
  , 'span'
  , 'strong'
  , 'sub'
  , 'sup'
];
},{}],37:[function(require,module,exports){
'use strict';

var assert = require('assert');
var walk = require('pug-walk');

function error() {
  throw require('pug-error').apply(null, arguments);
}

module.exports = link;
function link(ast) {
  assert(ast.type === 'Block', 'The top level element should always be a block');
  var extendsNode = null;
  if (ast.nodes.length) {
    var hasExtends = ast.nodes[0].type === 'Extends';
    checkExtendPosition(ast, hasExtends);
    if (hasExtends) {
      extendsNode = ast.nodes.shift();
    }
  }
  ast = applyIncludes(ast);
  ast.declaredBlocks = findDeclaredBlocks(ast);
  if (extendsNode) {
    var mixins = [];
    var expectedBlocks = [];
    ast.nodes.forEach(function addNode(node) {
      if (node.type === 'NamedBlock') {
        expectedBlocks.push(node);
      } else if (node.type === 'Block') {
        node.nodes.forEach(addNode);
      } else if (node.type === 'Mixin' && node.call === false) {
        mixins.push(node);
      } else {
        error('UNEXPECTED_NODES_IN_EXTENDING_ROOT', 'Only named blocks and mixins can appear at the top level of an extending template', node);
      }
    });
    var parent = link(extendsNode.file.ast);
    extend(parent.declaredBlocks, ast);
    var foundBlockNames = [];
    walk(parent, function (node) {
      if (node.type === 'NamedBlock') {
        foundBlockNames.push(node.name);
      }
    });
    expectedBlocks.forEach(function (expectedBlock) {
      if (foundBlockNames.indexOf(expectedBlock.name) === -1) {
        error(
          'UNEXPECTED_BLOCK',
          'Unexpected block ' + expectedBlock.name,
          expectedBlock
        );
      }
    });
    Object.keys(ast.declaredBlocks).forEach(function (name) {
      parent.declaredBlocks[name] = ast.declaredBlocks[name];
    });
    parent.nodes = mixins.concat(parent.nodes);
    parent.hasExtends = true;
    return parent;
  }
  return ast;
}

function findDeclaredBlocks(ast) /*: {[name: string]: Array<BlockNode>}*/ {
  var definitions = {};
  walk(ast, function before(node) {
    if (node.type === 'NamedBlock' && node.mode === 'replace') {
      definitions[node.name] = definitions[node.name] || [];
      definitions[node.name].push(node);
    }
  });
  return definitions;
}

function flattenParentBlocks(parentBlocks, accumulator) {
  accumulator = accumulator || [];
  parentBlocks.forEach(function (parentBlock) {
    if (parentBlock.parents) {
      flattenParentBlocks(parentBlock.parents, accumulator);
    }
    accumulator.push(parentBlock);
  });
  return accumulator;
}

function extend(parentBlocks, ast) {
  var stack = {};
  walk(ast, function before(node) {
    if (node.type === 'NamedBlock') {
      if (stack[node.name] === node.name) {
        return node.ignore = true;
      }
      stack[node.name] = node.name;
      var parentBlockList = parentBlocks[node.name] ? flattenParentBlocks(parentBlocks[node.name]) : [];
      if (parentBlockList.length) {
        node.parents = parentBlockList;
        parentBlockList.forEach(function (parentBlock) {
          switch (node.mode) {
            case 'append':
              parentBlock.nodes = parentBlock.nodes.concat(node.nodes);
              break;
            case 'prepend':
              parentBlock.nodes = node.nodes.concat(parentBlock.nodes);
              break;
            case 'replace':
              parentBlock.nodes = node.nodes;
              break;
          }
        });
      }
    }
  }, function after(node) {
    if (node.type === 'NamedBlock' && !node.ignore) {
      delete stack[node.name];
    }
  });
}

function applyIncludes(ast, child) {
  return walk(ast, function before(node, replace) {
    if (node.type === 'RawInclude') {
      replace({type: 'Text', val: node.file.str.replace(/\r/g, '')});
    }
  }, function after(node, replace) {
    if (node.type === 'Include') {
      var childAST = link(node.file.ast);
      if (childAST.hasExtends) {
        childAST = removeBlocks(childAST);
      }
      replace(applyYield(childAST, node.block));
    }
  });
}
function removeBlocks(ast) {
  return walk(ast, function (node, replace) {
    if (node.type === 'NamedBlock') {
      replace({
        type: 'Block',
        nodes: node.nodes
      });
    }
  });
}

function applyYield(ast, block) {
  if (!block || !block.nodes.length) return ast;
  var replaced = false;
  ast = walk(ast, null, function (node, replace) {
    if (node.type === 'YieldBlock') {
      replaced = true;
      node.type = 'Block';
      node.nodes = [block];
    }
  });
  function defaultYieldLocation(node) {
    var res = node;
    for (var i = 0; i < node.nodes.length; i++) {
      if (node.nodes[i].textOnly) continue;
      if (node.nodes[i].type === 'Block') {
        res = defaultYieldLocation(node.nodes[i]);
      } else if (node.nodes[i].block && node.nodes[i].block.nodes.length) {
        res = defaultYieldLocation(node.nodes[i].block);
      }
    }
    return res;
  }
  if (!replaced) {
    // todo: probably should deprecate this with a warning
    defaultYieldLocation(ast).nodes.push(block);
  }
  return ast;
}

function checkExtendPosition(ast, hasExtends) {
  var legitExtendsReached = false;
  walk(ast, function (node) {
    if (node.type === 'Extends') {
      if (hasExtends && !legitExtendsReached) {
        legitExtendsReached = true;
      } else {
        error('EXTENDS_NOT_FIRST', 'Declaration of template inheritance ("extends") should be the first thing in the file. There can only be one extends statement per file.', node);
      }
    }
  });
}

},{"assert":18,"pug-error":17,"pug-walk":15}],38:[function(require,module,exports){
'use strict';

var acorn = require('acorn');
var walk = require('acorn/dist/walk');

function isScope(node) {
  return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration' || node.type === 'ArrowFunctionExpression' || node.type === 'Program';
}
function isBlockScope(node) {
  return node.type === 'BlockStatement' || isScope(node);
}

function declaresArguments(node) {
  return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
}

function declaresThis(node) {
  return node.type === 'FunctionExpression' || node.type === 'FunctionDeclaration';
}

function reallyParse(source) {
  return acorn.parse(source, {
    allowReturnOutsideFunction: true,
    allowImportExportEverywhere: true,
    allowHashBang: true
  });
}
module.exports = findGlobals;
module.exports.parse = reallyParse;
function findGlobals(source) {
  var globals = [];
  var ast;
  // istanbul ignore else
  if (typeof source === 'string') {
    ast = reallyParse(source);
  } else {
    ast = source;
  }
  // istanbul ignore if
  if (!(ast && typeof ast === 'object' && ast.type === 'Program')) {
    throw new TypeError('Source must be either a string of JavaScript or an acorn AST');
  }
  var declareFunction = function (node) {
    var fn = node;
    fn.locals = fn.locals || {};
    node.params.forEach(function (node) {
      declarePattern(node, fn);
    });
    if (node.id) {
      fn.locals[node.id.name] = true;
    }
  }
  var declarePattern = function (node, parent) {
    switch (node.type) {
      case 'Identifier':
        parent.locals[node.name] = true;
        break;
      case 'ObjectPattern':
        node.properties.forEach(function (node) {
          declarePattern(node.value, parent);
        });
        break;
      case 'ArrayPattern':
        node.elements.forEach(function (node) {
          if (node) declarePattern(node, parent);
        });
        break;
      case 'RestElement':
        declarePattern(node.argument, parent);
        break;
      case 'AssignmentPattern':
        declarePattern(node.left, parent);
        break;
      // istanbul ignore next
      default:
        throw new Error('Unrecognized pattern type: ' + node.type);
    }
  }
  var declareModuleSpecifier = function (node, parents) {
    ast.locals = ast.locals || {};
    ast.locals[node.local.name] = true;
  }
  walk.ancestor(ast, {
    'VariableDeclaration': function (node, parents) {
      var parent = null;
      for (var i = parents.length - 1; i >= 0 && parent === null; i--) {
        if (node.kind === 'var' ? isScope(parents[i]) : isBlockScope(parents[i])) {
          parent = parents[i];
        }
      }
      parent.locals = parent.locals || {};
      node.declarations.forEach(function (declaration) {
        declarePattern(declaration.id, parent);
      });
    },
    'FunctionDeclaration': function (node, parents) {
      var parent = null;
      for (var i = parents.length - 2; i >= 0 && parent === null; i--) {
        if (isScope(parents[i])) {
          parent = parents[i];
        }
      }
      parent.locals = parent.locals || {};
      parent.locals[node.id.name] = true;
      declareFunction(node);
    },
    'Function': declareFunction,
    'ClassDeclaration': function (node, parents) {
      var parent = null;
      for (var i = parents.length - 2; i >= 0 && parent === null; i--) {
        if (isScope(parents[i])) {
          parent = parents[i];
        }
      }
      parent.locals = parent.locals || {};
      parent.locals[node.id.name] = true;
    },
    'TryStatement': function (node) {
      if (node.handler === null) return;
      node.handler.locals = node.handler.locals || {};
      node.handler.locals[node.handler.param.name] = true;
    },
    'ImportDefaultSpecifier': declareModuleSpecifier,
    'ImportSpecifier': declareModuleSpecifier,
    'ImportNamespaceSpecifier': declareModuleSpecifier
  });
  function identifier(node, parents) {
    var name = node.name;
    if (name === 'undefined') return;
    for (var i = 0; i < parents.length; i++) {
      if (name === 'arguments' && declaresArguments(parents[i])) {
        return;
      }
      if (parents[i].locals && name in parents[i].locals) {
        return;
      }
    }
    node.parents = parents;
    globals.push(node);
  }
  walk.ancestor(ast, {
    'VariablePattern': identifier,
    'Identifier': identifier,
    'ThisExpression': function (node, parents) {
      for (var i = 0; i < parents.length; i++) {
        if (declaresThis(parents[i])) {
          return;
        }
      }
      node.parents = parents;
      globals.push(node);
    }
  });
  var groupedGlobals = {};
  globals.forEach(function (node) {
    var name = node.type === 'ThisExpression' ? 'this' : node.name;
    groupedGlobals[name] = (groupedGlobals[name] || []);
    groupedGlobals[name].push(node);
  });
  return Object.keys(groupedGlobals).sort().map(function (name) {
    return {name: name, nodes: groupedGlobals[name]};
  });
}

},{"acorn":43,"acorn/dist/walk":44}],39:[function(require,module,exports){
'use strict'

var acorn = require('acorn');
var walk = require('acorn/dist/walk');
var isExpression = require('is-expression');

var lastSRC = '(null)';
var lastRes = true;
var lastConstants = undefined;

var STATEMENT_WHITE_LIST = {
  'EmptyStatement': true,
  'ExpressionStatement': true,
};
var EXPRESSION_WHITE_LIST = {
  'ParenthesizedExpression': true,
  'ArrayExpression': true,
  'ObjectExpression': true,
  'SequenceExpression': true,
  'TemplateLiteral': true,
  'UnaryExpression': true,
  'BinaryExpression': true,
  'LogicalExpression': true,
  'ConditionalExpression': true,
  'Identifier': true,
  'Literal': true,
  'ComprehensionExpression': true,
  'TaggedTemplateExpression': true,
  'MemberExpression': true,
  'CallExpression': true,
  'NewExpression': true,
};
module.exports = isConstant;
function isConstant(src, constants) {
  src = '(' + src + ')';
  if (lastSRC === src && lastConstants === constants) return lastRes;
  lastSRC = src;
  lastConstants = constants;
  if (!isExpression(src)) return lastRes = false;
  var ast;
  try {
    ast = acorn.parse(src, {
      ecmaVersion: 6,
      allowReturnOutsideFunction: true,
      allowImportExportEverywhere: true,
      allowHashBang: true
    });
  } catch (ex) {
    return lastRes = false;
  }
  var isConstant = true;
  walk.simple(ast, {
    Statement: function (node) {
      if (isConstant) {
        if (STATEMENT_WHITE_LIST[node.type] !== true) {
          isConstant = false;
        }
      }
    },
    Expression: function (node) {
      if (isConstant) {
        if (EXPRESSION_WHITE_LIST[node.type] !== true) {
          isConstant = false;
        }
      }
    },
    MemberExpression: function (node) {
      if (isConstant) {
        if (node.computed) isConstant = false;
        else if (node.property.name[0] === '_') isConstant = false;
      }
    },
    Identifier: function (node) {
      if (isConstant) {
        if (!constants || !(node.name in constants)) {
          isConstant = false;
        }
      }
    },
  });
  return lastRes = isConstant;
}
isConstant.isConstant = isConstant;

isConstant.toConstant = toConstant;
function toConstant(src, constants) {
  if (!isConstant(src, constants)) throw new Error(JSON.stringify(src) + ' is not constant.');
  return Function(Object.keys(constants || {}).join(','), 'return (' + src + ')').apply(null, Object.keys(constants || {}).map(function (key) {
    return constants[key];
  }));
}

},{"acorn":41,"acorn/dist/walk":42,"is-expression":32}],40:[function(require,module,exports){
'use strict';

var assert = require('assert');
var isExpression = require('is-expression');
var characterParser = require('character-parser');
var error = require('pug-error');

module.exports = lex;
module.exports.Lexer = Lexer;
function lex(str, options) {
  var lexer = new Lexer(str, options);
  return JSON.parse(JSON.stringify(lexer.getTokens()));
}

/**
 * Initialize `Lexer` with the given `str`.
 *
 * @param {String} str
 * @param {String} filename
 * @api private
 */

function Lexer(str, options) {
  options = options || {};
  if (typeof str !== 'string') {
    throw new Error('Expected source code to be a string but got "' + (typeof str) + '"')
  }
  if (typeof options !== 'object') {
    throw new Error('Expected "options" to be an object but got "' + (typeof options) + '"')
  }
  //Strip any UTF-8 BOM off of the start of `str`, if it exists.
  str = str.replace(/^\uFEFF/, '');
  this.input = str.replace(/\r\n|\r/g, '\n');
  this.originalInput = this.input;
  this.filename = options.filename;
  this.interpolated = options.interpolated || false;
  this.lineno = options.startingLine || 1;
  this.colno = options.startingColumn || 1;
  this.plugins = options.plugins || [];
  this.indentStack = [0];
  this.indentRe = null;
  // If #{}, !{} or #[] syntax is allowed when adding text
  this.interpolationAllowed = true;

  this.tokens = [];
  this.ended = false;
};

/**
 * Lexer prototype.
 */

Lexer.prototype = {

  constructor: Lexer,

  error: function (code, message) {
    var err = error(code, message, {line: this.lineno, column: this.colno, filename: this.filename, src: this.originalInput});
    throw err;
  },

  assert: function (value, message) {
    if (!value) this.error('ASSERT_FAILED', message);
  },

  isExpression: function (exp) {
    return isExpression(exp, {
      throw: true
    });
  },

  assertExpression: function (exp, noThrow) {
    //this verifies that a JavaScript expression is valid
    try {
      this.callLexerFunction('isExpression', exp);
      return true;
    } catch (ex) {
      if (noThrow) return false;

      // not coming from acorn
      if (!ex.loc) throw ex;

      this.incrementLine(ex.loc.line - 1);
      this.incrementColumn(ex.loc.column);
      var msg = 'Syntax Error: ' + ex.message.replace(/ \([0-9]+:[0-9]+\)$/, '');
      this.error('SYNTAX_ERROR', msg);
    }
  },

  assertNestingCorrect: function (exp) {
    //this verifies that code is properly nested, but allows
    //invalid JavaScript such as the contents of `attributes`
    var res = characterParser(exp)
    if (res.isNesting()) {
      this.error('INCORRECT_NESTING', 'Nesting must match on expression `' + exp + '`')
    }
  },

  /**
   * Construct a token with the given `type` and `val`.
   *
   * @param {String} type
   * @param {String} val
   * @return {Object}
   * @api private
   */

  tok: function(type, val){
    var res = {type: type, line: this.lineno, col: this.colno};

    if (val !== undefined) res.val = val;

    return res;
  },

  /**
   * Increment `this.lineno` and reset `this.colno`.
   *
   * @param {Number} increment
   * @api private
   */

  incrementLine: function(increment){
    this.lineno += increment;
    if (increment) this.colno = 1;
  },

  /**
   * Increment `this.colno`.
   *
   * @param {Number} increment
   * @api private
   */

  incrementColumn: function(increment){
    this.colno += increment
  },

  /**
   * Consume the given `len` of input.
   *
   * @param {Number} len
   * @api private
   */

  consume: function(len){
    this.input = this.input.substr(len);
  },

  /**
   * Scan for `type` with the given `regexp`.
   *
   * @param {String} type
   * @param {RegExp} regexp
   * @return {Object}
   * @api private
   */

  scan: function(regexp, type){
    var captures;
    if (captures = regexp.exec(this.input)) {
      var len = captures[0].length;
      var val = captures[1];
      var diff = len - (val ? val.length : 0);
      var tok = this.tok(type, val);
      this.consume(len);
      this.incrementColumn(diff);
      return tok;
    }
  },
  scanEndOfLine: function (regexp, type) {
    var captures;
    if (captures = regexp.exec(this.input)) {
      var whitespaceLength = 0;
      var whitespace;
      var tok;
      if (whitespace = /^([ ]+)([^ ]*)/.exec(captures[0])) {
        whitespaceLength = whitespace[1].length;
        this.incrementColumn(whitespaceLength);
      }
      var newInput = this.input.substr(captures[0].length);
      if (newInput[0] === ':') {
        this.input = newInput;
        tok = this.tok(type, captures[1]);
        this.incrementColumn(captures[0].length - whitespaceLength);
        return tok;
      }
      if (/^[ \t]*(\n|$)/.test(newInput)) {
        this.input = newInput.substr(/^[ \t]*/.exec(newInput)[0].length);
        tok = this.tok(type, captures[1]);
        this.incrementColumn(captures[0].length - whitespaceLength);
        return tok;
      }
    }
  },

  /**
   * Return the indexOf `(` or `{` or `[` / `)` or `}` or `]` delimiters.
   *
   * Make sure that when calling this function, colno is at the character
   * immediately before the beginning.
   *
   * @return {Number}
   * @api private
   */

  bracketExpression: function(skip){
    skip = skip || 0;
    var start = this.input[skip];
    assert(start === '(' || start === '{' || start === '[',
           'The start character should be "(", "{" or "["');
    var end = characterParser.BRACKETS[start];
    var range;
    try {
      range = characterParser.parseUntil(this.input, end, {start: skip + 1});
    } catch (ex) {
      if (ex.index !== undefined) {
        var idx = ex.index;
        // starting from this.input[skip]
        var tmp = this.input.substr(skip).indexOf('\n');
        // starting from this.input[0]
        var nextNewline = tmp + skip;
        var ptr = 0;
        while (idx > nextNewline && tmp !== -1) {
          this.incrementLine(1);
          idx -= nextNewline + 1;
          ptr += nextNewline + 1;
          tmp = nextNewline = this.input.substr(ptr).indexOf('\n');
        };

        this.incrementColumn(idx);
      }
      if (ex.code === 'CHARACTER_PARSER:END_OF_STRING_REACHED') {
        this.error('NO_END_BRACKET', 'The end of the string reached with no closing bracket ' + end + ' found.');
      } else if (ex.code === 'CHARACTER_PARSER:MISMATCHED_BRACKET') {
        this.error('BRACKET_MISMATCH', ex.message);
      }
      throw ex;
    }
    return range;
  },

  scanIndentation: function() {
    var captures, re;

    // established regexp
    if (this.indentRe) {
      captures = this.indentRe.exec(this.input);
    // determine regexp
    } else {
      // tabs
      re = /^\n(\t*) */;
      captures = re.exec(this.input);

      // spaces
      if (captures && !captures[1].length) {
        re = /^\n( *)/;
        captures = re.exec(this.input);
      }

      // established
      if (captures && captures[1].length) this.indentRe = re;
    }

    return captures;
  },

  /**
   * end-of-source.
   */

  eos: function() {
    if (this.input.length) return;
    if (this.interpolated) {
      this.error('NO_END_BRACKET', 'End of line was reached with no closing bracket for interpolation.');
    }
    for (var i = 0; this.indentStack[i]; i++) {
      this.tokens.push(this.tok('outdent'));
    }
    this.tokens.push(this.tok('eos'));
    this.ended = true;
    return true;
  },

  /**
   * Blank line.
   */

  blank: function() {
    var captures;
    if (captures = /^\n[ \t]*\n/.exec(this.input)) {
      this.consume(captures[0].length - 1);
      this.incrementLine(1);
      return true;
    }
  },

  /**
   * Comment.
   */

  comment: function() {
    var captures;
    if (captures = /^\/\/(-)?([^\n]*)/.exec(this.input)) {
      this.consume(captures[0].length);
      var tok = this.tok('comment', captures[2]);
      tok.buffer = '-' != captures[1];
      this.interpolationAllowed = tok.buffer;
      this.tokens.push(tok);
      this.incrementColumn(captures[0].length);
      this.callLexerFunction('pipelessText');
      return true;
    }
  },

  /**
   * Interpolated tag.
   */

  interpolation: function() {
    if (/^#\{/.test(this.input)) {
      var match = this.bracketExpression(1);
      this.consume(match.end + 1);
      var tok = this.tok('interpolation', match.src);
      this.tokens.push(tok);
      this.incrementColumn(2); // '#{'
      this.assertExpression(match.src);

      var splitted = match.src.split('\n');
      var lines = splitted.length - 1;
      this.incrementLine(lines);
      this.incrementColumn(splitted[lines].length + 1); // + 1 → '}'
      return true;
    }
  },

  /**
   * Tag.
   */

  tag: function() {
    var captures;

    if (captures = /^(\w(?:[-:\w]*\w)?)/.exec(this.input)) {
      var tok, name = captures[1], len = captures[0].length;
      this.consume(len);
      tok = this.tok('tag', name);
      this.tokens.push(tok);
      this.incrementColumn(len);
      return true;
    }
  },

  /**
   * Filter.
   */

  filter: function(opts) {
    var tok = this.scan(/^:([\w\-]+)/, 'filter');
    var inInclude = opts && opts.inInclude;
    if (tok) {
      this.tokens.push(tok);
      this.incrementColumn(tok.val.length);
      this.callLexerFunction('attrs');
      if (!inInclude) {
        this.interpolationAllowed = false;
        this.callLexerFunction('pipelessText');
      }
      return true;
    }
  },

  /**
   * Doctype.
   */

  doctype: function() {
    var node = this.scanEndOfLine(/^doctype *([^\n]*)/, 'doctype');
    if (node) {
      this.tokens.push(node);
      return true;
    }
  },

  /**
   * Id.
   */

  id: function() {
    var tok = this.scan(/^#([\w-]+)/, 'id');
    if (tok) {
      this.tokens.push(tok);
      this.incrementColumn(tok.val.length);
      return true;
    }
    if (/^#/.test(this.input)) {
      this.error('INVALID_ID', '"' + /.[^ \t\(\#\.\:]*/.exec(this.input.substr(1))[0] + '" is not a valid ID.');
    }
  },

  /**
   * Class.
   */

  className: function() {
    var tok = this.scan(/^\.(-?-?[_a-z][_a-z0-9\-]*)/i, 'class');
    if (tok) {
      this.tokens.push(tok);
      this.incrementColumn(tok.val.length);
      return true;
    }
    if (/^\.\-/i.test(this.input)) {
      this.error('INVALID_CLASS_NAME', 'If a class name begins with a "-" or "--", it must be followed by a letter or underscore.');
    }
    if (/^\.[0-9]/i.test(this.input)) {
      this.error('INVALID_CLASS_NAME', 'Class names must begin with "-", "_" or a letter.');
    }
    if (/^\./.test(this.input)) {
      this.error('INVALID_CLASS_NAME', '"' + /.[^ \t\(\#\.\:]*/.exec(this.input.substr(1))[0] + '" is not a valid class name.  Class names must begin with "-", "_" or a letter and can only contain "_", "-", a-z and 0-9.');
    }
  },

  /**
   * Text.
   */
  endInterpolation: function () {
    if (this.interpolated && this.input[0] === ']') {
      this.input = this.input.substr(1);
      this.ended = true;
      return true;
    }
  },
  addText: function (type, value, prefix, escaped) {
    if (value + prefix === '') return;
    prefix = prefix || '';
    var indexOfEnd = this.interpolated ? value.indexOf(']') : -1;
    var indexOfStart = this.interpolationAllowed ? value.indexOf('#[') : -1;
    var indexOfEscaped = this.interpolationAllowed ? value.indexOf('\\#[') : -1;
    var matchOfStringInterp = /(\\)?([#!]){((?:.|\n)*)$/.exec(value);
    var indexOfStringInterp = this.interpolationAllowed && matchOfStringInterp ? matchOfStringInterp.index : Infinity;

    if (indexOfEnd === -1) indexOfEnd = Infinity;
    if (indexOfStart === -1) indexOfStart = Infinity;
    if (indexOfEscaped === -1) indexOfEscaped = Infinity;

    if (indexOfEscaped !== Infinity && indexOfEscaped < indexOfEnd && indexOfEscaped < indexOfStart && indexOfEscaped < indexOfStringInterp) {
      prefix = prefix + value.substring(0, indexOfEscaped) + '#[';
      return this.addText(type, value.substring(indexOfEscaped + 3), prefix, true);
    }
    if (indexOfStart !== Infinity && indexOfStart < indexOfEnd && indexOfStart < indexOfEscaped && indexOfStart < indexOfStringInterp) {
      this.tokens.push(this.tok(type, prefix + value.substring(0, indexOfStart)));
      this.incrementColumn(prefix.length + indexOfStart);
      if (escaped) this.incrementColumn(1);
      this.tokens.push(this.tok('start-pug-interpolation'));
      this.incrementColumn(2);
      var child = new this.constructor(value.substr(indexOfStart + 2), {
        filename: this.filename,
        interpolated: true,
        startingLine: this.lineno,
        startingColumn: this.colno
      });
      var interpolated;
      try {
        interpolated = child.getTokens();
      } catch (ex) {
        if (ex.code && /^PUG:/.test(ex.code)) {
          this.colno = ex.column;
          this.error(ex.code.substr(4), ex.msg);
        }
        throw ex;
      }
      this.colno = child.colno;
      this.tokens = this.tokens.concat(interpolated);
      this.tokens.push(this.tok('end-pug-interpolation'));
      this.incrementColumn(1);
      this.addText(type, child.input);
      return;
    }
    if (indexOfEnd !== Infinity && indexOfEnd < indexOfStart && indexOfEnd < indexOfEscaped && indexOfEnd < indexOfStringInterp) {
      if (prefix + value.substring(0, indexOfEnd)) {
        this.addText(type, value.substring(0, indexOfEnd), prefix);
      }
      this.ended = true;
      this.input = value.substr(value.indexOf(']') + 1) + this.input;
      return;
    }
    if (indexOfStringInterp !== Infinity) {
      if (matchOfStringInterp[1]) {
        prefix = prefix + value.substring(0, indexOfStringInterp) + '#{';
        return this.addText(type, value.substring(indexOfStringInterp + 3), prefix);
      }
      var before = value.substr(0, indexOfStringInterp);
      if (prefix || before) {
        before = prefix + before;
        this.tokens.push(this.tok(type, before));
        this.incrementColumn(before.length);
      }

      var rest = matchOfStringInterp[3];
      var range;
      var tok = this.tok('interpolated-code');
      this.incrementColumn(2);
      try {
        range = characterParser.parseUntil(rest, '}');
      } catch (ex) {
        if (ex.index !== undefined) {
          this.incrementColumn(ex.index);
        }
        if (ex.code === 'CHARACTER_PARSER:END_OF_STRING_REACHED') {
          this.error('NO_END_BRACKET', 'End of line was reached with no closing bracket for interpolation.');
        } else if (ex.code === 'CHARACTER_PARSER:MISMATCHED_BRACKET') {
          this.error('BRACKET_MISMATCH', ex.message);
        } else {
          throw ex;
        }
      }
      tok.mustEscape = matchOfStringInterp[2] === '#';
      tok.buffer = true;
      tok.val = range.src;
      this.assertExpression(range.src);
      this.tokens.push(tok);

      if (range.end + 1 < rest.length) {
        rest = rest.substr(range.end + 1);
        this.incrementColumn(range.end + 1);
        this.addText(type, rest);
      } else {
        this.incrementColumn(rest.length);
      }
      return;
    }

    value = prefix + value;
    this.tokens.push(this.tok(type, value));
    this.incrementColumn(value.length);
  },

  text: function() {
    var tok = this.scan(/^(?:\| ?| )([^\n]+)/, 'text') ||
      this.scan(/^( )/, 'text') ||
      this.scan(/^\|( ?)/, 'text');
    if (tok) {
      this.addText('text', tok.val);
      return true;
    }
  },

  textHtml: function () {
    var tok = this.scan(/^(<[^\n]*)/, 'text-html');
    if (tok) {
      this.addText('text-html', tok.val);
      return true;
    }
  },

  /**
   * Dot.
   */

  dot: function() {
    var tok;
    if (tok = this.scanEndOfLine(/^\./, 'dot')) {
      this.tokens.push(tok);
      this.callLexerFunction('pipelessText');
      return true;
    }
  },

  /**
   * Extends.
   */

  "extends": function() {
    var tok = this.scan(/^extends?(?= |$|\n)/, 'extends');
    if (tok) {
      this.tokens.push(tok);
      if (!this.callLexerFunction('path')) {
        this.error('NO_EXTENDS_PATH', 'missing path for extends');
      }
      return true;
    }
    if (this.scan(/^extends?\b/)) {
      this.error('MALFORMED_EXTENDS', 'malformed extends');
    }
  },

  /**
   * Block prepend.
   */

  prepend: function() {
    var captures;
    if (captures = /^(?:block +)?prepend +([^\n]+)/.exec(this.input)) {
      var name = captures[1].trim();
      var comment = '';
      if (name.indexOf('//') !== -1) {
        comment = '//' + name.split('//').slice(1).join('//');
        name = name.split('//')[0].trim();
      }
      if (!name) return;
      this.consume(captures[0].length - comment.length);
      var tok = this.tok('block', name);
      tok.mode = 'prepend';
      this.tokens.push(tok);
      return true;
    }
  },

  /**
   * Block append.
   */

  append: function() {
    var captures;
    if (captures = /^(?:block +)?append +([^\n]+)/.exec(this.input)) {
      var name = captures[1].trim();
      var comment = '';
      if (name.indexOf('//') !== -1) {
        comment = '//' + name.split('//').slice(1).join('//');
        name = name.split('//')[0].trim();
      }
      if (!name) return;
      this.consume(captures[0].length - comment.length);
      var tok = this.tok('block', name);
      tok.mode = 'append';
      this.tokens.push(tok);
      return true;
    }
  },

  /**
   * Block.
   */

  block: function() {
    var captures;
    if (captures = /^block +([^\n]+)/.exec(this.input)) {
      var name = captures[1].trim();
      var comment = '';
      if (name.indexOf('//') !== -1) {
        comment = '//' + name.split('//').slice(1).join('//');
        name = name.split('//')[0].trim();
      }
      if (!name) return;
      this.consume(captures[0].length - comment.length);
      var tok = this.tok('block', name);
      tok.mode = 'replace';
      this.tokens.push(tok);
      return true;
    }
  },

  /**
   * Mixin Block.
   */

  mixinBlock: function() {
    var tok;
    if (tok = this.scanEndOfLine(/^block/, 'mixin-block')) {
      this.tokens.push(tok);
      return true;
    }
  },

  /**
   * Yield.
   */

  'yield': function() {
    var tok = this.scanEndOfLine(/^yield/, 'yield');
    if (tok) {
      this.tokens.push(tok);
      return true;
    }
  },

  /**
   * Include.
   */

  include: function() {
    var tok = this.scan(/^include(?=:| |$|\n)/, 'include');
    if (tok) {
      this.tokens.push(tok);
      while (this.callLexerFunction('filter', { inInclude: true }));
      if (!this.callLexerFunction('path')) {
        if (/^[^ \n]+/.test(this.input)) {
          // if there is more text
          this.fail();
        } else {
          // if not
          this.error('NO_INCLUDE_PATH', 'missing path for include');
        }
      }
      return true;
    }
    if (this.scan(/^include\b/)) {
      this.error('MALFORMED_INCLUDE', 'malformed include');
    }
  },

  /**
   * Path
   */

  path: function() {
    var tok = this.scanEndOfLine(/^ ([^\n]+)/, 'path');
    if (tok && (tok.val = tok.val.trim())) {
      this.tokens.push(tok);
      return true;
    }
  },

  /**
   * Case.
   */

  "case": function() {
    var tok = this.scanEndOfLine(/^case +([^\n]+)/, 'case');
    if (tok) {
      this.incrementColumn(-tok.val.length);
      this.assertExpression(tok.val);
      this.incrementColumn(tok.val.length);
      this.tokens.push(tok);
      return true;
    }
    if (this.scan(/^case\b/)) {
      this.error('NO_CASE_EXPRESSION', 'missing expression for case');
    }
  },

  /**
   * When.
   */

  when: function() {
    var tok = this.scanEndOfLine(/^when +([^:\n]+)/, 'when');
    if (tok) {
      var parser = characterParser(tok.val);
      while (parser.isNesting() || parser.isString()) {
        var rest = /:([^:\n]+)/.exec(this.input);
        if (!rest) break;

        tok.val += rest[0];
        this.consume(rest[0].length);
        this.incrementColumn(rest[0].length);
        parser = characterParser(tok.val);
      }

      this.incrementColumn(-tok.val.length);
      this.assertExpression(tok.val);
      this.incrementColumn(tok.val.length);
      this.tokens.push(tok);
      return true;
    }
    if (this.scan(/^when\b/)) {
      this.error('NO_WHEN_EXPRESSION', 'missing expression for when');
    }
  },

  /**
   * Default.
   */

  "default": function() {
    var tok = this.scanEndOfLine(/^default/, 'default');
    if (tok) {
      this.tokens.push(tok);
      return true;
    }
    if (this.scan(/^default\b/)) {
      this.error('DEFAULT_WITH_EXPRESSION', 'default should not have an expression');
    }
  },

  /**
   * Call mixin.
   */

  call: function(){

    var tok, captures, increment;
    if (captures = /^\+(\s*)(([-\w]+)|(#\{))/.exec(this.input)) {
      // try to consume simple or interpolated call
      if (captures[3]) {
        // simple call
        increment = captures[0].length;
        this.consume(increment);
        tok = this.tok('call', captures[3]);
      } else {
        // interpolated call
        var match = this.bracketExpression(2 + captures[1].length);
        increment = match.end + 1;
        this.consume(increment);
        this.assertExpression(match.src);
        tok = this.tok('call', '#{'+match.src+'}');
      }

      this.incrementColumn(increment);

      tok.args = null;
      // Check for args (not attributes)
      if (captures = /^ *\(/.exec(this.input)) {
        var range = this.bracketExpression(captures[0].length - 1);
        if (!/^\s*[-\w]+ *=/.test(range.src)) { // not attributes
          this.incrementColumn(1);
          this.consume(range.end + 1);
          tok.args = range.src;
          this.assertExpression('[' + tok.args + ']');
          for (var i = 0; i <= tok.args.length; i++) {
            if (tok.args[i] === '\n') {
              this.incrementLine(1);
            } else {
              this.incrementColumn(1);
            }
          }
        }
      }
      this.tokens.push(tok);
      return true;
    }
  },

  /**
   * Mixin.
   */

  mixin: function(){
    var captures;
    if (captures = /^mixin +([-\w]+)(?: *\((.*)\))? */.exec(this.input)) {
      this.consume(captures[0].length);
      var tok = this.tok('mixin', captures[1]);
      tok.args = captures[2] || null;
      this.tokens.push(tok);
      return true;
    }
  },

  /**
   * Conditional.
   */

  conditional: function() {
    var captures;
    if (captures = /^(if|unless|else if|else)\b([^\n]*)/.exec(this.input)) {
      this.consume(captures[0].length);
      var type = captures[1].replace(/ /g, '-');
      var js = captures[2] && captures[2].trim();
      // type can be "if", "else-if" and "else"
      var tok = this.tok(type, js);
      this.incrementColumn(captures[0].length - js.length);

      switch (type) {
        case 'if':
        case 'else-if':
          this.assertExpression(js);
          break;
        case 'unless':
          this.assertExpression(js);
          tok.val = '!(' + js + ')';
          tok.type = 'if';
          break;
        case 'else':
          if (js) {
            this.error(
              'ELSE_CONDITION',
              '`else` cannot have a condition, perhaps you meant `else if`'
            );
          }
          break;
      }
      this.tokens.push(tok);
      return true;
    }
  },

  /**
   * While.
   */

  "while": function() {
    var captures;
    if (captures = /^while +([^\n]+)/.exec(this.input)) {
      this.consume(captures[0].length);
      this.assertExpression(captures[1])
      this.tokens.push(this.tok('while', captures[1]));
      return true;
    }
    if (this.scan(/^while\b/)) {
      this.error('NO_WHILE_EXPRESSION', 'missing expression for while');
    }
  },

  /**
   * Each.
   */

  each: function() {
    var captures;
    if (captures = /^(?:each|for) +([a-zA-Z_$][\w$]*)(?: *, *([a-zA-Z_$][\w$]*))? * in *([^\n]+)/.exec(this.input)) {
      this.consume(captures[0].length);
      var tok = this.tok('each', captures[1]);
      tok.key = captures[2] || null;
      this.incrementColumn(captures[0].length - captures[3].length);
      this.assertExpression(captures[3])
      tok.code = captures[3];
      this.incrementColumn(captures[3].length);
      this.tokens.push(tok);
      return true;
    }
    if (this.scan(/^(?:each|for)\b/)) {
      this.error('MALFORMED_EACH', 'malformed each');
    }
    if (captures = /^- *(?:each|for) +([a-zA-Z_$][\w$]*)(?: *, *([a-zA-Z_$][\w$]*))? +in +([^\n]+)/.exec(this.input)) {
      this.error(
        'MALFORMED_EACH',
        'Pug each and for should no longer be prefixed with a dash ("-"). They are pug keywords and not part of JavaScript.'
      );
    }
  },

  /**
   * Code.
   */

  code: function() {
    var captures;
    if (captures = /^(!?=|-)[ \t]*([^\n]+)/.exec(this.input)) {
      var flags = captures[1];
      var code = captures[2];
      var shortened = 0;
      if (this.interpolated) {
        var parsed;
        try {
          parsed = characterParser.parseUntil(code, ']');
        } catch (err) {
          if (err.index !== undefined) {
            this.incrementColumn(captures[0].length - code.length + err.index);
          }
          if (err.code === 'CHARACTER_PARSER:END_OF_STRING_REACHED') {
            this.error('NO_END_BRACKET', 'End of line was reached with no closing bracket for interpolation.');
          } else if (err.code === 'CHARACTER_PARSER:MISMATCHED_BRACKET') {
            this.error('BRACKET_MISMATCH', err.message);
          } else {
            throw err;
          }
        }
        shortened = code.length - parsed.end;
        code = parsed.src;
      }
      var consumed = captures[0].length - shortened;
      this.consume(consumed);
      var tok = this.tok('code', code);
      tok.mustEscape = flags.charAt(0) === '=';
      tok.buffer = flags.charAt(0) === '=' || flags.charAt(1) === '=';

      // p #[!=    abc] hey
      //     ^              original colno
      //     -------------- captures[0]
      //           -------- captures[2]
      //     ------         captures[0] - captures[2]
      //           ^        after colno

      // =   abc
      // ^                  original colno
      // -------            captures[0]
      //     ---            captures[2]
      // ----               captures[0] - captures[2]
      //     ^              after colno
      this.incrementColumn(captures[0].length - captures[2].length);
      if (tok.buffer) this.assertExpression(code);
      this.tokens.push(tok);

      // p #[!=    abc] hey
      //           ^        original colno
      //              ----- shortened
      //           ---      code
      //              ^     after colno

      // =   abc
      //     ^              original colno
      //                    shortened
      //     ---            code
      //        ^           after colno
      this.incrementColumn(code.length);
      return true;
    }
  },

  /**
   * Block code.
   */
  blockCode: function() {
    var tok
    if (tok = this.scanEndOfLine(/^-/, 'blockcode')) {
      this.tokens.push(tok);
      this.interpolationAllowed = false;
      this.callLexerFunction('pipelessText');
      return true;
    }
  },

  /**
   * Attributes.
   */

  attrs: function() {
    if ('(' == this.input.charAt(0)) {
      var startingLine = this.lineno;
      this.tokens.push(this.tok('start-attributes'));
      var index = this.bracketExpression().end
        , str = this.input.substr(1, index-1);

      this.incrementColumn(1);
      this.assertNestingCorrect(str);

      var quote = '';
      var self = this;

      this.consume(index + 1);

      var whitespaceRe = /[ \n\t]/;
      var quoteRe = /['"]/;

      var escapedAttr = true
      var key = '';
      var val = '';
      var state = characterParser.defaultState();
      var lineno = startingLine;
      var colnoBeginAttr = this.colno;
      var colnoBeginVal;
      var loc = 'key';
      var isEndOfAttribute = function (i) {
        // if the key is not started, then the attribute cannot be ended
        if (key.trim() === '') {
          colnoBeginAttr = this.colno;
          return false;
        }
        // if there's nothing more then the attribute must be ended
        if (i === str.length) return true;

        if (loc === 'key') {
          if (whitespaceRe.test(str[i])) {
            // find the first non-whitespace character
            for (var x = i; x < str.length; x++) {
              if (!whitespaceRe.test(str[x])) {
                // starts a `value`
                if (str[x] === '=' || str[x] === '!') return false;
                // will be handled when x === i
                else if (str[x] === ',') return false;
                // attribute ended
                else return true;
              }
            }
          }
          // if there's no whitespace and the character is not ',', the
          // attribute did not end.
          return str[i] === ',';
        } else if (loc === 'value') {
          // if the character is in a string or in parentheses/brackets/braces
          if (state.isNesting() || state.isString()) return false;

          // if the current value expression is not valid JavaScript, then
          // assume that the user did not end the value.  To enforce this,
          // we call `self.assertExpression(val, true)`, but since the other
          // tests are much faster, we run the other tests first.

          if (whitespaceRe.test(str[i])) {
            // find the first non-whitespace character
            for (var x = i; x < str.length; x++) {
              if (!whitespaceRe.test(str[x])) {
                // if it is a JavaScript punctuator, then assume that it is
                // a part of the value
                return (!characterParser.isPunctuator(str[x]) || quoteRe.test(str[x]) || str[x] === ':') && self.assertExpression(val, true);
              }
            }
          }
          // if there's no whitespace and the character is not ',', the
          // attribute did not end.
          return str[i] === ',' && self.assertExpression(val, true);
        }
      }

      for (var i = 0; i <= str.length; i++) {
        if (isEndOfAttribute.call(this, i)) {
          if (val.trim()) {
            var saved = this.colno;
            this.colno = colnoBeginVal;
            this.assertExpression(val);
            this.colno = saved;
          }

          val = val.trim();

          key = key.trim();
          key = key.replace(/^['"]|['"]$/g, '');

          var tok = this.tok('attribute');
          tok.name = key;
          tok.val = '' == val ? true : val;
          tok.col = colnoBeginAttr;
          tok.mustEscape = escapedAttr;
          this.tokens.push(tok);

          key = val = '';
          loc = 'key';
          escapedAttr = false;
          this.lineno = lineno;
        } else {
          switch (loc) {
            case 'key-char':
              if (str[i] === quote) {
                loc = 'key';
                if (i + 1 < str.length && !/[ ,!=\n\t]/.test(str[i + 1]))
                  this.error('INVALID_KEY_CHARACTER', 'Unexpected character "' + str[i + 1] + '" expected ` `, `\\n`, `\t`, `,`, `!` or `=`');
              } else {
                key += str[i];
              }
              break;
            case 'key':
              if (key === '' && quoteRe.test(str[i])) {
                loc = 'key-char';
                quote = str[i];
              } else if (str[i] === '!' || str[i] === '=') {
                escapedAttr = str[i] !== '!';
                if (str[i] === '!') {
                  this.incrementColumn(1);
                  i++;
                }
                if (str[i] !== '=') this.error('INVALID_KEY_CHARACTER', 'Unexpected character ' + str[i] + ' expected `=`');
                loc = 'value';
                colnoBeginVal = this.colno + 1;
                state = characterParser.defaultState();
              } else {
                key += str[i]
              }
              break;
            case 'value':
              state = characterParser.parseChar(str[i], state);
              val += str[i];
              break;
          }
        }
        if (str[i] === '\n') {
          // Save the line number locally to keep this.lineno at the start of
          // the attribute.
          lineno++;
          this.colno = 1;
          // If the key has not been started, update this.lineno immediately.
          if (!key.trim()) this.lineno = lineno;
        } else if (str[i] !== undefined) {
          this.incrementColumn(1);
        }
      }

      // Reset the line numbers based on the line started on
      // plus the number of newline characters encountered
      this.lineno = startingLine + (str.match(/\n/g) || []).length;

      this.tokens.push(this.tok('end-attributes'));
      this.incrementColumn(1);
      return true;
    }
  },

  /**
   * &attributes block
   */
  attributesBlock: function () {
    if (/^&attributes\b/.test(this.input)) {
      var consumed = 11;
      this.consume(consumed);
      var tok = this.tok('&attributes');
      this.incrementColumn(consumed);
      var args = this.bracketExpression();
      consumed = args.end + 1;
      this.consume(consumed);
      tok.val = args.src;
      this.tokens.push(tok);
      this.incrementColumn(consumed);
      return true;
    }
  },

  /**
   * Indent | Outdent | Newline.
   */

  indent: function() {
    var captures = this.scanIndentation();

    if (captures) {
      var indents = captures[1].length;

      this.incrementLine(1);
      this.consume(indents + 1);

      if (' ' == this.input[0] || '\t' == this.input[0]) {
        this.error('INVALID_INDENTATION', 'Invalid indentation, you can use tabs or spaces but not both');
      }

      // blank line
      if ('\n' == this.input[0]) {
        this.interpolationAllowed = true;
        return this.tok('newline');
      }

      // outdent
      if (indents < this.indentStack[0]) {
        while (this.indentStack[0] > indents) {
          if (this.indentStack[1] < indents) {
            this.error('INCONSISTENT_INDENTATION', 'Inconsistent indentation. Expecting either ' + this.indentStack[1] + ' or ' + this.indentStack[0] + ' spaces/tabs.');
          }
          this.colno = this.indentStack[1] + 1;
          this.tokens.push(this.tok('outdent'));
          this.indentStack.shift();
        }
      // indent
      } else if (indents && indents != this.indentStack[0]) {
        this.tokens.push(this.tok('indent', indents));
        this.colno = 1 + indents;
        this.indentStack.unshift(indents);
      // newline
      } else {
        this.tokens.push(this.tok('newline'));
        this.colno = 1 + (this.indentStack[0] || 0);
      }

      this.interpolationAllowed = true;
      return true;
    }
  },

  pipelessText: function pipelessText(indents) {
    while (this.callLexerFunction('blank'));

    var captures = this.scanIndentation();

    indents = indents || captures && captures[1].length;
    if (indents > this.indentStack[0]) {
      this.tokens.push(this.tok('start-pipeless-text'));
      var tokens = [];
      var isMatch;
      // Index in this.input. Can't use this.consume because we might need to
      // retry lexing the block.
      var stringPtr = 0;
      do {
        // text has `\n` as a prefix
        var i = this.input.substr(stringPtr + 1).indexOf('\n');
        if (-1 == i) i = this.input.length - stringPtr - 1;
        var str = this.input.substr(stringPtr + 1, i);
        var lineCaptures = this.indentRe.exec('\n' + str);
        var lineIndents = lineCaptures && lineCaptures[1].length;
        isMatch = lineIndents >= indents || !str.trim();
        if (isMatch) {
          // consume test along with `\n` prefix if match
          stringPtr += str.length + 1;
          tokens.push(str.substr(indents));
        } else if (lineIndents > this.indentStack[0]) {
          // line is indented less than the first line but is still indented
          // need to retry lexing the text block
          this.tokens.pop();
          return pipelessText.call(this, lineCaptures[1].length);
        }
      } while((this.input.length - stringPtr) && isMatch);
      this.consume(stringPtr);
      while (this.input.length === 0 && tokens[tokens.length - 1] === '') tokens.pop();
      tokens.forEach(function (token, i) {
        this.incrementLine(1);
        if (i !== 0) this.tokens.push(this.tok('newline'));
        this.incrementColumn(indents);
        this.addText('text', token);
      }.bind(this));
      this.tokens.push(this.tok('end-pipeless-text'));
      return true;
    }
  },

  /**
   * Slash.
   */

  slash: function() {
    var tok = this.scan(/^\//, 'slash');
    if (tok) {
      this.tokens.push(tok);
      return true;
    }
  },

  /**
   * ':'
   */

  colon: function() {
    var tok = this.scan(/^: +/, ':');
    if (tok) {
      this.tokens.push(tok);
      return true;
    }
  },

  fail: function () {
    this.error('UNEXPECTED_TEXT', 'unexpected text "' + this.input.substr(0, 5) + '"');
  },

  callLexerFunction: function (func) {
    var rest = [];
    for (var i = 1; i < arguments.length; i++) {
      rest.push(arguments[i]);
    }
    var pluginArgs = [this].concat(rest);
    for (var i = 0; i < this.plugins.length; i++) {
      var plugin = this.plugins[i];
      if (plugin[func] && plugin[func].apply(plugin, pluginArgs)) {
        return true;
      }
    }
    return this[func].apply(this, rest);
  },

  /**
   * Move to the next token
   *
   * @api private
   */

  advance: function() {
    return this.callLexerFunction('blank')
      || this.callLexerFunction('eos')
      || this.callLexerFunction('endInterpolation')
      || this.callLexerFunction('yield')
      || this.callLexerFunction('doctype')
      || this.callLexerFunction('interpolation')
      || this.callLexerFunction('case')
      || this.callLexerFunction('when')
      || this.callLexerFunction('default')
      || this.callLexerFunction('extends')
      || this.callLexerFunction('append')
      || this.callLexerFunction('prepend')
      || this.callLexerFunction('block')
      || this.callLexerFunction('mixinBlock')
      || this.callLexerFunction('include')
      || this.callLexerFunction('mixin')
      || this.callLexerFunction('call')
      || this.callLexerFunction('conditional')
      || this.callLexerFunction('each')
      || this.callLexerFunction('while')
      || this.callLexerFunction('tag')
      || this.callLexerFunction('filter')
      || this.callLexerFunction('blockCode')
      || this.callLexerFunction('code')
      || this.callLexerFunction('id')
      || this.callLexerFunction('dot')
      || this.callLexerFunction('className')
      || this.callLexerFunction('attrs')
      || this.callLexerFunction('attributesBlock')
      || this.callLexerFunction('indent')
      || this.callLexerFunction('text')
      || this.callLexerFunction('textHtml')
      || this.callLexerFunction('comment')
      || this.callLexerFunction('slash')
      || this.callLexerFunction('colon')
      || this.fail();
  },

  /**
   * Return an array of tokens for the current file
   *
   * @returns {Array.<Token>}
   * @api public
   */
  getTokens: function () {
    while (!this.ended) {
      this.callLexerFunction('advance');
    }
    return this.tokens;
  }
};

},{"assert":18,"character-parser":33,"is-expression":34,"pug-error":17}],41:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.acorn = global.acorn || {})));
}(this, function (exports) { 'use strict';

  // Reserved word lists for various dialects of the language

  var reservedWords = {
    3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
    5: "class enum extends super const export import",
    6: "enum",
    7: "enum",
    strict: "implements interface let package private protected public static yield",
    strictBind: "eval arguments"
  }

  // And the keywords

  var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this"

  var keywords = {
    5: ecma5AndLessKeywords,
    6: ecma5AndLessKeywords + " const class extends export import super"
  }

  // ## Character categories

  // Big ugly regular expressions that match characters in the
  // whitespace, identifier, and identifier-start categories. These
  // are only applied when a character is found to actually have a
  // code point above 128.
  // Generated by `bin/generate-identifier-regex.js`.

  var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fd5\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7ae\ua7b0-\ua7b7\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab65\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc"
  var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d4-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d01-\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf8\u1cf9\u1dc0-\u1df5\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f"

  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]")
  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]")

  nonASCIIidentifierStartChars = nonASCIIidentifierChars = null

  // These are a run-length and offset encoded representation of the
  // >0xffff code points that are a valid part of identifiers. The
  // offset starts at 0x10000, and each pair of numbers represents an
  // offset to the next range, and then a size of the range. They were
  // generated by bin/generate-identifier-regex.js
  var astralIdentifierStartCodes = [0,11,2,25,2,18,2,1,2,14,3,13,35,122,70,52,268,28,4,48,48,31,17,26,6,37,11,29,3,35,5,7,2,4,43,157,19,35,5,35,5,39,9,51,157,310,10,21,11,7,153,5,3,0,2,43,2,1,4,0,3,22,11,22,10,30,66,18,2,1,11,21,11,25,71,55,7,1,65,0,16,3,2,2,2,26,45,28,4,28,36,7,2,27,28,53,11,21,11,18,14,17,111,72,56,50,14,50,785,52,76,44,33,24,27,35,42,34,4,0,13,47,15,3,22,0,2,0,36,17,2,24,85,6,2,0,2,3,2,14,2,9,8,46,39,7,3,1,3,21,2,6,2,1,2,4,4,0,19,0,13,4,159,52,19,3,54,47,21,1,2,0,185,46,42,3,37,47,21,0,60,42,86,25,391,63,32,0,449,56,264,8,2,36,18,0,50,29,881,921,103,110,18,195,2749,1070,4050,582,8634,568,8,30,114,29,19,47,17,3,32,20,6,18,881,68,12,0,67,12,65,0,32,6124,20,754,9486,1,3071,106,6,12,4,8,8,9,5991,84,2,70,2,1,3,0,3,1,3,3,2,11,2,0,2,6,2,64,2,3,3,7,2,6,2,27,2,3,2,4,2,0,4,6,2,339,3,24,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,7,4149,196,60,67,1213,3,2,26,2,1,2,0,3,0,2,9,2,3,2,0,2,0,7,0,5,0,2,0,2,0,2,2,2,1,2,0,3,0,2,0,2,0,2,0,2,0,2,1,2,0,3,3,2,6,2,3,2,3,2,0,2,9,2,16,6,2,2,4,2,16,4421,42710,42,4148,12,221,3,5761,10591,541]
  var astralIdentifierCodes = [509,0,227,0,150,4,294,9,1368,2,2,1,6,3,41,2,5,0,166,1,1306,2,54,14,32,9,16,3,46,10,54,9,7,2,37,13,2,9,52,0,13,2,49,13,10,2,4,9,83,11,7,0,161,11,6,9,7,3,57,0,2,6,3,1,3,2,10,0,11,1,3,6,4,4,193,17,10,9,87,19,13,9,214,6,3,8,28,1,83,16,16,9,82,12,9,9,84,14,5,9,423,9,838,7,2,7,17,9,57,21,2,13,19882,9,135,4,60,6,26,9,1016,45,17,3,19723,1,5319,4,4,5,9,7,3,6,31,3,149,2,1418,49,513,54,5,49,9,0,15,0,23,4,2,14,1361,6,2,16,3,6,2,1,2,4,2214,6,110,6,6,9,792487,239]

  // This has a complexity linear to the value of the code. The
  // assumption is that looking up astral identifier characters is
  // rare.
  function isInAstralSet(code, set) {
    var pos = 0x10000
    for (var i = 0; i < set.length; i += 2) {
      pos += set[i]
      if (pos > code) return false
      pos += set[i + 1]
      if (pos >= code) return true
    }
  }

  // Test whether a given character code starts an identifier.

  function isIdentifierStart(code, astral) {
    if (code < 65) return code === 36
    if (code < 91) return true
    if (code < 97) return code === 95
    if (code < 123) return true
    if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code))
    if (astral === false) return false
    return isInAstralSet(code, astralIdentifierStartCodes)
  }

  // Test whether a given character is part of an identifier.

  function isIdentifierChar(code, astral) {
    if (code < 48) return code === 36
    if (code < 58) return true
    if (code < 65) return false
    if (code < 91) return true
    if (code < 97) return code === 95
    if (code < 123) return true
    if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code))
    if (astral === false) return false
    return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
  }

  // ## Token types

  // The assignment of fine-grained, information-carrying type objects
  // allows the tokenizer to store the information it has about a
  // token in a way that is very cheap for the parser to look up.

  // All token type variables start with an underscore, to make them
  // easy to recognize.

  // The `beforeExpr` property is used to disambiguate between regular
  // expressions and divisions. It is set on all token types that can
  // be followed by an expression (thus, a slash after them would be a
  // regular expression).
  //
  // The `startsExpr` property is used to check if the token ends a
  // `yield` expression. It is set on all token types that either can
  // directly start an expression (like a quotation mark) or can
  // continue an expression (like the body of a string).
  //
  // `isLoop` marks a keyword as starting a loop, which is important
  // to know when parsing a label, in order to allow or disallow
  // continue jumps to that label.

  var TokenType = function TokenType(label, conf) {
    if ( conf === void 0 ) conf = {};

    this.label = label
    this.keyword = conf.keyword
    this.beforeExpr = !!conf.beforeExpr
    this.startsExpr = !!conf.startsExpr
    this.isLoop = !!conf.isLoop
    this.isAssign = !!conf.isAssign
    this.prefix = !!conf.prefix
    this.postfix = !!conf.postfix
    this.binop = conf.binop || null
    this.updateContext = null
  };

  function binop(name, prec) {
    return new TokenType(name, {beforeExpr: true, binop: prec})
  }
  var beforeExpr = {beforeExpr: true};
  var startsExpr = {startsExpr: true};
  // Map keyword names to token types.

  var keywordTypes = {}

  // Succinct definitions of keyword token types
  function kw(name, options) {
    if ( options === void 0 ) options = {};

    options.keyword = name
    return keywordTypes[name] = new TokenType(name, options)
  }

  var tt = {
    num: new TokenType("num", startsExpr),
    regexp: new TokenType("regexp", startsExpr),
    string: new TokenType("string", startsExpr),
    name: new TokenType("name", startsExpr),
    eof: new TokenType("eof"),

    // Punctuation token types.
    bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
    bracketR: new TokenType("]"),
    braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
    braceR: new TokenType("}"),
    parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
    parenR: new TokenType(")"),
    comma: new TokenType(",", beforeExpr),
    semi: new TokenType(";", beforeExpr),
    colon: new TokenType(":", beforeExpr),
    dot: new TokenType("."),
    question: new TokenType("?", beforeExpr),
    arrow: new TokenType("=>", beforeExpr),
    template: new TokenType("template"),
    ellipsis: new TokenType("...", beforeExpr),
    backQuote: new TokenType("`", startsExpr),
    dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),

    // Operators. These carry several kinds of properties to help the
    // parser use them properly (the presence of these properties is
    // what categorizes them as operators).
    //
    // `binop`, when present, specifies that this operator is a binary
    // operator, and will refer to its precedence.
    //
    // `prefix` and `postfix` mark the operator as a prefix or postfix
    // unary operator.
    //
    // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
    // binary operators with a very low precedence, that should result
    // in AssignmentExpression nodes.

    eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
    assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
    incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
    prefix: new TokenType("prefix", {beforeExpr: true, prefix: true, startsExpr: true}),
    logicalOR: binop("||", 1),
    logicalAND: binop("&&", 2),
    bitwiseOR: binop("|", 3),
    bitwiseXOR: binop("^", 4),
    bitwiseAND: binop("&", 5),
    equality: binop("==/!=", 6),
    relational: binop("</>", 7),
    bitShift: binop("<</>>", 8),
    plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
    modulo: binop("%", 10),
    star: binop("*", 10),
    slash: binop("/", 10),
    starstar: new TokenType("**", {beforeExpr: true}),

    // Keyword token types.
    _break: kw("break"),
    _case: kw("case", beforeExpr),
    _catch: kw("catch"),
    _continue: kw("continue"),
    _debugger: kw("debugger"),
    _default: kw("default", beforeExpr),
    _do: kw("do", {isLoop: true, beforeExpr: true}),
    _else: kw("else", beforeExpr),
    _finally: kw("finally"),
    _for: kw("for", {isLoop: true}),
    _function: kw("function", startsExpr),
    _if: kw("if"),
    _return: kw("return", beforeExpr),
    _switch: kw("switch"),
    _throw: kw("throw", beforeExpr),
    _try: kw("try"),
    _var: kw("var"),
    _const: kw("const"),
    _while: kw("while", {isLoop: true}),
    _with: kw("with"),
    _new: kw("new", {beforeExpr: true, startsExpr: true}),
    _this: kw("this", startsExpr),
    _super: kw("super", startsExpr),
    _class: kw("class"),
    _extends: kw("extends", beforeExpr),
    _export: kw("export"),
    _import: kw("import"),
    _null: kw("null", startsExpr),
    _true: kw("true", startsExpr),
    _false: kw("false", startsExpr),
    _in: kw("in", {beforeExpr: true, binop: 7}),
    _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
    _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
    _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
    _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
  }

  // Matches a whole line break (where CRLF is considered a single
  // line break). Used to count lines.

  var lineBreak = /\r\n?|\n|\u2028|\u2029/
  var lineBreakG = new RegExp(lineBreak.source, "g")

  function isNewLine(code) {
    return code === 10 || code === 13 || code === 0x2028 || code == 0x2029
  }

  var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/

  var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g

  function isArray(obj) {
    return Object.prototype.toString.call(obj) === "[object Array]"
  }

  // Checks if an object has a property.

  function has(obj, propName) {
    return Object.prototype.hasOwnProperty.call(obj, propName)
  }

  // These are used when `options.locations` is on, for the
  // `startLoc` and `endLoc` properties.

  var Position = function Position(line, col) {
    this.line = line
    this.column = col
  };

  Position.prototype.offset = function offset (n) {
    return new Position(this.line, this.column + n)
  };

  var SourceLocation = function SourceLocation(p, start, end) {
    this.start = start
    this.end = end
    if (p.sourceFile !== null) this.source = p.sourceFile
  };

  // The `getLineInfo` function is mostly useful when the
  // `locations` option is off (for performance reasons) and you
  // want to find the line/column position for a given character
  // offset. `input` should be the code string that the offset refers
  // into.

  function getLineInfo(input, offset) {
    for (var line = 1, cur = 0;;) {
      lineBreakG.lastIndex = cur
      var match = lineBreakG.exec(input)
      if (match && match.index < offset) {
        ++line
        cur = match.index + match[0].length
      } else {
        return new Position(line, offset - cur)
      }
    }
  }

  // A second optional argument can be given to further configure
  // the parser process. These options are recognized:

  var defaultOptions = {
    // `ecmaVersion` indicates the ECMAScript version to parse. Must
    // be either 3, or 5, or 6. This influences support for strict
    // mode, the set of reserved words, support for getters and
    // setters and other features. The default is 6.
    ecmaVersion: 6,
    // Source type ("script" or "module") for different semantics
    sourceType: "script",
    // `onInsertedSemicolon` can be a callback that will be called
    // when a semicolon is automatically inserted. It will be passed
    // th position of the comma as an offset, and if `locations` is
    // enabled, it is given the location as a `{line, column}` object
    // as second argument.
    onInsertedSemicolon: null,
    // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
    // trailing commas.
    onTrailingComma: null,
    // By default, reserved words are only enforced if ecmaVersion >= 5.
    // Set `allowReserved` to a boolean value to explicitly turn this on
    // an off. When this option has the value "never", reserved words
    // and keywords can also not be used as property names.
    allowReserved: null,
    // When enabled, a return at the top level is not considered an
    // error.
    allowReturnOutsideFunction: false,
    // When enabled, import/export statements are not constrained to
    // appearing at the top of the program.
    allowImportExportEverywhere: false,
    // When enabled, hashbang directive in the beginning of file
    // is allowed and treated as a line comment.
    allowHashBang: false,
    // When `locations` is on, `loc` properties holding objects with
    // `start` and `end` properties in `{line, column}` form (with
    // line being 1-based and column 0-based) will be attached to the
    // nodes.
    locations: false,
    // A function can be passed as `onToken` option, which will
    // cause Acorn to call that function with object in the same
    // format as tokens returned from `tokenizer().getToken()`. Note
    // that you are not allowed to call the parser from the
    // callback—that will corrupt its internal state.
    onToken: null,
    // A function can be passed as `onComment` option, which will
    // cause Acorn to call that function with `(block, text, start,
    // end)` parameters whenever a comment is skipped. `block` is a
    // boolean indicating whether this is a block (`/* */`) comment,
    // `text` is the content of the comment, and `start` and `end` are
    // character offsets that denote the start and end of the comment.
    // When the `locations` option is on, two more parameters are
    // passed, the full `{line, column}` locations of the start and
    // end of the comments. Note that you are not allowed to call the
    // parser from the callback—that will corrupt its internal state.
    onComment: null,
    // Nodes have their start and end characters offsets recorded in
    // `start` and `end` properties (directly on the node, rather than
    // the `loc` object, which holds line/column data. To also add a
    // [semi-standardized][range] `range` property holding a `[start,
    // end]` array with the same numbers, set the `ranges` option to
    // `true`.
    //
    // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
    ranges: false,
    // It is possible to parse multiple files into a single AST by
    // passing the tree produced by parsing the first file as
    // `program` option in subsequent parses. This will add the
    // toplevel forms of the parsed file to the `Program` (top) node
    // of an existing parse tree.
    program: null,
    // When `locations` is on, you can pass this to record the source
    // file in every node's `loc` object.
    sourceFile: null,
    // This value, if given, is stored in every node, whether
    // `locations` is on or off.
    directSourceFile: null,
    // When enabled, parenthesized expressions are represented by
    // (non-standard) ParenthesizedExpression nodes
    preserveParens: false,
    plugins: {}
  }

  // Interpret and default an options object

  function getOptions(opts) {
    var options = {}
    for (var opt in defaultOptions)
      options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt]
    if (options.allowReserved == null)
      options.allowReserved = options.ecmaVersion < 5

    if (isArray(options.onToken)) {
      var tokens = options.onToken
      options.onToken = function (token) { return tokens.push(token); }
    }
    if (isArray(options.onComment))
      options.onComment = pushComment(options, options.onComment)

    return options
  }

  function pushComment(options, array) {
    return function (block, text, start, end, startLoc, endLoc) {
      var comment = {
        type: block ? 'Block' : 'Line',
        value: text,
        start: start,
        end: end
      }
      if (options.locations)
        comment.loc = new SourceLocation(this, startLoc, endLoc)
      if (options.ranges)
        comment.range = [start, end]
      array.push(comment)
    }
  }

  // Registered plugins
  var plugins = {}

  function keywordRegexp(words) {
    return new RegExp("^(" + words.replace(/ /g, "|") + ")$")
  }

  var Parser = function Parser(options, input, startPos) {
    this.options = options = getOptions(options)
    this.sourceFile = options.sourceFile
    this.keywords = keywordRegexp(keywords[options.ecmaVersion >= 6 ? 6 : 5])
    var reserved = options.allowReserved ? "" :
        reservedWords[options.ecmaVersion] + (options.sourceType == "module" ? " await" : "")
    this.reservedWords = keywordRegexp(reserved)
    var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict
    this.reservedWordsStrict = keywordRegexp(reservedStrict)
    this.reservedWordsStrictBind = keywordRegexp(reservedStrict + " " + reservedWords.strictBind)
    this.input = String(input)

    // Used to signal to callers of `readWord1` whether the word
    // contained any escape sequences. This is needed because words with
    // escape sequences must not be interpreted as keywords.
    this.containsEsc = false

    // Load plugins
    this.loadPlugins(options.plugins)

    // Set up token state

    // The current position of the tokenizer in the input.
    if (startPos) {
      this.pos = startPos
      this.lineStart = Math.max(0, this.input.lastIndexOf("\n", startPos))
      this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length
    } else {
      this.pos = this.lineStart = 0
      this.curLine = 1
    }

    // Properties of the current token:
    // Its type
    this.type = tt.eof
    // For tokens that include more information than their type, the value
    this.value = null
    // Its start and end offset
    this.start = this.end = this.pos
    // And, if locations are used, the {line, column} object
    // corresponding to those offsets
    this.startLoc = this.endLoc = this.curPosition()

    // Position information for the previous token
    this.lastTokEndLoc = this.lastTokStartLoc = null
    this.lastTokStart = this.lastTokEnd = this.pos

    // The context stack is used to superficially track syntactic
    // context to predict whether a regular expression is allowed in a
    // given position.
    this.context = this.initialContext()
    this.exprAllowed = true

    // Figure out if it's a module code.
    this.strict = this.inModule = options.sourceType === "module"

    // Used to signify the start of a potential arrow function
    this.potentialArrowAt = -1

    // Flags to track whether we are in a function, a generator.
    this.inFunction = this.inGenerator = false
    // Labels in scope.
    this.labels = []

    // If enabled, skip leading hashbang line.
    if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === '#!')
      this.skipLineComment(2)
  };

  // DEPRECATED Kept for backwards compatibility until 3.0 in case a plugin uses them
  Parser.prototype.isKeyword = function isKeyword (word) { return this.keywords.test(word) };
  Parser.prototype.isReservedWord = function isReservedWord (word) { return this.reservedWords.test(word) };

  Parser.prototype.extend = function extend (name, f) {
    this[name] = f(this[name])
  };

  Parser.prototype.loadPlugins = function loadPlugins (pluginConfigs) {
      var this$1 = this;

    for (var name in pluginConfigs) {
      var plugin = plugins[name]
      if (!plugin) throw new Error("Plugin '" + name + "' not found")
      plugin(this$1, pluginConfigs[name])
    }
  };

  Parser.prototype.parse = function parse () {
    var node = this.options.program || this.startNode()
    this.nextToken()
    return this.parseTopLevel(node)
  };

  var pp = Parser.prototype

  // ## Parser utilities

  // Test whether a statement node is the string literal `"use strict"`.

  pp.isUseStrict = function(stmt) {
    return this.options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" &&
      stmt.expression.type === "Literal" &&
      stmt.expression.raw.slice(1, -1) === "use strict"
  }

  // Predicate that tests whether the next token is of the given
  // type, and if yes, consumes it as a side effect.

  pp.eat = function(type) {
    if (this.type === type) {
      this.next()
      return true
    } else {
      return false
    }
  }

  // Tests whether parsed token is a contextual keyword.

  pp.isContextual = function(name) {
    return this.type === tt.name && this.value === name
  }

  // Consumes contextual keyword if possible.

  pp.eatContextual = function(name) {
    return this.value === name && this.eat(tt.name)
  }

  // Asserts that following token is given contextual keyword.

  pp.expectContextual = function(name) {
    if (!this.eatContextual(name)) this.unexpected()
  }

  // Test whether a semicolon can be inserted at the current position.

  pp.canInsertSemicolon = function() {
    return this.type === tt.eof ||
      this.type === tt.braceR ||
      lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
  }

  pp.insertSemicolon = function() {
    if (this.canInsertSemicolon()) {
      if (this.options.onInsertedSemicolon)
        this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc)
      return true
    }
  }

  // Consume a semicolon, or, failing that, see if we are allowed to
  // pretend that there is a semicolon at this position.

  pp.semicolon = function() {
    if (!this.eat(tt.semi) && !this.insertSemicolon()) this.unexpected()
  }

  pp.afterTrailingComma = function(tokType) {
    if (this.type == tokType) {
      if (this.options.onTrailingComma)
        this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc)
      this.next()
      return true
    }
  }

  // Expect a token of a given type. If found, consume it, otherwise,
  // raise an unexpected token error.

  pp.expect = function(type) {
    this.eat(type) || this.unexpected()
  }

  // Raise an unexpected token error.

  pp.unexpected = function(pos) {
    this.raise(pos != null ? pos : this.start, "Unexpected token")
  }

  var DestructuringErrors = function DestructuringErrors() {
    this.shorthandAssign = 0
    this.trailingComma = 0
  };

  pp.checkPatternErrors = function(refDestructuringErrors, andThrow) {
    var trailing = refDestructuringErrors && refDestructuringErrors.trailingComma
    if (!andThrow) return !!trailing
    if (trailing) this.raise(trailing, "Comma is not permitted after the rest element")
  }

  pp.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
    var pos = refDestructuringErrors && refDestructuringErrors.shorthandAssign
    if (!andThrow) return !!pos
    if (pos) this.raise(pos, "Shorthand property assignments are valid only in destructuring patterns")
  }

  var pp$1 = Parser.prototype

  // ### Statement parsing

  // Parse a program. Initializes the parser, reads any number of
  // statements, and wraps them in a Program node.  Optionally takes a
  // `program` argument.  If present, the statements will be appended
  // to its body instead of creating a new node.

  pp$1.parseTopLevel = function(node) {
    var this$1 = this;

    var first = true
    if (!node.body) node.body = []
    while (this.type !== tt.eof) {
      var stmt = this$1.parseStatement(true, true)
      node.body.push(stmt)
      if (first) {
        if (this$1.isUseStrict(stmt)) this$1.setStrict(true)
        first = false
      }
    }
    this.next()
    if (this.options.ecmaVersion >= 6) {
      node.sourceType = this.options.sourceType
    }
    return this.finishNode(node, "Program")
  }

  var loopLabel = {kind: "loop"};
  var switchLabel = {kind: "switch"};
  pp$1.isLet = function() {
    if (this.type !== tt.name || this.options.ecmaVersion < 6 || this.value != "let") return false
    skipWhiteSpace.lastIndex = this.pos
    var skip = skipWhiteSpace.exec(this.input)
    var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next)
    if (nextCh === 91 || nextCh == 123) return true // '{' and '['
    if (isIdentifierStart(nextCh, true)) {
      for (var pos = next + 1; isIdentifierChar(this.input.charCodeAt(pos), true); ++pos) {}
      var ident = this.input.slice(next, pos)
      if (!this.isKeyword(ident)) return true
    }
    return false
  }

  // Parse a single statement.
  //
  // If expecting a statement and finding a slash operator, parse a
  // regular expression literal. This is to handle cases like
  // `if (foo) /blah/.exec(foo)`, where looking at the previous token
  // does not help.

  pp$1.parseStatement = function(declaration, topLevel) {
    var starttype = this.type, node = this.startNode(), kind

    if (this.isLet()) {
      starttype = tt._var
      kind = "let"
    }

    // Most types of statements are recognized by the keyword they
    // start with. Many are trivial to parse, some require a bit of
    // complexity.

    switch (starttype) {
    case tt._break: case tt._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
    case tt._debugger: return this.parseDebuggerStatement(node)
    case tt._do: return this.parseDoStatement(node)
    case tt._for: return this.parseForStatement(node)
    case tt._function:
      if (!declaration && this.options.ecmaVersion >= 6) this.unexpected()
      return this.parseFunctionStatement(node)
    case tt._class:
      if (!declaration) this.unexpected()
      return this.parseClass(node, true)
    case tt._if: return this.parseIfStatement(node)
    case tt._return: return this.parseReturnStatement(node)
    case tt._switch: return this.parseSwitchStatement(node)
    case tt._throw: return this.parseThrowStatement(node)
    case tt._try: return this.parseTryStatement(node)
    case tt._const: case tt._var:
      kind = kind || this.value
      if (!declaration && kind != "var") this.unexpected()
      return this.parseVarStatement(node, kind)
    case tt._while: return this.parseWhileStatement(node)
    case tt._with: return this.parseWithStatement(node)
    case tt.braceL: return this.parseBlock()
    case tt.semi: return this.parseEmptyStatement(node)
    case tt._export:
    case tt._import:
      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel)
          this.raise(this.start, "'import' and 'export' may only appear at the top level")
        if (!this.inModule)
          this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'")
      }
      return starttype === tt._import ? this.parseImport(node) : this.parseExport(node)

      // If the statement does not start with a statement keyword or a
      // brace, it's an ExpressionStatement or LabeledStatement. We
      // simply start parsing an expression, and afterwards, if the
      // next token is a colon and the expression was a simple
      // Identifier node, we switch to interpreting it as a label.
    default:
      var maybeName = this.value, expr = this.parseExpression()
      if (starttype === tt.name && expr.type === "Identifier" && this.eat(tt.colon))
        return this.parseLabeledStatement(node, maybeName, expr)
      else return this.parseExpressionStatement(node, expr)
    }
  }

  pp$1.parseBreakContinueStatement = function(node, keyword) {
    var this$1 = this;

    var isBreak = keyword == "break"
    this.next()
    if (this.eat(tt.semi) || this.insertSemicolon()) node.label = null
    else if (this.type !== tt.name) this.unexpected()
    else {
      node.label = this.parseIdent()
      this.semicolon()
    }

    // Verify that there is an actual destination to break or
    // continue to.
    for (var i = 0; i < this.labels.length; ++i) {
      var lab = this$1.labels[i]
      if (node.label == null || lab.name === node.label.name) {
        if (lab.kind != null && (isBreak || lab.kind === "loop")) break
        if (node.label && isBreak) break
      }
    }
    if (i === this.labels.length) this.raise(node.start, "Unsyntactic " + keyword)
    return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
  }

  pp$1.parseDebuggerStatement = function(node) {
    this.next()
    this.semicolon()
    return this.finishNode(node, "DebuggerStatement")
  }

  pp$1.parseDoStatement = function(node) {
    this.next()
    this.labels.push(loopLabel)
    node.body = this.parseStatement(false)
    this.labels.pop()
    this.expect(tt._while)
    node.test = this.parseParenExpression()
    if (this.options.ecmaVersion >= 6)
      this.eat(tt.semi)
    else
      this.semicolon()
    return this.finishNode(node, "DoWhileStatement")
  }

  // Disambiguating between a `for` and a `for`/`in` or `for`/`of`
  // loop is non-trivial. Basically, we have to parse the init `var`
  // statement or expression, disallowing the `in` operator (see
  // the second parameter to `parseExpression`), and then check
  // whether the next token is `in` or `of`. When there is no init
  // part (semicolon immediately after the opening parenthesis), it
  // is a regular `for` loop.

  pp$1.parseForStatement = function(node) {
    this.next()
    this.labels.push(loopLabel)
    this.expect(tt.parenL)
    if (this.type === tt.semi) return this.parseFor(node, null)
    var isLet = this.isLet()
    if (this.type === tt._var || this.type === tt._const || isLet) {
      var init$1 = this.startNode(), kind = isLet ? "let" : this.value
      this.next()
      this.parseVar(init$1, true, kind)
      this.finishNode(init$1, "VariableDeclaration")
      if ((this.type === tt._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init$1.declarations.length === 1 &&
          !(kind !== "var" && init$1.declarations[0].init))
        return this.parseForIn(node, init$1)
      return this.parseFor(node, init$1)
    }
    var refDestructuringErrors = new DestructuringErrors
    var init = this.parseExpression(true, refDestructuringErrors)
    if (this.type === tt._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
      this.checkPatternErrors(refDestructuringErrors, true)
      this.toAssignable(init)
      this.checkLVal(init)
      return this.parseForIn(node, init)
    } else {
      this.checkExpressionErrors(refDestructuringErrors, true)
    }
    return this.parseFor(node, init)
  }

  pp$1.parseFunctionStatement = function(node) {
    this.next()
    return this.parseFunction(node, true)
  }

  pp$1.parseIfStatement = function(node) {
    this.next()
    node.test = this.parseParenExpression()
    node.consequent = this.parseStatement(false)
    node.alternate = this.eat(tt._else) ? this.parseStatement(false) : null
    return this.finishNode(node, "IfStatement")
  }

  pp$1.parseReturnStatement = function(node) {
    if (!this.inFunction && !this.options.allowReturnOutsideFunction)
      this.raise(this.start, "'return' outside of function")
    this.next()

    // In `return` (and `break`/`continue`), the keywords with
    // optional arguments, we eagerly look for a semicolon or the
    // possibility to insert one.

    if (this.eat(tt.semi) || this.insertSemicolon()) node.argument = null
    else { node.argument = this.parseExpression(); this.semicolon() }
    return this.finishNode(node, "ReturnStatement")
  }

  pp$1.parseSwitchStatement = function(node) {
    var this$1 = this;

    this.next()
    node.discriminant = this.parseParenExpression()
    node.cases = []
    this.expect(tt.braceL)
    this.labels.push(switchLabel)

    // Statements under must be grouped (by label) in SwitchCase
    // nodes. `cur` is used to keep the node that we are currently
    // adding statements to.

    for (var cur, sawDefault = false; this.type != tt.braceR;) {
      if (this$1.type === tt._case || this$1.type === tt._default) {
        var isCase = this$1.type === tt._case
        if (cur) this$1.finishNode(cur, "SwitchCase")
        node.cases.push(cur = this$1.startNode())
        cur.consequent = []
        this$1.next()
        if (isCase) {
          cur.test = this$1.parseExpression()
        } else {
          if (sawDefault) this$1.raiseRecoverable(this$1.lastTokStart, "Multiple default clauses")
          sawDefault = true
          cur.test = null
        }
        this$1.expect(tt.colon)
      } else {
        if (!cur) this$1.unexpected()
        cur.consequent.push(this$1.parseStatement(true))
      }
    }
    if (cur) this.finishNode(cur, "SwitchCase")
    this.next() // Closing brace
    this.labels.pop()
    return this.finishNode(node, "SwitchStatement")
  }

  pp$1.parseThrowStatement = function(node) {
    this.next()
    if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
      this.raise(this.lastTokEnd, "Illegal newline after throw")
    node.argument = this.parseExpression()
    this.semicolon()
    return this.finishNode(node, "ThrowStatement")
  }

  // Reused empty array added for node fields that are always empty.

  var empty = []

  pp$1.parseTryStatement = function(node) {
    this.next()
    node.block = this.parseBlock()
    node.handler = null
    if (this.type === tt._catch) {
      var clause = this.startNode()
      this.next()
      this.expect(tt.parenL)
      clause.param = this.parseBindingAtom()
      this.checkLVal(clause.param, true)
      this.expect(tt.parenR)
      clause.body = this.parseBlock()
      node.handler = this.finishNode(clause, "CatchClause")
    }
    node.finalizer = this.eat(tt._finally) ? this.parseBlock() : null
    if (!node.handler && !node.finalizer)
      this.raise(node.start, "Missing catch or finally clause")
    return this.finishNode(node, "TryStatement")
  }

  pp$1.parseVarStatement = function(node, kind) {
    this.next()
    this.parseVar(node, false, kind)
    this.semicolon()
    return this.finishNode(node, "VariableDeclaration")
  }

  pp$1.parseWhileStatement = function(node) {
    this.next()
    node.test = this.parseParenExpression()
    this.labels.push(loopLabel)
    node.body = this.parseStatement(false)
    this.labels.pop()
    return this.finishNode(node, "WhileStatement")
  }

  pp$1.parseWithStatement = function(node) {
    if (this.strict) this.raise(this.start, "'with' in strict mode")
    this.next()
    node.object = this.parseParenExpression()
    node.body = this.parseStatement(false)
    return this.finishNode(node, "WithStatement")
  }

  pp$1.parseEmptyStatement = function(node) {
    this.next()
    return this.finishNode(node, "EmptyStatement")
  }

  pp$1.parseLabeledStatement = function(node, maybeName, expr) {
    var this$1 = this;

    for (var i = 0; i < this.labels.length; ++i)
      if (this$1.labels[i].name === maybeName) this$1.raise(expr.start, "Label '" + maybeName + "' is already declared")
    var kind = this.type.isLoop ? "loop" : this.type === tt._switch ? "switch" : null
    for (var i$1 = this.labels.length - 1; i$1 >= 0; i$1--) {
      var label = this$1.labels[i$1]
      if (label.statementStart == node.start) {
        label.statementStart = this$1.start
        label.kind = kind
      } else break
    }
    this.labels.push({name: maybeName, kind: kind, statementStart: this.start})
    node.body = this.parseStatement(true)
    this.labels.pop()
    node.label = expr
    return this.finishNode(node, "LabeledStatement")
  }

  pp$1.parseExpressionStatement = function(node, expr) {
    node.expression = expr
    this.semicolon()
    return this.finishNode(node, "ExpressionStatement")
  }

  // Parse a semicolon-enclosed block of statements, handling `"use
  // strict"` declarations when `allowStrict` is true (used for
  // function bodies).

  pp$1.parseBlock = function(allowStrict) {
    var this$1 = this;

    var node = this.startNode(), first = true, oldStrict
    node.body = []
    this.expect(tt.braceL)
    while (!this.eat(tt.braceR)) {
      var stmt = this$1.parseStatement(true)
      node.body.push(stmt)
      if (first && allowStrict && this$1.isUseStrict(stmt)) {
        oldStrict = this$1.strict
        this$1.setStrict(this$1.strict = true)
      }
      first = false
    }
    if (oldStrict === false) this.setStrict(false)
    return this.finishNode(node, "BlockStatement")
  }

  // Parse a regular `for` loop. The disambiguation code in
  // `parseStatement` will already have parsed the init statement or
  // expression.

  pp$1.parseFor = function(node, init) {
    node.init = init
    this.expect(tt.semi)
    node.test = this.type === tt.semi ? null : this.parseExpression()
    this.expect(tt.semi)
    node.update = this.type === tt.parenR ? null : this.parseExpression()
    this.expect(tt.parenR)
    node.body = this.parseStatement(false)
    this.labels.pop()
    return this.finishNode(node, "ForStatement")
  }

  // Parse a `for`/`in` and `for`/`of` loop, which are almost
  // same from parser's perspective.

  pp$1.parseForIn = function(node, init) {
    var type = this.type === tt._in ? "ForInStatement" : "ForOfStatement"
    this.next()
    node.left = init
    node.right = this.parseExpression()
    this.expect(tt.parenR)
    node.body = this.parseStatement(false)
    this.labels.pop()
    return this.finishNode(node, type)
  }

  // Parse a list of variable declarations.

  pp$1.parseVar = function(node, isFor, kind) {
    var this$1 = this;

    node.declarations = []
    node.kind = kind
    for (;;) {
      var decl = this$1.startNode()
      this$1.parseVarId(decl)
      if (this$1.eat(tt.eq)) {
        decl.init = this$1.parseMaybeAssign(isFor)
      } else if (kind === "const" && !(this$1.type === tt._in || (this$1.options.ecmaVersion >= 6 && this$1.isContextual("of")))) {
        this$1.unexpected()
      } else if (decl.id.type != "Identifier" && !(isFor && (this$1.type === tt._in || this$1.isContextual("of")))) {
        this$1.raise(this$1.lastTokEnd, "Complex binding patterns require an initialization value")
      } else {
        decl.init = null
      }
      node.declarations.push(this$1.finishNode(decl, "VariableDeclarator"))
      if (!this$1.eat(tt.comma)) break
    }
    return node
  }

  pp$1.parseVarId = function(decl) {
    decl.id = this.parseBindingAtom()
    this.checkLVal(decl.id, true)
  }

  // Parse a function declaration or literal (depending on the
  // `isStatement` parameter).

  pp$1.parseFunction = function(node, isStatement, allowExpressionBody) {
    this.initFunction(node)
    if (this.options.ecmaVersion >= 6)
      node.generator = this.eat(tt.star)
    var oldInGen = this.inGenerator
    this.inGenerator = node.generator
    if (isStatement || this.type === tt.name)
      node.id = this.parseIdent()
    this.parseFunctionParams(node)
    this.parseFunctionBody(node, allowExpressionBody)
    this.inGenerator = oldInGen
    return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression")
  }

  pp$1.parseFunctionParams = function(node) {
    this.expect(tt.parenL)
    node.params = this.parseBindingList(tt.parenR, false, false, true)
  }

  // Parse a class declaration or literal (depending on the
  // `isStatement` parameter).

  pp$1.parseClass = function(node, isStatement) {
    var this$1 = this;

    this.next()
    this.parseClassId(node, isStatement)
    this.parseClassSuper(node)
    var classBody = this.startNode()
    var hadConstructor = false
    classBody.body = []
    this.expect(tt.braceL)
    while (!this.eat(tt.braceR)) {
      if (this$1.eat(tt.semi)) continue
      var method = this$1.startNode()
      var isGenerator = this$1.eat(tt.star)
      var isMaybeStatic = this$1.type === tt.name && this$1.value === "static"
      this$1.parsePropertyName(method)
      method.static = isMaybeStatic && this$1.type !== tt.parenL
      if (method.static) {
        if (isGenerator) this$1.unexpected()
        isGenerator = this$1.eat(tt.star)
        this$1.parsePropertyName(method)
      }
      method.kind = "method"
      var isGetSet = false
      if (!method.computed) {
        var key = method.key;
        if (!isGenerator && key.type === "Identifier" && this$1.type !== tt.parenL && (key.name === "get" || key.name === "set")) {
          isGetSet = true
          method.kind = key.name
          key = this$1.parsePropertyName(method)
        }
        if (!method.static && (key.type === "Identifier" && key.name === "constructor" ||
            key.type === "Literal" && key.value === "constructor")) {
          if (hadConstructor) this$1.raise(key.start, "Duplicate constructor in the same class")
          if (isGetSet) this$1.raise(key.start, "Constructor can't have get/set modifier")
          if (isGenerator) this$1.raise(key.start, "Constructor can't be a generator")
          method.kind = "constructor"
          hadConstructor = true
        }
      }
      this$1.parseClassMethod(classBody, method, isGenerator)
      if (isGetSet) {
        var paramCount = method.kind === "get" ? 0 : 1
        if (method.value.params.length !== paramCount) {
          var start = method.value.start
          if (method.kind === "get")
            this$1.raiseRecoverable(start, "getter should have no params")
          else
            this$1.raiseRecoverable(start, "setter should have exactly one param")
        }
        if (method.kind === "set" && method.value.params[0].type === "RestElement")
          this$1.raise(method.value.params[0].start, "Setter cannot use rest params")
      }
    }
    node.body = this.finishNode(classBody, "ClassBody")
    return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
  }

  pp$1.parseClassMethod = function(classBody, method, isGenerator) {
    method.value = this.parseMethod(isGenerator)
    classBody.body.push(this.finishNode(method, "MethodDefinition"))
  }

  pp$1.parseClassId = function(node, isStatement) {
    node.id = this.type === tt.name ? this.parseIdent() : isStatement ? this.unexpected() : null
  }

  pp$1.parseClassSuper = function(node) {
    node.superClass = this.eat(tt._extends) ? this.parseExprSubscripts() : null
  }

  // Parses module export declaration.

  pp$1.parseExport = function(node) {
    var this$1 = this;

    this.next()
    // export * from '...'
    if (this.eat(tt.star)) {
      this.expectContextual("from")
      node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
      this.semicolon()
      return this.finishNode(node, "ExportAllDeclaration")
    }
    if (this.eat(tt._default)) { // export default ...
      var parens = this.type == tt.parenL
      var expr = this.parseMaybeAssign()
      var needsSemi = true
      if (!parens && (expr.type == "FunctionExpression" ||
                      expr.type == "ClassExpression")) {
        needsSemi = false
        if (expr.id) {
          expr.type = expr.type == "FunctionExpression"
            ? "FunctionDeclaration"
            : "ClassDeclaration"
        }
      }
      node.declaration = expr
      if (needsSemi) this.semicolon()
      return this.finishNode(node, "ExportDefaultDeclaration")
    }
    // export var|const|let|function|class ...
    if (this.shouldParseExportStatement()) {
      node.declaration = this.parseStatement(true)
      node.specifiers = []
      node.source = null
    } else { // export { x, y as z } [from '...']
      node.declaration = null
      node.specifiers = this.parseExportSpecifiers()
      if (this.eatContextual("from")) {
        node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
      } else {
        // check for keywords used as local names
        for (var i = 0; i < node.specifiers.length; i++) {
          if (this$1.keywords.test(node.specifiers[i].local.name) || this$1.reservedWords.test(node.specifiers[i].local.name)) {
            this$1.unexpected(node.specifiers[i].local.start)
          }
        }

        node.source = null
      }
      this.semicolon()
    }
    return this.finishNode(node, "ExportNamedDeclaration")
  }

  pp$1.shouldParseExportStatement = function() {
    return this.type.keyword || this.isLet()
  }

  // Parses a comma-separated list of module exports.

  pp$1.parseExportSpecifiers = function() {
    var this$1 = this;

    var nodes = [], first = true
    // export { x, y as z } [from '...']
    this.expect(tt.braceL)
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this$1.expect(tt.comma)
        if (this$1.afterTrailingComma(tt.braceR)) break
      } else first = false

      var node = this$1.startNode()
      node.local = this$1.parseIdent(this$1.type === tt._default)
      node.exported = this$1.eatContextual("as") ? this$1.parseIdent(true) : node.local
      nodes.push(this$1.finishNode(node, "ExportSpecifier"))
    }
    return nodes
  }

  // Parses import declaration.

  pp$1.parseImport = function(node) {
    this.next()
    // import '...'
    if (this.type === tt.string) {
      node.specifiers = empty
      node.source = this.parseExprAtom()
    } else {
      node.specifiers = this.parseImportSpecifiers()
      this.expectContextual("from")
      node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
    }
    this.semicolon()
    return this.finishNode(node, "ImportDeclaration")
  }

  // Parses a comma-separated list of module imports.

  pp$1.parseImportSpecifiers = function() {
    var this$1 = this;

    var nodes = [], first = true
    if (this.type === tt.name) {
      // import defaultObj, { x, y as z } from '...'
      var node = this.startNode()
      node.local = this.parseIdent()
      this.checkLVal(node.local, true)
      nodes.push(this.finishNode(node, "ImportDefaultSpecifier"))
      if (!this.eat(tt.comma)) return nodes
    }
    if (this.type === tt.star) {
      var node$1 = this.startNode()
      this.next()
      this.expectContextual("as")
      node$1.local = this.parseIdent()
      this.checkLVal(node$1.local, true)
      nodes.push(this.finishNode(node$1, "ImportNamespaceSpecifier"))
      return nodes
    }
    this.expect(tt.braceL)
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this$1.expect(tt.comma)
        if (this$1.afterTrailingComma(tt.braceR)) break
      } else first = false

      var node$2 = this$1.startNode()
      node$2.imported = this$1.parseIdent(true)
      if (this$1.eatContextual("as")) {
        node$2.local = this$1.parseIdent()
      } else {
        node$2.local = node$2.imported
        if (this$1.isKeyword(node$2.local.name)) this$1.unexpected(node$2.local.start)
        if (this$1.reservedWordsStrict.test(node$2.local.name)) this$1.raise(node$2.local.start, "The keyword '" + node$2.local.name + "' is reserved")
      }
      this$1.checkLVal(node$2.local, true)
      nodes.push(this$1.finishNode(node$2, "ImportSpecifier"))
    }
    return nodes
  }

  var pp$2 = Parser.prototype

  // Convert existing expression atom to assignable pattern
  // if possible.

  pp$2.toAssignable = function(node, isBinding) {
    var this$1 = this;

    if (this.options.ecmaVersion >= 6 && node) {
      switch (node.type) {
      case "Identifier":
      case "ObjectPattern":
      case "ArrayPattern":
        break

      case "ObjectExpression":
        node.type = "ObjectPattern"
        for (var i = 0; i < node.properties.length; i++) {
          var prop = node.properties[i]
          if (prop.kind !== "init") this$1.raise(prop.key.start, "Object pattern can't contain getter or setter")
          this$1.toAssignable(prop.value, isBinding)
        }
        break

      case "ArrayExpression":
        node.type = "ArrayPattern"
        this.toAssignableList(node.elements, isBinding)
        break

      case "AssignmentExpression":
        if (node.operator === "=") {
          node.type = "AssignmentPattern"
          delete node.operator
          // falls through to AssignmentPattern
        } else {
          this.raise(node.left.end, "Only '=' operator can be used for specifying default value.")
          break
        }

      case "AssignmentPattern":
        if (node.right.type === "YieldExpression")
          this.raise(node.right.start, "Yield expression cannot be a default value")
        break

      case "ParenthesizedExpression":
        node.expression = this.toAssignable(node.expression, isBinding)
        break

      case "MemberExpression":
        if (!isBinding) break

      default:
        this.raise(node.start, "Assigning to rvalue")
      }
    }
    return node
  }

  // Convert list of expression atoms to binding list.

  pp$2.toAssignableList = function(exprList, isBinding) {
    var this$1 = this;

    var end = exprList.length
    if (end) {
      var last = exprList[end - 1]
      if (last && last.type == "RestElement") {
        --end
      } else if (last && last.type == "SpreadElement") {
        last.type = "RestElement"
        var arg = last.argument
        this.toAssignable(arg, isBinding)
        if (arg.type !== "Identifier" && arg.type !== "MemberExpression" && arg.type !== "ArrayPattern")
          this.unexpected(arg.start)
        --end
      }

      if (isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
        this.unexpected(last.argument.start)
    }
    for (var i = 0; i < end; i++) {
      var elt = exprList[i]
      if (elt) this$1.toAssignable(elt, isBinding)
    }
    return exprList
  }

  // Parses spread element.

  pp$2.parseSpread = function(refDestructuringErrors) {
    var node = this.startNode()
    this.next()
    node.argument = this.parseMaybeAssign(false, refDestructuringErrors)
    return this.finishNode(node, "SpreadElement")
  }

  pp$2.parseRest = function(allowNonIdent) {
    var node = this.startNode()
    this.next()

    // RestElement inside of a function parameter must be an identifier
    if (allowNonIdent) node.argument = this.type === tt.name ? this.parseIdent() : this.unexpected()
    else node.argument = this.type === tt.name || this.type === tt.bracketL ? this.parseBindingAtom() : this.unexpected()

    return this.finishNode(node, "RestElement")
  }

  // Parses lvalue (assignable) atom.

  pp$2.parseBindingAtom = function() {
    if (this.options.ecmaVersion < 6) return this.parseIdent()
    switch (this.type) {
    case tt.name:
      return this.parseIdent()

    case tt.bracketL:
      var node = this.startNode()
      this.next()
      node.elements = this.parseBindingList(tt.bracketR, true, true)
      return this.finishNode(node, "ArrayPattern")

    case tt.braceL:
      return this.parseObj(true)

    default:
      this.unexpected()
    }
  }

  pp$2.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowNonIdent) {
    var this$1 = this;

    var elts = [], first = true
    while (!this.eat(close)) {
      if (first) first = false
      else this$1.expect(tt.comma)
      if (allowEmpty && this$1.type === tt.comma) {
        elts.push(null)
      } else if (allowTrailingComma && this$1.afterTrailingComma(close)) {
        break
      } else if (this$1.type === tt.ellipsis) {
        var rest = this$1.parseRest(allowNonIdent)
        this$1.parseBindingListItem(rest)
        elts.push(rest)
        if (this$1.type === tt.comma) this$1.raise(this$1.start, "Comma is not permitted after the rest element")
        this$1.expect(close)
        break
      } else {
        var elem = this$1.parseMaybeDefault(this$1.start, this$1.startLoc)
        this$1.parseBindingListItem(elem)
        elts.push(elem)
      }
    }
    return elts
  }

  pp$2.parseBindingListItem = function(param) {
    return param
  }

  // Parses assignment pattern around given atom if possible.

  pp$2.parseMaybeDefault = function(startPos, startLoc, left) {
    left = left || this.parseBindingAtom()
    if (this.options.ecmaVersion < 6 || !this.eat(tt.eq)) return left
    var node = this.startNodeAt(startPos, startLoc)
    node.left = left
    node.right = this.parseMaybeAssign()
    return this.finishNode(node, "AssignmentPattern")
  }

  // Verify that a node is an lval — something that can be assigned
  // to.

  pp$2.checkLVal = function(expr, isBinding, checkClashes) {
    var this$1 = this;

    switch (expr.type) {
    case "Identifier":
      if (this.strict && this.reservedWordsStrictBind.test(expr.name))
        this.raiseRecoverable(expr.start, (isBinding ? "Binding " : "Assigning to ") + expr.name + " in strict mode")
      if (checkClashes) {
        if (has(checkClashes, expr.name))
          this.raiseRecoverable(expr.start, "Argument name clash")
        checkClashes[expr.name] = true
      }
      break

    case "MemberExpression":
      if (isBinding) this.raiseRecoverable(expr.start, (isBinding ? "Binding" : "Assigning to") + " member expression")
      break

    case "ObjectPattern":
      for (var i = 0; i < expr.properties.length; i++)
        this$1.checkLVal(expr.properties[i].value, isBinding, checkClashes)
      break

    case "ArrayPattern":
      for (var i$1 = 0; i$1 < expr.elements.length; i$1++) {
        var elem = expr.elements[i$1]
        if (elem) this$1.checkLVal(elem, isBinding, checkClashes)
      }
      break

    case "AssignmentPattern":
      this.checkLVal(expr.left, isBinding, checkClashes)
      break

    case "RestElement":
      this.checkLVal(expr.argument, isBinding, checkClashes)
      break

    case "ParenthesizedExpression":
      this.checkLVal(expr.expression, isBinding, checkClashes)
      break

    default:
      this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " rvalue")
    }
  }

  var pp$3 = Parser.prototype

  // Check if property name clashes with already added.
  // Object/class getters and setters are not allowed to clash —
  // either with each other or with an init property — and in
  // strict mode, init properties are also not allowed to be repeated.

  pp$3.checkPropClash = function(prop, propHash) {
    if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
      return
    var key = prop.key;
    var name
    switch (key.type) {
    case "Identifier": name = key.name; break
    case "Literal": name = String(key.value); break
    default: return
    }
    var kind = prop.kind;
    if (this.options.ecmaVersion >= 6) {
      if (name === "__proto__" && kind === "init") {
        if (propHash.proto) this.raiseRecoverable(key.start, "Redefinition of __proto__ property")
        propHash.proto = true
      }
      return
    }
    name = "$" + name
    var other = propHash[name]
    if (other) {
      var isGetSet = kind !== "init"
      if ((this.strict || isGetSet) && other[kind] || !(isGetSet ^ other.init))
        this.raiseRecoverable(key.start, "Redefinition of property")
    } else {
      other = propHash[name] = {
        init: false,
        get: false,
        set: false
      }
    }
    other[kind] = true
  }

  // ### Expression parsing

  // These nest, from the most general expression type at the top to
  // 'atomic', nondivisible expression types at the bottom. Most of
  // the functions will simply let the function(s) below them parse,
  // and, *if* the syntactic construct they handle is present, wrap
  // the AST node that the inner parser gave them in another node.

  // Parse a full expression. The optional arguments are used to
  // forbid the `in` operator (in for loops initalization expressions)
  // and provide reference for storing '=' operator inside shorthand
  // property assignment in contexts where both object expression
  // and object pattern might appear (so it's possible to raise
  // delayed syntax error at correct position).

  pp$3.parseExpression = function(noIn, refDestructuringErrors) {
    var this$1 = this;

    var startPos = this.start, startLoc = this.startLoc
    var expr = this.parseMaybeAssign(noIn, refDestructuringErrors)
    if (this.type === tt.comma) {
      var node = this.startNodeAt(startPos, startLoc)
      node.expressions = [expr]
      while (this.eat(tt.comma)) node.expressions.push(this$1.parseMaybeAssign(noIn, refDestructuringErrors))
      return this.finishNode(node, "SequenceExpression")
    }
    return expr
  }

  // Parse an assignment expression. This includes applications of
  // operators like `+=`.

  pp$3.parseMaybeAssign = function(noIn, refDestructuringErrors, afterLeftParse) {
    if (this.inGenerator && this.isContextual("yield")) return this.parseYield()

    var ownDestructuringErrors = false
    if (!refDestructuringErrors) {
      refDestructuringErrors = new DestructuringErrors
      ownDestructuringErrors = true
    }
    var startPos = this.start, startLoc = this.startLoc
    if (this.type == tt.parenL || this.type == tt.name)
      this.potentialArrowAt = this.start
    var left = this.parseMaybeConditional(noIn, refDestructuringErrors)
    if (afterLeftParse) left = afterLeftParse.call(this, left, startPos, startLoc)
    if (this.type.isAssign) {
      this.checkPatternErrors(refDestructuringErrors, true)
      if (!ownDestructuringErrors) DestructuringErrors.call(refDestructuringErrors)
      var node = this.startNodeAt(startPos, startLoc)
      node.operator = this.value
      node.left = this.type === tt.eq ? this.toAssignable(left) : left
      refDestructuringErrors.shorthandAssign = 0 // reset because shorthand default was used correctly
      this.checkLVal(left)
      this.next()
      node.right = this.parseMaybeAssign(noIn)
      return this.finishNode(node, "AssignmentExpression")
    } else {
      if (ownDestructuringErrors) this.checkExpressionErrors(refDestructuringErrors, true)
    }
    return left
  }

  // Parse a ternary conditional (`?:`) operator.

  pp$3.parseMaybeConditional = function(noIn, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc
    var expr = this.parseExprOps(noIn, refDestructuringErrors)
    if (this.checkExpressionErrors(refDestructuringErrors)) return expr
    if (this.eat(tt.question)) {
      var node = this.startNodeAt(startPos, startLoc)
      node.test = expr
      node.consequent = this.parseMaybeAssign()
      this.expect(tt.colon)
      node.alternate = this.parseMaybeAssign(noIn)
      return this.finishNode(node, "ConditionalExpression")
    }
    return expr
  }

  // Start the precedence parser.

  pp$3.parseExprOps = function(noIn, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc
    var expr = this.parseMaybeUnary(refDestructuringErrors, false)
    if (this.checkExpressionErrors(refDestructuringErrors)) return expr
    return this.parseExprOp(expr, startPos, startLoc, -1, noIn)
  }

  // Parse binary operators with the operator precedence parsing
  // algorithm. `left` is the left-hand side of the operator.
  // `minPrec` provides context that allows the function to stop and
  // defer further parser to one of its callers when it encounters an
  // operator that has a lower precedence than the set it is parsing.

  pp$3.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, noIn) {
    var prec = this.type.binop
    if (prec != null && (!noIn || this.type !== tt._in)) {
      if (prec > minPrec) {
        var logical = this.type === tt.logicalOR || this.type === tt.logicalAND
        var op = this.value
        this.next()
        var startPos = this.start, startLoc = this.startLoc
        var right = this.parseExprOp(this.parseMaybeUnary(null, false), startPos, startLoc, prec, noIn)
        var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical)
        return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn)
      }
    }
    return left
  }

  pp$3.buildBinary = function(startPos, startLoc, left, right, op, logical) {
    var node = this.startNodeAt(startPos, startLoc)
    node.left = left
    node.operator = op
    node.right = right
    return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
  }

  // Parse unary operators, both prefix and postfix.

  pp$3.parseMaybeUnary = function(refDestructuringErrors, sawUnary) {
    var this$1 = this;

    var startPos = this.start, startLoc = this.startLoc, expr
    if (this.type.prefix) {
      var node = this.startNode(), update = this.type === tt.incDec
      node.operator = this.value
      node.prefix = true
      this.next()
      node.argument = this.parseMaybeUnary(null, true)
      this.checkExpressionErrors(refDestructuringErrors, true)
      if (update) this.checkLVal(node.argument)
      else if (this.strict && node.operator === "delete" &&
               node.argument.type === "Identifier")
        this.raiseRecoverable(node.start, "Deleting local variable in strict mode")
      else sawUnary = true
      expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression")
    } else {
      expr = this.parseExprSubscripts(refDestructuringErrors)
      if (this.checkExpressionErrors(refDestructuringErrors)) return expr
      while (this.type.postfix && !this.canInsertSemicolon()) {
        var node$1 = this$1.startNodeAt(startPos, startLoc)
        node$1.operator = this$1.value
        node$1.prefix = false
        node$1.argument = expr
        this$1.checkLVal(expr)
        this$1.next()
        expr = this$1.finishNode(node$1, "UpdateExpression")
      }
    }

    if (!sawUnary && this.eat(tt.starstar))
      return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false), "**", false)
    else
      return expr
  }

  // Parse call, dot, and `[]`-subscript expressions.

  pp$3.parseExprSubscripts = function(refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc
    var expr = this.parseExprAtom(refDestructuringErrors)
    var skipArrowSubscripts = expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")"
    if (this.checkExpressionErrors(refDestructuringErrors) || skipArrowSubscripts) return expr
    return this.parseSubscripts(expr, startPos, startLoc)
  }

  pp$3.parseSubscripts = function(base, startPos, startLoc, noCalls) {
    var this$1 = this;

    for (;;) {
      if (this$1.eat(tt.dot)) {
        var node = this$1.startNodeAt(startPos, startLoc)
        node.object = base
        node.property = this$1.parseIdent(true)
        node.computed = false
        base = this$1.finishNode(node, "MemberExpression")
      } else if (this$1.eat(tt.bracketL)) {
        var node$1 = this$1.startNodeAt(startPos, startLoc)
        node$1.object = base
        node$1.property = this$1.parseExpression()
        node$1.computed = true
        this$1.expect(tt.bracketR)
        base = this$1.finishNode(node$1, "MemberExpression")
      } else if (!noCalls && this$1.eat(tt.parenL)) {
        var node$2 = this$1.startNodeAt(startPos, startLoc)
        node$2.callee = base
        node$2.arguments = this$1.parseExprList(tt.parenR, false)
        base = this$1.finishNode(node$2, "CallExpression")
      } else if (this$1.type === tt.backQuote) {
        var node$3 = this$1.startNodeAt(startPos, startLoc)
        node$3.tag = base
        node$3.quasi = this$1.parseTemplate()
        base = this$1.finishNode(node$3, "TaggedTemplateExpression")
      } else {
        return base
      }
    }
  }

  // Parse an atomic expression — either a single token that is an
  // expression, an expression started by a keyword like `function` or
  // `new`, or an expression wrapped in punctuation like `()`, `[]`,
  // or `{}`.

  pp$3.parseExprAtom = function(refDestructuringErrors) {
    var node, canBeArrow = this.potentialArrowAt == this.start
    switch (this.type) {
    case tt._super:
      if (!this.inFunction)
        this.raise(this.start, "'super' outside of function or class")

    case tt._this:
      var type = this.type === tt._this ? "ThisExpression" : "Super"
      node = this.startNode()
      this.next()
      return this.finishNode(node, type)

    case tt.name:
      var startPos = this.start, startLoc = this.startLoc
      var id = this.parseIdent(this.type !== tt.name)
      if (canBeArrow && !this.canInsertSemicolon() && this.eat(tt.arrow))
        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id])
      return id

    case tt.regexp:
      var value = this.value
      node = this.parseLiteral(value.value)
      node.regex = {pattern: value.pattern, flags: value.flags}
      return node

    case tt.num: case tt.string:
      return this.parseLiteral(this.value)

    case tt._null: case tt._true: case tt._false:
      node = this.startNode()
      node.value = this.type === tt._null ? null : this.type === tt._true
      node.raw = this.type.keyword
      this.next()
      return this.finishNode(node, "Literal")

    case tt.parenL:
      return this.parseParenAndDistinguishExpression(canBeArrow)

    case tt.bracketL:
      node = this.startNode()
      this.next()
      node.elements = this.parseExprList(tt.bracketR, true, true, refDestructuringErrors)
      return this.finishNode(node, "ArrayExpression")

    case tt.braceL:
      return this.parseObj(false, refDestructuringErrors)

    case tt._function:
      node = this.startNode()
      this.next()
      return this.parseFunction(node, false)

    case tt._class:
      return this.parseClass(this.startNode(), false)

    case tt._new:
      return this.parseNew()

    case tt.backQuote:
      return this.parseTemplate()

    default:
      this.unexpected()
    }
  }

  pp$3.parseLiteral = function(value) {
    var node = this.startNode()
    node.value = value
    node.raw = this.input.slice(this.start, this.end)
    this.next()
    return this.finishNode(node, "Literal")
  }

  pp$3.parseParenExpression = function() {
    this.expect(tt.parenL)
    var val = this.parseExpression()
    this.expect(tt.parenR)
    return val
  }

  pp$3.parseParenAndDistinguishExpression = function(canBeArrow) {
    var this$1 = this;

    var startPos = this.start, startLoc = this.startLoc, val
    if (this.options.ecmaVersion >= 6) {
      this.next()

      var innerStartPos = this.start, innerStartLoc = this.startLoc
      var exprList = [], first = true
      var refDestructuringErrors = new DestructuringErrors, spreadStart, innerParenStart
      while (this.type !== tt.parenR) {
        first ? first = false : this$1.expect(tt.comma)
        if (this$1.type === tt.ellipsis) {
          spreadStart = this$1.start
          exprList.push(this$1.parseParenItem(this$1.parseRest()))
          break
        } else {
          if (this$1.type === tt.parenL && !innerParenStart) {
            innerParenStart = this$1.start
          }
          exprList.push(this$1.parseMaybeAssign(false, refDestructuringErrors, this$1.parseParenItem))
        }
      }
      var innerEndPos = this.start, innerEndLoc = this.startLoc
      this.expect(tt.parenR)

      if (canBeArrow && !this.canInsertSemicolon() && this.eat(tt.arrow)) {
        this.checkPatternErrors(refDestructuringErrors, true)
        if (innerParenStart) this.unexpected(innerParenStart)
        return this.parseParenArrowList(startPos, startLoc, exprList)
      }

      if (!exprList.length) this.unexpected(this.lastTokStart)
      if (spreadStart) this.unexpected(spreadStart)
      this.checkExpressionErrors(refDestructuringErrors, true)

      if (exprList.length > 1) {
        val = this.startNodeAt(innerStartPos, innerStartLoc)
        val.expressions = exprList
        this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc)
      } else {
        val = exprList[0]
      }
    } else {
      val = this.parseParenExpression()
    }

    if (this.options.preserveParens) {
      var par = this.startNodeAt(startPos, startLoc)
      par.expression = val
      return this.finishNode(par, "ParenthesizedExpression")
    } else {
      return val
    }
  }

  pp$3.parseParenItem = function(item) {
    return item
  }

  pp$3.parseParenArrowList = function(startPos, startLoc, exprList) {
    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList)
  }

  // New's precedence is slightly tricky. It must allow its argument to
  // be a `[]` or dot subscript expression, but not a call — at least,
  // not without wrapping it in parentheses. Thus, it uses the noCalls
  // argument to parseSubscripts to prevent it from consuming the
  // argument list.

  var empty$1 = []

  pp$3.parseNew = function() {
    var node = this.startNode()
    var meta = this.parseIdent(true)
    if (this.options.ecmaVersion >= 6 && this.eat(tt.dot)) {
      node.meta = meta
      node.property = this.parseIdent(true)
      if (node.property.name !== "target")
        this.raiseRecoverable(node.property.start, "The only valid meta property for new is new.target")
      if (!this.inFunction)
        this.raiseRecoverable(node.start, "new.target can only be used in functions")
      return this.finishNode(node, "MetaProperty")
    }
    var startPos = this.start, startLoc = this.startLoc
    node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true)
    if (this.eat(tt.parenL)) node.arguments = this.parseExprList(tt.parenR, false)
    else node.arguments = empty$1
    return this.finishNode(node, "NewExpression")
  }

  // Parse template expression.

  pp$3.parseTemplateElement = function() {
    var elem = this.startNode()
    elem.value = {
      raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, '\n'),
      cooked: this.value
    }
    this.next()
    elem.tail = this.type === tt.backQuote
    return this.finishNode(elem, "TemplateElement")
  }

  pp$3.parseTemplate = function() {
    var this$1 = this;

    var node = this.startNode()
    this.next()
    node.expressions = []
    var curElt = this.parseTemplateElement()
    node.quasis = [curElt]
    while (!curElt.tail) {
      this$1.expect(tt.dollarBraceL)
      node.expressions.push(this$1.parseExpression())
      this$1.expect(tt.braceR)
      node.quasis.push(curElt = this$1.parseTemplateElement())
    }
    this.next()
    return this.finishNode(node, "TemplateLiteral")
  }

  // Parse an object literal or binding pattern.

  pp$3.parseObj = function(isPattern, refDestructuringErrors) {
    var this$1 = this;

    var node = this.startNode(), first = true, propHash = {}
    node.properties = []
    this.next()
    while (!this.eat(tt.braceR)) {
      if (!first) {
        this$1.expect(tt.comma)
        if (this$1.afterTrailingComma(tt.braceR)) break
      } else first = false

      var prop = this$1.startNode(), isGenerator, startPos, startLoc
      if (this$1.options.ecmaVersion >= 6) {
        prop.method = false
        prop.shorthand = false
        if (isPattern || refDestructuringErrors) {
          startPos = this$1.start
          startLoc = this$1.startLoc
        }
        if (!isPattern)
          isGenerator = this$1.eat(tt.star)
      }
      this$1.parsePropertyName(prop)
      this$1.parsePropertyValue(prop, isPattern, isGenerator, startPos, startLoc, refDestructuringErrors)
      this$1.checkPropClash(prop, propHash)
      node.properties.push(this$1.finishNode(prop, "Property"))
    }
    return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
  }

  pp$3.parsePropertyValue = function(prop, isPattern, isGenerator, startPos, startLoc, refDestructuringErrors) {
    if (this.eat(tt.colon)) {
      prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors)
      prop.kind = "init"
    } else if (this.options.ecmaVersion >= 6 && this.type === tt.parenL) {
      if (isPattern) this.unexpected()
      prop.kind = "init"
      prop.method = true
      prop.value = this.parseMethod(isGenerator)
    } else if (this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
               (prop.key.name === "get" || prop.key.name === "set") &&
               (this.type != tt.comma && this.type != tt.braceR)) {
      if (isGenerator || isPattern) this.unexpected()
      prop.kind = prop.key.name
      this.parsePropertyName(prop)
      prop.value = this.parseMethod(false)
      var paramCount = prop.kind === "get" ? 0 : 1
      if (prop.value.params.length !== paramCount) {
        var start = prop.value.start
        if (prop.kind === "get")
          this.raiseRecoverable(start, "getter should have no params")
        else
          this.raiseRecoverable(start, "setter should have exactly one param")
      }
      if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
        this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params")
    } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
      if (this.keywords.test(prop.key.name) ||
          (this.strict ? this.reservedWordsStrictBind : this.reservedWords).test(prop.key.name) ||
          (this.inGenerator && prop.key.name == "yield"))
        this.raiseRecoverable(prop.key.start, "'" + prop.key.name + "' can not be used as shorthand property")
      prop.kind = "init"
      if (isPattern) {
        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key)
      } else if (this.type === tt.eq && refDestructuringErrors) {
        if (!refDestructuringErrors.shorthandAssign)
          refDestructuringErrors.shorthandAssign = this.start
        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key)
      } else {
        prop.value = prop.key
      }
      prop.shorthand = true
    } else this.unexpected()
  }

  pp$3.parsePropertyName = function(prop) {
    if (this.options.ecmaVersion >= 6) {
      if (this.eat(tt.bracketL)) {
        prop.computed = true
        prop.key = this.parseMaybeAssign()
        this.expect(tt.bracketR)
        return prop.key
      } else {
        prop.computed = false
      }
    }
    return prop.key = this.type === tt.num || this.type === tt.string ? this.parseExprAtom() : this.parseIdent(true)
  }

  // Initialize empty function node.

  pp$3.initFunction = function(node) {
    node.id = null
    if (this.options.ecmaVersion >= 6) {
      node.generator = false
      node.expression = false
    }
  }

  // Parse object or class method.

  pp$3.parseMethod = function(isGenerator) {
    var node = this.startNode(), oldInGen = this.inGenerator
    this.inGenerator = isGenerator
    this.initFunction(node)
    this.expect(tt.parenL)
    node.params = this.parseBindingList(tt.parenR, false, false)
    if (this.options.ecmaVersion >= 6)
      node.generator = isGenerator
    this.parseFunctionBody(node, false)
    this.inGenerator = oldInGen
    return this.finishNode(node, "FunctionExpression")
  }

  // Parse arrow function expression with given parameters.

  pp$3.parseArrowExpression = function(node, params) {
    var oldInGen = this.inGenerator
    this.inGenerator = false
    this.initFunction(node)
    node.params = this.toAssignableList(params, true)
    this.parseFunctionBody(node, true)
    this.inGenerator = oldInGen
    return this.finishNode(node, "ArrowFunctionExpression")
  }

  // Parse function body and check parameters.

  pp$3.parseFunctionBody = function(node, isArrowFunction) {
    var isExpression = isArrowFunction && this.type !== tt.braceL

    if (isExpression) {
      node.body = this.parseMaybeAssign()
      node.expression = true
    } else {
      // Start a new scope with regard to labels and the `inFunction`
      // flag (restore them to their old value afterwards).
      var oldInFunc = this.inFunction, oldLabels = this.labels
      this.inFunction = true; this.labels = []
      node.body = this.parseBlock(true)
      node.expression = false
      this.inFunction = oldInFunc; this.labels = oldLabels
    }

    // If this is a strict mode function, verify that argument names
    // are not repeated, and it does not try to bind the words `eval`
    // or `arguments`.
    var useStrict = (!isExpression && node.body.body.length && this.isUseStrict(node.body.body[0])) ? node.body.body[0] : null;
    if (this.strict || useStrict) {
      var oldStrict = this.strict
      this.strict = true
      if (node.id)
        this.checkLVal(node.id, true)
      this.checkParams(node, useStrict)
      this.strict = oldStrict
    } else if (isArrowFunction) {
      this.checkParams(node, useStrict)
    }
  }

  // Checks function params for various disallowed patterns such as using "eval"
  // or "arguments" and duplicate parameters.

  pp$3.checkParams = function(node, useStrict) {
      var this$1 = this;

      var nameHash = {}
      for (var i = 0; i < node.params.length; i++) {
        if (useStrict && this$1.options.ecmaVersion >= 7 && node.params[i].type !== "Identifier")
          this$1.raiseRecoverable(useStrict.start, "Illegal 'use strict' directive in function with non-simple parameter list");
        this$1.checkLVal(node.params[i], true, nameHash)
      }
  }

  // Parses a comma-separated list of expressions, and returns them as
  // an array. `close` is the token type that ends the list, and
  // `allowEmpty` can be turned on to allow subsequent commas with
  // nothing in between them to be parsed as `null` (which is needed
  // for array literals).

  pp$3.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
    var this$1 = this;

    var elts = [], first = true
    while (!this.eat(close)) {
      if (!first) {
        this$1.expect(tt.comma)
        if (allowTrailingComma && this$1.afterTrailingComma(close)) break
      } else first = false

      var elt
      if (allowEmpty && this$1.type === tt.comma)
        elt = null
      else if (this$1.type === tt.ellipsis) {
        elt = this$1.parseSpread(refDestructuringErrors)
        if (this$1.type === tt.comma && refDestructuringErrors && !refDestructuringErrors.trailingComma) {
          refDestructuringErrors.trailingComma = this$1.lastTokStart
        }
      } else
        elt = this$1.parseMaybeAssign(false, refDestructuringErrors)
      elts.push(elt)
    }
    return elts
  }

  // Parse the next token as an identifier. If `liberal` is true (used
  // when parsing properties), it will also convert keywords into
  // identifiers.

  pp$3.parseIdent = function(liberal) {
    var node = this.startNode()
    if (liberal && this.options.allowReserved == "never") liberal = false
    if (this.type === tt.name) {
      if (!liberal && (this.strict ? this.reservedWordsStrict : this.reservedWords).test(this.value) &&
          (this.options.ecmaVersion >= 6 ||
           this.input.slice(this.start, this.end).indexOf("\\") == -1))
        this.raiseRecoverable(this.start, "The keyword '" + this.value + "' is reserved")
      if (!liberal && this.inGenerator && this.value === "yield")
        this.raiseRecoverable(this.start, "Can not use 'yield' as identifier inside a generator")
      node.name = this.value
    } else if (liberal && this.type.keyword) {
      node.name = this.type.keyword
    } else {
      this.unexpected()
    }
    this.next()
    return this.finishNode(node, "Identifier")
  }

  // Parses yield expression inside generator.

  pp$3.parseYield = function() {
    var node = this.startNode()
    this.next()
    if (this.type == tt.semi || this.canInsertSemicolon() || (this.type != tt.star && !this.type.startsExpr)) {
      node.delegate = false
      node.argument = null
    } else {
      node.delegate = this.eat(tt.star)
      node.argument = this.parseMaybeAssign()
    }
    return this.finishNode(node, "YieldExpression")
  }

  var pp$4 = Parser.prototype

  // This function is used to raise exceptions on parse errors. It
  // takes an offset integer (into the current `input`) to indicate
  // the location of the error, attaches the position to the end
  // of the error message, and then raises a `SyntaxError` with that
  // message.

  pp$4.raise = function(pos, message) {
    var loc = getLineInfo(this.input, pos)
    message += " (" + loc.line + ":" + loc.column + ")"
    var err = new SyntaxError(message)
    err.pos = pos; err.loc = loc; err.raisedAt = this.pos
    throw err
  }

  pp$4.raiseRecoverable = pp$4.raise

  pp$4.curPosition = function() {
    if (this.options.locations) {
      return new Position(this.curLine, this.pos - this.lineStart)
    }
  }

  var Node = function Node(parser, pos, loc) {
    this.type = ""
    this.start = pos
    this.end = 0
    if (parser.options.locations)
      this.loc = new SourceLocation(parser, loc)
    if (parser.options.directSourceFile)
      this.sourceFile = parser.options.directSourceFile
    if (parser.options.ranges)
      this.range = [pos, 0]
  };

  // Start an AST node, attaching a start offset.

  var pp$5 = Parser.prototype

  pp$5.startNode = function() {
    return new Node(this, this.start, this.startLoc)
  }

  pp$5.startNodeAt = function(pos, loc) {
    return new Node(this, pos, loc)
  }

  // Finish an AST node, adding `type` and `end` properties.

  function finishNodeAt(node, type, pos, loc) {
    node.type = type
    node.end = pos
    if (this.options.locations)
      node.loc.end = loc
    if (this.options.ranges)
      node.range[1] = pos
    return node
  }

  pp$5.finishNode = function(node, type) {
    return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
  }

  // Finish node at given position

  pp$5.finishNodeAt = function(node, type, pos, loc) {
    return finishNodeAt.call(this, node, type, pos, loc)
  }

  var TokContext = function TokContext(token, isExpr, preserveSpace, override) {
    this.token = token
    this.isExpr = !!isExpr
    this.preserveSpace = !!preserveSpace
    this.override = override
  };

  var types = {
    b_stat: new TokContext("{", false),
    b_expr: new TokContext("{", true),
    b_tmpl: new TokContext("${", true),
    p_stat: new TokContext("(", false),
    p_expr: new TokContext("(", true),
    q_tmpl: new TokContext("`", true, true, function (p) { return p.readTmplToken(); }),
    f_expr: new TokContext("function", true)
  }

  var pp$6 = Parser.prototype

  pp$6.initialContext = function() {
    return [types.b_stat]
  }

  pp$6.braceIsBlock = function(prevType) {
    if (prevType === tt.colon) {
      var parent = this.curContext()
      if (parent === types.b_stat || parent === types.b_expr)
        return !parent.isExpr
    }
    if (prevType === tt._return)
      return lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
    if (prevType === tt._else || prevType === tt.semi || prevType === tt.eof || prevType === tt.parenR)
      return true
    if (prevType == tt.braceL)
      return this.curContext() === types.b_stat
    return !this.exprAllowed
  }

  pp$6.updateContext = function(prevType) {
    var update, type = this.type
    if (type.keyword && prevType == tt.dot)
      this.exprAllowed = false
    else if (update = type.updateContext)
      update.call(this, prevType)
    else
      this.exprAllowed = type.beforeExpr
  }

  // Token-specific context update code

  tt.parenR.updateContext = tt.braceR.updateContext = function() {
    if (this.context.length == 1) {
      this.exprAllowed = true
      return
    }
    var out = this.context.pop()
    if (out === types.b_stat && this.curContext() === types.f_expr) {
      this.context.pop()
      this.exprAllowed = false
    } else if (out === types.b_tmpl) {
      this.exprAllowed = true
    } else {
      this.exprAllowed = !out.isExpr
    }
  }

  tt.braceL.updateContext = function(prevType) {
    this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr)
    this.exprAllowed = true
  }

  tt.dollarBraceL.updateContext = function() {
    this.context.push(types.b_tmpl)
    this.exprAllowed = true
  }

  tt.parenL.updateContext = function(prevType) {
    var statementParens = prevType === tt._if || prevType === tt._for || prevType === tt._with || prevType === tt._while
    this.context.push(statementParens ? types.p_stat : types.p_expr)
    this.exprAllowed = true
  }

  tt.incDec.updateContext = function() {
    // tokExprAllowed stays unchanged
  }

  tt._function.updateContext = function(prevType) {
    if (prevType.beforeExpr && prevType !== tt.semi && prevType !== tt._else &&
        !((prevType === tt.colon || prevType === tt.braceL) && this.curContext() === types.b_stat))
      this.context.push(types.f_expr)
    this.exprAllowed = false
  }

  tt.backQuote.updateContext = function() {
    if (this.curContext() === types.q_tmpl)
      this.context.pop()
    else
      this.context.push(types.q_tmpl)
    this.exprAllowed = false
  }

  // Object type used to represent tokens. Note that normally, tokens
  // simply exist as properties on the parser object. This is only
  // used for the onToken callback and the external tokenizer.

  var Token = function Token(p) {
    this.type = p.type
    this.value = p.value
    this.start = p.start
    this.end = p.end
    if (p.options.locations)
      this.loc = new SourceLocation(p, p.startLoc, p.endLoc)
    if (p.options.ranges)
      this.range = [p.start, p.end]
  };

  // ## Tokenizer

  var pp$7 = Parser.prototype

  // Are we running under Rhino?
  var isRhino = typeof Packages == "object" && Object.prototype.toString.call(Packages) == "[object JavaPackage]"

  // Move to the next token

  pp$7.next = function() {
    if (this.options.onToken)
      this.options.onToken(new Token(this))

    this.lastTokEnd = this.end
    this.lastTokStart = this.start
    this.lastTokEndLoc = this.endLoc
    this.lastTokStartLoc = this.startLoc
    this.nextToken()
  }

  pp$7.getToken = function() {
    this.next()
    return new Token(this)
  }

  // If we're in an ES6 environment, make parsers iterable
  if (typeof Symbol !== "undefined")
    pp$7[Symbol.iterator] = function () {
      var self = this
      return {next: function () {
        var token = self.getToken()
        return {
          done: token.type === tt.eof,
          value: token
        }
      }}
    }

  // Toggle strict mode. Re-reads the next number or string to please
  // pedantic tests (`"use strict"; 010;` should fail).

  pp$7.setStrict = function(strict) {
    var this$1 = this;

    this.strict = strict
    if (this.type !== tt.num && this.type !== tt.string) return
    this.pos = this.start
    if (this.options.locations) {
      while (this.pos < this.lineStart) {
        this$1.lineStart = this$1.input.lastIndexOf("\n", this$1.lineStart - 2) + 1
        --this$1.curLine
      }
    }
    this.nextToken()
  }

  pp$7.curContext = function() {
    return this.context[this.context.length - 1]
  }

  // Read a single token, updating the parser object's token-related
  // properties.

  pp$7.nextToken = function() {
    var curContext = this.curContext()
    if (!curContext || !curContext.preserveSpace) this.skipSpace()

    this.start = this.pos
    if (this.options.locations) this.startLoc = this.curPosition()
    if (this.pos >= this.input.length) return this.finishToken(tt.eof)

    if (curContext.override) return curContext.override(this)
    else this.readToken(this.fullCharCodeAtPos())
  }

  pp$7.readToken = function(code) {
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
      return this.readWord()

    return this.getTokenFromCode(code)
  }

  pp$7.fullCharCodeAtPos = function() {
    var code = this.input.charCodeAt(this.pos)
    if (code <= 0xd7ff || code >= 0xe000) return code
    var next = this.input.charCodeAt(this.pos + 1)
    return (code << 10) + next - 0x35fdc00
  }

  pp$7.skipBlockComment = function() {
    var this$1 = this;

    var startLoc = this.options.onComment && this.curPosition()
    var start = this.pos, end = this.input.indexOf("*/", this.pos += 2)
    if (end === -1) this.raise(this.pos - 2, "Unterminated comment")
    this.pos = end + 2
    if (this.options.locations) {
      lineBreakG.lastIndex = start
      var match
      while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
        ++this$1.curLine
        this$1.lineStart = match.index + match[0].length
      }
    }
    if (this.options.onComment)
      this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                             startLoc, this.curPosition())
  }

  pp$7.skipLineComment = function(startSkip) {
    var this$1 = this;

    var start = this.pos
    var startLoc = this.options.onComment && this.curPosition()
    var ch = this.input.charCodeAt(this.pos+=startSkip)
    while (this.pos < this.input.length && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
      ++this$1.pos
      ch = this$1.input.charCodeAt(this$1.pos)
    }
    if (this.options.onComment)
      this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                             startLoc, this.curPosition())
  }

  // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.

  pp$7.skipSpace = function() {
    var this$1 = this;

    loop: while (this.pos < this.input.length) {
      var ch = this$1.input.charCodeAt(this$1.pos)
      switch (ch) {
        case 32: case 160: // ' '
          ++this$1.pos
          break
        case 13:
          if (this$1.input.charCodeAt(this$1.pos + 1) === 10) {
            ++this$1.pos
          }
        case 10: case 8232: case 8233:
          ++this$1.pos
          if (this$1.options.locations) {
            ++this$1.curLine
            this$1.lineStart = this$1.pos
          }
          break
        case 47: // '/'
          switch (this$1.input.charCodeAt(this$1.pos + 1)) {
            case 42: // '*'
              this$1.skipBlockComment()
              break
            case 47:
              this$1.skipLineComment(2)
              break
            default:
              break loop
          }
          break
        default:
          if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
            ++this$1.pos
          } else {
            break loop
          }
      }
    }
  }

  // Called at the end of every token. Sets `end`, `val`, and
  // maintains `context` and `exprAllowed`, and skips the space after
  // the token, so that the next one's `start` will point at the
  // right position.

  pp$7.finishToken = function(type, val) {
    this.end = this.pos
    if (this.options.locations) this.endLoc = this.curPosition()
    var prevType = this.type
    this.type = type
    this.value = val

    this.updateContext(prevType)
  }

  // ### Token reading

  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //
  pp$7.readToken_dot = function() {
    var next = this.input.charCodeAt(this.pos + 1)
    if (next >= 48 && next <= 57) return this.readNumber(true)
    var next2 = this.input.charCodeAt(this.pos + 2)
    if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
      this.pos += 3
      return this.finishToken(tt.ellipsis)
    } else {
      ++this.pos
      return this.finishToken(tt.dot)
    }
  }

  pp$7.readToken_slash = function() { // '/'
    var next = this.input.charCodeAt(this.pos + 1)
    if (this.exprAllowed) {++this.pos; return this.readRegexp()}
    if (next === 61) return this.finishOp(tt.assign, 2)
    return this.finishOp(tt.slash, 1)
  }

  pp$7.readToken_mult_modulo_exp = function(code) { // '%*'
    var next = this.input.charCodeAt(this.pos + 1)
    var size = 1
    var tokentype = code === 42 ? tt.star : tt.modulo

    // exponentiation operator ** and **=
    if (this.options.ecmaVersion >= 7 && next === 42) {
      ++size
      tokentype = tt.starstar
      next = this.input.charCodeAt(this.pos + 2)
    }

    if (next === 61) return this.finishOp(tt.assign, size + 1)
    return this.finishOp(tokentype, size)
  }

  pp$7.readToken_pipe_amp = function(code) { // '|&'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === code) return this.finishOp(code === 124 ? tt.logicalOR : tt.logicalAND, 2)
    if (next === 61) return this.finishOp(tt.assign, 2)
    return this.finishOp(code === 124 ? tt.bitwiseOR : tt.bitwiseAND, 1)
  }

  pp$7.readToken_caret = function() { // '^'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === 61) return this.finishOp(tt.assign, 2)
    return this.finishOp(tt.bitwiseXOR, 1)
  }

  pp$7.readToken_plus_min = function(code) { // '+-'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === code) {
      if (next == 45 && this.input.charCodeAt(this.pos + 2) == 62 &&
          lineBreak.test(this.input.slice(this.lastTokEnd, this.pos))) {
        // A `-->` line comment
        this.skipLineComment(3)
        this.skipSpace()
        return this.nextToken()
      }
      return this.finishOp(tt.incDec, 2)
    }
    if (next === 61) return this.finishOp(tt.assign, 2)
    return this.finishOp(tt.plusMin, 1)
  }

  pp$7.readToken_lt_gt = function(code) { // '<>'
    var next = this.input.charCodeAt(this.pos + 1)
    var size = 1
    if (next === code) {
      size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2
      if (this.input.charCodeAt(this.pos + size) === 61) return this.finishOp(tt.assign, size + 1)
      return this.finishOp(tt.bitShift, size)
    }
    if (next == 33 && code == 60 && this.input.charCodeAt(this.pos + 2) == 45 &&
        this.input.charCodeAt(this.pos + 3) == 45) {
      if (this.inModule) this.unexpected()
      // `<!--`, an XML-style comment that should be interpreted as a line comment
      this.skipLineComment(4)
      this.skipSpace()
      return this.nextToken()
    }
    if (next === 61) size = 2
    return this.finishOp(tt.relational, size)
  }

  pp$7.readToken_eq_excl = function(code) { // '=!'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === 61) return this.finishOp(tt.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2)
    if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
      this.pos += 2
      return this.finishToken(tt.arrow)
    }
    return this.finishOp(code === 61 ? tt.eq : tt.prefix, 1)
  }

  pp$7.getTokenFromCode = function(code) {
    switch (code) {
      // The interpretation of a dot depends on whether it is followed
      // by a digit or another two dots.
    case 46: // '.'
      return this.readToken_dot()

      // Punctuation tokens.
    case 40: ++this.pos; return this.finishToken(tt.parenL)
    case 41: ++this.pos; return this.finishToken(tt.parenR)
    case 59: ++this.pos; return this.finishToken(tt.semi)
    case 44: ++this.pos; return this.finishToken(tt.comma)
    case 91: ++this.pos; return this.finishToken(tt.bracketL)
    case 93: ++this.pos; return this.finishToken(tt.bracketR)
    case 123: ++this.pos; return this.finishToken(tt.braceL)
    case 125: ++this.pos; return this.finishToken(tt.braceR)
    case 58: ++this.pos; return this.finishToken(tt.colon)
    case 63: ++this.pos; return this.finishToken(tt.question)

    case 96: // '`'
      if (this.options.ecmaVersion < 6) break
      ++this.pos
      return this.finishToken(tt.backQuote)

    case 48: // '0'
      var next = this.input.charCodeAt(this.pos + 1)
      if (next === 120 || next === 88) return this.readRadixNumber(16) // '0x', '0X' - hex number
      if (this.options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) return this.readRadixNumber(8) // '0o', '0O' - octal number
        if (next === 98 || next === 66) return this.readRadixNumber(2) // '0b', '0B' - binary number
      }
      // Anything else beginning with a digit is an integer, octal
      // number, or float.
    case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
      return this.readNumber(false)

      // Quotes produce strings.
    case 34: case 39: // '"', "'"
      return this.readString(code)

      // Operators are parsed inline in tiny state machines. '=' (61) is
      // often referred to. `finishOp` simply skips the amount of
      // characters it is given as second argument, and returns a token
      // of the type given by its first argument.

    case 47: // '/'
      return this.readToken_slash()

    case 37: case 42: // '%*'
      return this.readToken_mult_modulo_exp(code)

    case 124: case 38: // '|&'
      return this.readToken_pipe_amp(code)

    case 94: // '^'
      return this.readToken_caret()

    case 43: case 45: // '+-'
      return this.readToken_plus_min(code)

    case 60: case 62: // '<>'
      return this.readToken_lt_gt(code)

    case 61: case 33: // '=!'
      return this.readToken_eq_excl(code)

    case 126: // '~'
      return this.finishOp(tt.prefix, 1)
    }

    this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'")
  }

  pp$7.finishOp = function(type, size) {
    var str = this.input.slice(this.pos, this.pos + size)
    this.pos += size
    return this.finishToken(type, str)
  }

  // Parse a regular expression. Some context-awareness is necessary,
  // since a '/' inside a '[]' set does not end the expression.

  function tryCreateRegexp(src, flags, throwErrorAt, parser) {
    try {
      return new RegExp(src, flags)
    } catch (e) {
      if (throwErrorAt !== undefined) {
        if (e instanceof SyntaxError) parser.raise(throwErrorAt, "Error parsing regular expression: " + e.message)
        throw e
      }
    }
  }

  var regexpUnicodeSupport = !!tryCreateRegexp("\uffff", "u")

  pp$7.readRegexp = function() {
    var this$1 = this;

    var escaped, inClass, start = this.pos
    for (;;) {
      if (this$1.pos >= this$1.input.length) this$1.raise(start, "Unterminated regular expression")
      var ch = this$1.input.charAt(this$1.pos)
      if (lineBreak.test(ch)) this$1.raise(start, "Unterminated regular expression")
      if (!escaped) {
        if (ch === "[") inClass = true
        else if (ch === "]" && inClass) inClass = false
        else if (ch === "/" && !inClass) break
        escaped = ch === "\\"
      } else escaped = false
      ++this$1.pos
    }
    var content = this.input.slice(start, this.pos)
    ++this.pos
    // Need to use `readWord1` because '\uXXXX' sequences are allowed
    // here (don't ask).
    var mods = this.readWord1()
    var tmp = content, tmpFlags = ""
    if (mods) {
      var validFlags = /^[gim]*$/
      if (this.options.ecmaVersion >= 6) validFlags = /^[gimuy]*$/
      if (!validFlags.test(mods)) this.raise(start, "Invalid regular expression flag")
      if (mods.indexOf("u") >= 0) {
        if (regexpUnicodeSupport) {
          tmpFlags = "u"
        } else {
          // Replace each astral symbol and every Unicode escape sequence that
          // possibly represents an astral symbol or a paired surrogate with a
          // single ASCII symbol to avoid throwing on regular expressions that
          // are only valid in combination with the `/u` flag.
          // Note: replacing with the ASCII symbol `x` might cause false
          // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
          // perfectly valid pattern that is equivalent to `[a-b]`, but it would
          // be replaced by `[x-b]` which throws an error.
          tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}/g, function (_match, code, offset) {
            code = Number("0x" + code)
            if (code > 0x10FFFF) this$1.raise(start + offset + 3, "Code point out of bounds")
            return "x"
          })
          tmp = tmp.replace(/\\u([a-fA-F0-9]{4})|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x")
          tmpFlags = tmpFlags.replace("u", "")
        }
      }
    }
    // Detect invalid regular expressions.
    var value = null
    // Rhino's regular expression parser is flaky and throws uncatchable exceptions,
    // so don't do detection if we are running under Rhino
    if (!isRhino) {
      tryCreateRegexp(tmp, tmpFlags, start, this)
      // Get a regular expression object for this pattern-flag pair, or `null` in
      // case the current environment doesn't support the flags it uses.
      value = tryCreateRegexp(content, mods)
    }
    return this.finishToken(tt.regexp, {pattern: content, flags: mods, value: value})
  }

  // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.

  pp$7.readInt = function(radix, len) {
    var this$1 = this;

    var start = this.pos, total = 0
    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      var code = this$1.input.charCodeAt(this$1.pos), val
      if (code >= 97) val = code - 97 + 10 // a
      else if (code >= 65) val = code - 65 + 10 // A
      else if (code >= 48 && code <= 57) val = code - 48 // 0-9
      else val = Infinity
      if (val >= radix) break
      ++this$1.pos
      total = total * radix + val
    }
    if (this.pos === start || len != null && this.pos - start !== len) return null

    return total
  }

  pp$7.readRadixNumber = function(radix) {
    this.pos += 2 // 0x
    var val = this.readInt(radix)
    if (val == null) this.raise(this.start + 2, "Expected number in radix " + radix)
    if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number")
    return this.finishToken(tt.num, val)
  }

  // Read an integer, octal integer, or floating-point number.

  pp$7.readNumber = function(startsWithDot) {
    var start = this.pos, isFloat = false, octal = this.input.charCodeAt(this.pos) === 48
    if (!startsWithDot && this.readInt(10) === null) this.raise(start, "Invalid number")
    var next = this.input.charCodeAt(this.pos)
    if (next === 46) { // '.'
      ++this.pos
      this.readInt(10)
      isFloat = true
      next = this.input.charCodeAt(this.pos)
    }
    if (next === 69 || next === 101) { // 'eE'
      next = this.input.charCodeAt(++this.pos)
      if (next === 43 || next === 45) ++this.pos // '+-'
      if (this.readInt(10) === null) this.raise(start, "Invalid number")
      isFloat = true
    }
    if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number")

    var str = this.input.slice(start, this.pos), val
    if (isFloat) val = parseFloat(str)
    else if (!octal || str.length === 1) val = parseInt(str, 10)
    else if (/[89]/.test(str) || this.strict) this.raise(start, "Invalid number")
    else val = parseInt(str, 8)
    return this.finishToken(tt.num, val)
  }

  // Read a string value, interpreting backslash-escapes.

  pp$7.readCodePoint = function() {
    var ch = this.input.charCodeAt(this.pos), code

    if (ch === 123) {
      if (this.options.ecmaVersion < 6) this.unexpected()
      var codePos = ++this.pos
      code = this.readHexChar(this.input.indexOf('}', this.pos) - this.pos)
      ++this.pos
      if (code > 0x10FFFF) this.raise(codePos, "Code point out of bounds")
    } else {
      code = this.readHexChar(4)
    }
    return code
  }

  function codePointToString(code) {
    // UTF-16 Decoding
    if (code <= 0xFFFF) return String.fromCharCode(code)
    code -= 0x10000
    return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
  }

  pp$7.readString = function(quote) {
    var this$1 = this;

    var out = "", chunkStart = ++this.pos
    for (;;) {
      if (this$1.pos >= this$1.input.length) this$1.raise(this$1.start, "Unterminated string constant")
      var ch = this$1.input.charCodeAt(this$1.pos)
      if (ch === quote) break
      if (ch === 92) { // '\'
        out += this$1.input.slice(chunkStart, this$1.pos)
        out += this$1.readEscapedChar(false)
        chunkStart = this$1.pos
      } else {
        if (isNewLine(ch)) this$1.raise(this$1.start, "Unterminated string constant")
        ++this$1.pos
      }
    }
    out += this.input.slice(chunkStart, this.pos++)
    return this.finishToken(tt.string, out)
  }

  // Reads template string tokens.

  pp$7.readTmplToken = function() {
    var this$1 = this;

    var out = "", chunkStart = this.pos
    for (;;) {
      if (this$1.pos >= this$1.input.length) this$1.raise(this$1.start, "Unterminated template")
      var ch = this$1.input.charCodeAt(this$1.pos)
      if (ch === 96 || ch === 36 && this$1.input.charCodeAt(this$1.pos + 1) === 123) { // '`', '${'
        if (this$1.pos === this$1.start && this$1.type === tt.template) {
          if (ch === 36) {
            this$1.pos += 2
            return this$1.finishToken(tt.dollarBraceL)
          } else {
            ++this$1.pos
            return this$1.finishToken(tt.backQuote)
          }
        }
        out += this$1.input.slice(chunkStart, this$1.pos)
        return this$1.finishToken(tt.template, out)
      }
      if (ch === 92) { // '\'
        out += this$1.input.slice(chunkStart, this$1.pos)
        out += this$1.readEscapedChar(true)
        chunkStart = this$1.pos
      } else if (isNewLine(ch)) {
        out += this$1.input.slice(chunkStart, this$1.pos)
        ++this$1.pos
        switch (ch) {
          case 13:
            if (this$1.input.charCodeAt(this$1.pos) === 10) ++this$1.pos
          case 10:
            out += "\n"
            break
          default:
            out += String.fromCharCode(ch)
            break
        }
        if (this$1.options.locations) {
          ++this$1.curLine
          this$1.lineStart = this$1.pos
        }
        chunkStart = this$1.pos
      } else {
        ++this$1.pos
      }
    }
  }

  // Used to read escaped characters

  pp$7.readEscapedChar = function(inTemplate) {
    var ch = this.input.charCodeAt(++this.pos)
    ++this.pos
    switch (ch) {
    case 110: return "\n" // 'n' -> '\n'
    case 114: return "\r" // 'r' -> '\r'
    case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
    case 117: return codePointToString(this.readCodePoint()) // 'u'
    case 116: return "\t" // 't' -> '\t'
    case 98: return "\b" // 'b' -> '\b'
    case 118: return "\u000b" // 'v' -> '\u000b'
    case 102: return "\f" // 'f' -> '\f'
    case 13: if (this.input.charCodeAt(this.pos) === 10) ++this.pos // '\r\n'
    case 10: // ' \n'
      if (this.options.locations) { this.lineStart = this.pos; ++this.curLine }
      return ""
    default:
      if (ch >= 48 && ch <= 55) {
        var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0]
        var octal = parseInt(octalStr, 8)
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1)
          octal = parseInt(octalStr, 8)
        }
        if (octalStr !== "0" && (this.strict || inTemplate)) {
          this.raise(this.pos - 2, "Octal literal in strict mode")
        }
        this.pos += octalStr.length - 1
        return String.fromCharCode(octal)
      }
      return String.fromCharCode(ch)
    }
  }

  // Used to read character escape sequences ('\x', '\u', '\U').

  pp$7.readHexChar = function(len) {
    var codePos = this.pos
    var n = this.readInt(16, len)
    if (n === null) this.raise(codePos, "Bad character escape sequence")
    return n
  }

  // Read an identifier, and return it as a string. Sets `this.containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Incrementally adds only escaped chars, adding other chunks as-is
  // as a micro-optimization.

  pp$7.readWord1 = function() {
    var this$1 = this;

    this.containsEsc = false
    var word = "", first = true, chunkStart = this.pos
    var astral = this.options.ecmaVersion >= 6
    while (this.pos < this.input.length) {
      var ch = this$1.fullCharCodeAtPos()
      if (isIdentifierChar(ch, astral)) {
        this$1.pos += ch <= 0xffff ? 1 : 2
      } else if (ch === 92) { // "\"
        this$1.containsEsc = true
        word += this$1.input.slice(chunkStart, this$1.pos)
        var escStart = this$1.pos
        if (this$1.input.charCodeAt(++this$1.pos) != 117) // "u"
          this$1.raise(this$1.pos, "Expecting Unicode escape sequence \\uXXXX")
        ++this$1.pos
        var esc = this$1.readCodePoint()
        if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
          this$1.raise(escStart, "Invalid Unicode escape")
        word += codePointToString(esc)
        chunkStart = this$1.pos
      } else {
        break
      }
      first = false
    }
    return word + this.input.slice(chunkStart, this.pos)
  }

  // Read an identifier or keyword token. Will check for reserved
  // words when necessary.

  pp$7.readWord = function() {
    var word = this.readWord1()
    var type = tt.name
    if ((this.options.ecmaVersion >= 6 || !this.containsEsc) && this.keywords.test(word))
      type = keywordTypes[word]
    return this.finishToken(type, word)
  }

  var version = "3.3.0"

  // The main exported interface (under `self.acorn` when in the
  // browser) is a `parse` function that takes a code string and
  // returns an abstract syntax tree as specified by [Mozilla parser
  // API][api].
  //
  // [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

  function parse(input, options) {
    return new Parser(options, input).parse()
  }

  // This function tries to parse a single expression at a given
  // offset in a string. Useful for parsing mixed-language formats
  // that embed JavaScript expressions.

  function parseExpressionAt(input, pos, options) {
    var p = new Parser(options, input, pos)
    p.nextToken()
    return p.parseExpression()
  }

  // Acorn is organized as a tokenizer and a recursive-descent parser.
  // The `tokenizer` export provides an interface to the tokenizer.

  function tokenizer(input, options) {
    return new Parser(options, input)
  }

  exports.version = version;
  exports.parse = parse;
  exports.parseExpressionAt = parseExpressionAt;
  exports.tokenizer = tokenizer;
  exports.Parser = Parser;
  exports.plugins = plugins;
  exports.defaultOptions = defaultOptions;
  exports.Position = Position;
  exports.SourceLocation = SourceLocation;
  exports.getLineInfo = getLineInfo;
  exports.Node = Node;
  exports.TokenType = TokenType;
  exports.tokTypes = tt;
  exports.TokContext = TokContext;
  exports.tokContexts = types;
  exports.isIdentifierChar = isIdentifierChar;
  exports.isIdentifierStart = isIdentifierStart;
  exports.Token = Token;
  exports.isNewLine = isNewLine;
  exports.lineBreak = lineBreak;
  exports.lineBreakG = lineBreakG;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{}],42:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.acorn = global.acorn || {}, global.acorn.walk = global.acorn.walk || {})));
}(this, function (exports) { 'use strict';

  // AST walker module for Mozilla Parser API compatible trees

  // A simple walk is one where you simply specify callbacks to be
  // called on specific nodes. The last two arguments are optional. A
  // simple use would be
  //
  //     walk.simple(myTree, {
  //         Expression: function(node) { ... }
  //     });
  //
  // to do something with all expressions. All Parser API node types
  // can be used to identify node types, as well as Expression,
  // Statement, and ScopeBody, which denote categories of nodes.
  //
  // The base argument can be used to pass a custom (recursive)
  // walker, and state can be used to give this walked an initial
  // state.

  function simple(node, visitors, base, state, override) {
    if (!base) base = exports.base
    ;(function c(node, st, override) {
      var type = override || node.type, found = visitors[type]
      base[type](node, st, c)
      if (found) found(node, st)
    })(node, state, override)
  }

  // An ancestor walk keeps an array of ancestor nodes (including the
  // current node) and passes them to the callback as third parameter
  // (and also as state parameter when no other state is present).
  function ancestor(node, visitors, base, state) {
    if (!base) base = exports.base
    var ancestors = []
    ;(function c(node, st, override) {
      var type = override || node.type, found = visitors[type]
      var isNew = node != ancestors[ancestors.length - 1]
      if (isNew) ancestors.push(node)
      base[type](node, st, c)
      if (found) found(node, st || ancestors, ancestors)
      if (isNew) ancestors.pop()
    })(node, state)
  }

  // A recursive walk is one where your functions override the default
  // walkers. They can modify and replace the state parameter that's
  // threaded through the walk, and can opt how and whether to walk
  // their child nodes (by calling their third argument on these
  // nodes).
  function recursive(node, state, funcs, base, override) {
    var visitor = funcs ? exports.make(funcs, base) : base
    ;(function c(node, st, override) {
      visitor[override || node.type](node, st, c)
    })(node, state, override)
  }

  function makeTest(test) {
    if (typeof test == "string")
      return function (type) { return type == test; }
    else if (!test)
      return function () { return true; }
    else
      return test
  }

  var Found = function Found(node, state) { this.node = node; this.state = state };

  // Find a node with a given start, end, and type (all are optional,
  // null can be used as wildcard). Returns a {node, state} object, or
  // undefined when it doesn't find a matching node.
  function findNodeAt(node, start, end, test, base, state) {
    test = makeTest(test)
    if (!base) base = exports.base
    try {
      ;(function c(node, st, override) {
        var type = override || node.type
        if ((start == null || node.start <= start) &&
            (end == null || node.end >= end))
          base[type](node, st, c)
        if ((start == null || node.start == start) &&
            (end == null || node.end == end) &&
            test(type, node))
          throw new Found(node, st)
      })(node, state)
    } catch (e) {
      if (e instanceof Found) return e
      throw e
    }
  }

  // Find the innermost node of a given type that contains the given
  // position. Interface similar to findNodeAt.
  function findNodeAround(node, pos, test, base, state) {
    test = makeTest(test)
    if (!base) base = exports.base
    try {
      ;(function c(node, st, override) {
        var type = override || node.type
        if (node.start > pos || node.end < pos) return
        base[type](node, st, c)
        if (test(type, node)) throw new Found(node, st)
      })(node, state)
    } catch (e) {
      if (e instanceof Found) return e
      throw e
    }
  }

  // Find the outermost matching node after a given position.
  function findNodeAfter(node, pos, test, base, state) {
    test = makeTest(test)
    if (!base) base = exports.base
    try {
      ;(function c(node, st, override) {
        if (node.end < pos) return
        var type = override || node.type
        if (node.start >= pos && test(type, node)) throw new Found(node, st)
        base[type](node, st, c)
      })(node, state)
    } catch (e) {
      if (e instanceof Found) return e
      throw e
    }
  }

  // Find the outermost matching node before a given position.
  function findNodeBefore(node, pos, test, base, state) {
    test = makeTest(test)
    if (!base) base = exports.base
    var max
    ;(function c(node, st, override) {
      if (node.start > pos) return
      var type = override || node.type
      if (node.end <= pos && (!max || max.node.end < node.end) && test(type, node))
        max = new Found(node, st)
      base[type](node, st, c)
    })(node, state)
    return max
  }

  // Fallback to an Object.create polyfill for older environments.
  var create = Object.create || function(proto) {
    function Ctor() {}
    Ctor.prototype = proto
    return new Ctor
  }

  // Used to create a custom walker. Will fill in all missing node
  // type properties with the defaults.
  function make(funcs, base) {
    if (!base) base = exports.base
    var visitor = create(base)
    for (var type in funcs) visitor[type] = funcs[type]
    return visitor
  }

  function skipThrough(node, st, c) { c(node, st) }
  function ignore(_node, _st, _c) {}

  // Node walkers.

  var base = {}

  base.Program = base.BlockStatement = function (node, st, c) {
    for (var i = 0; i < node.body.length; ++i)
      c(node.body[i], st, "Statement")
  }
  base.Statement = skipThrough
  base.EmptyStatement = ignore
  base.ExpressionStatement = base.ParenthesizedExpression =
    function (node, st, c) { return c(node.expression, st, "Expression"); }
  base.IfStatement = function (node, st, c) {
    c(node.test, st, "Expression")
    c(node.consequent, st, "Statement")
    if (node.alternate) c(node.alternate, st, "Statement")
  }
  base.LabeledStatement = function (node, st, c) { return c(node.body, st, "Statement"); }
  base.BreakStatement = base.ContinueStatement = ignore
  base.WithStatement = function (node, st, c) {
    c(node.object, st, "Expression")
    c(node.body, st, "Statement")
  }
  base.SwitchStatement = function (node, st, c) {
    c(node.discriminant, st, "Expression")
    for (var i = 0; i < node.cases.length; ++i) {
      var cs = node.cases[i]
      if (cs.test) c(cs.test, st, "Expression")
      for (var j = 0; j < cs.consequent.length; ++j)
        c(cs.consequent[j], st, "Statement")
    }
  }
  base.ReturnStatement = base.YieldExpression = function (node, st, c) {
    if (node.argument) c(node.argument, st, "Expression")
  }
  base.ThrowStatement = base.SpreadElement =
    function (node, st, c) { return c(node.argument, st, "Expression"); }
  base.TryStatement = function (node, st, c) {
    c(node.block, st, "Statement")
    if (node.handler) c(node.handler, st)
    if (node.finalizer) c(node.finalizer, st, "Statement")
  }
  base.CatchClause = function (node, st, c) {
    c(node.param, st, "Pattern")
    c(node.body, st, "ScopeBody")
  }
  base.WhileStatement = base.DoWhileStatement = function (node, st, c) {
    c(node.test, st, "Expression")
    c(node.body, st, "Statement")
  }
  base.ForStatement = function (node, st, c) {
    if (node.init) c(node.init, st, "ForInit")
    if (node.test) c(node.test, st, "Expression")
    if (node.update) c(node.update, st, "Expression")
    c(node.body, st, "Statement")
  }
  base.ForInStatement = base.ForOfStatement = function (node, st, c) {
    c(node.left, st, "ForInit")
    c(node.right, st, "Expression")
    c(node.body, st, "Statement")
  }
  base.ForInit = function (node, st, c) {
    if (node.type == "VariableDeclaration") c(node, st)
    else c(node, st, "Expression")
  }
  base.DebuggerStatement = ignore

  base.FunctionDeclaration = function (node, st, c) { return c(node, st, "Function"); }
  base.VariableDeclaration = function (node, st, c) {
    for (var i = 0; i < node.declarations.length; ++i)
      c(node.declarations[i], st)
  }
  base.VariableDeclarator = function (node, st, c) {
    c(node.id, st, "Pattern")
    if (node.init) c(node.init, st, "Expression")
  }

  base.Function = function (node, st, c) {
    if (node.id) c(node.id, st, "Pattern")
    for (var i = 0; i < node.params.length; i++)
      c(node.params[i], st, "Pattern")
    c(node.body, st, node.expression ? "ScopeExpression" : "ScopeBody")
  }
  // FIXME drop these node types in next major version
  // (They are awkward, and in ES6 every block can be a scope.)
  base.ScopeBody = function (node, st, c) { return c(node, st, "Statement"); }
  base.ScopeExpression = function (node, st, c) { return c(node, st, "Expression"); }

  base.Pattern = function (node, st, c) {
    if (node.type == "Identifier")
      c(node, st, "VariablePattern")
    else if (node.type == "MemberExpression")
      c(node, st, "MemberPattern")
    else
      c(node, st)
  }
  base.VariablePattern = ignore
  base.MemberPattern = skipThrough
  base.RestElement = function (node, st, c) { return c(node.argument, st, "Pattern"); }
  base.ArrayPattern =  function (node, st, c) {
    for (var i = 0; i < node.elements.length; ++i) {
      var elt = node.elements[i]
      if (elt) c(elt, st, "Pattern")
    }
  }
  base.ObjectPattern = function (node, st, c) {
    for (var i = 0; i < node.properties.length; ++i)
      c(node.properties[i].value, st, "Pattern")
  }

  base.Expression = skipThrough
  base.ThisExpression = base.Super = base.MetaProperty = ignore
  base.ArrayExpression = function (node, st, c) {
    for (var i = 0; i < node.elements.length; ++i) {
      var elt = node.elements[i]
      if (elt) c(elt, st, "Expression")
    }
  }
  base.ObjectExpression = function (node, st, c) {
    for (var i = 0; i < node.properties.length; ++i)
      c(node.properties[i], st)
  }
  base.FunctionExpression = base.ArrowFunctionExpression = base.FunctionDeclaration
  base.SequenceExpression = base.TemplateLiteral = function (node, st, c) {
    for (var i = 0; i < node.expressions.length; ++i)
      c(node.expressions[i], st, "Expression")
  }
  base.UnaryExpression = base.UpdateExpression = function (node, st, c) {
    c(node.argument, st, "Expression")
  }
  base.BinaryExpression = base.LogicalExpression = function (node, st, c) {
    c(node.left, st, "Expression")
    c(node.right, st, "Expression")
  }
  base.AssignmentExpression = base.AssignmentPattern = function (node, st, c) {
    c(node.left, st, "Pattern")
    c(node.right, st, "Expression")
  }
  base.ConditionalExpression = function (node, st, c) {
    c(node.test, st, "Expression")
    c(node.consequent, st, "Expression")
    c(node.alternate, st, "Expression")
  }
  base.NewExpression = base.CallExpression = function (node, st, c) {
    c(node.callee, st, "Expression")
    if (node.arguments) for (var i = 0; i < node.arguments.length; ++i)
      c(node.arguments[i], st, "Expression")
  }
  base.MemberExpression = function (node, st, c) {
    c(node.object, st, "Expression")
    if (node.computed) c(node.property, st, "Expression")
  }
  base.ExportNamedDeclaration = base.ExportDefaultDeclaration = function (node, st, c) {
    if (node.declaration)
      c(node.declaration, st, node.type == "ExportNamedDeclaration" || node.declaration.id ? "Statement" : "Expression")
    if (node.source) c(node.source, st, "Expression")
  }
  base.ExportAllDeclaration = function (node, st, c) {
    c(node.source, st, "Expression")
  }
  base.ImportDeclaration = function (node, st, c) {
    for (var i = 0; i < node.specifiers.length; i++)
      c(node.specifiers[i], st)
    c(node.source, st, "Expression")
  }
  base.ImportSpecifier = base.ImportDefaultSpecifier = base.ImportNamespaceSpecifier = base.Identifier = base.Literal = ignore

  base.TaggedTemplateExpression = function (node, st, c) {
    c(node.tag, st, "Expression")
    c(node.quasi, st)
  }
  base.ClassDeclaration = base.ClassExpression = function (node, st, c) { return c(node, st, "Class"); }
  base.Class = function (node, st, c) {
    if (node.id) c(node.id, st, "Pattern")
    if (node.superClass) c(node.superClass, st, "Expression")
    for (var i = 0; i < node.body.body.length; i++)
      c(node.body.body[i], st)
  }
  base.MethodDefinition = base.Property = function (node, st, c) {
    if (node.computed) c(node.key, st, "Expression")
    c(node.value, st, "Expression")
  }

  exports.simple = simple;
  exports.ancestor = ancestor;
  exports.recursive = recursive;
  exports.findNodeAt = findNodeAt;
  exports.findNodeAround = findNodeAround;
  exports.findNodeAfter = findNodeAfter;
  exports.findNodeBefore = findNodeBefore;
  exports.make = make;
  exports.base = base;

  Object.defineProperty(exports, '__esModule', { value: true });

}));
},{}],43:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.acorn = global.acorn || {})));
}(this, (function (exports) { 'use strict';

// Reserved word lists for various dialects of the language

var reservedWords = {
  3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
  5: "class enum extends super const export import",
  6: "enum",
  strict: "implements interface let package private protected public static yield",
  strictBind: "eval arguments"
}

// And the keywords

var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this"

var keywords = {
  5: ecma5AndLessKeywords,
  6: ecma5AndLessKeywords + " const class extends export import super"
}

// ## Character categories

// Big ugly regular expressions that match characters in the
// whitespace, identifier, and identifier-start categories. These
// are only applied when a character is found to actually have a
// code point above 128.
// Generated by `bin/generate-identifier-regex.js`.

var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fd5\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7ae\ua7b0-\ua7b7\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab65\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc"
var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d4-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c03\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d01-\u0d03\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0eb9\u0ebb\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf2-\u1cf4\u1cf8\u1cf9\u1dc0-\u1df5\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua900-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f"

var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]")
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]")

nonASCIIidentifierStartChars = nonASCIIidentifierChars = null

// These are a run-length and offset encoded representation of the
// >0xffff code points that are a valid part of identifiers. The
// offset starts at 0x10000, and each pair of numbers represents an
// offset to the next range, and then a size of the range. They were
// generated by bin/generate-identifier-regex.js
var astralIdentifierStartCodes = [0,11,2,25,2,18,2,1,2,14,3,13,35,122,70,52,268,28,4,48,48,31,17,26,6,37,11,29,3,35,5,7,2,4,43,157,19,35,5,35,5,39,9,51,157,310,10,21,11,7,153,5,3,0,2,43,2,1,4,0,3,22,11,22,10,30,66,18,2,1,11,21,11,25,71,55,7,1,65,0,16,3,2,2,2,26,45,28,4,28,36,7,2,27,28,53,11,21,11,18,14,17,111,72,56,50,14,50,785,52,76,44,33,24,27,35,42,34,4,0,13,47,15,3,22,0,2,0,36,17,2,24,85,6,2,0,2,3,2,14,2,9,8,46,39,7,3,1,3,21,2,6,2,1,2,4,4,0,19,0,13,4,159,52,19,3,54,47,21,1,2,0,185,46,42,3,37,47,21,0,60,42,86,25,391,63,32,0,449,56,264,8,2,36,18,0,50,29,881,921,103,110,18,195,2749,1070,4050,582,8634,568,8,30,114,29,19,47,17,3,32,20,6,18,881,68,12,0,67,12,65,0,32,6124,20,754,9486,1,3071,106,6,12,4,8,8,9,5991,84,2,70,2,1,3,0,3,1,3,3,2,11,2,0,2,6,2,64,2,3,3,7,2,6,2,27,2,3,2,4,2,0,4,6,2,339,3,24,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,7,4149,196,60,67,1213,3,2,26,2,1,2,0,3,0,2,9,2,3,2,0,2,0,7,0,5,0,2,0,2,0,2,2,2,1,2,0,3,0,2,0,2,0,2,0,2,0,2,1,2,0,3,3,2,6,2,3,2,3,2,0,2,9,2,16,6,2,2,4,2,16,4421,42710,42,4148,12,221,3,5761,10591,541]
var astralIdentifierCodes = [509,0,227,0,150,4,294,9,1368,2,2,1,6,3,41,2,5,0,166,1,1306,2,54,14,32,9,16,3,46,10,54,9,7,2,37,13,2,9,52,0,13,2,49,13,10,2,4,9,83,11,7,0,161,11,6,9,7,3,57,0,2,6,3,1,3,2,10,0,11,1,3,6,4,4,193,17,10,9,87,19,13,9,214,6,3,8,28,1,83,16,16,9,82,12,9,9,84,14,5,9,423,9,838,7,2,7,17,9,57,21,2,13,19882,9,135,4,60,6,26,9,1016,45,17,3,19723,1,5319,4,4,5,9,7,3,6,31,3,149,2,1418,49,513,54,5,49,9,0,15,0,23,4,2,14,1361,6,2,16,3,6,2,1,2,4,2214,6,110,6,6,9,792487,239]

// This has a complexity linear to the value of the code. The
// assumption is that looking up astral identifier characters is
// rare.
function isInAstralSet(code, set) {
  var pos = 0x10000
  for (var i = 0; i < set.length; i += 2) {
    pos += set[i]
    if (pos > code) return false
    pos += set[i + 1]
    if (pos >= code) return true
  }
}

// Test whether a given character code starts an identifier.

function isIdentifierStart(code, astral) {
  if (code < 65) return code === 36
  if (code < 91) return true
  if (code < 97) return code === 95
  if (code < 123) return true
  if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code))
  if (astral === false) return false
  return isInAstralSet(code, astralIdentifierStartCodes)
}

// Test whether a given character is part of an identifier.

function isIdentifierChar(code, astral) {
  if (code < 48) return code === 36
  if (code < 58) return true
  if (code < 65) return false
  if (code < 91) return true
  if (code < 97) return code === 95
  if (code < 123) return true
  if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code))
  if (astral === false) return false
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
}

// ## Token types

// The assignment of fine-grained, information-carrying type objects
// allows the tokenizer to store the information it has about a
// token in a way that is very cheap for the parser to look up.

// All token type variables start with an underscore, to make them
// easy to recognize.

// The `beforeExpr` property is used to disambiguate between regular
// expressions and divisions. It is set on all token types that can
// be followed by an expression (thus, a slash after them would be a
// regular expression).
//
// The `startsExpr` property is used to check if the token ends a
// `yield` expression. It is set on all token types that either can
// directly start an expression (like a quotation mark) or can
// continue an expression (like the body of a string).
//
// `isLoop` marks a keyword as starting a loop, which is important
// to know when parsing a label, in order to allow or disallow
// continue jumps to that label.

var TokenType = function TokenType(label, conf) {
  if ( conf === void 0 ) conf = {};

  this.label = label
  this.keyword = conf.keyword
  this.beforeExpr = !!conf.beforeExpr
  this.startsExpr = !!conf.startsExpr
  this.isLoop = !!conf.isLoop
  this.isAssign = !!conf.isAssign
  this.prefix = !!conf.prefix
  this.postfix = !!conf.postfix
  this.binop = conf.binop || null
  this.updateContext = null
};

function binop(name, prec) {
  return new TokenType(name, {beforeExpr: true, binop: prec})
}
var beforeExpr = {beforeExpr: true};
var startsExpr = {startsExpr: true};
// Map keyword names to token types.

var keywordTypes = {}

// Succinct definitions of keyword token types
function kw(name, options) {
  if ( options === void 0 ) options = {};

  options.keyword = name
  return keywordTypes[name] = new TokenType(name, options)
}

var tt = {
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  name: new TokenType("name", startsExpr),
  eof: new TokenType("eof"),

  // Punctuation token types.
  bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
  assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
  incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
  prefix: new TokenType("prefix", {beforeExpr: true, prefix: true, startsExpr: true}),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=", 6),
  relational: binop("</>", 7),
  bitShift: binop("<</>>", 8),
  plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10),
  starstar: new TokenType("**", {beforeExpr: true}),

  // Keyword token types.
  _break: kw("break"),
  _case: kw("case", beforeExpr),
  _catch: kw("catch"),
  _continue: kw("continue"),
  _debugger: kw("debugger"),
  _default: kw("default", beforeExpr),
  _do: kw("do", {isLoop: true, beforeExpr: true}),
  _else: kw("else", beforeExpr),
  _finally: kw("finally"),
  _for: kw("for", {isLoop: true}),
  _function: kw("function", startsExpr),
  _if: kw("if"),
  _return: kw("return", beforeExpr),
  _switch: kw("switch"),
  _throw: kw("throw", beforeExpr),
  _try: kw("try"),
  _var: kw("var"),
  _const: kw("const"),
  _while: kw("while", {isLoop: true}),
  _with: kw("with"),
  _new: kw("new", {beforeExpr: true, startsExpr: true}),
  _this: kw("this", startsExpr),
  _super: kw("super", startsExpr),
  _class: kw("class"),
  _extends: kw("extends", beforeExpr),
  _export: kw("export"),
  _import: kw("import"),
  _null: kw("null", startsExpr),
  _true: kw("true", startsExpr),
  _false: kw("false", startsExpr),
  _in: kw("in", {beforeExpr: true, binop: 7}),
  _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
  _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
  _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
  _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
}

// Matches a whole line break (where CRLF is considered a single
// line break). Used to count lines.

var lineBreak = /\r\n?|\n|\u2028|\u2029/
var lineBreakG = new RegExp(lineBreak.source, "g")

function isNewLine(code) {
  return code === 10 || code === 13 || code === 0x2028 || code === 0x2029
}

var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/

var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g

function isArray(obj) {
  return Object.prototype.toString.call(obj) === "[object Array]"
}

// Checks if an object has a property.

function has(obj, propName) {
  return Object.prototype.hasOwnProperty.call(obj, propName)
}

// These are used when `options.locations` is on, for the
// `startLoc` and `endLoc` properties.

var Position = function Position(line, col) {
  this.line = line
  this.column = col
};

Position.prototype.offset = function offset (n) {
  return new Position(this.line, this.column + n)
};

var SourceLocation = function SourceLocation(p, start, end) {
  this.start = start
  this.end = end
  if (p.sourceFile !== null) this.source = p.sourceFile
};

// The `getLineInfo` function is mostly useful when the
// `locations` option is off (for performance reasons) and you
// want to find the line/column position for a given character
// offset. `input` should be the code string that the offset refers
// into.

function getLineInfo(input, offset) {
  for (var line = 1, cur = 0;;) {
    lineBreakG.lastIndex = cur
    var match = lineBreakG.exec(input)
    if (match && match.index < offset) {
      ++line
      cur = match.index + match[0].length
    } else {
      return new Position(line, offset - cur)
    }
  }
}

// A second optional argument can be given to further configure
// the parser process. These options are recognized:

var defaultOptions = {
  // `ecmaVersion` indicates the ECMAScript version to parse. Must
  // be either 3, 5, 6 (2015), 7 (2016), or 8 (2017). This influences support
  // for strict mode, the set of reserved words, and support for
  // new syntax features. The default is 7.
  ecmaVersion: 7,
  // `sourceType` indicates the mode the code should be parsed in.
  // Can be either `"script"` or `"module"`. This influences global
  // strict mode and parsing of `import` and `export` declarations.
  sourceType: "script",
  // `onInsertedSemicolon` can be a callback that will be called
  // when a semicolon is automatically inserted. It will be passed
  // th position of the comma as an offset, and if `locations` is
  // enabled, it is given the location as a `{line, column}` object
  // as second argument.
  onInsertedSemicolon: null,
  // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
  // trailing commas.
  onTrailingComma: null,
  // By default, reserved words are only enforced if ecmaVersion >= 5.
  // Set `allowReserved` to a boolean value to explicitly turn this on
  // an off. When this option has the value "never", reserved words
  // and keywords can also not be used as property names.
  allowReserved: null,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program.
  allowImportExportEverywhere: false,
  // When enabled, hashbang directive in the beginning of file
  // is allowed and treated as a line comment.
  allowHashBang: false,
  // When `locations` is on, `loc` properties holding objects with
  // `start` and `end` properties in `{line, column}` form (with
  // line being 1-based and column 0-based) will be attached to the
  // nodes.
  locations: false,
  // A function can be passed as `onToken` option, which will
  // cause Acorn to call that function with object in the same
  // format as tokens returned from `tokenizer().getToken()`. Note
  // that you are not allowed to call the parser from the
  // callback—that will corrupt its internal state.
  onToken: null,
  // A function can be passed as `onComment` option, which will
  // cause Acorn to call that function with `(block, text, start,
  // end)` parameters whenever a comment is skipped. `block` is a
  // boolean indicating whether this is a block (`/* */`) comment,
  // `text` is the content of the comment, and `start` and `end` are
  // character offsets that denote the start and end of the comment.
  // When the `locations` option is on, two more parameters are
  // passed, the full `{line, column}` locations of the start and
  // end of the comments. Note that you are not allowed to call the
  // parser from the callback—that will corrupt its internal state.
  onComment: null,
  // Nodes have their start and end characters offsets recorded in
  // `start` and `end` properties (directly on the node, rather than
  // the `loc` object, which holds line/column data. To also add a
  // [semi-standardized][range] `range` property holding a `[start,
  // end]` array with the same numbers, set the `ranges` option to
  // `true`.
  //
  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
  ranges: false,
  // It is possible to parse multiple files into a single AST by
  // passing the tree produced by parsing the first file as
  // `program` option in subsequent parses. This will add the
  // toplevel forms of the parsed file to the `Program` (top) node
  // of an existing parse tree.
  program: null,
  // When `locations` is on, you can pass this to record the source
  // file in every node's `loc` object.
  sourceFile: null,
  // This value, if given, is stored in every node, whether
  // `locations` is on or off.
  directSourceFile: null,
  // When enabled, parenthesized expressions are represented by
  // (non-standard) ParenthesizedExpression nodes
  preserveParens: false,
  plugins: {}
}

// Interpret and default an options object

function getOptions(opts) {
  var options = {}

  for (var opt in defaultOptions)
    options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt]

  if (options.ecmaVersion >= 2015)
    options.ecmaVersion -= 2009

  if (options.allowReserved == null)
    options.allowReserved = options.ecmaVersion < 5

  if (isArray(options.onToken)) {
    var tokens = options.onToken
    options.onToken = function (token) { return tokens.push(token); }
  }
  if (isArray(options.onComment))
    options.onComment = pushComment(options, options.onComment)

  return options
}

function pushComment(options, array) {
  return function (block, text, start, end, startLoc, endLoc) {
    var comment = {
      type: block ? 'Block' : 'Line',
      value: text,
      start: start,
      end: end
    }
    if (options.locations)
      comment.loc = new SourceLocation(this, startLoc, endLoc)
    if (options.ranges)
      comment.range = [start, end]
    array.push(comment)
  }
}

// Registered plugins
var plugins = {}

function keywordRegexp(words) {
  return new RegExp("^(" + words.replace(/ /g, "|") + ")$")
}

var Parser = function Parser(options, input, startPos) {
  this.options = options = getOptions(options)
  this.sourceFile = options.sourceFile
  this.keywords = keywordRegexp(keywords[options.ecmaVersion >= 6 ? 6 : 5])
  var reserved = ""
  if (!options.allowReserved) {
    for (var v = options.ecmaVersion;; v--)
      if (reserved = reservedWords[v]) break
    if (options.sourceType == "module") reserved += " await"
  }
  this.reservedWords = keywordRegexp(reserved)
  var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict
  this.reservedWordsStrict = keywordRegexp(reservedStrict)
  this.reservedWordsStrictBind = keywordRegexp(reservedStrict + " " + reservedWords.strictBind)
  this.input = String(input)

  // Used to signal to callers of `readWord1` whether the word
  // contained any escape sequences. This is needed because words with
  // escape sequences must not be interpreted as keywords.
  this.containsEsc = false

  // Load plugins
  this.loadPlugins(options.plugins)

  // Set up token state

  // The current position of the tokenizer in the input.
  if (startPos) {
    this.pos = startPos
    this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1
    this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length
  } else {
    this.pos = this.lineStart = 0
    this.curLine = 1
  }

  // Properties of the current token:
  // Its type
  this.type = tt.eof
  // For tokens that include more information than their type, the value
  this.value = null
  // Its start and end offset
  this.start = this.end = this.pos
  // And, if locations are used, the {line, column} object
  // corresponding to those offsets
  this.startLoc = this.endLoc = this.curPosition()

  // Position information for the previous token
  this.lastTokEndLoc = this.lastTokStartLoc = null
  this.lastTokStart = this.lastTokEnd = this.pos

  // The context stack is used to superficially track syntactic
  // context to predict whether a regular expression is allowed in a
  // given position.
  this.context = this.initialContext()
  this.exprAllowed = true

  // Figure out if it's a module code.
  this.inModule = options.sourceType === "module"
  this.strict = this.inModule || this.strictDirective(this.pos)

  // Used to signify the start of a potential arrow function
  this.potentialArrowAt = -1

  // Flags to track whether we are in a function, a generator, an async function.
  this.inFunction = this.inGenerator = this.inAsync = false
  // Positions to delayed-check that yield/await does not exist in default parameters.
  this.yieldPos = this.awaitPos = 0
  // Labels in scope.
  this.labels = []

  // If enabled, skip leading hashbang line.
  if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === '#!')
    this.skipLineComment(2)
};

// DEPRECATED Kept for backwards compatibility until 3.0 in case a plugin uses them
Parser.prototype.isKeyword = function isKeyword (word) { return this.keywords.test(word) };
Parser.prototype.isReservedWord = function isReservedWord (word) { return this.reservedWords.test(word) };

Parser.prototype.extend = function extend (name, f) {
  this[name] = f(this[name])
};

Parser.prototype.loadPlugins = function loadPlugins (pluginConfigs) {
    var this$1 = this;

  for (var name in pluginConfigs) {
    var plugin = plugins[name]
    if (!plugin) throw new Error("Plugin '" + name + "' not found")
    plugin(this$1, pluginConfigs[name])
  }
};

Parser.prototype.parse = function parse () {
  var node = this.options.program || this.startNode()
  this.nextToken()
  return this.parseTopLevel(node)
};

var pp = Parser.prototype

// ## Parser utilities

var literal = /^(?:'((?:[^\']|\.)*)'|"((?:[^\"]|\.)*)"|;)/
pp.strictDirective = function(start) {
  var this$1 = this;

  for (;;) {
    skipWhiteSpace.lastIndex = start
    start += skipWhiteSpace.exec(this$1.input)[0].length
    var match = literal.exec(this$1.input.slice(start))
    if (!match) return false
    if ((match[1] || match[2]) == "use strict") return true
    start += match[0].length
  }
}

// Predicate that tests whether the next token is of the given
// type, and if yes, consumes it as a side effect.

pp.eat = function(type) {
  if (this.type === type) {
    this.next()
    return true
  } else {
    return false
  }
}

// Tests whether parsed token is a contextual keyword.

pp.isContextual = function(name) {
  return this.type === tt.name && this.value === name
}

// Consumes contextual keyword if possible.

pp.eatContextual = function(name) {
  return this.value === name && this.eat(tt.name)
}

// Asserts that following token is given contextual keyword.

pp.expectContextual = function(name) {
  if (!this.eatContextual(name)) this.unexpected()
}

// Test whether a semicolon can be inserted at the current position.

pp.canInsertSemicolon = function() {
  return this.type === tt.eof ||
    this.type === tt.braceR ||
    lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
}

pp.insertSemicolon = function() {
  if (this.canInsertSemicolon()) {
    if (this.options.onInsertedSemicolon)
      this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc)
    return true
  }
}

// Consume a semicolon, or, failing that, see if we are allowed to
// pretend that there is a semicolon at this position.

pp.semicolon = function() {
  if (!this.eat(tt.semi) && !this.insertSemicolon()) this.unexpected()
}

pp.afterTrailingComma = function(tokType, notNext) {
  if (this.type == tokType) {
    if (this.options.onTrailingComma)
      this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc)
    if (!notNext)
      this.next()
    return true
  }
}

// Expect a token of a given type. If found, consume it, otherwise,
// raise an unexpected token error.

pp.expect = function(type) {
  this.eat(type) || this.unexpected()
}

// Raise an unexpected token error.

pp.unexpected = function(pos) {
  this.raise(pos != null ? pos : this.start, "Unexpected token")
}

var DestructuringErrors = function DestructuringErrors() {
  this.shorthandAssign = this.trailingComma = this.parenthesizedAssign = this.parenthesizedBind = -1
};

pp.checkPatternErrors = function(refDestructuringErrors, isAssign) {
  if (!refDestructuringErrors) return
  if (refDestructuringErrors.trailingComma > -1)
    this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element")
  var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind
  if (parens > -1) this.raiseRecoverable(parens, "Parenthesized pattern")
}

pp.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
  var pos = refDestructuringErrors ? refDestructuringErrors.shorthandAssign : -1
  if (!andThrow) return pos >= 0
  if (pos > -1) this.raise(pos, "Shorthand property assignments are valid only in destructuring patterns")
}

pp.checkYieldAwaitInDefaultParams = function() {
  if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
    this.raise(this.yieldPos, "Yield expression cannot be a default value")
  if (this.awaitPos)
    this.raise(this.awaitPos, "Await expression cannot be a default value")
}

pp.isSimpleAssignTarget = function(expr) {
  if (expr.type === "ParenthesizedExpression")
    return this.isSimpleAssignTarget(expr.expression)
  return expr.type === "Identifier" || expr.type === "MemberExpression"
}

var pp$1 = Parser.prototype

// ### Statement parsing

// Parse a program. Initializes the parser, reads any number of
// statements, and wraps them in a Program node.  Optionally takes a
// `program` argument.  If present, the statements will be appended
// to its body instead of creating a new node.

pp$1.parseTopLevel = function(node) {
  var this$1 = this;

  var exports = {}
  if (!node.body) node.body = []
  while (this.type !== tt.eof) {
    var stmt = this$1.parseStatement(true, true, exports)
    node.body.push(stmt)
  }
  this.next()
  if (this.options.ecmaVersion >= 6) {
    node.sourceType = this.options.sourceType
  }
  return this.finishNode(node, "Program")
}

var loopLabel = {kind: "loop"};
var switchLabel = {kind: "switch"};
pp$1.isLet = function() {
  if (this.type !== tt.name || this.options.ecmaVersion < 6 || this.value != "let") return false
  skipWhiteSpace.lastIndex = this.pos
  var skip = skipWhiteSpace.exec(this.input)
  var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next)
  if (nextCh === 91 || nextCh == 123) return true // '{' and '['
  if (isIdentifierStart(nextCh, true)) {
    for (var pos = next + 1; isIdentifierChar(this.input.charCodeAt(pos), true); ++pos) {}
    var ident = this.input.slice(next, pos)
    if (!this.isKeyword(ident)) return true
  }
  return false
}

// check 'async [no LineTerminator here] function'
// - 'async /*foo*/ function' is OK.
// - 'async /*\n*/ function' is invalid.
pp$1.isAsyncFunction = function() {
  if (this.type !== tt.name || this.options.ecmaVersion < 8 || this.value != "async")
    return false

  skipWhiteSpace.lastIndex = this.pos
  var skip = skipWhiteSpace.exec(this.input)
  var next = this.pos + skip[0].length
  return !lineBreak.test(this.input.slice(this.pos, next)) &&
    this.input.slice(next, next + 8) === "function" &&
    (next + 8 == this.input.length || !isIdentifierChar(this.input.charAt(next + 8)))
}

// Parse a single statement.
//
// If expecting a statement and finding a slash operator, parse a
// regular expression literal. This is to handle cases like
// `if (foo) /blah/.exec(foo)`, where looking at the previous token
// does not help.

pp$1.parseStatement = function(declaration, topLevel, exports) {
  var starttype = this.type, node = this.startNode(), kind

  if (this.isLet()) {
    starttype = tt._var
    kind = "let"
  }

  // Most types of statements are recognized by the keyword they
  // start with. Many are trivial to parse, some require a bit of
  // complexity.

  switch (starttype) {
  case tt._break: case tt._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
  case tt._debugger: return this.parseDebuggerStatement(node)
  case tt._do: return this.parseDoStatement(node)
  case tt._for: return this.parseForStatement(node)
  case tt._function:
    if (!declaration && this.options.ecmaVersion >= 6) this.unexpected()
    return this.parseFunctionStatement(node, false)
  case tt._class:
    if (!declaration) this.unexpected()
    return this.parseClass(node, true)
  case tt._if: return this.parseIfStatement(node)
  case tt._return: return this.parseReturnStatement(node)
  case tt._switch: return this.parseSwitchStatement(node)
  case tt._throw: return this.parseThrowStatement(node)
  case tt._try: return this.parseTryStatement(node)
  case tt._const: case tt._var:
    kind = kind || this.value
    if (!declaration && kind != "var") this.unexpected()
    return this.parseVarStatement(node, kind)
  case tt._while: return this.parseWhileStatement(node)
  case tt._with: return this.parseWithStatement(node)
  case tt.braceL: return this.parseBlock()
  case tt.semi: return this.parseEmptyStatement(node)
  case tt._export:
  case tt._import:
    if (!this.options.allowImportExportEverywhere) {
      if (!topLevel)
        this.raise(this.start, "'import' and 'export' may only appear at the top level")
      if (!this.inModule)
        this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'")
    }
    return starttype === tt._import ? this.parseImport(node) : this.parseExport(node, exports)

    // If the statement does not start with a statement keyword or a
    // brace, it's an ExpressionStatement or LabeledStatement. We
    // simply start parsing an expression, and afterwards, if the
    // next token is a colon and the expression was a simple
    // Identifier node, we switch to interpreting it as a label.
  default:
    if (this.isAsyncFunction() && declaration) {
      this.next()
      return this.parseFunctionStatement(node, true)
    }

    var maybeName = this.value, expr = this.parseExpression()
    if (starttype === tt.name && expr.type === "Identifier" && this.eat(tt.colon))
      return this.parseLabeledStatement(node, maybeName, expr)
    else return this.parseExpressionStatement(node, expr)
  }
}

pp$1.parseBreakContinueStatement = function(node, keyword) {
  var this$1 = this;

  var isBreak = keyword == "break"
  this.next()
  if (this.eat(tt.semi) || this.insertSemicolon()) node.label = null
  else if (this.type !== tt.name) this.unexpected()
  else {
    node.label = this.parseIdent()
    this.semicolon()
  }

  // Verify that there is an actual destination to break or
  // continue to.
  for (var i = 0; i < this.labels.length; ++i) {
    var lab = this$1.labels[i]
    if (node.label == null || lab.name === node.label.name) {
      if (lab.kind != null && (isBreak || lab.kind === "loop")) break
      if (node.label && isBreak) break
    }
  }
  if (i === this.labels.length) this.raise(node.start, "Unsyntactic " + keyword)
  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
}

pp$1.parseDebuggerStatement = function(node) {
  this.next()
  this.semicolon()
  return this.finishNode(node, "DebuggerStatement")
}

pp$1.parseDoStatement = function(node) {
  this.next()
  this.labels.push(loopLabel)
  node.body = this.parseStatement(false)
  this.labels.pop()
  this.expect(tt._while)
  node.test = this.parseParenExpression()
  if (this.options.ecmaVersion >= 6)
    this.eat(tt.semi)
  else
    this.semicolon()
  return this.finishNode(node, "DoWhileStatement")
}

// Disambiguating between a `for` and a `for`/`in` or `for`/`of`
// loop is non-trivial. Basically, we have to parse the init `var`
// statement or expression, disallowing the `in` operator (see
// the second parameter to `parseExpression`), and then check
// whether the next token is `in` or `of`. When there is no init
// part (semicolon immediately after the opening parenthesis), it
// is a regular `for` loop.

pp$1.parseForStatement = function(node) {
  this.next()
  this.labels.push(loopLabel)
  this.expect(tt.parenL)
  if (this.type === tt.semi) return this.parseFor(node, null)
  var isLet = this.isLet()
  if (this.type === tt._var || this.type === tt._const || isLet) {
    var init$1 = this.startNode(), kind = isLet ? "let" : this.value
    this.next()
    this.parseVar(init$1, true, kind)
    this.finishNode(init$1, "VariableDeclaration")
    if ((this.type === tt._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init$1.declarations.length === 1 &&
        !(kind !== "var" && init$1.declarations[0].init))
      return this.parseForIn(node, init$1)
    return this.parseFor(node, init$1)
  }
  var refDestructuringErrors = new DestructuringErrors
  var init = this.parseExpression(true, refDestructuringErrors)
  if (this.type === tt._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
    this.toAssignable(init)
    this.checkLVal(init)
    this.checkPatternErrors(refDestructuringErrors, true)
    return this.parseForIn(node, init)
  } else {
    this.checkExpressionErrors(refDestructuringErrors, true)
  }
  return this.parseFor(node, init)
}

pp$1.parseFunctionStatement = function(node, isAsync) {
  this.next()
  return this.parseFunction(node, true, false, isAsync)
}

pp$1.isFunction = function() {
  return this.type === tt._function || this.isAsyncFunction()
}

pp$1.parseIfStatement = function(node) {
  this.next()
  node.test = this.parseParenExpression()
  // allow function declarations in branches, but only in non-strict mode
  node.consequent = this.parseStatement(!this.strict && this.isFunction())
  node.alternate = this.eat(tt._else) ? this.parseStatement(!this.strict && this.isFunction()) : null
  return this.finishNode(node, "IfStatement")
}

pp$1.parseReturnStatement = function(node) {
  if (!this.inFunction && !this.options.allowReturnOutsideFunction)
    this.raise(this.start, "'return' outside of function")
  this.next()

  // In `return` (and `break`/`continue`), the keywords with
  // optional arguments, we eagerly look for a semicolon or the
  // possibility to insert one.

  if (this.eat(tt.semi) || this.insertSemicolon()) node.argument = null
  else { node.argument = this.parseExpression(); this.semicolon() }
  return this.finishNode(node, "ReturnStatement")
}

pp$1.parseSwitchStatement = function(node) {
  var this$1 = this;

  this.next()
  node.discriminant = this.parseParenExpression()
  node.cases = []
  this.expect(tt.braceL)
  this.labels.push(switchLabel)

  // Statements under must be grouped (by label) in SwitchCase
  // nodes. `cur` is used to keep the node that we are currently
  // adding statements to.

  for (var cur, sawDefault = false; this.type != tt.braceR;) {
    if (this$1.type === tt._case || this$1.type === tt._default) {
      var isCase = this$1.type === tt._case
      if (cur) this$1.finishNode(cur, "SwitchCase")
      node.cases.push(cur = this$1.startNode())
      cur.consequent = []
      this$1.next()
      if (isCase) {
        cur.test = this$1.parseExpression()
      } else {
        if (sawDefault) this$1.raiseRecoverable(this$1.lastTokStart, "Multiple default clauses")
        sawDefault = true
        cur.test = null
      }
      this$1.expect(tt.colon)
    } else {
      if (!cur) this$1.unexpected()
      cur.consequent.push(this$1.parseStatement(true))
    }
  }
  if (cur) this.finishNode(cur, "SwitchCase")
  this.next() // Closing brace
  this.labels.pop()
  return this.finishNode(node, "SwitchStatement")
}

pp$1.parseThrowStatement = function(node) {
  this.next()
  if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
    this.raise(this.lastTokEnd, "Illegal newline after throw")
  node.argument = this.parseExpression()
  this.semicolon()
  return this.finishNode(node, "ThrowStatement")
}

// Reused empty array added for node fields that are always empty.

var empty = []

pp$1.parseTryStatement = function(node) {
  this.next()
  node.block = this.parseBlock()
  node.handler = null
  if (this.type === tt._catch) {
    var clause = this.startNode()
    this.next()
    this.expect(tt.parenL)
    clause.param = this.parseBindingAtom()
    this.checkLVal(clause.param, true)
    this.expect(tt.parenR)
    clause.body = this.parseBlock()
    node.handler = this.finishNode(clause, "CatchClause")
  }
  node.finalizer = this.eat(tt._finally) ? this.parseBlock() : null
  if (!node.handler && !node.finalizer)
    this.raise(node.start, "Missing catch or finally clause")
  return this.finishNode(node, "TryStatement")
}

pp$1.parseVarStatement = function(node, kind) {
  this.next()
  this.parseVar(node, false, kind)
  this.semicolon()
  return this.finishNode(node, "VariableDeclaration")
}

pp$1.parseWhileStatement = function(node) {
  this.next()
  node.test = this.parseParenExpression()
  this.labels.push(loopLabel)
  node.body = this.parseStatement(false)
  this.labels.pop()
  return this.finishNode(node, "WhileStatement")
}

pp$1.parseWithStatement = function(node) {
  if (this.strict) this.raise(this.start, "'with' in strict mode")
  this.next()
  node.object = this.parseParenExpression()
  node.body = this.parseStatement(false)
  return this.finishNode(node, "WithStatement")
}

pp$1.parseEmptyStatement = function(node) {
  this.next()
  return this.finishNode(node, "EmptyStatement")
}

pp$1.parseLabeledStatement = function(node, maybeName, expr) {
  var this$1 = this;

  for (var i = 0; i < this.labels.length; ++i)
    if (this$1.labels[i].name === maybeName) this$1.raise(expr.start, "Label '" + maybeName + "' is already declared")
  var kind = this.type.isLoop ? "loop" : this.type === tt._switch ? "switch" : null
  for (var i$1 = this.labels.length - 1; i$1 >= 0; i$1--) {
    var label = this$1.labels[i$1]
    if (label.statementStart == node.start) {
      label.statementStart = this$1.start
      label.kind = kind
    } else break
  }
  this.labels.push({name: maybeName, kind: kind, statementStart: this.start})
  node.body = this.parseStatement(true)
  if (node.body.type == "ClassDeclaration" ||
      node.body.type == "VariableDeclaration" && (this.strict || node.body.kind != "var") ||
      node.body.type == "FunctionDeclaration" && (this.strict || node.body.generator))
    this.raiseRecoverable(node.body.start, "Invalid labeled declaration")
  this.labels.pop()
  node.label = expr
  return this.finishNode(node, "LabeledStatement")
}

pp$1.parseExpressionStatement = function(node, expr) {
  node.expression = expr
  this.semicolon()
  return this.finishNode(node, "ExpressionStatement")
}

// Parse a semicolon-enclosed block of statements, handling `"use
// strict"` declarations when `allowStrict` is true (used for
// function bodies).

pp$1.parseBlock = function() {
  var this$1 = this;

  var node = this.startNode()
  node.body = []
  this.expect(tt.braceL)
  while (!this.eat(tt.braceR)) {
    var stmt = this$1.parseStatement(true)
    node.body.push(stmt)
  }
  return this.finishNode(node, "BlockStatement")
}

// Parse a regular `for` loop. The disambiguation code in
// `parseStatement` will already have parsed the init statement or
// expression.

pp$1.parseFor = function(node, init) {
  node.init = init
  this.expect(tt.semi)
  node.test = this.type === tt.semi ? null : this.parseExpression()
  this.expect(tt.semi)
  node.update = this.type === tt.parenR ? null : this.parseExpression()
  this.expect(tt.parenR)
  node.body = this.parseStatement(false)
  this.labels.pop()
  return this.finishNode(node, "ForStatement")
}

// Parse a `for`/`in` and `for`/`of` loop, which are almost
// same from parser's perspective.

pp$1.parseForIn = function(node, init) {
  var type = this.type === tt._in ? "ForInStatement" : "ForOfStatement"
  this.next()
  node.left = init
  node.right = this.parseExpression()
  this.expect(tt.parenR)
  node.body = this.parseStatement(false)
  this.labels.pop()
  return this.finishNode(node, type)
}

// Parse a list of variable declarations.

pp$1.parseVar = function(node, isFor, kind) {
  var this$1 = this;

  node.declarations = []
  node.kind = kind
  for (;;) {
    var decl = this$1.startNode()
    this$1.parseVarId(decl)
    if (this$1.eat(tt.eq)) {
      decl.init = this$1.parseMaybeAssign(isFor)
    } else if (kind === "const" && !(this$1.type === tt._in || (this$1.options.ecmaVersion >= 6 && this$1.isContextual("of")))) {
      this$1.unexpected()
    } else if (decl.id.type != "Identifier" && !(isFor && (this$1.type === tt._in || this$1.isContextual("of")))) {
      this$1.raise(this$1.lastTokEnd, "Complex binding patterns require an initialization value")
    } else {
      decl.init = null
    }
    node.declarations.push(this$1.finishNode(decl, "VariableDeclarator"))
    if (!this$1.eat(tt.comma)) break
  }
  return node
}

pp$1.parseVarId = function(decl) {
  decl.id = this.parseBindingAtom()
  this.checkLVal(decl.id, true)
}

// Parse a function declaration or literal (depending on the
// `isStatement` parameter).

pp$1.parseFunction = function(node, isStatement, allowExpressionBody, isAsync) {
  this.initFunction(node)
  if (this.options.ecmaVersion >= 6 && !isAsync)
    node.generator = this.eat(tt.star)
  if (this.options.ecmaVersion >= 8)
    node.async = !!isAsync

  if (isStatement == null)
    isStatement = this.type == tt.name
  if (isStatement)
    node.id = this.parseIdent()

  var oldInGen = this.inGenerator, oldInAsync = this.inAsync,
      oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldInFunc = this.inFunction
  this.inGenerator = node.generator
  this.inAsync = node.async
  this.yieldPos = 0
  this.awaitPos = 0
  this.inFunction = true

  if (!isStatement && this.type === tt.name)
    node.id = this.parseIdent()
  this.parseFunctionParams(node)
  this.parseFunctionBody(node, allowExpressionBody)

  this.inGenerator = oldInGen
  this.inAsync = oldInAsync
  this.yieldPos = oldYieldPos
  this.awaitPos = oldAwaitPos
  this.inFunction = oldInFunc
  return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression")
}

pp$1.parseFunctionParams = function(node) {
  this.expect(tt.parenL)
  node.params = this.parseBindingList(tt.parenR, false, this.options.ecmaVersion >= 8, true)
  this.checkYieldAwaitInDefaultParams()
}

// Parse a class declaration or literal (depending on the
// `isStatement` parameter).

pp$1.parseClass = function(node, isStatement) {
  var this$1 = this;

  this.next()
  if (isStatement == null) isStatement = this.type === tt.name
  this.parseClassId(node, isStatement)
  this.parseClassSuper(node)
  var classBody = this.startNode()
  var hadConstructor = false
  classBody.body = []
  this.expect(tt.braceL)
  while (!this.eat(tt.braceR)) {
    if (this$1.eat(tt.semi)) continue
    var method = this$1.startNode()
    var isGenerator = this$1.eat(tt.star)
    var isAsync = false
    var isMaybeStatic = this$1.type === tt.name && this$1.value === "static"
    this$1.parsePropertyName(method)
    method.static = isMaybeStatic && this$1.type !== tt.parenL
    if (method.static) {
      if (isGenerator) this$1.unexpected()
      isGenerator = this$1.eat(tt.star)
      this$1.parsePropertyName(method)
    }
    if (this$1.options.ecmaVersion >= 8 && !isGenerator && !method.computed &&
        method.key.type === "Identifier" && method.key.name === "async" && this$1.type !== tt.parenL &&
        !this$1.canInsertSemicolon()) {
      isAsync = true
      this$1.parsePropertyName(method)
    }
    method.kind = "method"
    var isGetSet = false
    if (!method.computed) {
      var key = method.key;
      if (!isGenerator && !isAsync && key.type === "Identifier" && this$1.type !== tt.parenL && (key.name === "get" || key.name === "set")) {
        isGetSet = true
        method.kind = key.name
        key = this$1.parsePropertyName(method)
      }
      if (!method.static && (key.type === "Identifier" && key.name === "constructor" ||
          key.type === "Literal" && key.value === "constructor")) {
        if (hadConstructor) this$1.raise(key.start, "Duplicate constructor in the same class")
        if (isGetSet) this$1.raise(key.start, "Constructor can't have get/set modifier")
        if (isGenerator) this$1.raise(key.start, "Constructor can't be a generator")
        if (isAsync) this$1.raise(key.start, "Constructor can't be an async method")
        method.kind = "constructor"
        hadConstructor = true
      }
    }
    this$1.parseClassMethod(classBody, method, isGenerator, isAsync)
    if (isGetSet) {
      var paramCount = method.kind === "get" ? 0 : 1
      if (method.value.params.length !== paramCount) {
        var start = method.value.start
        if (method.kind === "get")
          this$1.raiseRecoverable(start, "getter should have no params")
        else
          this$1.raiseRecoverable(start, "setter should have exactly one param")
      } else {
        if (method.kind === "set" && method.value.params[0].type === "RestElement")
          this$1.raiseRecoverable(method.value.params[0].start, "Setter cannot use rest params")
      }
    }
  }
  node.body = this.finishNode(classBody, "ClassBody")
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
}

pp$1.parseClassMethod = function(classBody, method, isGenerator, isAsync) {
  method.value = this.parseMethod(isGenerator, isAsync)
  classBody.body.push(this.finishNode(method, "MethodDefinition"))
}

pp$1.parseClassId = function(node, isStatement) {
  node.id = this.type === tt.name ? this.parseIdent() : isStatement ? this.unexpected() : null
}

pp$1.parseClassSuper = function(node) {
  node.superClass = this.eat(tt._extends) ? this.parseExprSubscripts() : null
}

// Parses module export declaration.

pp$1.parseExport = function(node, exports) {
  var this$1 = this;

  this.next()
  // export * from '...'
  if (this.eat(tt.star)) {
    this.expectContextual("from")
    node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
    this.semicolon()
    return this.finishNode(node, "ExportAllDeclaration")
  }
  if (this.eat(tt._default)) { // export default ...
    this.checkExport(exports, "default", this.lastTokStart)
    var isAsync
    if (this.type === tt._function || (isAsync = this.isAsyncFunction())) {
      var fNode = this.startNode()
      this.next()
      if (isAsync) this.next()
      node.declaration = this.parseFunction(fNode, null, false, isAsync)
    } else if (this.type === tt._class) {
      var cNode = this.startNode()
      node.declaration = this.parseClass(cNode, null)
    } else {
      node.declaration = this.parseMaybeAssign()
      this.semicolon()
    }
    return this.finishNode(node, "ExportDefaultDeclaration")
  }
  // export var|const|let|function|class ...
  if (this.shouldParseExportStatement()) {
    node.declaration = this.parseStatement(true)
    if (node.declaration.type === "VariableDeclaration")
      this.checkVariableExport(exports, node.declaration.declarations)
    else
      this.checkExport(exports, node.declaration.id.name, node.declaration.id.start)
    node.specifiers = []
    node.source = null
  } else { // export { x, y as z } [from '...']
    node.declaration = null
    node.specifiers = this.parseExportSpecifiers(exports)
    if (this.eatContextual("from")) {
      node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
    } else {
      // check for keywords used as local names
      for (var i = 0; i < node.specifiers.length; i++) {
        if (this$1.keywords.test(node.specifiers[i].local.name) || this$1.reservedWords.test(node.specifiers[i].local.name)) {
          this$1.unexpected(node.specifiers[i].local.start)
        }
      }

      node.source = null
    }
    this.semicolon()
  }
  return this.finishNode(node, "ExportNamedDeclaration")
}

pp$1.checkExport = function(exports, name, pos) {
  if (!exports) return
  if (Object.prototype.hasOwnProperty.call(exports, name))
    this.raiseRecoverable(pos, "Duplicate export '" + name + "'")
  exports[name] = true
}

pp$1.checkPatternExport = function(exports, pat) {
  var this$1 = this;

  var type = pat.type
  if (type == "Identifier")
    this.checkExport(exports, pat.name, pat.start)
  else if (type == "ObjectPattern")
    for (var i = 0; i < pat.properties.length; ++i)
      this$1.checkPatternExport(exports, pat.properties[i].value)
  else if (type == "ArrayPattern")
    for (var i$1 = 0; i$1 < pat.elements.length; ++i$1) {
      var elt = pat.elements[i$1]
      if (elt) this$1.checkPatternExport(exports, elt)
    }
  else if (type == "AssignmentPattern")
    this.checkPatternExport(exports, pat.left)
  else if (type == "ParenthesizedExpression")
    this.checkPatternExport(exports, pat.expression)
}

pp$1.checkVariableExport = function(exports, decls) {
  var this$1 = this;

  if (!exports) return
  for (var i = 0; i < decls.length; i++)
    this$1.checkPatternExport(exports, decls[i].id)
}

pp$1.shouldParseExportStatement = function() {
  return this.type.keyword === "var"
    || this.type.keyword === "const"
    || this.type.keyword === "class"
    || this.type.keyword === "function"
    || this.isLet()
    || this.isAsyncFunction()
}

// Parses a comma-separated list of module exports.

pp$1.parseExportSpecifiers = function(exports) {
  var this$1 = this;

  var nodes = [], first = true
  // export { x, y as z } [from '...']
  this.expect(tt.braceL)
  while (!this.eat(tt.braceR)) {
    if (!first) {
      this$1.expect(tt.comma)
      if (this$1.afterTrailingComma(tt.braceR)) break
    } else first = false

    var node = this$1.startNode()
    node.local = this$1.parseIdent(true)
    node.exported = this$1.eatContextual("as") ? this$1.parseIdent(true) : node.local
    this$1.checkExport(exports, node.exported.name, node.exported.start)
    nodes.push(this$1.finishNode(node, "ExportSpecifier"))
  }
  return nodes
}

// Parses import declaration.

pp$1.parseImport = function(node) {
  this.next()
  // import '...'
  if (this.type === tt.string) {
    node.specifiers = empty
    node.source = this.parseExprAtom()
  } else {
    node.specifiers = this.parseImportSpecifiers()
    this.expectContextual("from")
    node.source = this.type === tt.string ? this.parseExprAtom() : this.unexpected()
  }
  this.semicolon()
  return this.finishNode(node, "ImportDeclaration")
}

// Parses a comma-separated list of module imports.

pp$1.parseImportSpecifiers = function() {
  var this$1 = this;

  var nodes = [], first = true
  if (this.type === tt.name) {
    // import defaultObj, { x, y as z } from '...'
    var node = this.startNode()
    node.local = this.parseIdent()
    this.checkLVal(node.local, true)
    nodes.push(this.finishNode(node, "ImportDefaultSpecifier"))
    if (!this.eat(tt.comma)) return nodes
  }
  if (this.type === tt.star) {
    var node$1 = this.startNode()
    this.next()
    this.expectContextual("as")
    node$1.local = this.parseIdent()
    this.checkLVal(node$1.local, true)
    nodes.push(this.finishNode(node$1, "ImportNamespaceSpecifier"))
    return nodes
  }
  this.expect(tt.braceL)
  while (!this.eat(tt.braceR)) {
    if (!first) {
      this$1.expect(tt.comma)
      if (this$1.afterTrailingComma(tt.braceR)) break
    } else first = false

    var node$2 = this$1.startNode()
    node$2.imported = this$1.parseIdent(true)
    if (this$1.eatContextual("as")) {
      node$2.local = this$1.parseIdent()
    } else {
      node$2.local = node$2.imported
      if (this$1.isKeyword(node$2.local.name)) this$1.unexpected(node$2.local.start)
      if (this$1.reservedWordsStrict.test(node$2.local.name)) this$1.raiseRecoverable(node$2.local.start, "The keyword '" + node$2.local.name + "' is reserved")
    }
    this$1.checkLVal(node$2.local, true)
    nodes.push(this$1.finishNode(node$2, "ImportSpecifier"))
  }
  return nodes
}

var pp$2 = Parser.prototype

// Convert existing expression atom to assignable pattern
// if possible.

pp$2.toAssignable = function(node, isBinding) {
  var this$1 = this;

  if (this.options.ecmaVersion >= 6 && node) {
    switch (node.type) {
      case "Identifier":
      if (this.inAsync && node.name === "await")
        this.raise(node.start, "Can not use 'await' as identifier inside an async function")
      break

    case "ObjectPattern":
    case "ArrayPattern":
      break

    case "ObjectExpression":
      node.type = "ObjectPattern"
      for (var i = 0; i < node.properties.length; i++) {
        var prop = node.properties[i]
        if (prop.kind !== "init") this$1.raise(prop.key.start, "Object pattern can't contain getter or setter")
        this$1.toAssignable(prop.value, isBinding)
      }
      break

    case "ArrayExpression":
      node.type = "ArrayPattern"
      this.toAssignableList(node.elements, isBinding)
      break

    case "AssignmentExpression":
      if (node.operator === "=") {
        node.type = "AssignmentPattern"
        delete node.operator
        this.toAssignable(node.left, isBinding)
        // falls through to AssignmentPattern
      } else {
        this.raise(node.left.end, "Only '=' operator can be used for specifying default value.")
        break
      }

    case "AssignmentPattern":
      break

    case "ParenthesizedExpression":
      node.expression = this.toAssignable(node.expression, isBinding)
      break

    case "MemberExpression":
      if (!isBinding) break

    default:
      this.raise(node.start, "Assigning to rvalue")
    }
  }
  return node
}

// Convert list of expression atoms to binding list.

pp$2.toAssignableList = function(exprList, isBinding) {
  var this$1 = this;

  var end = exprList.length
  if (end) {
    var last = exprList[end - 1]
    if (last && last.type == "RestElement") {
      --end
    } else if (last && last.type == "SpreadElement") {
      last.type = "RestElement"
      var arg = last.argument
      this.toAssignable(arg, isBinding)
      if (arg.type !== "Identifier" && arg.type !== "MemberExpression" && arg.type !== "ArrayPattern")
        this.unexpected(arg.start)
      --end
    }

    if (isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
      this.unexpected(last.argument.start)
  }
  for (var i = 0; i < end; i++) {
    var elt = exprList[i]
    if (elt) this$1.toAssignable(elt, isBinding)
  }
  return exprList
}

// Parses spread element.

pp$2.parseSpread = function(refDestructuringErrors) {
  var node = this.startNode()
  this.next()
  node.argument = this.parseMaybeAssign(false, refDestructuringErrors)
  return this.finishNode(node, "SpreadElement")
}

pp$2.parseRest = function(allowNonIdent) {
  var node = this.startNode()
  this.next()

  // RestElement inside of a function parameter must be an identifier
  if (allowNonIdent) node.argument = this.type === tt.name ? this.parseIdent() : this.unexpected()
  else node.argument = this.type === tt.name || this.type === tt.bracketL ? this.parseBindingAtom() : this.unexpected()

  return this.finishNode(node, "RestElement")
}

// Parses lvalue (assignable) atom.

pp$2.parseBindingAtom = function() {
  if (this.options.ecmaVersion < 6) return this.parseIdent()
  switch (this.type) {
  case tt.name:
    return this.parseIdent()

  case tt.bracketL:
    var node = this.startNode()
    this.next()
    node.elements = this.parseBindingList(tt.bracketR, true, true)
    return this.finishNode(node, "ArrayPattern")

  case tt.braceL:
    return this.parseObj(true)

  default:
    this.unexpected()
  }
}

pp$2.parseBindingList = function(close, allowEmpty, allowTrailingComma, allowNonIdent) {
  var this$1 = this;

  var elts = [], first = true
  while (!this.eat(close)) {
    if (first) first = false
    else this$1.expect(tt.comma)
    if (allowEmpty && this$1.type === tt.comma) {
      elts.push(null)
    } else if (allowTrailingComma && this$1.afterTrailingComma(close)) {
      break
    } else if (this$1.type === tt.ellipsis) {
      var rest = this$1.parseRest(allowNonIdent)
      this$1.parseBindingListItem(rest)
      elts.push(rest)
      if (this$1.type === tt.comma) this$1.raise(this$1.start, "Comma is not permitted after the rest element")
      this$1.expect(close)
      break
    } else {
      var elem = this$1.parseMaybeDefault(this$1.start, this$1.startLoc)
      this$1.parseBindingListItem(elem)
      elts.push(elem)
    }
  }
  return elts
}

pp$2.parseBindingListItem = function(param) {
  return param
}

// Parses assignment pattern around given atom if possible.

pp$2.parseMaybeDefault = function(startPos, startLoc, left) {
  left = left || this.parseBindingAtom()
  if (this.options.ecmaVersion < 6 || !this.eat(tt.eq)) return left
  var node = this.startNodeAt(startPos, startLoc)
  node.left = left
  node.right = this.parseMaybeAssign()
  return this.finishNode(node, "AssignmentPattern")
}

// Verify that a node is an lval — something that can be assigned
// to.

pp$2.checkLVal = function(expr, isBinding, checkClashes) {
  var this$1 = this;

  switch (expr.type) {
  case "Identifier":
    if (this.strict && this.reservedWordsStrictBind.test(expr.name))
      this.raiseRecoverable(expr.start, (isBinding ? "Binding " : "Assigning to ") + expr.name + " in strict mode")
    if (checkClashes) {
      if (has(checkClashes, expr.name))
        this.raiseRecoverable(expr.start, "Argument name clash")
      checkClashes[expr.name] = true
    }
    break

  case "MemberExpression":
    if (isBinding) this.raiseRecoverable(expr.start, (isBinding ? "Binding" : "Assigning to") + " member expression")
    break

  case "ObjectPattern":
    for (var i = 0; i < expr.properties.length; i++)
      this$1.checkLVal(expr.properties[i].value, isBinding, checkClashes)
    break

  case "ArrayPattern":
    for (var i$1 = 0; i$1 < expr.elements.length; i$1++) {
      var elem = expr.elements[i$1]
      if (elem) this$1.checkLVal(elem, isBinding, checkClashes)
    }
    break

  case "AssignmentPattern":
    this.checkLVal(expr.left, isBinding, checkClashes)
    break

  case "RestElement":
    this.checkLVal(expr.argument, isBinding, checkClashes)
    break

  case "ParenthesizedExpression":
    this.checkLVal(expr.expression, isBinding, checkClashes)
    break

  default:
    this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " rvalue")
  }
}

// A recursive descent parser operates by defining functions for all
// syntactic elements, and recursively calling those, each function
// advancing the input stream and returning an AST node. Precedence
// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
// instead of `(!x)[1]` is handled by the fact that the parser
// function that parses unary prefix operators is called first, and
// in turn calls the function that parses `[]` subscripts — that
// way, it'll receive the node for `x[1]` already parsed, and wraps
// *that* in the unary operator node.
//
// Acorn uses an [operator precedence parser][opp] to handle binary
// operator precedence, because it is much more compact than using
// the technique outlined above, which uses different, nesting
// functions to specify precedence, for all of the ten binary
// precedence levels that JavaScript defines.
//
// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

var pp$3 = Parser.prototype

// Check if property name clashes with already added.
// Object/class getters and setters are not allowed to clash —
// either with each other or with an init property — and in
// strict mode, init properties are also not allowed to be repeated.

pp$3.checkPropClash = function(prop, propHash) {
  if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
    return
  var key = prop.key;
  var name
  switch (key.type) {
  case "Identifier": name = key.name; break
  case "Literal": name = String(key.value); break
  default: return
  }
  var kind = prop.kind;
  if (this.options.ecmaVersion >= 6) {
    if (name === "__proto__" && kind === "init") {
      if (propHash.proto) this.raiseRecoverable(key.start, "Redefinition of __proto__ property")
      propHash.proto = true
    }
    return
  }
  name = "$" + name
  var other = propHash[name]
  if (other) {
    var isGetSet = kind !== "init"
    if ((this.strict || isGetSet) && other[kind] || !(isGetSet ^ other.init))
      this.raiseRecoverable(key.start, "Redefinition of property")
  } else {
    other = propHash[name] = {
      init: false,
      get: false,
      set: false
    }
  }
  other[kind] = true
}

// ### Expression parsing

// These nest, from the most general expression type at the top to
// 'atomic', nondivisible expression types at the bottom. Most of
// the functions will simply let the function(s) below them parse,
// and, *if* the syntactic construct they handle is present, wrap
// the AST node that the inner parser gave them in another node.

// Parse a full expression. The optional arguments are used to
// forbid the `in` operator (in for loops initalization expressions)
// and provide reference for storing '=' operator inside shorthand
// property assignment in contexts where both object expression
// and object pattern might appear (so it's possible to raise
// delayed syntax error at correct position).

pp$3.parseExpression = function(noIn, refDestructuringErrors) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc
  var expr = this.parseMaybeAssign(noIn, refDestructuringErrors)
  if (this.type === tt.comma) {
    var node = this.startNodeAt(startPos, startLoc)
    node.expressions = [expr]
    while (this.eat(tt.comma)) node.expressions.push(this$1.parseMaybeAssign(noIn, refDestructuringErrors))
    return this.finishNode(node, "SequenceExpression")
  }
  return expr
}

// Parse an assignment expression. This includes applications of
// operators like `+=`.

pp$3.parseMaybeAssign = function(noIn, refDestructuringErrors, afterLeftParse) {
  if (this.inGenerator && this.isContextual("yield")) return this.parseYield()

  var ownDestructuringErrors = false, oldParenAssign = -1
  if (refDestructuringErrors) {
    oldParenAssign = refDestructuringErrors.parenthesizedAssign
    refDestructuringErrors.parenthesizedAssign = -1
  } else {
    refDestructuringErrors = new DestructuringErrors
    ownDestructuringErrors = true
  }

  var startPos = this.start, startLoc = this.startLoc
  if (this.type == tt.parenL || this.type == tt.name)
    this.potentialArrowAt = this.start
  var left = this.parseMaybeConditional(noIn, refDestructuringErrors)
  if (afterLeftParse) left = afterLeftParse.call(this, left, startPos, startLoc)
  if (this.type.isAssign) {
    this.checkPatternErrors(refDestructuringErrors, true)
    if (!ownDestructuringErrors) DestructuringErrors.call(refDestructuringErrors)
    var node = this.startNodeAt(startPos, startLoc)
    node.operator = this.value
    node.left = this.type === tt.eq ? this.toAssignable(left) : left
    refDestructuringErrors.shorthandAssign = -1 // reset because shorthand default was used correctly
    this.checkLVal(left)
    this.next()
    node.right = this.parseMaybeAssign(noIn)
    return this.finishNode(node, "AssignmentExpression")
  } else {
    if (ownDestructuringErrors) this.checkExpressionErrors(refDestructuringErrors, true)
  }
  if (oldParenAssign > -1) refDestructuringErrors.parenthesizedAssign = oldParenAssign
  return left
}

// Parse a ternary conditional (`?:`) operator.

pp$3.parseMaybeConditional = function(noIn, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc
  var expr = this.parseExprOps(noIn, refDestructuringErrors)
  if (this.checkExpressionErrors(refDestructuringErrors)) return expr
  if (this.eat(tt.question)) {
    var node = this.startNodeAt(startPos, startLoc)
    node.test = expr
    node.consequent = this.parseMaybeAssign()
    this.expect(tt.colon)
    node.alternate = this.parseMaybeAssign(noIn)
    return this.finishNode(node, "ConditionalExpression")
  }
  return expr
}

// Start the precedence parser.

pp$3.parseExprOps = function(noIn, refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc
  var expr = this.parseMaybeUnary(refDestructuringErrors, false)
  if (this.checkExpressionErrors(refDestructuringErrors)) return expr
  return this.parseExprOp(expr, startPos, startLoc, -1, noIn)
}

// Parse binary operators with the operator precedence parsing
// algorithm. `left` is the left-hand side of the operator.
// `minPrec` provides context that allows the function to stop and
// defer further parser to one of its callers when it encounters an
// operator that has a lower precedence than the set it is parsing.

pp$3.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, noIn) {
  var prec = this.type.binop
  if (prec != null && (!noIn || this.type !== tt._in)) {
    if (prec > minPrec) {
      var logical = this.type === tt.logicalOR || this.type === tt.logicalAND
      var op = this.value
      this.next()
      var startPos = this.start, startLoc = this.startLoc
      var right = this.parseExprOp(this.parseMaybeUnary(null, false), startPos, startLoc, prec, noIn)
      var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical)
      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn)
    }
  }
  return left
}

pp$3.buildBinary = function(startPos, startLoc, left, right, op, logical) {
  var node = this.startNodeAt(startPos, startLoc)
  node.left = left
  node.operator = op
  node.right = right
  return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
}

// Parse unary operators, both prefix and postfix.

pp$3.parseMaybeUnary = function(refDestructuringErrors, sawUnary) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc, expr
  if (this.inAsync && this.isContextual("await")) {
    expr = this.parseAwait(refDestructuringErrors)
    sawUnary = true
  } else if (this.type.prefix) {
    var node = this.startNode(), update = this.type === tt.incDec
    node.operator = this.value
    node.prefix = true
    this.next()
    node.argument = this.parseMaybeUnary(null, true)
    this.checkExpressionErrors(refDestructuringErrors, true)
    if (update) this.checkLVal(node.argument)
    else if (this.strict && node.operator === "delete" &&
             node.argument.type === "Identifier")
      this.raiseRecoverable(node.start, "Deleting local variable in strict mode")
    else sawUnary = true
    expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression")
  } else {
    expr = this.parseExprSubscripts(refDestructuringErrors)
    if (this.checkExpressionErrors(refDestructuringErrors)) return expr
    while (this.type.postfix && !this.canInsertSemicolon()) {
      var node$1 = this$1.startNodeAt(startPos, startLoc)
      node$1.operator = this$1.value
      node$1.prefix = false
      node$1.argument = expr
      this$1.checkLVal(expr)
      this$1.next()
      expr = this$1.finishNode(node$1, "UpdateExpression")
    }
  }

  if (!sawUnary && this.eat(tt.starstar))
    return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false), "**", false)
  else
    return expr
}

// Parse call, dot, and `[]`-subscript expressions.

pp$3.parseExprSubscripts = function(refDestructuringErrors) {
  var startPos = this.start, startLoc = this.startLoc
  var expr = this.parseExprAtom(refDestructuringErrors)
  var skipArrowSubscripts = expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")"
  if (this.checkExpressionErrors(refDestructuringErrors) || skipArrowSubscripts) return expr
  var result = this.parseSubscripts(expr, startPos, startLoc)
  if (refDestructuringErrors && result.type === "MemberExpression") {
    if (refDestructuringErrors.parenthesizedAssign >= result.start) refDestructuringErrors.parenthesizedAssign = -1
    if (refDestructuringErrors.parenthesizedBind >= result.start) refDestructuringErrors.parenthesizedBind = -1
  }
  return result
}

pp$3.parseSubscripts = function(base, startPos, startLoc, noCalls) {
  var this$1 = this;

  var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" &&
      this.lastTokEnd == base.end && !this.canInsertSemicolon()
  for (var computed;;) {
    if ((computed = this$1.eat(tt.bracketL)) || this$1.eat(tt.dot)) {
      var node = this$1.startNodeAt(startPos, startLoc)
      node.object = base
      node.property = computed ? this$1.parseExpression() : this$1.parseIdent(true)
      node.computed = !!computed
      if (computed) this$1.expect(tt.bracketR)
      base = this$1.finishNode(node, "MemberExpression")
    } else if (!noCalls && this$1.eat(tt.parenL)) {
      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this$1.yieldPos, oldAwaitPos = this$1.awaitPos
      this$1.yieldPos = 0
      this$1.awaitPos = 0
      var exprList = this$1.parseExprList(tt.parenR, this$1.options.ecmaVersion >= 8, false, refDestructuringErrors)
      if (maybeAsyncArrow && !this$1.canInsertSemicolon() && this$1.eat(tt.arrow)) {
        this$1.checkPatternErrors(refDestructuringErrors, false)
        this$1.checkYieldAwaitInDefaultParams()
        this$1.yieldPos = oldYieldPos
        this$1.awaitPos = oldAwaitPos
        return this$1.parseArrowExpression(this$1.startNodeAt(startPos, startLoc), exprList, true)
      }
      this$1.checkExpressionErrors(refDestructuringErrors, true)
      this$1.yieldPos = oldYieldPos || this$1.yieldPos
      this$1.awaitPos = oldAwaitPos || this$1.awaitPos
      var node$1 = this$1.startNodeAt(startPos, startLoc)
      node$1.callee = base
      node$1.arguments = exprList
      base = this$1.finishNode(node$1, "CallExpression")
    } else if (this$1.type === tt.backQuote) {
      var node$2 = this$1.startNodeAt(startPos, startLoc)
      node$2.tag = base
      node$2.quasi = this$1.parseTemplate()
      base = this$1.finishNode(node$2, "TaggedTemplateExpression")
    } else {
      return base
    }
  }
}

// Parse an atomic expression — either a single token that is an
// expression, an expression started by a keyword like `function` or
// `new`, or an expression wrapped in punctuation like `()`, `[]`,
// or `{}`.

pp$3.parseExprAtom = function(refDestructuringErrors) {
  var node, canBeArrow = this.potentialArrowAt == this.start
  switch (this.type) {
  case tt._super:
    if (!this.inFunction)
      this.raise(this.start, "'super' outside of function or class")

  case tt._this:
    var type = this.type === tt._this ? "ThisExpression" : "Super"
    node = this.startNode()
    this.next()
    return this.finishNode(node, type)

  case tt.name:
    var startPos = this.start, startLoc = this.startLoc
    var id = this.parseIdent(this.type !== tt.name)
    if (this.options.ecmaVersion >= 8 && id.name === "async" && !this.canInsertSemicolon() && this.eat(tt._function))
      return this.parseFunction(this.startNodeAt(startPos, startLoc), false, false, true)
    if (canBeArrow && !this.canInsertSemicolon()) {
      if (this.eat(tt.arrow))
        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false)
      if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === tt.name) {
        id = this.parseIdent()
        if (this.canInsertSemicolon() || !this.eat(tt.arrow))
          this.unexpected()
        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true)
      }
    }
    return id

  case tt.regexp:
    var value = this.value
    node = this.parseLiteral(value.value)
    node.regex = {pattern: value.pattern, flags: value.flags}
    return node

  case tt.num: case tt.string:
    return this.parseLiteral(this.value)

  case tt._null: case tt._true: case tt._false:
    node = this.startNode()
    node.value = this.type === tt._null ? null : this.type === tt._true
    node.raw = this.type.keyword
    this.next()
    return this.finishNode(node, "Literal")

  case tt.parenL:
    var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow)
    if (refDestructuringErrors) {
      if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr))
        refDestructuringErrors.parenthesizedAssign = start
      if (refDestructuringErrors.parenthesizedBind < 0)
        refDestructuringErrors.parenthesizedBind = start
    }
    return expr

  case tt.bracketL:
    node = this.startNode()
    this.next()
    node.elements = this.parseExprList(tt.bracketR, true, true, refDestructuringErrors)
    return this.finishNode(node, "ArrayExpression")

  case tt.braceL:
    return this.parseObj(false, refDestructuringErrors)

  case tt._function:
    node = this.startNode()
    this.next()
    return this.parseFunction(node, false)

  case tt._class:
    return this.parseClass(this.startNode(), false)

  case tt._new:
    return this.parseNew()

  case tt.backQuote:
    return this.parseTemplate()

  default:
    this.unexpected()
  }
}

pp$3.parseLiteral = function(value) {
  var node = this.startNode()
  node.value = value
  node.raw = this.input.slice(this.start, this.end)
  this.next()
  return this.finishNode(node, "Literal")
}

pp$3.parseParenExpression = function() {
  this.expect(tt.parenL)
  var val = this.parseExpression()
  this.expect(tt.parenR)
  return val
}

pp$3.parseParenAndDistinguishExpression = function(canBeArrow) {
  var this$1 = this;

  var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8
  if (this.options.ecmaVersion >= 6) {
    this.next()

    var innerStartPos = this.start, innerStartLoc = this.startLoc
    var exprList = [], first = true, lastIsComma = false
    var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart, innerParenStart
    this.yieldPos = 0
    this.awaitPos = 0
    while (this.type !== tt.parenR) {
      first ? first = false : this$1.expect(tt.comma)
      if (allowTrailingComma && this$1.afterTrailingComma(tt.parenR, true)) {
        lastIsComma = true
        break
      } else if (this$1.type === tt.ellipsis) {
        spreadStart = this$1.start
        exprList.push(this$1.parseParenItem(this$1.parseRest()))
        if (this$1.type === tt.comma) this$1.raise(this$1.start, "Comma is not permitted after the rest element")
        break
      } else {
        if (this$1.type === tt.parenL && !innerParenStart) {
          innerParenStart = this$1.start
        }
        exprList.push(this$1.parseMaybeAssign(false, refDestructuringErrors, this$1.parseParenItem))
      }
    }
    var innerEndPos = this.start, innerEndLoc = this.startLoc
    this.expect(tt.parenR)

    if (canBeArrow && !this.canInsertSemicolon() && this.eat(tt.arrow)) {
      this.checkPatternErrors(refDestructuringErrors, false)
      this.checkYieldAwaitInDefaultParams()
      if (innerParenStart) this.unexpected(innerParenStart)
      this.yieldPos = oldYieldPos
      this.awaitPos = oldAwaitPos
      return this.parseParenArrowList(startPos, startLoc, exprList)
    }

    if (!exprList.length || lastIsComma) this.unexpected(this.lastTokStart)
    if (spreadStart) this.unexpected(spreadStart)
    this.checkExpressionErrors(refDestructuringErrors, true)
    this.yieldPos = oldYieldPos || this.yieldPos
    this.awaitPos = oldAwaitPos || this.awaitPos

    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc)
      val.expressions = exprList
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc)
    } else {
      val = exprList[0]
    }
  } else {
    val = this.parseParenExpression()
  }

  if (this.options.preserveParens) {
    var par = this.startNodeAt(startPos, startLoc)
    par.expression = val
    return this.finishNode(par, "ParenthesizedExpression")
  } else {
    return val
  }
}

pp$3.parseParenItem = function(item) {
  return item
}

pp$3.parseParenArrowList = function(startPos, startLoc, exprList) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList)
}

// New's precedence is slightly tricky. It must allow its argument to
// be a `[]` or dot subscript expression, but not a call — at least,
// not without wrapping it in parentheses. Thus, it uses the noCalls
// argument to parseSubscripts to prevent it from consuming the
// argument list.

var empty$1 = []

pp$3.parseNew = function() {
  var node = this.startNode()
  var meta = this.parseIdent(true)
  if (this.options.ecmaVersion >= 6 && this.eat(tt.dot)) {
    node.meta = meta
    node.property = this.parseIdent(true)
    if (node.property.name !== "target")
      this.raiseRecoverable(node.property.start, "The only valid meta property for new is new.target")
    if (!this.inFunction)
      this.raiseRecoverable(node.start, "new.target can only be used in functions")
    return this.finishNode(node, "MetaProperty")
  }
  var startPos = this.start, startLoc = this.startLoc
  node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true)
  if (this.eat(tt.parenL)) node.arguments = this.parseExprList(tt.parenR, this.options.ecmaVersion >= 8, false)
  else node.arguments = empty$1
  return this.finishNode(node, "NewExpression")
}

// Parse template expression.

pp$3.parseTemplateElement = function() {
  var elem = this.startNode()
  elem.value = {
    raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, '\n'),
    cooked: this.value
  }
  this.next()
  elem.tail = this.type === tt.backQuote
  return this.finishNode(elem, "TemplateElement")
}

pp$3.parseTemplate = function() {
  var this$1 = this;

  var node = this.startNode()
  this.next()
  node.expressions = []
  var curElt = this.parseTemplateElement()
  node.quasis = [curElt]
  while (!curElt.tail) {
    this$1.expect(tt.dollarBraceL)
    node.expressions.push(this$1.parseExpression())
    this$1.expect(tt.braceR)
    node.quasis.push(curElt = this$1.parseTemplateElement())
  }
  this.next()
  return this.finishNode(node, "TemplateLiteral")
}

// Parse an object literal or binding pattern.

pp$3.parseObj = function(isPattern, refDestructuringErrors) {
  var this$1 = this;

  var node = this.startNode(), first = true, propHash = {}
  node.properties = []
  this.next()
  while (!this.eat(tt.braceR)) {
    if (!first) {
      this$1.expect(tt.comma)
      if (this$1.afterTrailingComma(tt.braceR)) break
    } else first = false

    var prop = this$1.startNode(), isGenerator, isAsync, startPos, startLoc
    if (this$1.options.ecmaVersion >= 6) {
      prop.method = false
      prop.shorthand = false
      if (isPattern || refDestructuringErrors) {
        startPos = this$1.start
        startLoc = this$1.startLoc
      }
      if (!isPattern)
        isGenerator = this$1.eat(tt.star)
    }
    this$1.parsePropertyName(prop)
    if (!isPattern && this$1.options.ecmaVersion >= 8 && !isGenerator && !prop.computed &&
        prop.key.type === "Identifier" && prop.key.name === "async" && this$1.type !== tt.parenL &&
        this$1.type !== tt.colon && !this$1.canInsertSemicolon()) {
      isAsync = true
      this$1.parsePropertyName(prop, refDestructuringErrors)
    } else {
      isAsync = false
    }
    this$1.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors)
    this$1.checkPropClash(prop, propHash)
    node.properties.push(this$1.finishNode(prop, "Property"))
  }
  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
}

pp$3.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors) {
  if ((isGenerator || isAsync) && this.type === tt.colon)
    this.unexpected()

  if (this.eat(tt.colon)) {
    prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors)
    prop.kind = "init"
  } else if (this.options.ecmaVersion >= 6 && this.type === tt.parenL) {
    if (isPattern) this.unexpected()
    prop.kind = "init"
    prop.method = true
    prop.value = this.parseMethod(isGenerator, isAsync)
  } else if (this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
             (prop.key.name === "get" || prop.key.name === "set") &&
             (this.type != tt.comma && this.type != tt.braceR)) {
    if (isGenerator || isAsync || isPattern) this.unexpected()
    prop.kind = prop.key.name
    this.parsePropertyName(prop)
    prop.value = this.parseMethod(false)
    var paramCount = prop.kind === "get" ? 0 : 1
    if (prop.value.params.length !== paramCount) {
      var start = prop.value.start
      if (prop.kind === "get")
        this.raiseRecoverable(start, "getter should have no params")
      else
        this.raiseRecoverable(start, "setter should have exactly one param")
    } else {
      if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
        this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params")
    }
  } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
    if (this.keywords.test(prop.key.name) ||
        (this.strict ? this.reservedWordsStrict : this.reservedWords).test(prop.key.name) ||
        (this.inGenerator && prop.key.name == "yield") ||
        (this.inAsync && prop.key.name == "await"))
      this.raiseRecoverable(prop.key.start, "'" + prop.key.name + "' can not be used as shorthand property")
    prop.kind = "init"
    if (isPattern) {
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key)
    } else if (this.type === tt.eq && refDestructuringErrors) {
      if (refDestructuringErrors.shorthandAssign < 0)
        refDestructuringErrors.shorthandAssign = this.start
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key)
    } else {
      prop.value = prop.key
    }
    prop.shorthand = true
  } else this.unexpected()
}

pp$3.parsePropertyName = function(prop) {
  if (this.options.ecmaVersion >= 6) {
    if (this.eat(tt.bracketL)) {
      prop.computed = true
      prop.key = this.parseMaybeAssign()
      this.expect(tt.bracketR)
      return prop.key
    } else {
      prop.computed = false
    }
  }
  return prop.key = this.type === tt.num || this.type === tt.string ? this.parseExprAtom() : this.parseIdent(true)
}

// Initialize empty function node.

pp$3.initFunction = function(node) {
  node.id = null
  if (this.options.ecmaVersion >= 6) {
    node.generator = false
    node.expression = false
  }
  if (this.options.ecmaVersion >= 8)
    node.async = false
}

// Parse object or class method.

pp$3.parseMethod = function(isGenerator, isAsync) {
  var node = this.startNode(), oldInGen = this.inGenerator, oldInAsync = this.inAsync,
      oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldInFunc = this.inFunction

  this.initFunction(node)
  if (this.options.ecmaVersion >= 6)
    node.generator = isGenerator
  if (this.options.ecmaVersion >= 8)
    node.async = !!isAsync

  this.inGenerator = node.generator
  this.inAsync = node.async
  this.yieldPos = 0
  this.awaitPos = 0
  this.inFunction = true

  this.expect(tt.parenL)
  node.params = this.parseBindingList(tt.parenR, false, this.options.ecmaVersion >= 8)
  this.checkYieldAwaitInDefaultParams()
  this.parseFunctionBody(node, false)

  this.inGenerator = oldInGen
  this.inAsync = oldInAsync
  this.yieldPos = oldYieldPos
  this.awaitPos = oldAwaitPos
  this.inFunction = oldInFunc
  return this.finishNode(node, "FunctionExpression")
}

// Parse arrow function expression with given parameters.

pp$3.parseArrowExpression = function(node, params, isAsync) {
  var oldInGen = this.inGenerator, oldInAsync = this.inAsync,
      oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldInFunc = this.inFunction

  this.initFunction(node)
  if (this.options.ecmaVersion >= 8)
    node.async = !!isAsync

  this.inGenerator = false
  this.inAsync = node.async
  this.yieldPos = 0
  this.awaitPos = 0
  this.inFunction = true

  node.params = this.toAssignableList(params, true)
  this.parseFunctionBody(node, true)

  this.inGenerator = oldInGen
  this.inAsync = oldInAsync
  this.yieldPos = oldYieldPos
  this.awaitPos = oldAwaitPos
  this.inFunction = oldInFunc
  return this.finishNode(node, "ArrowFunctionExpression")
}

// Parse function body and check parameters.

pp$3.parseFunctionBody = function(node, isArrowFunction) {
  var isExpression = isArrowFunction && this.type !== tt.braceL
  var oldStrict = this.strict, useStrict = false

  if (isExpression) {
    node.body = this.parseMaybeAssign()
    node.expression = true
  } else {
    var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params)
    if (!oldStrict || nonSimple) {
      useStrict = this.strictDirective(this.end)
      // If this is a strict mode function, verify that argument names
      // are not repeated, and it does not try to bind the words `eval`
      // or `arguments`.
      if (useStrict && nonSimple)
        this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list")
    }
    // Start a new scope with regard to labels and the `inFunction`
    // flag (restore them to their old value afterwards).
    var oldLabels = this.labels
    this.labels = []
    if (useStrict) this.strict = true
    node.body = this.parseBlock(true)
    node.expression = false
    this.labels = oldLabels
  }

  if (oldStrict || useStrict) {
    this.strict = true
    if (node.id)
      this.checkLVal(node.id, true)
    this.checkParams(node)
    this.strict = oldStrict
  } else if (isArrowFunction || !this.isSimpleParamList(node.params)) {
    this.checkParams(node)
  }
}

pp$3.isSimpleParamList = function(params) {
  for (var i = 0; i < params.length; i++)
    if (params[i].type !== "Identifier") return false
  return true
}

// Checks function params for various disallowed patterns such as using "eval"
// or "arguments" and duplicate parameters.

pp$3.checkParams = function(node) {
  var this$1 = this;

  var nameHash = {}
  for (var i = 0; i < node.params.length; i++) this$1.checkLVal(node.params[i], true, nameHash)
}

// Parses a comma-separated list of expressions, and returns them as
// an array. `close` is the token type that ends the list, and
// `allowEmpty` can be turned on to allow subsequent commas with
// nothing in between them to be parsed as `null` (which is needed
// for array literals).

pp$3.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
  var this$1 = this;

  var elts = [], first = true
  while (!this.eat(close)) {
    if (!first) {
      this$1.expect(tt.comma)
      if (allowTrailingComma && this$1.afterTrailingComma(close)) break
    } else first = false

    var elt
    if (allowEmpty && this$1.type === tt.comma)
      elt = null
    else if (this$1.type === tt.ellipsis) {
      elt = this$1.parseSpread(refDestructuringErrors)
      if (refDestructuringErrors && this$1.type === tt.comma && refDestructuringErrors.trailingComma < 0)
        refDestructuringErrors.trailingComma = this$1.start
    } else {
      elt = this$1.parseMaybeAssign(false, refDestructuringErrors)
    }
    elts.push(elt)
  }
  return elts
}

// Parse the next token as an identifier. If `liberal` is true (used
// when parsing properties), it will also convert keywords into
// identifiers.

pp$3.parseIdent = function(liberal) {
  var node = this.startNode()
  if (liberal && this.options.allowReserved == "never") liberal = false
  if (this.type === tt.name) {
    if (!liberal && (this.strict ? this.reservedWordsStrict : this.reservedWords).test(this.value) &&
        (this.options.ecmaVersion >= 6 ||
         this.input.slice(this.start, this.end).indexOf("\\") == -1))
      this.raiseRecoverable(this.start, "The keyword '" + this.value + "' is reserved")
    if (this.inGenerator && this.value === "yield")
      this.raiseRecoverable(this.start, "Can not use 'yield' as identifier inside a generator")
    if (this.inAsync && this.value === "await")
      this.raiseRecoverable(this.start, "Can not use 'await' as identifier inside an async function")
    node.name = this.value
  } else if (liberal && this.type.keyword) {
    node.name = this.type.keyword
  } else {
    this.unexpected()
  }
  this.next()
  return this.finishNode(node, "Identifier")
}

// Parses yield expression inside generator.

pp$3.parseYield = function() {
  if (!this.yieldPos) this.yieldPos = this.start

  var node = this.startNode()
  this.next()
  if (this.type == tt.semi || this.canInsertSemicolon() || (this.type != tt.star && !this.type.startsExpr)) {
    node.delegate = false
    node.argument = null
  } else {
    node.delegate = this.eat(tt.star)
    node.argument = this.parseMaybeAssign()
  }
  return this.finishNode(node, "YieldExpression")
}

pp$3.parseAwait = function() {
  if (!this.awaitPos) this.awaitPos = this.start

  var node = this.startNode()
  this.next()
  node.argument = this.parseMaybeUnary(null, true)
  return this.finishNode(node, "AwaitExpression")
}

var pp$4 = Parser.prototype

// This function is used to raise exceptions on parse errors. It
// takes an offset integer (into the current `input`) to indicate
// the location of the error, attaches the position to the end
// of the error message, and then raises a `SyntaxError` with that
// message.

pp$4.raise = function(pos, message) {
  var loc = getLineInfo(this.input, pos)
  message += " (" + loc.line + ":" + loc.column + ")"
  var err = new SyntaxError(message)
  err.pos = pos; err.loc = loc; err.raisedAt = this.pos
  throw err
}

pp$4.raiseRecoverable = pp$4.raise

pp$4.curPosition = function() {
  if (this.options.locations) {
    return new Position(this.curLine, this.pos - this.lineStart)
  }
}

var Node = function Node(parser, pos, loc) {
  this.type = ""
  this.start = pos
  this.end = 0
  if (parser.options.locations)
    this.loc = new SourceLocation(parser, loc)
  if (parser.options.directSourceFile)
    this.sourceFile = parser.options.directSourceFile
  if (parser.options.ranges)
    this.range = [pos, 0]
};

// Start an AST node, attaching a start offset.

var pp$5 = Parser.prototype

pp$5.startNode = function() {
  return new Node(this, this.start, this.startLoc)
}

pp$5.startNodeAt = function(pos, loc) {
  return new Node(this, pos, loc)
}

// Finish an AST node, adding `type` and `end` properties.

function finishNodeAt(node, type, pos, loc) {
  node.type = type
  node.end = pos
  if (this.options.locations)
    node.loc.end = loc
  if (this.options.ranges)
    node.range[1] = pos
  return node
}

pp$5.finishNode = function(node, type) {
  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
}

// Finish node at given position

pp$5.finishNodeAt = function(node, type, pos, loc) {
  return finishNodeAt.call(this, node, type, pos, loc)
}

// The algorithm used to determine whether a regexp can appear at a
// given point in the program is loosely based on sweet.js' approach.
// See https://github.com/mozilla/sweet.js/wiki/design

var TokContext = function TokContext(token, isExpr, preserveSpace, override) {
  this.token = token
  this.isExpr = !!isExpr
  this.preserveSpace = !!preserveSpace
  this.override = override
};

var types = {
  b_stat: new TokContext("{", false),
  b_expr: new TokContext("{", true),
  b_tmpl: new TokContext("${", true),
  p_stat: new TokContext("(", false),
  p_expr: new TokContext("(", true),
  q_tmpl: new TokContext("`", true, true, function (p) { return p.readTmplToken(); }),
  f_expr: new TokContext("function", true)
}

var pp$6 = Parser.prototype

pp$6.initialContext = function() {
  return [types.b_stat]
}

pp$6.braceIsBlock = function(prevType) {
  if (prevType === tt.colon) {
    var parent = this.curContext()
    if (parent === types.b_stat || parent === types.b_expr)
      return !parent.isExpr
  }
  if (prevType === tt._return)
    return lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
  if (prevType === tt._else || prevType === tt.semi || prevType === tt.eof || prevType === tt.parenR)
    return true
  if (prevType == tt.braceL)
    return this.curContext() === types.b_stat
  return !this.exprAllowed
}

pp$6.updateContext = function(prevType) {
  var update, type = this.type
  if (type.keyword && prevType == tt.dot)
    this.exprAllowed = false
  else if (update = type.updateContext)
    update.call(this, prevType)
  else
    this.exprAllowed = type.beforeExpr
}

// Token-specific context update code

tt.parenR.updateContext = tt.braceR.updateContext = function() {
  if (this.context.length == 1) {
    this.exprAllowed = true
    return
  }
  var out = this.context.pop()
  if (out === types.b_stat && this.curContext() === types.f_expr) {
    this.context.pop()
    this.exprAllowed = false
  } else if (out === types.b_tmpl) {
    this.exprAllowed = true
  } else {
    this.exprAllowed = !out.isExpr
  }
}

tt.braceL.updateContext = function(prevType) {
  this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr)
  this.exprAllowed = true
}

tt.dollarBraceL.updateContext = function() {
  this.context.push(types.b_tmpl)
  this.exprAllowed = true
}

tt.parenL.updateContext = function(prevType) {
  var statementParens = prevType === tt._if || prevType === tt._for || prevType === tt._with || prevType === tt._while
  this.context.push(statementParens ? types.p_stat : types.p_expr)
  this.exprAllowed = true
}

tt.incDec.updateContext = function() {
  // tokExprAllowed stays unchanged
}

tt._function.updateContext = function(prevType) {
  if (prevType.beforeExpr && prevType !== tt.semi && prevType !== tt._else &&
      !((prevType === tt.colon || prevType === tt.braceL) && this.curContext() === types.b_stat))
    this.context.push(types.f_expr)
  this.exprAllowed = false
}

tt.backQuote.updateContext = function() {
  if (this.curContext() === types.q_tmpl)
    this.context.pop()
  else
    this.context.push(types.q_tmpl)
  this.exprAllowed = false
}

// Object type used to represent tokens. Note that normally, tokens
// simply exist as properties on the parser object. This is only
// used for the onToken callback and the external tokenizer.

var Token = function Token(p) {
  this.type = p.type
  this.value = p.value
  this.start = p.start
  this.end = p.end
  if (p.options.locations)
    this.loc = new SourceLocation(p, p.startLoc, p.endLoc)
  if (p.options.ranges)
    this.range = [p.start, p.end]
};

// ## Tokenizer

var pp$7 = Parser.prototype

// Are we running under Rhino?
var isRhino = typeof Packages == "object" && Object.prototype.toString.call(Packages) == "[object JavaPackage]"

// Move to the next token

pp$7.next = function() {
  if (this.options.onToken)
    this.options.onToken(new Token(this))

  this.lastTokEnd = this.end
  this.lastTokStart = this.start
  this.lastTokEndLoc = this.endLoc
  this.lastTokStartLoc = this.startLoc
  this.nextToken()
}

pp$7.getToken = function() {
  this.next()
  return new Token(this)
}

// If we're in an ES6 environment, make parsers iterable
if (typeof Symbol !== "undefined")
  pp$7[Symbol.iterator] = function () {
    var self = this
    return {next: function () {
      var token = self.getToken()
      return {
        done: token.type === tt.eof,
        value: token
      }
    }}
  }

// Toggle strict mode. Re-reads the next number or string to please
// pedantic tests (`"use strict"; 010;` should fail).

pp$7.curContext = function() {
  return this.context[this.context.length - 1]
}

// Read a single token, updating the parser object's token-related
// properties.

pp$7.nextToken = function() {
  var curContext = this.curContext()
  if (!curContext || !curContext.preserveSpace) this.skipSpace()

  this.start = this.pos
  if (this.options.locations) this.startLoc = this.curPosition()
  if (this.pos >= this.input.length) return this.finishToken(tt.eof)

  if (curContext.override) return curContext.override(this)
  else this.readToken(this.fullCharCodeAtPos())
}

pp$7.readToken = function(code) {
  // Identifier or keyword. '\uXXXX' sequences are allowed in
  // identifiers, so '\' also dispatches to that.
  if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
    return this.readWord()

  return this.getTokenFromCode(code)
}

pp$7.fullCharCodeAtPos = function() {
  var code = this.input.charCodeAt(this.pos)
  if (code <= 0xd7ff || code >= 0xe000) return code
  var next = this.input.charCodeAt(this.pos + 1)
  return (code << 10) + next - 0x35fdc00
}

pp$7.skipBlockComment = function() {
  var this$1 = this;

  var startLoc = this.options.onComment && this.curPosition()
  var start = this.pos, end = this.input.indexOf("*/", this.pos += 2)
  if (end === -1) this.raise(this.pos - 2, "Unterminated comment")
  this.pos = end + 2
  if (this.options.locations) {
    lineBreakG.lastIndex = start
    var match
    while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
      ++this$1.curLine
      this$1.lineStart = match.index + match[0].length
    }
  }
  if (this.options.onComment)
    this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                           startLoc, this.curPosition())
}

pp$7.skipLineComment = function(startSkip) {
  var this$1 = this;

  var start = this.pos
  var startLoc = this.options.onComment && this.curPosition()
  var ch = this.input.charCodeAt(this.pos+=startSkip)
  while (this.pos < this.input.length && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
    ++this$1.pos
    ch = this$1.input.charCodeAt(this$1.pos)
  }
  if (this.options.onComment)
    this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                           startLoc, this.curPosition())
}

// Called at the start of the parse and after every token. Skips
// whitespace and comments, and.

pp$7.skipSpace = function() {
  var this$1 = this;

  loop: while (this.pos < this.input.length) {
    var ch = this$1.input.charCodeAt(this$1.pos)
    switch (ch) {
      case 32: case 160: // ' '
        ++this$1.pos
        break
      case 13:
        if (this$1.input.charCodeAt(this$1.pos + 1) === 10) {
          ++this$1.pos
        }
      case 10: case 8232: case 8233:
        ++this$1.pos
        if (this$1.options.locations) {
          ++this$1.curLine
          this$1.lineStart = this$1.pos
        }
        break
      case 47: // '/'
        switch (this$1.input.charCodeAt(this$1.pos + 1)) {
          case 42: // '*'
            this$1.skipBlockComment()
            break
          case 47:
            this$1.skipLineComment(2)
            break
          default:
            break loop
        }
        break
      default:
        if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
          ++this$1.pos
        } else {
          break loop
        }
    }
  }
}

// Called at the end of every token. Sets `end`, `val`, and
// maintains `context` and `exprAllowed`, and skips the space after
// the token, so that the next one's `start` will point at the
// right position.

pp$7.finishToken = function(type, val) {
  this.end = this.pos
  if (this.options.locations) this.endLoc = this.curPosition()
  var prevType = this.type
  this.type = type
  this.value = val

  this.updateContext(prevType)
}

// ### Token reading

// This is the function that is called to fetch the next token. It
// is somewhat obscure, because it works in character codes rather
// than characters, and because operator parsing has been inlined
// into it.
//
// All in the name of speed.
//
pp$7.readToken_dot = function() {
  var next = this.input.charCodeAt(this.pos + 1)
  if (next >= 48 && next <= 57) return this.readNumber(true)
  var next2 = this.input.charCodeAt(this.pos + 2)
  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
    this.pos += 3
    return this.finishToken(tt.ellipsis)
  } else {
    ++this.pos
    return this.finishToken(tt.dot)
  }
}

pp$7.readToken_slash = function() { // '/'
  var next = this.input.charCodeAt(this.pos + 1)
  if (this.exprAllowed) {++this.pos; return this.readRegexp()}
  if (next === 61) return this.finishOp(tt.assign, 2)
  return this.finishOp(tt.slash, 1)
}

pp$7.readToken_mult_modulo_exp = function(code) { // '%*'
  var next = this.input.charCodeAt(this.pos + 1)
  var size = 1
  var tokentype = code === 42 ? tt.star : tt.modulo

  // exponentiation operator ** and **=
  if (this.options.ecmaVersion >= 7 && next === 42) {
    ++size
    tokentype = tt.starstar
    next = this.input.charCodeAt(this.pos + 2)
  }

  if (next === 61) return this.finishOp(tt.assign, size + 1)
  return this.finishOp(tokentype, size)
}

pp$7.readToken_pipe_amp = function(code) { // '|&'
  var next = this.input.charCodeAt(this.pos + 1)
  if (next === code) return this.finishOp(code === 124 ? tt.logicalOR : tt.logicalAND, 2)
  if (next === 61) return this.finishOp(tt.assign, 2)
  return this.finishOp(code === 124 ? tt.bitwiseOR : tt.bitwiseAND, 1)
}

pp$7.readToken_caret = function() { // '^'
  var next = this.input.charCodeAt(this.pos + 1)
  if (next === 61) return this.finishOp(tt.assign, 2)
  return this.finishOp(tt.bitwiseXOR, 1)
}

pp$7.readToken_plus_min = function(code) { // '+-'
  var next = this.input.charCodeAt(this.pos + 1)
  if (next === code) {
    if (next == 45 && this.input.charCodeAt(this.pos + 2) == 62 &&
        lineBreak.test(this.input.slice(this.lastTokEnd, this.pos))) {
      // A `-->` line comment
      this.skipLineComment(3)
      this.skipSpace()
      return this.nextToken()
    }
    return this.finishOp(tt.incDec, 2)
  }
  if (next === 61) return this.finishOp(tt.assign, 2)
  return this.finishOp(tt.plusMin, 1)
}

pp$7.readToken_lt_gt = function(code) { // '<>'
  var next = this.input.charCodeAt(this.pos + 1)
  var size = 1
  if (next === code) {
    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2
    if (this.input.charCodeAt(this.pos + size) === 61) return this.finishOp(tt.assign, size + 1)
    return this.finishOp(tt.bitShift, size)
  }
  if (next == 33 && code == 60 && this.input.charCodeAt(this.pos + 2) == 45 &&
      this.input.charCodeAt(this.pos + 3) == 45) {
    if (this.inModule) this.unexpected()
    // `<!--`, an XML-style comment that should be interpreted as a line comment
    this.skipLineComment(4)
    this.skipSpace()
    return this.nextToken()
  }
  if (next === 61) size = 2
  return this.finishOp(tt.relational, size)
}

pp$7.readToken_eq_excl = function(code) { // '=!'
  var next = this.input.charCodeAt(this.pos + 1)
  if (next === 61) return this.finishOp(tt.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2)
  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
    this.pos += 2
    return this.finishToken(tt.arrow)
  }
  return this.finishOp(code === 61 ? tt.eq : tt.prefix, 1)
}

pp$7.getTokenFromCode = function(code) {
  switch (code) {
    // The interpretation of a dot depends on whether it is followed
    // by a digit or another two dots.
  case 46: // '.'
    return this.readToken_dot()

    // Punctuation tokens.
  case 40: ++this.pos; return this.finishToken(tt.parenL)
  case 41: ++this.pos; return this.finishToken(tt.parenR)
  case 59: ++this.pos; return this.finishToken(tt.semi)
  case 44: ++this.pos; return this.finishToken(tt.comma)
  case 91: ++this.pos; return this.finishToken(tt.bracketL)
  case 93: ++this.pos; return this.finishToken(tt.bracketR)
  case 123: ++this.pos; return this.finishToken(tt.braceL)
  case 125: ++this.pos; return this.finishToken(tt.braceR)
  case 58: ++this.pos; return this.finishToken(tt.colon)
  case 63: ++this.pos; return this.finishToken(tt.question)

  case 96: // '`'
    if (this.options.ecmaVersion < 6) break
    ++this.pos
    return this.finishToken(tt.backQuote)

  case 48: // '0'
    var next = this.input.charCodeAt(this.pos + 1)
    if (next === 120 || next === 88) return this.readRadixNumber(16) // '0x', '0X' - hex number
    if (this.options.ecmaVersion >= 6) {
      if (next === 111 || next === 79) return this.readRadixNumber(8) // '0o', '0O' - octal number
      if (next === 98 || next === 66) return this.readRadixNumber(2) // '0b', '0B' - binary number
    }
    // Anything else beginning with a digit is an integer, octal
    // number, or float.
  case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
    return this.readNumber(false)

    // Quotes produce strings.
  case 34: case 39: // '"', "'"
    return this.readString(code)

    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.

  case 47: // '/'
    return this.readToken_slash()

  case 37: case 42: // '%*'
    return this.readToken_mult_modulo_exp(code)

  case 124: case 38: // '|&'
    return this.readToken_pipe_amp(code)

  case 94: // '^'
    return this.readToken_caret()

  case 43: case 45: // '+-'
    return this.readToken_plus_min(code)

  case 60: case 62: // '<>'
    return this.readToken_lt_gt(code)

  case 61: case 33: // '=!'
    return this.readToken_eq_excl(code)

  case 126: // '~'
    return this.finishOp(tt.prefix, 1)
  }

  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'")
}

pp$7.finishOp = function(type, size) {
  var str = this.input.slice(this.pos, this.pos + size)
  this.pos += size
  return this.finishToken(type, str)
}

// Parse a regular expression. Some context-awareness is necessary,
// since a '/' inside a '[]' set does not end the expression.

function tryCreateRegexp(src, flags, throwErrorAt, parser) {
  try {
    return new RegExp(src, flags)
  } catch (e) {
    if (throwErrorAt !== undefined) {
      if (e instanceof SyntaxError) parser.raise(throwErrorAt, "Error parsing regular expression: " + e.message)
      throw e
    }
  }
}

var regexpUnicodeSupport = !!tryCreateRegexp("\uffff", "u")

pp$7.readRegexp = function() {
  var this$1 = this;

  var escaped, inClass, start = this.pos
  for (;;) {
    if (this$1.pos >= this$1.input.length) this$1.raise(start, "Unterminated regular expression")
    var ch = this$1.input.charAt(this$1.pos)
    if (lineBreak.test(ch)) this$1.raise(start, "Unterminated regular expression")
    if (!escaped) {
      if (ch === "[") inClass = true
      else if (ch === "]" && inClass) inClass = false
      else if (ch === "/" && !inClass) break
      escaped = ch === "\\"
    } else escaped = false
    ++this$1.pos
  }
  var content = this.input.slice(start, this.pos)
  ++this.pos
  // Need to use `readWord1` because '\uXXXX' sequences are allowed
  // here (don't ask).
  var mods = this.readWord1()
  var tmp = content, tmpFlags = ""
  if (mods) {
    var validFlags = /^[gim]*$/
    if (this.options.ecmaVersion >= 6) validFlags = /^[gimuy]*$/
    if (!validFlags.test(mods)) this.raise(start, "Invalid regular expression flag")
    if (mods.indexOf("u") >= 0) {
      if (regexpUnicodeSupport) {
        tmpFlags = "u"
      } else {
        // Replace each astral symbol and every Unicode escape sequence that
        // possibly represents an astral symbol or a paired surrogate with a
        // single ASCII symbol to avoid throwing on regular expressions that
        // are only valid in combination with the `/u` flag.
        // Note: replacing with the ASCII symbol `x` might cause false
        // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
        // perfectly valid pattern that is equivalent to `[a-b]`, but it would
        // be replaced by `[x-b]` which throws an error.
        tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}/g, function (_match, code, offset) {
          code = Number("0x" + code)
          if (code > 0x10FFFF) this$1.raise(start + offset + 3, "Code point out of bounds")
          return "x"
        })
        tmp = tmp.replace(/\\u([a-fA-F0-9]{4})|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x")
        tmpFlags = tmpFlags.replace("u", "")
      }
    }
  }
  // Detect invalid regular expressions.
  var value = null
  // Rhino's regular expression parser is flaky and throws uncatchable exceptions,
  // so don't do detection if we are running under Rhino
  if (!isRhino) {
    tryCreateRegexp(tmp, tmpFlags, start, this)
    // Get a regular expression object for this pattern-flag pair, or `null` in
    // case the current environment doesn't support the flags it uses.
    value = tryCreateRegexp(content, mods)
  }
  return this.finishToken(tt.regexp, {pattern: content, flags: mods, value: value})
}

// Read an integer in the given radix. Return null if zero digits
// were read, the integer value otherwise. When `len` is given, this
// will return `null` unless the integer has exactly `len` digits.

pp$7.readInt = function(radix, len) {
  var this$1 = this;

  var start = this.pos, total = 0
  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
    var code = this$1.input.charCodeAt(this$1.pos), val
    if (code >= 97) val = code - 97 + 10 // a
    else if (code >= 65) val = code - 65 + 10 // A
    else if (code >= 48 && code <= 57) val = code - 48 // 0-9
    else val = Infinity
    if (val >= radix) break
    ++this$1.pos
    total = total * radix + val
  }
  if (this.pos === start || len != null && this.pos - start !== len) return null

  return total
}

pp$7.readRadixNumber = function(radix) {
  this.pos += 2 // 0x
  var val = this.readInt(radix)
  if (val == null) this.raise(this.start + 2, "Expected number in radix " + radix)
  if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number")
  return this.finishToken(tt.num, val)
}

// Read an integer, octal integer, or floating-point number.

pp$7.readNumber = function(startsWithDot) {
  var start = this.pos, isFloat = false, octal = this.input.charCodeAt(this.pos) === 48
  if (!startsWithDot && this.readInt(10) === null) this.raise(start, "Invalid number")
  if (octal && this.pos == start + 1) octal = false
  var next = this.input.charCodeAt(this.pos)
  if (next === 46 && !octal) { // '.'
    ++this.pos
    this.readInt(10)
    isFloat = true
    next = this.input.charCodeAt(this.pos)
  }
  if ((next === 69 || next === 101) && !octal) { // 'eE'
    next = this.input.charCodeAt(++this.pos)
    if (next === 43 || next === 45) ++this.pos // '+-'
    if (this.readInt(10) === null) this.raise(start, "Invalid number")
    isFloat = true
  }
  if (isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number")

  var str = this.input.slice(start, this.pos), val
  if (isFloat) val = parseFloat(str)
  else if (!octal || str.length === 1) val = parseInt(str, 10)
  else if (/[89]/.test(str) || this.strict) this.raise(start, "Invalid number")
  else val = parseInt(str, 8)
  return this.finishToken(tt.num, val)
}

// Read a string value, interpreting backslash-escapes.

pp$7.readCodePoint = function() {
  var ch = this.input.charCodeAt(this.pos), code

  if (ch === 123) {
    if (this.options.ecmaVersion < 6) this.unexpected()
    var codePos = ++this.pos
    code = this.readHexChar(this.input.indexOf('}', this.pos) - this.pos)
    ++this.pos
    if (code > 0x10FFFF) this.raise(codePos, "Code point out of bounds")
  } else {
    code = this.readHexChar(4)
  }
  return code
}

function codePointToString(code) {
  // UTF-16 Decoding
  if (code <= 0xFFFF) return String.fromCharCode(code)
  code -= 0x10000
  return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
}

pp$7.readString = function(quote) {
  var this$1 = this;

  var out = "", chunkStart = ++this.pos
  for (;;) {
    if (this$1.pos >= this$1.input.length) this$1.raise(this$1.start, "Unterminated string constant")
    var ch = this$1.input.charCodeAt(this$1.pos)
    if (ch === quote) break
    if (ch === 92) { // '\'
      out += this$1.input.slice(chunkStart, this$1.pos)
      out += this$1.readEscapedChar(false)
      chunkStart = this$1.pos
    } else {
      if (isNewLine(ch)) this$1.raise(this$1.start, "Unterminated string constant")
      ++this$1.pos
    }
  }
  out += this.input.slice(chunkStart, this.pos++)
  return this.finishToken(tt.string, out)
}

// Reads template string tokens.

pp$7.readTmplToken = function() {
  var this$1 = this;

  var out = "", chunkStart = this.pos
  for (;;) {
    if (this$1.pos >= this$1.input.length) this$1.raise(this$1.start, "Unterminated template")
    var ch = this$1.input.charCodeAt(this$1.pos)
    if (ch === 96 || ch === 36 && this$1.input.charCodeAt(this$1.pos + 1) === 123) { // '`', '${'
      if (this$1.pos === this$1.start && this$1.type === tt.template) {
        if (ch === 36) {
          this$1.pos += 2
          return this$1.finishToken(tt.dollarBraceL)
        } else {
          ++this$1.pos
          return this$1.finishToken(tt.backQuote)
        }
      }
      out += this$1.input.slice(chunkStart, this$1.pos)
      return this$1.finishToken(tt.template, out)
    }
    if (ch === 92) { // '\'
      out += this$1.input.slice(chunkStart, this$1.pos)
      out += this$1.readEscapedChar(true)
      chunkStart = this$1.pos
    } else if (isNewLine(ch)) {
      out += this$1.input.slice(chunkStart, this$1.pos)
      ++this$1.pos
      switch (ch) {
        case 13:
          if (this$1.input.charCodeAt(this$1.pos) === 10) ++this$1.pos
        case 10:
          out += "\n"
          break
        default:
          out += String.fromCharCode(ch)
          break
      }
      if (this$1.options.locations) {
        ++this$1.curLine
        this$1.lineStart = this$1.pos
      }
      chunkStart = this$1.pos
    } else {
      ++this$1.pos
    }
  }
}

// Used to read escaped characters

pp$7.readEscapedChar = function(inTemplate) {
  var ch = this.input.charCodeAt(++this.pos)
  ++this.pos
  switch (ch) {
  case 110: return "\n" // 'n' -> '\n'
  case 114: return "\r" // 'r' -> '\r'
  case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
  case 117: return codePointToString(this.readCodePoint()) // 'u'
  case 116: return "\t" // 't' -> '\t'
  case 98: return "\b" // 'b' -> '\b'
  case 118: return "\u000b" // 'v' -> '\u000b'
  case 102: return "\f" // 'f' -> '\f'
  case 13: if (this.input.charCodeAt(this.pos) === 10) ++this.pos // '\r\n'
  case 10: // ' \n'
    if (this.options.locations) { this.lineStart = this.pos; ++this.curLine }
    return ""
  default:
    if (ch >= 48 && ch <= 55) {
      var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0]
      var octal = parseInt(octalStr, 8)
      if (octal > 255) {
        octalStr = octalStr.slice(0, -1)
        octal = parseInt(octalStr, 8)
      }
      if (octalStr !== "0" && (this.strict || inTemplate)) {
        this.raise(this.pos - 2, "Octal literal in strict mode")
      }
      this.pos += octalStr.length - 1
      return String.fromCharCode(octal)
    }
    return String.fromCharCode(ch)
  }
}

// Used to read character escape sequences ('\x', '\u', '\U').

pp$7.readHexChar = function(len) {
  var codePos = this.pos
  var n = this.readInt(16, len)
  if (n === null) this.raise(codePos, "Bad character escape sequence")
  return n
}

// Read an identifier, and return it as a string. Sets `this.containsEsc`
// to whether the word contained a '\u' escape.
//
// Incrementally adds only escaped chars, adding other chunks as-is
// as a micro-optimization.

pp$7.readWord1 = function() {
  var this$1 = this;

  this.containsEsc = false
  var word = "", first = true, chunkStart = this.pos
  var astral = this.options.ecmaVersion >= 6
  while (this.pos < this.input.length) {
    var ch = this$1.fullCharCodeAtPos()
    if (isIdentifierChar(ch, astral)) {
      this$1.pos += ch <= 0xffff ? 1 : 2
    } else if (ch === 92) { // "\"
      this$1.containsEsc = true
      word += this$1.input.slice(chunkStart, this$1.pos)
      var escStart = this$1.pos
      if (this$1.input.charCodeAt(++this$1.pos) != 117) // "u"
        this$1.raise(this$1.pos, "Expecting Unicode escape sequence \\uXXXX")
      ++this$1.pos
      var esc = this$1.readCodePoint()
      if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
        this$1.raise(escStart, "Invalid Unicode escape")
      word += codePointToString(esc)
      chunkStart = this$1.pos
    } else {
      break
    }
    first = false
  }
  return word + this.input.slice(chunkStart, this.pos)
}

// Read an identifier or keyword token. Will check for reserved
// words when necessary.

pp$7.readWord = function() {
  var word = this.readWord1()
  var type = tt.name
  if (this.keywords.test(word)) {
    if (this.containsEsc) this.raiseRecoverable(this.start, "Escape sequence in keyword " + word)
    type = keywordTypes[word]
  }
  return this.finishToken(type, word)
}

// Acorn is a tiny, fast JavaScript parser written in JavaScript.
//
// Acorn was written by Marijn Haverbeke, Ingvar Stepanyan, and
// various contributors and released under an MIT license.
//
// Git repositories for Acorn are available at
//
//     http://marijnhaverbeke.nl/git/acorn
//     https://github.com/ternjs/acorn.git
//
// Please use the [github bug tracker][ghbt] to report issues.
//
// [ghbt]: https://github.com/ternjs/acorn/issues
//
// This file defines the main parser interface. The library also comes
// with a [error-tolerant parser][dammit] and an
// [abstract syntax tree walker][walk], defined in other files.
//
// [dammit]: acorn_loose.js
// [walk]: util/walk.js

var version = "4.0.11"

// The main exported interface (under `self.acorn` when in the
// browser) is a `parse` function that takes a code string and
// returns an abstract syntax tree as specified by [Mozilla parser
// API][api].
//
// [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

function parse(input, options) {
  return new Parser(options, input).parse()
}

// This function tries to parse a single expression at a given
// offset in a string. Useful for parsing mixed-language formats
// that embed JavaScript expressions.

function parseExpressionAt(input, pos, options) {
  var p = new Parser(options, input, pos)
  p.nextToken()
  return p.parseExpression()
}

// Acorn is organized as a tokenizer and a recursive-descent parser.
// The `tokenizer` export provides an interface to the tokenizer.

function tokenizer(input, options) {
  return new Parser(options, input)
}

// This is a terrible kludge to support the existing, pre-ES6
// interface where the loose parser module retroactively adds exports
// to this module.
function addLooseExports(parse, Parser, plugins) {
  exports.parse_dammit = parse
  exports.LooseParser = Parser
  exports.pluginsLoose = plugins
}

exports.version = version;
exports.parse = parse;
exports.parseExpressionAt = parseExpressionAt;
exports.tokenizer = tokenizer;
exports.addLooseExports = addLooseExports;
exports.Parser = Parser;
exports.plugins = plugins;
exports.defaultOptions = defaultOptions;
exports.Position = Position;
exports.SourceLocation = SourceLocation;
exports.getLineInfo = getLineInfo;
exports.Node = Node;
exports.TokenType = TokenType;
exports.tokTypes = tt;
exports.keywordTypes = keywordTypes;
exports.TokContext = TokContext;
exports.tokContexts = types;
exports.isIdentifierChar = isIdentifierChar;
exports.isIdentifierStart = isIdentifierStart;
exports.Token = Token;
exports.isNewLine = isNewLine;
exports.lineBreak = lineBreak;
exports.lineBreakG = lineBreakG;

Object.defineProperty(exports, '__esModule', { value: true });

})));
},{}],44:[function(require,module,exports){
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
  typeof define === 'function' && define.amd ? define(['exports'], factory) :
  (factory((global.acorn = global.acorn || {}, global.acorn.walk = global.acorn.walk || {})));
}(this, (function (exports) { 'use strict';

// AST walker module for Mozilla Parser API compatible trees

// A simple walk is one where you simply specify callbacks to be
// called on specific nodes. The last two arguments are optional. A
// simple use would be
//
//     walk.simple(myTree, {
//         Expression: function(node) { ... }
//     });
//
// to do something with all expressions. All Parser API node types
// can be used to identify node types, as well as Expression,
// Statement, and ScopeBody, which denote categories of nodes.
//
// The base argument can be used to pass a custom (recursive)
// walker, and state can be used to give this walked an initial
// state.

function simple(node, visitors, base, state, override) {
  if (!base) base = exports.base
  ;(function c(node, st, override) {
    var type = override || node.type, found = visitors[type]
    base[type](node, st, c)
    if (found) found(node, st)
  })(node, state, override)
}

// An ancestor walk keeps an array of ancestor nodes (including the
// current node) and passes them to the callback as third parameter
// (and also as state parameter when no other state is present).
function ancestor(node, visitors, base, state) {
  if (!base) base = exports.base
  var ancestors = []
  ;(function c(node, st, override) {
    var type = override || node.type, found = visitors[type]
    var isNew = node != ancestors[ancestors.length - 1]
    if (isNew) ancestors.push(node)
    base[type](node, st, c)
    if (found) found(node, st || ancestors, ancestors)
    if (isNew) ancestors.pop()
  })(node, state)
}

// A recursive walk is one where your functions override the default
// walkers. They can modify and replace the state parameter that's
// threaded through the walk, and can opt how and whether to walk
// their child nodes (by calling their third argument on these
// nodes).
function recursive(node, state, funcs, base, override) {
  var visitor = funcs ? exports.make(funcs, base) : base
  ;(function c(node, st, override) {
    visitor[override || node.type](node, st, c)
  })(node, state, override)
}

function makeTest(test) {
  if (typeof test == "string")
    return function (type) { return type == test; }
  else if (!test)
    return function () { return true; }
  else
    return test
}

var Found = function Found(node, state) { this.node = node; this.state = state };

// Find a node with a given start, end, and type (all are optional,
// null can be used as wildcard). Returns a {node, state} object, or
// undefined when it doesn't find a matching node.
function findNodeAt(node, start, end, test, base, state) {
  test = makeTest(test)
  if (!base) base = exports.base
  try {
    ;(function c(node, st, override) {
      var type = override || node.type
      if ((start == null || node.start <= start) &&
          (end == null || node.end >= end))
        base[type](node, st, c)
      if ((start == null || node.start == start) &&
          (end == null || node.end == end) &&
          test(type, node))
        throw new Found(node, st)
    })(node, state)
  } catch (e) {
    if (e instanceof Found) return e
    throw e
  }
}

// Find the innermost node of a given type that contains the given
// position. Interface similar to findNodeAt.
function findNodeAround(node, pos, test, base, state) {
  test = makeTest(test)
  if (!base) base = exports.base
  try {
    ;(function c(node, st, override) {
      var type = override || node.type
      if (node.start > pos || node.end < pos) return
      base[type](node, st, c)
      if (test(type, node)) throw new Found(node, st)
    })(node, state)
  } catch (e) {
    if (e instanceof Found) return e
    throw e
  }
}

// Find the outermost matching node after a given position.
function findNodeAfter(node, pos, test, base, state) {
  test = makeTest(test)
  if (!base) base = exports.base
  try {
    ;(function c(node, st, override) {
      if (node.end < pos) return
      var type = override || node.type
      if (node.start >= pos && test(type, node)) throw new Found(node, st)
      base[type](node, st, c)
    })(node, state)
  } catch (e) {
    if (e instanceof Found) return e
    throw e
  }
}

// Find the outermost matching node before a given position.
function findNodeBefore(node, pos, test, base, state) {
  test = makeTest(test)
  if (!base) base = exports.base
  var max
  ;(function c(node, st, override) {
    if (node.start > pos) return
    var type = override || node.type
    if (node.end <= pos && (!max || max.node.end < node.end) && test(type, node))
      max = new Found(node, st)
    base[type](node, st, c)
  })(node, state)
  return max
}

// Fallback to an Object.create polyfill for older environments.
var create = Object.create || function(proto) {
  function Ctor() {}
  Ctor.prototype = proto
  return new Ctor
}

// Used to create a custom walker. Will fill in all missing node
// type properties with the defaults.
function make(funcs, base) {
  if (!base) base = exports.base
  var visitor = create(base)
  for (var type in funcs) visitor[type] = funcs[type]
  return visitor
}

function skipThrough(node, st, c) { c(node, st) }
function ignore(_node, _st, _c) {}

// Node walkers.

var base = {}

base.Program = base.BlockStatement = function (node, st, c) {
  for (var i = 0; i < node.body.length; ++i)
    c(node.body[i], st, "Statement")
}
base.Statement = skipThrough
base.EmptyStatement = ignore
base.ExpressionStatement = base.ParenthesizedExpression =
  function (node, st, c) { return c(node.expression, st, "Expression"); }
base.IfStatement = function (node, st, c) {
  c(node.test, st, "Expression")
  c(node.consequent, st, "Statement")
  if (node.alternate) c(node.alternate, st, "Statement")
}
base.LabeledStatement = function (node, st, c) { return c(node.body, st, "Statement"); }
base.BreakStatement = base.ContinueStatement = ignore
base.WithStatement = function (node, st, c) {
  c(node.object, st, "Expression")
  c(node.body, st, "Statement")
}
base.SwitchStatement = function (node, st, c) {
  c(node.discriminant, st, "Expression")
  for (var i = 0; i < node.cases.length; ++i) {
    var cs = node.cases[i]
    if (cs.test) c(cs.test, st, "Expression")
    for (var j = 0; j < cs.consequent.length; ++j)
      c(cs.consequent[j], st, "Statement")
  }
}
base.ReturnStatement = base.YieldExpression = base.AwaitExpression = function (node, st, c) {
  if (node.argument) c(node.argument, st, "Expression")
}
base.ThrowStatement = base.SpreadElement =
  function (node, st, c) { return c(node.argument, st, "Expression"); }
base.TryStatement = function (node, st, c) {
  c(node.block, st, "Statement")
  if (node.handler) c(node.handler, st)
  if (node.finalizer) c(node.finalizer, st, "Statement")
}
base.CatchClause = function (node, st, c) {
  c(node.param, st, "Pattern")
  c(node.body, st, "ScopeBody")
}
base.WhileStatement = base.DoWhileStatement = function (node, st, c) {
  c(node.test, st, "Expression")
  c(node.body, st, "Statement")
}
base.ForStatement = function (node, st, c) {
  if (node.init) c(node.init, st, "ForInit")
  if (node.test) c(node.test, st, "Expression")
  if (node.update) c(node.update, st, "Expression")
  c(node.body, st, "Statement")
}
base.ForInStatement = base.ForOfStatement = function (node, st, c) {
  c(node.left, st, "ForInit")
  c(node.right, st, "Expression")
  c(node.body, st, "Statement")
}
base.ForInit = function (node, st, c) {
  if (node.type == "VariableDeclaration") c(node, st)
  else c(node, st, "Expression")
}
base.DebuggerStatement = ignore

base.FunctionDeclaration = function (node, st, c) { return c(node, st, "Function"); }
base.VariableDeclaration = function (node, st, c) {
  for (var i = 0; i < node.declarations.length; ++i)
    c(node.declarations[i], st)
}
base.VariableDeclarator = function (node, st, c) {
  c(node.id, st, "Pattern")
  if (node.init) c(node.init, st, "Expression")
}

base.Function = function (node, st, c) {
  if (node.id) c(node.id, st, "Pattern")
  for (var i = 0; i < node.params.length; i++)
    c(node.params[i], st, "Pattern")
  c(node.body, st, node.expression ? "ScopeExpression" : "ScopeBody")
}
// FIXME drop these node types in next major version
// (They are awkward, and in ES6 every block can be a scope.)
base.ScopeBody = function (node, st, c) { return c(node, st, "Statement"); }
base.ScopeExpression = function (node, st, c) { return c(node, st, "Expression"); }

base.Pattern = function (node, st, c) {
  if (node.type == "Identifier")
    c(node, st, "VariablePattern")
  else if (node.type == "MemberExpression")
    c(node, st, "MemberPattern")
  else
    c(node, st)
}
base.VariablePattern = ignore
base.MemberPattern = skipThrough
base.RestElement = function (node, st, c) { return c(node.argument, st, "Pattern"); }
base.ArrayPattern =  function (node, st, c) {
  for (var i = 0; i < node.elements.length; ++i) {
    var elt = node.elements[i]
    if (elt) c(elt, st, "Pattern")
  }
}
base.ObjectPattern = function (node, st, c) {
  for (var i = 0; i < node.properties.length; ++i)
    c(node.properties[i].value, st, "Pattern")
}

base.Expression = skipThrough
base.ThisExpression = base.Super = base.MetaProperty = ignore
base.ArrayExpression = function (node, st, c) {
  for (var i = 0; i < node.elements.length; ++i) {
    var elt = node.elements[i]
    if (elt) c(elt, st, "Expression")
  }
}
base.ObjectExpression = function (node, st, c) {
  for (var i = 0; i < node.properties.length; ++i)
    c(node.properties[i], st)
}
base.FunctionExpression = base.ArrowFunctionExpression = base.FunctionDeclaration
base.SequenceExpression = base.TemplateLiteral = function (node, st, c) {
  for (var i = 0; i < node.expressions.length; ++i)
    c(node.expressions[i], st, "Expression")
}
base.UnaryExpression = base.UpdateExpression = function (node, st, c) {
  c(node.argument, st, "Expression")
}
base.BinaryExpression = base.LogicalExpression = function (node, st, c) {
  c(node.left, st, "Expression")
  c(node.right, st, "Expression")
}
base.AssignmentExpression = base.AssignmentPattern = function (node, st, c) {
  c(node.left, st, "Pattern")
  c(node.right, st, "Expression")
}
base.ConditionalExpression = function (node, st, c) {
  c(node.test, st, "Expression")
  c(node.consequent, st, "Expression")
  c(node.alternate, st, "Expression")
}
base.NewExpression = base.CallExpression = function (node, st, c) {
  c(node.callee, st, "Expression")
  if (node.arguments) for (var i = 0; i < node.arguments.length; ++i)
    c(node.arguments[i], st, "Expression")
}
base.MemberExpression = function (node, st, c) {
  c(node.object, st, "Expression")
  if (node.computed) c(node.property, st, "Expression")
}
base.ExportNamedDeclaration = base.ExportDefaultDeclaration = function (node, st, c) {
  if (node.declaration)
    c(node.declaration, st, node.type == "ExportNamedDeclaration" || node.declaration.id ? "Statement" : "Expression")
  if (node.source) c(node.source, st, "Expression")
}
base.ExportAllDeclaration = function (node, st, c) {
  c(node.source, st, "Expression")
}
base.ImportDeclaration = function (node, st, c) {
  for (var i = 0; i < node.specifiers.length; i++)
    c(node.specifiers[i], st)
  c(node.source, st, "Expression")
}
base.ImportSpecifier = base.ImportDefaultSpecifier = base.ImportNamespaceSpecifier = base.Identifier = base.Literal = ignore

base.TaggedTemplateExpression = function (node, st, c) {
  c(node.tag, st, "Expression")
  c(node.quasi, st)
}
base.ClassDeclaration = base.ClassExpression = function (node, st, c) { return c(node, st, "Class"); }
base.Class = function (node, st, c) {
  if (node.id) c(node.id, st, "Pattern")
  if (node.superClass) c(node.superClass, st, "Expression")
  for (var i = 0; i < node.body.body.length; i++)
    c(node.body.body[i], st)
}
base.MethodDefinition = base.Property = function (node, st, c) {
  if (node.computed) c(node.key, st, "Expression")
  c(node.value, st, "Expression")
}

exports.simple = simple;
exports.ancestor = ancestor;
exports.recursive = recursive;
exports.findNodeAt = findNodeAt;
exports.findNodeAround = findNodeAround;
exports.findNodeAfter = findNodeAfter;
exports.findNodeBefore = findNodeBefore;
exports.make = make;
exports.base = base;

Object.defineProperty(exports, '__esModule', { value: true });

})));
},{}],45:[function(require,module,exports){
/*
object-assign
(c) Sindre Sorhus
@license MIT
*/

'use strict';
/* eslint-disable no-unused-vars */
var getOwnPropertySymbols = Object.getOwnPropertySymbols;
var hasOwnProperty = Object.prototype.hasOwnProperty;
var propIsEnumerable = Object.prototype.propertyIsEnumerable;

function toObject(val) {
	if (val === null || val === undefined) {
		throw new TypeError('Object.assign cannot be called with null or undefined');
	}

	return Object(val);
}

function shouldUseNative() {
	try {
		if (!Object.assign) {
			return false;
		}

		// Detect buggy property enumeration order in older V8 versions.

		// https://bugs.chromium.org/p/v8/issues/detail?id=4118
		var test1 = new String('abc');  // eslint-disable-line no-new-wrappers
		test1[5] = 'de';
		if (Object.getOwnPropertyNames(test1)[0] === '5') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test2 = {};
		for (var i = 0; i < 10; i++) {
			test2['_' + String.fromCharCode(i)] = i;
		}
		var order2 = Object.getOwnPropertyNames(test2).map(function (n) {
			return test2[n];
		});
		if (order2.join('') !== '0123456789') {
			return false;
		}

		// https://bugs.chromium.org/p/v8/issues/detail?id=3056
		var test3 = {};
		'abcdefghijklmnopqrst'.split('').forEach(function (letter) {
			test3[letter] = letter;
		});
		if (Object.keys(Object.assign({}, test3)).join('') !==
				'abcdefghijklmnopqrst') {
			return false;
		}

		return true;
	} catch (err) {
		// We don't expect any of the above to throw, but better to be safe.
		return false;
	}
}

module.exports = shouldUseNative() ? Object.assign : function (target, source) {
	var from;
	var to = toObject(target);
	var symbols;

	for (var s = 1; s < arguments.length; s++) {
		from = Object(arguments[s]);

		for (var key in from) {
			if (hasOwnProperty.call(from, key)) {
				to[key] = from[key];
			}
		}

		if (getOwnPropertySymbols) {
			symbols = getOwnPropertySymbols(from);
			for (var i = 0; i < symbols.length; i++) {
				if (propIsEnumerable.call(from, symbols[i])) {
					to[symbols[i]] = from[symbols[i]];
				}
			}
		}
	}

	return to;
};

},{}],46:[function(require,module,exports){
'use strict';

var detect = require('acorn-globals');
var acorn = require('acorn');
var walk = require('acorn/dist/walk');

// hacky fix for https://github.com/marijnh/acorn/issues/227
function reallyParse(source) {
  return acorn.parse(source, {
    ecmaVersion: 6,
    allowReturnOutsideFunction: true
  });
}

module.exports = addWith

/**
 * Mimic `with` as far as possible but at compile time
 *
 * @param {String} obj The object part of a with expression
 * @param {String} src The body of the with expression
 * @param {Array.<String>} exclude A list of variable names to explicitly exclude
 */
function addWith(obj, src, exclude) {
  obj = obj + ''
  src = src + ''
  exclude = exclude || []
  exclude = exclude.concat(detect(obj).map(function (global) { return global.name; }))
  var vars = detect(src).map(function (global) { return global.name; })
    .filter(function (v) {
      return exclude.indexOf(v) === -1
        && v !== 'undefined'
        && v !== 'this'
    })

  if (vars.length === 0) return src

  var declareLocal = ''
  var local = 'locals_for_with'
  var result = 'result_of_with'
  if (/^[a-zA-Z0-9$_]+$/.test(obj)) {
    local = obj
  } else {
    while (vars.indexOf(local) != -1 || exclude.indexOf(local) != -1) {
      local += '_'
    }
    declareLocal = 'var ' + local + ' = (' + obj + ')'
  }
  while (vars.indexOf(result) != -1 || exclude.indexOf(result) != -1) {
    result += '_'
  }

  var inputVars = vars.map(function (v) {
    return JSON.stringify(v) + ' in ' + local + '?' +
      local + '.' + v + ':' +
      'typeof ' + v + '!=="undefined"?' + v + ':undefined'
  })

  src = '(function (' + vars.join(', ') + ') {' +
    src +
    '}.call(this' + inputVars.map(function (v) { return ',' + v; }).join('') + '))'

  return ';' + declareLocal + ';' + unwrapReturns(src, result) + ';'
}

/**
 * Take a self calling function, and unwrap it such that return inside the function
 * results in return outside the function
 *
 * @param {String} src    Some JavaScript code representing a self-calling function
 * @param {String} result A temporary variable to store the result in
 */
function unwrapReturns(src, result) {
  var originalSource = src
  var hasReturn = false
  var ast = reallyParse(src)
  var ref
  src = src.split('')

  // get a reference to the function that was inserted to add an inner context
  if ((ref = ast.body).length !== 1
   || (ref = ref[0]).type !== 'ExpressionStatement'
   || (ref = ref.expression).type !== 'CallExpression'
   || (ref = ref.callee).type !== 'MemberExpression' || ref.computed !== false || ref.property.name !== 'call'
   || (ref = ref.object).type !== 'FunctionExpression')
    throw new Error('AST does not seem to represent a self-calling function')
  var fn = ref

  walk.recursive(ast, null, {
    Function: function (node, st, c) {
      if (node === fn) {
        c(node.body, st, "ScopeBody");
      }
    },
    ReturnStatement: function (node) {
      hasReturn = true;
      replace(node, 'return {value: (' + (node.argument ? source(node.argument) : 'undefined') + ')};');
    }
  });
  function source(node) {
    return src.slice(node.start, node.end).join('')
  }
  function replace(node, str) {
    for (var i = node.start; i < node.end; i++) {
      src[i] = ''
    }
    src[node.start] = str
  }
  if (!hasReturn) return originalSource
  else return 'var ' + result + '=' + src.join('') + ';if (' + result + ') return ' + result + '.value'
}

},{"acorn":41,"acorn-globals":38,"acorn/dist/walk":42}]},{},[1]);
