'use strict';

var asyncGenerator = function () {
  function AwaitValue(value) {
    this.value = value;
  }

  function AsyncGenerator(gen) {
    var front, back;

    function send(key, arg) {
      return new Promise(function (resolve, reject) {
        var request = {
          key: key,
          arg: arg,
          resolve: resolve,
          reject: reject,
          next: null
        };

        if (back) {
          back = back.next = request;
        } else {
          front = back = request;
          resume(key, arg);
        }
      });
    }

    function resume(key, arg) {
      try {
        var result = gen[key](arg);
        var value = result.value;

        if (value instanceof AwaitValue) {
          Promise.resolve(value.value).then(function (arg) {
            resume("next", arg);
          }, function (arg) {
            resume("throw", arg);
          });
        } else {
          settle(result.done ? "return" : "normal", result.value);
        }
      } catch (err) {
        settle("throw", err);
      }
    }

    function settle(type, value) {
      switch (type) {
        case "return":
          front.resolve({
            value: value,
            done: true
          });
          break;

        case "throw":
          front.reject(value);
          break;

        default:
          front.resolve({
            value: value,
            done: false
          });
          break;
      }

      front = front.next;

      if (front) {
        resume(front.key, front.arg);
      } else {
        back = null;
      }
    }

    this._invoke = send;

    if (typeof gen.return !== "function") {
      this.return = undefined;
    }
  }

  if (typeof Symbol === "function" && Symbol.asyncIterator) {
    AsyncGenerator.prototype[Symbol.asyncIterator] = function () {
      return this;
    };
  }

  AsyncGenerator.prototype.next = function (arg) {
    return this._invoke("next", arg);
  };

  AsyncGenerator.prototype.throw = function (arg) {
    return this._invoke("throw", arg);
  };

  AsyncGenerator.prototype.return = function (arg) {
    return this._invoke("return", arg);
  };

  return {
    wrap: function (fn) {
      return function () {
        return new AsyncGenerator(fn.apply(this, arguments));
      };
    },
    await: function (value) {
      return new AwaitValue(value);
    }
  };
}();

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var slicedToArray = function () {
  function sliceIterator(arr, i) {
    var _arr = [];
    var _n = true;
    var _d = false;
    var _e = undefined;

    try {
      for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) {
        _arr.push(_s.value);

        if (i && _arr.length === i) break;
      }
    } catch (err) {
      _d = true;
      _e = err;
    } finally {
      try {
        if (!_n && _i["return"]) _i["return"]();
      } finally {
        if (_d) throw _e;
      }
    }

    return _arr;
  }

  return function (arr, i) {
    if (Array.isArray(arr)) {
      return arr;
    } else if (Symbol.iterator in Object(arr)) {
      return sliceIterator(arr, i);
    } else {
      throw new TypeError("Invalid attempt to destructure non-iterable instance");
    }
  };
}();

// to valid and match like `a as x.y.z`
var re = /^([\w\.-]+)\s+as\s+([\w\.-]+)$/i;

var isDev = process.env.NODE_ENV !== 'production';

function parseProp(prop) {
	// realProp: property name/path in your instance
	// storeProp: property name/path in Redux store
	var realProp = prop;
	var storeProp = prop;
	if (re.test(prop)) {
		var _prop$match = prop.match(re);

		var _prop$match2 = slicedToArray(_prop$match, 3);

		storeProp = _prop$match2[1];
		realProp = _prop$match2[2];
	}
	return { storeProp: storeProp, realProp: realProp };
}

function deepProp(obj, path) {
	return path.split('.').reduce(function (o, p) {
		return o[p];
	}, obj);
};

/**
 * Bind reduxStore to Vue instance
 *
 * @param {Vue} Vue
 * @param {object} store - redux store
 */
function bindVue(Vue, store) {
	Vue.mixin({
		created: function created() {
			var _this = this;

			if (this._bindProps) {
				var handleChange = function handleChange() {
					_this._bindProps.forEach(function (prop) {
						var storeProp = prop.storeProp,
						    realProp = prop.realProp;

						if (realProp && storeProp) {
							_this[realProp] = deepProp(store.getState(), storeProp);
						}
					});
				};
				this._unsubscribe = store.subscribe(handleChange);
			}
		},
		beforeDestroy: function beforeDestroy() {
			if (this._unsubscribe) {
				this._unsubscribe();
			}
		}
	});
	Vue.prototype.$select = function (prop) {
		// realProp: property name/path in your instance
		// storeProp: property name/path in Redux store
		this._bindProps = this._bindProps || [];
		prop = parseProp(prop);
		this._bindProps.push(prop);
		return deepProp(store.getState(), prop.storeProp);
	};
}

var Revue = function () {
	function Revue(Vue, reduxStore, reduxActions) {
		classCallCheck(this, Revue);

		this.store = reduxStore;
		bindVue(Vue, this.store);
		if (reduxActions) {
			this.reduxActions = reduxActions;
		}
	}

	createClass(Revue, [{
		key: 'dispatch',
		value: function dispatch() {
			var _store;

			return (_store = this.store).dispatch.apply(_store, arguments);
		}
	}, {
		key: 'state',
		get: function get() {
			return this.store.getState();
		}
	}, {
		key: 'actions',
		get: function get() {
			if (isDev && !this.reduxActions) {
				throw new Error('[Revue] Binding actions to Revue before calling them!');
			}
			return this.reduxActions;
		}
	}]);
	return Revue;
}();

module.exports = Revue;