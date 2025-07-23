import Ot, { useState as j, useRef as Se, useCallback as lr, useEffect as bt } from "react";
var ze = { exports: {} }, ge = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var wt;
function hr() {
  if (wt) return ge;
  wt = 1;
  var n = Ot, e = Symbol.for("react.element"), t = Symbol.for("react.fragment"), r = Object.prototype.hasOwnProperty, i = n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, a = { key: !0, ref: !0, __self: !0, __source: !0 };
  function u(h, l, x) {
    var v, k = {}, C = null, Y = null;
    x !== void 0 && (C = "" + x), l.key !== void 0 && (C = "" + l.key), l.ref !== void 0 && (Y = l.ref);
    for (v in l) r.call(l, v) && !a.hasOwnProperty(v) && (k[v] = l[v]);
    if (h && h.defaultProps) for (v in l = h.defaultProps, l) k[v] === void 0 && (k[v] = l[v]);
    return { $$typeof: e, type: h, key: C, ref: Y, props: k, _owner: i.current };
  }
  return ge.Fragment = t, ge.jsx = u, ge.jsxs = u, ge;
}
var me = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Et;
function fr() {
  return Et || (Et = 1, process.env.NODE_ENV !== "production" && function() {
    var n = Ot, e = Symbol.for("react.element"), t = Symbol.for("react.portal"), r = Symbol.for("react.fragment"), i = Symbol.for("react.strict_mode"), a = Symbol.for("react.profiler"), u = Symbol.for("react.provider"), h = Symbol.for("react.context"), l = Symbol.for("react.forward_ref"), x = Symbol.for("react.suspense"), v = Symbol.for("react.suspense_list"), k = Symbol.for("react.memo"), C = Symbol.for("react.lazy"), Y = Symbol.for("react.offscreen"), J = Symbol.iterator, W = "@@iterator";
    function ve(s) {
      if (s === null || typeof s != "object")
        return null;
      var o = J && s[J] || s[W];
      return typeof o == "function" ? o : null;
    }
    var q = n.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function A(s) {
      {
        for (var o = arguments.length, c = new Array(o > 1 ? o - 1 : 0), p = 1; p < o; p++)
          c[p - 1] = arguments[p];
        ue("error", s, c);
      }
    }
    function ue(s, o, c) {
      {
        var p = q.ReactDebugCurrentFrame, b = p.getStackAddendum();
        b !== "" && (o += "%s", c = c.concat([b]));
        var E = c.map(function(_) {
          return String(_);
        });
        E.unshift("Warning: " + o), Function.prototype.apply.call(console[s], console, E);
      }
    }
    var M = !1, be = !1, De = !1, we = !1, Ie = !1, Q;
    Q = Symbol.for("react.module.reference");
    function Z(s) {
      return !!(typeof s == "string" || typeof s == "function" || s === r || s === a || Ie || s === i || s === x || s === v || we || s === Y || M || be || De || typeof s == "object" && s !== null && (s.$$typeof === C || s.$$typeof === k || s.$$typeof === u || s.$$typeof === h || s.$$typeof === l || // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      s.$$typeof === Q || s.getModuleId !== void 0));
    }
    function le(s, o, c) {
      var p = s.displayName;
      if (p)
        return p;
      var b = o.displayName || o.name || "";
      return b !== "" ? c + "(" + b + ")" : c;
    }
    function ee(s) {
      return s.displayName || "Context";
    }
    function D(s) {
      if (s == null)
        return null;
      if (typeof s.tag == "number" && A("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof s == "function")
        return s.displayName || s.name || null;
      if (typeof s == "string")
        return s;
      switch (s) {
        case r:
          return "Fragment";
        case t:
          return "Portal";
        case a:
          return "Profiler";
        case i:
          return "StrictMode";
        case x:
          return "Suspense";
        case v:
          return "SuspenseList";
      }
      if (typeof s == "object")
        switch (s.$$typeof) {
          case h:
            var o = s;
            return ee(o) + ".Consumer";
          case u:
            var c = s;
            return ee(c._context) + ".Provider";
          case l:
            return le(s, s.render, "ForwardRef");
          case k:
            var p = s.displayName || null;
            return p !== null ? p : D(s.type) || "Memo";
          case C: {
            var b = s, E = b._payload, _ = b._init;
            try {
              return D(_(E));
            } catch {
              return null;
            }
          }
        }
      return null;
    }
    var L = Object.assign, z = 0, X, te, H, re, Ee, Re, ke;
    function he() {
    }
    he.__reactDisabledLog = !0;
    function Fe() {
      {
        if (z === 0) {
          X = console.log, te = console.info, H = console.warn, re = console.error, Ee = console.group, Re = console.groupCollapsed, ke = console.groupEnd;
          var s = {
            configurable: !0,
            enumerable: !0,
            value: he,
            writable: !0
          };
          Object.defineProperties(console, {
            info: s,
            log: s,
            warn: s,
            error: s,
            group: s,
            groupCollapsed: s,
            groupEnd: s
          });
        }
        z++;
      }
    }
    function qe() {
      {
        if (z--, z === 0) {
          var s = {
            configurable: !0,
            enumerable: !0,
            writable: !0
          };
          Object.defineProperties(console, {
            log: L({}, s, {
              value: X
            }),
            info: L({}, s, {
              value: te
            }),
            warn: L({}, s, {
              value: H
            }),
            error: L({}, s, {
              value: re
            }),
            group: L({}, s, {
              value: Ee
            }),
            groupCollapsed: L({}, s, {
              value: Re
            }),
            groupEnd: L({}, s, {
              value: ke
            })
          });
        }
        z < 0 && A("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
    }
    var fe = q.ReactCurrentDispatcher, de;
    function ne(s, o, c) {
      {
        if (de === void 0)
          try {
            throw Error();
          } catch (b) {
            var p = b.stack.trim().match(/\n( *(at )?)/);
            de = p && p[1] || "";
          }
        return `
` + de + s;
      }
    }
    var pe = !1, se;
    {
      var Me = typeof WeakMap == "function" ? WeakMap : Map;
      se = new Me();
    }
    function Te(s, o) {
      if (!s || pe)
        return "";
      {
        var c = se.get(s);
        if (c !== void 0)
          return c;
      }
      var p;
      pe = !0;
      var b = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var E;
      E = fe.current, fe.current = null, Fe();
      try {
        if (o) {
          var _ = function() {
            throw Error();
          };
          if (Object.defineProperty(_.prototype, "props", {
            set: function() {
              throw Error();
            }
          }), typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct(_, []);
            } catch (P) {
              p = P;
            }
            Reflect.construct(s, [], _);
          } else {
            try {
              _.call();
            } catch (P) {
              p = P;
            }
            s.call(_.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (P) {
            p = P;
          }
          s();
        }
      } catch (P) {
        if (P && p && typeof P.stack == "string") {
          for (var g = P.stack.split(`
`), N = p.stack.split(`
`), T = g.length - 1, S = N.length - 1; T >= 1 && S >= 0 && g[T] !== N[S]; )
            S--;
          for (; T >= 1 && S >= 0; T--, S--)
            if (g[T] !== N[S]) {
              if (T !== 1 || S !== 1)
                do
                  if (T--, S--, S < 0 || g[T] !== N[S]) {
                    var I = `
` + g[T].replace(" at new ", " at ");
                    return s.displayName && I.includes("<anonymous>") && (I = I.replace("<anonymous>", s.displayName)), typeof s == "function" && se.set(s, I), I;
                  }
                while (T >= 1 && S >= 0);
              break;
            }
        }
      } finally {
        pe = !1, fe.current = E, qe(), Error.prepareStackTrace = b;
      }
      var ae = s ? s.displayName || s.name : "", G = ae ? ne(ae) : "";
      return typeof s == "function" && se.set(s, G), G;
    }
    function f(s, o, c) {
      return Te(s, !1);
    }
    function d(s) {
      var o = s.prototype;
      return !!(o && o.isReactComponent);
    }
    function w(s, o, c) {
      if (s == null)
        return "";
      if (typeof s == "function")
        return Te(s, d(s));
      if (typeof s == "string")
        return ne(s);
      switch (s) {
        case x:
          return ne("Suspense");
        case v:
          return ne("SuspenseList");
      }
      if (typeof s == "object")
        switch (s.$$typeof) {
          case l:
            return f(s.render);
          case k:
            return w(s.type, o, c);
          case C: {
            var p = s, b = p._payload, E = p._init;
            try {
              return w(E(b), o, c);
            } catch {
            }
          }
        }
      return "";
    }
    var R = Object.prototype.hasOwnProperty, ie = {}, at = q.ReactDebugCurrentFrame;
    function Ce(s) {
      if (s) {
        var o = s._owner, c = w(s.type, s._source, o ? o.type : null);
        at.setExtraStackFrame(c);
      } else
        at.setExtraStackFrame(null);
    }
    function Vt(s, o, c, p, b) {
      {
        var E = Function.call.bind(R);
        for (var _ in s)
          if (E(s, _)) {
            var g = void 0;
            try {
              if (typeof s[_] != "function") {
                var N = Error((p || "React class") + ": " + c + " type `" + _ + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof s[_] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                throw N.name = "Invariant Violation", N;
              }
              g = s[_](o, _, p, c, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (T) {
              g = T;
            }
            g && !(g instanceof Error) && (Ce(b), A("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", p || "React class", c, _, typeof g), Ce(null)), g instanceof Error && !(g.message in ie) && (ie[g.message] = !0, Ce(b), A("Failed %s type: %s", c, g.message), Ce(null));
          }
      }
    }
    var $t = Array.isArray;
    function Ue(s) {
      return $t(s);
    }
    function Wt(s) {
      {
        var o = typeof Symbol == "function" && Symbol.toStringTag, c = o && s[Symbol.toStringTag] || s.constructor.name || "Object";
        return c;
      }
    }
    function Yt(s) {
      try {
        return ct(s), !1;
      } catch {
        return !0;
      }
    }
    function ct(s) {
      return "" + s;
    }
    function ut(s) {
      if (Yt(s))
        return A("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", Wt(s)), ct(s);
    }
    var lt = q.ReactCurrentOwner, Ht = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, ht, ft;
    function Kt(s) {
      if (R.call(s, "ref")) {
        var o = Object.getOwnPropertyDescriptor(s, "ref").get;
        if (o && o.isReactWarning)
          return !1;
      }
      return s.ref !== void 0;
    }
    function Jt(s) {
      if (R.call(s, "key")) {
        var o = Object.getOwnPropertyDescriptor(s, "key").get;
        if (o && o.isReactWarning)
          return !1;
      }
      return s.key !== void 0;
    }
    function zt(s, o) {
      typeof s.ref == "string" && lt.current;
    }
    function Xt(s, o) {
      {
        var c = function() {
          ht || (ht = !0, A("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", o));
        };
        c.isReactWarning = !0, Object.defineProperty(s, "key", {
          get: c,
          configurable: !0
        });
      }
    }
    function Gt(s, o) {
      {
        var c = function() {
          ft || (ft = !0, A("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", o));
        };
        c.isReactWarning = !0, Object.defineProperty(s, "ref", {
          get: c,
          configurable: !0
        });
      }
    }
    var Qt = function(s, o, c, p, b, E, _) {
      var g = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: e,
        // Built-in properties that belong on the element
        type: s,
        key: o,
        ref: c,
        props: _,
        // Record the component responsible for creating this element.
        _owner: E
      };
      return g._store = {}, Object.defineProperty(g._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(g, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: p
      }), Object.defineProperty(g, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: b
      }), Object.freeze && (Object.freeze(g.props), Object.freeze(g)), g;
    };
    function Zt(s, o, c, p, b) {
      {
        var E, _ = {}, g = null, N = null;
        c !== void 0 && (ut(c), g = "" + c), Jt(o) && (ut(o.key), g = "" + o.key), Kt(o) && (N = o.ref, zt(o, b));
        for (E in o)
          R.call(o, E) && !Ht.hasOwnProperty(E) && (_[E] = o[E]);
        if (s && s.defaultProps) {
          var T = s.defaultProps;
          for (E in T)
            _[E] === void 0 && (_[E] = T[E]);
        }
        if (g || N) {
          var S = typeof s == "function" ? s.displayName || s.name || "Unknown" : s;
          g && Xt(_, S), N && Gt(_, S);
        }
        return Qt(s, g, N, b, p, lt.current, _);
      }
    }
    var Ve = q.ReactCurrentOwner, dt = q.ReactDebugCurrentFrame;
    function oe(s) {
      if (s) {
        var o = s._owner, c = w(s.type, s._source, o ? o.type : null);
        dt.setExtraStackFrame(c);
      } else
        dt.setExtraStackFrame(null);
    }
    var $e;
    $e = !1;
    function We(s) {
      return typeof s == "object" && s !== null && s.$$typeof === e;
    }
    function pt() {
      {
        if (Ve.current) {
          var s = D(Ve.current.type);
          if (s)
            return `

Check the render method of \`` + s + "`.";
        }
        return "";
      }
    }
    function er(s) {
      return "";
    }
    var gt = {};
    function tr(s) {
      {
        var o = pt();
        if (!o) {
          var c = typeof s == "string" ? s : s.displayName || s.name;
          c && (o = `

Check the top-level render call using <` + c + ">.");
        }
        return o;
      }
    }
    function mt(s, o) {
      {
        if (!s._store || s._store.validated || s.key != null)
          return;
        s._store.validated = !0;
        var c = tr(o);
        if (gt[c])
          return;
        gt[c] = !0;
        var p = "";
        s && s._owner && s._owner !== Ve.current && (p = " It was passed a child from " + D(s._owner.type) + "."), oe(s), A('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', c, p), oe(null);
      }
    }
    function yt(s, o) {
      {
        if (typeof s != "object")
          return;
        if (Ue(s))
          for (var c = 0; c < s.length; c++) {
            var p = s[c];
            We(p) && mt(p, o);
          }
        else if (We(s))
          s._store && (s._store.validated = !0);
        else if (s) {
          var b = ve(s);
          if (typeof b == "function" && b !== s.entries)
            for (var E = b.call(s), _; !(_ = E.next()).done; )
              We(_.value) && mt(_.value, o);
        }
      }
    }
    function rr(s) {
      {
        var o = s.type;
        if (o == null || typeof o == "string")
          return;
        var c;
        if (typeof o == "function")
          c = o.propTypes;
        else if (typeof o == "object" && (o.$$typeof === l || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        o.$$typeof === k))
          c = o.propTypes;
        else
          return;
        if (c) {
          var p = D(o);
          Vt(c, s.props, "prop", p, s);
        } else if (o.PropTypes !== void 0 && !$e) {
          $e = !0;
          var b = D(o);
          A("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", b || "Unknown");
        }
        typeof o.getDefaultProps == "function" && !o.getDefaultProps.isReactClassApproved && A("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function nr(s) {
      {
        for (var o = Object.keys(s.props), c = 0; c < o.length; c++) {
          var p = o[c];
          if (p !== "children" && p !== "key") {
            oe(s), A("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", p), oe(null);
            break;
          }
        }
        s.ref !== null && (oe(s), A("Invalid attribute `ref` supplied to `React.Fragment`."), oe(null));
      }
    }
    var _t = {};
    function vt(s, o, c, p, b, E) {
      {
        var _ = Z(s);
        if (!_) {
          var g = "";
          (s === void 0 || typeof s == "object" && s !== null && Object.keys(s).length === 0) && (g += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var N = er();
          N ? g += N : g += pt();
          var T;
          s === null ? T = "null" : Ue(s) ? T = "array" : s !== void 0 && s.$$typeof === e ? (T = "<" + (D(s.type) || "Unknown") + " />", g = " Did you accidentally export a JSX literal instead of a component?") : T = typeof s, A("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", T, g);
        }
        var S = Zt(s, o, c, b, E);
        if (S == null)
          return S;
        if (_) {
          var I = o.children;
          if (I !== void 0)
            if (p)
              if (Ue(I)) {
                for (var ae = 0; ae < I.length; ae++)
                  yt(I[ae], s);
                Object.freeze && Object.freeze(I);
              } else
                A("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
            else
              yt(I, s);
        }
        if (R.call(o, "key")) {
          var G = D(s), P = Object.keys(o).filter(function(ur) {
            return ur !== "key";
          }), Ye = P.length > 0 ? "{key: someKey, " + P.join(": ..., ") + ": ...}" : "{key: someKey}";
          if (!_t[G + Ye]) {
            var cr = P.length > 0 ? "{" + P.join(": ..., ") + ": ...}" : "{}";
            A(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`, Ye, G, cr, G), _t[G + Ye] = !0;
          }
        }
        return s === r ? nr(S) : rr(S), S;
      }
    }
    function sr(s, o, c) {
      return vt(s, o, c, !0);
    }
    function ir(s, o, c) {
      return vt(s, o, c, !1);
    }
    var or = ir, ar = sr;
    me.Fragment = r, me.jsx = or, me.jsxs = ar;
  }()), me;
}
process.env.NODE_ENV === "production" ? ze.exports = hr() : ze.exports = fr();
var m = ze.exports;
const $ = /* @__PURE__ */ Object.create(null);
$.open = "0";
$.close = "1";
$.ping = "2";
$.pong = "3";
$.message = "4";
$.upgrade = "5";
$.noop = "6";
const Ae = /* @__PURE__ */ Object.create(null);
Object.keys($).forEach((n) => {
  Ae[$[n]] = n;
});
const Xe = { type: "error", data: "parser error" }, xt = typeof Blob == "function" || typeof Blob < "u" && Object.prototype.toString.call(Blob) === "[object BlobConstructor]", At = typeof ArrayBuffer == "function", Bt = (n) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(n) : n && n.buffer instanceof ArrayBuffer, rt = ({ type: n, data: e }, t, r) => xt && e instanceof Blob ? t ? r(e) : Rt(e, r) : At && (e instanceof ArrayBuffer || Bt(e)) ? t ? r(e) : Rt(new Blob([e]), r) : r($[n] + (e || "")), Rt = (n, e) => {
  const t = new FileReader();
  return t.onload = function() {
    const r = t.result.split(",")[1];
    e("b" + (r || ""));
  }, t.readAsDataURL(n);
};
function kt(n) {
  return n instanceof Uint8Array ? n : n instanceof ArrayBuffer ? new Uint8Array(n) : new Uint8Array(n.buffer, n.byteOffset, n.byteLength);
}
let He;
function dr(n, e) {
  if (xt && n.data instanceof Blob)
    return n.data.arrayBuffer().then(kt).then(e);
  if (At && (n.data instanceof ArrayBuffer || Bt(n.data)))
    return e(kt(n.data));
  rt(n, !1, (t) => {
    He || (He = new TextEncoder()), e(He.encode(t));
  });
}
const Tt = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/", _e = typeof Uint8Array > "u" ? [] : new Uint8Array(256);
for (let n = 0; n < Tt.length; n++)
  _e[Tt.charCodeAt(n)] = n;
const pr = (n) => {
  let e = n.length * 0.75, t = n.length, r, i = 0, a, u, h, l;
  n[n.length - 1] === "=" && (e--, n[n.length - 2] === "=" && e--);
  const x = new ArrayBuffer(e), v = new Uint8Array(x);
  for (r = 0; r < t; r += 4)
    a = _e[n.charCodeAt(r)], u = _e[n.charCodeAt(r + 1)], h = _e[n.charCodeAt(r + 2)], l = _e[n.charCodeAt(r + 3)], v[i++] = a << 2 | u >> 4, v[i++] = (u & 15) << 4 | h >> 2, v[i++] = (h & 3) << 6 | l & 63;
  return x;
}, gr = typeof ArrayBuffer == "function", nt = (n, e) => {
  if (typeof n != "string")
    return {
      type: "message",
      data: Nt(n, e)
    };
  const t = n.charAt(0);
  return t === "b" ? {
    type: "message",
    data: mr(n.substring(1), e)
  } : Ae[t] ? n.length > 1 ? {
    type: Ae[t],
    data: n.substring(1)
  } : {
    type: Ae[t]
  } : Xe;
}, mr = (n, e) => {
  if (gr) {
    const t = pr(n);
    return Nt(t, e);
  } else
    return { base64: !0, data: n };
}, Nt = (n, e) => {
  switch (e) {
    case "blob":
      return n instanceof Blob ? n : new Blob([n]);
    case "arraybuffer":
    default:
      return n instanceof ArrayBuffer ? n : n.buffer;
  }
}, Pt = "", yr = (n, e) => {
  const t = n.length, r = new Array(t);
  let i = 0;
  n.forEach((a, u) => {
    rt(a, !1, (h) => {
      r[u] = h, ++i === t && e(r.join(Pt));
    });
  });
}, _r = (n, e) => {
  const t = n.split(Pt), r = [];
  for (let i = 0; i < t.length; i++) {
    const a = nt(t[i], e);
    if (r.push(a), a.type === "error")
      break;
  }
  return r;
};
function vr() {
  return new TransformStream({
    transform(n, e) {
      dr(n, (t) => {
        const r = t.length;
        let i;
        if (r < 126)
          i = new Uint8Array(1), new DataView(i.buffer).setUint8(0, r);
        else if (r < 65536) {
          i = new Uint8Array(3);
          const a = new DataView(i.buffer);
          a.setUint8(0, 126), a.setUint16(1, r);
        } else {
          i = new Uint8Array(9);
          const a = new DataView(i.buffer);
          a.setUint8(0, 127), a.setBigUint64(1, BigInt(r));
        }
        n.data && typeof n.data != "string" && (i[0] |= 128), e.enqueue(i), e.enqueue(t);
      });
    }
  });
}
let Ke;
function Oe(n) {
  return n.reduce((e, t) => e + t.length, 0);
}
function xe(n, e) {
  if (n[0].length === e)
    return n.shift();
  const t = new Uint8Array(e);
  let r = 0;
  for (let i = 0; i < e; i++)
    t[i] = n[0][r++], r === n[0].length && (n.shift(), r = 0);
  return n.length && r < n[0].length && (n[0] = n[0].slice(r)), t;
}
function br(n, e) {
  Ke || (Ke = new TextDecoder());
  const t = [];
  let r = 0, i = -1, a = !1;
  return new TransformStream({
    transform(u, h) {
      for (t.push(u); ; ) {
        if (r === 0) {
          if (Oe(t) < 1)
            break;
          const l = xe(t, 1);
          a = (l[0] & 128) === 128, i = l[0] & 127, i < 126 ? r = 3 : i === 126 ? r = 1 : r = 2;
        } else if (r === 1) {
          if (Oe(t) < 2)
            break;
          const l = xe(t, 2);
          i = new DataView(l.buffer, l.byteOffset, l.length).getUint16(0), r = 3;
        } else if (r === 2) {
          if (Oe(t) < 8)
            break;
          const l = xe(t, 8), x = new DataView(l.buffer, l.byteOffset, l.length), v = x.getUint32(0);
          if (v > Math.pow(2, 21) - 1) {
            h.enqueue(Xe);
            break;
          }
          i = v * Math.pow(2, 32) + x.getUint32(4), r = 3;
        } else {
          if (Oe(t) < i)
            break;
          const l = xe(t, i);
          h.enqueue(nt(a ? l : Ke.decode(l), e)), r = 0;
        }
        if (i === 0 || i > n) {
          h.enqueue(Xe);
          break;
        }
      }
    }
  });
}
const Lt = 4;
function O(n) {
  if (n) return wr(n);
}
function wr(n) {
  for (var e in O.prototype)
    n[e] = O.prototype[e];
  return n;
}
O.prototype.on = O.prototype.addEventListener = function(n, e) {
  return this._callbacks = this._callbacks || {}, (this._callbacks["$" + n] = this._callbacks["$" + n] || []).push(e), this;
};
O.prototype.once = function(n, e) {
  function t() {
    this.off(n, t), e.apply(this, arguments);
  }
  return t.fn = e, this.on(n, t), this;
};
O.prototype.off = O.prototype.removeListener = O.prototype.removeAllListeners = O.prototype.removeEventListener = function(n, e) {
  if (this._callbacks = this._callbacks || {}, arguments.length == 0)
    return this._callbacks = {}, this;
  var t = this._callbacks["$" + n];
  if (!t) return this;
  if (arguments.length == 1)
    return delete this._callbacks["$" + n], this;
  for (var r, i = 0; i < t.length; i++)
    if (r = t[i], r === e || r.fn === e) {
      t.splice(i, 1);
      break;
    }
  return t.length === 0 && delete this._callbacks["$" + n], this;
};
O.prototype.emit = function(n) {
  this._callbacks = this._callbacks || {};
  for (var e = new Array(arguments.length - 1), t = this._callbacks["$" + n], r = 1; r < arguments.length; r++)
    e[r - 1] = arguments[r];
  if (t) {
    t = t.slice(0);
    for (var r = 0, i = t.length; r < i; ++r)
      t[r].apply(this, e);
  }
  return this;
};
O.prototype.emitReserved = O.prototype.emit;
O.prototype.listeners = function(n) {
  return this._callbacks = this._callbacks || {}, this._callbacks["$" + n] || [];
};
O.prototype.hasListeners = function(n) {
  return !!this.listeners(n).length;
};
const Le = typeof Promise == "function" && typeof Promise.resolve == "function" ? (e) => Promise.resolve().then(e) : (e, t) => t(e, 0), F = typeof self < "u" ? self : typeof window < "u" ? window : Function("return this")(), Er = "arraybuffer";
function jt(n, ...e) {
  return e.reduce((t, r) => (n.hasOwnProperty(r) && (t[r] = n[r]), t), {});
}
const Rr = F.setTimeout, kr = F.clearTimeout;
function je(n, e) {
  e.useNativeTimers ? (n.setTimeoutFn = Rr.bind(F), n.clearTimeoutFn = kr.bind(F)) : (n.setTimeoutFn = F.setTimeout.bind(F), n.clearTimeoutFn = F.clearTimeout.bind(F));
}
const Tr = 1.33;
function Cr(n) {
  return typeof n == "string" ? Sr(n) : Math.ceil((n.byteLength || n.size) * Tr);
}
function Sr(n) {
  let e = 0, t = 0;
  for (let r = 0, i = n.length; r < i; r++)
    e = n.charCodeAt(r), e < 128 ? t += 1 : e < 2048 ? t += 2 : e < 55296 || e >= 57344 ? t += 3 : (r++, t += 4);
  return t;
}
function Dt() {
  return Date.now().toString(36).substring(3) + Math.random().toString(36).substring(2, 5);
}
function Or(n) {
  let e = "";
  for (let t in n)
    n.hasOwnProperty(t) && (e.length && (e += "&"), e += encodeURIComponent(t) + "=" + encodeURIComponent(n[t]));
  return e;
}
function xr(n) {
  let e = {}, t = n.split("&");
  for (let r = 0, i = t.length; r < i; r++) {
    let a = t[r].split("=");
    e[decodeURIComponent(a[0])] = decodeURIComponent(a[1]);
  }
  return e;
}
class Ar extends Error {
  constructor(e, t, r) {
    super(e), this.description = t, this.context = r, this.type = "TransportError";
  }
}
class st extends O {
  /**
   * Transport abstract constructor.
   *
   * @param {Object} opts - options
   * @protected
   */
  constructor(e) {
    super(), this.writable = !1, je(this, e), this.opts = e, this.query = e.query, this.socket = e.socket, this.supportsBinary = !e.forceBase64;
  }
  /**
   * Emits an error.
   *
   * @param {String} reason
   * @param description
   * @param context - the error context
   * @return {Transport} for chaining
   * @protected
   */
  onError(e, t, r) {
    return super.emitReserved("error", new Ar(e, t, r)), this;
  }
  /**
   * Opens the transport.
   */
  open() {
    return this.readyState = "opening", this.doOpen(), this;
  }
  /**
   * Closes the transport.
   */
  close() {
    return (this.readyState === "opening" || this.readyState === "open") && (this.doClose(), this.onClose()), this;
  }
  /**
   * Sends multiple packets.
   *
   * @param {Array} packets
   */
  send(e) {
    this.readyState === "open" && this.write(e);
  }
  /**
   * Called upon open
   *
   * @protected
   */
  onOpen() {
    this.readyState = "open", this.writable = !0, super.emitReserved("open");
  }
  /**
   * Called with data.
   *
   * @param {String} data
   * @protected
   */
  onData(e) {
    const t = nt(e, this.socket.binaryType);
    this.onPacket(t);
  }
  /**
   * Called with a decoded packet.
   *
   * @protected
   */
  onPacket(e) {
    super.emitReserved("packet", e);
  }
  /**
   * Called upon close.
   *
   * @protected
   */
  onClose(e) {
    this.readyState = "closed", super.emitReserved("close", e);
  }
  /**
   * Pauses the transport, in order not to lose packets during an upgrade.
   *
   * @param onPause
   */
  pause(e) {
  }
  createUri(e, t = {}) {
    return e + "://" + this._hostname() + this._port() + this.opts.path + this._query(t);
  }
  _hostname() {
    const e = this.opts.hostname;
    return e.indexOf(":") === -1 ? e : "[" + e + "]";
  }
  _port() {
    return this.opts.port && (this.opts.secure && +(this.opts.port !== 443) || !this.opts.secure && Number(this.opts.port) !== 80) ? ":" + this.opts.port : "";
  }
  _query(e) {
    const t = Or(e);
    return t.length ? "?" + t : "";
  }
}
class Br extends st {
  constructor() {
    super(...arguments), this._polling = !1;
  }
  get name() {
    return "polling";
  }
  /**
   * Opens the socket (triggers polling). We write a PING message to determine
   * when the transport is open.
   *
   * @protected
   */
  doOpen() {
    this._poll();
  }
  /**
   * Pauses polling.
   *
   * @param {Function} onPause - callback upon buffers are flushed and transport is paused
   * @package
   */
  pause(e) {
    this.readyState = "pausing";
    const t = () => {
      this.readyState = "paused", e();
    };
    if (this._polling || !this.writable) {
      let r = 0;
      this._polling && (r++, this.once("pollComplete", function() {
        --r || t();
      })), this.writable || (r++, this.once("drain", function() {
        --r || t();
      }));
    } else
      t();
  }
  /**
   * Starts polling cycle.
   *
   * @private
   */
  _poll() {
    this._polling = !0, this.doPoll(), this.emitReserved("poll");
  }
  /**
   * Overloads onData to detect payloads.
   *
   * @protected
   */
  onData(e) {
    const t = (r) => {
      if (this.readyState === "opening" && r.type === "open" && this.onOpen(), r.type === "close")
        return this.onClose({ description: "transport closed by the server" }), !1;
      this.onPacket(r);
    };
    _r(e, this.socket.binaryType).forEach(t), this.readyState !== "closed" && (this._polling = !1, this.emitReserved("pollComplete"), this.readyState === "open" && this._poll());
  }
  /**
   * For polling, send a close packet.
   *
   * @protected
   */
  doClose() {
    const e = () => {
      this.write([{ type: "close" }]);
    };
    this.readyState === "open" ? e() : this.once("open", e);
  }
  /**
   * Writes a packets payload.
   *
   * @param {Array} packets - data packets
   * @protected
   */
  write(e) {
    this.writable = !1, yr(e, (t) => {
      this.doWrite(t, () => {
        this.writable = !0, this.emitReserved("drain");
      });
    });
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const e = this.opts.secure ? "https" : "http", t = this.query || {};
    return this.opts.timestampRequests !== !1 && (t[this.opts.timestampParam] = Dt()), !this.supportsBinary && !t.sid && (t.b64 = 1), this.createUri(e, t);
  }
}
let It = !1;
try {
  It = typeof XMLHttpRequest < "u" && "withCredentials" in new XMLHttpRequest();
} catch {
}
const Nr = It;
function Pr() {
}
class Lr extends Br {
  /**
   * XHR Polling constructor.
   *
   * @param {Object} opts
   * @package
   */
  constructor(e) {
    if (super(e), typeof location < "u") {
      const t = location.protocol === "https:";
      let r = location.port;
      r || (r = t ? "443" : "80"), this.xd = typeof location < "u" && e.hostname !== location.hostname || r !== e.port;
    }
  }
  /**
   * Sends data.
   *
   * @param {String} data to send.
   * @param {Function} called upon flush.
   * @private
   */
  doWrite(e, t) {
    const r = this.request({
      method: "POST",
      data: e
    });
    r.on("success", t), r.on("error", (i, a) => {
      this.onError("xhr post error", i, a);
    });
  }
  /**
   * Starts a poll cycle.
   *
   * @private
   */
  doPoll() {
    const e = this.request();
    e.on("data", this.onData.bind(this)), e.on("error", (t, r) => {
      this.onError("xhr poll error", t, r);
    }), this.pollXhr = e;
  }
}
class V extends O {
  /**
   * Request constructor
   *
   * @param {Object} options
   * @package
   */
  constructor(e, t, r) {
    super(), this.createRequest = e, je(this, r), this._opts = r, this._method = r.method || "GET", this._uri = t, this._data = r.data !== void 0 ? r.data : null, this._create();
  }
  /**
   * Creates the XHR object and sends the request.
   *
   * @private
   */
  _create() {
    var e;
    const t = jt(this._opts, "agent", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "autoUnref");
    t.xdomain = !!this._opts.xd;
    const r = this._xhr = this.createRequest(t);
    try {
      r.open(this._method, this._uri, !0);
      try {
        if (this._opts.extraHeaders) {
          r.setDisableHeaderCheck && r.setDisableHeaderCheck(!0);
          for (let i in this._opts.extraHeaders)
            this._opts.extraHeaders.hasOwnProperty(i) && r.setRequestHeader(i, this._opts.extraHeaders[i]);
        }
      } catch {
      }
      if (this._method === "POST")
        try {
          r.setRequestHeader("Content-type", "text/plain;charset=UTF-8");
        } catch {
        }
      try {
        r.setRequestHeader("Accept", "*/*");
      } catch {
      }
      (e = this._opts.cookieJar) === null || e === void 0 || e.addCookies(r), "withCredentials" in r && (r.withCredentials = this._opts.withCredentials), this._opts.requestTimeout && (r.timeout = this._opts.requestTimeout), r.onreadystatechange = () => {
        var i;
        r.readyState === 3 && ((i = this._opts.cookieJar) === null || i === void 0 || i.parseCookies(
          // @ts-ignore
          r.getResponseHeader("set-cookie")
        )), r.readyState === 4 && (r.status === 200 || r.status === 1223 ? this._onLoad() : this.setTimeoutFn(() => {
          this._onError(typeof r.status == "number" ? r.status : 0);
        }, 0));
      }, r.send(this._data);
    } catch (i) {
      this.setTimeoutFn(() => {
        this._onError(i);
      }, 0);
      return;
    }
    typeof document < "u" && (this._index = V.requestsCount++, V.requests[this._index] = this);
  }
  /**
   * Called upon error.
   *
   * @private
   */
  _onError(e) {
    this.emitReserved("error", e, this._xhr), this._cleanup(!0);
  }
  /**
   * Cleans up house.
   *
   * @private
   */
  _cleanup(e) {
    if (!(typeof this._xhr > "u" || this._xhr === null)) {
      if (this._xhr.onreadystatechange = Pr, e)
        try {
          this._xhr.abort();
        } catch {
        }
      typeof document < "u" && delete V.requests[this._index], this._xhr = null;
    }
  }
  /**
   * Called upon load.
   *
   * @private
   */
  _onLoad() {
    const e = this._xhr.responseText;
    e !== null && (this.emitReserved("data", e), this.emitReserved("success"), this._cleanup());
  }
  /**
   * Aborts the request.
   *
   * @package
   */
  abort() {
    this._cleanup();
  }
}
V.requestsCount = 0;
V.requests = {};
if (typeof document < "u") {
  if (typeof attachEvent == "function")
    attachEvent("onunload", Ct);
  else if (typeof addEventListener == "function") {
    const n = "onpagehide" in F ? "pagehide" : "unload";
    addEventListener(n, Ct, !1);
  }
}
function Ct() {
  for (let n in V.requests)
    V.requests.hasOwnProperty(n) && V.requests[n].abort();
}
const jr = function() {
  const n = Ft({
    xdomain: !1
  });
  return n && n.responseType !== null;
}();
class Dr extends Lr {
  constructor(e) {
    super(e);
    const t = e && e.forceBase64;
    this.supportsBinary = jr && !t;
  }
  request(e = {}) {
    return Object.assign(e, { xd: this.xd }, this.opts), new V(Ft, this.uri(), e);
  }
}
function Ft(n) {
  const e = n.xdomain;
  try {
    if (typeof XMLHttpRequest < "u" && (!e || Nr))
      return new XMLHttpRequest();
  } catch {
  }
  if (!e)
    try {
      return new F[["Active"].concat("Object").join("X")]("Microsoft.XMLHTTP");
    } catch {
    }
}
const qt = typeof navigator < "u" && typeof navigator.product == "string" && navigator.product.toLowerCase() === "reactnative";
class Ir extends st {
  get name() {
    return "websocket";
  }
  doOpen() {
    const e = this.uri(), t = this.opts.protocols, r = qt ? {} : jt(this.opts, "agent", "perMessageDeflate", "pfx", "key", "passphrase", "cert", "ca", "ciphers", "rejectUnauthorized", "localAddress", "protocolVersion", "origin", "maxPayload", "family", "checkServerIdentity");
    this.opts.extraHeaders && (r.headers = this.opts.extraHeaders);
    try {
      this.ws = this.createSocket(e, t, r);
    } catch (i) {
      return this.emitReserved("error", i);
    }
    this.ws.binaryType = this.socket.binaryType, this.addEventListeners();
  }
  /**
   * Adds event listeners to the socket
   *
   * @private
   */
  addEventListeners() {
    this.ws.onopen = () => {
      this.opts.autoUnref && this.ws._socket.unref(), this.onOpen();
    }, this.ws.onclose = (e) => this.onClose({
      description: "websocket connection closed",
      context: e
    }), this.ws.onmessage = (e) => this.onData(e.data), this.ws.onerror = (e) => this.onError("websocket error", e);
  }
  write(e) {
    this.writable = !1;
    for (let t = 0; t < e.length; t++) {
      const r = e[t], i = t === e.length - 1;
      rt(r, this.supportsBinary, (a) => {
        try {
          this.doWrite(r, a);
        } catch {
        }
        i && Le(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    typeof this.ws < "u" && (this.ws.onerror = () => {
    }, this.ws.close(), this.ws = null);
  }
  /**
   * Generates uri for connection.
   *
   * @private
   */
  uri() {
    const e = this.opts.secure ? "wss" : "ws", t = this.query || {};
    return this.opts.timestampRequests && (t[this.opts.timestampParam] = Dt()), this.supportsBinary || (t.b64 = 1), this.createUri(e, t);
  }
}
const Je = F.WebSocket || F.MozWebSocket;
class Fr extends Ir {
  createSocket(e, t, r) {
    return qt ? new Je(e, t, r) : t ? new Je(e, t) : new Je(e);
  }
  doWrite(e, t) {
    this.ws.send(t);
  }
}
class qr extends st {
  get name() {
    return "webtransport";
  }
  doOpen() {
    try {
      this._transport = new WebTransport(this.createUri("https"), this.opts.transportOptions[this.name]);
    } catch (e) {
      return this.emitReserved("error", e);
    }
    this._transport.closed.then(() => {
      this.onClose();
    }).catch((e) => {
      this.onError("webtransport error", e);
    }), this._transport.ready.then(() => {
      this._transport.createBidirectionalStream().then((e) => {
        const t = br(Number.MAX_SAFE_INTEGER, this.socket.binaryType), r = e.readable.pipeThrough(t).getReader(), i = vr();
        i.readable.pipeTo(e.writable), this._writer = i.writable.getWriter();
        const a = () => {
          r.read().then(({ done: h, value: l }) => {
            h || (this.onPacket(l), a());
          }).catch((h) => {
          });
        };
        a();
        const u = { type: "open" };
        this.query.sid && (u.data = `{"sid":"${this.query.sid}"}`), this._writer.write(u).then(() => this.onOpen());
      });
    });
  }
  write(e) {
    this.writable = !1;
    for (let t = 0; t < e.length; t++) {
      const r = e[t], i = t === e.length - 1;
      this._writer.write(r).then(() => {
        i && Le(() => {
          this.writable = !0, this.emitReserved("drain");
        }, this.setTimeoutFn);
      });
    }
  }
  doClose() {
    var e;
    (e = this._transport) === null || e === void 0 || e.close();
  }
}
const Mr = {
  websocket: Fr,
  webtransport: qr,
  polling: Dr
}, Ur = /^(?:(?![^:@\/?#]+:[^:@\/]*@)(http|https|ws|wss):\/\/)?((?:(([^:@\/?#]*)(?::([^:@\/?#]*))?)?@)?((?:[a-f0-9]{0,4}:){2,7}[a-f0-9]{0,4}|[^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, Vr = [
  "source",
  "protocol",
  "authority",
  "userInfo",
  "user",
  "password",
  "host",
  "port",
  "relative",
  "path",
  "directory",
  "file",
  "query",
  "anchor"
];
function Ge(n) {
  if (n.length > 8e3)
    throw "URI too long";
  const e = n, t = n.indexOf("["), r = n.indexOf("]");
  t != -1 && r != -1 && (n = n.substring(0, t) + n.substring(t, r).replace(/:/g, ";") + n.substring(r, n.length));
  let i = Ur.exec(n || ""), a = {}, u = 14;
  for (; u--; )
    a[Vr[u]] = i[u] || "";
  return t != -1 && r != -1 && (a.source = e, a.host = a.host.substring(1, a.host.length - 1).replace(/;/g, ":"), a.authority = a.authority.replace("[", "").replace("]", "").replace(/;/g, ":"), a.ipv6uri = !0), a.pathNames = $r(a, a.path), a.queryKey = Wr(a, a.query), a;
}
function $r(n, e) {
  const t = /\/{2,9}/g, r = e.replace(t, "/").split("/");
  return (e.slice(0, 1) == "/" || e.length === 0) && r.splice(0, 1), e.slice(-1) == "/" && r.splice(r.length - 1, 1), r;
}
function Wr(n, e) {
  const t = {};
  return e.replace(/(?:^|&)([^&=]*)=?([^&]*)/g, function(r, i, a) {
    i && (t[i] = a);
  }), t;
}
const Qe = typeof addEventListener == "function" && typeof removeEventListener == "function", Be = [];
Qe && addEventListener("offline", () => {
  Be.forEach((n) => n());
}, !1);
class K extends O {
  /**
   * Socket constructor.
   *
   * @param {String|Object} uri - uri or options
   * @param {Object} opts - options
   */
  constructor(e, t) {
    if (super(), this.binaryType = Er, this.writeBuffer = [], this._prevBufferLen = 0, this._pingInterval = -1, this._pingTimeout = -1, this._maxPayload = -1, this._pingTimeoutTime = 1 / 0, e && typeof e == "object" && (t = e, e = null), e) {
      const r = Ge(e);
      t.hostname = r.host, t.secure = r.protocol === "https" || r.protocol === "wss", t.port = r.port, r.query && (t.query = r.query);
    } else t.host && (t.hostname = Ge(t.host).host);
    je(this, t), this.secure = t.secure != null ? t.secure : typeof location < "u" && location.protocol === "https:", t.hostname && !t.port && (t.port = this.secure ? "443" : "80"), this.hostname = t.hostname || (typeof location < "u" ? location.hostname : "localhost"), this.port = t.port || (typeof location < "u" && location.port ? location.port : this.secure ? "443" : "80"), this.transports = [], this._transportsByName = {}, t.transports.forEach((r) => {
      const i = r.prototype.name;
      this.transports.push(i), this._transportsByName[i] = r;
    }), this.opts = Object.assign({
      path: "/engine.io",
      agent: !1,
      withCredentials: !1,
      upgrade: !0,
      timestampParam: "t",
      rememberUpgrade: !1,
      addTrailingSlash: !0,
      rejectUnauthorized: !0,
      perMessageDeflate: {
        threshold: 1024
      },
      transportOptions: {},
      closeOnBeforeunload: !1
    }, t), this.opts.path = this.opts.path.replace(/\/$/, "") + (this.opts.addTrailingSlash ? "/" : ""), typeof this.opts.query == "string" && (this.opts.query = xr(this.opts.query)), Qe && (this.opts.closeOnBeforeunload && (this._beforeunloadEventListener = () => {
      this.transport && (this.transport.removeAllListeners(), this.transport.close());
    }, addEventListener("beforeunload", this._beforeunloadEventListener, !1)), this.hostname !== "localhost" && (this._offlineEventListener = () => {
      this._onClose("transport close", {
        description: "network connection lost"
      });
    }, Be.push(this._offlineEventListener))), this.opts.withCredentials && (this._cookieJar = void 0), this._open();
  }
  /**
   * Creates transport of the given type.
   *
   * @param {String} name - transport name
   * @return {Transport}
   * @private
   */
  createTransport(e) {
    const t = Object.assign({}, this.opts.query);
    t.EIO = Lt, t.transport = e, this.id && (t.sid = this.id);
    const r = Object.assign({}, this.opts, {
      query: t,
      socket: this,
      hostname: this.hostname,
      secure: this.secure,
      port: this.port
    }, this.opts.transportOptions[e]);
    return new this._transportsByName[e](r);
  }
  /**
   * Initializes transport to use and starts probe.
   *
   * @private
   */
  _open() {
    if (this.transports.length === 0) {
      this.setTimeoutFn(() => {
        this.emitReserved("error", "No transports available");
      }, 0);
      return;
    }
    const e = this.opts.rememberUpgrade && K.priorWebsocketSuccess && this.transports.indexOf("websocket") !== -1 ? "websocket" : this.transports[0];
    this.readyState = "opening";
    const t = this.createTransport(e);
    t.open(), this.setTransport(t);
  }
  /**
   * Sets the current transport. Disables the existing one (if any).
   *
   * @private
   */
  setTransport(e) {
    this.transport && this.transport.removeAllListeners(), this.transport = e, e.on("drain", this._onDrain.bind(this)).on("packet", this._onPacket.bind(this)).on("error", this._onError.bind(this)).on("close", (t) => this._onClose("transport close", t));
  }
  /**
   * Called when connection is deemed open.
   *
   * @private
   */
  onOpen() {
    this.readyState = "open", K.priorWebsocketSuccess = this.transport.name === "websocket", this.emitReserved("open"), this.flush();
  }
  /**
   * Handles a packet.
   *
   * @private
   */
  _onPacket(e) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing")
      switch (this.emitReserved("packet", e), this.emitReserved("heartbeat"), e.type) {
        case "open":
          this.onHandshake(JSON.parse(e.data));
          break;
        case "ping":
          this._sendPacket("pong"), this.emitReserved("ping"), this.emitReserved("pong"), this._resetPingTimeout();
          break;
        case "error":
          const t = new Error("server error");
          t.code = e.data, this._onError(t);
          break;
        case "message":
          this.emitReserved("data", e.data), this.emitReserved("message", e.data);
          break;
      }
  }
  /**
   * Called upon handshake completion.
   *
   * @param {Object} data - handshake obj
   * @private
   */
  onHandshake(e) {
    this.emitReserved("handshake", e), this.id = e.sid, this.transport.query.sid = e.sid, this._pingInterval = e.pingInterval, this._pingTimeout = e.pingTimeout, this._maxPayload = e.maxPayload, this.onOpen(), this.readyState !== "closed" && this._resetPingTimeout();
  }
  /**
   * Sets and resets ping timeout timer based on server pings.
   *
   * @private
   */
  _resetPingTimeout() {
    this.clearTimeoutFn(this._pingTimeoutTimer);
    const e = this._pingInterval + this._pingTimeout;
    this._pingTimeoutTime = Date.now() + e, this._pingTimeoutTimer = this.setTimeoutFn(() => {
      this._onClose("ping timeout");
    }, e), this.opts.autoUnref && this._pingTimeoutTimer.unref();
  }
  /**
   * Called on `drain` event
   *
   * @private
   */
  _onDrain() {
    this.writeBuffer.splice(0, this._prevBufferLen), this._prevBufferLen = 0, this.writeBuffer.length === 0 ? this.emitReserved("drain") : this.flush();
  }
  /**
   * Flush write buffers.
   *
   * @private
   */
  flush() {
    if (this.readyState !== "closed" && this.transport.writable && !this.upgrading && this.writeBuffer.length) {
      const e = this._getWritablePackets();
      this.transport.send(e), this._prevBufferLen = e.length, this.emitReserved("flush");
    }
  }
  /**
   * Ensure the encoded size of the writeBuffer is below the maxPayload value sent by the server (only for HTTP
   * long-polling)
   *
   * @private
   */
  _getWritablePackets() {
    if (!(this._maxPayload && this.transport.name === "polling" && this.writeBuffer.length > 1))
      return this.writeBuffer;
    let t = 1;
    for (let r = 0; r < this.writeBuffer.length; r++) {
      const i = this.writeBuffer[r].data;
      if (i && (t += Cr(i)), r > 0 && t > this._maxPayload)
        return this.writeBuffer.slice(0, r);
      t += 2;
    }
    return this.writeBuffer;
  }
  /**
   * Checks whether the heartbeat timer has expired but the socket has not yet been notified.
   *
   * Note: this method is private for now because it does not really fit the WebSocket API, but if we put it in the
   * `write()` method then the message would not be buffered by the Socket.IO client.
   *
   * @return {boolean}
   * @private
   */
  /* private */
  _hasPingExpired() {
    if (!this._pingTimeoutTime)
      return !0;
    const e = Date.now() > this._pingTimeoutTime;
    return e && (this._pingTimeoutTime = 0, Le(() => {
      this._onClose("ping timeout");
    }, this.setTimeoutFn)), e;
  }
  /**
   * Sends a message.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  write(e, t, r) {
    return this._sendPacket("message", e, t, r), this;
  }
  /**
   * Sends a message. Alias of {@link Socket#write}.
   *
   * @param {String} msg - message.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @return {Socket} for chaining.
   */
  send(e, t, r) {
    return this._sendPacket("message", e, t, r), this;
  }
  /**
   * Sends a packet.
   *
   * @param {String} type: packet type.
   * @param {String} data.
   * @param {Object} options.
   * @param {Function} fn - callback function.
   * @private
   */
  _sendPacket(e, t, r, i) {
    if (typeof t == "function" && (i = t, t = void 0), typeof r == "function" && (i = r, r = null), this.readyState === "closing" || this.readyState === "closed")
      return;
    r = r || {}, r.compress = r.compress !== !1;
    const a = {
      type: e,
      data: t,
      options: r
    };
    this.emitReserved("packetCreate", a), this.writeBuffer.push(a), i && this.once("flush", i), this.flush();
  }
  /**
   * Closes the connection.
   */
  close() {
    const e = () => {
      this._onClose("forced close"), this.transport.close();
    }, t = () => {
      this.off("upgrade", t), this.off("upgradeError", t), e();
    }, r = () => {
      this.once("upgrade", t), this.once("upgradeError", t);
    };
    return (this.readyState === "opening" || this.readyState === "open") && (this.readyState = "closing", this.writeBuffer.length ? this.once("drain", () => {
      this.upgrading ? r() : e();
    }) : this.upgrading ? r() : e()), this;
  }
  /**
   * Called upon transport error
   *
   * @private
   */
  _onError(e) {
    if (K.priorWebsocketSuccess = !1, this.opts.tryAllTransports && this.transports.length > 1 && this.readyState === "opening")
      return this.transports.shift(), this._open();
    this.emitReserved("error", e), this._onClose("transport error", e);
  }
  /**
   * Called upon transport close.
   *
   * @private
   */
  _onClose(e, t) {
    if (this.readyState === "opening" || this.readyState === "open" || this.readyState === "closing") {
      if (this.clearTimeoutFn(this._pingTimeoutTimer), this.transport.removeAllListeners("close"), this.transport.close(), this.transport.removeAllListeners(), Qe && (this._beforeunloadEventListener && removeEventListener("beforeunload", this._beforeunloadEventListener, !1), this._offlineEventListener)) {
        const r = Be.indexOf(this._offlineEventListener);
        r !== -1 && Be.splice(r, 1);
      }
      this.readyState = "closed", this.id = null, this.emitReserved("close", e, t), this.writeBuffer = [], this._prevBufferLen = 0;
    }
  }
}
K.protocol = Lt;
class Yr extends K {
  constructor() {
    super(...arguments), this._upgrades = [];
  }
  onOpen() {
    if (super.onOpen(), this.readyState === "open" && this.opts.upgrade)
      for (let e = 0; e < this._upgrades.length; e++)
        this._probe(this._upgrades[e]);
  }
  /**
   * Probes a transport.
   *
   * @param {String} name - transport name
   * @private
   */
  _probe(e) {
    let t = this.createTransport(e), r = !1;
    K.priorWebsocketSuccess = !1;
    const i = () => {
      r || (t.send([{ type: "ping", data: "probe" }]), t.once("packet", (k) => {
        if (!r)
          if (k.type === "pong" && k.data === "probe") {
            if (this.upgrading = !0, this.emitReserved("upgrading", t), !t)
              return;
            K.priorWebsocketSuccess = t.name === "websocket", this.transport.pause(() => {
              r || this.readyState !== "closed" && (v(), this.setTransport(t), t.send([{ type: "upgrade" }]), this.emitReserved("upgrade", t), t = null, this.upgrading = !1, this.flush());
            });
          } else {
            const C = new Error("probe error");
            C.transport = t.name, this.emitReserved("upgradeError", C);
          }
      }));
    };
    function a() {
      r || (r = !0, v(), t.close(), t = null);
    }
    const u = (k) => {
      const C = new Error("probe error: " + k);
      C.transport = t.name, a(), this.emitReserved("upgradeError", C);
    };
    function h() {
      u("transport closed");
    }
    function l() {
      u("socket closed");
    }
    function x(k) {
      t && k.name !== t.name && a();
    }
    const v = () => {
      t.removeListener("open", i), t.removeListener("error", u), t.removeListener("close", h), this.off("close", l), this.off("upgrading", x);
    };
    t.once("open", i), t.once("error", u), t.once("close", h), this.once("close", l), this.once("upgrading", x), this._upgrades.indexOf("webtransport") !== -1 && e !== "webtransport" ? this.setTimeoutFn(() => {
      r || t.open();
    }, 200) : t.open();
  }
  onHandshake(e) {
    this._upgrades = this._filterUpgrades(e.upgrades), super.onHandshake(e);
  }
  /**
   * Filters upgrades, returning only those matching client transports.
   *
   * @param {Array} upgrades - server upgrades
   * @private
   */
  _filterUpgrades(e) {
    const t = [];
    for (let r = 0; r < e.length; r++)
      ~this.transports.indexOf(e[r]) && t.push(e[r]);
    return t;
  }
}
let Hr = class extends Yr {
  constructor(e, t = {}) {
    const r = typeof e == "object" ? e : t;
    (!r.transports || r.transports && typeof r.transports[0] == "string") && (r.transports = (r.transports || ["polling", "websocket", "webtransport"]).map((i) => Mr[i]).filter((i) => !!i)), super(e, r);
  }
};
function Kr(n, e = "", t) {
  let r = n;
  t = t || typeof location < "u" && location, n == null && (n = t.protocol + "//" + t.host), typeof n == "string" && (n.charAt(0) === "/" && (n.charAt(1) === "/" ? n = t.protocol + n : n = t.host + n), /^(https?|wss?):\/\//.test(n) || (typeof t < "u" ? n = t.protocol + "//" + n : n = "https://" + n), r = Ge(n)), r.port || (/^(http|ws)$/.test(r.protocol) ? r.port = "80" : /^(http|ws)s$/.test(r.protocol) && (r.port = "443")), r.path = r.path || "/";
  const a = r.host.indexOf(":") !== -1 ? "[" + r.host + "]" : r.host;
  return r.id = r.protocol + "://" + a + ":" + r.port + e, r.href = r.protocol + "://" + a + (t && t.port === r.port ? "" : ":" + r.port), r;
}
const Jr = typeof ArrayBuffer == "function", zr = (n) => typeof ArrayBuffer.isView == "function" ? ArrayBuffer.isView(n) : n.buffer instanceof ArrayBuffer, Mt = Object.prototype.toString, Xr = typeof Blob == "function" || typeof Blob < "u" && Mt.call(Blob) === "[object BlobConstructor]", Gr = typeof File == "function" || typeof File < "u" && Mt.call(File) === "[object FileConstructor]";
function it(n) {
  return Jr && (n instanceof ArrayBuffer || zr(n)) || Xr && n instanceof Blob || Gr && n instanceof File;
}
function Ne(n, e) {
  if (!n || typeof n != "object")
    return !1;
  if (Array.isArray(n)) {
    for (let t = 0, r = n.length; t < r; t++)
      if (Ne(n[t]))
        return !0;
    return !1;
  }
  if (it(n))
    return !0;
  if (n.toJSON && typeof n.toJSON == "function" && arguments.length === 1)
    return Ne(n.toJSON(), !0);
  for (const t in n)
    if (Object.prototype.hasOwnProperty.call(n, t) && Ne(n[t]))
      return !0;
  return !1;
}
function Qr(n) {
  const e = [], t = n.data, r = n;
  return r.data = Ze(t, e), r.attachments = e.length, { packet: r, buffers: e };
}
function Ze(n, e) {
  if (!n)
    return n;
  if (it(n)) {
    const t = { _placeholder: !0, num: e.length };
    return e.push(n), t;
  } else if (Array.isArray(n)) {
    const t = new Array(n.length);
    for (let r = 0; r < n.length; r++)
      t[r] = Ze(n[r], e);
    return t;
  } else if (typeof n == "object" && !(n instanceof Date)) {
    const t = {};
    for (const r in n)
      Object.prototype.hasOwnProperty.call(n, r) && (t[r] = Ze(n[r], e));
    return t;
  }
  return n;
}
function Zr(n, e) {
  return n.data = et(n.data, e), delete n.attachments, n;
}
function et(n, e) {
  if (!n)
    return n;
  if (n && n._placeholder === !0) {
    if (typeof n.num == "number" && n.num >= 0 && n.num < e.length)
      return e[n.num];
    throw new Error("illegal attachments");
  } else if (Array.isArray(n))
    for (let t = 0; t < n.length; t++)
      n[t] = et(n[t], e);
  else if (typeof n == "object")
    for (const t in n)
      Object.prototype.hasOwnProperty.call(n, t) && (n[t] = et(n[t], e));
  return n;
}
const en = [
  "connect",
  "connect_error",
  "disconnect",
  "disconnecting",
  "newListener",
  "removeListener"
  // used by the Node.js EventEmitter
], tn = 5;
var y;
(function(n) {
  n[n.CONNECT = 0] = "CONNECT", n[n.DISCONNECT = 1] = "DISCONNECT", n[n.EVENT = 2] = "EVENT", n[n.ACK = 3] = "ACK", n[n.CONNECT_ERROR = 4] = "CONNECT_ERROR", n[n.BINARY_EVENT = 5] = "BINARY_EVENT", n[n.BINARY_ACK = 6] = "BINARY_ACK";
})(y || (y = {}));
class rn {
  /**
   * Encoder constructor
   *
   * @param {function} replacer - custom replacer to pass down to JSON.parse
   */
  constructor(e) {
    this.replacer = e;
  }
  /**
   * Encode a packet as a single string if non-binary, or as a
   * buffer sequence, depending on packet type.
   *
   * @param {Object} obj - packet object
   */
  encode(e) {
    return (e.type === y.EVENT || e.type === y.ACK) && Ne(e) ? this.encodeAsBinary({
      type: e.type === y.EVENT ? y.BINARY_EVENT : y.BINARY_ACK,
      nsp: e.nsp,
      data: e.data,
      id: e.id
    }) : [this.encodeAsString(e)];
  }
  /**
   * Encode packet as string.
   */
  encodeAsString(e) {
    let t = "" + e.type;
    return (e.type === y.BINARY_EVENT || e.type === y.BINARY_ACK) && (t += e.attachments + "-"), e.nsp && e.nsp !== "/" && (t += e.nsp + ","), e.id != null && (t += e.id), e.data != null && (t += JSON.stringify(e.data, this.replacer)), t;
  }
  /**
   * Encode packet as 'buffer sequence' by removing blobs, and
   * deconstructing packet into object with placeholders and
   * a list of buffers.
   */
  encodeAsBinary(e) {
    const t = Qr(e), r = this.encodeAsString(t.packet), i = t.buffers;
    return i.unshift(r), i;
  }
}
function St(n) {
  return Object.prototype.toString.call(n) === "[object Object]";
}
class ot extends O {
  /**
   * Decoder constructor
   *
   * @param {function} reviver - custom reviver to pass down to JSON.stringify
   */
  constructor(e) {
    super(), this.reviver = e;
  }
  /**
   * Decodes an encoded packet string into packet JSON.
   *
   * @param {String} obj - encoded packet
   */
  add(e) {
    let t;
    if (typeof e == "string") {
      if (this.reconstructor)
        throw new Error("got plaintext data when reconstructing a packet");
      t = this.decodeString(e);
      const r = t.type === y.BINARY_EVENT;
      r || t.type === y.BINARY_ACK ? (t.type = r ? y.EVENT : y.ACK, this.reconstructor = new nn(t), t.attachments === 0 && super.emitReserved("decoded", t)) : super.emitReserved("decoded", t);
    } else if (it(e) || e.base64)
      if (this.reconstructor)
        t = this.reconstructor.takeBinaryData(e), t && (this.reconstructor = null, super.emitReserved("decoded", t));
      else
        throw new Error("got binary data when not reconstructing a packet");
    else
      throw new Error("Unknown type: " + e);
  }
  /**
   * Decode a packet String (JSON data)
   *
   * @param {String} str
   * @return {Object} packet
   */
  decodeString(e) {
    let t = 0;
    const r = {
      type: Number(e.charAt(0))
    };
    if (y[r.type] === void 0)
      throw new Error("unknown packet type " + r.type);
    if (r.type === y.BINARY_EVENT || r.type === y.BINARY_ACK) {
      const a = t + 1;
      for (; e.charAt(++t) !== "-" && t != e.length; )
        ;
      const u = e.substring(a, t);
      if (u != Number(u) || e.charAt(t) !== "-")
        throw new Error("Illegal attachments");
      r.attachments = Number(u);
    }
    if (e.charAt(t + 1) === "/") {
      const a = t + 1;
      for (; ++t && !(e.charAt(t) === "," || t === e.length); )
        ;
      r.nsp = e.substring(a, t);
    } else
      r.nsp = "/";
    const i = e.charAt(t + 1);
    if (i !== "" && Number(i) == i) {
      const a = t + 1;
      for (; ++t; ) {
        const u = e.charAt(t);
        if (u == null || Number(u) != u) {
          --t;
          break;
        }
        if (t === e.length)
          break;
      }
      r.id = Number(e.substring(a, t + 1));
    }
    if (e.charAt(++t)) {
      const a = this.tryParse(e.substr(t));
      if (ot.isPayloadValid(r.type, a))
        r.data = a;
      else
        throw new Error("invalid payload");
    }
    return r;
  }
  tryParse(e) {
    try {
      return JSON.parse(e, this.reviver);
    } catch {
      return !1;
    }
  }
  static isPayloadValid(e, t) {
    switch (e) {
      case y.CONNECT:
        return St(t);
      case y.DISCONNECT:
        return t === void 0;
      case y.CONNECT_ERROR:
        return typeof t == "string" || St(t);
      case y.EVENT:
      case y.BINARY_EVENT:
        return Array.isArray(t) && (typeof t[0] == "number" || typeof t[0] == "string" && en.indexOf(t[0]) === -1);
      case y.ACK:
      case y.BINARY_ACK:
        return Array.isArray(t);
    }
  }
  /**
   * Deallocates a parser's resources
   */
  destroy() {
    this.reconstructor && (this.reconstructor.finishedReconstruction(), this.reconstructor = null);
  }
}
class nn {
  constructor(e) {
    this.packet = e, this.buffers = [], this.reconPack = e;
  }
  /**
   * Method to be called when binary data received from connection
   * after a BINARY_EVENT packet.
   *
   * @param {Buffer | ArrayBuffer} binData - the raw binary data received
   * @return {null | Object} returns null if more binary data is expected or
   *   a reconstructed packet object if all buffers have been received.
   */
  takeBinaryData(e) {
    if (this.buffers.push(e), this.buffers.length === this.reconPack.attachments) {
      const t = Zr(this.reconPack, this.buffers);
      return this.finishedReconstruction(), t;
    }
    return null;
  }
  /**
   * Cleans up binary packet reconstruction variables.
   */
  finishedReconstruction() {
    this.reconPack = null, this.buffers = [];
  }
}
const sn = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  Decoder: ot,
  Encoder: rn,
  get PacketType() {
    return y;
  },
  protocol: tn
}, Symbol.toStringTag, { value: "Module" }));
function U(n, e, t) {
  return n.on(e, t), function() {
    n.off(e, t);
  };
}
const on = Object.freeze({
  connect: 1,
  connect_error: 1,
  disconnect: 1,
  disconnecting: 1,
  // EventEmitter reserved events: https://nodejs.org/api/events.html#events_event_newlistener
  newListener: 1,
  removeListener: 1
});
class Ut extends O {
  /**
   * `Socket` constructor.
   */
  constructor(e, t, r) {
    super(), this.connected = !1, this.recovered = !1, this.receiveBuffer = [], this.sendBuffer = [], this._queue = [], this._queueSeq = 0, this.ids = 0, this.acks = {}, this.flags = {}, this.io = e, this.nsp = t, r && r.auth && (this.auth = r.auth), this._opts = Object.assign({}, r), this.io._autoConnect && this.open();
  }
  /**
   * Whether the socket is currently disconnected
   *
   * @example
   * const socket = io();
   *
   * socket.on("connect", () => {
   *   console.log(socket.disconnected); // false
   * });
   *
   * socket.on("disconnect", () => {
   *   console.log(socket.disconnected); // true
   * });
   */
  get disconnected() {
    return !this.connected;
  }
  /**
   * Subscribe to open, close and packet events
   *
   * @private
   */
  subEvents() {
    if (this.subs)
      return;
    const e = this.io;
    this.subs = [
      U(e, "open", this.onopen.bind(this)),
      U(e, "packet", this.onpacket.bind(this)),
      U(e, "error", this.onerror.bind(this)),
      U(e, "close", this.onclose.bind(this))
    ];
  }
  /**
   * Whether the Socket will try to reconnect when its Manager connects or reconnects.
   *
   * @example
   * const socket = io();
   *
   * console.log(socket.active); // true
   *
   * socket.on("disconnect", (reason) => {
   *   if (reason === "io server disconnect") {
   *     // the disconnection was initiated by the server, you need to manually reconnect
   *     console.log(socket.active); // false
   *   }
   *   // else the socket will automatically try to reconnect
   *   console.log(socket.active); // true
   * });
   */
  get active() {
    return !!this.subs;
  }
  /**
   * "Opens" the socket.
   *
   * @example
   * const socket = io({
   *   autoConnect: false
   * });
   *
   * socket.connect();
   */
  connect() {
    return this.connected ? this : (this.subEvents(), this.io._reconnecting || this.io.open(), this.io._readyState === "open" && this.onopen(), this);
  }
  /**
   * Alias for {@link connect()}.
   */
  open() {
    return this.connect();
  }
  /**
   * Sends a `message` event.
   *
   * This method mimics the WebSocket.send() method.
   *
   * @see https://developer.mozilla.org/en-US/docs/Web/API/WebSocket/send
   *
   * @example
   * socket.send("hello");
   *
   * // this is equivalent to
   * socket.emit("message", "hello");
   *
   * @return self
   */
  send(...e) {
    return e.unshift("message"), this.emit.apply(this, e), this;
  }
  /**
   * Override `emit`.
   * If the event is in `events`, it's emitted normally.
   *
   * @example
   * socket.emit("hello", "world");
   *
   * // all serializable datastructures are supported (no need to call JSON.stringify)
   * socket.emit("hello", 1, "2", { 3: ["4"], 5: Uint8Array.from([6]) });
   *
   * // with an acknowledgement from the server
   * socket.emit("hello", "world", (val) => {
   *   // ...
   * });
   *
   * @return self
   */
  emit(e, ...t) {
    var r, i, a;
    if (on.hasOwnProperty(e))
      throw new Error('"' + e.toString() + '" is a reserved event name');
    if (t.unshift(e), this._opts.retries && !this.flags.fromQueue && !this.flags.volatile)
      return this._addToQueue(t), this;
    const u = {
      type: y.EVENT,
      data: t
    };
    if (u.options = {}, u.options.compress = this.flags.compress !== !1, typeof t[t.length - 1] == "function") {
      const v = this.ids++, k = t.pop();
      this._registerAckCallback(v, k), u.id = v;
    }
    const h = (i = (r = this.io.engine) === null || r === void 0 ? void 0 : r.transport) === null || i === void 0 ? void 0 : i.writable, l = this.connected && !(!((a = this.io.engine) === null || a === void 0) && a._hasPingExpired());
    return this.flags.volatile && !h || (l ? (this.notifyOutgoingListeners(u), this.packet(u)) : this.sendBuffer.push(u)), this.flags = {}, this;
  }
  /**
   * @private
   */
  _registerAckCallback(e, t) {
    var r;
    const i = (r = this.flags.timeout) !== null && r !== void 0 ? r : this._opts.ackTimeout;
    if (i === void 0) {
      this.acks[e] = t;
      return;
    }
    const a = this.io.setTimeoutFn(() => {
      delete this.acks[e];
      for (let h = 0; h < this.sendBuffer.length; h++)
        this.sendBuffer[h].id === e && this.sendBuffer.splice(h, 1);
      t.call(this, new Error("operation has timed out"));
    }, i), u = (...h) => {
      this.io.clearTimeoutFn(a), t.apply(this, h);
    };
    u.withError = !0, this.acks[e] = u;
  }
  /**
   * Emits an event and waits for an acknowledgement
   *
   * @example
   * // without timeout
   * const response = await socket.emitWithAck("hello", "world");
   *
   * // with a specific timeout
   * try {
   *   const response = await socket.timeout(1000).emitWithAck("hello", "world");
   * } catch (err) {
   *   // the server did not acknowledge the event in the given delay
   * }
   *
   * @return a Promise that will be fulfilled when the server acknowledges the event
   */
  emitWithAck(e, ...t) {
    return new Promise((r, i) => {
      const a = (u, h) => u ? i(u) : r(h);
      a.withError = !0, t.push(a), this.emit(e, ...t);
    });
  }
  /**
   * Add the packet to the queue.
   * @param args
   * @private
   */
  _addToQueue(e) {
    let t;
    typeof e[e.length - 1] == "function" && (t = e.pop());
    const r = {
      id: this._queueSeq++,
      tryCount: 0,
      pending: !1,
      args: e,
      flags: Object.assign({ fromQueue: !0 }, this.flags)
    };
    e.push((i, ...a) => r !== this._queue[0] ? void 0 : (i !== null ? r.tryCount > this._opts.retries && (this._queue.shift(), t && t(i)) : (this._queue.shift(), t && t(null, ...a)), r.pending = !1, this._drainQueue())), this._queue.push(r), this._drainQueue();
  }
  /**
   * Send the first packet of the queue, and wait for an acknowledgement from the server.
   * @param force - whether to resend a packet that has not been acknowledged yet
   *
   * @private
   */
  _drainQueue(e = !1) {
    if (!this.connected || this._queue.length === 0)
      return;
    const t = this._queue[0];
    t.pending && !e || (t.pending = !0, t.tryCount++, this.flags = t.flags, this.emit.apply(this, t.args));
  }
  /**
   * Sends a packet.
   *
   * @param packet
   * @private
   */
  packet(e) {
    e.nsp = this.nsp, this.io._packet(e);
  }
  /**
   * Called upon engine `open`.
   *
   * @private
   */
  onopen() {
    typeof this.auth == "function" ? this.auth((e) => {
      this._sendConnectPacket(e);
    }) : this._sendConnectPacket(this.auth);
  }
  /**
   * Sends a CONNECT packet to initiate the Socket.IO session.
   *
   * @param data
   * @private
   */
  _sendConnectPacket(e) {
    this.packet({
      type: y.CONNECT,
      data: this._pid ? Object.assign({ pid: this._pid, offset: this._lastOffset }, e) : e
    });
  }
  /**
   * Called upon engine or manager `error`.
   *
   * @param err
   * @private
   */
  onerror(e) {
    this.connected || this.emitReserved("connect_error", e);
  }
  /**
   * Called upon engine `close`.
   *
   * @param reason
   * @param description
   * @private
   */
  onclose(e, t) {
    this.connected = !1, delete this.id, this.emitReserved("disconnect", e, t), this._clearAcks();
  }
  /**
   * Clears the acknowledgement handlers upon disconnection, since the client will never receive an acknowledgement from
   * the server.
   *
   * @private
   */
  _clearAcks() {
    Object.keys(this.acks).forEach((e) => {
      if (!this.sendBuffer.some((r) => String(r.id) === e)) {
        const r = this.acks[e];
        delete this.acks[e], r.withError && r.call(this, new Error("socket has been disconnected"));
      }
    });
  }
  /**
   * Called with socket packet.
   *
   * @param packet
   * @private
   */
  onpacket(e) {
    if (e.nsp === this.nsp)
      switch (e.type) {
        case y.CONNECT:
          e.data && e.data.sid ? this.onconnect(e.data.sid, e.data.pid) : this.emitReserved("connect_error", new Error("It seems you are trying to reach a Socket.IO server in v2.x with a v3.x client, but they are not compatible (more information here: https://socket.io/docs/v3/migrating-from-2-x-to-3-0/)"));
          break;
        case y.EVENT:
        case y.BINARY_EVENT:
          this.onevent(e);
          break;
        case y.ACK:
        case y.BINARY_ACK:
          this.onack(e);
          break;
        case y.DISCONNECT:
          this.ondisconnect();
          break;
        case y.CONNECT_ERROR:
          this.destroy();
          const r = new Error(e.data.message);
          r.data = e.data.data, this.emitReserved("connect_error", r);
          break;
      }
  }
  /**
   * Called upon a server event.
   *
   * @param packet
   * @private
   */
  onevent(e) {
    const t = e.data || [];
    e.id != null && t.push(this.ack(e.id)), this.connected ? this.emitEvent(t) : this.receiveBuffer.push(Object.freeze(t));
  }
  emitEvent(e) {
    if (this._anyListeners && this._anyListeners.length) {
      const t = this._anyListeners.slice();
      for (const r of t)
        r.apply(this, e);
    }
    super.emit.apply(this, e), this._pid && e.length && typeof e[e.length - 1] == "string" && (this._lastOffset = e[e.length - 1]);
  }
  /**
   * Produces an ack callback to emit with an event.
   *
   * @private
   */
  ack(e) {
    const t = this;
    let r = !1;
    return function(...i) {
      r || (r = !0, t.packet({
        type: y.ACK,
        id: e,
        data: i
      }));
    };
  }
  /**
   * Called upon a server acknowledgement.
   *
   * @param packet
   * @private
   */
  onack(e) {
    const t = this.acks[e.id];
    typeof t == "function" && (delete this.acks[e.id], t.withError && e.data.unshift(null), t.apply(this, e.data));
  }
  /**
   * Called upon server connect.
   *
   * @private
   */
  onconnect(e, t) {
    this.id = e, this.recovered = t && this._pid === t, this._pid = t, this.connected = !0, this.emitBuffered(), this.emitReserved("connect"), this._drainQueue(!0);
  }
  /**
   * Emit buffered events (received and emitted).
   *
   * @private
   */
  emitBuffered() {
    this.receiveBuffer.forEach((e) => this.emitEvent(e)), this.receiveBuffer = [], this.sendBuffer.forEach((e) => {
      this.notifyOutgoingListeners(e), this.packet(e);
    }), this.sendBuffer = [];
  }
  /**
   * Called upon server disconnect.
   *
   * @private
   */
  ondisconnect() {
    this.destroy(), this.onclose("io server disconnect");
  }
  /**
   * Called upon forced client/server side disconnections,
   * this method ensures the manager stops tracking us and
   * that reconnections don't get triggered for this.
   *
   * @private
   */
  destroy() {
    this.subs && (this.subs.forEach((e) => e()), this.subs = void 0), this.io._destroy(this);
  }
  /**
   * Disconnects the socket manually. In that case, the socket will not try to reconnect.
   *
   * If this is the last active Socket instance of the {@link Manager}, the low-level connection will be closed.
   *
   * @example
   * const socket = io();
   *
   * socket.on("disconnect", (reason) => {
   *   // console.log(reason); prints "io client disconnect"
   * });
   *
   * socket.disconnect();
   *
   * @return self
   */
  disconnect() {
    return this.connected && this.packet({ type: y.DISCONNECT }), this.destroy(), this.connected && this.onclose("io client disconnect"), this;
  }
  /**
   * Alias for {@link disconnect()}.
   *
   * @return self
   */
  close() {
    return this.disconnect();
  }
  /**
   * Sets the compress flag.
   *
   * @example
   * socket.compress(false).emit("hello");
   *
   * @param compress - if `true`, compresses the sending data
   * @return self
   */
  compress(e) {
    return this.flags.compress = e, this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the event message will be dropped when this socket is not
   * ready to send messages.
   *
   * @example
   * socket.volatile.emit("hello"); // the server may or may not receive it
   *
   * @returns self
   */
  get volatile() {
    return this.flags.volatile = !0, this;
  }
  /**
   * Sets a modifier for a subsequent event emission that the callback will be called with an error when the
   * given number of milliseconds have elapsed without an acknowledgement from the server:
   *
   * @example
   * socket.timeout(5000).emit("my-event", (err) => {
   *   if (err) {
   *     // the server did not acknowledge the event in the given delay
   *   }
   * });
   *
   * @returns self
   */
  timeout(e) {
    return this.flags.timeout = e, this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * @example
   * socket.onAny((event, ...args) => {
   *   console.log(`got ${event}`);
   * });
   *
   * @param listener
   */
  onAny(e) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.push(e), this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * @example
   * socket.prependAny((event, ...args) => {
   *   console.log(`got event ${event}`);
   * });
   *
   * @param listener
   */
  prependAny(e) {
    return this._anyListeners = this._anyListeners || [], this._anyListeners.unshift(e), this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`got event ${event}`);
   * }
   *
   * socket.onAny(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAny(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAny();
   *
   * @param listener
   */
  offAny(e) {
    if (!this._anyListeners)
      return this;
    if (e) {
      const t = this._anyListeners;
      for (let r = 0; r < t.length; r++)
        if (e === t[r])
          return t.splice(r, 1), this;
    } else
      this._anyListeners = [];
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAny() {
    return this._anyListeners || [];
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.onAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  onAnyOutgoing(e) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.push(e), this;
  }
  /**
   * Adds a listener that will be fired when any event is emitted. The event name is passed as the first argument to the
   * callback. The listener is added to the beginning of the listeners array.
   *
   * Note: acknowledgements sent to the server are not included.
   *
   * @example
   * socket.prependAnyOutgoing((event, ...args) => {
   *   console.log(`sent event ${event}`);
   * });
   *
   * @param listener
   */
  prependAnyOutgoing(e) {
    return this._anyOutgoingListeners = this._anyOutgoingListeners || [], this._anyOutgoingListeners.unshift(e), this;
  }
  /**
   * Removes the listener that will be fired when any event is emitted.
   *
   * @example
   * const catchAllListener = (event, ...args) => {
   *   console.log(`sent event ${event}`);
   * }
   *
   * socket.onAnyOutgoing(catchAllListener);
   *
   * // remove a specific listener
   * socket.offAnyOutgoing(catchAllListener);
   *
   * // or remove all listeners
   * socket.offAnyOutgoing();
   *
   * @param [listener] - the catch-all listener (optional)
   */
  offAnyOutgoing(e) {
    if (!this._anyOutgoingListeners)
      return this;
    if (e) {
      const t = this._anyOutgoingListeners;
      for (let r = 0; r < t.length; r++)
        if (e === t[r])
          return t.splice(r, 1), this;
    } else
      this._anyOutgoingListeners = [];
    return this;
  }
  /**
   * Returns an array of listeners that are listening for any event that is specified. This array can be manipulated,
   * e.g. to remove listeners.
   */
  listenersAnyOutgoing() {
    return this._anyOutgoingListeners || [];
  }
  /**
   * Notify the listeners for each packet sent
   *
   * @param packet
   *
   * @private
   */
  notifyOutgoingListeners(e) {
    if (this._anyOutgoingListeners && this._anyOutgoingListeners.length) {
      const t = this._anyOutgoingListeners.slice();
      for (const r of t)
        r.apply(this, e.data);
    }
  }
}
function ce(n) {
  n = n || {}, this.ms = n.min || 100, this.max = n.max || 1e4, this.factor = n.factor || 2, this.jitter = n.jitter > 0 && n.jitter <= 1 ? n.jitter : 0, this.attempts = 0;
}
ce.prototype.duration = function() {
  var n = this.ms * Math.pow(this.factor, this.attempts++);
  if (this.jitter) {
    var e = Math.random(), t = Math.floor(e * this.jitter * n);
    n = Math.floor(e * 10) & 1 ? n + t : n - t;
  }
  return Math.min(n, this.max) | 0;
};
ce.prototype.reset = function() {
  this.attempts = 0;
};
ce.prototype.setMin = function(n) {
  this.ms = n;
};
ce.prototype.setMax = function(n) {
  this.max = n;
};
ce.prototype.setJitter = function(n) {
  this.jitter = n;
};
class tt extends O {
  constructor(e, t) {
    var r;
    super(), this.nsps = {}, this.subs = [], e && typeof e == "object" && (t = e, e = void 0), t = t || {}, t.path = t.path || "/socket.io", this.opts = t, je(this, t), this.reconnection(t.reconnection !== !1), this.reconnectionAttempts(t.reconnectionAttempts || 1 / 0), this.reconnectionDelay(t.reconnectionDelay || 1e3), this.reconnectionDelayMax(t.reconnectionDelayMax || 5e3), this.randomizationFactor((r = t.randomizationFactor) !== null && r !== void 0 ? r : 0.5), this.backoff = new ce({
      min: this.reconnectionDelay(),
      max: this.reconnectionDelayMax(),
      jitter: this.randomizationFactor()
    }), this.timeout(t.timeout == null ? 2e4 : t.timeout), this._readyState = "closed", this.uri = e;
    const i = t.parser || sn;
    this.encoder = new i.Encoder(), this.decoder = new i.Decoder(), this._autoConnect = t.autoConnect !== !1, this._autoConnect && this.open();
  }
  reconnection(e) {
    return arguments.length ? (this._reconnection = !!e, e || (this.skipReconnect = !0), this) : this._reconnection;
  }
  reconnectionAttempts(e) {
    return e === void 0 ? this._reconnectionAttempts : (this._reconnectionAttempts = e, this);
  }
  reconnectionDelay(e) {
    var t;
    return e === void 0 ? this._reconnectionDelay : (this._reconnectionDelay = e, (t = this.backoff) === null || t === void 0 || t.setMin(e), this);
  }
  randomizationFactor(e) {
    var t;
    return e === void 0 ? this._randomizationFactor : (this._randomizationFactor = e, (t = this.backoff) === null || t === void 0 || t.setJitter(e), this);
  }
  reconnectionDelayMax(e) {
    var t;
    return e === void 0 ? this._reconnectionDelayMax : (this._reconnectionDelayMax = e, (t = this.backoff) === null || t === void 0 || t.setMax(e), this);
  }
  timeout(e) {
    return arguments.length ? (this._timeout = e, this) : this._timeout;
  }
  /**
   * Starts trying to reconnect if reconnection is enabled and we have not
   * started reconnecting yet
   *
   * @private
   */
  maybeReconnectOnOpen() {
    !this._reconnecting && this._reconnection && this.backoff.attempts === 0 && this.reconnect();
  }
  /**
   * Sets the current transport `socket`.
   *
   * @param {Function} fn - optional, callback
   * @return self
   * @public
   */
  open(e) {
    if (~this._readyState.indexOf("open"))
      return this;
    this.engine = new Hr(this.uri, this.opts);
    const t = this.engine, r = this;
    this._readyState = "opening", this.skipReconnect = !1;
    const i = U(t, "open", function() {
      r.onopen(), e && e();
    }), a = (h) => {
      this.cleanup(), this._readyState = "closed", this.emitReserved("error", h), e ? e(h) : this.maybeReconnectOnOpen();
    }, u = U(t, "error", a);
    if (this._timeout !== !1) {
      const h = this._timeout, l = this.setTimeoutFn(() => {
        i(), a(new Error("timeout")), t.close();
      }, h);
      this.opts.autoUnref && l.unref(), this.subs.push(() => {
        this.clearTimeoutFn(l);
      });
    }
    return this.subs.push(i), this.subs.push(u), this;
  }
  /**
   * Alias for open()
   *
   * @return self
   * @public
   */
  connect(e) {
    return this.open(e);
  }
  /**
   * Called upon transport open.
   *
   * @private
   */
  onopen() {
    this.cleanup(), this._readyState = "open", this.emitReserved("open");
    const e = this.engine;
    this.subs.push(
      U(e, "ping", this.onping.bind(this)),
      U(e, "data", this.ondata.bind(this)),
      U(e, "error", this.onerror.bind(this)),
      U(e, "close", this.onclose.bind(this)),
      // @ts-ignore
      U(this.decoder, "decoded", this.ondecoded.bind(this))
    );
  }
  /**
   * Called upon a ping.
   *
   * @private
   */
  onping() {
    this.emitReserved("ping");
  }
  /**
   * Called with data.
   *
   * @private
   */
  ondata(e) {
    try {
      this.decoder.add(e);
    } catch (t) {
      this.onclose("parse error", t);
    }
  }
  /**
   * Called when parser fully decodes a packet.
   *
   * @private
   */
  ondecoded(e) {
    Le(() => {
      this.emitReserved("packet", e);
    }, this.setTimeoutFn);
  }
  /**
   * Called upon socket error.
   *
   * @private
   */
  onerror(e) {
    this.emitReserved("error", e);
  }
  /**
   * Creates a new socket for the given `nsp`.
   *
   * @return {Socket}
   * @public
   */
  socket(e, t) {
    let r = this.nsps[e];
    return r ? this._autoConnect && !r.active && r.connect() : (r = new Ut(this, e, t), this.nsps[e] = r), r;
  }
  /**
   * Called upon a socket close.
   *
   * @param socket
   * @private
   */
  _destroy(e) {
    const t = Object.keys(this.nsps);
    for (const r of t)
      if (this.nsps[r].active)
        return;
    this._close();
  }
  /**
   * Writes a packet.
   *
   * @param packet
   * @private
   */
  _packet(e) {
    const t = this.encoder.encode(e);
    for (let r = 0; r < t.length; r++)
      this.engine.write(t[r], e.options);
  }
  /**
   * Clean up transport subscriptions and packet buffer.
   *
   * @private
   */
  cleanup() {
    this.subs.forEach((e) => e()), this.subs.length = 0, this.decoder.destroy();
  }
  /**
   * Close the current socket.
   *
   * @private
   */
  _close() {
    this.skipReconnect = !0, this._reconnecting = !1, this.onclose("forced close");
  }
  /**
   * Alias for close()
   *
   * @private
   */
  disconnect() {
    return this._close();
  }
  /**
   * Called when:
   *
   * - the low-level engine is closed
   * - the parser encountered a badly formatted packet
   * - all sockets are disconnected
   *
   * @private
   */
  onclose(e, t) {
    var r;
    this.cleanup(), (r = this.engine) === null || r === void 0 || r.close(), this.backoff.reset(), this._readyState = "closed", this.emitReserved("close", e, t), this._reconnection && !this.skipReconnect && this.reconnect();
  }
  /**
   * Attempt a reconnection.
   *
   * @private
   */
  reconnect() {
    if (this._reconnecting || this.skipReconnect)
      return this;
    const e = this;
    if (this.backoff.attempts >= this._reconnectionAttempts)
      this.backoff.reset(), this.emitReserved("reconnect_failed"), this._reconnecting = !1;
    else {
      const t = this.backoff.duration();
      this._reconnecting = !0;
      const r = this.setTimeoutFn(() => {
        e.skipReconnect || (this.emitReserved("reconnect_attempt", e.backoff.attempts), !e.skipReconnect && e.open((i) => {
          i ? (e._reconnecting = !1, e.reconnect(), this.emitReserved("reconnect_error", i)) : e.onreconnect();
        }));
      }, t);
      this.opts.autoUnref && r.unref(), this.subs.push(() => {
        this.clearTimeoutFn(r);
      });
    }
  }
  /**
   * Called upon successful reconnect.
   *
   * @private
   */
  onreconnect() {
    const e = this.backoff.attempts;
    this._reconnecting = !1, this.backoff.reset(), this.emitReserved("reconnect", e);
  }
}
const ye = {};
function Pe(n, e) {
  typeof n == "object" && (e = n, n = void 0), e = e || {};
  const t = Kr(n, e.path || "/socket.io"), r = t.source, i = t.id, a = t.path, u = ye[i] && a in ye[i].nsps, h = e.forceNew || e["force new connection"] || e.multiplex === !1 || u;
  let l;
  return h ? l = new tt(r, e) : (ye[i] || (ye[i] = new tt(r, e)), l = ye[i]), t.query && !e.query && (e.query = t.queryKey), l.socket(t.path, e);
}
Object.assign(Pe, {
  Manager: tt,
  Socket: Ut,
  io: Pe,
  connect: Pe
});
const B = {
  chatSupport: "Hỗ Trợ Chat",
  welcome: "Chào mừng! Chúng tôi có thể giúp gì cho bạn hôm nay?",
  typeMessage: "Nhập tin nhắn của bạn...",
  connecting: "Đang kết nối...",
  send: "Gửi",
  online: "Trực tuyến",
  reconnecting: "Đang kết nối lại...",
  connectionError: "Lỗi kết nối",
  retryConnection: "Thử lại kết nối",
  loadingMessages: "Đang tải thêm tin nhắn...",
  loadMoreMessages: "Tải thêm tin nhắn cũ",
  noMoreMessages: "Không còn tin nhắn cũ",
  statusSent: "Đã gửi",
  statusDelivered: "Đã nhận",
  statusRead: "Đã xem"
}, un = ({
  email: n,
  serverUrl: e = "http://localhost:3001",
  primaryColor: t = "#007bff",
  position: r = "bottom-right"
}) => {
  const [i, a] = j(!1), [u, h] = j([]), [l, x] = j(""), [v, k] = j(null), [C, Y] = j(!1), [J, W] = j(null), [ve, q] = j(!1), A = Se(null), ue = Se(null), M = Se(null), be = Se(0), De = 5, [we, Ie] = j(!0), [Q, Z] = j(!1), [le, ee] = j(!1), [D, L] = j(!0), [z, X] = j(0), [te, H] = j(0), re = lr(() => {
    M.current && M.current.disconnect();
    const f = Pe(e, {
      autoConnect: !0,
      reconnection: !0,
      reconnectionAttempts: De,
      reconnectionDelay: 1e3,
      timeout: 2e4
    });
    M.current = f, f.on("connect", () => {
      console.log("Connected to chat server"), Y(!0), W(null), q(!1), be.current = 0, h([]), k(null), X(0), L(!0), H(0), f.emit("join-user", { email: n });
    }), f.on("connect_error", (d) => {
      console.error("Connection error:", d), Y(!1), W("Failed to connect to chat server");
    }), f.on("disconnect", (d) => {
      console.log("Disconnected from chat server:", d), Y(!1), d === "io server disconnect" && W("Server disconnected");
    }), f.on("reconnect_attempt", (d) => {
      console.log(`Reconnection attempt ${d}`), q(!0), be.current = d;
    }), f.on("reconnect", (d) => {
      console.log(`Reconnected after ${d} attempts`), q(!1), W(null);
    }), f.on("reconnect_failed", () => {
      console.error("Failed to reconnect after maximum attempts"), q(!1), W("Unable to reconnect to chat server");
    }), f.on("conversation-joined", (d) => {
      if (console.log("🔍 [WIDGET] Received conversation-joined:", {
        conversationId: d.conversationId,
        messageCount: d.messages.length,
        messages: d.messages.slice(0, 3).map((w) => `[${w.sender_type}] ${w.content.substring(0, 30)}...`)
      }), k(d.conversationId), h(d.messages), X(d.messages.length), L(d.messages.length === 5), !i) {
        const w = d.messages.filter(
          (R) => R.sender_type === "admin" && !R.read_at
        ).length;
        H(w);
      }
    }), f.on("message-received", (d) => {
      h((w) => [...w, d]), d.sender_type === "admin" && (i ? (f.emit("mark-message-read", { messageId: d.id }), Z(!0)) : H((w) => w + 1)), d.sender_type === "user" && Z(!0);
    }), f.on("message-read", (d) => {
      h((w) => w.map(
        (R) => R.id === d.messageId ? { ...R, read_at: d.readAt, read_status: { ...R.read_status, [d.readBy]: d.readAt } } : R
      ));
    }), f.on("conversation-read", (d) => {
      h((w) => w.map(
        (R) => R.sender_type === "admin" && d.readBy === "user" ? { ...R, read_at: d.readAt, read_status: { ...R.read_status, [d.readBy]: d.readAt } } : R
      ));
    }), f.on("error", (d) => {
      console.error("Chat error:", d.message), W(d.message);
    });
  }, [n, e, i]);
  bt(() => {
    h([]), k(null), X(0), L(!0), H(0), ee(!1);
    try {
      localStorage.removeItem("chat-widget-messages"), localStorage.removeItem("chat-widget-conversation"), sessionStorage.clear();
    } catch {
    }
    return re(), () => {
      M.current && M.current.disconnect(), h([]), k(null);
    };
  }, [re]), bt(() => {
    (we || Q) && (Ee(), Q && Z(!1));
  }, [u, we, Q]);
  const Ee = () => {
    var f;
    (f = A.current) == null || f.scrollIntoView({ behavior: "smooth" });
  }, Re = async () => {
    var f;
    if (!(!v || le || !D)) {
      ee(!0);
      try {
        const w = await (await fetch(
          `${e}/api/conversations/${v}/messages?offset=${z}&limit=10&direction=desc`
        )).json();
        w.messages && w.messages.length > 0 ? (h((R) => [...w.messages, ...R]), X((R) => R + w.messages.length), L(((f = w.pagination) == null ? void 0 : f.hasMore) || !1)) : L(!1);
      } catch (d) {
        console.error("Error loading more messages:", d);
      } finally {
        ee(!1);
      }
    }
  }, ke = () => {
    if (ue.current) {
      const { scrollTop: f, scrollHeight: d, clientHeight: w } = ue.current, R = d - f - w;
      Ie(R < 150);
    }
  }, he = () => {
    !l.trim() || !v || !M.current || (M.current.emit("user-message", {
      conversationId: v,
      content: l.trim(),
      email: n
    }), x(""));
  }, Fe = (f) => {
    f.key === "Enter" && !f.shiftKey && (f.preventDefault(), he());
  }, qe = (f) => new Date(f).toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Bangkok",
    hour12: !1
  }), fe = (f) => f.sender_type === "admin" ? null : f.read_at ? "read" : f.delivered_at ? "delivered" : "sent", de = ({ message: f }) => {
    const d = fe(f);
    if (!d) return null;
    const w = (ie) => {
      switch (ie) {
        case "sent":
          return B.statusSent;
        case "delivered":
          return B.statusDelivered;
        case "read":
          return B.statusRead;
        default:
          return "";
      }
    }, R = (ie) => {
      switch (ie) {
        case "sent":
          return /* @__PURE__ */ m.jsx("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ m.jsx("polyline", { points: "20,6 9,17 4,12" }) });
        case "delivered":
          return /* @__PURE__ */ m.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ m.jsx("polyline", { points: "20,6 9,17 4,12" }),
            /* @__PURE__ */ m.jsx("polyline", { points: "24,6 13,17 8,12", strokeOpacity: "0.6" })
          ] });
        case "read":
          return /* @__PURE__ */ m.jsxs("svg", { width: "12", height: "12", viewBox: "0 0 24 24", fill: "currentColor", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ m.jsx("polyline", { points: "20,6 9,17 4,12" }),
            /* @__PURE__ */ m.jsx("polyline", { points: "24,6 13,17 8,12" })
          ] });
        default:
          return null;
      }
    };
    return /* @__PURE__ */ m.jsx(
      "span",
      {
        className: `message-status ${d}`,
        title: w(d),
        children: R(d)
      }
    );
  }, ne = () => !D && u.length > 0 ? /* @__PURE__ */ m.jsx("div", { className: "no-more-messages", "data-testid": "no-more-messages", children: /* @__PURE__ */ m.jsx("p", { children: B.noMoreMessages }) }) : D ? /* @__PURE__ */ m.jsx("div", { className: "load-more-container", "data-testid": "load-more-container", children: /* @__PURE__ */ m.jsx(
    "button",
    {
      className: "load-more-button",
      onClick: Re,
      disabled: le,
      "data-testid": "load-more-button",
      children: le ? B.loadingMessages : B.loadMoreMessages
    }
  ) }) : null, pe = () => {
    const f = !i;
    a(f), f && (H(0), M.current && v && M.current.emit("mark-conversation-read", { conversationId: v }), setTimeout(() => {
      Z(!0);
    }, 100));
  }, se = () => {
    W(null), re();
  }, Me = () => ve ? B.reconnecting : J ? B.connectionError : C ? B.online : B.connecting, Te = r === "bottom-left" ? "chat-widget-left" : "chat-widget-right";
  return /* @__PURE__ */ m.jsxs("div", { className: `chat-widget ${Te}`, style: { "--primary-color": t }, children: [
    /* @__PURE__ */ m.jsxs(
      "button",
      {
        className: `chat-toggle-btn ${i ? "open" : ""}`,
        onClick: pe,
        style: { backgroundColor: t },
        "data-testid": "chat-toggle-button",
        children: [
          i ? "✕" : "💬",
          !C && /* @__PURE__ */ m.jsx("span", { className: `connection-indicator ${ve ? "reconnecting" : "offline"}` }),
          !i && te > 0 && /* @__PURE__ */ m.jsx("span", { className: "unread-badge", "data-testid": "unread-badge", children: te > 99 ? "99+" : te })
        ]
      }
    ),
    i && /* @__PURE__ */ m.jsxs("div", { className: "chat-window", "data-testid": "chat-window", children: [
      /* @__PURE__ */ m.jsxs("div", { className: "chat-header", style: { backgroundColor: t }, children: [
        /* @__PURE__ */ m.jsx("h3", { children: B.chatSupport }),
        /* @__PURE__ */ m.jsx("div", { className: `status ${C ? "online" : J ? "error" : "offline"}`, children: Me() })
      ] }),
      J && /* @__PURE__ */ m.jsxs("div", { className: "connection-error", "data-testid": "connection-error", children: [
        /* @__PURE__ */ m.jsx("p", { children: J }),
        /* @__PURE__ */ m.jsx("button", { onClick: se, className: "retry-button", children: B.retryConnection })
      ] }),
      /* @__PURE__ */ m.jsxs(
        "div",
        {
          className: "chat-messages",
          "data-testid": "chat-messages",
          ref: ue,
          onScroll: ke,
          children: [
            /* @__PURE__ */ m.jsx(ne, {}),
            u.length === 0 ? /* @__PURE__ */ m.jsx("div", { className: "welcome-message", children: /* @__PURE__ */ m.jsx("p", { children: B.welcome }) }) : u.map((f) => /* @__PURE__ */ m.jsxs(
              "div",
              {
                className: `message ${f.sender_type === "user" ? "user" : "admin"}`,
                "data-testid": `message-${f.sender_type}`,
                children: [
                  /* @__PURE__ */ m.jsx("div", { className: "message-content", children: f.content }),
                  /* @__PURE__ */ m.jsxs("div", { className: "message-time", children: [
                    qe(f.created_at),
                    /* @__PURE__ */ m.jsx(de, { message: f })
                  ] })
                ]
              },
              f.id
            )),
            /* @__PURE__ */ m.jsx("div", { ref: A })
          ]
        }
      ),
      /* @__PURE__ */ m.jsxs("div", { className: "chat-input", children: [
        /* @__PURE__ */ m.jsx(
          "textarea",
          {
            value: l,
            onChange: (f) => x(f.target.value),
            onKeyPress: Fe,
            placeholder: C ? B.typeMessage : B.connecting,
            rows: 1,
            disabled: !C,
            "data-testid": "message-input"
          }
        ),
        /* @__PURE__ */ m.jsx(
          "button",
          {
            onClick: he,
            disabled: !l.trim() || !C,
            style: { backgroundColor: t },
            "data-testid": "send-button",
            children: B.send
          }
        )
      ] })
    ] })
  ] });
};
export {
  un as ChatWidget
};
