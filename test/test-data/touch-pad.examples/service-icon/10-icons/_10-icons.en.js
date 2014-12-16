/* begin: ../../../libs/bem-bl/blocks-common/i-jquery/__inherit/i-jquery__inherit.js */
/**
 * Inheritance plugin
 *
 * Copyright (c) 2010 Filatov Dmitry (dfilatov@yandex-team.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * @version 1.3.5
 */

(function($) {

var hasIntrospection = (function(){'_';}).toString().indexOf('_') > -1,
    emptyBase = function() {},
    objCreate = Object.create || function(ptp) {
        var inheritance = function() {};
        inheritance.prototype = ptp;
        return new inheritance();
    },
    needCheckProps = true,
    testPropObj = { toString : '' };

for(var i in testPropObj) { // fucking ie hasn't toString, valueOf in for
    testPropObj.hasOwnProperty(i) && (needCheckProps = false);
}

var specProps = needCheckProps? ['toString', 'valueOf'] : null;

function override(base, result, add) {

    var hasSpecProps = false;
    if(needCheckProps) {
        var addList = [];
        $.each(specProps, function() {
            add.hasOwnProperty(this) && (hasSpecProps = true) && addList.push({
                name : this,
                val  : add[this]
            });
        });
        if(hasSpecProps) {
            $.each(add, function(name) {
                addList.push({
                    name : name,
                    val  : this
                });
            });
            add = addList;
        }
    }

    $.each(add, function(name, prop) {
        if(hasSpecProps) {
            name = prop.name;
            prop = prop.val;
        }
        if($.isFunction(prop) &&
           (!hasIntrospection || prop.toString().indexOf('.__base') > -1)) {

            var baseMethod = base[name] || function() {};
            result[name] = function() {
                var baseSaved = this.__base;
                this.__base = baseMethod;
                var result = prop.apply(this, arguments);
                this.__base = baseSaved;
                return result;
            };

        }
        else {
            result[name] = prop;
        }

    });

}

$.inherit = function() {

    var args = arguments,
        hasBase = $.isFunction(args[0]),
        base = hasBase? args[0] : emptyBase,
        props = args[hasBase? 1 : 0] || {},
        staticProps = args[hasBase? 2 : 1],
        result = props.__constructor || (hasBase && base.prototype.__constructor)?
            function() {
                return this.__constructor.apply(this, arguments);
            } : function() {};

    if(!hasBase) {
        result.prototype = props;
        result.prototype.__self = result.prototype.constructor = result;
        return $.extend(result, staticProps);
    }

    $.extend(result, base);

    var basePtp = base.prototype,
        resultPtp = result.prototype = objCreate(basePtp);

    resultPtp.__self = resultPtp.constructor = result;

    override(basePtp, resultPtp, props);
    staticProps && override(base, result, staticProps);

    return result;

};

$.inheritSelf = function(base, props, staticProps) {

    var basePtp = base.prototype;

    override(basePtp, basePtp, props);
    staticProps && override(base, base, staticProps);

    return base;

};

})(jQuery);

/* end: ../../../libs/bem-bl/blocks-common/i-jquery/__inherit/i-jquery__inherit.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-jquery/__identify/i-jquery__identify.js */
/**
 * Identify plugin
 *
 * @version 1.0.0
 */

(function($) {

var counter = 0,
    expando = '__' + (+new Date),
    get = function() {
        return 'uniq' + ++counter;
    };

/**
 * Makes unique ID
 * @param {Object} [obj] Object that needs to be identified
 * @param {Boolean} [onlyGet=false] Return a unique value only if it had already been assigned before
 * @returns {String} ID
 */
$.identify = function(obj, onlyGet) {

    if(!obj) return get();

    var key = 'uniqueID' in obj? 'uniqueID' : expando; // Use when possible. native uniqueID for elements in IE

    return onlyGet || key in obj?
        obj[key] :
        obj[key] = get();

};

})(jQuery);
/* end: ../../../libs/bem-bl/blocks-common/i-jquery/__identify/i-jquery__identify.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-jquery/__is-empty-object/i-jquery__is-empty-object.js */
(function($) {

$.isEmptyObject || ($.isEmptyObject = function(obj) {
        for(var i in obj) return false;
        return true;
    });

})(jQuery);

/* end: ../../../libs/bem-bl/blocks-common/i-jquery/__is-empty-object/i-jquery__is-empty-object.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-jquery/__debounce/i-jquery__debounce.js */
/**
 * Debounce and throttle function's decorator plugin 1.0.6
 *
 * Copyright (c) 2009 Filatov Dmitry (alpha@zforms.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

(function($) {

$.extend({

    debounce : function(fn, timeout, invokeAsap, ctx) {

        if(arguments.length == 3 && typeof invokeAsap != 'boolean') {
            ctx = invokeAsap;
            invokeAsap = false;
        }

        var timer;

        return function() {

            var args = arguments;
            ctx = ctx || this;

            invokeAsap && !timer && fn.apply(ctx, args);

            clearTimeout(timer);

            timer = setTimeout(function() {
                invokeAsap || fn.apply(ctx, args);
                timer = null;
            }, timeout);

        };

    },

    throttle : function(fn, timeout, ctx) {

        var timer, args, needInvoke;

        return function() {

            args = arguments;
            needInvoke = true;
            ctx = ctx || this;

            timer || (function() {
                if(needInvoke) {
                    fn.apply(ctx, args);
                    needInvoke = false;
                    timer = setTimeout(arguments.callee, timeout);
                }
                else {
                    timer = null;
                }
            })();

        };

    }

});

})(jQuery);
/* end: ../../../libs/bem-bl/blocks-common/i-jquery/__debounce/i-jquery__debounce.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-jquery/__observable/i-jquery__observable.js */
/**
 * Observable plugin
 *
 * Copyright (c) 2010 Filatov Dmitry (alpha@zforms.ru)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 * @version 1.0.0
 * @requires $.identify
 * @requires $.inherit
 */

(function($) {

var storageExpando = '__' + (+new Date) + 'storage',
    getFnId = function(fn, ctx) {
        return $.identify(fn) + (ctx? $.identify(ctx) : '');
    },
    Observable = /** @lends $.observable.prototype */{

        /**
         * Builds full event name
         * @protected
         * @param {String} e Event type
         * @returns {String}
         */
        buildEventName : function(e) {

            return e;

        },

        /**
         * Adding event handler
         * @param {String} e Event type
         * @param {Object} [data] Additional data that the handler gets as e.data
         * @param {Function} fn Handler
         * @param {Object} [ctx] Handler context
         * @returns {$.observable}
         */
        on : function(e, data, fn, ctx, _special) {

            if(typeof e == 'string') {
                if($.isFunction(data)) {
                    ctx = fn;
                    fn = data;
                    data = undefined;
                }

                var id = getFnId(fn, ctx),
                    storage = this[storageExpando] || (this[storageExpando] = {}),
                    eList = e.split(' '),
                    i = 0,
                    eStorage;

                while(e = eList[i++]) {
                    e = this.buildEventName(e);
                    eStorage = storage[e] || (storage[e] = { ids : {}, list : {} });

                    if(!(id in eStorage.ids)) {
                        var list = eStorage.list,
                            item = { fn : fn, data : data, ctx : ctx, special : _special };
                        if(list.last) {
                            list.last.next = item;
                            item.prev = list.last;
                        } else {
                            list.first = item;
                        }

                        eStorage.ids[id] = list.last = item;
                    }
                }
            } else {
                var _this = this;
                $.each(e, function(e, fn) {
                    _this.on(e, fn, data, _special);
                });
            }

            return this;

        },

        onFirst : function(e, data, fn, ctx) {

            return this.on(e, data, fn, ctx, { one : true });

        },

        /**
         * Removing event handler(s)
         * @param {String} [e] Event type
         * @param {Function} [fn] Handler
         * @param {Object} [ctx] Handler context
         * @returns {$.observable}
         */
        un : function(e, fn, ctx) {

            if(typeof e == 'string' || typeof e == 'undefined') {
                var storage = this[storageExpando];
                if(storage) {
                    if(e) { // if event type was passed
                        var eList = e.split(' '),
                            i = 0,
                            eStorage;
                        while(e = eList[i++]) {
                            e = this.buildEventName(e);
                            if(eStorage = storage[e]) {
                                if(fn) {  // if specific handler was passed
                                    var id = getFnId(fn, ctx),
                                        ids = eStorage.ids;
                                    if(id in ids) {
                                        var list = eStorage.list,
                                            item = ids[id],
                                            prev = item.prev,
                                            next = item.next;

                                        if(prev) {
                                            prev.next = next;
                                        }
                                        else if(item === list.first) {
                                            list.first = next;
                                        }

                                        if(next) {
                                            next.prev = prev;
                                        }
                                        else if(item === list.last) {
                                            list.last = prev;
                                        }

                                        delete ids[id];
                                    }
                                } else {
                                    delete this[storageExpando][e];
                                }
                            }
                        }
                    } else {
                        delete this[storageExpando];
                    }
                }
            } else {
                var _this = this;
                $.each(e, function(e, fn) {
                    _this.un(e, fn, ctx);
                });
            }

            return this;

        },

        /**
         * Fires event handlers
         * @param {String|$.Event} e Event
         * @param {Object} [data] Additional data
         * @returns {$.observable}
         */
        trigger : function(e, data) {

            var _this = this,
                storage = _this[storageExpando],
                rawType;

            typeof e === 'string'?
                e = $.Event(_this.buildEventName(rawType = e)) :
                e.type = _this.buildEventName(rawType = e.type);

            e.target || (e.target = _this);

            if(storage && (storage = storage[e.type])) {
                var item = storage.list.first,
                    ret;
                while(item) {
                    e.data = item.data;
                    ret = item.fn.call(item.ctx || _this, e, data);
                    if(typeof ret !== 'undefined') {
                        e.result = ret;
                        if(ret === false) {
                            e.preventDefault();
                            e.stopPropagation();
                        }
                    }

                    item.special && item.special.one &&
                        _this.un(rawType, item.fn, item.ctx);
                    item = item.next;
                }
            }

            return this;

        }

    };

$.observable = $.inherit(Observable, Observable);

})(jQuery);
/* end: ../../../libs/bem-bl/blocks-common/i-jquery/__observable/i-jquery__observable.js */
/* begin: ../../../libs/bem-bl/blocks-touch/i-fastclick/i-fastclick.js */
/**
 * @preserve FastClick: polyfill to remove click delays on browsers with touch UIs.
 *
 * @version 1.0.3
 * @codingstandard ftlabs-jsv2
 * @copyright The Financial Times Limited [All Rights Reserved]
 * @license MIT License (see LICENSE.txt)
 */

/*jslint browser:true, node:true*/
/*global define, Event, Node*/


/**
 * Instantiate fast-clicking listeners on the specified layer.
 *
 * @constructor
 * @param {Element} layer The layer to listen on
 * @param {Object} options The options to override the defaults
 */
function FastClick(layer, options) {
    'use strict';
    var oldOnClick;

    options = options || {};

    /**
     * Whether a click is currently being tracked.
     *
     * @type boolean
     */
    this.trackingClick = false;


    /**
     * Timestamp for when click tracking started.
     *
     * @type number
     */
    this.trackingClickStart = 0;


    /**
     * The element being tracked for a click.
     *
     * @type EventTarget
     */
    this.targetElement = null;


    /**
     * X-coordinate of touch start event.
     *
     * @type number
     */
    this.touchStartX = 0;


    /**
     * Y-coordinate of touch start event.
     *
     * @type number
     */
    this.touchStartY = 0;


    /**
     * ID of the last touch, retrieved from Touch.identifier.
     *
     * @type number
     */
    this.lastTouchIdentifier = 0;


    /**
     * Touchmove boundary, beyond which a click will be cancelled.
     *
     * @type number
     */
    this.touchBoundary = options.touchBoundary || 10;


    /**
     * The FastClick layer.
     *
     * @type Element
     */
    this.layer = layer;

    /**
     * The minimum time between tap(touchstart and touchend) events
     *
     * @type number
     */
    this.tapDelay = options.tapDelay || 200;

    if (FastClick.notNeeded(layer)) {
        return;
    }

    // Some old versions of Android don't have Function.prototype.bind
    function bind(method, context) {
        return function() { return method.apply(context, arguments); };
    }


    var methods = ['onMouse', 'onClick', 'onTouchStart', 'onTouchMove', 'onTouchEnd', 'onTouchCancel'];
    var context = this;
    for (var i = 0, l = methods.length; i < l; i++) {
        context[methods[i]] = bind(context[methods[i]], context);
    }

    // Set up event handlers as required
    if (deviceIsAndroid) {
        layer.addEventListener('mouseover', this.onMouse, true);
        layer.addEventListener('mousedown', this.onMouse, true);
        layer.addEventListener('mouseup', this.onMouse, true);
    }

    layer.addEventListener('click', this.onClick, true);
    layer.addEventListener('touchstart', this.onTouchStart, false);
    layer.addEventListener('touchmove', this.onTouchMove, false);
    layer.addEventListener('touchend', this.onTouchEnd, false);
    layer.addEventListener('touchcancel', this.onTouchCancel, false);

    // Hack is required for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
    // which is how FastClick normally stops click events bubbling to callbacks registered on the FastClick
    // layer when they are cancelled.
    if (!Event.prototype.stopImmediatePropagation) {
        layer.removeEventListener = function(type, callback, capture) {
            var rmv = Node.prototype.removeEventListener;
            if (type === 'click') {
                rmv.call(layer, type, callback.hijacked || callback, capture);
            } else {
                rmv.call(layer, type, callback, capture);
            }
        };

        layer.addEventListener = function(type, callback, capture) {
            var adv = Node.prototype.addEventListener;
            if (type === 'click') {
                adv.call(layer, type, callback.hijacked || (callback.hijacked = function(event) {
                    if (!event.propagationStopped) {
                        callback(event);
                    }
                }), capture);
            } else {
                adv.call(layer, type, callback, capture);
            }
        };
    }

    // If a handler is already declared in the element's onclick attribute, it will be fired before
    // FastClick's onClick handler. Fix this by pulling out the user-defined handler function and
    // adding it as listener.
    if (typeof layer.onclick === 'function') {

        // Android browser on at least 3.2 requires a new reference to the function in layer.onclick
        // - the old one won't work if passed to addEventListener directly.
        oldOnClick = layer.onclick;
        layer.addEventListener('click', function(event) {
            oldOnClick(event);
        }, false);
        layer.onclick = null;
    }
}


/**
 * Android requires exceptions.
 *
 * @type boolean
 */
var deviceIsAndroid = navigator.userAgent.indexOf('Android') > 0;


/**
 * iOS requires exceptions.
 *
 * @type boolean
 */
var deviceIsIOS = /iP(ad|hone|od)/.test(navigator.userAgent);


/**
 * iOS 4 requires an exception for select elements.
 *
 * @type boolean
 */
var deviceIsIOS4 = deviceIsIOS && (/OS 4_\d(_\d)?/).test(navigator.userAgent);


/**
 * iOS 6.0(+?) requires the target element to be manually derived
 *
 * @type boolean
 */
var deviceIsIOSWithBadTarget = deviceIsIOS && (/OS ([6-9]|\d{2})_\d/).test(navigator.userAgent);

/**
 * BlackBerry requires exceptions.
 *
 * @type boolean
 */
var deviceIsBlackBerry10 = navigator.userAgent.indexOf('BB10') > 0;

/**
 * Determine whether a given element requires a native click.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element needs a native click
 */
FastClick.prototype.needsClick = function(target) {
    'use strict';
    switch (target.nodeName.toLowerCase()) {

        // Don't send a synthetic click to disabled inputs (issue #62)
        case 'button':
        case 'select':
        case 'textarea':
            if (target.disabled) {
                return true;
            }

            break;
        case 'input':

            // File inputs need real clicks on iOS 6 due to a browser bug (issue #68)
            // bem-bl - Android Native browser emits "change" events twice
            if ((deviceIsIOS && target.type === 'file') ||
                deviceIsAndroid && target.type === 'checkbox' ||
                target.disabled) {
                return true;
            }

            break;
        case 'label':
        case 'video':
            return true;
    }

    return (/\bneedsclick\b/).test(target.className);
};


/**
 * Determine whether a given element requires a call to focus to simulate click into element.
 *
 * @param {EventTarget|Element} target Target DOM element
 * @returns {boolean} Returns true if the element requires a call to focus to simulate native click.
 */
FastClick.prototype.needsFocus = function(target) {
    'use strict';
    switch (target.nodeName.toLowerCase()) {
        case 'textarea':
            return true;
        case 'select':
            return !deviceIsAndroid;
        case 'input':
            switch (target.type) {
                case 'button':
                case 'checkbox':
                case 'file':
                case 'image':
                case 'radio':
                case 'submit':
                    return false;
            }

            // No point in attempting to focus disabled inputs
            return !target.disabled && !target.readOnly;
        default:
            return (/\bneedsfocus\b/).test(target.className);
    }
};


/**
 * Send a click event to the specified element.
 *
 * @param {EventTarget|Element} targetElement
 * @param {Event} event
 */
FastClick.prototype.sendClick = function(targetElement, event) {
    'use strict';
    var clickEvent, touch;
    var mousedownEvent; // bem-bl

    // On some Android devices activeElement needs to be blurred otherwise the synthetic click will have no effect (#24)
    if (document.activeElement && document.activeElement !== targetElement) {
        document.activeElement.blur();
    }

    touch = event.changedTouches[0];

    // bem-bl - Trigger mousedown
    mousedownEvent = document.createEvent('MouseEvents');
    mousedownEvent.initMouseEvent('mousedown', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
    mousedownEvent.forwardedTouchEvent = true;
    targetElement.dispatchEvent(mousedownEvent);

    // Synthesise a click event, with an extra attribute so it can be tracked
    // bem-bl - this.determineEventType(targetElement) --> 'click'
    clickEvent = document.createEvent('MouseEvents');
    clickEvent.initMouseEvent('click', true, true, window, 1, touch.screenX, touch.screenY, touch.clientX, touch.clientY, false, false, false, false, 0, null);
    clickEvent.forwardedTouchEvent = true;
    targetElement.dispatchEvent(clickEvent);
};

/**
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.focus = function(targetElement) {
    'use strict';
    var length;

    // Issue #160: on iOS 7, some input elements (e.g. date datetime) throw a vague TypeError on setSelectionRange. These elements don't have an integer value for the selectionStart and selectionEnd properties, but unfortunately that can't be used for detection because accessing the properties also throws a TypeError. Just check the type instead. Filed as Apple bug #15122724.
    if (deviceIsIOS && targetElement.setSelectionRange && targetElement.type.indexOf('date') !== 0 && targetElement.type !== 'time') {
        length = targetElement.value.length;
        targetElement.setSelectionRange(length, length);
    } else {
        targetElement.focus();
    }
};


/**
 * Check whether the given target element is a child of a scrollable layer and if so, set a flag on it.
 *
 * @param {EventTarget|Element} targetElement
 */
FastClick.prototype.updateScrollParent = function(targetElement) {
    'use strict';
    var scrollParent, parentElement;

    scrollParent = targetElement.fastClickScrollParent;

    // Attempt to discover whether the target element is contained within a scrollable layer. Re-check if the
    // target element was moved to another parent.
    if (!scrollParent || !scrollParent.contains(targetElement)) {
        parentElement = targetElement;
        do {
            if (parentElement.scrollHeight > parentElement.offsetHeight) {
                scrollParent = parentElement;
                targetElement.fastClickScrollParent = parentElement;
                break;
            }

            parentElement = parentElement.parentElement;
        } while (parentElement);
    }

    // Always update the scroll top tracker if possible.
    if (scrollParent) {
        scrollParent.fastClickLastScrollTop = scrollParent.scrollTop;
    }
};


/**
 * @param {EventTarget} targetElement
 * @returns {Element|EventTarget}
 */
FastClick.prototype.getTargetElementFromEventTarget = function(eventTarget) {
    'use strict';

    // On some older browsers (notably Safari on iOS 4.1 - see issue #56) the event target may be a text node.
    if (eventTarget.nodeType === Node.TEXT_NODE) {
        return eventTarget.parentNode;
    }

    return eventTarget;
};


/**
 * On touch start, record the position and scroll offset.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchStart = function(event) {
    'use strict';
    var targetElement, touch, selection;

    // Ignore multiple touches, otherwise pinch-to-zoom is prevented if both fingers are on the FastClick element (issue #111).
    if (event.targetTouches.length > 1) {
        return true;
    }

    targetElement = this.getTargetElementFromEventTarget(event.target);
    touch = event.targetTouches[0];

    if (deviceIsIOS) {

        // Only trusted events will deselect text on iOS (issue #49)
        selection = window.getSelection();
        if (selection.rangeCount && !selection.isCollapsed) {
            return true;
        }

        if (!deviceIsIOS4) {

            // Weird things happen on iOS when an alert or confirm dialog is opened from a click event callback (issue #23):
            // when the user next taps anywhere else on the page, new touchstart and touchend events are dispatched
            // with the same identifier as the touch event that previously triggered the click that triggered the alert.
            // Sadly, there is an issue on iOS 4 that causes some normal touch events to have the same identifier as an
            // immediately preceeding touch event (issue #52), so this fix is unavailable on that platform.
            // Issue 120: touch.identifier is 0 when Chrome dev tools 'Emulate touch events' is set with an iOS device UA string,
            // which causes all touch events to be ignored. As this block only applies to iOS, and iOS identifiers are always long,
            // random integers, it's safe to to continue if the identifier is 0 here.
            if (touch.identifier && touch.identifier === this.lastTouchIdentifier) {
                event.preventDefault();
                return false;
            }

            this.lastTouchIdentifier = touch.identifier;

            // If the target element is a child of a scrollable layer (using -webkit-overflow-scrolling: touch) and:
            // 1) the user does a fling scroll on the scrollable layer
            // 2) the user stops the fling scroll with another tap
            // then the event.target of the last 'touchend' event will be the element that was under the user's finger
            // when the fling scroll was started, causing FastClick to send a click event to that layer - unless a check
            // is made to ensure that a parent layer was not scrolled before sending a synthetic click (issue #42).
            this.updateScrollParent(targetElement);
        }
    }

    this.trackingClick = true;
    this.trackingClickStart = event.timeStamp;
    this.targetElement = targetElement;

    this.touchStartX = touch.pageX;
    this.touchStartY = touch.pageY;

    // Prevent phantom clicks on fast double-tap (issue #36)
    if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
        event.preventDefault();
    }

    return true;
};


/**
 * Based on a touchmove event object, check whether the touch has moved past a boundary since it started.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.touchHasMoved = function(event) {
    'use strict';
    var touch = event.changedTouches[0], boundary = this.touchBoundary;

    if (Math.abs(touch.pageX - this.touchStartX) > boundary || Math.abs(touch.pageY - this.touchStartY) > boundary) {
        return true;
    }

    return false;
};


/**
 * Update the last position.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchMove = function(event) {
    'use strict';
    if (!this.trackingClick) {
        return true;
    }

    // If the touch has moved, cancel the click tracking
    if (this.targetElement !== this.getTargetElementFromEventTarget(event.target) || this.touchHasMoved(event)) {
        this.trackingClick = false;
        this.targetElement = null;
    }

    return true;
};


/**
 * Attempt to find the labelled control for the given label element.
 *
 * @param {EventTarget|HTMLLabelElement} labelElement
 * @returns {Element|null}
 */
FastClick.prototype.findControl = function(labelElement) {
    'use strict';

    // Fast path for newer browsers supporting the HTML5 control attribute
    if (labelElement.control !== undefined) {
        return labelElement.control;
    }

    // All browsers under test that support touch events also support the HTML5 htmlFor attribute
    if (labelElement.htmlFor) {
        return document.getElementById(labelElement.htmlFor);
    }

    // If no for attribute exists, attempt to retrieve the first labellable descendant element
    // the list of which is defined here: http://www.w3.org/TR/html5/forms.html#category-label
    return labelElement.querySelector('button, input:not([type=hidden]), keygen, meter, output, progress, select, textarea');
};


/**
 * On touch end, determine whether to send a click event at once.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onTouchEnd = function(event) {
    'use strict';
    var forElement, trackingClickStart, targetTagName, scrollParent, touch, targetElement = this.targetElement;

    if (!this.trackingClick) {
        return true;
    }

    // Prevent phantom clicks on fast double-tap (issue #36)
    if ((event.timeStamp - this.lastClickTime) < this.tapDelay) {
        this.cancelNextClick = true;
        return true;
    }

    // Reset to prevent wrong click cancel on input (issue #156).
    this.cancelNextClick = false;

    this.lastClickTime = event.timeStamp;

    trackingClickStart = this.trackingClickStart;
    this.trackingClick = false;
    this.trackingClickStart = 0;

    // On some iOS devices, the targetElement supplied with the event is invalid if the layer
    // is performing a transition or scroll, and has to be re-detected manually. Note that
    // for this to function correctly, it must be called *after* the event target is checked!
    // See issue #57; also filed as rdar://13048589 .
    if (deviceIsIOSWithBadTarget) {
        touch = event.changedTouches[0];

        // In certain cases arguments of elementFromPoint can be negative, so prevent setting targetElement to null
        targetElement = document.elementFromPoint(touch.pageX - window.pageXOffset, touch.pageY - window.pageYOffset) || targetElement;
        targetElement.fastClickScrollParent = this.targetElement.fastClickScrollParent;
    }

    targetTagName = targetElement.tagName.toLowerCase();
    if (targetTagName === 'label') {
        forElement = this.findControl(targetElement);
        if (forElement) {
            this.focus(targetElement);
            if (deviceIsAndroid) {
                return false;
            }

            targetElement = forElement;
        }
    } else if (this.needsFocus(targetElement)) {

        // Case 1: If the touch started a while ago (best guess is 100ms based on tests for issue #36) then focus will be triggered anyway. Return early and unset the target element reference so that the subsequent click will be allowed through.
        // Case 2: Without this exception for input elements tapped when the document is contained in an iframe, then any inputted text won't be visible even though the value attribute is updated as the user types (issue #37).
        if ((event.timeStamp - trackingClickStart) > 100 || (deviceIsIOS && window.top !== window && targetTagName === 'input')) {
            this.targetElement = null;
            return false;
        }

        this.focus(targetElement);
        this.sendClick(targetElement, event);

        // Select elements need the event to go through on iOS 4, otherwise the selector menu won't open.
        // Also this breaks opening selects when VoiceOver is active on iOS6, iOS7 (and possibly others)
        if (!deviceIsIOS || targetTagName !== 'select') {
            this.targetElement = null;
            event.preventDefault();
        }

        return false;
    }

    if (deviceIsIOS && !deviceIsIOS4) {

        // Don't send a synthetic click event if the target element is contained within a parent layer that was scrolled
        // and this tap is being used to stop the scrolling (usually initiated by a fling - issue #42).
        scrollParent = targetElement.fastClickScrollParent;
        if (scrollParent && scrollParent.fastClickLastScrollTop !== scrollParent.scrollTop) {
            return true;
        }
    }

    // Prevent the actual click from going though - unless the target node is marked as requiring
    // real clicks or if it is in the whitelist in which case only non-programmatic clicks are permitted.
    if (!this.needsClick(targetElement)) {
        event.preventDefault();
        this.sendClick(targetElement, event);
    }

    return false;
};


/**
 * On touch cancel, stop tracking the click.
 *
 * @returns {void}
 */
FastClick.prototype.onTouchCancel = function() {
    'use strict';
    this.trackingClick = false;
    this.targetElement = null;
};


/**
 * Determine mouse events which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onMouse = function(event) {
    'use strict';

    // If a target element was never set (because a touch event was never fired) allow the event
    if (!this.targetElement) {
        return true;
    }

    if (event.forwardedTouchEvent) {
        return true;
    }

    // Programmatically generated events targeting a specific element should be permitted
    if (!event.cancelable) {
        return true;
    }

    // Derive and check the target element to see whether the mouse event needs to be permitted;
    // unless explicitly enabled, prevent non-touch click events from triggering actions,
    // to prevent ghost/doubleclicks.
    if (!this.needsClick(this.targetElement) || this.cancelNextClick) {

        // Prevent any user-added listeners declared on FastClick element from being fired.
        if (event.stopImmediatePropagation) {
            event.stopImmediatePropagation();
        } else {

            // Part of the hack for browsers that don't support Event#stopImmediatePropagation (e.g. Android 2)
            event.propagationStopped = true;
        }

        // Cancel the event
        event.stopPropagation();
        event.preventDefault();

        return false;
    }

    // If the mouse event is permitted, return true for the action to go through.
    return true;
};


/**
 * On actual clicks, determine whether this is a touch-generated click, a click action occurring
 * naturally after a delay after a touch (which needs to be cancelled to avoid duplication), or
 * an actual click which should be permitted.
 *
 * @param {Event} event
 * @returns {boolean}
 */
FastClick.prototype.onClick = function(event) {
    'use strict';
    var permitted;

    // It's possible for another FastClick-like library delivered with third-party code to fire a click event before FastClick does (issue #44). In that case, set the click-tracking flag back to false and return early. This will cause onTouchEnd to return early.
    if (this.trackingClick) {
        this.targetElement = null;
        this.trackingClick = false;
        return true;
    }

    // Very odd behaviour on iOS (issue #18): if a submit element is present inside a form and the user hits enter in the iOS simulator or clicks the Go button on the pop-up OS keyboard the a kind of 'fake' click event will be triggered with the submit-type input element as the target.
    if (event.target.type === 'submit' && event.detail === 0) {
        return true;
    }

    permitted = this.onMouse(event);

    // Only unset targetElement if the click is not permitted. This will ensure that the check for !targetElement in onMouse fails and the browser's click doesn't go through.
    if (!permitted) {
        this.targetElement = null;
    }

    // If clicks are permitted, return true for the action to go through.
    return permitted;
};


/**
 * Remove all FastClick's event listeners.
 *
 * @returns {void}
 */
FastClick.prototype.destroy = function() {
    'use strict';
    var layer = this.layer;

    if (deviceIsAndroid) {
        layer.removeEventListener('mouseover', this.onMouse, true);
        layer.removeEventListener('mousedown', this.onMouse, true);
        layer.removeEventListener('mouseup', this.onMouse, true);
    }

    layer.removeEventListener('click', this.onClick, true);
    layer.removeEventListener('touchstart', this.onTouchStart, false);
    layer.removeEventListener('touchmove', this.onTouchMove, false);
    layer.removeEventListener('touchend', this.onTouchEnd, false);
    layer.removeEventListener('touchcancel', this.onTouchCancel, false);
};


/**
 * Check whether FastClick is needed.
 *
 * @param {Element} layer The layer to listen on
 */
FastClick.notNeeded = function(layer) {
    'use strict';
    var metaViewport;
    var chromeVersion;
    var blackberryVersion;

    // Devices that don't support touch don't need FastClick
    if (typeof window.ontouchstart === 'undefined') {
        return true;
    }

    // Chrome version - zero for other browsers
    chromeVersion = +(/Chrome\/([0-9]+)/.exec(navigator.userAgent) || [,0])[1];

    if (chromeVersion) {

        if (deviceIsAndroid) {
            metaViewport = document.querySelector('meta[name=viewport]');

            if (metaViewport) {
                // Chrome on Android with user-scalable="no" doesn't need FastClick (issue #89)
                if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
                    return true;
                }
                // Chrome 32 and above with width=device-width or less don't need FastClick
                if (chromeVersion > 31 && document.documentElement.scrollWidth <= window.outerWidth) {
                    return true;
                }
            }

            // Chrome desktop doesn't need FastClick (issue #15)
        } else {
            return true;
        }
    }

    if (deviceIsBlackBerry10) {
        blackberryVersion = navigator.userAgent.match(/Version\/([0-9]*)\.([0-9]*)/);

        // BlackBerry 10.3+ does not require Fastclick library.
        // https://github.com/ftlabs/fastclick/issues/251
        if (blackberryVersion[1] >= 10 && blackberryVersion[2] >= 3) {
            metaViewport = document.querySelector('meta[name=viewport]');

            if (metaViewport) {
                // user-scalable=no eliminates click delay.
                if (metaViewport.content.indexOf('user-scalable=no') !== -1) {
                    return true;
                }
                // width=device-width (or less than device-width) eliminates click delay.
                if (document.documentElement.scrollWidth <= window.outerWidth) {
                    return true;
                }
            }
        }
    }

    // IE10 with -ms-touch-action: none, which disables double-tap-to-zoom (issue #97)
    if (layer.style.msTouchAction === 'none') {
        return true;
    }

    return false;
};


/**
 * Factory method for creating a FastClick object
 *
 * @param {Element} layer The layer to listen on
 * @param {Object} options The options to override the defaults
 */
FastClick.attach = function(layer, options) {
    'use strict';
    return new FastClick(layer, options);
};


if (typeof define == 'function' && typeof define.amd == 'object' && define.amd) {

    // AMD. Register as an anonymous module.
    define(function() {
        'use strict';
        return FastClick;
    });
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = FastClick.attach;
    module.exports.FastClick = FastClick;
} else {
    window.FastClick = FastClick;
}


// bem-bl - initialization
function init() {
    FastClick.attach(document.body);
}

if(document.readyState === 'complete') {
    init();
} else {
    document.addEventListener('DOMContentLoaded', init);
}

/* end: ../../../libs/bem-bl/blocks-touch/i-fastclick/i-fastclick.js */
/* begin: ../../../libs/bem-bl/blocks-touch/i-pointer-events/i-pointer-events.js */
﻿(function () {
    // If the user agent is already support Pointer Events, do nothing
    if (window.PointerEvent)
        return;

    // Installing Hand.js
    var supportedEventsNames = ["pointerdown", "pointerup", "pointermove", "pointerover", "pointerout", "pointercancel", "pointerenter", "pointerleave"];
    var upperCaseEventsNames = ["PointerDown", "PointerUp", "PointerMove", "PointerOver", "PointerOut", "PointerCancel", "PointerEnter", "PointerLeave"];

    var POINTER_TYPE_TOUCH = "touch";
    var POINTER_TYPE_PEN = "pen";
    var POINTER_TYPE_MOUSE = "mouse";

    var previousTargets = {};

    var checkPreventDefault = function (node) {
        while (node && !node.handjs_forcePreventDefault) {
            node = node.parentNode;
        }
        return !!node || window.handjs_forcePreventDefault;
    };

    // Touch events
    var generateTouchClonedEvent = function (sourceEvent, newName, canBubble, newtarget) {
        // Considering touch events are almost like super mouse events
        var evObj;

        if (document.createEvent) {
            evObj = document.createEvent('MouseEvents');
            evObj.initMouseEvent(newName, canBubble, true, window, 1, sourceEvent.screenX, sourceEvent.screenY,
                sourceEvent.clientX, sourceEvent.clientY, sourceEvent.ctrlKey, sourceEvent.altKey,
                sourceEvent.shiftKey, sourceEvent.metaKey, sourceEvent.button, null);
        }
        else {
            evObj = document.createEventObject();
            evObj.screenX = sourceEvent.screenX;
            evObj.screenY = sourceEvent.screenY;
            evObj.clientX = sourceEvent.clientX;
            evObj.clientY = sourceEvent.clientY;
            evObj.ctrlKey = sourceEvent.ctrlKey;
            evObj.altKey = sourceEvent.altKey;
            evObj.shiftKey = sourceEvent.shiftKey;
            evObj.metaKey = sourceEvent.metaKey;
            evObj.button = sourceEvent.button;
        }
        // offsets
        if (evObj.offsetX === undefined) {
            if (sourceEvent.offsetX !== undefined) {

                // For Opera which creates readonly properties
                if (Object && Object.defineProperty !== undefined) {
                    Object.defineProperty(evObj, "offsetX", {
                        writable: true
                    });
                    Object.defineProperty(evObj, "offsetY", {
                        writable: true
                    });
                }

                evObj.offsetX = sourceEvent.offsetX;
                evObj.offsetY = sourceEvent.offsetY;
            } else if (Object && Object.defineProperty !== undefined) {
                Object.defineProperty(evObj, "offsetX", {
                    get: function () {
                        if (this.currentTarget && this.currentTarget.offsetLeft) {
                            return sourceEvent.clientX - this.currentTarget.offsetLeft;
                        }
                        return sourceEvent.clientX;
                    }
                });
                Object.defineProperty(evObj, "offsetY", {
                    get: function () {
                        if (this.currentTarget && this.currentTarget.offsetTop) {
                            return sourceEvent.clientY - this.currentTarget.offsetTop;
                        }
                        return sourceEvent.clientY;
                    }
                });
            }
            else if (sourceEvent.layerX !== undefined) {
                evObj.offsetX = sourceEvent.layerX - sourceEvent.currentTarget.offsetLeft;
                evObj.offsetY = sourceEvent.layerY - sourceEvent.currentTarget.offsetTop;
            }
        }

        // adding missing properties

        if (sourceEvent.isPrimary !== undefined)
            evObj.isPrimary = sourceEvent.isPrimary;
        else
            evObj.isPrimary = true;

        if (sourceEvent.pressure)
            evObj.pressure = sourceEvent.pressure;
        else {
            var button = 0;

            if (sourceEvent.which !== undefined)
                button = sourceEvent.which;
            else if (sourceEvent.button !== undefined) {
                button = sourceEvent.button;
            }
            evObj.pressure = (button == 0) ? 0 : 0.5;
        }


        if (sourceEvent.rotation)
            evObj.rotation = sourceEvent.rotation;
        else
            evObj.rotation = 0;

        // Timestamp
        if (sourceEvent.hwTimestamp)
            evObj.hwTimestamp = sourceEvent.hwTimestamp;
        else
            evObj.hwTimestamp = 0;

        // Tilts
        if (sourceEvent.tiltX)
            evObj.tiltX = sourceEvent.tiltX;
        else
            evObj.tiltX = 0;

        if (sourceEvent.tiltY)
            evObj.tiltY = sourceEvent.tiltY;
        else
            evObj.tiltY = 0;

        // Width and Height
        if (sourceEvent.height)
            evObj.height = sourceEvent.height;
        else
            evObj.height = 0;

        if (sourceEvent.width)
            evObj.width = sourceEvent.width;
        else
            evObj.width = 0;

        // preventDefault
        evObj.preventDefault = function () {
            if (sourceEvent.preventDefault !== undefined)
                sourceEvent.preventDefault();
        };

        // stopPropagation
        if (evObj.stopPropagation !== undefined) {
            var current = evObj.stopPropagation;
            evObj.stopPropagation = function () {
                if (sourceEvent.stopPropagation !== undefined)
                    sourceEvent.stopPropagation();
                current.call(this);
            };
        }

        // Pointer values
        evObj.pointerId = sourceEvent.pointerId;
        evObj.pointerType = sourceEvent.pointerType;

        switch (evObj.pointerType) {// Old spec version check
            case 2:
                evObj.pointerType = POINTER_TYPE_TOUCH;
                break;
            case 3:
                evObj.pointerType = POINTER_TYPE_PEN;
                break;
            case 4:
                evObj.pointerType = POINTER_TYPE_MOUSE;
                break;
        }

        // Fire event
        if (newtarget)
            newtarget.dispatchEvent(evObj);
        else if (sourceEvent.target) {
            sourceEvent.target.dispatchEvent(evObj);
        } else {
            sourceEvent.srcElement.fireEvent("on" + getMouseEquivalentEventName(newName), evObj); // We must fallback to mouse event for very old browsers
        }
    };

    var generateMouseProxy = function (evt, eventName, canBubble, target) {
        evt.pointerId = 1;
        evt.pointerType = POINTER_TYPE_MOUSE;
        generateTouchClonedEvent(evt, eventName, canBubble, target);
    };

    var generateTouchEventProxy = function (name, touchPoint, target, eventObject, canBubble) {
        var touchPointId = touchPoint.identifier + 2; // Just to not override mouse id

        touchPoint.pointerId = touchPointId;
        touchPoint.pointerType = POINTER_TYPE_TOUCH;
        touchPoint.currentTarget = target;

        if (eventObject.preventDefault !== undefined) {
            touchPoint.preventDefault = function () {
                eventObject.preventDefault();
            };
        }

        generateTouchClonedEvent(touchPoint, name, canBubble, target);
    };

    var checkEventRegistration = function (node, eventName) {
        return node.__handjsGlobalRegisteredEvents && node.__handjsGlobalRegisteredEvents[eventName];
    }
    var findEventRegisteredNode = function (node, eventName) {
        while (node && !checkEventRegistration(node, eventName))
            node = node.parentNode;
        if (node)
            return node;
        else if (checkEventRegistration(window, eventName))
            return window;
    };

    var generateTouchEventProxyIfRegistered = function (eventName, touchPoint, target, eventObject, canBubble) { // Check if user registered this event
        if (findEventRegisteredNode(target, eventName)) {
            generateTouchEventProxy(eventName, touchPoint, target, eventObject, canBubble);
        }
    };

    var handleOtherEvent = function (eventObject, name, useLocalTarget, checkRegistration) {
        if (eventObject.preventManipulation)
            eventObject.preventManipulation();

        for (var i = 0; i < eventObject.changedTouches.length; ++i) {
            var touchPoint = eventObject.changedTouches[i];

            if (useLocalTarget) {
                previousTargets[touchPoint.identifier] = touchPoint.target;
            }

            if (checkRegistration) {
                generateTouchEventProxyIfRegistered(name, touchPoint, previousTargets[touchPoint.identifier], eventObject, true);
            } else {
                generateTouchEventProxy(name, touchPoint, previousTargets[touchPoint.identifier], eventObject, true);
            }
        }
    };

    var getMouseEquivalentEventName = function (eventName) {
        return eventName.toLowerCase().replace("pointer", "mouse");
    };

    var getPrefixEventName = function (prefix, eventName) {
        var upperCaseIndex = supportedEventsNames.indexOf(eventName);
        var newEventName = prefix + upperCaseEventsNames[upperCaseIndex];

        return newEventName;
    };

    var registerOrUnregisterEvent = function (item, name, func, enable) {
        if (item.__handjsRegisteredEvents === undefined) {
            item.__handjsRegisteredEvents = [];
        }

        if (enable) {
            if (item.__handjsRegisteredEvents[name] !== undefined) {
                item.__handjsRegisteredEvents[name]++;
                return;
            }

            item.__handjsRegisteredEvents[name] = 1;
            item.addEventListener(name, func, false);
        } else {

            if (item.__handjsRegisteredEvents.indexOf(name) !== -1) {
                item.__handjsRegisteredEvents[name]--;

                if (item.__handjsRegisteredEvents[name] != 0) {
                    return;
                }
            }
            item.removeEventListener(name, func);
            item.__handjsRegisteredEvents[name] = 0;
        }
    };

    var setTouchAware = function (item, eventName, enable) {
        // Leaving tokens
        if (!item.__handjsGlobalRegisteredEvents) {
            item.__handjsGlobalRegisteredEvents = [];
        }
        if (enable) {
            if (item.__handjsGlobalRegisteredEvents[eventName] !== undefined) {
                item.__handjsGlobalRegisteredEvents[eventName]++;
                return;
            }
            item.__handjsGlobalRegisteredEvents[eventName] = 1;
        } else {
            if (item.__handjsGlobalRegisteredEvents[eventName] !== undefined) {
                item.__handjsGlobalRegisteredEvents[eventName]--;
                if (item.__handjsGlobalRegisteredEvents[eventName] < 0) {
                    item.__handjsGlobalRegisteredEvents[eventName] = 0;
                }
            }
        }

        // Chrome, Firefox
        if (item.ontouchstart !== undefined) {
            switch (eventName) {
                case "pointermove":
                    registerOrUnregisterEvent(item, "touchmove", function (evt) { handleOtherEvent(evt, eventName); }, enable);
                    break;
                case "pointercancel":
                    registerOrUnregisterEvent(item, "touchcancel", function (evt) { handleOtherEvent(evt, eventName); }, enable);
                    break;
            }
        }
    };

    // Intercept addEventListener calls by changing the prototype
    var interceptAddEventListener = function (root) {
        var current = root.prototype ? root.prototype.addEventListener : root.addEventListener;

        var customAddEventListener = function (name, func, capture) {
            // Branch when a PointerXXX is used
            if (supportedEventsNames.indexOf(name) != -1) {
                setTouchAware(this, name, true);
            }

            if (current === undefined) {
                this.attachEvent("on" + getMouseEquivalentEventName(name), func);
            } else {
                current.call(this, name, func, capture);
            }
        };

        if (root.prototype) {
            root.prototype.addEventListener = customAddEventListener;
        } else {
            root.addEventListener = customAddEventListener;
        }
    };

    // Intercept removeEventListener calls by changing the prototype
    var interceptRemoveEventListener = function (root) {
        var current = root.prototype ? root.prototype.removeEventListener : root.removeEventListener;

        var customRemoveEventListener = function (name, func, capture) {
            // Release when a PointerXXX is used
            if (supportedEventsNames.indexOf(name) != -1) {
                setTouchAware(this, name, false);
            }

            if (current === undefined) {
                this.detachEvent(getMouseEquivalentEventName(name), func);
            } else {
                current.call(this, name, func, capture);
            }
        };
        if (root.prototype) {
            root.prototype.removeEventListener = customRemoveEventListener;
        } else {
            root.removeEventListener = customRemoveEventListener;
        }
    };

    // Hooks
    interceptAddEventListener(window);
    interceptAddEventListener(HTMLElement || Element);
    interceptAddEventListener(document);
    interceptAddEventListener(HTMLBodyElement);
    interceptAddEventListener(HTMLDivElement);
    interceptAddEventListener(HTMLImageElement);
    interceptAddEventListener(HTMLUListElement);
    interceptAddEventListener(HTMLAnchorElement);
    interceptAddEventListener(HTMLLIElement);
    interceptAddEventListener(HTMLTableElement);
    if (window.HTMLSpanElement) {
        interceptAddEventListener(HTMLSpanElement);
    }
    if (window.HTMLCanvasElement) {
        interceptAddEventListener(HTMLCanvasElement);
    }
    if (window.SVGElement) {
        interceptAddEventListener(SVGElement);
    }

    interceptRemoveEventListener(window);
    interceptRemoveEventListener(HTMLElement || Element);
    interceptRemoveEventListener(document);
    interceptRemoveEventListener(HTMLBodyElement);
    interceptRemoveEventListener(HTMLDivElement);
    interceptRemoveEventListener(HTMLImageElement);
    interceptRemoveEventListener(HTMLUListElement);
    interceptRemoveEventListener(HTMLAnchorElement);
    interceptRemoveEventListener(HTMLLIElement);
    interceptRemoveEventListener(HTMLTableElement);
    if (window.HTMLSpanElement) {
        interceptRemoveEventListener(HTMLSpanElement);
    }
    if (window.HTMLCanvasElement) {
        interceptRemoveEventListener(HTMLCanvasElement);
    }
    if (window.SVGElement) {
        interceptRemoveEventListener(SVGElement);
    }

    // Prevent mouse event from being dispatched after Touch Events action
    var touching = false;
    var touchTimer = -1;

    function setTouchTimer() {
        touching = true;
        clearTimeout(touchTimer);
        touchTimer = setTimeout(function () {
            touching = false;
        }, 700);
        // 1. Mobile browsers dispatch mouse events 300ms after touchend
        // 2. Chrome for Android dispatch mousedown for long-touch about 650ms
        // Result: Blocking Mouse Events for 700ms.
    }

    function getDomUpperHierarchy(node) {
        var nodes = [];
        if (node) {
            nodes.unshift(node);
            while (node.parentNode) {
                nodes.unshift(node.parentNode);
                node = node.parentNode;
            }
        }
        return nodes;
    }

    function getFirstCommonNode(node1, node2) {
        var parents1 = getDomUpperHierarchy(node1);
        var parents2 = getDomUpperHierarchy(node2);

        var lastmatch = null
        while (parents1.length > 0 && parents1[0] == parents2.shift())
            lastmatch = parents1.shift();
        return lastmatch;
    }

    //generateProxy receives a node to dispatch the event
    function dispatchPointerEnter(currentTarget, relatedTarget, generateProxy) {
        var commonParent = getFirstCommonNode(currentTarget, relatedTarget);
        var node = currentTarget;
        var nodelist = [];
        while (node && node != commonParent) {//target range: this to the direct child of parent relatedTarget
            if (checkEventRegistration(node, "pointerenter")) //check if any parent node has pointerenter
                nodelist.push(node);
            node = node.parentNode;
        }
        while (nodelist.length > 0)
            generateProxy(nodelist.pop());
    }

    //generateProxy receives a node to dispatch the event
    function dispatchPointerLeave(currentTarget, relatedTarget, generateProxy) {
        var commonParent = getFirstCommonNode(currentTarget, relatedTarget);
        var node = currentTarget;
        while (node && node != commonParent) {//target range: this to the direct child of parent relatedTarget
            if (checkEventRegistration(node, "pointerleave"))//check if any parent node has pointerleave
                generateProxy(node);
            node = node.parentNode;
        }
    }

    // Handling events on window to prevent unwanted super-bubbling
    // All mouse events are affected by touch fallback
    function applySimpleEventTunnels(nameGenerator, eventGenerator) {
        ["pointerdown", "pointermove", "pointerup", "pointerover", "pointerout"].forEach(function (eventName) {
            window.addEventListener(nameGenerator(eventName), function (evt) {
                // bem-bl prevent second pointerdown, because our i-fastclick triggers synthetic mousedown before click
                if(evt.forwardedTouchEvent) {
                    return;
                }

                if (!touching && findEventRegisteredNode(evt.target, eventName))
                    eventGenerator(evt, eventName, true);
            });
        });
        window.addEventListener(nameGenerator("pointerover"), function (evt) {
            if (touching)
                return;
            var foundNode = findEventRegisteredNode(evt.target, "pointerenter");
            if (!foundNode || foundNode === window)
                return;
            else if (!foundNode.contains(evt.relatedTarget)) {
                dispatchPointerEnter(foundNode, evt.relatedTarget, function (targetNode) {
                    eventGenerator(evt, "pointerenter", false, targetNode);
                });
            }
        });
        window.addEventListener(nameGenerator("pointerout"), function (evt) {
            if (touching)
                return;
            var foundNode = findEventRegisteredNode(evt.target, "pointerleave");
            if (!foundNode || foundNode === window)
                return;
            else if (!foundNode.contains(evt.relatedTarget)) {
                dispatchPointerLeave(foundNode, evt.relatedTarget, function (targetNode) {
                    eventGenerator(evt, "pointerleave", false, targetNode);
                });
            }
        });
    }

    (function () {
        if (window.MSPointerEvent) {
            //IE 10
            applySimpleEventTunnels(
                function (name) { return getPrefixEventName("MS", name); },
                generateTouchClonedEvent);
        }
        else {
            applySimpleEventTunnels(getMouseEquivalentEventName, generateMouseProxy);

            // Handling move on window to detect pointerleave/out/over
            if (window.ontouchstart !== undefined) {
                window.addEventListener('touchstart', function (eventObject) {
                    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                        var touchPoint = eventObject.changedTouches[i];
                        previousTargets[touchPoint.identifier] = touchPoint.target;

                        generateTouchEventProxyIfRegistered("pointerover", touchPoint, touchPoint.target, eventObject, true);

                        //pointerenter should not be bubbled
                        dispatchPointerEnter(touchPoint.target, null, function (targetNode) {
                            generateTouchEventProxy("pointerenter", touchPoint, targetNode, eventObject, false);
                        })

                        generateTouchEventProxyIfRegistered("pointerdown", touchPoint, touchPoint.target, eventObject, true);
                    }
                    setTouchTimer();
                });

                window.addEventListener('touchend', function (eventObject) {
                    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                        var touchPoint = eventObject.changedTouches[i];
                        var currentTarget = previousTargets[touchPoint.identifier];

                        generateTouchEventProxyIfRegistered("pointerup", touchPoint, currentTarget, eventObject, true);
                        generateTouchEventProxyIfRegistered("pointerout", touchPoint, currentTarget, eventObject, true);

                        //pointerleave should not be bubbled
                        dispatchPointerLeave(currentTarget, null, function (targetNode) {
                            generateTouchEventProxy("pointerleave", touchPoint, targetNode, eventObject, false);
                        })
                    }
                    setTouchTimer();
                });

                window.addEventListener('touchmove', function (eventObject) {
                    for (var i = 0; i < eventObject.changedTouches.length; ++i) {
                        var touchPoint = eventObject.changedTouches[i];
                        var newTarget = document.elementFromPoint(touchPoint.clientX, touchPoint.clientY);
                        var currentTarget = previousTargets[touchPoint.identifier];

                        // If force preventDefault
                        if (currentTarget && checkPreventDefault(currentTarget) === true)
                            eventObject.preventDefault();

                        if (currentTarget === newTarget) {
                            continue; // We can skip this as the pointer is effectively over the current target
                        }

                        if (currentTarget) {
                            // Raise out
                            generateTouchEventProxyIfRegistered("pointerout", touchPoint, currentTarget, eventObject, true);

                            // Raise leave
                            if (!currentTarget.contains(newTarget)) { // Leave must be called if the new target is not a child of the current
                                dispatchPointerLeave(currentTarget, newTarget, function (targetNode) {
                                    generateTouchEventProxy("pointerleave", touchPoint, targetNode, eventObject, false);
                                });
                            }
                        }

                        if (newTarget) {
                            // Raise over
                            generateTouchEventProxyIfRegistered("pointerover", touchPoint, newTarget, eventObject, true);

                            // Raise enter
                            if (!newTarget.contains(currentTarget)) { // Leave must be called if the new target is not the parent of the current
                                dispatchPointerEnter(newTarget, currentTarget, function (targetNode) {
                                    generateTouchEventProxy("pointerenter", touchPoint, targetNode, eventObject, false);
                                })
                            }
                        }
                        previousTargets[touchPoint.identifier] = newTarget;
                    }
                    setTouchTimer();
                });
            }
        }
    })();


    // Extension to navigator
    if (navigator.pointerEnabled === undefined) {

        // Indicates if the browser will fire pointer events for pointing input
        navigator.pointerEnabled = true;

        // IE
        if (navigator.msPointerEnabled) {
            navigator.maxTouchPoints = navigator.msMaxTouchPoints;
        }
    }

})();

/* end: ../../../libs/bem-bl/blocks-touch/i-pointer-events/i-pointer-events.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-bem/i-bem.js */
/** @requires jquery.inherit */
/** @requires jquery.isEmptyObject */
/** @requires jquery.identify */
/** @requires jquery.observable */

(function($, undefined) {

/**
 * Storage for deferred functions
 * @private
 * @type Array
 */
var afterCurrentEventFns = [],

/**
 * Storage for block declarations (hash by block name)
 * @private
 * @type Object
 */
    blocks = {},

/**
 * Communication channels
 * @static
 * @private
 * @type Object
 */
    channels = {};

/**
 * Builds the name of the handler method for setting a modifier
 * @static
 * @private
 * @param {String} elemName Element name
 * @param {String} modName Modifier name
 * @param {String} modVal Modifier value
 * @returns {String}
 */
function buildModFnName(elemName, modName, modVal) {

    return (elemName? '__elem_' + elemName : '') +
           '__mod' +
           (modName? '_' + modName : '') +
           (modVal? '_' + modVal : '');

}

/**
 * Transforms a hash of modifier handlers to methods
 * @static
 * @private
 * @param {Object} modFns
 * @param {Object} props
 * @param {String} [elemName]
 */
function modFnsToProps(modFns, props, elemName) {

    $.isFunction(modFns)?
        (props[buildModFnName(elemName, '*', '*')] = modFns) :
        $.each(modFns, function(modName, modFn) {
            $.isFunction(modFn)?
                (props[buildModFnName(elemName, modName, '*')] = modFn) :
                $.each(modFn, function(modVal, modFn) {
                    props[buildModFnName(elemName, modName, modVal)] = modFn;
                });
        });

}

function buildCheckMod(modName, modVal) {

    return modVal?
        Array.isArray(modVal)?
            function(block) {
                var i = 0, len = modVal.length;
                while(i < len)
                    if(block.hasMod(modName, modVal[i++]))
                        return true;
                return false;
            } :
            function(block) {
                return block.hasMod(modName, modVal);
            } :
        function(block) {
            return block.hasMod(modName);
        };

}

/** @namespace */
this.BEM = $.inherit($.observable, /** @lends BEM.prototype */ {

    /**
     * @class Base block for creating BEM blocks
     * @constructs
     * @private
     * @param {Object} mods Block modifiers
     * @param {Object} params Block parameters
     * @param {Boolean} [initImmediately=true]
     */
    __constructor : function(mods, params, initImmediately) {

        var _this = this;

        /**
         * Cache of block modifiers
         * @private
         * @type Object
         */
        _this._modCache = mods || {};

        /**
         * Current modifiers in the stack
         * @private
         * @type Object
         */
        _this._processingMods = {};

        /**
         * The block's parameters, taking into account the defaults
         * @protected
         * @type Object
         */
        _this._params = params; // это нужно для правильной сборки параметров у блока из нескольких нод
        _this.params = null;

        initImmediately !== false?
            _this._init() :
            _this.afterCurrentEvent(function() {
                _this._init();
            });

    },

    /**
     * Initializes the block
     * @private
     */
    _init : function() {

        if(!this._initing && !this.hasMod('js', 'inited')) {
            this._initing = true;

            if(!this.params) {
                this.params = $.extend(this.getDefaultParams(), this._params);
                delete this._params;
            }

            this.setMod('js', 'inited');
            delete this._initing;
            this.hasMod('js', 'inited') && this.trigger('init');
        }

        return this;

    },

    /**
     * Changes the context of the function being passed
     * @protected
     * @param {Function} fn
     * @param {Object} [ctx=this] Context
     * @returns {Function} Function with a modified context
     */
    changeThis : function(fn, ctx) {

        return fn.bind(ctx || this);

    },

    /**
     * Executes the function in the context of the block, after the "current event"
     * @protected
     * @param {Function} fn
     * @param {Object} [ctx] Context
     */
    afterCurrentEvent : function(fn, ctx) {

        this.__self.afterCurrentEvent(this.changeThis(fn, ctx));

    },

    /**
     * Executes the block's event handlers and live event handlers
     * @protected
     * @param {String} e Event name
     * @param {Object} [data] Additional information
     * @returns {BEM}
     */
    trigger : function(e, data) {

        this
            .__base(e = this.buildEvent(e), data)
            .__self.trigger(e, data);

        return this;

    },

    buildEvent : function(e) {

        typeof e == 'string' && (e = $.Event(e));
        e.block = this;

        return e;

    },

    /**
     * Checks whether a block or nested element has a modifier
     * @protected
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {Boolean}
     */
    hasMod : function(elem, modName, modVal) {

        var len = arguments.length,
            invert = false;

        if(len == 1) {
            modVal = '';
            modName = elem;
            elem = undefined;
            invert = true;
        }
        else if(len == 2) {
            if(typeof elem == 'string') {
                modVal = modName;
                modName = elem;
                elem = undefined;
            }
            else {
                modVal = '';
                invert = true;
            }
        }

        var res = this.getMod(elem, modName) === modVal;
        return invert? !res : res;

    },

    /**
     * Returns the value of the modifier of the block/nested element
     * @protected
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @returns {String} Modifier value
     */
    getMod : function(elem, modName) {

        var type = typeof elem;
        if(type === 'string' || type === 'undefined') { // elem either omitted or undefined
            modName = elem || modName;
            var modCache = this._modCache;
            return modName in modCache?
                modCache[modName] :
                modCache[modName] = this._extractModVal(modName);
        }

        return this._getElemMod(modName, elem);

    },

    /**
     * Returns the value of the modifier of the nested element
     * @private
     * @param {String} modName Modifier name
     * @param {Object} elem Nested element
     * @param {Object} [elem] Nested element name
     * @returns {String} Modifier value
     */
    _getElemMod : function(modName, elem, elemName) {

        return this._extractModVal(modName, elem, elemName);

    },

    /**
     * Returns values of modifiers of the block/nested element
     * @protected
     * @param {Object} [elem] Nested element
     * @param {String} [modName1, ..., modNameN] Modifier names
     * @returns {Object} Hash of modifier values
     */
    getMods : function(elem) {

        var hasElem = elem && typeof elem != 'string',
            _this = this,
            modNames = [].slice.call(arguments, hasElem? 1 : 0),
            res = _this._extractMods(modNames, hasElem? elem : undefined);

        if(!hasElem) { // caching
            modNames.length?
                modNames.forEach(function(name) {
                    _this._modCache[name] = res[name];
                }):
                _this._modCache = res;
        }

        return res;

    },

    /**
     * Sets the modifier for a block/nested element
     * @protected
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @returns {BEM}
     */
    setMod : function(elem, modName, modVal) {

        if(typeof modVal == 'undefined') {
            modVal = modName;
            modName = elem;
            elem = undefined;
        }

        var _this = this;

        if(!elem || elem[0]) {

            var modId = (elem && elem[0]? $.identify(elem[0]) : '') + '_' + modName;

            if(this._processingMods[modId]) return _this;

            var elemName,
                curModVal = elem?
                    _this._getElemMod(modName, elem, elemName = _this.__self._extractElemNameFrom(elem)) :
                    _this.getMod(modName);

            if(curModVal === modVal) return _this;

            this._processingMods[modId] = true;

            var needSetMod = true,
                modFnParams = [modName, modVal, curModVal];

            elem && modFnParams.unshift(elem);

            [['*', '*'], [modName, '*'], [modName, modVal]].forEach(function(mod) {
                needSetMod = _this._callModFn(elemName, mod[0], mod[1], modFnParams) !== false && needSetMod;
            });

            !elem && needSetMod && (_this._modCache[modName] = modVal);

            needSetMod && _this._afterSetMod(modName, modVal, curModVal, elem, elemName);

            delete this._processingMods[modId];
        }

        return _this;

    },

    /**
     * Function after successfully changing the modifier of the block/nested element
     * @protected
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @param {String} oldModVal Old modifier value
     * @param {Object} [elem] Nested element
     * @param {String} [elemName] Element name
     */
    _afterSetMod : function(modName, modVal, oldModVal, elem, elemName) {},

    /**
     * Sets a modifier for a block/nested element, depending on conditions.
     * If the condition parameter is passed: when true, modVal1 is set; when false, modVal2 is set.
     * If the condition parameter is not passed: modVal1 is set if modVal2 was set, or vice versa.
     * @protected
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @param {String} modVal1 First modifier value
     * @param {String} [modVal2] Second modifier value
     * @param {Boolean} [condition] Condition
     * @returns {BEM}
     */
    toggleMod : function(elem, modName, modVal1, modVal2, condition) {

        if(typeof elem == 'string') { // if this is a block
            condition = modVal2;
            modVal2 = modVal1;
            modVal1 = modName;
            modName = elem;
            elem = undefined;
        }
        if(typeof modVal2 == 'undefined') {
            modVal2 = '';
        } else if(typeof modVal2 == 'boolean') {
            condition = modVal2;
            modVal2 = '';
        }

        var modVal = this.getMod(elem, modName);
        (modVal == modVal1 || modVal == modVal2) &&
            this.setMod(
                elem,
                modName,
                typeof condition === 'boolean'?
                    (condition? modVal1 : modVal2) :
                    this.hasMod(elem, modName, modVal1)? modVal2 : modVal1);

        return this;

    },

    /**
     * Removes a modifier from a block/nested element
     * @protected
     * @param {Object} [elem] Nested element
     * @param {String} modName Modifier name
     * @returns {BEM}
     */
    delMod : function(elem, modName) {

        if(!modName) {
            modName = elem;
            elem = undefined;
        }

        return this.setMod(elem, modName, '');

    },

    /**
     * Executes handlers for setting modifiers
     * @private
     * @param {String} elemName Element name
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @param {Array} modFnParams Handler parameters
     */
    _callModFn : function(elemName, modName, modVal, modFnParams) {

        var modFnName = buildModFnName(elemName, modName, modVal);
        return this[modFnName]?
           this[modFnName].apply(this, modFnParams) :
           undefined;

    },

    /**
     * Retrieves the value of the modifier
     * @private
     * @param {String} modName Modifier name
     * @param {Object} [elem] Element
     * @returns {String} Modifier value
     */
    _extractModVal : function(modName, elem) {

        return '';

    },

    /**
     * Retrieves name/value for a list of modifiers
     * @private
     * @param {Array} modNames Names of modifiers
     * @param {Object} [elem] Element
     * @returns {Object} Hash of modifier values by name
     */
    _extractMods : function(modNames, elem) {

        return {};

    },

    /**
     * Returns a named communication channel
     * @param {String} [id='default'] Channel ID
     * @param {Boolean} [drop=false] Destroy the channel
     * @returns {$.observable|undefined} Communication channel
     */
    channel : function(id, drop) {

        return this.__self.channel(id, drop);

    },

    /**
     * Returns a block's default parameters
     * @returns {Object}
     */
    getDefaultParams : function() {

        return {};

    },

    /**
     * Helper for cleaning up block properties
     * @param {Object} [obj=this]
     */
    del : function(obj) {

        var args = [].slice.call(arguments);
        typeof obj == 'string' && args.unshift(this);
        this.__self.del.apply(this.__self, args);
        return this;

	},

    /**
     * Deletes a block
     */
    destruct : function() {}

}, {

    _name : 'i-bem',

    /**
     * Storage for block declarations (hash by block name)
     * @static
     * @protected
     * @type Object
     */
    blocks : blocks,

    /**
     * Declares blocks and creates a block class
     * @static
     * @protected
     * @param {String|Object} decl Block name (simple syntax) or description
     * @param {String} decl.block|decl.name Block name
     * @param {String} [decl.baseBlock] Name of the parent block
     * @param {String} [decl.modName] Modifier name
     * @param {String} [decl.modVal] Modifier value
     * @param {Object} [props] Methods
     * @param {Object} [staticProps] Static methods
     */
    decl : function(decl, props, staticProps) {

        if(typeof decl == 'string')
            decl = { block : decl };
        else if(decl.name) {
            decl.block = decl.name;
        }

        if(decl.baseBlock && !blocks[decl.baseBlock])
            throw('baseBlock "' + decl.baseBlock + '" for "' + decl.block + '" is undefined');

        props || (props = {});

        if(props.onSetMod) {
            modFnsToProps(props.onSetMod, props);
            delete props.onSetMod;
        }

        if(props.onElemSetMod) {
            $.each(props.onElemSetMod, function(elemName, modFns) {
                modFnsToProps(modFns, props, elemName);
            });
            delete props.onElemSetMod;
        }

        var baseBlock = blocks[decl.baseBlock || decl.block] || this;

        if(decl.modName) {
            var checkMod = buildCheckMod(decl.modName, decl.modVal);
            $.each(props, function(name, prop) {
                $.isFunction(prop) &&
                    (props[name] = function() {
                        var method;
                        if(checkMod(this)) {
                            method = prop;
                        } else {
                            var baseMethod = baseBlock.prototype[name];
                            baseMethod && baseMethod !== props[name] &&
                                (method = this.__base);
                        }
                        return method?
                            method.apply(this, arguments) :
                            undefined;
                    });
            });
        }

        if(staticProps && typeof staticProps.live === 'boolean') {
            var live = staticProps.live;
            staticProps.live = function() {
                return live;
            };
        }

        var block;
        if(decl.block == baseBlock._name) {
            // makes a new "live" if the old one was already executed
            (block = $.inheritSelf(baseBlock, props, staticProps))._processLive(true);
        } else {
            (block = blocks[decl.block] = $.inherit(baseBlock, props, staticProps))._name = decl.block;
            delete block._liveInitable;
        }

        return block;

    },

    /**
     * Processes a block's live properties
     * @private
     * @param {Boolean} [heedLive=false] Whether to take into account that the block already processed its live properties
     * @returns {Boolean} Whether the block is a live block
     */
    _processLive : function(heedLive) {

        return false;

    },

    /**
     * Factory method for creating an instance of the block named
     * @static
     * @param {String|Object} block Block name or description
     * @param {Object} [params] Block parameters
     * @returns {BEM}
     */
    create : function(block, params) {

        typeof block == 'string' && (block = { block : block });

        return new blocks[block.block](block.mods, params);

    },

    /**
     * Returns the name of the current block
     * @static
     * @protected
     * @returns {String}
     */
    getName : function() {

        return this._name;

    },

    /**
     * Retrieves the name of an element nested in a block
     * @static
     * @private
     * @param {Object} elem Nested element
     * @returns {String|undefined}
     */
    _extractElemNameFrom : function(elem) {},

    /**
     * Adds a function to the queue for executing after the "current event"
     * @static
     * @protected
     * @param {Function} fn
     * @param {Object} ctx
     */
    afterCurrentEvent : function(fn, ctx) {

        afterCurrentEventFns.push({ fn : fn, ctx : ctx }) == 1 &&
            setTimeout(this._runAfterCurrentEventFns, 0);

    },

    /**
     * Executes the queue
     * @private
     */
    _runAfterCurrentEventFns : function() {

        var fnsLen = afterCurrentEventFns.length;
        if(fnsLen) {
            var fnObj,
                fnsCopy = afterCurrentEventFns.splice(0, fnsLen);

            while(fnObj = fnsCopy.shift()) fnObj.fn.call(fnObj.ctx || this);
        }

    },

    /**
     * Changes the context of the function being passed
     * @protected
     * @param {Function} fn
     * @param {Object} ctx Context
     * @returns {Function} Function with a modified context
     */
    changeThis : function(fn, ctx) {

        return fn.bind(ctx || this);

    },

    /**
     * Helper for cleaning out properties
     * @param {Object} [obj=this]
     */
    del : function(obj) {

        var delInThis = typeof obj == 'string',
            i = delInThis? 0 : 1,
            len = arguments.length;
        delInThis && (obj = this);

        while(i < len) delete obj[arguments[i++]];

        return this;

	},

    /**
     * Returns/destroys a named communication channel
     * @param {String} [id='default'] Channel ID
     * @param {Boolean} [drop=false] Destroy the channel
     * @returns {$.observable|undefined} Communication channel
     */
    channel : function(id, drop) {

        if(typeof id == 'boolean') {
            drop = id;
            id = undefined;
        }

        id || (id = 'default');

        if(drop) {
            if(channels[id]) {
                channels[id].un();
                delete channels[id];
            }
            return;
        }

        return channels[id] || (channels[id] = new $.observable());

    }

});

})(jQuery);

/* end: ../../../libs/bem-bl/blocks-common/i-bem/i-bem.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-ecma/__object/i-ecma__object.js */
/**
 * Block i-ecma. Shim for some ES5 methods
 *
 * @block i-ecma
 */
(function() {

/**
 * Возвращает массив свойств объекта
 *
 * @param {Object} obj объект
 * @returns {Array}
 */
Object.keys || (Object.keys = function(obj) {
    var res = [];

    for(var i in obj) obj.hasOwnProperty(i) &&
        res.push(i);

    return res;
});

})();

/* end: ../../../libs/bem-bl/blocks-common/i-ecma/__object/i-ecma__object.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-ecma/__array/i-ecma__array.js */
(function() {

var ptp = Array.prototype,
    toStr = Object.prototype.toString,
    methods = {

        /**
         * Finds the index of an element in an array
         *
         * @param {Object} item
         * @param {Number} [fromIdx] Starting from index (length - 1 - fromIdx, if fromIdx < 0)
         * @returns {Number} Element index or -1, if not found
         */
        indexOf : function(item, fromIdx) {

            fromIdx = +(fromIdx || 0);

            var t = this, len = t.length;

            if(len > 0 && fromIdx < len) {
                fromIdx = fromIdx < 0? Math.ceil(fromIdx) : Math.floor(fromIdx);
                fromIdx < -len && (fromIdx = 0);
                fromIdx < 0 && (fromIdx = fromIdx + len);

                while(fromIdx < len) {
                    if(fromIdx in t && t[fromIdx] === item)
                        return fromIdx;
                    ++fromIdx;
                }
            }

            return -1;

        },

        /**
         * Calls the callback for each element
         *
         * @param {Function} callback Called for each element
         * @param {Object} [ctx=null] Callback context
         */
        forEach : function(callback, ctx) {

            var i = -1, t = this, len = t.length;
            while(++i < len) i in t &&
                (ctx? callback.call(ctx, t[i], i, t) : callback(t[i], i, t));

        },

        /**
         * Creates array B from array A so that B[i] = callback(A[i])
         * @param {Function} callback Called for each element
         * @param {Object} [ctx=null] Callback context
         * @returns {Array}
         */
        map : function(callback, ctx) {

            var i = -1, t = this, len = t.length,
                res = new Array(len);

            while(++i < len) i in t &&
                (res[i] = ctx? callback.call(ctx, t[i], i, t) : callback(t[i], i, t));

            return res;

        },

        /**
         * Creates an array containing only the elements from the source array that the callback returns true for. 
         * @param {Function} callback Called for each element
         * @param {Object} [ctx] Callback context
         * @returns {Array}
         */
        filter : function(callback, ctx) {

            var i = -1, t = this, len = t.length,
                res = [];

            while(++i < len) i in t &&
                (ctx? callback.call(ctx, t[i], i, t) : callback(t[i], i, t)) && res.push(t[i]);

            return res;

        },

        /**
         * Wraps the array using an accumulator
         * @param {Function} callback Called for each element
         * @param {Object} [initialVal] Initial value of the accumulator
         * @returns {Object} Accumulator
         */
        reduce : function(callback, initialVal) {

            var i = -1, t = this, len = t.length,
                res;

            if(arguments.length < 2) {
                while(++i < len) {
                    if(i in t) {
                        res = t[i];
                        break;
                    }
                }
            }
            else {
                res = initialVal;
            }

            while(++i < len) i in t &&
                (res = callback(res, t[i], i, t));

            return res;

        },

        /**
         * Checks whether at least one element in the array meets the condition in the callback
         * @param {Function} callback
         * @param {Object} [ctx=this] Callback context
         * @returns {Boolean}
         */
        some : function(callback, ctx) {

            var i = -1, t = this, len = t.length;

            while(++i < len)
                if(i in t && (ctx ? callback.call(ctx, t[i], i, t) : callback(t[i], i, t)))
                    return true;

            return false;

        },

        /**
         * Checks whether every element in the array meets the condition in the callback
         * @param {Function} callback
         * @param {Object} [ctx=this] Context of the callback call
         * @returns {Boolean}
         */
        every : function(callback, ctx) {

            var i = -1, t = this, len = t.length;

            while(++i < len)
                if(i in t && !(ctx ? callback.call(ctx, t[i], i, t) : callback(t[i], i, t)))
                    return false;

            return true;

        }

    };

for(var name in methods)
    ptp[name] || (ptp[name] = methods[name]);

Array.isArray || (Array.isArray = function(obj) {
    return toStr.call(obj) === '[object Array]';
});

})();

/* end: ../../../libs/bem-bl/blocks-common/i-ecma/__array/i-ecma__array.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-ecma/__function/i-ecma__function.js */
(function() {

var slice = Array.prototype.slice;

Function.prototype.bind || (Function.prototype.bind = function(ctx) {

    var fn = this,
        args = slice.call(arguments, 1);

    return function () {
        return fn.apply(ctx, args.concat(slice.call(arguments)));
    }

});

})();
/* end: ../../../libs/bem-bl/blocks-common/i-ecma/__function/i-ecma__function.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-bem/__internal/i-bem__internal.js */
/** @fileOverview Module for internal BEM helpers */
/** @requires BEM */

(function(BEM, $, undefined) {

/**
 * Separator for modifiers and their values
 * @const
 * @type String
 */
var MOD_DELIM = '_',

/**
 * Separator between names of a block and a nested element
 * @const
 * @type String
 */
    ELEM_DELIM = '__',

/**
 * Pattern for acceptable element and modifier names
 * @const
 * @type String
 */
    NAME_PATTERN = '[a-zA-Z0-9-]+';

function buildModPostfix(modName, modVal, buffer) {

    buffer.push(MOD_DELIM, modName, MOD_DELIM, modVal);

}

function buildBlockClass(name, modName, modVal, buffer) {

    buffer.push(name);
    modVal && buildModPostfix(modName, modVal, buffer);

}

function buildElemClass(block, name, modName, modVal, buffer) {

    buildBlockClass(block, undefined, undefined, buffer);
    buffer.push(ELEM_DELIM, name);
    modVal && buildModPostfix(modName, modVal, buffer);

}

BEM.INTERNAL = {

    NAME_PATTERN : NAME_PATTERN,

    MOD_DELIM : MOD_DELIM,
    ELEM_DELIM : ELEM_DELIM,

    buildModPostfix : function(modName, modVal, buffer) {

        var res = buffer || [];
        buildModPostfix(modName, modVal, res);
        return buffer? res : res.join('');

    },

    /**
     * Builds the class of a block or element with a modifier
     * @private
     * @param {String} block Block name
     * @param {String} [elem] Element name
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @param {Array} [buffer] Buffer
     * @returns {String|Array} Class or buffer string (depending on whether the buffer parameter is present)
     */
    buildClass : function(block, elem, modName, modVal, buffer) {

        var typeOf = typeof modName;
        if(typeOf == 'string') {
            if(typeof modVal != 'string' && typeof modVal != 'number') {
                buffer = modVal;
                modVal = modName;
                modName = elem;
                elem = undefined;
            }
        } else if(typeOf != 'undefined') {
            buffer = modName;
            modName = undefined;
        } else if(elem && typeof elem != 'string') {
            buffer = elem;
            elem = undefined;
        }

        if(!(elem || modName || buffer)) { // оптимизация для самого простого случая
            return block;
        }

        var res = buffer || [];

        elem?
            buildElemClass(block, elem, modName, modVal, res) :
            buildBlockClass(block, modName, modVal, res);

        return buffer? res : res.join('');

    },

    /**
     * Builds full classes for a buffer or element with modifiers
     * @private
     * @param {String} block Block name
     * @param {String} [elem] Element name
     * @param {Object} [mods] Modifiers
     * @param {Array} [buffer] Buffer
     * @returns {String|Array} Class or buffer string (depending on whether the buffer parameter is present)
     */
    buildClasses : function(block, elem, mods, buffer) {

        if(elem && typeof elem != 'string') {
            buffer = mods;
            mods = elem;
            elem = undefined;
        }

        var res = buffer || [];

        elem?
            buildElemClass(block, elem, undefined, undefined, res) :
            buildBlockClass(block, undefined, undefined, res);

        mods && $.each(mods, function(modName, modVal) {
            if(modVal) {
                res.push(' ');
                elem?
                    buildElemClass(block, elem, modName, modVal, res) :
                    buildBlockClass(block, modName, modVal, res);
            }
        });

        return buffer? res : res.join('');

        /*var typeOf = typeof elem;
        if(typeOf != 'string' && typeOf != 'undefined') {
            buffer = mods;
            mods = elem;
            elem = undefined;
        }
        if($.isArray(mods)) {
            buffer = mods;
            mods = undefined;
        }

        var res = buffer || [];
        buildClasses(block, elem, mods, res);
        return buffer? res : res.join('');*/

    }

}

})(BEM, jQuery);
/* end: ../../../libs/bem-bl/blocks-common/i-bem/__internal/i-bem__internal.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-jquery/__cookie/i-jquery__cookie.js */
/**
 * Cookie plugin
 *
 * Copyright (c) 2006 Klaus Hartl (stilbuero.de)
 * Dual licensed under the MIT and GPL licenses:
 * http://www.opensource.org/licenses/mit-license.php
 * http://www.gnu.org/licenses/gpl.html
 *
 */

/**
 * Create a cookie with the given name and value and other optional parameters.
 *
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Set the value of a cookie.
 * @example $.cookie('the_cookie', 'the_value', { expires: 7, path: '/', domain: 'jquery.com', secure: true });
 * @desc Create a cookie with all available options.
 * @example $.cookie('the_cookie', 'the_value');
 * @desc Create a session cookie.
 * @example $.cookie('the_cookie', null);
 * @desc Delete a cookie by passing null as value. Keep in mind that you have to use the same path and domain
 *       used when the cookie was set.
 *
 * @param String name The name of the cookie.
 * @param String value The value of the cookie.
 * @param Object options An object literal containing key/value pairs to provide optional cookie attributes.
 * @option Number|Date expires Either an integer specifying the expiration date from now on in days or a Date object.
 *                             If a negative value is specified (e.g. a date in the past), the cookie will be deleted.
 *                             If set to null or omitted, the cookie will be a session cookie and will not be retained
 *                             when the the browser exits.
 * @option String path The value of the path atribute of the cookie (default: path of page that created the cookie).
 * @option String domain The value of the domain attribute of the cookie (default: domain of page that created the cookie).
 * @option Boolean secure If true, the secure attribute of the cookie will be set and the cookie transmission will
 *                        require a secure protocol (like HTTPS).
 * @type undefined
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */

/**
 * Get the value of a cookie with the given name.
 *
 * @example $.cookie('the_cookie');
 * @desc Get the value of a cookie.
 *
 * @param String name The name of the cookie.
 * @return The value of the cookie.
 * @type String
 *
 * @name $.cookie
 * @cat Plugins/Cookie
 * @author Klaus Hartl/klaus.hartl@stilbuero.de
 */
jQuery.cookie = function(name, value, options) {
    if (typeof value != 'undefined') { // name and value given, set cookie
        options = options || {};
        if (value === null) {
            value = '';
            options.expires = -1;
        }
        var expires = '';
        if (options.expires && (typeof options.expires == 'number' || options.expires.toUTCString)) {
            var date;
            if (typeof options.expires == 'number') {
                date = new Date();
                date.setTime(date.getTime() + (options.expires * 24 * 60 * 60 * 1000));
            } else {
                date = options.expires;
            }
            expires = '; expires=' + date.toUTCString(); // use expires attribute, max-age is not supported by IE
        }
        // CAUTION: Needed to parenthesize options.path and options.domain
        // in the following expressions, otherwise they evaluate to undefined
        // in the packed version for some reason...
        var path = options.path ? '; path=' + (options.path) : '';
        var domain = options.domain ? '; domain=' + (options.domain) : '';
        var secure = options.secure ? '; secure' : '';
        document.cookie = [name, '=', encodeURIComponent(value), expires, path, domain, secure].join('');
    } else { // only name given, get cookie
        var cookieValue = null;
        if (document.cookie && document.cookie != '') {
            var cookies = document.cookie.split(';');
            for (var i = 0; i < cookies.length; i++) {
                var cookie = jQuery.trim(cookies[i]);
                // Does this cookie string begin with the name we want?
                if (cookie.substring(0, name.length + 1) == (name + '=')) {
                    cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                    break;
                }
            }
        }
        return cookieValue;
    }
};
/* end: ../../../libs/bem-bl/blocks-common/i-jquery/__cookie/i-jquery__cookie.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-jquery/__decodeuri/i-jquery__decodeuri.js */
/**
 * Plugin for decoding URI-escaped strings in CP1251 encoding
 *
 * Copyright (c) 2011-2012 Roman Rozhdestvenskiy (sbmaxx@gmail.com)
 */
(function($) {

// Equivalency table for cp1251 and utf8.
var map = { "%D0": "%D0%A0","%C0": "%D0%90","%C1": "%D0%91","%C2": "%D0%92","%C3": "%D0%93","%C4": "%D0%94","%C5": "%D0%95","%A8": "%D0%81","%C6": "%D0%96","%C7": "%D0%97","%C8": "%D0%98","%C9": "%D0%99","%CA": "%D0%9A","%CB": "%D0%9B","%CC": "%D0%9C","%CD": "%D0%9D","%CE": "%D0%9E","%CF": "%D0%9F","%D1": "%D0%A1","%D2": "%D0%A2","%D3": "%D0%A3","%D4": "%D0%A4","%D5": "%D0%A5","%D6": "%D0%A6","%D7": "%D0%A7","%D8": "%D0%A8","%D9": "%D0%A9","%DA": "%D0%AA","%DB": "%D0%AB","%DC": "%D0%AC","%DD": "%D0%AD","%DE": "%D0%AE","%DF": "%D0%AF","%E0": "%D0%B0","%E1": "%D0%B1","%E2": "%D0%B2","%E3": "%D0%B3","%E4": "%D0%B4","%E5": "%D0%B5","%B8": "%D1%91","%E6": "%D0%B6","%E7": "%D0%B7","%E8": "%D0%B8","%E9": "%D0%B9","%EA": "%D0%BA","%EB": "%D0%BB","%EC": "%D0%BC","%ED": "%D0%BD","%EE": "%D0%BE","%EF": "%D0%BF","%F0": "%D1%80","%F1": "%D1%81","%F2": "%D1%82","%F3": "%D1%83","%F4": "%D1%84","%F5": "%D1%85","%F6": "%D1%86","%F7": "%D1%87","%F8": "%D1%88","%F9": "%D1%89","%FA": "%D1%8A","%FB": "%D1%8B","%FC": "%D1%8C","%FD": "%D1%8D","%FE": "%D1%8E","%FF": "%D1%8F" };

function convert(str) {
    // Symbol code in cp1251 (hex) : symbol code in utf8)
    return str.replace(/%.{2}/g, function($0) { return map[$0] || $0; });
}

function decode(func, str) {

    var decoded = '';
    // try/catch block for getting the encoding of the source string
    // error is thrown if a non-UTF8 string is input
    // if the string was not decoded, it is returned without changes
    try {
        decoded = func(str);
    } catch (e) {
        try {
            decoded = func(convert(str));
        } catch (e) {
            decoded = str;
        }
    }
    return decoded;

}

$.extend({

    decodeURI : function(str) {
        return decode(decodeURI, str);
    },

    decodeURIComponent : function(str) {
        return decode(decodeURIComponent, str);
    }

});

})(jQuery);

/* end: ../../../libs/bem-bl/blocks-common/i-jquery/__decodeuri/i-jquery__decodeuri.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-bem/__dom/i-bem__dom.js */
/** @requires BEM */
/** @requires BEM.INTERNAL */

(function(BEM, $, undefined) {

var win = $(window),
    doc = $(document),

/**
 * Storage for DOM elements by unique key
 * @private
 * @type Object
 */
    uniqIdToDomElems = {},

/**
 * Storage for blocks by unique key
 * @static
 * @private
 * @type Object
 */
    uniqIdToBlock = {},

/**
 * Storage for block parameters
 * @private
 * @type Object
 */
    domElemToParams = {},

/**
 * Storage for liveCtx event handlers
 * @private
 * @type Object
 */
    liveEventCtxStorage = {},

/**
 * Storage for liveClass event handlers
 * @private
 * @type Object
 */
    liveClassEventStorage = {},

    blocks = BEM.blocks,

    INTERNAL = BEM.INTERNAL,

    NAME_PATTERN = INTERNAL.NAME_PATTERN,

    MOD_DELIM = INTERNAL.MOD_DELIM,
    ELEM_DELIM = INTERNAL.ELEM_DELIM,

    buildModPostfix = INTERNAL.buildModPostfix,
    buildClass = INTERNAL.buildClass,

    slice = Array.prototype.slice,
    reverse = Array.prototype.reverse;

/**
 * Initializes blocks on a DOM element
 * @private
 * @param {jQuery} domElem DOM element
 * @param {String} uniqInitId ID of the "initialization wave"
 */
function init(domElem, uniqInitId) {

    var domNode = domElem[0];
    $.each(getParams(domNode), function(blockName, params) {
        processParams(params, domNode, blockName, uniqInitId);
        var block = uniqIdToBlock[params.uniqId];
        if(block) {
            if(block.domElem.index(domNode) < 0) {
                block.domElem = block.domElem.add(domElem);
                $.extend(block._params, params);
            }
        } else {
            initBlock(blockName, domElem, params);
        }
    });

}

/**
 * Initializes a specific block on a DOM element, or returns the existing block if it was already created
 * @private
 * @param {String} blockName Block name
 * @param {jQuery} domElem DOM element
 * @param {Object} [params] Initialization parameters
 * @param {Boolean} [forceLive] Force live initialization
 * @param {Function} [callback] Handler to call after complete initialization
 */
function initBlock(blockName, domElem, params, forceLive, callback) {

    if(typeof params == 'boolean') {
        callback = forceLive;
        forceLive = params;
        params = undefined;
    }

    var domNode = domElem[0];
    params = processParams(params || getParams(domNode)[blockName], domNode, blockName);

    var uniqId = params.uniqId;
    if(uniqIdToBlock[uniqId]) {
        return uniqIdToBlock[uniqId]._init();
    }

    uniqIdToDomElems[uniqId] = uniqIdToDomElems[uniqId]?
        uniqIdToDomElems[uniqId].add(domElem) :
        domElem;

    var parentDomNode = domNode.parentNode;
    if(!parentDomNode || parentDomNode.nodeType === 11) { // jquery doesn't unique disconnected node
        $.unique(uniqIdToDomElems[uniqId]);
    }

    var blockClass = blocks[blockName] || DOM.decl(blockName, {}, { live : true });
    if(!(blockClass._liveInitable = !!blockClass._processLive()) || forceLive || params.live === false) {
        forceLive && domElem.addClass('i-bem');

        var block = new blockClass(uniqIdToDomElems[uniqId], params, !!forceLive);
        delete uniqIdToDomElems[uniqId];
        callback && callback.apply(block, slice.call(arguments, 4));
        return block;
    }

}

/**
 * Processes and adds necessary block parameters
 * @private
 * @param {Object} params Initialization parameters
 * @param {HTMLElement} domNode DOM node
 * @param {String} blockName Block name
 * @param {String} [uniqInitId] ID of the "initialization wave"
 */
function processParams(params, domNode, blockName, uniqInitId) {

    (params || (params = {})).uniqId ||
        (params.uniqId = (params.id? blockName + '-id-' + params.id : $.identify()) + (uniqInitId || $.identify()));

    var domUniqId = $.identify(domNode),
        domParams = domElemToParams[domUniqId] || (domElemToParams[domUniqId] = {});

    domParams[blockName] || (domParams[blockName] = params);

    return params;

}

/**
 * Helper for searching for a DOM element using a selector inside the context, including the context itself
 * @private
 * @param {jQuery} ctx Context
 * @param {String} selector CSS selector
 * @param {Boolean} [excludeSelf=false] Exclude context from search
 * @returns {jQuery}
 */
function findDomElem(ctx, selector, excludeSelf) {

    var res = ctx.find(selector);
    return excludeSelf?
       res :
       res.add(ctx.filter(selector));

}

/**
 * Returns parameters of a block's DOM element
 * @private
 * @param {HTMLElement} domNode DOM node
 * @returns {Object}
 */
function getParams(domNode) {

    var uniqId = $.identify(domNode);
    return domElemToParams[uniqId] ||
           (domElemToParams[uniqId] = extractParams(domNode));

}

/**
 * Retrieves block parameters from a DOM element
 * @private
 * @param {HTMLElement} domNode DOM node
 * @returns {Object}
 */
function extractParams(domNode) {

    var fn, elem,
        attr = domNode.getAttribute('data-bem');

    if (attr) return JSON.parse(attr);

    fn = domNode.onclick || domNode.ondblclick;
    if(!fn && domNode.tagName.toLowerCase() == 'body') { // LEGO-2027 in FF onclick doesn't work on body
        elem = $(domNode);
        attr = elem.attr('onclick') || elem.attr('ondblclick');
        attr && (fn = Function(attr));
    }

    return fn? fn() : {};

}

/**
 * Cleans up all the BEM storages associated with a DOM node
 * @private
 * @param {HTMLElement} domNode DOM node
 */
function cleanupDomNode(domNode) {

    delete domElemToParams[$.identify(domNode)];

}

/**
 * Uncople DOM node from the block. If this is the last node, then destroys the block.
 * @private
 * @param {BEM.DOM} block block
 * @param {HTMLElement} domNode DOM node
 */
function removeDomNodeFromBlock(block, domNode) {

    block.domElem.length === 1?
        block.destruct(true) :
        block.domElem = block.domElem.not(domNode);

}

/**
 * Returns a DOM node for calculating the window size in IE
 * @returns {HTMLElement}
 */
function getClientNode() {

    return doc[0][$.support.boxModel? 'documentElement' : 'body'];

}

/**
 * Returns a block on a DOM element and initializes it if necessary
 * @param {String} blockName Block name
 * @param {Object} params Block parameters
 * @returns {BEM}
 */
$.fn.bem = function(blockName, params) {
    return initBlock(blockName, this, params, true);
};

/**
 * Provides methods for work with DOM tree
 *
 * @block i-bem
 * @mod default
 */
var DOM = BEM.DOM = BEM.decl('i-bem__dom', {
    /**
     * @class Base block for creating BEM blocks that have DOM representation
     * @constructs
     * @private
     * @param {jQuery} domElem DOM element that the block is created on
     * @param {Object} params Block parameters
     * @param {Boolean} [initImmediately=true]
     */
    __constructor : function(domElem, params, initImmediately) {

        var _this = this;

        /**
         * Block's DOM elements
         * @protected
         * @type jQuery
         */
        _this.domElem = domElem;

        /**
         * Cache for names of events on DOM elements
         * @private
         * @type Object
         */
        _this._eventNameCache = {};

        /**
         * Cache for elements
         * @private
         * @type Object
         */
        _this._elemCache = {};

        /**
         * Unique block ID
         * @private
         * @type String
         */
        uniqIdToBlock[_this._uniqId = params.uniqId || $.identify(_this)] = _this;

        /**
         * Flag for whether it's necessary to unbind from the document and window when destroying the block
         * @private
         * @type Boolean
         */
        _this._needSpecialUnbind = false;

        _this.__base(null, params, initImmediately);

    },

    /**
     * Finds blocks inside the current block or its elements (including context)
     * @protected
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEM[]}
     */
    findBlocksInside : function(elem, block) {

        return this._findBlocks('find', elem, block);

    },

    /**
     * Finds the first block inside the current block or its elements (including context)
     * @protected
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEM}
     */
    findBlockInside : function(elem, block) {

        return this._findBlocks('find', elem, block, true);

    },

    /**
     * Finds blocks outside the current block or its elements (including context)
     * @protected
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEM[]}
     */
    findBlocksOutside : function(elem, block) {

        return this._findBlocks('parents', elem, block);

    },

    /**
     * Finds the first block outside the current block or its elements (including context)
     * @protected
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEM}
     */
    findBlockOutside : function(elem, block) {

        return this._findBlocks('closest', elem, block)[0] || null;

    },

    /**
     * Finds blocks on DOM elements of the current block or its elements
     * @protected
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEM[]}
     */
    findBlocksOn : function(elem, block) {

        return this._findBlocks('', elem, block);

    },

    /**
     * Finds the first block on DOM elements of the current block or its elements
     * @protected
     * @param {String|jQuery} [elem] Block element
     * @param {String|Object} block Name or description (block,modName,modVal) of the block to find
     * @returns {BEM}
     */
    findBlockOn : function(elem, block) {

        return this._findBlocks('', elem, block, true);

    },

    _findBlocks : function(select, elem, block, onlyFirst) {
        if(!this.domElem) return [];

        if(!block) {
            block = elem;
            elem = undefined;
        }

        var ctxElem = elem?
                (typeof elem == 'string'? this.findElem(elem) : elem) :
                this.domElem,
            isSimpleBlock = typeof block == 'string',
            blockName = isSimpleBlock? block : (block.block || block.blockName),
            selector = '.' +
                (isSimpleBlock?
                    buildClass(blockName) :
                    buildClass(blockName, block.modName, block.modVal)) +
                (onlyFirst? ':first' : ''),
            domElems = ctxElem.filter(selector);

        select && (domElems = domElems.add(ctxElem[select](selector)));

        if(onlyFirst) {
            return domElems[0]? initBlock(blockName, domElems.eq(0), true) : null;
        }

        var res = [],
            uniqIds = {};

        $.each(domElems, function(i, domElem) {
            var block = initBlock(blockName, $(domElem), true);
            if(!uniqIds[block._uniqId]) {
                uniqIds[block._uniqId] = true;
                res.push(block);
            }
        });

        return res;

    },

    /**
     * Adds an event handler for any DOM element
     * @protected
     * @param {jQuery} domElem DOM element where the event will be listened for
     * @param {String|Object} event Event name or event object
     * @param {Function} fn Handler function, which will be executed in the block's context
     * @returns {BEM}
     */
    bindToDomElem : function(domElem, event, fn) {

        var _this = this;

        fn?
            domElem.bind(
                _this._buildEventName(event),
                function(e) {
                    (e.data || (e.data = {})).domElem = $(this);
                    return fn.apply(_this, arguments);
                }
            ) :
            $.each(event, function(event, fn) {
                _this.bindToDomElem(domElem, event, fn);
            });

        return _this;

    },

    /**
     * Adds an event handler to the document
     * @protected
     * @param {String} event Event name
     * @param {Function} fn Handler function, which will be executed in the block's context
     * @returns {BEM}
     */
    bindToDoc : function(event, fn) {

        this._needSpecialUnbind = true;
        return this.bindToDomElem(doc, event, fn);

    },

    /**
     * Adds an event handler to the window
     * @protected
     * @param {String} event Event name
     * @param {Function} fn Handler function, which will be executed in the block's context
     * @returns {BEM}
     */
    bindToWin : function(event, fn) {

        var _fn = fn,
            currentHeight,
            currentWidth;

        if (event === 'resize') {

            fn = function() {

                var height = win.height(),
                    width = win.width();

                if (currentHeight !== height || currentWidth !== width) {

                    currentHeight = height;
                    currentWidth = width;

                    _fn.apply(this, arguments);

                }


            }

        }

        this._needSpecialUnbind = true;
        return this.bindToDomElem(win, event, fn);

    },

    /**
     * Adds an event handler to the block's main DOM elements or its nested elements
     * @protected
     * @param {jQuery|String} [elem] Element
     * @param {String} event Event name
     * @param {Function} fn Handler function, which will be executed in the block's context
     * @returns {BEM}
     */
    bindTo : function(elem, event, fn) {

        if(!event || $.isFunction(event)) { // if there is no element
            fn = event;
            event = elem;
            elem = this.domElem;
        } else if(typeof elem == 'string') {
            elem = this.elem(elem);
        }

        return this.bindToDomElem(elem, event, fn);

    },

    /**
     * Removes event handlers from any DOM element
     * @protected
     * @param {jQuery} domElem DOM element where the event was being listened for
     * @param {String} event Event name
     * @returns {BEM}
     */
    unbindFromDomElem : function(domElem, event) {

        domElem.unbind(this._buildEventName(event));
        return this;

    },

    /**
     * Removes event handler from document
     * @protected
     * @param {String} event Event name
     * @returns {BEM}
     */
    unbindFromDoc : function(event) {

        return this.unbindFromDomElem(doc, event);

    },

    /**
     * Removes event handler from window
     * @protected
     * @param {String} event Event name
     * @returns {BEM}
     */
    unbindFromWin : function(event) {

        return this.unbindFromDomElem(win, event);

    },

    /**
     * Removes event handlers from the block's main DOM elements or its nested elements
     * @protected
     * @param {jQuery|String} [elem] Nested element
     * @param {String} event Event name
     * @returns {BEM}
     */
    unbindFrom : function(elem, event) {

        if(!event) {
            event = elem;
            elem = this.domElem;
        } else if(typeof elem == 'string') {
            elem = this.elem(elem);
        }

        return this.unbindFromDomElem(elem, event);

    },

    /**
     * Builds a full name for an event
     * @private
     * @param {String} event Event name
     * @returns {String}
     */
    _buildEventName : function(event) {

        var _this = this;
        return event.indexOf(' ') > 1?
            event.split(' ').map(function(e) {
                return _this._buildOneEventName(e);
            }).join(' ') :
            _this._buildOneEventName(event);

    },

    /**
     * Builds a full name for a single event
     * @private
     * @param {String} event Event name
     * @returns {String}
     */
    _buildOneEventName : function(event) {

        var _this = this,
            eventNameCache = _this._eventNameCache;

        if(event in eventNameCache) return eventNameCache[event];

        var uniq = '.' + _this._uniqId;

        if(event.indexOf('.') < 0) return eventNameCache[event] = event + uniq;

        var lego = '.bem_' + _this.__self._name;

        return eventNameCache[event] = event.split('.').map(function(e, i) {
            return i == 0? e + lego : lego + '_' + e;
        }).join('') + uniq;

    },

    /**
     * Triggers block event handlers and live event handlers
     * @protected
     * @param {String} e Event name
     * @param {Object} [data] Additional information
     * @returns {BEM}
     */
    trigger : function(e, data) {

        this
            .__base(e = this.buildEvent(e), data)
            .domElem && this._ctxTrigger(e, data);

        return this;

    },

    _ctxTrigger : function(e, data) {

        var _this = this,
            storage = liveEventCtxStorage[_this.__self._buildCtxEventName(e.type)],
            ctxIds = {};

        storage && _this.domElem.each(function() {
            var ctx = this,
                counter = storage.counter;
            while(ctx && counter) {
                var ctxId = $.identify(ctx, true);
                if(ctxId) {
                    if(ctxIds[ctxId]) break;
                    var storageCtx = storage.ctxs[ctxId];
                    if(storageCtx) {
                        $.each(storageCtx, function(uniqId, handler) {
                            handler.fn.call(
                                handler.ctx || _this,
                                e,
                                data);
                        });
                        counter--;
                    }
                    ctxIds[ctxId] = true;
                }
                ctx = ctx.parentNode;
            }
        });

    },

    /**
     * Sets a modifier for a block/nested element
     * @protected
     * @param {jQuery} [elem] Nested element
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @returns {BEM}
     */
    setMod : function(elem, modName, modVal) {

        if(elem && typeof modVal != 'undefined' && elem.length > 1) {
            var _this = this;
            elem.each(function() {
                var item = $(this);
                item.__bemElemName = elem.__bemElemName;
                _this.setMod(item, modName, modVal);
            });
            return _this;
        }
        return this.__base(elem, modName, modVal);

    },

    /**
     * Retrieves modifier value from the DOM node's CSS class
     * @private
     * @param {String} modName Modifier name
     * @param {jQuery} [elem] Nested element
     * @param {String} [elemName] Name of the nested element
     * @returns {String} Modifier value
     */
    _extractModVal : function(modName, elem, elemName) {

        var domNode = (elem || this.domElem)[0],
            matches;

        domNode &&
            (matches = domNode.className
                .match(this.__self._buildModValRE(modName, elemName || elem)));

        return matches? matches[2] : '';

    },

    /**
     * Retrieves a name/value list of modifiers
     * @private
     * @param {Array} [modNames] Names of modifiers
     * @param {Object} [elem] Element
     * @returns {Object} Hash of modifier values by names
     */
    _extractMods : function(modNames, elem) {

        var res = {},
            extractAll = !modNames.length,
            countMatched = 0;

        ((elem || this.domElem)[0].className
            .match(this.__self._buildModValRE(
                '(' + (extractAll? NAME_PATTERN : modNames.join('|')) + ')',
                elem,
                'g')) || []).forEach(function(className) {
                    var iModVal = (className = className.trim()).lastIndexOf(MOD_DELIM),
                        iModName = className.substr(0, iModVal - 1).lastIndexOf(MOD_DELIM);
                    res[className.substr(iModName + 1, iModVal - iModName - 1)] = className.substr(iModVal + 1);
                    ++countMatched;
                });

        // empty modifier values are not reflected in classes; they must be filled with empty values
        countMatched < modNames.length && modNames.forEach(function(modName) {
            modName in res || (res[modName] = '');
        });

        return res;

    },

    /**
     * Sets a modifier's CSS class for a block's DOM element or nested element
     * @private
     * @param {String} modName Modifier name
     * @param {String} modVal Modifier value
     * @param {String} oldModVal Old modifier value
     * @param {jQuery} [elem] Element
     * @param {String} [elemName] Element name
     */
    _afterSetMod : function(modName, modVal, oldModVal, elem, elemName) {

        var _self = this.__self,
            classPrefix = _self._buildModClassPrefix(modName, elemName),
            classRE = _self._buildModValRE(modName, elemName),
            needDel = modVal === '';

        (elem || this.domElem).each(function() {
            var className = this.className;
            className.indexOf(classPrefix) > -1?
                this.className = className.replace(
                    classRE,
                    (needDel? '' : '$1' + classPrefix + modVal)) :
                needDel || $(this).addClass(classPrefix + modVal);
        });

        elemName && this
            .dropElemCache(elemName, modName, oldModVal)
            .dropElemCache(elemName, modName, modVal);

    },

    /**
     * Finds elements nested in a block
     * @protected
     * @param {String|jQuery} [ctx=this.domElem] Element where search is being performed
     * @param {String} names Nested element name (or names separated by spaces)
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {jQuery} DOM elements
     */
    findElem : function(ctx, names, modName, modVal) {

        if(arguments.length % 2) { // if the number of arguments is one or three
            modVal = modName;
            modName = names;
            names = ctx;
            ctx = this.domElem;
        } else if(typeof ctx == 'string') {
            ctx = this.findElem(ctx);
        }

        var _self = this.__self,
            selector = '.' +
                names.split(' ').map(function(name) {
                    return buildClass(_self._name, name, modName, modVal);
                }).join(',.');
        return findDomElem(ctx, selector);

    },

    /**
     * Finds elements nested in a block
     * @protected
     * @param {String} name Nested element name
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {jQuery} DOM elements
     */
    _elem : function(name, modName, modVal) {

        var key = name + buildModPostfix(modName, modVal),
            res;

        if(!(res = this._elemCache[key])) {
            res = this._elemCache[key] = this.findElem(name, modName, modVal);
            res.__bemElemName = name;
        }

        return res;

    },

    /**
     * Lazy search for elements nested in a block (caches results)
     * @protected
     * @param {String} names Nested element name (or names separated by spaces)
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {jQuery} DOM elements
     */
    elem : function(names, modName, modVal) {

        if(modName && typeof modName != 'string') {
            modName.__bemElemName = names;
            return modName;
        }

        if(names.indexOf(' ') < 0) {
            return this._elem(names, modName, modVal);
        }

        var res = $([]),
            _this = this;
        names.split(' ').forEach(function(name) {
            res = res.add(_this._elem(name, modName, modVal));
        });
        return res;

    },

    /**
     * Clearing the cache for elements
     * @protected
     * @param {String} [names] Nested element name (or names separated by spaces)
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {BEM}
     */
    dropElemCache : function(names, modName, modVal) {

        if(names) {
            var _this = this,
                modPostfix = buildModPostfix(modName, modVal);
            names.indexOf(' ') < 0?
                delete _this._elemCache[names + modPostfix] :
                names.split(' ').forEach(function(name) {
                    delete _this._elemCache[name + modPostfix];
                });
        } else {
            this._elemCache = {};
        }

        return this;

    },

    /**
     * Retrieves parameters of a block element
     * @param {String|jQuery} elem Element
     * @returns {Object} Parameters
     */
    elemParams : function(elem) {

        var elemName;
        if(typeof elem ==  'string') {
            elemName = elem;
            elem = this.elem(elem);
        } else {
            elemName = this.__self._extractElemNameFrom(elem);
        }

        return extractParams(elem[0])[buildClass(this.__self.getName(), elemName)] || {};

    },

    /**
     * Elemify given element
     * @param {jQuery} elem Element
     * @param {String} elemName Name
     * @returns {jQuery}
     */
    elemify : function(elem, elemName) {
        (elem = $(elem)).__bemElemName = elemName;
        return elem;
    },

    /**
     * Checks whether a DOM element is in a block
     * @protected
     * @param {jQuery} domElem DOM element
     * @returns {Boolean}
     */
    containsDomElem : function(domElem) {

        var res = false;

        this.domElem.each(function() {
            return !(res = domElem.parents().andSelf().index(this) > -1);
        });

        return res;

    },

    /**
     * Builds a CSS selector corresponding to a block/element and modifier
     * @param {String} [elem] Element name
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {String}
     */
    buildSelector : function(elem, modName, modVal) {

        return this.__self.buildSelector(elem, modName, modVal);

    },

    /**
     * Deletes a block
     * @param {Boolean} [keepDOM=false] Whether to keep the block's DOM nodes in the document
     */
    destruct : function(keepDOM) {

        var _this = this,
            _self = _this.__self;

        if(_this._isDestructing) return;

        _this._isDestructing = true;

        _this._needSpecialUnbind && _self.doc.add(_self.win).unbind('.' + _this._uniqId);

        _this.dropElemCache().domElem.each(function(i, domNode) {
            var params = getParams(domNode);
            $.each(params, function(blockName, blockParams) {
                var block = uniqIdToBlock[blockParams.uniqId];
                block?
                    block._isDestructing || removeDomNodeFromBlock(block, domNode) :
                    delete uniqIdToDomElems[blockParams.uniqId];
            });
            cleanupDomNode(domNode);
        });

        keepDOM || _this.domElem.remove();

        delete uniqIdToBlock[_this.un()._uniqId];
        delete _this.domElem;
        delete _this._elemCache;

        _this.__base();

    }

}, {

    /**
     * Scope
     * Will be set on onDomReady to tag `body`
     * @protected
     * @type jQuery
     */
    scope : null,

    /**
     * Document shortcut
     * @protected
     * @type jQuery
     */
    doc : doc,

    /**
     * Window shortcut
     * @protected
     * @type jQuery
     */
    win : win,

    /**
     * Processes a block's live properties
     * @private
     * @param {Boolean} [heedLive=false] Whether to take into account that the block already processed its live properties
     * @returns {Boolean} Whether the block is a live block
     */
    _processLive : function(heedLive) {

        var _this = this,
            res = _this._liveInitable;

        if('live' in _this) {
            var noLive = typeof res == 'undefined';

            if(noLive ^ heedLive) {
                res = _this.live() !== false;

                var blockName = _this.getName(),
                    origLive = _this.live;

                _this.live = function() {
                    return this.getName() === blockName?
                        res :
                        origLive.apply(this, arguments);
                };
            }
        }

        return res;

    },

    /**
     * Initializes blocks on a fragment of the DOM tree
     * @static
     * @protected
     * @param {jQuery} [ctx=document] Root DOM node
     * @returns {jQuery} ctx Initialization context
     */
    init : function(ctx, callback, callbackCtx) {

        if(!ctx || $.isFunction(ctx)) {
            callbackCtx = callback;
            callback = ctx;
            ctx = doc;
        }

        var uniqInitId = $.identify();
        findDomElem(ctx, '.i-bem').each(function() {
            init($(this), uniqInitId);
        });

        callback && this.afterCurrentEvent(
            function() {
                callback.call(callbackCtx || this, ctx);
            });

        // makes initialization completely synchronous
        this._runAfterCurrentEventFns();

        return ctx;

    },

    /**
     * Destroys blocks on a fragment of the DOM tree
     * @static
     * @protected
     * @param {Boolean} [keepDOM=false] Whether to keep DOM nodes in the document
     * @param {jQuery} ctx Root DOM node
     * @param {Boolean} [excludeSelf=false] Exclude the context
     */
    destruct : function(keepDOM, ctx, excludeSelf) {

        if(typeof keepDOM != 'boolean') {
            excludeSelf = ctx;
            ctx = keepDOM;
            keepDOM = undefined;
        }

        reverse.call(findDomElem(ctx, '.i-bem', excludeSelf)).each(function(i, domNode) {
            var params = getParams(this);
            $.each(params, function(blockName, blockParams) {
                if(blockParams.uniqId) {
                    var block = uniqIdToBlock[blockParams.uniqId];
                    block?
                        removeDomNodeFromBlock(block, domNode) :
                        delete uniqIdToDomElems[blockParams.uniqId];
                }
            });
            cleanupDomNode(this);
        });
        keepDOM || (excludeSelf? ctx.empty() : ctx.remove());

    },

    /**
     * Replaces a fragment of the DOM tree inside the context, destroying old blocks and intializing new ones
     * @static
     * @protected
     * @param {jQuery} ctx Root DOM node
     * @param {jQuery|String} content New content
     * @param {Function} [callback] Handler to be called after initialization
     * @param {Object} [callbackCtx] Handler's context
     */
    update : function(ctx, content, callback, callbackCtx) {

        this.destruct(ctx, true);
        this.init(ctx.html(content), callback, callbackCtx);

    },

    /**
     * Changes a fragment of the DOM tree including the context and initializes blocks.
     * @param {jQuery} ctx Root DOM node
     * @param {jQuery|String} content Content to be added
     */
    replace : function(ctx, content) {

        this.destruct(true, ctx);
        this.init($(content).replaceAll(ctx));

    },

    /**
     * Adds a fragment of the DOM tree at the end of the context and initializes blocks
     * @param {jQuery} ctx Root DOM node
     * @param {jQuery|String} content Content to be added
     */
    append : function(ctx, content) {

        this.init($(content).appendTo(ctx));

    },

    /**
     * Adds a fragment of the DOM tree at the beginning of the context and initializes blocks
     * @param {jQuery} ctx Root DOM node
     * @param {jQuery|String} content Content to be added
     */
    prepend : function(ctx, content) {

        this.init($(content).prependTo(ctx));

    },

    /**
     * Adds a fragment of the DOM tree before the context and initializes blocks
     * @param {jQuery} ctx Contextual DOM node
     * @param {jQuery|String} content Content to be added
     */
    before : function(ctx, content) {

        this.init($(content).insertBefore(ctx));

    },

    /**
     * Adds a fragment of the DOM tree after the context and initializes blocks
     * @param {jQuery} ctx Contextual DOM node
     * @param {jQuery|String} content Content to be added
     */
    after : function(ctx, content) {

        this.init($(content).insertAfter(ctx));

    },

    /**
     * Builds a full name for a live event
     * @static
     * @private
     * @param {String} e Event name
     * @returns {String}
     */
    _buildCtxEventName : function(e) {

        return this._name + ':' + e;

    },

    _liveClassBind : function(className, e, callback, invokeOnInit) {

        var _this = this;
        if(e.indexOf(' ') > -1) {
            e.split(' ').forEach(function(e) {
                _this._liveClassBind(className, e, callback, invokeOnInit);
            });
        }
        else {
            var storage = liveClassEventStorage[e],
                uniqId = $.identify(callback);

            if(!storage) {
                storage = liveClassEventStorage[e] = {};
                doc.bind(e, _this.changeThis(_this._liveClassTrigger, _this));
            }

            storage = storage[className] || (storage[className] = { uniqIds : {}, fns : [] });

            if(!(uniqId in storage.uniqIds)) {
                storage.fns.push({ uniqId : uniqId, fn : _this._buildLiveEventFn(callback, invokeOnInit) });
                storage.uniqIds[uniqId] = storage.fns.length - 1;
            }
        }

        return this;

    },

    _liveClassUnbind : function(className, e, callback) {

        var storage = liveClassEventStorage[e];
        if(storage) {
            if(callback) {
                if(storage = storage[className]) {
                    var uniqId = $.identify(callback);
                    if(uniqId in storage.uniqIds) {
                        var i = storage.uniqIds[uniqId],
                            len = storage.fns.length - 1;
                        storage.fns.splice(i, 1);
                        while(i < len) storage.uniqIds[storage.fns[i++].uniqId] = i - 1;
                        delete storage.uniqIds[uniqId];
                    }
                }
            } else {
                delete storage[className];
            }
        }

        return this;

    },

    _liveClassTrigger : function(e) {

        var storage = liveClassEventStorage[e.type];
        if(storage) {
            var node = e.target, classNames = [];
            for(var className in storage) storage.hasOwnProperty(className) && classNames.push(className);
            do {
                var nodeClassName = ' ' + node.className + ' ', i = 0;
                while(className = classNames[i++]) {
                    if(nodeClassName.indexOf(' ' + className + ' ') > -1) {
                        var j = 0, fns = storage[className].fns, fn, stopPropagationAndPreventDefault = false;
                        while(fn = fns[j++])
                            if(fn.fn.call($(node), e) === false) stopPropagationAndPreventDefault = true;

                        stopPropagationAndPreventDefault && e.preventDefault();
                        if(stopPropagationAndPreventDefault || e.isPropagationStopped()) return;

                        classNames.splice(--i, 1);
                    }
                }
            } while(classNames.length && (node = node.parentNode));
        }

    },

    _buildLiveEventFn : function(callback, invokeOnInit) {

        var _this = this;
        return function(e) {
            var args = [
                    _this._name,
                    ((e.data || (e.data = {})).domElem = $(this)).closest(_this.buildSelector()),
                    true ],
                block = initBlock.apply(null, invokeOnInit? args.concat([callback, e]) : args);

            if(block && !invokeOnInit && callback)
                return callback.apply(block, arguments);
        };

    },

    /**
     * Helper for live initialization for an event on DOM elements of a block or its elements
     * @static
     * @protected
     * @param {String} [elemName] Element name or names (separated by spaces)
     * @param {String} event Event name
     * @param {Function} [callback] Handler to call after successful initialization
     */
    liveInitOnEvent : function(elemName, event, callback) {

        return this.liveBindTo(elemName, event, callback, true);

    },

    /**
     * Helper for subscribing to live events on DOM elements of a block or its elements
     * @static
     * @protected
     * @param {String|Object} [to] Description (object with modName, modVal, elem) or name of the element or elements (space-separated)
     * @param {String} event Event name
     * @param {Function} [callback] Handler
     */
    liveBindTo : function(to, event, callback, invokeOnInit) {

        if(!event || $.isFunction(event)) {
            callback = event;
            event = to;
            to = undefined;
        }

        if(!to || typeof to == 'string') {
            to = { elem : to };
        }

        to.elemName && (to.elem = to.elemName);

        var _this = this;

        if(to.elem && to.elem.indexOf(' ') > 0) {
            to.elem.split(' ').forEach(function(elem) {
                _this._liveClassBind(
                    buildClass(_this._name, elem, to.modName, to.modVal),
                    event,
                    callback,
                    invokeOnInit);
            });
            return _this;
        }

        return _this._liveClassBind(
            buildClass(_this._name, to.elem, to.modName, to.modVal),
            event,
            callback,
            invokeOnInit);

    },

    /**
     * Helper for unsubscribing from live events on DOM elements of a block or its elements
     * @static
     * @protected
     * @param {String} [elem] Name of the element or elements (space-separated)
     * @param {String} event Event name
     * @param {Function} [callback] Handler
     */
    liveUnbindFrom : function(elem, event, callback) {

        if (!event || $.isFunction(event)) {
            callback = event;
            event = elem;
            elem = undefined;
        }

        var _this = this;

        if(elem && elem.indexOf(' ') > 1) {
            elem.split(' ').forEach(function(elem) {
                _this._liveClassUnbind(
                    buildClass(_this._name, elem),
                    event,
                    callback);
            });
            return _this;
        }

        return _this._liveClassUnbind(
            buildClass(_this._name, elem),
            event,
            callback);

    },

    /**
     * Helper for live initialization when a different block is initialized
     * @static
     * @private
     * @param {String} event Event name
     * @param {String} blockName Name of the block that should trigger a reaction when initialized
     * @param {Function} callback Handler to be called after successful initialization in the new block's context
     * @param {String} findFnName Name of the method for searching
     */
    _liveInitOnBlockEvent : function(event, blockName, callback, findFnName) {

        var name = this._name;
        blocks[blockName].on(event, function(e) {
            if(!e.block.domElem) return; // if block was destructed at that moment

            var args = arguments,
                blocks = e.block[findFnName](name);

            callback && blocks.forEach(function(block) {
                callback.apply(block, args);
            });
        });
        return this;

    },

    /**
     * Helper for live initialization for a different block's event on the current block's DOM element
     * @static
     * @protected
     * @param {String} event Event name
     * @param {String} blockName Name of the block that should trigger a reaction when initialized
     * @param {Function} callback Handler to be called after successful initialization in the new block's context
     */
    liveInitOnBlockEvent : function(event, blockName, callback) {

        return this._liveInitOnBlockEvent(event, blockName, callback, 'findBlocksOn');

    },

    /**
     * Helper for live initialization for a different block's event inside the current block
     * @static
     * @protected
     * @param {String} event Event name
     * @param {String} blockName Name of the block that should trigger a reaction when initialized
     * @param {Function} [callback] Handler to be called after successful initialization in the new block's context
     */
    liveInitOnBlockInsideEvent : function(event, blockName, callback) {

        return this._liveInitOnBlockEvent(event, blockName, callback, 'findBlocksOutside');

    },

    /**
     * Helper for live initialization when a different block is initialized on a DOM element of the current block
     * @deprecated - use liveInitOnBlockEvent
     * @static
     * @protected
     * @param {String} blockName Name of the block that should trigger a reaction when initialized
     * @param {Function} callback Handler to be called after successful initialization in the new block's context
     */
    liveInitOnBlockInit : function(blockName, callback) {

        return this.liveInitOnBlockEvent('init', blockName, callback);

    },

    /**
     * Helper for live initialization when a different block is initialized inside the current block
     * @deprecated - use liveInitOnBlockInsideEvent
     * @static
     * @protected
     * @param {String} blockName Name of the block that should trigger a reaction when initialized
     * @param {Function} [callback] Handler to be called after successful initialization in the new block's context
     */
    liveInitOnBlockInsideInit : function(blockName, callback) {

        return this.liveInitOnBlockInsideEvent('init', blockName, callback);

    },

    /**
     * Adds a live event handler to a block, based on a specified element where the event will be listened for
     * @static
     * @protected
     * @param {jQuery} [ctx] The element in which the event will be listened for
     * @param {String} e Event name
     * @param {Object} [data] Additional information that the handler gets as e.data
     * @param {Function} fn Handler
     * @param {Object} [fnCtx] Handler's context
     */
    on : function(ctx, e, data, fn, fnCtx) {

        return ctx.jquery?
            this._liveCtxBind(ctx, e, data, fn, fnCtx) :
            this.__base(ctx, e, data, fn);

    },

    /**
     * Removes the live event handler from a block, based on a specified element where the event was being listened for
     * @static
     * @protected
     * @param {jQuery} [ctx] The element in which the event was being listened for
     * @param {String} e Event name
     * @param {Function} [fn] Handler
     * @param {Object} [fnCtx] Handler context
     */
    un : function(ctx, e, fn, fnCtx) {

        return ctx.jquery?
            this._liveCtxUnbind(ctx, e, fn, fnCtx) :
            this.__base(ctx, e, fn);

    },

    /**
     * Adds a live event handler to a block, based on a specified element where the event will be listened for
     * @deprecated Use on
     * @static
     * @protected
     * @param {jQuery} ctx The element in which the event will be listened for
     * @param {String} e Event name
     * @param {Object} [data] Additional information that the handler gets as e.data
     * @param {Function} fn Handler
     * @param {Object} [fnCtx] Handler context
     */
    liveCtxBind : function(ctx, e, data, fn, fnCtx) {

        return this._liveCtxBind(ctx, e, data, fn, fnCtx);

    },

    /**
     * Adds a live event handler to a block, based on a specified element where the event will be listened for
     * @static
     * @private
     * @param {jQuery} ctx The element in which the event will be listened for
     * @param {String} e  Event name
     * @param {Object} [data] Additional information that the handler gets as e.data
     * @param {Function} fn Handler
     * @param {Object} [fnCtx] Handler context
     */
    _liveCtxBind : function(ctx, e, data, fn, fnCtx) {

        var _this = this;

        if(typeof e == 'string') {
            if($.isFunction(data)) {
                fnCtx = fn;
                fn = data;
                data = undefined;
            }

            if(e.indexOf(' ') > -1) {
                e.split(' ').forEach(function(e) {
                    _this._liveCtxBind(ctx, e, data, fn, fnCtx);
                });
            } else {
                var ctxE = _this._buildCtxEventName(e),
                    storage = liveEventCtxStorage[ctxE] ||
                        (liveEventCtxStorage[ctxE] = { counter : 0, ctxs : {} });

                ctx.each(function() {
                    var ctxId = $.identify(this),
                        ctxStorage = storage.ctxs[ctxId];
                    if(!ctxStorage) {
                        ctxStorage = storage.ctxs[ctxId] = {};
                        ++storage.counter;
                    }
                    ctxStorage[$.identify(fn) + (fnCtx? $.identify(fnCtx) : '')] = {
                        fn   : fn,
                        data : data,
                        ctx  : fnCtx
                    };
                });
            }
        } else {
            $.each(e, function(e, fn) {
                _this._liveCtxBind(ctx, e, fn, data);
            });
        }

        return _this;

    },

    /**
     * Removes a live event handler from a block, based on a specified element where the event was being listened for
     * @deprecated Use on
     * @static
     * @protected
     * @param {jQuery} ctx The element in which the event was being listened for
     * @param {String} e Event name
     * @param {Function} [fn] Handler
     * @param {Object} [fnCtx] Handler context
     */
    liveCtxUnbind : function(ctx, e, fn, fnCtx) {

        return this._liveCtxUnbind(ctx, e, fn, fnCtx);

    },

    /**
     * Removes a live event handler from a block, based on a specified element where the event was being listened for
     * @static
     * @private
     * @param {jQuery} ctx The element in which the event was being listened for
     * @param {String} e Event name
     * @param {Function} [fn] Handler
     * @param {Object} [fnCtx] Handler context
     */
    _liveCtxUnbind : function(ctx, e, fn, fnCtx) {

        var _this = this,
            storage = liveEventCtxStorage[e =_this._buildCtxEventName(e)];

        if(storage) {
            ctx.each(function() {
                var ctxId = $.identify(this, true),
                    ctxStorage;
                if(ctxId && (ctxStorage = storage.ctxs[ctxId])) {
                    fn && delete ctxStorage[$.identify(fn) + (fnCtx? $.identify(fnCtx) : '')];
                    if(!fn || $.isEmptyObject(ctxStorage)) {
                        storage.counter--;
                        delete storage.ctxs[ctxId];
                    }
                }
            });
            storage.counter || delete liveEventCtxStorage[e];
        }

        return _this;

    },

    /**
     * Retrieves the name of an element nested in a block
     * @static
     * @private
     * @param {jQuery} elem Nested element
     * @returns {String|undefined}
     */
    _extractElemNameFrom : function(elem) {

        if(elem.__bemElemName) return elem.__bemElemName;

        var matches = elem[0].className.match(this._buildElemNameRE());
        return matches? matches[1] : undefined;

    },

    /**
     * Retrieves block parameters from a DOM element
     * @static
     * @param {HTMLElement} domNode DOM node
     * @returns {Object}
     */
    extractParams : extractParams,

    /**
     * Builds a prefix for the CSS class of a DOM element or nested element of the block, based on modifier name
     * @static
     * @private
     * @param {String} modName Modifier name
     * @param {jQuery|String} [elem] Element
     * @returns {String}
     */
    _buildModClassPrefix : function(modName, elem) {

        return buildClass(this._name) +
               (elem?
                   ELEM_DELIM + (typeof elem === 'string'? elem : this._extractElemNameFrom(elem)) :
                   '') +
               MOD_DELIM + modName + MOD_DELIM;

    },

    /**
     * Builds a regular expression for extracting modifier values from a DOM element or nested element of a block
     * @static
     * @private
     * @param {String} modName Modifier name
     * @param {jQuery|String} [elem] Element
     * @param {String} [quantifiers] Regular expression quantifiers
     * @returns {RegExp}
     */
    _buildModValRE : function(modName, elem, quantifiers) {

        return new RegExp('(\\s|^)' + this._buildModClassPrefix(modName, elem) + '(' + NAME_PATTERN + ')(?=\\s|$)', quantifiers);

    },

    /**
     * Builds a regular expression for extracting names of elements nested in a block
     * @static
     * @private
     * @returns {RegExp}
     */
    _buildElemNameRE : function() {

        return new RegExp(this._name + ELEM_DELIM + '(' + NAME_PATTERN + ')(?:\\s|$)');

    },

    /**
     * Builds a CSS selector corresponding to the block/element and modifier
     * @param {String} [elem] Element name
     * @param {String} [modName] Modifier name
     * @param {String} [modVal] Modifier value
     * @returns {String}
     */
    buildSelector : function(elem, modName, modVal) {

        return '.' + buildClass(this._name, elem, modName, modVal);

    },

    /**
     * Returns a block instance by unique ID
     * @deprecated
     * @param {String} [uniqId]
     * @returns {BEM.DOM}
     */
    getBlockByUniqId : function(uniqId) {

        return uniqIdToBlock[uniqId];

    },

    /**
     * Returns the size of the current window
     * @returns {Object} Object with width and height fields
     */
    getWindowSize : function() {

        return {
            width  : win.width(),
            height : win.height()
        };

    }

});

/**
 * Set default scope after DOM ready
 */
$(function() {
    BEM.DOM.scope = $('body');
});

})(BEM, jQuery);

/* end: ../../../libs/bem-bl/blocks-common/i-bem/__dom/i-bem__dom.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-ecma/__string/i-ecma__string.js */
(function() {

String.prototype.trim || (String.prototype.trim = function () {

    var str = this.replace(/^\s\s*/, ''),
        ws = /\s/,
        i = str.length;

    while(ws.test(str.charAt(--i)));

    return str.slice(0, i + 1);

});

})();
/* end: ../../../libs/bem-bl/blocks-common/i-ecma/__string/i-ecma__string.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-ecma/__json/i-ecma__json.js */
(function(undefined) {

if(window.JSON) return;

var _toString = Object.prototype.toString,
    escapable = /[\\\"\x00-\x1f\x7f-\x9f\u00ad\u0600-\u0604\u070f\u17b4\u17b5\u200c-\u200f\u2028-\u202f\u2060-\u206f\ufeff\ufff0-\uffff]/g,
    meta = {
        '\b' : '\\b',
        '\t' : '\\t',
        '\n' : '\\n',
        '\f' : '\\f',
        '\r' : '\\r',
        '"'  : '\\"',
        '\\' : '\\\\'
    },
    stringify;

window.JSON = {
    stringify : stringify = function(val) {
        if(val === null) {
            return 'null';
        }
        if(typeof val === 'undefined') {
            return undefined;
        }
        switch(_toString.call(val)) {
            case '[object String]':
                escapable.lastIndex = 0;
                return '"' +
                    (escapable.test(val)?
                        val.replace(escapable, function(a) {
                            var c = meta[a];
                            return typeof c === 'string'? c : '\\u' + ('0000' + a.charCodeAt(0).toString(16)).slice(-4);
                        }) :
                        val) +
                    '"';
            case '[object Number]':
            case '[object Boolean]':
                return '' + val;
            case '[object Array]':
                var res = '[', i = 0, len = val.length, strVal;
                while(i < len) {
                    strVal = stringify(val[i]);
                    res += (i++? ',' : '') + (typeof strVal === 'undefined'? 'null' : strVal);
                }
                return res + ']';
            case '[object Object]':
                if(_toString.call(val.toJSON) === '[object Function]') {
                    return stringify(val.toJSON());
                }
                var res = '{', i = 0, strVal;
                for(var key in val) {
                    if(val.hasOwnProperty(key)) {
                        strVal = stringify(val[key]);
                        typeof strVal !== 'undefined' && (res += (i++? ',' : '') + '"' + key + '":' + strVal);
                    }
                }
                return res + '}';
            default:
                return undefined;
        }
    },
    parse : function(str) {
        /*jshint -W061 */
        return Function('return ' + str)();
    }
};
})();

/* end: ../../../libs/bem-bl/blocks-common/i-ecma/__json/i-ecma__json.js */
/* begin: ../../../libs/islands-romochka/common.blocks/i-global/i-global.js */

BEM.DOM.decl('i-global', {

    onSetMod : {

        'js' : function() {

            // удаляем системные свойства
            this.del(this.__self._params = $.extend({}, this.params), 'uniqId', 'name');

            var params = this.__self._params;

            params['passport-msg'] || (params['passport-msg'] = params.id);

            if(params['show-counters'] === undefined) {
                params['show-counters'] = Math.round(Math.random() * 100) <= params['show-counters-percent'];
            }
            params.locale = params.lang;

            $(function(){
                params.oframebust && Lego.oframebust(params.oframebust);
            });

        }

    },

    getDefaultParams : function() {

        return {
            id : '',
            login : Lego.isSessionValid() ? $.cookie('yandex_login') || '' : '',
            yandexuid : $.cookie('yandexuid'),
            lang : 'ru',
            tld : 'ru',
            retpath : encodeURI($.decodeURI(location.href)), // LEGO-8443 + LEGO-9226
            'passport-host' : 'https://passport.yandex.ru',
            'pass-host' : 'https://pass.yandex.ru',
            'social-host' : 'https://social.yandex.ru',
            'lego-path' : '/lego',
            'show-counters-percent' : 100
        };

    }

}, {

    param  : function(name) {

        return (this._params || {})[name];

    }

});

/* end: ../../../libs/islands-romochka/common.blocks/i-global/i-global.js */
/* begin: ../../../libs/islands-romochka/common.blocks/i-common/check-session/i-common__check-session.js */
(function(Lego){
if (!Lego) Lego = window.Lego = {};
/**
 * Проверяет жива ли сессия пользователя (наличие куки yandex_login).
 *
 * @return  true, если сессия пользователя живая.
 */
Lego.isSessionValid = function() {
    return !!Lego.getCookie('yandex_login');
}
})(window.Lego);

/* end: ../../../libs/islands-romochka/common.blocks/i-common/check-session/i-common__check-session.js */
/* begin: ../../../libs/islands-romochka/common.blocks/i-counter/i-counter.js */
(function(Lego){
if (!Lego) Lego = window.Lego = {};

!Lego.params && (Lego.params = {});


/**
 * Хелпер удаляющий протокол из переданного хоста, для приведения
 * к каноническому виду.
 *
 * @param h {String}
 * @returns {String}
 */
function preparseHost(h) {
    return h.replace(/^(?:https?:)?\/\//, '');
}

/**
 * Счётчик клика на ссылку или просто показа.
 *
 * В случае клика подменяет href на redir'овский, потом по таймауту возвращает его обратно.
 *
 * В случае учёта показа динамически создаёт скрипт с URL системы учёта.
 *
 * Пример использования:
 *
 * <a href="http://meteoinfo.ru" onmousedown="Lego.c('stred/pid=7/cid=433',this)">Гидрометцентр</a>
 *
 * или
 *
 * < script type="text/javascript">Lego.c('stred/pid=7/cid=433')< /script>
 *
 * @param w     параметры счётчика
 * @param a     (optional) ссылка, клик на которую надо учитывать
 * @param opts  (optional) opts.noRedirect = true обрабатывает клик по обычной ссылке, как по b-link_pseudo_yes
 */ /**/
Lego.c = function(w, a, opts) {
/*
    new Image().src = location.protocol + '//clck.yandex.ru/click/dtype=' + w +
        '/rnd=' + ((new Date()).getTime() + Math.round(Math.random()*100)) +
        '/*' + (a ? (a.href || location.href) : '');
*/

    var host = preparseHost((opts && opts.host) || BEM.blocks['i-global'].param('click-host') || 'clck.yandex.ru'),
        url = function(w, h, t, a) {

            h = h.replace("'", "%27"); //см. LEGO-6428

            return h.indexOf('/dtype=') > -1?
                h :
                location.protocol + '//' + host + '/' + t + '/dtype=' + w +
                    '/rnd=' + ((new Date()).getTime() + Math.round(Math.random()*100)) +
                    (a?
                        '/*' + (h.match(/^http/) ? h : location.protocol + '//' + location.host + (h.match('^/') ? h : '/' + h)) :
                        '/*data=' + encodeURIComponent('url='+ encodeURIComponent((h.match(/^http/) ? h : location.protocol + '//' + location.host + (h.match('^/') ? h : '/' + h)))));
        },
        click = function() {
            var head = document.getElementsByTagName('head')[0] || document.getElementsByTagName('body')[0];
            var script = document.createElement('script');
            script.setAttribute('src', url(w, location.href, 'jclck'));
            head.insertBefore(script, head.firstChild);
        };

    if (a) {
        // для псевдоссылки и ссылки mailto просто считаем click, создавая iframe и в него грузим счётчик
        if (a.className.match(/b-link_pseudo_yes/) || (a.href && a.href.match(/^mailto:/)) || (opts && opts.noRedirect === true)) {
            click();
        } else if (a.href) { // клик на ссылку, подменяем href на redir'овский, потом по таймауту обратно
            var h = a.href;
            a.href = url(w, h, "redir");
            setTimeout(function() { a.href = h }, 500);
        } else if (a.form) { // клик на элемент формы
            if (a.type.match(/submit|button|image/)) { // клик на кнопку, подменяем action на redir'овский, потом по таймауту обратно
                var h = a.form.action;
                a.form.action = url(w, h, "redir", true);
                setTimeout(function() { a.form.action = h }, 500);
            } else { // просто считаем click, создавая iframe и в него грузим счётчик
                click();
            }
        } else if (a.action) { //случай сабмита формы - подменяем его action на redir'овский, назад нам его менять не нужно
            a.action = url(w, a.action, "redir", true);
        } else {
            throw "counter.js: not link and not form!";
        }
    } else { // ссылки нет, просто учёт показа, создаём iframe и в него грузим счётчик
        click();
    }
}

})(window.Lego);

(function(Lego, undefined){
if (!Lego) Lego = window.Lego = {};

/**
 * Параметризованный счётчик клика на ссылку или просто показа.
 * Перевызывает Lego.c(w, a) из counter.js
 *
 * В случае клика подменяет href на redir'овский, потом по таймауту возвращает его обратно.
 *
 * В случае учёта показа динамически создаёт iframe с URL системы учёта.
 *
 * Пример использования:
 *
 * < a href="http://meteoinfo.ru" onclick="Lego.cp(0,1917,'weather.tabs.fotki',this)">Гидрометцентр< /a>
 *
 * или
 *
 * < script type="text/javascript">Lego.cp(0,1917,'weather.tabs.fotki')< /script>
 *
 * или даже
 *
 * < a href="http://meteoinfo.ru" onclick="Lego.cp(0,1917,'weather.tabs.fotki','84=85,732=87')">Гидрометцентр< /a>
 *
 * @param pi    номер проекта (pid)
 * @param ci    номер счётчика (cid)
 * @param p     (optional) path
 * @param v     (optional) vars
 * @param a     (optional) ссылка, клик на которую надо учитывать
 * @param opts  (optional) opts.noRedirect = true обрабатывает клик по обычной ссылке, как по b-link_pseudo_yes
 */
Lego.cp = function(pi, ci, p, v, a, opts) {
    typeof v === 'string' ||
        (opts = a, a = v, v = undefined);
    Lego.c('stred/pid=' + pi + '/cid=' + ci + (p ? '/path=' + p + (v ? '/vars=' + v : '') : ''), a, opts);
};

})(window.Lego);

(function(Lego){
if (!Lego) Lego = window.Lego = {};

/**
 * Параметризованный счётчик клика на ссылку в шапке. Перевызывает cp(w, a) из counter-cp.js
 * Используется для уменьшения веса страницы.
 *
 * Пример использования:
 *
 * < a href="http://meteoinfo.ru" onclick="ch('weather.tabs.fotki',this)">Гидрометцентр< /a>
 *
 * или
 *
 * < script type="text/javascript">ch('weather')< /script>
 *
 * @param p     path
 * @param v     (optional) vars
 * @param a     (optional) ссылка, клик на которую надо учитывать
 */
Lego.ch = function(p, v, a) {
    BEM.blocks['i-global'].param('show-counters') && Lego.cp(0, 2219, p, v, a);
};

})(window.Lego);

/* end: ../../../libs/islands-romochka/common.blocks/i-counter/i-counter.js */
/* begin: ../../../libs/islands-romochka/common.blocks/i-common/cookie/i-common__cookie.js */
(function(Lego){
if (!Lego) Lego = window.Lego = {};

Lego.getCookie = function(n) {
    var c = document.cookie;
    if (c.length < 1) return false;

    var b = c.indexOf(n + '=');
    if (b == -1) return false;

    b += (n.length + 1);
    var e = c.indexOf(';', b);

    return decodeURIComponent((e == -1) ? c.substring(b) : c.substring(b, e));
}

})(window.Lego);

/* end: ../../../libs/islands-romochka/common.blocks/i-common/cookie/i-common__cookie.js */
/* begin: ../../../libs/islands-romochka/common.blocks/i-common/init/i-common__init.js */
(function($, Lego){
if (!Lego) Lego = window.Lego = {};
// Использует cookie.js и check-session.js. Без них не работает.

/**
 * Инициализирует Лего некоторыми параметрами (для вариативности в пределах разных страниц).
 *
 * @param params объект Лего-параметров, необходимые параметры инициализируются умолчательными значениями
 *        params.login логин текущего пользователя ('' для неавторизованного)
 *        params.locale двухбуквенный код локали в нижнем регистре
 *        params.id идентификатор сервиса
 *        params['show-counters-percent'] процент срабатывания счётчиков Lego.ch() (по умолчанию 100)
 *
 * @return возвращает установленные параметры с учетом умолчательных значений
 */
Lego.init || (Lego.init = function(params) {
    (params = Lego.params = $.extend(
        {
            id : '',
            login : Lego.isSessionValid() ? Lego.getCookie('yandex_login') || '' : '',
            yandexuid : Lego.getCookie('yandexuid'),
            locale : 'ru',
            retpath : window.location.toString(),
            'passport-host' : 'https://passport.yandex.ru',
            'pass-host' : 'https://pass.yandex.ru',
            'passport-msg' : params.id,
            'social-host' : 'https://social.yandex.ru',
            'lego-path' : '/lego',
            'show-counters-percent' : 100
        },
        params,
        Lego.params))
        ['show-counters'] = Math.round(Math.random() * 100) <= params['show-counters-percent'];

    BEM.blocks['i-global']._params || $.extend(BEM.blocks['i-global']._params = {}, params);

    $(function(){
        params.oframebust && Lego.oframebust(params.oframebust);
    });

    return params;
});

Lego.block || (Lego.block = {});

Lego.blockInit || (Lego.blockInit = function(context, blockSelector) {
    context = context || document;
    blockSelector = blockSelector || '.g-js';
    $(context).find(blockSelector).each(function(){
        var block = $(this),
            params = this.onclick ? this.onclick() : {},
            name = params.name || '',
            init = Lego.block[name];
        if (init && !block.data(name)) {
            init.call(block, params);
            block
                .data(name, true)
                .addClass(name + '_js_inited');
        }
    });
});

Lego.blockInitBinded || (Lego.blockInitBinded = !!$(document).ready(function(){ Lego.blockInit() }));

})(jQuery, window.Lego);

/* end: ../../../libs/islands-romochka/common.blocks/i-common/init/i-common__init.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-ua/i-ua.js */
(function(win) {
    var devicePixelRatio = 1,
        isHiDpi = false;

    // http://stackoverflow.com/questions/16383503/window-devicepixelratio-does-not-work-in-ie-10-mobile
    if ('deviceXDPI' in screen && 'logicalXDPI' in screen) {
        // Internet Explorer
        devicePixelRatio = screen.deviceXDPI / screen.logicalXDPI;
    } else if ('devicePixelRatio' in win) {
        // Standard way
        devicePixelRatio = win.devicePixelRatio;
    }

    if (typeof win.matchMedia === 'function') {
        // In fact, HiDPI begins from 1.3dppx.
        // There is a devices list for example: http://bjango.com/articles/min-device-pixel-ratio/
        // 124dpi ~ 1.3dppx
        var hiDpiQuery =
            'only screen and (-webkit-min-device-pixel-ratio: 1.3), ' +
            'only screen and (min-resolution: 124dpi)';
        isHiDpi = win.matchMedia(hiDpiQuery).matches;
    } else {
        isHiDpi = (devicePixelRatio >= 1.3);
    }

    /**
     * Block for gathering and providing UserAgent information
     */
    BEM.DOM.decl('i-ua', {

        onSetMod: {
            js: function() {
                var _this = this,
                    self = _this.__self;

                self.hiDpi && _this.setMod('hi-dpi', 'yes');
            }
        }

    }, {
        dpr: devicePixelRatio,
        hiDpi: isHiDpi
    });

})(window);

/* end: ../../../libs/bem-bl/blocks-common/i-ua/i-ua.js */
/* begin: ../../../libs/bem-bl/blocks-touch/i-ua/i-ua.js */
(function(win, ua) {

    var platform = {},
        browser = {},
        device = {},
        support = {},
        match,
        lastOrient = (win.innerWidth > win.innerHeight),
        lastWidth = win.innerWidth;

    if (match = ua.match(/Android\s+([\d.]+)/)) {
        platform.android = match[1];
    } else if (ua.match(/\sHTC[\s_].*AppleWebKit/)) {
        // фэйковый десктопный UA по умолчанию у некоторых HTC (например, HTC Sensation)
        platform.android = '2.3';
    } else if (match = ua.match(/iPhone\sOS\s([\d_]+)/)) {
        platform.ios = match[1].replace(/_/g, '.');
        device.iphone = true;
    } else if (match = ua.match(/iPad.*OS\s([\d_]+)/)) {
        platform.ios = match[1].replace(/_/g, '.');
        device.ipad = true;
    } else if (match = ua.match(/Bada\/([\d.]+)/)) {
        platform.bada = match[1];
    } else if (match = ua.match(/Windows\sPhone[^\d]*\s([\d.]+)/)) {
        platform.wp = match[1];
    } else if (match = ua.match(/MSIE\s9/)) {
        platform.wp = '7.5';
    } else {
        platform.other = true;
    }

    if (window.opera) {
        browser.opera = window.opera.version();
    } else if (match = ua.match(/\s(CrMo|Chrome)\/([\d.]+)/)) {
        browser.chrome = match[2];
    }

    if (navigator.connection) {
        switch(navigator.connection.type) {
            case navigator.connection.ETHERNET: support.connection = 'wifi'; break;
            case navigator.connection.WIFI: support.connection = 'wifi'; break;
            case navigator.connection.CELL_3G: support.connection = '3g'; break;
            case navigator.connection.CELL_2G: support.connection = '2g'; break;
        }
    }

    support._videoElement = document.createElement('video');
    support.video = !!(support._videoElement.canPlayType && support._videoElement.canPlayType('video/mp4; codecs="avc1.42E01E, mp4a.40.2"').replace(/no/, ''));

    support.svg = !!document.createElementNS && !!document.createElementNS('http://www.w3.org/2000/svg', 'svg').createSVGRect;

    if (navigator.plugins && navigator.plugins.length) {
        var plugin;

        for(var i = navigator.plugins.length; i--;) {
            plugin = navigator.plugins[i];

            if (plugin.name == 'Shockwave Flash') {
                var match;

                if (match = plugin.description.match(/Flash ([\d.]+)/)) {
                    support.flash = match[1];
                    break;
                }
            }
        }
    }

    // http://stackoverflow.com/a/6603537
    $(win).bind('resize', function() {
        setTimeout(function() {
            var width = win.innerWidth,
                height = win.innerHeight,
                landscape = (width > height);

            // http://alxgbsn.co.uk/2012/08/27/trouble-with-web-browser-orientation/
            // check previous device width to disallow Android shrink page and change orientation on opening software keyboard
            if (landscape !== lastOrient && width !== lastWidth) {
                $(win).trigger('orientchange', {
                    landscape: landscape,
                    width: width,
                    height: height
                });

                lastOrient = landscape;
                lastWidth = width;
            }
        }, 400);
    });

    /**
     * Block for gathering and providing UserAgent information
     */
    BEM.DOM.decl('i-ua', {

        onSetMod: {

            js: function() {

                this.__base.apply(this, arguments);

                var that = this,
                    self = that.__self,
                    html = document.querySelector('html');

                that
                    .setMod('platform',
                        self.ios ? 'ios' :
                        self.android ? 'android' :
                        self.bada ? 'bada' :
                        self.wp ? 'wp' :
                        self.opera ? 'opera' :
                        'other'
                    )
                    .setMod('browser',
                        self.opera ? 'opera' :
                        self.chrome ? 'chrome' :
                        ''
                    )
                    .setMod('ios', self.ios ? self.ios.charAt(0) : '')
                    .setMod('android', self.android ? self.android.charAt(0) : '')
                    .setMod('ios-subversion', self.ios ? self.ios.match(/(\d\.\d)/)[1].replace('.', '') : '')
                    .setMod('screen-size', self.screenSize)
                    .setMod('orient', self.landscape ? 'landscape' : 'portrait');

                     // Для Windows Phone ставим _inlinesvg_no. LEGO-9072.
                     self.wp && html.setAttribute('class', html.getAttribute('class').replace('i-ua_inlinesvg_yes', 'i-ua_inlinesvg_no'));

                this.bindToWin('orientchange', function(e, data) {
                    self.width = data.width;
                    self.height = data.height;
                    self.landscape = data.landscape;
                    that.setMod('orient', data.landscape ? 'landscape' : 'portrait');
                });

            }

        }

    },{

        ua: ua,
        ios: platform.ios,
        iphone: device.iphone,
        ipad: device.ipad,
        android: platform.android,
        bada: platform.bada,
        wp: platform.wp,
        other: platform.other,
        opera: browser.opera,
        chrome: browser.chrome,
        screenSize: screen.width > 320 ? 'large' : screen.width < 320 ? 'small' : 'normal',
        connection: support.connection,
        flash: support.flash,
        video: support.video,
        svg: support.svg,
        width: win.innerWidth,
        height: win.innerHeight,
        landscape: lastOrient

    });

})(window, navigator.userAgent);

/* end: ../../../libs/bem-bl/blocks-touch/i-ua/i-ua.js */
/* begin: ../../../libs/islands-romochka/touch.blocks/i-ua/i-ua.js */
BEM.DOM.decl('i-ua', {

    onSetMod: {

        js: function() {

            // наследуемся
            this.__base.apply(this, arguments);

            this.setMod('android-vowels-hack', (this.__self.android >= '3.0' && this.__self.android < '3.2') || (this.__self.android >= '4.0' && this.__self.android < '4.0.3') ? 'yes' : '');

        }

    }

});
/* end: ../../../libs/islands-romochka/touch.blocks/i-ua/i-ua.js */
/* begin: ../../../libs/islands-romochka/common.blocks/i-common/i-common.js */
(function(Lego){
if (!Lego) Lego = window.Lego = {};

Lego.messages = Lego.messages || {};

Lego.message = function(id, text) {
    return Lego.params.locale == 'ru' ? text : (Lego.messages[id] || text);
};

})(window.Lego);
/* end: ../../../libs/islands-romochka/common.blocks/i-common/i-common.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-bem/__dom/_init/i-bem__dom_init_auto.js */
/* дефолтная инициализация */
$(function() {
    BEM.afterCurrentEvent(function() {
        BEM.DOM.init();
    });
});

/* end: ../../../libs/bem-bl/blocks-common/i-bem/__dom/_init/i-bem__dom_init_auto.js */
/* begin: ../../../libs/bem-bl/blocks-common/i-ua/_interaction/i-ua_interaction_yes.js */
/*
 * Block to determine how the user interacts with the page.
 * Distinguishes interaction with a keyboard or mouse/finger.
 * For performance reason this code use data-attr `data-interaction` instead `setMod` (which switch css class and
 * always trigger repaint)
 */
(function() {

    var INTERACT_KEYS = {
        9: 'tab',
        13: 'enter',
        32: 'space',
        33: 'page up',
        34: 'page down',
        35: 'end',
        36: 'home',
        37: 'left arrow',
        38: 'up arrow',
        39: 'right arrow',
        40: 'down arrow',
        46: 'delete'
    };

    var INTERACT_DISABLE_KEYS = {
        27: 'escape'
    };

    BEM.DOM.decl({
        block: 'i-ua',
        modName: 'interaction',
        modVal: 'yes' }, {

        onSetMod: {
            js: {
                inited: function() {
                    this.bindTo('mousedown', this._onPointer)
                        .bindTo('keydown', this._onKeyboard);
                }
            }
        },

        /**
         * @private
         */
        _onPointer: function() {
            this.interaction = 'pointer';
            this.domElem.attr('data-interaction', 'pointer');

            this.unbindFrom('mousedown');
        },

        /**
         * @private
         */
        _onKeyboard: function(e) {

            var keyCode = e.keyCode;

            if(INTERACT_DISABLE_KEYS[keyCode]) {
                this._onPointer();
                return;

            } else if(!INTERACT_KEYS[keyCode]) {
                return;
            }

            if(this.interaction === 'keyboard') {
                return;
            }

            this.domElem.attr('data-interaction', 'keyboard');
            this.interaction = 'keyboard';

            this.bindTo('mousedown', this._onPointer);
        }

    });

}());

/* end: ../../../libs/bem-bl/blocks-common/i-ua/_interaction/i-ua_interaction_yes.js */
var BEMHTML = function() {
  var $$mode, $$block, $$elem, $$elemMods, $$mods;
  var cache,
      exports = {},
      xjst = (function (exports) {
    function $1(__$ctx) {
        var __t = $$mode;
        if (__t === 'attrs') {
            return $2(__$ctx);
        } else if (__t === 'tag') {
            return $130(__$ctx);
        } else if (__t === 'bem') {
            return $158(__$ctx);
        } else if (__t === 'cls') {
            return $181(__$ctx);
        } else if (__t === 'mix') {
            return $108(__$ctx);
        } else if (__t === 'js-params') {
            if ($$block === 'b-page') {
                return $204(__$ctx);
            } else {
                return $236(__$ctx);
            }
        } else if (__t === 'public-params') {
            if ($$block === 'i-global') {
                return $212(__$ctx);
            } else {
                return $236(__$ctx);
            }
        } else if (__t === 'env') {
            if ($$block === 'i-global') {
                return $220(__$ctx);
            } else {
                return $236(__$ctx);
            }
        } else if (__t === '') {
            return $227(__$ctx);
        } else if (__t === 'jsAttr') {
            return $233(__$ctx);
        } else if (__t === 'default') {
            return $22(__$ctx);
        } else if (__t === 'js') {
            return $235(__$ctx);
        } else if (__t === 'content') {
            return $189(__$ctx);
        } else {
            return $236(__$ctx);
        }
    }
    function $2(__$ctx) {
        if ($$block === 'b-page') {
            var __t = $$elem;
            if (__t === 'js') {
                if (!__$ctx.ctx.url === false) {
                    var _$1smatch = __$ctx.ctx.url.match(/^[0-9a-zA-Z_-]+(\.[a-z]{2})?\.js$/);
                    if (_$1smatch && _$1smatch[1]) {
                        throw new Error('\u0412 BEMJSON \u0434\u0435\u043A\u043B\u0430\u0440\u0430\u0446\u0438\u0438 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0435\u0442\u0441\u044F \u044D\u043B\u0435\u043C\u0435\u043D\u0442 b-page__js \u0441 \u044F\u0432\u043D\u043E \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u044B\u043C \u044F\u0437\u044B\u043A\u043E\u0432\u044B\u043C *.js \u0444\u0430\u0439\u043B\u043E\u043C:\n' + ' -> ' + _$1smatch[0] + '. \n' + '\u041D\u0435 \u0443\u043A\u0430\u0437\u044B\u0432\u0430\u0439\u0442\u0435 \u044F\u0437\u044B\u043A \u043F\u0440\u0438 \u043F\u043E\u0434\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0438 *.js \u0444\u0430\u0439\u043B\u0430, \u043F\u043E\u0442\u043E\u043C\u0443 \u0447\u0442\u043E \u043F\u0435\u0440\u0435\u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u043D\u044B\u0439 \u0448\u0430\u0431\u043B\u043E\u043D b-page__js ' + '\u0441\u0434\u0435\u043B\u0430\u0435\u0442 \u044D\u0442\u043E \u0430\u0432\u0442\u043E\u043C\u0430\u0442\u0438\u0447\u0435\u0441\u043A\u0438 \u0434\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0439 \u043B\u043E\u043A\u0430\u043B\u0438.\n' + '\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438: https://st.yandex-team.ru/LEGO-492');
                    } else {
                        undefined;
                    }
                    return _$1smatch ? { src: __$ctx.ctx.url.replace(/js$/, BEM.I18N.lang() + '.js') } : { src: __$ctx.ctx.url };
                    return;
                } else {
                    return __$ctx.ctx.url ? { src: __$ctx.ctx.url } : {};
                    return;
                }
            } else if (__t === 'root') {
                return { lang: __$ctx['i-global'].lang || 'ru' };
                return;
            } else if (__t === 'css') {
                if (!__$ctx.ctx.url === false) {
                    return {
                        rel: 'stylesheet',
                        href: __$ctx.ctx.url
                    };
                    return;
                } else {
                    return $21(__$ctx);
                }
            } else if (__t === 'meta') {
                return __$ctx.ctx.attrs;
                return;
            } else {
                return $21(__$ctx);
            }
        } else {
            return $21(__$ctx);
        }
    }
    function $21(__$ctx) {
        return undefined;
        return;
    }
    function $22(__$ctx) {
        var __t = $$block;
        if (__t === 'i-jquery') {
            if (!(__$ctx['__$anflg6'] !== true) === false) {
                if (!!$$elem === false) {
                    return $26(__$ctx);
                } else {
                    return $29(__$ctx);
                }
            } else {
                return $29(__$ctx);
            }
        } else if (__t === 'b-page') {
            var __t = $$elem;
            if (__t === 'css') {
                if (!__$ctx.ctx.ie === false) {
                    if (!__$ctx.ctx.url === false) {
                        if (!!__$ctx._IE === false) {
                            {
                                '';
                                var __r0 = $$mode;
                                $$mode = '';
                                var __r1 = __$ctx._IE;
                                __$ctx._IE = true;
                                var __r2 = __$ctx.ctx;
                                __$ctx.ctx = [
                                    '<!--[if gte IE 9]>',
                                    __$ctx.ctx,
                                    '<![endif]-->'
                                ];
                                $227(__$ctx);
                                $$mode = __r0;
                                __$ctx._IE = __r1;
                                __$ctx.ctx = __r2;
                                '';
                            }
                            return;
                        } else {
                            return $53(__$ctx);
                        }
                    } else {
                        return $53(__$ctx);
                    }
                } else {
                    return $53(__$ctx);
                }
            } else if (__t === 'icon') {
                return $65(__$ctx);
            } else {
                return $66(__$ctx);
            }
        } else if (__t === 'i-bem') {
            if ($$elem === 'i18n') {
                return $76(__$ctx);
            } else {
                return $236(__$ctx);
            }
        } else if (__t === 'i-global') {
            return $79(__$ctx);
        } else {
            return $236(__$ctx);
        }
    }
    function $26(__$ctx) {
        var __r0, __r4, __r1, __r2, __r3;
        return '', __r0 = __$ctx['__$anflg6'], __$ctx['__$anflg6'] = true, __r4 = ('', __r1 = __$ctx.ctx, __$ctx.ctx = {
            block: 'b-page',
            elem: 'js',
            url: __$ctx.ctx.url || (__$ctx.ctx.protocol ? __$ctx.ctx.protocol + ':' : '') + '//yastatic.net/jquery/' + $$mods.version + '/jquery.min.js'
        }, __r2 = $$mode, $$mode = '', __r3 = $227(__$ctx), __$ctx.ctx = __r1, $$mode = __r2, '', __r3), __$ctx['__$anflg6'] = __r0, '', __r4;
        return;
    }
    function $29(__$ctx) {
        if (!(__$ctx['__$anflg5'] !== true) === false) {
            if (!!$$elem === false) {
                return $32(__$ctx);
            } else {
                return $35(__$ctx);
            }
        } else {
            return $35(__$ctx);
        }
    }
    function $32(__$ctx) {
        var __r0, __r4, __r1, __r2, __r3;
        return '', __r0 = __$ctx['__$anflg5'], __$ctx['__$anflg5'] = true, __r4 = ('', __r1 = __$ctx.ctx, __$ctx.ctx = {
            block: 'b-page',
            elem: 'js',
            url: __$ctx.ctx.url || (__$ctx.ctx.protocol ? __$ctx.ctx.protocol + ':' : '') + '//yastatic.net/jquery/' + $$mods.version + '/jquery.min.js'
        }, __r2 = $$mode, $$mode = '', __r3 = $227(__$ctx), __$ctx.ctx = __r1, $$mode = __r2, '', __r3), __$ctx['__$anflg5'] = __r0, '', __r4;
        return;
    }
    function $35(__$ctx) {
        if ($$elem === 'core') {
            if (!(__$ctx['__$anflg2'] !== true) === false) {
                return $38(__$ctx);
            } else {
                return $236(__$ctx);
            }
        } else {
            return $236(__$ctx);
        }
    }
    function $38(__$ctx) {
        var __r0, __r4, __r1, __r2, __r3;
        return '', __r0 = __$ctx['__$anflg2'], __$ctx['__$anflg2'] = true, __r4 = ('', __r1 = __$ctx.ctx, __$ctx.ctx = {
            block: 'b-page',
            elem: 'js',
            url: 'http://yastatic.net/jquery/1.8.3/jquery.min.js'
        }, __r2 = $$mode, $$mode = '', __r3 = $227(__$ctx), __$ctx.ctx = __r1, $$mode = __r2, '', __r3), __$ctx['__$anflg2'] = __r0, '', __r4;
        return;
    }
    function $53(__$ctx) {
        if (!__$ctx.ctx.url === false) {
            if (!!__$ctx._notIE === false) {
                if (!!__$ctx.ctx.ie === false) {
                    {
                        '';
                        var __r0 = $$mode;
                        $$mode = '';
                        var __r1 = __$ctx._notIE;
                        __$ctx._notIE = true;
                        var __r2 = __$ctx.ctx;
                        __$ctx.ctx = [__$ctx.ctx];
                        $227(__$ctx);
                        $$mode = __r0;
                        __$ctx._notIE = __r1;
                        __$ctx.ctx = __r2;
                        '';
                    }
                    return;
                } else {
                    return $66(__$ctx);
                }
            } else {
                return $66(__$ctx);
            }
        } else {
            return $66(__$ctx);
        }
    }
    function $65(__$ctx) {
        {
            '';
            var __r0 = $$mode;
            $$mode = '';
            var __r1 = __$ctx.ctx;
            __$ctx.ctx = [
                __$ctx.ctx.src16 && {
                    elem: 'link',
                    attrs: {
                        rel: 'shortcut icon',
                        href: __$ctx.ctx.src16
                    }
                },
                __$ctx.ctx.src152 && {
                    elem: 'link',
                    attrs: {
                        rel: 'apple-touch-icon-precomposed',
                        sizes: '152x152',
                        href: __$ctx.ctx.src152
                    }
                },
                __$ctx.ctx.src144 && {
                    elem: 'link',
                    attrs: {
                        rel: 'apple-touch-icon-precomposed',
                        sizes: '144x144',
                        href: __$ctx.ctx.src144
                    }
                },
                __$ctx.ctx.src120 && {
                    elem: 'link',
                    attrs: {
                        rel: 'apple-touch-icon-precomposed',
                        sizes: '120x120',
                        href: __$ctx.ctx.src120
                    }
                },
                __$ctx.ctx.src114 && {
                    elem: 'link',
                    attrs: {
                        rel: 'apple-touch-icon-precomposed',
                        sizes: '114x114',
                        href: __$ctx.ctx.src114
                    }
                },
                __$ctx.ctx.src76 && {
                    elem: 'link',
                    attrs: {
                        rel: 'apple-touch-icon-precomposed',
                        sizes: '76x76',
                        href: __$ctx.ctx.src76
                    }
                },
                __$ctx.ctx.src72 && {
                    elem: 'link',
                    attrs: {
                        rel: 'apple-touch-icon-precomposed',
                        sizes: '72x72',
                        href: __$ctx.ctx.src72
                    }
                },
                __$ctx.ctx.src57 && {
                    elem: 'link',
                    attrs: {
                        rel: 'apple-touch-icon-precomposed',
                        href: __$ctx.ctx.src57
                    }
                }
            ];
            $227(__$ctx);
            $$mode = __r0;
            __$ctx.ctx = __r1;
            '';
        }
        return;
    }
    function $66(__$ctx) {
        if (!(__$ctx['__$anflg3'] !== true) === false) {
            if (!!$$elem === false) {
                return $69(__$ctx);
            } else {
                return $236(__$ctx);
            }
        } else {
            return $236(__$ctx);
        }
    }
    function $69(__$ctx) {
        var __r1, __r2;
        __$ctx._buf.push('<!DOCTYPE html>');
        {
            '';
            var __r0 = __$ctx['__$anflg3'];
            __$ctx['__$anflg3'] = true;
            {
                '';
                var __r3 = __$ctx.ctx;
                __$ctx.ctx = {
                    elem: 'root',
                    content: [
                        {
                            elem: 'head',
                            content: [
                                {
                                    elem: 'meta',
                                    attrs: { charset: 'utf-8' }
                                },
                                {
                                    tag: 'title',
                                    content: __$ctx.ctx.title
                                },
                                {
                                    elem: 'meta',
                                    attrs: {
                                        name: 'viewport',
                                        content: __$ctx.ctx.zoom ? 'width=device-width,initial-scale=1' : 'width=device-width,maximum-scale=1,initial-scale=1,user-scalable=0'
                                    }
                                },
                                {
                                    elem: 'meta',
                                    attrs: {
                                        name: 'format-detection',
                                        content: 'telephone=no'
                                    }
                                },
                                {
                                    elem: 'link',
                                    attrs: {
                                        name: 'apple-mobile-web-app-capable',
                                        content: 'yes'
                                    }
                                },
                                {
                                    block: 'i-ua',
                                    js: true
                                },
                                __$ctx.ctx.head
                            ]
                        },
                        {
                            elem: 'body',
                            mix: [
                                __$ctx.ctx,
                                {
                                    block: 'i-ua',
                                    js: true
                                }
                            ].concat(('', __r1 = $$mode, $$mode = 'mix', __r2 = $114(__$ctx), $$mode = __r1, '', __r2) || [], __$ctx.ctx.mix || []),
                            content: __$ctx.ctx.content
                        }
                    ]
                };
                var __r4 = $$mode;
                $$mode = '';
                $227(__$ctx);
                __$ctx.ctx = __r3;
                $$mode = __r4;
                '';
            }
            __$ctx['__$anflg3'] = __r0;
            '';
        }
        return;
    }
    function $76(__$ctx) {
        var __r0, __r1, __r2, __r3;
        if (!__$ctx.ctx) {
            return '';
        } else {
            undefined;
        }
        var _$yctx = __$ctx.ctx, _$ykeyset = _$yctx.keyset, _$ykey = _$yctx.key, _$yparams = _$yctx.params || {};
        if (!(_$ykeyset || _$ykey)) {
            return '';
        } else {
            undefined;
        }
        if (_$yctx.content) {
            var _$ycnt;
            _$yparams.content = (_$ycnt = [], '', __r0 = __$ctx._buf, __$ctx._buf = _$ycnt, __r1 = $$mode, $$mode = '', __r2 = __$ctx.ctx, __$ctx.ctx = _$yctx.content, __r3 = $227(__$ctx), __$ctx._buf = __r0, $$mode = __r1, __$ctx.ctx = __r2, '', __r3, _$ycnt.join(''));
        } else {
            undefined;
        }
        __$ctx._buf.push(BEM.I18N(_$ykeyset, _$ykey, _$yparams));
        return;
    }
    function $79(__$ctx) {
        var __t = $$elem;
        if (__t === 'lego-static-host') {
            return '//yastatic.net/lego/2.10-142';
            return;
        } else if (__t === 'export-host') {
            return 'https://export.yandex.ru';
            return;
        } else if (__t === 'social-host') {
            return 'https://social.yandex.ru';
            return;
        } else if (__t === 'pass-host') {
            return 'https://pass.yandex.ru';
            return;
        } else if (__t === 'passport-host') {
            return 'https://passport.yandex.ru';
            return;
        } else if (__t === 'click-host') {
            return '//clck.yandex.ru';
            return;
        } else if (__t === 'content-region' || __t === 'tld' || __t === 'lang') {
            return 'ru';
            return;
        } else {
            if (!$$elem === false) {
                return '';
                return;
            } else {
                if (!!$$elem === false) {
                    return $103(__$ctx);
                } else {
                    return $236(__$ctx);
                }
            }
        }
    }
    function $103(__$ctx) {
        var _$hparams = __$ctx.ctx.params || {}, _$hiGlobal = __$ctx['i-global'], _$hisTldChanged = _$hparams.tld && _$hparams.tld !== _$hiGlobal.tld, _$htld, _$hxYaDomain, _$hyaDomain;
        if (_$hisTldChanged) {
            _$htld = _$hparams.tld;
            _$hxYaDomain = _$htld === 'tr' ? 'yandex.com.tr' : 'yandex.' + _$htld;
            _$hyaDomain = [
                'ua',
                'by',
                'kz'
            ].indexOf(_$htld) != -1 ? 'yandex.ru' : _$hxYaDomain;
            _$hiGlobal['content-region'] = _$htld;
            _$hiGlobal['click-host'] = '//clck.' + _$hyaDomain;
            _$hiGlobal['passport-host'] = 'https://passport.' + _$hyaDomain;
            _$hiGlobal['pass-host'] = 'https://pass.' + _$hxYaDomain;
            _$hiGlobal['social-host'] = 'https://social.' + _$hxYaDomain;
            _$hiGlobal['export-host'] = 'https://export.' + _$hxYaDomain;
        } else {
            undefined;
        }
        for (var _$hp in _$hparams) {
            _$hiGlobal[_$hp] = _$hparams[_$hp];
        }
        return;
    }
    function $108(__$ctx) {
        var __t = $$block;
        if (__t === 'service-icon') {
            if (!$$elem === false) {
                return [{
                        block: 'service-icon',
                        elem: 'elem'
                    }];
                return;
            } else {
                return $129(__$ctx);
            }
        } else if (__t === 'b-page') {
            return $114(__$ctx);
        } else {
            return $129(__$ctx);
        }
    }
    function $114(__$ctx) {
        if ($$elem === 'body') {
            return $115(__$ctx);
        } else {
            return $120(__$ctx);
        }
    }
    function $115(__$ctx) {
        if (!!__$ctx.ctx._iGlobal === false) {
            return $117(__$ctx);
        } else {
            return $120(__$ctx);
        }
    }
    function $117(__$ctx) {
        var __r0, __r1, __r2, __r3, __r4, __r5;
        var _$1omix = ('', __r0 = __$ctx.ctx, __r1 = __r0._iGlobal, __r0._iGlobal = true, __r2 = $115(__$ctx), __r0._iGlobal = __r1, '', __r2), _$1ojsParams = ('', __r3 = $$mode, $$mode = 'js-params', __r4 = $$elem, $$elem = '', __r5 = $204(__$ctx), $$mode = __r3, $$elem = __r4, '', __r5);
        _$1omix ? _$1omix.push(_$1ojsParams) : _$1omix = [_$1ojsParams];
        return _$1omix;
        return;
    }
    function $120(__$ctx) {
        if (!(__$ctx['__$anflg4'] !== true) === false) {
            if (!!$$elem === false) {
                var __r0, __r1;
                var _$1mmix = ('', __r0 = __$ctx['__$anflg4'], __$ctx['__$anflg4'] = true, __r1 = $114(__$ctx), __$ctx['__$anflg4'] = __r0, '', __r1) || [];
                _$1mmix.push({
                    block: 'i-ua',
                    mods: { interaction: 'yes' },
                    js: true
                });
                return _$1mmix;
                return;
            } else {
                return $129(__$ctx);
            }
        } else {
            return $129(__$ctx);
        }
    }
    function $129(__$ctx) {
        return undefined;
        return;
    }
    function $130(__$ctx) {
        var __t = $$block;
        if (__t === 'b-page') {
            var __t = $$elem;
            if (__t === 'js') {
                return 'script';
                return;
            } else if (__t === 'css') {
                if (!__$ctx.ctx.url === false) {
                    return 'link';
                    return;
                } else {
                    return 'style';
                    return;
                }
            } else if (__t === 'meta') {
                return 'meta';
                return;
            } else if (__t === 'link') {
                return 'link';
                return;
            } else if (__t === 'body') {
                return 'body';
                return;
            } else if (__t === 'head') {
                return 'head';
                return;
            } else if (__t === 'root') {
                return 'html';
                return;
            } else {
                return $157(__$ctx);
            }
        } else if (__t === 'i-ua') {
            if (!!$$elem === false) {
                return 'script';
                return;
            } else {
                return $157(__$ctx);
            }
        } else {
            return $157(__$ctx);
        }
    }
    function $157(__$ctx) {
        return undefined;
        return;
    }
    function $158(__$ctx) {
        var __t = $$block;
        if (__t === 'b-page') {
            var __t = $$elem;
            if (__t === 'js' || __t === 'css' || __t === 'meta' || __t === 'link' || __t === 'head' || __t === 'root') {
                return false;
                return;
            } else {
                return $180(__$ctx);
            }
        } else if (__t === 'i-ua') {
            if (!!$$elem === false) {
                return false;
                return;
            } else {
                return $180(__$ctx);
            }
        } else {
            return $180(__$ctx);
        }
    }
    function $180(__$ctx) {
        return undefined;
        return;
    }
    function $181(__$ctx) {
        if ($$block === 'b-page') {
            if ($$elem === 'root') {
                return 'i-ua_js_no i-ua_css_standard';
                return;
            } else {
                return $188(__$ctx);
            }
        } else {
            return $188(__$ctx);
        }
    }
    function $188(__$ctx) {
        return undefined;
        return;
    }
    function $189(__$ctx) {
        if ($$block === 'i-ua') {
            return $190(__$ctx);
        } else {
            return $202(__$ctx);
        }
    }
    function $190(__$ctx) {
        if (!(__$ctx['__$anflg1'] !== true) === false) {
            if (!!$$elem === false) {
                var __r0, __r1;
                var _$xc = ('', __r0 = __$ctx['__$anflg1'], __$ctx['__$anflg1'] = true, __r1 = $190(__$ctx), __$ctx['__$anflg1'] = __r0, '', __r1);
                _$xc += [
                    ';(function(d,e,c,n,w,v,f){',
                    'e=d.documentElement;',
                    'c="className";',
                    'n="createElementNS";',
                    'f="firstChild";',
                    'w="http://www.w3.org/2000/svg";',
                    'e[c]+=" i-ua_svg_"+(!!d[n]&&!!d[n](w,"svg").createSVGRect?"yes":"no");',
                    'v=d.createElement("div");',
                    'v.innerHTML="<svg/>";',
                    'e[c]+=" i-ua_inlinesvg_"+((v[f]&&v[f].namespaceURI)==w?"yes":"no");',
                    '})(document);'
                ].join('');
                return _$xc;
                return;
            } else {
                return $196(__$ctx);
            }
        } else {
            return $196(__$ctx);
        }
    }
    function $196(__$ctx) {
        if (!!$$elem === false) {
            return [
                ';(function(d,e,c,r){',
                'e=d.documentElement;',
                'c="className";',
                'r="replace";',
                'e[c]=e[c][r]("i-ua_js_no","i-ua_js_yes");',
                'if(d.compatMode!="CSS1Compat")',
                'e[c]=e[c][r]("i-ua_css_standart","i-ua_css_quirks")',
                '})(document);'
            ].join('');
            return;
        } else {
            return $202(__$ctx);
        }
    }
    function $202(__$ctx) {
        return __$ctx.ctx.content;
        return;
    }
    function $204(__$ctx) {
        if (!!$$elem === false) {
            return $206(__$ctx);
        } else {
            return $236(__$ctx);
        }
    }
    function $206(__$ctx) {
        var __r0, __r1, __r2, __r3;
        var _$t_this = __$ctx['i-global'], _$tjs = {}, _$tblock = {
                block: 'i-global',
                js: _$tjs
            }, _$te;
        for (_$te in _$t_this) {
            if (_$t_this.hasOwnProperty(_$te) && ('', __r0 = $$mode, $$mode = 'public-params', __r1 = $$block, $$block = 'i-global', __r2 = $$elem, $$elem = _$te, __r3 = $212(__$ctx), $$mode = __r0, $$block = __r1, $$elem = __r2, '', __r3)) {
                _$tjs[_$te] = _$t_this[_$te];
            } else {
                undefined;
            }
        }
        return _$tblock;
        return;
    }
    function $212(__$ctx) {
        if (!$$elem === false) {
            return {
                id: 1,
                lang: 1,
                tld: 1,
                'content-region': 1,
                'user-region': 1,
                login: 1,
                displayName: 1,
                index: 1,
                yandexuid: 1,
                'passport-host': 1,
                'pass-host': 1,
                'passport-msg': 1,
                'static-host': 1,
                'lego-static-host': 1,
                'social-host': 1,
                clck: 1,
                'click-host': 1,
                'export-host': 1,
                'i-host': 1,
                'social-retpath': 1,
                'lego-path': 1,
                sid: 1,
                retpath: 1,
                uid: 1
            }[$$elem] || false;
            return;
        } else {
            return $236(__$ctx);
        }
    }
    function $220(__$ctx) {
        if (!!$$elem === false) {
            return {};
            return;
        } else {
            return $236(__$ctx);
        }
    }
    function $227(__$ctx) {
        if (!!__$ctx['i-global'] === false) {
            return $229(__$ctx);
        } else {
            return $236(__$ctx);
        }
    }
    function $229(__$ctx) {
        var __r0, __r1, __r2, __r3, __r4, __r5, __r6;
        var _$fps = {}, _$fes = [
                'lang',
                'tld',
                'content-region',
                'click-host',
                'passport-host',
                'pass-host',
                'social-host',
                'export-host',
                'login',
                'lego-static-host'
            ], _$fe;
        while (_$fe = _$fes.shift()) {
            _$fps[_$fe] = ('', __r0 = $$mode, $$mode = 'default', __r1 = $$block, $$block = 'i-global', __r2 = $$elem, $$elem = _$fe, __r3 = $79(__$ctx), $$mode = __r0, $$block = __r1, $$elem = __r2, '', __r3);
        }
        __$ctx['i-global'] = __$ctx._.extend(_$fps, ('', __r4 = $$mode, $$mode = 'env', __r5 = $$block, $$block = 'i-global', __r6 = $220(__$ctx), $$mode = __r4, $$block = __r5, '', __r6));
        applyc(__$ctx);
        undefined;
        return;
    }
    function $233(__$ctx) {
        return undefined;
        return;
    }
    function $235(__$ctx) {
        return undefined;
        return;
    }
    function $236(__$ctx) {
        if (!__$ctx.ctx === false) {
            if (!__$ctx.ctx.link === false) {
                if (!!__$ctx._.isSimple(__$ctx.ctx) === false) {
                    return $240(__$ctx);
                } else {
                    return $245(__$ctx);
                }
            } else {
                return $245(__$ctx);
            }
        } else {
            return $245(__$ctx);
        }
    }
    function $240(__$ctx) {
        var __r0, __r1;
        function _$6follow() {
            if (this.ctx.link === 'no-follow') {
                return undefined;
            } else {
                undefined;
            }
            var data = this._links[this.ctx.link];
            return '', __r0 = this.ctx, this.ctx = data, __r1 = $1(__$ctx), this.ctx = __r0, '', __r1;
        }
        if (!cache || !__$ctx._cacheLog) {
            return _$6follow.call(__$ctx);
        } else {
            undefined;
        }
        var _$6contents = __$ctx._buf.slice(__$ctx._cachePos).join('');
        __$ctx._cachePos = __$ctx._buf.length;
        __$ctx._cacheLog.push(_$6contents, {
            log: __$ctx._localLog.slice(),
            link: __$ctx.ctx.link
        });
        var _$6res = _$6follow.call(__$ctx);
        __$ctx._cachePos = __$ctx._buf.length;
        return _$6res;
        return;
    }
    function $245(__$ctx) {
        if (!cache === false) {
            if (!__$ctx.ctx === false) {
                if (!__$ctx.ctx.cache === false) {
                    return $249(__$ctx);
                } else {
                    return $254(__$ctx);
                }
            } else {
                return $254(__$ctx);
            }
        } else {
            return $254(__$ctx);
        }
    }
    function $249(__$ctx) {
        var _$5cached;
        function _$5setProperty(obj, key, value) {
            if (key.length === 0) {
                return undefined;
            } else {
                undefined;
            }
            if (Array.isArray(value)) {
                var target = obj;
                for (var i = 0; i < value.length - 1; i++) {
                    target = target[value[i]];
                }
                value = target[value[i]];
            } else {
                undefined;
            }
            var host = obj, previous;
            for (var i = 0; i < key.length - 1; i++) {
                host = host[key[i]];
            }
            previous = host[key[i]];
            host[key[i]] = value;
            return previous;
        }
        if (_$5cached = cache.get(__$ctx.ctx.cache)) {
            var _$5oldLinks = __$ctx._links;
            if (__$ctx.ctx.links) {
                __$ctx._links = __$ctx.ctx.links;
            } else {
                undefined;
            }
            for (var _$5i = 0; _$5i < _$5cached.log.length; _$5i++) {
                if (typeof _$5cached.log[_$5i] === 'string') {
                    __$ctx._buf.push(_$5cached.log[_$5i]);
                    continue;
                } else {
                    undefined;
                }
                var _$5log = _$5cached.log[_$5i], _$5reverseLog;
                _$5reverseLog = _$5log.log.map(function (entry) {
                    return {
                        key: entry[0],
                        value: _$5setProperty(this, entry[0], entry[1])
                    };
                }, __$ctx).reverse();
                {
                    '';
                    var __r0 = __$ctx.ctx, __r1 = __r0.cache;
                    __r0.cache = null;
                    var __r2 = __$ctx._cacheLog;
                    __$ctx._cacheLog = null;
                    var __r3 = __$ctx.ctx, __r4 = __r3.link;
                    __r3.link = _$5log.link;
                    $1(__$ctx);
                    __r0.cache = __r1;
                    __$ctx._cacheLog = __r2;
                    __r3.link = __r4;
                    '';
                }
                undefined;
                _$5reverseLog.forEach(function (entry) {
                    _$5setProperty(this, entry.key, entry.value);
                }, __$ctx);
            }
            __$ctx._links = _$5oldLinks;
            return _$5cached.res;
        } else {
            undefined;
        }
        var _$5cacheLog = [], _$5res;
        {
            '';
            var __r5 = __$ctx.ctx, __r6 = __r5.cache;
            __r5.cache = null;
            var __r7 = __$ctx._cachePos;
            __$ctx._cachePos = __$ctx._buf.length;
            var __r8 = __$ctx._cacheLog;
            __$ctx._cacheLog = _$5cacheLog;
            var __r9 = __$ctx._localLog;
            __$ctx._localLog = [];
            {
                _$5res = $1(__$ctx);
                var _$5tail = __$ctx._buf.slice(__$ctx._cachePos).join('');
                if (_$5tail) {
                    _$5cacheLog.push(_$5tail);
                } else {
                    undefined;
                }
            }
            __r5.cache = __r6;
            __$ctx._cachePos = __r7;
            __$ctx._cacheLog = __r8;
            __$ctx._localLog = __r9;
            '';
        }
        cache.set(__$ctx.ctx.cache, {
            log: _$5cacheLog,
            res: _$5res
        });
        return _$5res;
        return;
    }
    function $254(__$ctx) {
        var __t = $$mode;
        if (__t === 'default') {
            return $256(__$ctx);
        } else if (__t === '') {
            if (!__$ctx._.isSimple(__$ctx.ctx) === false) {
                __$ctx._listLength--;
                var _$3ctx = __$ctx.ctx;
                (_$3ctx && _$3ctx !== true || _$3ctx === 0) && __$ctx._buf.push(_$3ctx);
                return;
            } else {
                if (!!__$ctx.ctx === false) {
                    __$ctx._listLength--;
                    return;
                } else {
                    if (!__$ctx._.isArray(__$ctx.ctx) === false) {
                        return $265(__$ctx);
                    } else {
                        if (!true === false) {
                            return $268(__$ctx);
                        } else {
                            return $e(__$ctx);
                        }
                    }
                }
            }
        } else {
            return $e(__$ctx);
        }
    }
    function $256(__$ctx) {
        var __r13, __r0, __r4, __r5, __r6, __r7, __r8, __r9, __r10, __r11, __r12, __r1, __r14, __r15, __r16, __r17, __r20, __r21, __r22, __r23, __r24, __r25;
        var _$4BEM_ = __$ctx.BEM, _$4v = __$ctx.ctx, _$4buf = __$ctx._buf, _$4tag;
        _$4tag = ('', __r0 = $$mode, $$mode = 'tag', __r1 = $130(__$ctx), $$mode = __r0, '', __r1);
        typeof _$4tag != 'undefined' || (_$4tag = _$4v.tag);
        typeof _$4tag != 'undefined' || (_$4tag = 'div');
        if (_$4tag) {
            var _$4jsParams, _$4js;
            if ($$block && _$4v.js !== false) {
                _$4js = ('', __r4 = $$mode, $$mode = 'js', __r5 = $235(__$ctx), $$mode = __r4, '', __r5);
                _$4js = _$4js ? __$ctx._.extend(_$4v.js, _$4js === true ? {} : _$4js) : _$4v.js === true ? {} : _$4v.js;
                _$4js && ((_$4jsParams = {})[_$4BEM_.INTERNAL.buildClass($$block, _$4v.elem)] = _$4js);
            } else {
                undefined;
            }
            _$4buf.push('<', _$4tag);
            var _$4isBEM = ('', __r6 = $$mode, $$mode = 'bem', __r7 = $158(__$ctx), $$mode = __r6, '', __r7);
            typeof _$4isBEM != 'undefined' || (_$4isBEM = typeof _$4v.bem != 'undefined' ? _$4v.bem : _$4v.block || _$4v.elem);
            var _$4cls = ('', __r8 = $$mode, $$mode = 'cls', __r9 = $181(__$ctx), $$mode = __r8, '', __r9);
            _$4cls || (_$4cls = _$4v.cls);
            var _$4addJSInitClass = _$4v.block && _$4jsParams && !_$4v.elem;
            if (_$4isBEM || _$4cls) {
                _$4buf.push(' class="');
                if (_$4isBEM) {
                    _$4BEM_.INTERNAL.buildClasses($$block, _$4v.elem, _$4v.elemMods || _$4v.mods, _$4buf);
                    var _$4mix = ('', __r10 = $$mode, $$mode = 'mix', __r11 = $108(__$ctx), $$mode = __r10, '', __r11);
                    _$4v.mix && (_$4mix = _$4mix ? _$4mix.concat(_$4v.mix) : _$4v.mix);
                    if (_$4mix) {
                        var _$4visited = {};
                        function _$4visitedKey(block, elem) {
                            return (block || '') + '__' + (elem || '');
                        }
                        _$4visited[_$4visitedKey($$block, $$elem)] = true;
                        if (!__$ctx._.isArray(_$4mix)) {
                            _$4mix = [_$4mix];
                        } else {
                            undefined;
                        }
                        for (var _$4i = 0; _$4i < _$4mix.length; _$4i++) {
                            var _$4mixItem = _$4mix[_$4i];
                            if (!_$4mixItem) {
                                continue;
                            } else {
                                undefined;
                            }
                            var _$4hasItem = _$4mixItem.block || _$4mixItem.elem, _$4block = _$4mixItem.block || _$4mixItem._block || $$block, _$4elem = _$4mixItem.elem || _$4mixItem._elem || $$elem, _$4mods = _$4mixItem.mods || $$mods, _$4elemMods = _$4mixItem.elemMods || {};
                            _$4hasItem && _$4buf.push(' ');
                            _$4BEM_.INTERNAL[_$4hasItem ? 'buildClasses' : 'buildModsClasses'](_$4block, _$4mixItem.elem || _$4mixItem._elem || (_$4mixItem.block ? undefined : $$elem), _$4mixItem.elemMods || _$4mixItem.mods, _$4buf);
                            if (_$4mixItem.js) {
                                (_$4jsParams || (_$4jsParams = {}))[_$4BEM_.INTERNAL.buildClass(_$4block, _$4mixItem.elem)] = _$4mixItem.js === true ? {} : _$4mixItem.js;
                                _$4addJSInitClass || (_$4addJSInitClass = _$4block && !_$4mixItem.elem);
                            } else {
                                undefined;
                            }
                            if (_$4hasItem && !_$4visited[_$4visitedKey(_$4block, _$4elem)]) {
                                _$4visited[_$4visitedKey(_$4block, _$4elem)] = true;
                                var _$4nestedMix = ('', __r12 = $$block, $$block = _$4block, __r13 = $$elem, $$elem = _$4elem, __r14 = $$mods, $$mods = _$4mods, __r15 = $$elemMods, $$elemMods = _$4elemMods, __r16 = $$mode, $$mode = 'mix', __r17 = $108(__$ctx), $$block = __r12, $$elem = __r13, $$mods = __r14, $$elemMods = __r15, $$mode = __r16, '', __r17);
                                if (_$4nestedMix) {
                                    for (var _$4j = 0; _$4j < _$4nestedMix.length; _$4j++) {
                                        var _$4nestedItem = _$4nestedMix[_$4j];
                                        if (!_$4nestedItem.block && !_$4nestedItem.elem || !_$4visited[_$4visitedKey(_$4nestedItem.block, _$4nestedItem.elem)]) {
                                            _$4nestedItem._block = _$4block;
                                            _$4nestedItem._elem = _$4elem;
                                            _$4mix.splice(_$4i + 1, 0, _$4nestedItem);
                                        } else {
                                            undefined;
                                        }
                                    }
                                } else {
                                    undefined;
                                }
                            } else {
                                undefined;
                            }
                        }
                    } else {
                        undefined;
                    }
                } else {
                    undefined;
                }
                _$4cls && _$4buf.push(_$4isBEM ? ' ' : '', _$4cls);
                _$4addJSInitClass && _$4buf.push(' i-bem');
                _$4buf.push('"');
            } else {
                undefined;
            }
            if (_$4jsParams) {
                var _$4jsAttr = ('', __r20 = $$mode, $$mode = 'jsAttr', __r21 = $233(__$ctx), $$mode = __r20, '', __r21);
                _$4buf.push(' ', _$4jsAttr || 'data-bem', '="', __$ctx._.attrEscape(JSON.stringify(_$4jsParams)), '"');
            } else {
                undefined;
            }
            var _$4attrs = ('', __r22 = $$mode, $$mode = 'attrs', __r23 = $2(__$ctx), $$mode = __r22, '', __r23);
            _$4attrs = __$ctx._.extend(_$4attrs, _$4v.attrs);
            if (_$4attrs) {
                var _$4name;
                for (_$4name in _$4attrs) {
                    if (_$4attrs[_$4name] === undefined) {
                        continue;
                    } else {
                        undefined;
                    }
                    _$4buf.push(' ', _$4name, '="', __$ctx._.attrEscape(_$4attrs[_$4name]), '"');
                }
            } else {
                undefined;
            }
        } else {
            undefined;
        }
        if (__$ctx._.isShortTag(_$4tag)) {
            _$4buf.push('/>');
        } else {
            _$4tag && _$4buf.push('>');
            var _$4content = ('', __r24 = $$mode, $$mode = 'content', __r25 = $189(__$ctx), $$mode = __r24, '', __r25);
            if (_$4content || _$4content === 0) {
                var _$4isBEM = $$block || $$elem;
                {
                    '';
                    var __r26 = __$ctx._notNewList;
                    __$ctx._notNewList = false;
                    var __r27 = __$ctx.position;
                    __$ctx.position = _$4isBEM ? 1 : __$ctx.position;
                    var __r28 = __$ctx._listLength;
                    __$ctx._listLength = _$4isBEM ? 1 : __$ctx._listLength;
                    var __r29 = __$ctx.ctx;
                    __$ctx.ctx = _$4content;
                    var __r30 = $$mode;
                    $$mode = '';
                    $227(__$ctx);
                    __$ctx._notNewList = __r26;
                    __$ctx.position = __r27;
                    __$ctx._listLength = __r28;
                    __$ctx.ctx = __r29;
                    $$mode = __r30;
                    '';
                }
                undefined;
            } else {
                undefined;
            }
            _$4tag && _$4buf.push('</', _$4tag, '>');
        }
        return;
    }
    function $265(__$ctx) {
        var _$1v = __$ctx.ctx, _$1l = _$1v.length, _$1i = 0, _$1prevPos = __$ctx.position, _$1prevNotNewList = __$ctx._notNewList;
        if (_$1prevNotNewList) {
            __$ctx._listLength += _$1l - 1;
        } else {
            __$ctx.position = 0;
            __$ctx._listLength = _$1l;
        }
        __$ctx._notNewList = true;
        while (_$1i < _$1l) {
            var _$1newCtx = _$1v[_$1i++];
            {
                '';
                var __r0 = __$ctx.ctx;
                __$ctx.ctx = _$1newCtx == null ? '' : _$1newCtx;
                $227(__$ctx);
                __$ctx.ctx = __r0;
                '';
            }
            undefined;
        }
        _$1prevNotNewList || (__$ctx.position = _$1prevPos);
        return;
    }
    function $268(__$ctx) {
        var _$0vBlock = __$ctx.ctx.block, _$0vElem = __$ctx.ctx.elem, _$0block = __$ctx._currBlock || $$block;
        __$ctx.ctx || (__$ctx.ctx = {});
        {
            '';
            var __r0 = $$mode;
            $$mode = 'default';
            var __r1 = __$ctx._links;
            __$ctx._links = __$ctx.ctx.links || __$ctx._links;
            var __r2 = $$block;
            $$block = _$0vBlock || (_$0vElem ? _$0block : undefined);
            var __r3 = __$ctx._currBlock;
            __$ctx._currBlock = _$0vBlock || _$0vElem ? undefined : _$0block;
            var __r4 = $$elem;
            $$elem = __$ctx.ctx.elem;
            var __r5 = $$mods;
            $$mods = (_$0vBlock ? __$ctx.ctx.mods : $$mods) || {};
            var __r6 = $$elemMods;
            $$elemMods = __$ctx.ctx.elemMods || {};
            {
                $$block || $$elem ? __$ctx.position = (__$ctx.position || 0) + 1 : __$ctx._listLength--;
                $22(__$ctx);
                undefined;
            }
            $$mode = __r0;
            __$ctx._links = __r1;
            $$block = __r2;
            __$ctx._currBlock = __r3;
            $$elem = __r4;
            $$mods = __r5;
            $$elemMods = __r6;
            '';
        }
        return;
    }
    function $e(__$ctx) {
        throw new Error(this);
        return;
    }
    !function oninit() {
        (function (global, bem_) {
            if (bem_.I18N) {
                return undefined;
            } else {
                undefined;
            }
            global.BEM = bem_;
            var i18n = bem_.I18N = function (keyset, key) {
                    return key;
                };
            i18n.keyset = function () {
                return i18n;
            };
            i18n.key = function (key) {
                return key;
            };
            i18n.lang = function () {
                return undefined;
            };
        }(this, typeof BEM === 'undefined' ? {} : BEM));
    }();
    !function oninit() {
        var BEM_ = {}, toString = Object.prototype.toString, SHORT_TAGS = {
                area: 1,
                base: 1,
                br: 1,
                col: 1,
                command: 1,
                embed: 1,
                hr: 1,
                img: 1,
                input: 1,
                keygen: 1,
                link: 1,
                meta: 1,
                param: 1,
                source: 1,
                wbr: 1
            };
        (function (BEM, undefined) {
            var MOD_DELIM = '_', ELEM_DELIM = '__', NAME_PATTERN = '[a-zA-Z0-9-]+';
            function buildModPostfix(modName, modVal, buffer) {
                buffer.push(MOD_DELIM, modName, MOD_DELIM, modVal);
            }
            function buildBlockClass(name, modName, modVal, buffer) {
                buffer.push(name);
                modVal && buildModPostfix(modName, modVal, buffer);
            }
            function buildElemClass(block, name, modName, modVal, buffer) {
                buildBlockClass(block, undefined, undefined, buffer);
                buffer.push(ELEM_DELIM, name);
                modVal && buildModPostfix(modName, modVal, buffer);
            }
            BEM.INTERNAL = {
                NAME_PATTERN: NAME_PATTERN,
                MOD_DELIM: MOD_DELIM,
                ELEM_DELIM: ELEM_DELIM,
                buildModPostfix: function (modName, modVal, buffer) {
                    var res = buffer || [];
                    buildModPostfix(modName, modVal, res);
                    return buffer ? res : res.join('');
                },
                buildClass: function (block, elem, modName, modVal, buffer) {
                    var typeOf = typeof modName;
                    if (typeOf == 'string') {
                        if (typeof modVal != 'string') {
                            buffer = modVal;
                            modVal = modName;
                            modName = elem;
                            elem = undefined;
                        } else {
                            undefined;
                        }
                    } else {
                        if (typeOf != 'undefined') {
                            buffer = modName;
                            modName = undefined;
                        } else {
                            if (elem && typeof elem != 'string') {
                                buffer = elem;
                                elem = undefined;
                            } else {
                                undefined;
                            }
                        }
                    }
                    if (!(elem || modName || buffer)) {
                        return block;
                    } else {
                        undefined;
                    }
                    var res = buffer || [];
                    elem ? buildElemClass(block, elem, modName, modVal, res) : buildBlockClass(block, modName, modVal, res);
                    return buffer ? res : res.join('');
                },
                buildModsClasses: function (block, elem, mods, buffer) {
                    var res = buffer || [];
                    if (mods) {
                        var modName;
                        for (modName in mods) {
                            if (!mods.hasOwnProperty(modName)) {
                                continue;
                            } else {
                                undefined;
                            }
                            var modVal = mods[modName];
                            if (modVal == null) {
                                continue;
                            } else {
                                undefined;
                            }
                            modVal = mods[modName] + '';
                            if (!modVal) {
                                continue;
                            } else {
                                undefined;
                            }
                            res.push(' ');
                            if (elem) {
                                buildElemClass(block, elem, modName, modVal, res);
                            } else {
                                buildBlockClass(block, modName, modVal, res);
                            }
                        }
                    } else {
                        undefined;
                    }
                    return buffer ? res : res.join('');
                },
                buildClasses: function (block, elem, mods, buffer) {
                    var res = buffer || [];
                    elem ? buildElemClass(block, elem, undefined, undefined, res) : buildBlockClass(block, undefined, undefined, res);
                    this.buildModsClasses(block, elem, mods, buffer);
                    return buffer ? res : res.join('');
                }
            };
        }(BEM_));
        var buildEscape = function () {
                var ts = {
                        '"': '&quot;',
                        '&': '&amp;',
                        '<': '&lt;',
                        '>': '&gt;'
                    }, f = function (t) {
                        return ts[t] || t;
                    };
                return function (r) {
                    r = new RegExp(r, 'g');
                    return function (s) {
                        return ('' + s).replace(r, f);
                    };
                };
            }();
        function BEMContext(context, apply_) {
            this.ctx = typeof context === null ? '' : context;
            this.apply = apply_;
            this._buf = [];
            this._ = this;
            this._start = true;
            this._listLength = 0;
            this._notNewList = false;
            this.position = 0;
        }
        BEMContext.prototype.isArray = function isArray(obj) {
            return toString.call(obj) === '[object Array]';
        };
        BEMContext.prototype.isSimple = function isSimple(obj) {
            var t = typeof obj;
            return t === 'string' || t === 'number' || t === 'boolean';
        };
        BEMContext.prototype.isShortTag = function isShortTag(t) {
            return SHORT_TAGS.hasOwnProperty(t);
        };
        BEMContext.prototype.extend = function extend(o1, o2) {
            if (!o1 || !o2) {
                return o1 || o2;
            } else {
                undefined;
            }
            var res = {}, n;
            for (n in o1) {
                o1.hasOwnProperty(n) && (res[n] = o1[n]);
            }
            for (n in o2) {
                o2.hasOwnProperty(n) && (res[n] = o2[n]);
            }
            return res;
        };
        BEMContext.prototype.identify = function () {
            var cnt = 0, id = BEM_['__id'] = +new Date(), expando = '__' + id, get = function () {
                    return 'uniq' + id + ++cnt;
                };
            return function (obj, onlyGet) {
                if (!obj) {
                    return get();
                } else {
                    undefined;
                }
                if (onlyGet || obj[expando]) {
                    return obj[expando];
                } else {
                    return obj[expando] = get();
                }
            };
        }();
        BEMContext.prototype.xmlEscape = buildEscape('[&<>]');
        BEMContext.prototype.attrEscape = buildEscape('["&<>]');
        BEMContext.prototype.BEM = BEM_;
        BEMContext.prototype.isFirst = function isFirst() {
            return this.position === 1;
        };
        BEMContext.prototype.isLast = function isLast() {
            return this.position === this._listLength;
        };
        BEMContext.prototype.generateId = function generateId() {
            return this.identify(this.ctx);
        };
        exports.apply = BEMContext.apply = function _apply() {
            var ctx = new BEMContext(this, apply);
            ctx.apply();
            return ctx._buf.join('');
        };
    }();
    return exports;
    exports.apply = apply;
    function apply(ctx) {
        return applyc(ctx || this);
    }
    function applyc(__$ctx) {
        return $1(__$ctx);
    }
    return exports;
}(typeof exports === 'undefined' ? {} : exports));;
  return function(options) {
    var context = this;
    if (!options) options = {};
    cache = options.cache;
    return function() {
      if (context === this) {
        context = undefined;
$$mode = ''
$$block = ''
$$elem = ''
$$elemMods = ''
$$mods = ''
      } else {
$$mode = '';
$$block = '';
$$elem = '';
$$elemMods = '';
$$mods = '';
      }
      return xjst.apply.call(
[context]
      );
    }.call(null);
  };
}();
typeof exports === "undefined" || (exports.BEMHTML = BEMHTML);
/* global BEM, i18n */
(function(global_, bem_, undefined) {

// Check if BEM.I18N was already initialized
if(typeof bem_.I18N === 'function' && bem_.I18N._proto) {
    return bem_.I18N;
}

/**
 * Support tanker-like syntax of keys in `i-bem__i18n`
 * @example
 *  i18n['prj']['keyset']['key'](params)
 */
if(typeof i18n === 'undefined') {
    /* jshint -W020 */
    i18n = {};
    /* jshint +W020 */
}

/* jshint -W020 */
BEM = bem_;
/* jshint +W020 */

var MOD_DELIM = '_',
    ELEM_DELIM = '__',
    DEFAULT_LANG = 'ru',
    cache = {},
    // {String[]} A stack used for restoring context of dynamic keysets
    stack = [],
    debug = false,
    // @see http://whattheheadsaid.com/2011/04/internet-explorer-9s-problematic-console-object
    hasConsole = typeof console !== 'undefined' && typeof console.log === 'function';

function log() {
    if(debug && hasConsole) {
        console.log.apply(console, arguments);
    }
}

function bemName(decl) {
    typeof decl === 'string' && (decl = { block: decl });

    return decl.block +
        (decl.elem ? (ELEM_DELIM + decl.elem) : '') +
        (decl.modName ? MOD_DELIM + decl.modName + MOD_DELIM + decl.modVal : '');
}

function bemParse(name) {
    var bemitem = {};

    name.split(ELEM_DELIM).forEach(function(item, i) {
        var keys = [ i ? 'elem' : 'block', 'mod', 'val' ];

        item.split(MOD_DELIM).forEach(function(part, j) {
            bemitem[keys[j]] = part;
        });
    });

    return bemitem;
}

function _pushStack(name) {
    if(!name) return false;
    return stack.push(name);
}

function _popStack() {
    return stack.length && stack.pop();
}


/**
 * @constructor
 */
function _i18n() {
    this._lang = '';
    this._prj = 'lego'; // FIXME: bem-bl?
    this._keyset = '';
    this._key = '';
}

_i18n.prototype = {

    lang : function(name) {
        this._lang = name;
        return this;
    },

    project : function(name) {
        this._prj = name;
        return this;
    },

    keyset : function(name, saveCtx) {
        saveCtx && _pushStack(this._keyset);

        this._keyset = bemName(name);
        return this;
    },

    key : function(name) {
        this._key = name;
        return this;
    },

    /**
     * FIXME: Move legacy-syntax support into separat method
     * @param {Object|Function} v
     */
    decl : function(v) {
        var bemitem = bemParse(this._keyset),
            // tanker legacy syntax
            prj = bemitem.block === 'i-tanker' ? 'tanker' : this._prj,
            keyset = bemitem.elem || this._keyset,
            key = this._key;

        prj = i18n[prj] || (i18n[prj] = {});
        keyset = prj[keyset] || (prj[keyset] = {});
        keyset[key] = typeof v === 'function' ? v : (function(p) { return (v); });

        // `BEM.I18N` syntax
        var l = cache[this._lang] || (cache[this._lang] = {}),
            k = l[this._keyset] || (l[this._keyset] = {});

        k[key] = v;
    },

    val : function(params, ctx) {
        var value = cache[this._lang] && cache[this._lang][this._keyset],
            debugString = 'keyset: ' + this._keyset + ' key: ' + this._key + ' (lang: ' + this._lang + ')';

        if(!value) {
            log('[I18N_NO_KEYSET] %s', debugString);
            return '';
        }

        value = value[this._key];

        var valtype = typeof value;
        if(valtype === 'undefined') {
            log("[I18N_NO_VALUE] %s", debugString);
            return '';
        }

        if(valtype === 'string') {
            return value;
        }

        ctx || (ctx = this);
        // TODO: try/catch
        return value.call(ctx, params);
    },

    _cache : function() { return cache; }

};

/**
 * @namespace
 * @lends BEM.I18N
 */
bem_.I18N = (function(base) {

    /**
     * Shortcut to get key value
     *
     * @param {String|Object} keyset
     * @param {String} key
     * @param {Object} [params]
     * @returns {String}
     */
    var klass = function(keyset, key, params) {
        return klass.keyset(keyset).key(key, params);
    };

    klass._proto = base;

    /**
     * @param {String} name
     * @returns {BEM.I18N}
     */
    klass.project = function(name) {
        this._proto.project(name);
        return this;
    };

    /**
     * @param {String} name
     * @returns {BEM.I18N}
     */
    klass.keyset = function(name) {
        this._proto.keyset(name, true);
        return this;
    };

    /**
     * @param {String} name Key name
     * @param {Object} params
     * @returns {String}
     */
    klass.key = function(name, params) {
        var proto = this._proto,
            result,
            ksetRestored;

        proto.lang(this._lang).key(name);

        // TODO: kiss
        result = proto.val.call(proto, params, klass);

        // restoring keyset's context
        // NOTE: should not save current ctx, `saveCtx = false`
        ksetRestored = _popStack();
        ksetRestored && proto.keyset(ksetRestored, false);

        return result;
    };

    /**
     * Declaration of translations
     *
     * @param {String|Object} bemitem
     * @param {Object} keysets
     * @param {Object} [params] declaration params
     * @returns {BEM.I18N}
     */
    klass.decl = function(bemitem, keysets, params) {
        var proto = this._proto,
            k;

        params || (params = {});
        params.lang && proto.lang(params.lang);

        proto.keyset(bemitem);

        for(k in keysets) {
            if(keysets.hasOwnProperty(k)) {
                proto.key(k).decl(keysets[k]);
            }
        }

        return this;
    };

    /**
     * Get/set current language
     *
     * @param {String} [lang]
     * @returns {String}
     */
    klass.lang = function(lang) {
        typeof lang !== 'undefined' && (this._lang = lang);
        return this._lang;
    };

    klass.debug = function(flag) {
        debug = !!flag;
    };

    klass.lang(DEFAULT_LANG);

    return klass;

}(new _i18n()));

})(this, typeof BEM === 'undefined' ? {} : BEM);




BEM.I18N.lang('en');
