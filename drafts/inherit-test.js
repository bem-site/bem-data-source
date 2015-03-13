var inherit = require('inherit'),

    A = inherit({
        _a: undefined,
        _b: undefined,

        __constructor: function (a, b) {
            this._a = a;
            this._b = b;
        },

        get a() {
            return this._a;
        },

        get b() {
            return this._b;
        }
    }),
    B = inherit(A, {
        __constructor: function (a, b) {
            this.__base(a, b);
        },

        test: function () {
            console.log(this.a);
            console.log(this.b);
        }
    }),

    b = new B(2, 3);

b.test();
