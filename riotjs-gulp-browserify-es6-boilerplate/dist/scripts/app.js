(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
/* Riot v2.2.3, @license MIT, (c) 2015 Muut Inc. + contributors */

;(function(window, undefined) {
  'use strict'
  var riot = { version: 'v2.2.3', settings: {} },
      // counter to give a unique id to all the Tag instances
      __uid = 0

  // This globals 'const' helps code size reduction

  // for typeof == '' comparisons
  var T_STRING = 'string',
      T_OBJECT = 'object',
      T_UNDEF  = 'undefined',
      T_FUNCTION  = 'function',
      RESERVED_WORDS_BLACKLIST = ['update', 'root', 'mount', 'unmount', 'mixin', 'isMounted', 'isLoop', 'tags', 'parent', 'opts', 'trigger', 'on', 'off', 'one']

  // for IE8 and rest of the world
  /* istanbul ignore next */
  var isArray = Array.isArray || (function () {
    var _ts = Object.prototype.toString
    return function (v) { return _ts.call(v) === '[object Array]' }
  })()

  // Version# for IE 8-11, 0 for others
  var ieVersion = (function (win) {
    return (window && window.document || {}).documentMode | 0
  })()

riot.observable = function(el) {

  el = el || {}

  var callbacks = {},
      _id = 0

  el.on = function(events, fn) {
    if (isFunction(fn)) {
      if (typeof fn.id === T_UNDEF) fn._id = _id++

      events.replace(/\S+/g, function(name, pos) {
        (callbacks[name] = callbacks[name] || []).push(fn)
        fn.typed = pos > 0
      })
    }
    return el
  }

  el.off = function(events, fn) {
    if (events == '*') callbacks = {}
    else {
      events.replace(/\S+/g, function(name) {
        if (fn) {
          var arr = callbacks[name]
          for (var i = 0, cb; (cb = arr && arr[i]); ++i) {
            if (cb._id == fn._id) arr.splice(i--, 1)
          }
        } else {
          callbacks[name] = []
        }
      })
    }
    return el
  }

  // only single event supported
  el.one = function(name, fn) {
    function on() {
      el.off(name, on)
      fn.apply(el, arguments)
    }
    return el.on(name, on)
  }

  el.trigger = function(name) {
    var args = [].slice.call(arguments, 1),
        fns = callbacks[name] || []

    for (var i = 0, fn; (fn = fns[i]); ++i) {
      if (!fn.busy) {
        fn.busy = 1
        fn.apply(el, fn.typed ? [name].concat(args) : args)
        if (fns[i] !== fn) { i-- }
        fn.busy = 0
      }
    }

    if (callbacks.all && name != 'all') {
      el.trigger.apply(el, ['all', name].concat(args))
    }

    return el
  }

  return el

}
riot.mixin = (function() {
  var mixins = {}

  return function(name, mixin) {
    if (!mixin) return mixins[name]
    mixins[name] = mixin
  }

})()

;(function(riot, evt, win) {

  // browsers only
  if (!win) return

  var loc = win.location,
      fns = riot.observable(),
      started = false,
      current

  function hash() {
    return loc.href.split('#')[1] || ''
  }

  function parser(path) {
    return path.split('/')
  }

  function emit(path) {
    if (path.type) path = hash()

    if (path != current) {
      fns.trigger.apply(null, ['H'].concat(parser(path)))
      current = path
    }
  }

  var r = riot.route = function(arg) {
    // string
    if (arg[0]) {
      loc.hash = arg
      emit(arg)

    // function
    } else {
      fns.on('H', arg)
    }
  }

  r.exec = function(fn) {
    fn.apply(null, parser(hash()))
  }

  r.parser = function(fn) {
    parser = fn
  }

  r.stop = function () {
    if (!started) return
    win.removeEventListener ? win.removeEventListener(evt, emit, false) : win.detachEvent('on' + evt, emit)
    fns.off('*')
    started = false
  }

  r.start = function () {
    if (started) return
    win.addEventListener ? win.addEventListener(evt, emit, false) : win.attachEvent('on' + evt, emit)
    started = true
  }

  // autostart the router
  r.start()

})(riot, 'hashchange', window)
/*

//// How it works?


Three ways:

1. Expressions: tmpl('{ value }', data).
   Returns the result of evaluated expression as a raw object.

2. Templates: tmpl('Hi { name } { surname }', data).
   Returns a string with evaluated expressions.

3. Filters: tmpl('{ show: !done, highlight: active }', data).
   Returns a space separated list of trueish keys (mainly
   used for setting html classes), e.g. "show highlight".


// Template examples

tmpl('{ title || "Untitled" }', data)
tmpl('Results are { results ? "ready" : "loading" }', data)
tmpl('Today is { new Date() }', data)
tmpl('{ message.length > 140 && "Message is too long" }', data)
tmpl('This item got { Math.round(rating) } stars', data)
tmpl('<h1>{ title }</h1>{ body }', data)


// Falsy expressions in templates

In templates (as opposed to single expressions) all falsy values
except zero (undefined/null/false) will default to empty string:

tmpl('{ undefined } - { false } - { null } - { 0 }', {})
// will return: " - - - 0"

*/


var brackets = (function(orig) {

  var cachedBrackets,
      r,
      b,
      re = /[{}]/g

  return function(x) {

    // make sure we use the current setting
    var s = riot.settings.brackets || orig

    // recreate cached vars if needed
    if (cachedBrackets !== s) {
      cachedBrackets = s
      b = s.split(' ')
      r = b.map(function (e) { return e.replace(/(?=.)/g, '\\') })
    }

    // if regexp given, rewrite it with current brackets (only if differ from default)
    return x instanceof RegExp ? (
        s === orig ? x :
        new RegExp(x.source.replace(re, function(b) { return r[~~(b === '}')] }), x.global ? 'g' : '')
      ) :
      // else, get specific bracket
      b[x]
  }
})('{ }')


var tmpl = (function() {

  var cache = {},
      reVars = /(['"\/]).*?[^\\]\1|\.\w*|\w*:|\b(?:(?:new|typeof|in|instanceof) |(?:this|true|false|null|undefined)\b|function *\()|([a-z_$]\w*)/gi
              // [ 1               ][ 2  ][ 3 ][ 4                                                                                  ][ 5       ]
              // find variable names:
              // 1. skip quoted strings and regexps: "a b", 'a b', 'a \'b\'', /a b/
              // 2. skip object properties: .name
              // 3. skip object literals: name:
              // 4. skip javascript keywords
              // 5. match var name

  // build a template (or get it from cache), render with data
  return function(str, data) {
    return str && (cache[str] = cache[str] || tmpl(str))(data)
  }


  // create a template instance

  function tmpl(s, p) {

    // default template string to {}
    s = (s || (brackets(0) + brackets(1)))

      // temporarily convert \{ and \} to a non-character
      .replace(brackets(/\\{/g), '\uFFF0')
      .replace(brackets(/\\}/g), '\uFFF1')

    // split string to expression and non-expresion parts
    p = split(s, extract(s, brackets(/{/), brackets(/}/)))

    return new Function('d', 'return ' + (

      // is it a single expression or a template? i.e. {x} or <b>{x}</b>
      !p[0] && !p[2] && !p[3]

        // if expression, evaluate it
        ? expr(p[1])

        // if template, evaluate all expressions in it
        : '[' + p.map(function(s, i) {

            // is it an expression or a string (every second part is an expression)
          return i % 2

              // evaluate the expressions
              ? expr(s, true)

              // process string parts of the template:
              : '"' + s

                  // preserve new lines
                  .replace(/\n/g, '\\n')

                  // escape quotes
                  .replace(/"/g, '\\"')

                + '"'

        }).join(',') + '].join("")'
      )

      // bring escaped { and } back
      .replace(/\uFFF0/g, brackets(0))
      .replace(/\uFFF1/g, brackets(1))

    + ';')

  }


  // parse { ... } expression

  function expr(s, n) {
    s = s

      // convert new lines to spaces
      .replace(/\n/g, ' ')

      // trim whitespace, brackets, strip comments
      .replace(brackets(/^[{ ]+|[ }]+$|\/\*.+?\*\//g), '')

    // is it an object literal? i.e. { key : value }
    return /^\s*[\w- "']+ *:/.test(s)

      // if object literal, return trueish keys
      // e.g.: { show: isOpen(), done: item.done } -> "show done"
      ? '[' +

          // extract key:val pairs, ignoring any nested objects
          extract(s,

              // name part: name:, "name":, 'name':, name :
              /["' ]*[\w- ]+["' ]*:/,

              // expression part: everything upto a comma followed by a name (see above) or end of line
              /,(?=["' ]*[\w- ]+["' ]*:)|}|$/
              ).map(function(pair) {

                // get key, val parts
                return pair.replace(/^[ "']*(.+?)[ "']*: *(.+?),? *$/, function(_, k, v) {

                  // wrap all conditional parts to ignore errors
                  return v.replace(/[^&|=!><]+/g, wrap) + '?"' + k + '":"",'

                })

              }).join('')

        + '].join(" ").trim()'

      // if js expression, evaluate as javascript
      : wrap(s, n)

  }


  // execute js w/o breaking on errors or undefined vars

  function wrap(s, nonull) {
    s = s.trim()
    return !s ? '' : '(function(v){try{v='

        // prefix vars (name => data.name)
        + (s.replace(reVars, function(s, _, v) { return v ? '(d.'+v+'===undefined?'+(typeof window == 'undefined' ? 'global.' : 'window.')+v+':d.'+v+')' : s })

          // break the expression if its empty (resulting in undefined value)
          || 'x')
      + '}catch(e){'
      + '}finally{return '

        // default to empty string for falsy values except zero
        + (nonull === true ? '!v&&v!==0?"":v' : 'v')

      + '}}).call(d)'
  }


  // split string by an array of substrings

  function split(str, substrings) {
    var parts = []
    substrings.map(function(sub, i) {

      // push matched expression and part before it
      i = str.indexOf(sub)
      parts.push(str.slice(0, i), sub)
      str = str.slice(i + sub.length)
    })

    // push the remaining part
    return parts.concat(str)
  }


  // match strings between opening and closing regexp, skipping any inner/nested matches

  function extract(str, open, close) {

    var start,
        level = 0,
        matches = [],
        re = new RegExp('('+open.source+')|('+close.source+')', 'g')

    str.replace(re, function(_, open, close, pos) {

      // if outer inner bracket, mark position
      if (!level && open) start = pos

      // in(de)crease bracket level
      level += open ? 1 : -1

      // if outer closing bracket, grab the match
      if (!level && close != null) matches.push(str.slice(start, pos+close.length))

    })

    return matches
  }

})()

// { key, i in items} -> { key, i, items }
function loopKeys(expr) {
  var b0 = brackets(0),
      els = expr.trim().slice(b0.length).match(/^\s*(\S+?)\s*(?:,\s*(\S+))?\s+in\s+(.+)$/)
  return els ? { key: els[1], pos: els[2], val: b0 + els[3] } : { val: expr }
}

function mkitem(expr, key, val) {
  var item = {}
  item[expr.key] = key
  if (expr.pos) item[expr.pos] = val
  return item
}


/* Beware: heavy stuff */
function _each(dom, parent, expr) {

  remAttr(dom, 'each')

  var tagName = getTagName(dom),
      template = dom.outerHTML,
      hasImpl = !!tagImpl[tagName],
      impl = tagImpl[tagName] || {
        tmpl: template
      },
      root = dom.parentNode,
      placeholder = document.createComment('riot placeholder'),
      tags = [],
      child = getTag(dom),
      checksum

  root.insertBefore(placeholder, dom)

  expr = loopKeys(expr)

  // clean template code
  parent
    .one('premount', function () {
      if (root.stub) root = parent.root
      // remove the original DOM node
      dom.parentNode.removeChild(dom)
    })
    .on('update', function () {
      var items = tmpl(expr.val, parent)

      // object loop. any changes cause full redraw
      if (!isArray(items)) {

        checksum = items ? JSON.stringify(items) : ''

        items = !items ? [] :
          Object.keys(items).map(function (key) {
            return mkitem(expr, key, items[key])
          })
      }

      var frag = document.createDocumentFragment(),
          i = tags.length,
          j = items.length

      // unmount leftover items
      while (i > j) {
        tags[--i].unmount()
        tags.splice(i, 1)
      }

      for (i = 0; i < j; ++i) {
        var _item = !checksum && !!expr.key ? mkitem(expr, items[i], i) : items[i]

        if (!tags[i]) {
          // mount new
          (tags[i] = new Tag(impl, {
              parent: parent,
              isLoop: true,
              hasImpl: hasImpl,
              root: hasImpl ? dom.cloneNode() : root,
              item: _item
            }, dom.innerHTML)
          ).mount()

          frag.appendChild(tags[i].root)
        } else
          tags[i].update(_item)

        tags[i]._item = _item

      }

      root.insertBefore(frag, placeholder)

      if (child) parent.tags[tagName] = tags

    }).one('updated', function() {
      var keys = Object.keys(parent)// only set new values
      walk(root, function(node) {
        // only set element node and not isLoop
        if (node.nodeType == 1 && !node.isLoop && !node._looped) {
          node._visited = false // reset _visited for loop node
          node._looped = true // avoid set multiple each
          setNamed(node, parent, keys)
        }
      })
    })

}


function parseNamedElements(root, parent, childTags) {

  walk(root, function(dom) {
    if (dom.nodeType == 1) {
      dom.isLoop = dom.isLoop || (dom.parentNode && dom.parentNode.isLoop || dom.getAttribute('each')) ? 1 : 0

      // custom child tag
      var child = getTag(dom)

      if (child && !dom.isLoop) {
        var tag = new Tag(child, { root: dom, parent: parent }, dom.innerHTML),
            tagName = getTagName(dom),
            ptag = getImmediateCustomParentTag(parent),
            cachedTag

        // fix for the parent attribute in the looped elements
        tag.parent = ptag

        cachedTag = ptag.tags[tagName]

        // if there are multiple children tags having the same name
        if (cachedTag) {
          // if the parent tags property is not yet an array
          // create it adding the first cached tag
          if (!isArray(cachedTag))
            ptag.tags[tagName] = [cachedTag]
          // add the new nested tag to the array
          ptag.tags[tagName].push(tag)
        } else {
          ptag.tags[tagName] = tag
        }

        // empty the child node once we got its template
        // to avoid that its children get compiled multiple times
        dom.innerHTML = ''
        childTags.push(tag)
      }

      if (!dom.isLoop)
        setNamed(dom, parent, [])
    }

  })

}

function parseExpressions(root, tag, expressions) {

  function addExpr(dom, val, extra) {
    if (val.indexOf(brackets(0)) >= 0) {
      var expr = { dom: dom, expr: val }
      expressions.push(extend(expr, extra))
    }
  }

  walk(root, function(dom) {
    var type = dom.nodeType

    // text node
    if (type == 3 && dom.parentNode.tagName != 'STYLE') addExpr(dom, dom.nodeValue)
    if (type != 1) return

    /* element */

    // loop
    var attr = dom.getAttribute('each')

    if (attr) { _each(dom, tag, attr); return false }

    // attribute expressions
    each(dom.attributes, function(attr) {
      var name = attr.name,
        bool = name.split('__')[1]

      addExpr(dom, attr.value, { attr: bool || name, bool: bool })
      if (bool) { remAttr(dom, name); return false }

    })

    // skip custom tags
    if (getTag(dom)) return false

  })

}
function Tag(impl, conf, innerHTML) {

  var self = riot.observable(this),
      opts = inherit(conf.opts) || {},
      dom = mkdom(impl.tmpl),
      parent = conf.parent,
      isLoop = conf.isLoop,
      hasImpl = conf.hasImpl,
      item = cleanUpData(conf.item),
      expressions = [],
      childTags = [],
      root = conf.root,
      fn = impl.fn,
      tagName = root.tagName.toLowerCase(),
      attr = {},
      propsInSyncWithParent = [],
      loopDom


  if (fn && root._tag) {
    root._tag.unmount(true)
  }

  // not yet mounted
  this.isMounted = false
  root.isLoop = isLoop

  // keep a reference to the tag just created
  // so we will be able to mount this tag multiple times
  root._tag = this

  // create a unique id to this tag
  // it could be handy to use it also to improve the virtual dom rendering speed
  this._id = __uid++

  extend(this, { parent: parent, root: root, opts: opts, tags: {} }, item)

  // grab attributes
  each(root.attributes, function(el) {
    var val = el.value
    // remember attributes with expressions only
    if (brackets(/\{.*\}/).test(val)) attr[el.name] = val
  })

  if (dom.innerHTML && !/select|optgroup|tbody|tr/.test(tagName))
    // replace all the yield tags with the tag inner html
    dom.innerHTML = replaceYield(dom.innerHTML, innerHTML)

  // options
  function updateOpts() {
    var ctx = hasImpl && isLoop ? self : parent || self

    // update opts from current DOM attributes
    each(root.attributes, function(el) {
      opts[el.name] = tmpl(el.value, ctx)
    })
    // recover those with expressions
    each(Object.keys(attr), function(name) {
      opts[name] = cleanUpData(tmpl(attr[name], ctx))
    })
  }

  function normalizeData(data) {
    for (var key in item) {
      if (typeof self[key] !== T_UNDEF)
        self[key] = data[key]
    }
  }

  function inheritFromParent () {
    if (!self.parent || !isLoop) return
    each(Object.keys(self.parent), function(k) {
      // some properties must be always in sync with the parent tag
      var mustSync = ~propsInSyncWithParent.indexOf(k)
      if (typeof self[k] === T_UNDEF || mustSync) {
        // track the property to keep in sync
        // so we can keep it updated
        if (!mustSync) propsInSyncWithParent.push(k)
        self[k] = self.parent[k]
      }
    })
  }

  this.update = function(data) {
    // make sure the data passed will not override
    // the component core methods
    data = cleanUpData(data)
    // inherit properties from the parent
    inheritFromParent()
    // normalize the tag properties in case an item object was initially passed
    if (typeof item === T_OBJECT) {
      normalizeData(data || {})
      item = data
    }
    extend(self, data)
    updateOpts()
    self.trigger('update', data)
    update(expressions, self)
    self.trigger('updated')
  }

  this.mixin = function() {
    each(arguments, function(mix) {
      mix = typeof mix === T_STRING ? riot.mixin(mix) : mix
      each(Object.keys(mix), function(key) {
        // bind methods to self
        if (key != 'init')
          self[key] = isFunction(mix[key]) ? mix[key].bind(self) : mix[key]
      })
      // init method will be called automatically
      if (mix.init) mix.init.bind(self)()
    })
  }

  this.mount = function() {

    updateOpts()

    // initialiation
    fn && fn.call(self, opts)

    // parse layout after init. fn may calculate args for nested custom tags
    parseExpressions(dom, self, expressions)

    // mount the child tags
    toggle(true)

    // update the root adding custom attributes coming from the compiler
    if (impl.attrs) {
      walkAttributes(impl.attrs, function (k, v) { root.setAttribute(k, v) })
      parseExpressions(self.root, self, expressions)
    }

    if (!self.parent || isLoop) self.update(item)

    // internal use only, fixes #403
    self.trigger('premount')

    if (isLoop && !hasImpl) {
      // update the root attribute for the looped elements
      self.root = root = loopDom = dom.firstChild

    } else {
      while (dom.firstChild) root.appendChild(dom.firstChild)
      if (root.stub) self.root = root = parent.root
    }
    // if it's not a child tag we can trigger its mount event
    if (!self.parent || self.parent.isMounted) {
      self.isMounted = true
      self.trigger('mount')
    }
    // otherwise we need to wait that the parent event gets triggered
    else self.parent.one('mount', function() {
      // avoid to trigger the `mount` event for the tags
      // not visible included in an if statement
      if (!isInStub(self.root)) {
        self.parent.isMounted = self.isMounted = true
        self.trigger('mount')
      }
    })
  }


  this.unmount = function(keepRootTag) {
    var el = loopDom || root,
        p = el.parentNode,
        ptag

    if (p) {

      if (parent) {
        ptag = getImmediateCustomParentTag(parent)
        // remove this tag from the parent tags object
        // if there are multiple nested tags with same name..
        // remove this element form the array
        if (isArray(ptag.tags[tagName]))
          each(ptag.tags[tagName], function(tag, i) {
            if (tag._id == self._id)
              ptag.tags[tagName].splice(i, 1)
          })
        else
          // otherwise just delete the tag instance
          ptag.tags[tagName] = undefined
      }

      else
        while (el.firstChild) el.removeChild(el.firstChild)

      if (!keepRootTag)
        p.removeChild(el)

    }


    self.trigger('unmount')
    toggle()
    self.off('*')
    // somehow ie8 does not like `delete root._tag`
    root._tag = null

  }

  function toggle(isMount) {

    // mount/unmount children
    each(childTags, function(child) { child[isMount ? 'mount' : 'unmount']() })

    // listen/unlisten parent (events flow one way from parent to children)
    if (parent) {
      var evt = isMount ? 'on' : 'off'

      // the loop tags will be always in sync with the parent automatically
      if (isLoop)
        parent[evt]('unmount', self.unmount)
      else
        parent[evt]('update', self.update)[evt]('unmount', self.unmount)
    }
  }

  // named elements available for fn
  parseNamedElements(dom, this, childTags)


}

function setEventHandler(name, handler, dom, tag) {

  dom[name] = function(e) {

    var item = tag._item,
        ptag = tag.parent,
        el

    if (!item)
      while (ptag) {
        item = ptag._item
        ptag = item ? false : ptag.parent
      }

    // cross browser event fix
    e = e || window.event

    // ignore error on some browsers
    try {
      e.currentTarget = dom
      if (!e.target) e.target = e.srcElement
      if (!e.which) e.which = e.charCode || e.keyCode
    } catch (ignored) { '' }

    e.item = item

    // prevent default behaviour (by default)
    if (handler.call(tag, e) !== true && !/radio|check/.test(dom.type)) {
      e.preventDefault && e.preventDefault()
      e.returnValue = false
    }

    if (!e.preventUpdate) {
      el = item ? getImmediateCustomParentTag(ptag) : tag
      el.update()
    }

  }

}

// used by if- attribute
function insertTo(root, node, before) {
  if (root) {
    root.insertBefore(before, node)
    root.removeChild(node)
  }
}

function update(expressions, tag) {

  each(expressions, function(expr, i) {

    var dom = expr.dom,
        attrName = expr.attr,
        value = tmpl(expr.expr, tag),
        parent = expr.dom.parentNode

    if (value == null) value = ''

    // leave out riot- prefixes from strings inside textarea
    if (parent && parent.tagName == 'TEXTAREA') value = value.replace(/riot-/g, '')

    // no change
    if (expr.value === value) return
    expr.value = value

    // text node
    if (!attrName) return dom.nodeValue = value.toString()

    // remove original attribute
    remAttr(dom, attrName)
    // event handler
    if (isFunction(value)) {
      setEventHandler(attrName, value, dom, tag)

    // if- conditional
    } else if (attrName == 'if') {
      var stub = expr.stub

      // add to DOM
      if (value) {
        if (stub) {
          insertTo(stub.parentNode, stub, dom)
          dom.inStub = false
          // avoid to trigger the mount event if the tags is not visible yet
          // maybe we can optimize this avoiding to mount the tag at all
          if (!isInStub(dom)) {
            walk(dom, function(el) {
              if (el._tag && !el._tag.isMounted) el._tag.isMounted = !!el._tag.trigger('mount')
            })
          }
        }
      // remove from DOM
      } else {
        stub = expr.stub = stub || document.createTextNode('')
        insertTo(dom.parentNode, dom, stub)
        dom.inStub = true
      }
    // show / hide
    } else if (/^(show|hide)$/.test(attrName)) {
      if (attrName == 'hide') value = !value
      dom.style.display = value ? '' : 'none'

    // field value
    } else if (attrName == 'value') {
      dom.value = value

    // <img src="{ expr }">
    } else if (attrName.slice(0, 5) == 'riot-' && attrName != 'riot-tag') {
      attrName = attrName.slice(5)
      value ? dom.setAttribute(attrName, value) : remAttr(dom, attrName)

    } else {
      if (expr.bool) {
        dom[attrName] = value
        if (!value) return
        value = attrName
      }

      if (typeof value !== T_OBJECT) dom.setAttribute(attrName, value)

    }

  })

}
function each(els, fn) {
  for (var i = 0, len = (els || []).length, el; i < len; i++) {
    el = els[i]
    // return false -> remove current item during loop
    if (el != null && fn(el, i) === false) i--
  }
  return els
}

function isFunction(v) {
  return typeof v === T_FUNCTION || false   // avoid IE problems
}

function remAttr(dom, name) {
  dom.removeAttribute(name)
}

function getTag(dom) {
  return tagImpl[dom.getAttribute(RIOT_TAG) || dom.tagName.toLowerCase()]
}

function getImmediateCustomParentTag(tag) {
  var ptag = tag
  while (!getTag(ptag.root)) {
    if (!ptag.parent) break
    ptag = ptag.parent
  }
  return ptag
}

function getTagName(dom) {
  var child = getTag(dom),
    namedTag = dom.getAttribute('name'),
    tagName = namedTag && namedTag.indexOf(brackets(0)) < 0 ? namedTag : child ? child.name : dom.tagName.toLowerCase()

  return tagName
}

function extend(src) {
  var obj, args = arguments
  for (var i = 1; i < args.length; ++i) {
    if ((obj = args[i])) {
      for (var key in obj) {      // eslint-disable-line guard-for-in
        src[key] = obj[key]
      }
    }
  }
  return src
}

// with this function we avoid that the current Tag methods get overridden
function cleanUpData(data) {
  if (!(data instanceof Tag) && !(data && typeof data.trigger == T_FUNCTION)) return data

  var o = {}
  for (var key in data) {
    if (!~RESERVED_WORDS_BLACKLIST.indexOf(key))
      o[key] = data[key]
  }
  return o
}

function mkdom(template) {
  var checkie = ieVersion && ieVersion < 10,
      matches = /^\s*<([\w-]+)/.exec(template),
      tagName = matches ? matches[1].toLowerCase() : '',
      rootTag = (tagName === 'th' || tagName === 'td') ? 'tr' :
                (tagName === 'tr' ? 'tbody' : 'div'),
      el = mkEl(rootTag)

  el.stub = true

  if (checkie) {
    if (tagName === 'optgroup')
      optgroupInnerHTML(el, template)
    else if (tagName === 'option')
      optionInnerHTML(el, template)
    else if (rootTag !== 'div')
      tbodyInnerHTML(el, template, tagName)
    else
      checkie = 0
  }
  if (!checkie) el.innerHTML = template

  return el
}

function walk(dom, fn) {
  if (dom) {
    if (fn(dom) === false) walk(dom.nextSibling, fn)
    else {
      dom = dom.firstChild

      while (dom) {
        walk(dom, fn)
        dom = dom.nextSibling
      }
    }
  }
}

// minimize risk: only zero or one _space_ between attr & value
function walkAttributes(html, fn) {
  var m,
      re = /([-\w]+) ?= ?(?:"([^"]*)|'([^']*)|({[^}]*}))/g

  while ((m = re.exec(html))) {
    fn(m[1].toLowerCase(), m[2] || m[3] || m[4])
  }
}

function isInStub(dom) {
  while (dom) {
    if (dom.inStub) return true
    dom = dom.parentNode
  }
  return false
}

function mkEl(name) {
  return document.createElement(name)
}

function replaceYield (tmpl, innerHTML) {
  return tmpl.replace(/<(yield)\/?>(<\/\1>)?/gim, innerHTML || '')
}

function $$(selector, ctx) {
  return (ctx || document).querySelectorAll(selector)
}

function $(selector, ctx) {
  return (ctx || document).querySelector(selector)
}

function inherit(parent) {
  function Child() {}
  Child.prototype = parent
  return new Child()
}

function setNamed(dom, parent, keys) {
  if (dom._visited) return
  var p,
      v = dom.getAttribute('id') || dom.getAttribute('name')

  if (v) {
    if (keys.indexOf(v) < 0) {
      p = parent[v]
      if (!p)
        parent[v] = dom
      else
        isArray(p) ? p.push(dom) : (parent[v] = [p, dom])
    }
    dom._visited = true
  }
}
/**
 *
 * Hacks needed for the old internet explorer versions [lower than IE10]
 *
 */
/* istanbul ignore next */
function tbodyInnerHTML(el, html, tagName) {
  var div = mkEl('div'),
      loops = /td|th/.test(tagName) ? 3 : 2,
      child

  div.innerHTML = '<table>' + html + '</table>'
  child = div.firstChild

  while (loops--) child = child.firstChild

  el.appendChild(child)

}
/* istanbul ignore next */
function optionInnerHTML(el, html) {
  var opt = mkEl('option'),
      valRegx = /value=[\"'](.+?)[\"']/,
      selRegx = /selected=[\"'](.+?)[\"']/,
      eachRegx = /each=[\"'](.+?)[\"']/,
      ifRegx = /if=[\"'](.+?)[\"']/,
      innerRegx = />([^<]*)</,
      valuesMatch = html.match(valRegx),
      selectedMatch = html.match(selRegx),
      innerValue = html.match(innerRegx),
      eachMatch = html.match(eachRegx),
      ifMatch = html.match(ifRegx)

  if (innerValue) opt.innerHTML = innerValue[1]
  else opt.innerHTML = html

  if (valuesMatch) opt.value = valuesMatch[1]
  if (selectedMatch) opt.setAttribute('riot-selected', selectedMatch[1])
  if (eachMatch) opt.setAttribute('each', eachMatch[1])
  if (ifMatch) opt.setAttribute('if', ifMatch[1])

  el.appendChild(opt)
}
/* istanbul ignore next */
function optgroupInnerHTML(el, html) {
  var opt = mkEl('optgroup'),
      labelRegx = /label=[\"'](.+?)[\"']/,
      elementRegx = /^<([^>]*)>/,
      tagRegx = /^<([^ \>]*)/,
      labelMatch = html.match(labelRegx),
      elementMatch = html.match(elementRegx),
      tagMatch = html.match(tagRegx),
      innerContent = html

  if (elementMatch) {
    var options = html.slice(elementMatch[1].length+2, -tagMatch[1].length-3).trim()
    innerContent = options
  }

  if (labelMatch) opt.setAttribute('riot-label', labelMatch[1])

  if (innerContent) {
    var innerOpt = mkEl('div')

    optionInnerHTML(innerOpt, innerContent)

    opt.appendChild(innerOpt.firstChild)
  }

  el.appendChild(opt)
}

/*
 Virtual dom is an array of custom tags on the document.
 Updates and unmounts propagate downwards from parent to children.
*/

var virtualDom = [],
    tagImpl = {},
    styleNode

var RIOT_TAG = 'riot-tag'

function injectStyle(css) {

  if (riot.render) return // skip injection on the server

  if (!styleNode) {
    styleNode = mkEl('style')
    styleNode.setAttribute('type', 'text/css')
  }

  var head = document.head || document.getElementsByTagName('head')[0]

  if (styleNode.styleSheet)
    styleNode.styleSheet.cssText += css
  else
    styleNode.innerHTML += css

  if (!styleNode._rendered)
    if (styleNode.styleSheet) {
      document.body.appendChild(styleNode)
    } else {
      var rs = $('style[type=riot]')
      if (rs) {
        rs.parentNode.insertBefore(styleNode, rs)
        rs.parentNode.removeChild(rs)
      } else head.appendChild(styleNode)

    }

  styleNode._rendered = true

}

function mountTo(root, tagName, opts) {
  var tag = tagImpl[tagName],
      // cache the inner HTML to fix #855
      innerHTML = root._innerHTML = root._innerHTML || root.innerHTML

  // clear the inner html
  root.innerHTML = ''

  if (tag && root) tag = new Tag(tag, { root: root, opts: opts }, innerHTML)

  if (tag && tag.mount) {
    tag.mount()
    virtualDom.push(tag)
    return tag.on('unmount', function() {
      virtualDom.splice(virtualDom.indexOf(tag), 1)
    })
  }

}

riot.tag = function(name, html, css, attrs, fn) {
  if (isFunction(attrs)) {
    fn = attrs
    if (/^[\w\-]+\s?=/.test(css)) {
      attrs = css
      css = ''
    } else attrs = ''
  }
  if (css) {
    if (isFunction(css)) fn = css
    else injectStyle(css)
  }
  tagImpl[name] = { name: name, tmpl: html, attrs: attrs, fn: fn }
  return name
}

riot.mount = function(selector, tagName, opts) {

  var els,
      allTags,
      tags = []

  // helper functions

  function addRiotTags(arr) {
    var list = ''
    each(arr, function (e) {
      list += ', *[riot-tag="'+ e.trim() + '"]'
    })
    return list
  }

  function selectAllTags() {
    var keys = Object.keys(tagImpl)
    return keys + addRiotTags(keys)
  }

  function pushTags(root) {
    var last
    if (root.tagName) {
      if (tagName && (!(last = root.getAttribute(RIOT_TAG)) || last != tagName))
        root.setAttribute(RIOT_TAG, tagName)

      var tag = mountTo(root,
        tagName || root.getAttribute(RIOT_TAG) || root.tagName.toLowerCase(), opts)

      if (tag) tags.push(tag)
    }
    else if (root.length) {
      each(root, pushTags)   // assume nodeList
    }
  }

  // ----- mount code -----

  if (typeof tagName === T_OBJECT) {
    opts = tagName
    tagName = 0
  }

  // crawl the DOM to find the tag
  if (typeof selector === T_STRING) {
    if (selector === '*')
      // select all the tags registered
      // and also the tags found with the riot-tag attribute set
      selector = allTags = selectAllTags()
    else
      // or just the ones named like the selector
      selector += addRiotTags(selector.split(','))

    els = $$(selector)
  }
  else
    // probably you have passed already a tag or a NodeList
    els = selector

  // select all the registered and mount them inside their root elements
  if (tagName === '*') {
    // get all custom tags
    tagName = allTags || selectAllTags()
    // if the root els it's just a single tag
    if (els.tagName)
      els = $$(tagName, els)
    else {
      // select all the children for all the different root elements
      var nodeList = []
      each(els, function (_el) {
        nodeList.push($$(tagName, _el))
      })
      els = nodeList
    }
    // get rid of the tagName
    tagName = 0
  }

  if (els.tagName)
    pushTags(els)
  else
    each(els, pushTags)

  return tags
}

// update everything
riot.update = function() {
  return each(virtualDom, function(tag) {
    tag.update()
  })
}

// @deprecated
riot.mountTo = riot.mount

  // share methods for other riot parts, e.g. compiler
  riot.util = { brackets: brackets, tmpl: tmpl }

  // support CommonJS, AMD & browser
  /* istanbul ignore next */
  if (typeof exports === T_OBJECT)
    module.exports = riot
  else if (typeof define === 'function' && define.amd)
    define(function() { return window.riot = riot })
  else
    window.riot = riot

})(typeof window != 'undefined' ? window : void 0);

},{}],2:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _riot = require('riot');

var _riot2 = _interopRequireDefault(_riot);

require('../tags/helloworld.tag');

var params = {
    people: [{ name: 'Peter' }, { name: 'James' }, { name: 'John' }, { name: 'Andrew' }]
};

_riot2['default'].mount('helloworld', params);

},{"../tags/helloworld.tag":3,"riot":1}],3:[function(require,module,exports){
var riot = require('riot');
module.exports = riot.tag('helloworld', '<h1>{ title }</h1> <input id="addInput" onkeyup="{ add }"> <button id="subtractInput" onclick="{ subtract }">Subtract</button> <div>Count: { count }</div> <div each="{ opts.people }">{ name }</div> <div each="{ item, i in list }">{ i }: { item }</div>', function(opts) {var _this = this;

count = 0;

subtract = function (e) {
    if (count > 0) {
        addInput.value = removeLast(addInput.value);
        count--;
    }
};

add = function (e) {
    count++;
    _this.update();
};

removeLast = function (text) {
    return text.substr(0, text.length - 1);
};

this.people = [{ name: 'Peter' }, { name: 'James' }, { name: 'John' }, { name: 'Andrew' }];

this.list = ['Banana', 'Apple', 'Orange', 'Mango'];

// setInterval(add, 1000)

title = opts.title + ' World!';
});

},{"riot":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcmlvdC9yaW90LmpzIiwiL1VzZXJzL2FuZHJld2RlbHByZXRlL1dvcmsvQ29kZSBUZXN0aW5nL2JvaWxlcnBsYXRlL3Jpb3Rqcy1ndWxwLWJyb3dzZXJpZnktZXM2LWJvaWxlcnBsYXRlL3NyYy9zY3JpcHRzL2FwcC5qcyIsInNyYy90YWdzL2hlbGxvd29ybGQudGFnIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMTJDQSxZQUFZLENBQUM7Ozs7b0JBRUksTUFBTTs7OztRQUNoQix3QkFBd0I7O0FBRS9CLElBQUksTUFBTSxHQUFHO0FBQ1QsVUFBTSxFQUFFLENBQ0osRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEVBQ2pCLEVBQUUsSUFBSSxFQUFFLE9BQU8sRUFBRSxFQUNqQixFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsRUFDaEIsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLENBQ3JCO0NBQ0osQ0FBQzs7QUFFRixrQkFBSyxLQUFLLENBQUMsWUFBWSxFQUFFLE1BQU0sQ0FBQyxDQUFDOzs7QUNkakM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8qIFJpb3QgdjIuMi4zLCBAbGljZW5zZSBNSVQsIChjKSAyMDE1IE11dXQgSW5jLiArIGNvbnRyaWJ1dG9ycyAqL1xuXG47KGZ1bmN0aW9uKHdpbmRvdywgdW5kZWZpbmVkKSB7XG4gICd1c2Ugc3RyaWN0J1xuICB2YXIgcmlvdCA9IHsgdmVyc2lvbjogJ3YyLjIuMycsIHNldHRpbmdzOiB7fSB9LFxuICAgICAgLy8gY291bnRlciB0byBnaXZlIGEgdW5pcXVlIGlkIHRvIGFsbCB0aGUgVGFnIGluc3RhbmNlc1xuICAgICAgX191aWQgPSAwXG5cbiAgLy8gVGhpcyBnbG9iYWxzICdjb25zdCcgaGVscHMgY29kZSBzaXplIHJlZHVjdGlvblxuXG4gIC8vIGZvciB0eXBlb2YgPT0gJycgY29tcGFyaXNvbnNcbiAgdmFyIFRfU1RSSU5HID0gJ3N0cmluZycsXG4gICAgICBUX09CSkVDVCA9ICdvYmplY3QnLFxuICAgICAgVF9VTkRFRiAgPSAndW5kZWZpbmVkJyxcbiAgICAgIFRfRlVOQ1RJT04gID0gJ2Z1bmN0aW9uJyxcbiAgICAgIFJFU0VSVkVEX1dPUkRTX0JMQUNLTElTVCA9IFsndXBkYXRlJywgJ3Jvb3QnLCAnbW91bnQnLCAndW5tb3VudCcsICdtaXhpbicsICdpc01vdW50ZWQnLCAnaXNMb29wJywgJ3RhZ3MnLCAncGFyZW50JywgJ29wdHMnLCAndHJpZ2dlcicsICdvbicsICdvZmYnLCAnb25lJ11cblxuICAvLyBmb3IgSUU4IGFuZCByZXN0IG9mIHRoZSB3b3JsZFxuICAvKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuICB2YXIgaXNBcnJheSA9IEFycmF5LmlzQXJyYXkgfHwgKGZ1bmN0aW9uICgpIHtcbiAgICB2YXIgX3RzID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZ1xuICAgIHJldHVybiBmdW5jdGlvbiAodikgeyByZXR1cm4gX3RzLmNhbGwodikgPT09ICdbb2JqZWN0IEFycmF5XScgfVxuICB9KSgpXG5cbiAgLy8gVmVyc2lvbiMgZm9yIElFIDgtMTEsIDAgZm9yIG90aGVyc1xuICB2YXIgaWVWZXJzaW9uID0gKGZ1bmN0aW9uICh3aW4pIHtcbiAgICByZXR1cm4gKHdpbmRvdyAmJiB3aW5kb3cuZG9jdW1lbnQgfHwge30pLmRvY3VtZW50TW9kZSB8IDBcbiAgfSkoKVxuXG5yaW90Lm9ic2VydmFibGUgPSBmdW5jdGlvbihlbCkge1xuXG4gIGVsID0gZWwgfHwge31cblxuICB2YXIgY2FsbGJhY2tzID0ge30sXG4gICAgICBfaWQgPSAwXG5cbiAgZWwub24gPSBmdW5jdGlvbihldmVudHMsIGZuKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24oZm4pKSB7XG4gICAgICBpZiAodHlwZW9mIGZuLmlkID09PSBUX1VOREVGKSBmbi5faWQgPSBfaWQrK1xuXG4gICAgICBldmVudHMucmVwbGFjZSgvXFxTKy9nLCBmdW5jdGlvbihuYW1lLCBwb3MpIHtcbiAgICAgICAgKGNhbGxiYWNrc1tuYW1lXSA9IGNhbGxiYWNrc1tuYW1lXSB8fCBbXSkucHVzaChmbilcbiAgICAgICAgZm4udHlwZWQgPSBwb3MgPiAwXG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gZWxcbiAgfVxuXG4gIGVsLm9mZiA9IGZ1bmN0aW9uKGV2ZW50cywgZm4pIHtcbiAgICBpZiAoZXZlbnRzID09ICcqJykgY2FsbGJhY2tzID0ge31cbiAgICBlbHNlIHtcbiAgICAgIGV2ZW50cy5yZXBsYWNlKC9cXFMrL2csIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgICAgaWYgKGZuKSB7XG4gICAgICAgICAgdmFyIGFyciA9IGNhbGxiYWNrc1tuYW1lXVxuICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBjYjsgKGNiID0gYXJyICYmIGFycltpXSk7ICsraSkge1xuICAgICAgICAgICAgaWYgKGNiLl9pZCA9PSBmbi5faWQpIGFyci5zcGxpY2UoaS0tLCAxKVxuICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICBjYWxsYmFja3NbbmFtZV0gPSBbXVxuICAgICAgICB9XG4gICAgICB9KVxuICAgIH1cbiAgICByZXR1cm4gZWxcbiAgfVxuXG4gIC8vIG9ubHkgc2luZ2xlIGV2ZW50IHN1cHBvcnRlZFxuICBlbC5vbmUgPSBmdW5jdGlvbihuYW1lLCBmbikge1xuICAgIGZ1bmN0aW9uIG9uKCkge1xuICAgICAgZWwub2ZmKG5hbWUsIG9uKVxuICAgICAgZm4uYXBwbHkoZWwsIGFyZ3VtZW50cylcbiAgICB9XG4gICAgcmV0dXJuIGVsLm9uKG5hbWUsIG9uKVxuICB9XG5cbiAgZWwudHJpZ2dlciA9IGZ1bmN0aW9uKG5hbWUpIHtcbiAgICB2YXIgYXJncyA9IFtdLnNsaWNlLmNhbGwoYXJndW1lbnRzLCAxKSxcbiAgICAgICAgZm5zID0gY2FsbGJhY2tzW25hbWVdIHx8IFtdXG5cbiAgICBmb3IgKHZhciBpID0gMCwgZm47IChmbiA9IGZuc1tpXSk7ICsraSkge1xuICAgICAgaWYgKCFmbi5idXN5KSB7XG4gICAgICAgIGZuLmJ1c3kgPSAxXG4gICAgICAgIGZuLmFwcGx5KGVsLCBmbi50eXBlZCA/IFtuYW1lXS5jb25jYXQoYXJncykgOiBhcmdzKVxuICAgICAgICBpZiAoZm5zW2ldICE9PSBmbikgeyBpLS0gfVxuICAgICAgICBmbi5idXN5ID0gMFxuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChjYWxsYmFja3MuYWxsICYmIG5hbWUgIT0gJ2FsbCcpIHtcbiAgICAgIGVsLnRyaWdnZXIuYXBwbHkoZWwsIFsnYWxsJywgbmFtZV0uY29uY2F0KGFyZ3MpKVxuICAgIH1cblxuICAgIHJldHVybiBlbFxuICB9XG5cbiAgcmV0dXJuIGVsXG5cbn1cbnJpb3QubWl4aW4gPSAoZnVuY3Rpb24oKSB7XG4gIHZhciBtaXhpbnMgPSB7fVxuXG4gIHJldHVybiBmdW5jdGlvbihuYW1lLCBtaXhpbikge1xuICAgIGlmICghbWl4aW4pIHJldHVybiBtaXhpbnNbbmFtZV1cbiAgICBtaXhpbnNbbmFtZV0gPSBtaXhpblxuICB9XG5cbn0pKClcblxuOyhmdW5jdGlvbihyaW90LCBldnQsIHdpbikge1xuXG4gIC8vIGJyb3dzZXJzIG9ubHlcbiAgaWYgKCF3aW4pIHJldHVyblxuXG4gIHZhciBsb2MgPSB3aW4ubG9jYXRpb24sXG4gICAgICBmbnMgPSByaW90Lm9ic2VydmFibGUoKSxcbiAgICAgIHN0YXJ0ZWQgPSBmYWxzZSxcbiAgICAgIGN1cnJlbnRcblxuICBmdW5jdGlvbiBoYXNoKCkge1xuICAgIHJldHVybiBsb2MuaHJlZi5zcGxpdCgnIycpWzFdIHx8ICcnXG4gIH1cblxuICBmdW5jdGlvbiBwYXJzZXIocGF0aCkge1xuICAgIHJldHVybiBwYXRoLnNwbGl0KCcvJylcbiAgfVxuXG4gIGZ1bmN0aW9uIGVtaXQocGF0aCkge1xuICAgIGlmIChwYXRoLnR5cGUpIHBhdGggPSBoYXNoKClcblxuICAgIGlmIChwYXRoICE9IGN1cnJlbnQpIHtcbiAgICAgIGZucy50cmlnZ2VyLmFwcGx5KG51bGwsIFsnSCddLmNvbmNhdChwYXJzZXIocGF0aCkpKVxuICAgICAgY3VycmVudCA9IHBhdGhcbiAgICB9XG4gIH1cblxuICB2YXIgciA9IHJpb3Qucm91dGUgPSBmdW5jdGlvbihhcmcpIHtcbiAgICAvLyBzdHJpbmdcbiAgICBpZiAoYXJnWzBdKSB7XG4gICAgICBsb2MuaGFzaCA9IGFyZ1xuICAgICAgZW1pdChhcmcpXG5cbiAgICAvLyBmdW5jdGlvblxuICAgIH0gZWxzZSB7XG4gICAgICBmbnMub24oJ0gnLCBhcmcpXG4gICAgfVxuICB9XG5cbiAgci5leGVjID0gZnVuY3Rpb24oZm4pIHtcbiAgICBmbi5hcHBseShudWxsLCBwYXJzZXIoaGFzaCgpKSlcbiAgfVxuXG4gIHIucGFyc2VyID0gZnVuY3Rpb24oZm4pIHtcbiAgICBwYXJzZXIgPSBmblxuICB9XG5cbiAgci5zdG9wID0gZnVuY3Rpb24gKCkge1xuICAgIGlmICghc3RhcnRlZCkgcmV0dXJuXG4gICAgd2luLnJlbW92ZUV2ZW50TGlzdGVuZXIgPyB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lcihldnQsIGVtaXQsIGZhbHNlKSA6IHdpbi5kZXRhY2hFdmVudCgnb24nICsgZXZ0LCBlbWl0KVxuICAgIGZucy5vZmYoJyonKVxuICAgIHN0YXJ0ZWQgPSBmYWxzZVxuICB9XG5cbiAgci5zdGFydCA9IGZ1bmN0aW9uICgpIHtcbiAgICBpZiAoc3RhcnRlZCkgcmV0dXJuXG4gICAgd2luLmFkZEV2ZW50TGlzdGVuZXIgPyB3aW4uYWRkRXZlbnRMaXN0ZW5lcihldnQsIGVtaXQsIGZhbHNlKSA6IHdpbi5hdHRhY2hFdmVudCgnb24nICsgZXZ0LCBlbWl0KVxuICAgIHN0YXJ0ZWQgPSB0cnVlXG4gIH1cblxuICAvLyBhdXRvc3RhcnQgdGhlIHJvdXRlclxuICByLnN0YXJ0KClcblxufSkocmlvdCwgJ2hhc2hjaGFuZ2UnLCB3aW5kb3cpXG4vKlxuXG4vLy8vIEhvdyBpdCB3b3Jrcz9cblxuXG5UaHJlZSB3YXlzOlxuXG4xLiBFeHByZXNzaW9uczogdG1wbCgneyB2YWx1ZSB9JywgZGF0YSkuXG4gICBSZXR1cm5zIHRoZSByZXN1bHQgb2YgZXZhbHVhdGVkIGV4cHJlc3Npb24gYXMgYSByYXcgb2JqZWN0LlxuXG4yLiBUZW1wbGF0ZXM6IHRtcGwoJ0hpIHsgbmFtZSB9IHsgc3VybmFtZSB9JywgZGF0YSkuXG4gICBSZXR1cm5zIGEgc3RyaW5nIHdpdGggZXZhbHVhdGVkIGV4cHJlc3Npb25zLlxuXG4zLiBGaWx0ZXJzOiB0bXBsKCd7IHNob3c6ICFkb25lLCBoaWdobGlnaHQ6IGFjdGl2ZSB9JywgZGF0YSkuXG4gICBSZXR1cm5zIGEgc3BhY2Ugc2VwYXJhdGVkIGxpc3Qgb2YgdHJ1ZWlzaCBrZXlzIChtYWlubHlcbiAgIHVzZWQgZm9yIHNldHRpbmcgaHRtbCBjbGFzc2VzKSwgZS5nLiBcInNob3cgaGlnaGxpZ2h0XCIuXG5cblxuLy8gVGVtcGxhdGUgZXhhbXBsZXNcblxudG1wbCgneyB0aXRsZSB8fCBcIlVudGl0bGVkXCIgfScsIGRhdGEpXG50bXBsKCdSZXN1bHRzIGFyZSB7IHJlc3VsdHMgPyBcInJlYWR5XCIgOiBcImxvYWRpbmdcIiB9JywgZGF0YSlcbnRtcGwoJ1RvZGF5IGlzIHsgbmV3IERhdGUoKSB9JywgZGF0YSlcbnRtcGwoJ3sgbWVzc2FnZS5sZW5ndGggPiAxNDAgJiYgXCJNZXNzYWdlIGlzIHRvbyBsb25nXCIgfScsIGRhdGEpXG50bXBsKCdUaGlzIGl0ZW0gZ290IHsgTWF0aC5yb3VuZChyYXRpbmcpIH0gc3RhcnMnLCBkYXRhKVxudG1wbCgnPGgxPnsgdGl0bGUgfTwvaDE+eyBib2R5IH0nLCBkYXRhKVxuXG5cbi8vIEZhbHN5IGV4cHJlc3Npb25zIGluIHRlbXBsYXRlc1xuXG5JbiB0ZW1wbGF0ZXMgKGFzIG9wcG9zZWQgdG8gc2luZ2xlIGV4cHJlc3Npb25zKSBhbGwgZmFsc3kgdmFsdWVzXG5leGNlcHQgemVybyAodW5kZWZpbmVkL251bGwvZmFsc2UpIHdpbGwgZGVmYXVsdCB0byBlbXB0eSBzdHJpbmc6XG5cbnRtcGwoJ3sgdW5kZWZpbmVkIH0gLSB7IGZhbHNlIH0gLSB7IG51bGwgfSAtIHsgMCB9Jywge30pXG4vLyB3aWxsIHJldHVybjogXCIgLSAtIC0gMFwiXG5cbiovXG5cblxudmFyIGJyYWNrZXRzID0gKGZ1bmN0aW9uKG9yaWcpIHtcblxuICB2YXIgY2FjaGVkQnJhY2tldHMsXG4gICAgICByLFxuICAgICAgYixcbiAgICAgIHJlID0gL1t7fV0vZ1xuXG4gIHJldHVybiBmdW5jdGlvbih4KSB7XG5cbiAgICAvLyBtYWtlIHN1cmUgd2UgdXNlIHRoZSBjdXJyZW50IHNldHRpbmdcbiAgICB2YXIgcyA9IHJpb3Quc2V0dGluZ3MuYnJhY2tldHMgfHwgb3JpZ1xuXG4gICAgLy8gcmVjcmVhdGUgY2FjaGVkIHZhcnMgaWYgbmVlZGVkXG4gICAgaWYgKGNhY2hlZEJyYWNrZXRzICE9PSBzKSB7XG4gICAgICBjYWNoZWRCcmFja2V0cyA9IHNcbiAgICAgIGIgPSBzLnNwbGl0KCcgJylcbiAgICAgIHIgPSBiLm1hcChmdW5jdGlvbiAoZSkgeyByZXR1cm4gZS5yZXBsYWNlKC8oPz0uKS9nLCAnXFxcXCcpIH0pXG4gICAgfVxuXG4gICAgLy8gaWYgcmVnZXhwIGdpdmVuLCByZXdyaXRlIGl0IHdpdGggY3VycmVudCBicmFja2V0cyAob25seSBpZiBkaWZmZXIgZnJvbSBkZWZhdWx0KVxuICAgIHJldHVybiB4IGluc3RhbmNlb2YgUmVnRXhwID8gKFxuICAgICAgICBzID09PSBvcmlnID8geCA6XG4gICAgICAgIG5ldyBSZWdFeHAoeC5zb3VyY2UucmVwbGFjZShyZSwgZnVuY3Rpb24oYikgeyByZXR1cm4gclt+fihiID09PSAnfScpXSB9KSwgeC5nbG9iYWwgPyAnZycgOiAnJylcbiAgICAgICkgOlxuICAgICAgLy8gZWxzZSwgZ2V0IHNwZWNpZmljIGJyYWNrZXRcbiAgICAgIGJbeF1cbiAgfVxufSkoJ3sgfScpXG5cblxudmFyIHRtcGwgPSAoZnVuY3Rpb24oKSB7XG5cbiAgdmFyIGNhY2hlID0ge30sXG4gICAgICByZVZhcnMgPSAvKFsnXCJcXC9dKS4qP1teXFxcXF1cXDF8XFwuXFx3KnxcXHcqOnxcXGIoPzooPzpuZXd8dHlwZW9mfGlufGluc3RhbmNlb2YpIHwoPzp0aGlzfHRydWV8ZmFsc2V8bnVsbHx1bmRlZmluZWQpXFxifGZ1bmN0aW9uICpcXCgpfChbYS16XyRdXFx3KikvZ2lcbiAgICAgICAgICAgICAgLy8gWyAxICAgICAgICAgICAgICAgXVsgMiAgXVsgMyBdWyA0ICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIF1bIDUgICAgICAgXVxuICAgICAgICAgICAgICAvLyBmaW5kIHZhcmlhYmxlIG5hbWVzOlxuICAgICAgICAgICAgICAvLyAxLiBza2lwIHF1b3RlZCBzdHJpbmdzIGFuZCByZWdleHBzOiBcImEgYlwiLCAnYSBiJywgJ2EgXFwnYlxcJycsIC9hIGIvXG4gICAgICAgICAgICAgIC8vIDIuIHNraXAgb2JqZWN0IHByb3BlcnRpZXM6IC5uYW1lXG4gICAgICAgICAgICAgIC8vIDMuIHNraXAgb2JqZWN0IGxpdGVyYWxzOiBuYW1lOlxuICAgICAgICAgICAgICAvLyA0LiBza2lwIGphdmFzY3JpcHQga2V5d29yZHNcbiAgICAgICAgICAgICAgLy8gNS4gbWF0Y2ggdmFyIG5hbWVcblxuICAvLyBidWlsZCBhIHRlbXBsYXRlIChvciBnZXQgaXQgZnJvbSBjYWNoZSksIHJlbmRlciB3aXRoIGRhdGFcbiAgcmV0dXJuIGZ1bmN0aW9uKHN0ciwgZGF0YSkge1xuICAgIHJldHVybiBzdHIgJiYgKGNhY2hlW3N0cl0gPSBjYWNoZVtzdHJdIHx8IHRtcGwoc3RyKSkoZGF0YSlcbiAgfVxuXG5cbiAgLy8gY3JlYXRlIGEgdGVtcGxhdGUgaW5zdGFuY2VcblxuICBmdW5jdGlvbiB0bXBsKHMsIHApIHtcblxuICAgIC8vIGRlZmF1bHQgdGVtcGxhdGUgc3RyaW5nIHRvIHt9XG4gICAgcyA9IChzIHx8IChicmFja2V0cygwKSArIGJyYWNrZXRzKDEpKSlcblxuICAgICAgLy8gdGVtcG9yYXJpbHkgY29udmVydCBcXHsgYW5kIFxcfSB0byBhIG5vbi1jaGFyYWN0ZXJcbiAgICAgIC5yZXBsYWNlKGJyYWNrZXRzKC9cXFxcey9nKSwgJ1xcdUZGRjAnKVxuICAgICAgLnJlcGxhY2UoYnJhY2tldHMoL1xcXFx9L2cpLCAnXFx1RkZGMScpXG5cbiAgICAvLyBzcGxpdCBzdHJpbmcgdG8gZXhwcmVzc2lvbiBhbmQgbm9uLWV4cHJlc2lvbiBwYXJ0c1xuICAgIHAgPSBzcGxpdChzLCBleHRyYWN0KHMsIGJyYWNrZXRzKC97LyksIGJyYWNrZXRzKC99LykpKVxuXG4gICAgcmV0dXJuIG5ldyBGdW5jdGlvbignZCcsICdyZXR1cm4gJyArIChcblxuICAgICAgLy8gaXMgaXQgYSBzaW5nbGUgZXhwcmVzc2lvbiBvciBhIHRlbXBsYXRlPyBpLmUuIHt4fSBvciA8Yj57eH08L2I+XG4gICAgICAhcFswXSAmJiAhcFsyXSAmJiAhcFszXVxuXG4gICAgICAgIC8vIGlmIGV4cHJlc3Npb24sIGV2YWx1YXRlIGl0XG4gICAgICAgID8gZXhwcihwWzFdKVxuXG4gICAgICAgIC8vIGlmIHRlbXBsYXRlLCBldmFsdWF0ZSBhbGwgZXhwcmVzc2lvbnMgaW4gaXRcbiAgICAgICAgOiAnWycgKyBwLm1hcChmdW5jdGlvbihzLCBpKSB7XG5cbiAgICAgICAgICAgIC8vIGlzIGl0IGFuIGV4cHJlc3Npb24gb3IgYSBzdHJpbmcgKGV2ZXJ5IHNlY29uZCBwYXJ0IGlzIGFuIGV4cHJlc3Npb24pXG4gICAgICAgICAgcmV0dXJuIGkgJSAyXG5cbiAgICAgICAgICAgICAgLy8gZXZhbHVhdGUgdGhlIGV4cHJlc3Npb25zXG4gICAgICAgICAgICAgID8gZXhwcihzLCB0cnVlKVxuXG4gICAgICAgICAgICAgIC8vIHByb2Nlc3Mgc3RyaW5nIHBhcnRzIG9mIHRoZSB0ZW1wbGF0ZTpcbiAgICAgICAgICAgICAgOiAnXCInICsgc1xuXG4gICAgICAgICAgICAgICAgICAvLyBwcmVzZXJ2ZSBuZXcgbGluZXNcbiAgICAgICAgICAgICAgICAgIC5yZXBsYWNlKC9cXG4vZywgJ1xcXFxuJylcblxuICAgICAgICAgICAgICAgICAgLy8gZXNjYXBlIHF1b3Rlc1xuICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1wiL2csICdcXFxcXCInKVxuXG4gICAgICAgICAgICAgICAgKyAnXCInXG5cbiAgICAgICAgfSkuam9pbignLCcpICsgJ10uam9pbihcIlwiKSdcbiAgICAgIClcblxuICAgICAgLy8gYnJpbmcgZXNjYXBlZCB7IGFuZCB9IGJhY2tcbiAgICAgIC5yZXBsYWNlKC9cXHVGRkYwL2csIGJyYWNrZXRzKDApKVxuICAgICAgLnJlcGxhY2UoL1xcdUZGRjEvZywgYnJhY2tldHMoMSkpXG5cbiAgICArICc7JylcblxuICB9XG5cblxuICAvLyBwYXJzZSB7IC4uLiB9IGV4cHJlc3Npb25cblxuICBmdW5jdGlvbiBleHByKHMsIG4pIHtcbiAgICBzID0gc1xuXG4gICAgICAvLyBjb252ZXJ0IG5ldyBsaW5lcyB0byBzcGFjZXNcbiAgICAgIC5yZXBsYWNlKC9cXG4vZywgJyAnKVxuXG4gICAgICAvLyB0cmltIHdoaXRlc3BhY2UsIGJyYWNrZXRzLCBzdHJpcCBjb21tZW50c1xuICAgICAgLnJlcGxhY2UoYnJhY2tldHMoL15beyBdK3xbIH1dKyR8XFwvXFwqLis/XFwqXFwvL2cpLCAnJylcblxuICAgIC8vIGlzIGl0IGFuIG9iamVjdCBsaXRlcmFsPyBpLmUuIHsga2V5IDogdmFsdWUgfVxuICAgIHJldHVybiAvXlxccypbXFx3LSBcIiddKyAqOi8udGVzdChzKVxuXG4gICAgICAvLyBpZiBvYmplY3QgbGl0ZXJhbCwgcmV0dXJuIHRydWVpc2gga2V5c1xuICAgICAgLy8gZS5nLjogeyBzaG93OiBpc09wZW4oKSwgZG9uZTogaXRlbS5kb25lIH0gLT4gXCJzaG93IGRvbmVcIlxuICAgICAgPyAnWycgK1xuXG4gICAgICAgICAgLy8gZXh0cmFjdCBrZXk6dmFsIHBhaXJzLCBpZ25vcmluZyBhbnkgbmVzdGVkIG9iamVjdHNcbiAgICAgICAgICBleHRyYWN0KHMsXG5cbiAgICAgICAgICAgICAgLy8gbmFtZSBwYXJ0OiBuYW1lOiwgXCJuYW1lXCI6LCAnbmFtZSc6LCBuYW1lIDpcbiAgICAgICAgICAgICAgL1tcIicgXSpbXFx3LSBdK1tcIicgXSo6LyxcblxuICAgICAgICAgICAgICAvLyBleHByZXNzaW9uIHBhcnQ6IGV2ZXJ5dGhpbmcgdXB0byBhIGNvbW1hIGZvbGxvd2VkIGJ5IGEgbmFtZSAoc2VlIGFib3ZlKSBvciBlbmQgb2YgbGluZVxuICAgICAgICAgICAgICAvLCg/PVtcIicgXSpbXFx3LSBdK1tcIicgXSo6KXx9fCQvXG4gICAgICAgICAgICAgICkubWFwKGZ1bmN0aW9uKHBhaXIpIHtcblxuICAgICAgICAgICAgICAgIC8vIGdldCBrZXksIHZhbCBwYXJ0c1xuICAgICAgICAgICAgICAgIHJldHVybiBwYWlyLnJlcGxhY2UoL15bIFwiJ10qKC4rPylbIFwiJ10qOiAqKC4rPyksPyAqJC8sIGZ1bmN0aW9uKF8sIGssIHYpIHtcblxuICAgICAgICAgICAgICAgICAgLy8gd3JhcCBhbGwgY29uZGl0aW9uYWwgcGFydHMgdG8gaWdub3JlIGVycm9yc1xuICAgICAgICAgICAgICAgICAgcmV0dXJuIHYucmVwbGFjZSgvW14mfD0hPjxdKy9nLCB3cmFwKSArICc/XCInICsgayArICdcIjpcIlwiLCdcblxuICAgICAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgICAgfSkuam9pbignJylcblxuICAgICAgICArICddLmpvaW4oXCIgXCIpLnRyaW0oKSdcblxuICAgICAgLy8gaWYganMgZXhwcmVzc2lvbiwgZXZhbHVhdGUgYXMgamF2YXNjcmlwdFxuICAgICAgOiB3cmFwKHMsIG4pXG5cbiAgfVxuXG5cbiAgLy8gZXhlY3V0ZSBqcyB3L28gYnJlYWtpbmcgb24gZXJyb3JzIG9yIHVuZGVmaW5lZCB2YXJzXG5cbiAgZnVuY3Rpb24gd3JhcChzLCBub251bGwpIHtcbiAgICBzID0gcy50cmltKClcbiAgICByZXR1cm4gIXMgPyAnJyA6ICcoZnVuY3Rpb24odil7dHJ5e3Y9J1xuXG4gICAgICAgIC8vIHByZWZpeCB2YXJzIChuYW1lID0+IGRhdGEubmFtZSlcbiAgICAgICAgKyAocy5yZXBsYWNlKHJlVmFycywgZnVuY3Rpb24ocywgXywgdikgeyByZXR1cm4gdiA/ICcoZC4nK3YrJz09PXVuZGVmaW5lZD8nKyh0eXBlb2Ygd2luZG93ID09ICd1bmRlZmluZWQnID8gJ2dsb2JhbC4nIDogJ3dpbmRvdy4nKSt2Kyc6ZC4nK3YrJyknIDogcyB9KVxuXG4gICAgICAgICAgLy8gYnJlYWsgdGhlIGV4cHJlc3Npb24gaWYgaXRzIGVtcHR5IChyZXN1bHRpbmcgaW4gdW5kZWZpbmVkIHZhbHVlKVxuICAgICAgICAgIHx8ICd4JylcbiAgICAgICsgJ31jYXRjaChlKXsnXG4gICAgICArICd9ZmluYWxseXtyZXR1cm4gJ1xuXG4gICAgICAgIC8vIGRlZmF1bHQgdG8gZW1wdHkgc3RyaW5nIGZvciBmYWxzeSB2YWx1ZXMgZXhjZXB0IHplcm9cbiAgICAgICAgKyAobm9udWxsID09PSB0cnVlID8gJyF2JiZ2IT09MD9cIlwiOnYnIDogJ3YnKVxuXG4gICAgICArICd9fSkuY2FsbChkKSdcbiAgfVxuXG5cbiAgLy8gc3BsaXQgc3RyaW5nIGJ5IGFuIGFycmF5IG9mIHN1YnN0cmluZ3NcblxuICBmdW5jdGlvbiBzcGxpdChzdHIsIHN1YnN0cmluZ3MpIHtcbiAgICB2YXIgcGFydHMgPSBbXVxuICAgIHN1YnN0cmluZ3MubWFwKGZ1bmN0aW9uKHN1YiwgaSkge1xuXG4gICAgICAvLyBwdXNoIG1hdGNoZWQgZXhwcmVzc2lvbiBhbmQgcGFydCBiZWZvcmUgaXRcbiAgICAgIGkgPSBzdHIuaW5kZXhPZihzdWIpXG4gICAgICBwYXJ0cy5wdXNoKHN0ci5zbGljZSgwLCBpKSwgc3ViKVxuICAgICAgc3RyID0gc3RyLnNsaWNlKGkgKyBzdWIubGVuZ3RoKVxuICAgIH0pXG5cbiAgICAvLyBwdXNoIHRoZSByZW1haW5pbmcgcGFydFxuICAgIHJldHVybiBwYXJ0cy5jb25jYXQoc3RyKVxuICB9XG5cblxuICAvLyBtYXRjaCBzdHJpbmdzIGJldHdlZW4gb3BlbmluZyBhbmQgY2xvc2luZyByZWdleHAsIHNraXBwaW5nIGFueSBpbm5lci9uZXN0ZWQgbWF0Y2hlc1xuXG4gIGZ1bmN0aW9uIGV4dHJhY3Qoc3RyLCBvcGVuLCBjbG9zZSkge1xuXG4gICAgdmFyIHN0YXJ0LFxuICAgICAgICBsZXZlbCA9IDAsXG4gICAgICAgIG1hdGNoZXMgPSBbXSxcbiAgICAgICAgcmUgPSBuZXcgUmVnRXhwKCcoJytvcGVuLnNvdXJjZSsnKXwoJytjbG9zZS5zb3VyY2UrJyknLCAnZycpXG5cbiAgICBzdHIucmVwbGFjZShyZSwgZnVuY3Rpb24oXywgb3BlbiwgY2xvc2UsIHBvcykge1xuXG4gICAgICAvLyBpZiBvdXRlciBpbm5lciBicmFja2V0LCBtYXJrIHBvc2l0aW9uXG4gICAgICBpZiAoIWxldmVsICYmIG9wZW4pIHN0YXJ0ID0gcG9zXG5cbiAgICAgIC8vIGluKGRlKWNyZWFzZSBicmFja2V0IGxldmVsXG4gICAgICBsZXZlbCArPSBvcGVuID8gMSA6IC0xXG5cbiAgICAgIC8vIGlmIG91dGVyIGNsb3NpbmcgYnJhY2tldCwgZ3JhYiB0aGUgbWF0Y2hcbiAgICAgIGlmICghbGV2ZWwgJiYgY2xvc2UgIT0gbnVsbCkgbWF0Y2hlcy5wdXNoKHN0ci5zbGljZShzdGFydCwgcG9zK2Nsb3NlLmxlbmd0aCkpXG5cbiAgICB9KVxuXG4gICAgcmV0dXJuIG1hdGNoZXNcbiAgfVxuXG59KSgpXG5cbi8vIHsga2V5LCBpIGluIGl0ZW1zfSAtPiB7IGtleSwgaSwgaXRlbXMgfVxuZnVuY3Rpb24gbG9vcEtleXMoZXhwcikge1xuICB2YXIgYjAgPSBicmFja2V0cygwKSxcbiAgICAgIGVscyA9IGV4cHIudHJpbSgpLnNsaWNlKGIwLmxlbmd0aCkubWF0Y2goL15cXHMqKFxcUys/KVxccyooPzosXFxzKihcXFMrKSk/XFxzK2luXFxzKyguKykkLylcbiAgcmV0dXJuIGVscyA/IHsga2V5OiBlbHNbMV0sIHBvczogZWxzWzJdLCB2YWw6IGIwICsgZWxzWzNdIH0gOiB7IHZhbDogZXhwciB9XG59XG5cbmZ1bmN0aW9uIG1raXRlbShleHByLCBrZXksIHZhbCkge1xuICB2YXIgaXRlbSA9IHt9XG4gIGl0ZW1bZXhwci5rZXldID0ga2V5XG4gIGlmIChleHByLnBvcykgaXRlbVtleHByLnBvc10gPSB2YWxcbiAgcmV0dXJuIGl0ZW1cbn1cblxuXG4vKiBCZXdhcmU6IGhlYXZ5IHN0dWZmICovXG5mdW5jdGlvbiBfZWFjaChkb20sIHBhcmVudCwgZXhwcikge1xuXG4gIHJlbUF0dHIoZG9tLCAnZWFjaCcpXG5cbiAgdmFyIHRhZ05hbWUgPSBnZXRUYWdOYW1lKGRvbSksXG4gICAgICB0ZW1wbGF0ZSA9IGRvbS5vdXRlckhUTUwsXG4gICAgICBoYXNJbXBsID0gISF0YWdJbXBsW3RhZ05hbWVdLFxuICAgICAgaW1wbCA9IHRhZ0ltcGxbdGFnTmFtZV0gfHwge1xuICAgICAgICB0bXBsOiB0ZW1wbGF0ZVxuICAgICAgfSxcbiAgICAgIHJvb3QgPSBkb20ucGFyZW50Tm9kZSxcbiAgICAgIHBsYWNlaG9sZGVyID0gZG9jdW1lbnQuY3JlYXRlQ29tbWVudCgncmlvdCBwbGFjZWhvbGRlcicpLFxuICAgICAgdGFncyA9IFtdLFxuICAgICAgY2hpbGQgPSBnZXRUYWcoZG9tKSxcbiAgICAgIGNoZWNrc3VtXG5cbiAgcm9vdC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIGRvbSlcblxuICBleHByID0gbG9vcEtleXMoZXhwcilcblxuICAvLyBjbGVhbiB0ZW1wbGF0ZSBjb2RlXG4gIHBhcmVudFxuICAgIC5vbmUoJ3ByZW1vdW50JywgZnVuY3Rpb24gKCkge1xuICAgICAgaWYgKHJvb3Quc3R1Yikgcm9vdCA9IHBhcmVudC5yb290XG4gICAgICAvLyByZW1vdmUgdGhlIG9yaWdpbmFsIERPTSBub2RlXG4gICAgICBkb20ucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChkb20pXG4gICAgfSlcbiAgICAub24oJ3VwZGF0ZScsIGZ1bmN0aW9uICgpIHtcbiAgICAgIHZhciBpdGVtcyA9IHRtcGwoZXhwci52YWwsIHBhcmVudClcblxuICAgICAgLy8gb2JqZWN0IGxvb3AuIGFueSBjaGFuZ2VzIGNhdXNlIGZ1bGwgcmVkcmF3XG4gICAgICBpZiAoIWlzQXJyYXkoaXRlbXMpKSB7XG5cbiAgICAgICAgY2hlY2tzdW0gPSBpdGVtcyA/IEpTT04uc3RyaW5naWZ5KGl0ZW1zKSA6ICcnXG5cbiAgICAgICAgaXRlbXMgPSAhaXRlbXMgPyBbXSA6XG4gICAgICAgICAgT2JqZWN0LmtleXMoaXRlbXMpLm1hcChmdW5jdGlvbiAoa2V5KSB7XG4gICAgICAgICAgICByZXR1cm4gbWtpdGVtKGV4cHIsIGtleSwgaXRlbXNba2V5XSlcbiAgICAgICAgICB9KVxuICAgICAgfVxuXG4gICAgICB2YXIgZnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKSxcbiAgICAgICAgICBpID0gdGFncy5sZW5ndGgsXG4gICAgICAgICAgaiA9IGl0ZW1zLmxlbmd0aFxuXG4gICAgICAvLyB1bm1vdW50IGxlZnRvdmVyIGl0ZW1zXG4gICAgICB3aGlsZSAoaSA+IGopIHtcbiAgICAgICAgdGFnc1stLWldLnVubW91bnQoKVxuICAgICAgICB0YWdzLnNwbGljZShpLCAxKVxuICAgICAgfVxuXG4gICAgICBmb3IgKGkgPSAwOyBpIDwgajsgKytpKSB7XG4gICAgICAgIHZhciBfaXRlbSA9ICFjaGVja3N1bSAmJiAhIWV4cHIua2V5ID8gbWtpdGVtKGV4cHIsIGl0ZW1zW2ldLCBpKSA6IGl0ZW1zW2ldXG5cbiAgICAgICAgaWYgKCF0YWdzW2ldKSB7XG4gICAgICAgICAgLy8gbW91bnQgbmV3XG4gICAgICAgICAgKHRhZ3NbaV0gPSBuZXcgVGFnKGltcGwsIHtcbiAgICAgICAgICAgICAgcGFyZW50OiBwYXJlbnQsXG4gICAgICAgICAgICAgIGlzTG9vcDogdHJ1ZSxcbiAgICAgICAgICAgICAgaGFzSW1wbDogaGFzSW1wbCxcbiAgICAgICAgICAgICAgcm9vdDogaGFzSW1wbCA/IGRvbS5jbG9uZU5vZGUoKSA6IHJvb3QsXG4gICAgICAgICAgICAgIGl0ZW06IF9pdGVtXG4gICAgICAgICAgICB9LCBkb20uaW5uZXJIVE1MKVxuICAgICAgICAgICkubW91bnQoKVxuXG4gICAgICAgICAgZnJhZy5hcHBlbmRDaGlsZCh0YWdzW2ldLnJvb3QpXG4gICAgICAgIH0gZWxzZVxuICAgICAgICAgIHRhZ3NbaV0udXBkYXRlKF9pdGVtKVxuXG4gICAgICAgIHRhZ3NbaV0uX2l0ZW0gPSBfaXRlbVxuXG4gICAgICB9XG5cbiAgICAgIHJvb3QuaW5zZXJ0QmVmb3JlKGZyYWcsIHBsYWNlaG9sZGVyKVxuXG4gICAgICBpZiAoY2hpbGQpIHBhcmVudC50YWdzW3RhZ05hbWVdID0gdGFnc1xuXG4gICAgfSkub25lKCd1cGRhdGVkJywgZnVuY3Rpb24oKSB7XG4gICAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHBhcmVudCkvLyBvbmx5IHNldCBuZXcgdmFsdWVzXG4gICAgICB3YWxrKHJvb3QsIGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgLy8gb25seSBzZXQgZWxlbWVudCBub2RlIGFuZCBub3QgaXNMb29wXG4gICAgICAgIGlmIChub2RlLm5vZGVUeXBlID09IDEgJiYgIW5vZGUuaXNMb29wICYmICFub2RlLl9sb29wZWQpIHtcbiAgICAgICAgICBub2RlLl92aXNpdGVkID0gZmFsc2UgLy8gcmVzZXQgX3Zpc2l0ZWQgZm9yIGxvb3Agbm9kZVxuICAgICAgICAgIG5vZGUuX2xvb3BlZCA9IHRydWUgLy8gYXZvaWQgc2V0IG11bHRpcGxlIGVhY2hcbiAgICAgICAgICBzZXROYW1lZChub2RlLCBwYXJlbnQsIGtleXMpXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfSlcblxufVxuXG5cbmZ1bmN0aW9uIHBhcnNlTmFtZWRFbGVtZW50cyhyb290LCBwYXJlbnQsIGNoaWxkVGFncykge1xuXG4gIHdhbGsocm9vdCwgZnVuY3Rpb24oZG9tKSB7XG4gICAgaWYgKGRvbS5ub2RlVHlwZSA9PSAxKSB7XG4gICAgICBkb20uaXNMb29wID0gZG9tLmlzTG9vcCB8fCAoZG9tLnBhcmVudE5vZGUgJiYgZG9tLnBhcmVudE5vZGUuaXNMb29wIHx8IGRvbS5nZXRBdHRyaWJ1dGUoJ2VhY2gnKSkgPyAxIDogMFxuXG4gICAgICAvLyBjdXN0b20gY2hpbGQgdGFnXG4gICAgICB2YXIgY2hpbGQgPSBnZXRUYWcoZG9tKVxuXG4gICAgICBpZiAoY2hpbGQgJiYgIWRvbS5pc0xvb3ApIHtcbiAgICAgICAgdmFyIHRhZyA9IG5ldyBUYWcoY2hpbGQsIHsgcm9vdDogZG9tLCBwYXJlbnQ6IHBhcmVudCB9LCBkb20uaW5uZXJIVE1MKSxcbiAgICAgICAgICAgIHRhZ05hbWUgPSBnZXRUYWdOYW1lKGRvbSksXG4gICAgICAgICAgICBwdGFnID0gZ2V0SW1tZWRpYXRlQ3VzdG9tUGFyZW50VGFnKHBhcmVudCksXG4gICAgICAgICAgICBjYWNoZWRUYWdcblxuICAgICAgICAvLyBmaXggZm9yIHRoZSBwYXJlbnQgYXR0cmlidXRlIGluIHRoZSBsb29wZWQgZWxlbWVudHNcbiAgICAgICAgdGFnLnBhcmVudCA9IHB0YWdcblxuICAgICAgICBjYWNoZWRUYWcgPSBwdGFnLnRhZ3NbdGFnTmFtZV1cblxuICAgICAgICAvLyBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgY2hpbGRyZW4gdGFncyBoYXZpbmcgdGhlIHNhbWUgbmFtZVxuICAgICAgICBpZiAoY2FjaGVkVGFnKSB7XG4gICAgICAgICAgLy8gaWYgdGhlIHBhcmVudCB0YWdzIHByb3BlcnR5IGlzIG5vdCB5ZXQgYW4gYXJyYXlcbiAgICAgICAgICAvLyBjcmVhdGUgaXQgYWRkaW5nIHRoZSBmaXJzdCBjYWNoZWQgdGFnXG4gICAgICAgICAgaWYgKCFpc0FycmF5KGNhY2hlZFRhZykpXG4gICAgICAgICAgICBwdGFnLnRhZ3NbdGFnTmFtZV0gPSBbY2FjaGVkVGFnXVxuICAgICAgICAgIC8vIGFkZCB0aGUgbmV3IG5lc3RlZCB0YWcgdG8gdGhlIGFycmF5XG4gICAgICAgICAgcHRhZy50YWdzW3RhZ05hbWVdLnB1c2godGFnKVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIHB0YWcudGFnc1t0YWdOYW1lXSA9IHRhZ1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gZW1wdHkgdGhlIGNoaWxkIG5vZGUgb25jZSB3ZSBnb3QgaXRzIHRlbXBsYXRlXG4gICAgICAgIC8vIHRvIGF2b2lkIHRoYXQgaXRzIGNoaWxkcmVuIGdldCBjb21waWxlZCBtdWx0aXBsZSB0aW1lc1xuICAgICAgICBkb20uaW5uZXJIVE1MID0gJydcbiAgICAgICAgY2hpbGRUYWdzLnB1c2godGFnKVxuICAgICAgfVxuXG4gICAgICBpZiAoIWRvbS5pc0xvb3ApXG4gICAgICAgIHNldE5hbWVkKGRvbSwgcGFyZW50LCBbXSlcbiAgICB9XG5cbiAgfSlcblxufVxuXG5mdW5jdGlvbiBwYXJzZUV4cHJlc3Npb25zKHJvb3QsIHRhZywgZXhwcmVzc2lvbnMpIHtcblxuICBmdW5jdGlvbiBhZGRFeHByKGRvbSwgdmFsLCBleHRyYSkge1xuICAgIGlmICh2YWwuaW5kZXhPZihicmFja2V0cygwKSkgPj0gMCkge1xuICAgICAgdmFyIGV4cHIgPSB7IGRvbTogZG9tLCBleHByOiB2YWwgfVxuICAgICAgZXhwcmVzc2lvbnMucHVzaChleHRlbmQoZXhwciwgZXh0cmEpKVxuICAgIH1cbiAgfVxuXG4gIHdhbGsocm9vdCwgZnVuY3Rpb24oZG9tKSB7XG4gICAgdmFyIHR5cGUgPSBkb20ubm9kZVR5cGVcblxuICAgIC8vIHRleHQgbm9kZVxuICAgIGlmICh0eXBlID09IDMgJiYgZG9tLnBhcmVudE5vZGUudGFnTmFtZSAhPSAnU1RZTEUnKSBhZGRFeHByKGRvbSwgZG9tLm5vZGVWYWx1ZSlcbiAgICBpZiAodHlwZSAhPSAxKSByZXR1cm5cblxuICAgIC8qIGVsZW1lbnQgKi9cblxuICAgIC8vIGxvb3BcbiAgICB2YXIgYXR0ciA9IGRvbS5nZXRBdHRyaWJ1dGUoJ2VhY2gnKVxuXG4gICAgaWYgKGF0dHIpIHsgX2VhY2goZG9tLCB0YWcsIGF0dHIpOyByZXR1cm4gZmFsc2UgfVxuXG4gICAgLy8gYXR0cmlidXRlIGV4cHJlc3Npb25zXG4gICAgZWFjaChkb20uYXR0cmlidXRlcywgZnVuY3Rpb24oYXR0cikge1xuICAgICAgdmFyIG5hbWUgPSBhdHRyLm5hbWUsXG4gICAgICAgIGJvb2wgPSBuYW1lLnNwbGl0KCdfXycpWzFdXG5cbiAgICAgIGFkZEV4cHIoZG9tLCBhdHRyLnZhbHVlLCB7IGF0dHI6IGJvb2wgfHwgbmFtZSwgYm9vbDogYm9vbCB9KVxuICAgICAgaWYgKGJvb2wpIHsgcmVtQXR0cihkb20sIG5hbWUpOyByZXR1cm4gZmFsc2UgfVxuXG4gICAgfSlcblxuICAgIC8vIHNraXAgY3VzdG9tIHRhZ3NcbiAgICBpZiAoZ2V0VGFnKGRvbSkpIHJldHVybiBmYWxzZVxuXG4gIH0pXG5cbn1cbmZ1bmN0aW9uIFRhZyhpbXBsLCBjb25mLCBpbm5lckhUTUwpIHtcblxuICB2YXIgc2VsZiA9IHJpb3Qub2JzZXJ2YWJsZSh0aGlzKSxcbiAgICAgIG9wdHMgPSBpbmhlcml0KGNvbmYub3B0cykgfHwge30sXG4gICAgICBkb20gPSBta2RvbShpbXBsLnRtcGwpLFxuICAgICAgcGFyZW50ID0gY29uZi5wYXJlbnQsXG4gICAgICBpc0xvb3AgPSBjb25mLmlzTG9vcCxcbiAgICAgIGhhc0ltcGwgPSBjb25mLmhhc0ltcGwsXG4gICAgICBpdGVtID0gY2xlYW5VcERhdGEoY29uZi5pdGVtKSxcbiAgICAgIGV4cHJlc3Npb25zID0gW10sXG4gICAgICBjaGlsZFRhZ3MgPSBbXSxcbiAgICAgIHJvb3QgPSBjb25mLnJvb3QsXG4gICAgICBmbiA9IGltcGwuZm4sXG4gICAgICB0YWdOYW1lID0gcm9vdC50YWdOYW1lLnRvTG93ZXJDYXNlKCksXG4gICAgICBhdHRyID0ge30sXG4gICAgICBwcm9wc0luU3luY1dpdGhQYXJlbnQgPSBbXSxcbiAgICAgIGxvb3BEb21cblxuXG4gIGlmIChmbiAmJiByb290Ll90YWcpIHtcbiAgICByb290Ll90YWcudW5tb3VudCh0cnVlKVxuICB9XG5cbiAgLy8gbm90IHlldCBtb3VudGVkXG4gIHRoaXMuaXNNb3VudGVkID0gZmFsc2VcbiAgcm9vdC5pc0xvb3AgPSBpc0xvb3BcblxuICAvLyBrZWVwIGEgcmVmZXJlbmNlIHRvIHRoZSB0YWcganVzdCBjcmVhdGVkXG4gIC8vIHNvIHdlIHdpbGwgYmUgYWJsZSB0byBtb3VudCB0aGlzIHRhZyBtdWx0aXBsZSB0aW1lc1xuICByb290Ll90YWcgPSB0aGlzXG5cbiAgLy8gY3JlYXRlIGEgdW5pcXVlIGlkIHRvIHRoaXMgdGFnXG4gIC8vIGl0IGNvdWxkIGJlIGhhbmR5IHRvIHVzZSBpdCBhbHNvIHRvIGltcHJvdmUgdGhlIHZpcnR1YWwgZG9tIHJlbmRlcmluZyBzcGVlZFxuICB0aGlzLl9pZCA9IF9fdWlkKytcblxuICBleHRlbmQodGhpcywgeyBwYXJlbnQ6IHBhcmVudCwgcm9vdDogcm9vdCwgb3B0czogb3B0cywgdGFnczoge30gfSwgaXRlbSlcblxuICAvLyBncmFiIGF0dHJpYnV0ZXNcbiAgZWFjaChyb290LmF0dHJpYnV0ZXMsIGZ1bmN0aW9uKGVsKSB7XG4gICAgdmFyIHZhbCA9IGVsLnZhbHVlXG4gICAgLy8gcmVtZW1iZXIgYXR0cmlidXRlcyB3aXRoIGV4cHJlc3Npb25zIG9ubHlcbiAgICBpZiAoYnJhY2tldHMoL1xcey4qXFx9LykudGVzdCh2YWwpKSBhdHRyW2VsLm5hbWVdID0gdmFsXG4gIH0pXG5cbiAgaWYgKGRvbS5pbm5lckhUTUwgJiYgIS9zZWxlY3R8b3B0Z3JvdXB8dGJvZHl8dHIvLnRlc3QodGFnTmFtZSkpXG4gICAgLy8gcmVwbGFjZSBhbGwgdGhlIHlpZWxkIHRhZ3Mgd2l0aCB0aGUgdGFnIGlubmVyIGh0bWxcbiAgICBkb20uaW5uZXJIVE1MID0gcmVwbGFjZVlpZWxkKGRvbS5pbm5lckhUTUwsIGlubmVySFRNTClcblxuICAvLyBvcHRpb25zXG4gIGZ1bmN0aW9uIHVwZGF0ZU9wdHMoKSB7XG4gICAgdmFyIGN0eCA9IGhhc0ltcGwgJiYgaXNMb29wID8gc2VsZiA6IHBhcmVudCB8fCBzZWxmXG5cbiAgICAvLyB1cGRhdGUgb3B0cyBmcm9tIGN1cnJlbnQgRE9NIGF0dHJpYnV0ZXNcbiAgICBlYWNoKHJvb3QuYXR0cmlidXRlcywgZnVuY3Rpb24oZWwpIHtcbiAgICAgIG9wdHNbZWwubmFtZV0gPSB0bXBsKGVsLnZhbHVlLCBjdHgpXG4gICAgfSlcbiAgICAvLyByZWNvdmVyIHRob3NlIHdpdGggZXhwcmVzc2lvbnNcbiAgICBlYWNoKE9iamVjdC5rZXlzKGF0dHIpLCBmdW5jdGlvbihuYW1lKSB7XG4gICAgICBvcHRzW25hbWVdID0gY2xlYW5VcERhdGEodG1wbChhdHRyW25hbWVdLCBjdHgpKVxuICAgIH0pXG4gIH1cblxuICBmdW5jdGlvbiBub3JtYWxpemVEYXRhKGRhdGEpIHtcbiAgICBmb3IgKHZhciBrZXkgaW4gaXRlbSkge1xuICAgICAgaWYgKHR5cGVvZiBzZWxmW2tleV0gIT09IFRfVU5ERUYpXG4gICAgICAgIHNlbGZba2V5XSA9IGRhdGFba2V5XVxuICAgIH1cbiAgfVxuXG4gIGZ1bmN0aW9uIGluaGVyaXRGcm9tUGFyZW50ICgpIHtcbiAgICBpZiAoIXNlbGYucGFyZW50IHx8ICFpc0xvb3ApIHJldHVyblxuICAgIGVhY2goT2JqZWN0LmtleXMoc2VsZi5wYXJlbnQpLCBmdW5jdGlvbihrKSB7XG4gICAgICAvLyBzb21lIHByb3BlcnRpZXMgbXVzdCBiZSBhbHdheXMgaW4gc3luYyB3aXRoIHRoZSBwYXJlbnQgdGFnXG4gICAgICB2YXIgbXVzdFN5bmMgPSB+cHJvcHNJblN5bmNXaXRoUGFyZW50LmluZGV4T2YoaylcbiAgICAgIGlmICh0eXBlb2Ygc2VsZltrXSA9PT0gVF9VTkRFRiB8fCBtdXN0U3luYykge1xuICAgICAgICAvLyB0cmFjayB0aGUgcHJvcGVydHkgdG8ga2VlcCBpbiBzeW5jXG4gICAgICAgIC8vIHNvIHdlIGNhbiBrZWVwIGl0IHVwZGF0ZWRcbiAgICAgICAgaWYgKCFtdXN0U3luYykgcHJvcHNJblN5bmNXaXRoUGFyZW50LnB1c2goaylcbiAgICAgICAgc2VsZltrXSA9IHNlbGYucGFyZW50W2tdXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG4gIHRoaXMudXBkYXRlID0gZnVuY3Rpb24oZGF0YSkge1xuICAgIC8vIG1ha2Ugc3VyZSB0aGUgZGF0YSBwYXNzZWQgd2lsbCBub3Qgb3ZlcnJpZGVcbiAgICAvLyB0aGUgY29tcG9uZW50IGNvcmUgbWV0aG9kc1xuICAgIGRhdGEgPSBjbGVhblVwRGF0YShkYXRhKVxuICAgIC8vIGluaGVyaXQgcHJvcGVydGllcyBmcm9tIHRoZSBwYXJlbnRcbiAgICBpbmhlcml0RnJvbVBhcmVudCgpXG4gICAgLy8gbm9ybWFsaXplIHRoZSB0YWcgcHJvcGVydGllcyBpbiBjYXNlIGFuIGl0ZW0gb2JqZWN0IHdhcyBpbml0aWFsbHkgcGFzc2VkXG4gICAgaWYgKHR5cGVvZiBpdGVtID09PSBUX09CSkVDVCkge1xuICAgICAgbm9ybWFsaXplRGF0YShkYXRhIHx8IHt9KVxuICAgICAgaXRlbSA9IGRhdGFcbiAgICB9XG4gICAgZXh0ZW5kKHNlbGYsIGRhdGEpXG4gICAgdXBkYXRlT3B0cygpXG4gICAgc2VsZi50cmlnZ2VyKCd1cGRhdGUnLCBkYXRhKVxuICAgIHVwZGF0ZShleHByZXNzaW9ucywgc2VsZilcbiAgICBzZWxmLnRyaWdnZXIoJ3VwZGF0ZWQnKVxuICB9XG5cbiAgdGhpcy5taXhpbiA9IGZ1bmN0aW9uKCkge1xuICAgIGVhY2goYXJndW1lbnRzLCBmdW5jdGlvbihtaXgpIHtcbiAgICAgIG1peCA9IHR5cGVvZiBtaXggPT09IFRfU1RSSU5HID8gcmlvdC5taXhpbihtaXgpIDogbWl4XG4gICAgICBlYWNoKE9iamVjdC5rZXlzKG1peCksIGZ1bmN0aW9uKGtleSkge1xuICAgICAgICAvLyBiaW5kIG1ldGhvZHMgdG8gc2VsZlxuICAgICAgICBpZiAoa2V5ICE9ICdpbml0JylcbiAgICAgICAgICBzZWxmW2tleV0gPSBpc0Z1bmN0aW9uKG1peFtrZXldKSA/IG1peFtrZXldLmJpbmQoc2VsZikgOiBtaXhba2V5XVxuICAgICAgfSlcbiAgICAgIC8vIGluaXQgbWV0aG9kIHdpbGwgYmUgY2FsbGVkIGF1dG9tYXRpY2FsbHlcbiAgICAgIGlmIChtaXguaW5pdCkgbWl4LmluaXQuYmluZChzZWxmKSgpXG4gICAgfSlcbiAgfVxuXG4gIHRoaXMubW91bnQgPSBmdW5jdGlvbigpIHtcblxuICAgIHVwZGF0ZU9wdHMoKVxuXG4gICAgLy8gaW5pdGlhbGlhdGlvblxuICAgIGZuICYmIGZuLmNhbGwoc2VsZiwgb3B0cylcblxuICAgIC8vIHBhcnNlIGxheW91dCBhZnRlciBpbml0LiBmbiBtYXkgY2FsY3VsYXRlIGFyZ3MgZm9yIG5lc3RlZCBjdXN0b20gdGFnc1xuICAgIHBhcnNlRXhwcmVzc2lvbnMoZG9tLCBzZWxmLCBleHByZXNzaW9ucylcblxuICAgIC8vIG1vdW50IHRoZSBjaGlsZCB0YWdzXG4gICAgdG9nZ2xlKHRydWUpXG5cbiAgICAvLyB1cGRhdGUgdGhlIHJvb3QgYWRkaW5nIGN1c3RvbSBhdHRyaWJ1dGVzIGNvbWluZyBmcm9tIHRoZSBjb21waWxlclxuICAgIGlmIChpbXBsLmF0dHJzKSB7XG4gICAgICB3YWxrQXR0cmlidXRlcyhpbXBsLmF0dHJzLCBmdW5jdGlvbiAoaywgdikgeyByb290LnNldEF0dHJpYnV0ZShrLCB2KSB9KVxuICAgICAgcGFyc2VFeHByZXNzaW9ucyhzZWxmLnJvb3QsIHNlbGYsIGV4cHJlc3Npb25zKVxuICAgIH1cblxuICAgIGlmICghc2VsZi5wYXJlbnQgfHwgaXNMb29wKSBzZWxmLnVwZGF0ZShpdGVtKVxuXG4gICAgLy8gaW50ZXJuYWwgdXNlIG9ubHksIGZpeGVzICM0MDNcbiAgICBzZWxmLnRyaWdnZXIoJ3ByZW1vdW50JylcblxuICAgIGlmIChpc0xvb3AgJiYgIWhhc0ltcGwpIHtcbiAgICAgIC8vIHVwZGF0ZSB0aGUgcm9vdCBhdHRyaWJ1dGUgZm9yIHRoZSBsb29wZWQgZWxlbWVudHNcbiAgICAgIHNlbGYucm9vdCA9IHJvb3QgPSBsb29wRG9tID0gZG9tLmZpcnN0Q2hpbGRcblxuICAgIH0gZWxzZSB7XG4gICAgICB3aGlsZSAoZG9tLmZpcnN0Q2hpbGQpIHJvb3QuYXBwZW5kQ2hpbGQoZG9tLmZpcnN0Q2hpbGQpXG4gICAgICBpZiAocm9vdC5zdHViKSBzZWxmLnJvb3QgPSByb290ID0gcGFyZW50LnJvb3RcbiAgICB9XG4gICAgLy8gaWYgaXQncyBub3QgYSBjaGlsZCB0YWcgd2UgY2FuIHRyaWdnZXIgaXRzIG1vdW50IGV2ZW50XG4gICAgaWYgKCFzZWxmLnBhcmVudCB8fCBzZWxmLnBhcmVudC5pc01vdW50ZWQpIHtcbiAgICAgIHNlbGYuaXNNb3VudGVkID0gdHJ1ZVxuICAgICAgc2VsZi50cmlnZ2VyKCdtb3VudCcpXG4gICAgfVxuICAgIC8vIG90aGVyd2lzZSB3ZSBuZWVkIHRvIHdhaXQgdGhhdCB0aGUgcGFyZW50IGV2ZW50IGdldHMgdHJpZ2dlcmVkXG4gICAgZWxzZSBzZWxmLnBhcmVudC5vbmUoJ21vdW50JywgZnVuY3Rpb24oKSB7XG4gICAgICAvLyBhdm9pZCB0byB0cmlnZ2VyIHRoZSBgbW91bnRgIGV2ZW50IGZvciB0aGUgdGFnc1xuICAgICAgLy8gbm90IHZpc2libGUgaW5jbHVkZWQgaW4gYW4gaWYgc3RhdGVtZW50XG4gICAgICBpZiAoIWlzSW5TdHViKHNlbGYucm9vdCkpIHtcbiAgICAgICAgc2VsZi5wYXJlbnQuaXNNb3VudGVkID0gc2VsZi5pc01vdW50ZWQgPSB0cnVlXG4gICAgICAgIHNlbGYudHJpZ2dlcignbW91bnQnKVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuXG4gIHRoaXMudW5tb3VudCA9IGZ1bmN0aW9uKGtlZXBSb290VGFnKSB7XG4gICAgdmFyIGVsID0gbG9vcERvbSB8fCByb290LFxuICAgICAgICBwID0gZWwucGFyZW50Tm9kZSxcbiAgICAgICAgcHRhZ1xuXG4gICAgaWYgKHApIHtcblxuICAgICAgaWYgKHBhcmVudCkge1xuICAgICAgICBwdGFnID0gZ2V0SW1tZWRpYXRlQ3VzdG9tUGFyZW50VGFnKHBhcmVudClcbiAgICAgICAgLy8gcmVtb3ZlIHRoaXMgdGFnIGZyb20gdGhlIHBhcmVudCB0YWdzIG9iamVjdFxuICAgICAgICAvLyBpZiB0aGVyZSBhcmUgbXVsdGlwbGUgbmVzdGVkIHRhZ3Mgd2l0aCBzYW1lIG5hbWUuLlxuICAgICAgICAvLyByZW1vdmUgdGhpcyBlbGVtZW50IGZvcm0gdGhlIGFycmF5XG4gICAgICAgIGlmIChpc0FycmF5KHB0YWcudGFnc1t0YWdOYW1lXSkpXG4gICAgICAgICAgZWFjaChwdGFnLnRhZ3NbdGFnTmFtZV0sIGZ1bmN0aW9uKHRhZywgaSkge1xuICAgICAgICAgICAgaWYgKHRhZy5faWQgPT0gc2VsZi5faWQpXG4gICAgICAgICAgICAgIHB0YWcudGFnc1t0YWdOYW1lXS5zcGxpY2UoaSwgMSlcbiAgICAgICAgICB9KVxuICAgICAgICBlbHNlXG4gICAgICAgICAgLy8gb3RoZXJ3aXNlIGp1c3QgZGVsZXRlIHRoZSB0YWcgaW5zdGFuY2VcbiAgICAgICAgICBwdGFnLnRhZ3NbdGFnTmFtZV0gPSB1bmRlZmluZWRcbiAgICAgIH1cblxuICAgICAgZWxzZVxuICAgICAgICB3aGlsZSAoZWwuZmlyc3RDaGlsZCkgZWwucmVtb3ZlQ2hpbGQoZWwuZmlyc3RDaGlsZClcblxuICAgICAgaWYgKCFrZWVwUm9vdFRhZylcbiAgICAgICAgcC5yZW1vdmVDaGlsZChlbClcblxuICAgIH1cblxuXG4gICAgc2VsZi50cmlnZ2VyKCd1bm1vdW50JylcbiAgICB0b2dnbGUoKVxuICAgIHNlbGYub2ZmKCcqJylcbiAgICAvLyBzb21laG93IGllOCBkb2VzIG5vdCBsaWtlIGBkZWxldGUgcm9vdC5fdGFnYFxuICAgIHJvb3QuX3RhZyA9IG51bGxcblxuICB9XG5cbiAgZnVuY3Rpb24gdG9nZ2xlKGlzTW91bnQpIHtcblxuICAgIC8vIG1vdW50L3VubW91bnQgY2hpbGRyZW5cbiAgICBlYWNoKGNoaWxkVGFncywgZnVuY3Rpb24oY2hpbGQpIHsgY2hpbGRbaXNNb3VudCA/ICdtb3VudCcgOiAndW5tb3VudCddKCkgfSlcblxuICAgIC8vIGxpc3Rlbi91bmxpc3RlbiBwYXJlbnQgKGV2ZW50cyBmbG93IG9uZSB3YXkgZnJvbSBwYXJlbnQgdG8gY2hpbGRyZW4pXG4gICAgaWYgKHBhcmVudCkge1xuICAgICAgdmFyIGV2dCA9IGlzTW91bnQgPyAnb24nIDogJ29mZidcblxuICAgICAgLy8gdGhlIGxvb3AgdGFncyB3aWxsIGJlIGFsd2F5cyBpbiBzeW5jIHdpdGggdGhlIHBhcmVudCBhdXRvbWF0aWNhbGx5XG4gICAgICBpZiAoaXNMb29wKVxuICAgICAgICBwYXJlbnRbZXZ0XSgndW5tb3VudCcsIHNlbGYudW5tb3VudClcbiAgICAgIGVsc2VcbiAgICAgICAgcGFyZW50W2V2dF0oJ3VwZGF0ZScsIHNlbGYudXBkYXRlKVtldnRdKCd1bm1vdW50Jywgc2VsZi51bm1vdW50KVxuICAgIH1cbiAgfVxuXG4gIC8vIG5hbWVkIGVsZW1lbnRzIGF2YWlsYWJsZSBmb3IgZm5cbiAgcGFyc2VOYW1lZEVsZW1lbnRzKGRvbSwgdGhpcywgY2hpbGRUYWdzKVxuXG5cbn1cblxuZnVuY3Rpb24gc2V0RXZlbnRIYW5kbGVyKG5hbWUsIGhhbmRsZXIsIGRvbSwgdGFnKSB7XG5cbiAgZG9tW25hbWVdID0gZnVuY3Rpb24oZSkge1xuXG4gICAgdmFyIGl0ZW0gPSB0YWcuX2l0ZW0sXG4gICAgICAgIHB0YWcgPSB0YWcucGFyZW50LFxuICAgICAgICBlbFxuXG4gICAgaWYgKCFpdGVtKVxuICAgICAgd2hpbGUgKHB0YWcpIHtcbiAgICAgICAgaXRlbSA9IHB0YWcuX2l0ZW1cbiAgICAgICAgcHRhZyA9IGl0ZW0gPyBmYWxzZSA6IHB0YWcucGFyZW50XG4gICAgICB9XG5cbiAgICAvLyBjcm9zcyBicm93c2VyIGV2ZW50IGZpeFxuICAgIGUgPSBlIHx8IHdpbmRvdy5ldmVudFxuXG4gICAgLy8gaWdub3JlIGVycm9yIG9uIHNvbWUgYnJvd3NlcnNcbiAgICB0cnkge1xuICAgICAgZS5jdXJyZW50VGFyZ2V0ID0gZG9tXG4gICAgICBpZiAoIWUudGFyZ2V0KSBlLnRhcmdldCA9IGUuc3JjRWxlbWVudFxuICAgICAgaWYgKCFlLndoaWNoKSBlLndoaWNoID0gZS5jaGFyQ29kZSB8fCBlLmtleUNvZGVcbiAgICB9IGNhdGNoIChpZ25vcmVkKSB7ICcnIH1cblxuICAgIGUuaXRlbSA9IGl0ZW1cblxuICAgIC8vIHByZXZlbnQgZGVmYXVsdCBiZWhhdmlvdXIgKGJ5IGRlZmF1bHQpXG4gICAgaWYgKGhhbmRsZXIuY2FsbCh0YWcsIGUpICE9PSB0cnVlICYmICEvcmFkaW98Y2hlY2svLnRlc3QoZG9tLnR5cGUpKSB7XG4gICAgICBlLnByZXZlbnREZWZhdWx0ICYmIGUucHJldmVudERlZmF1bHQoKVxuICAgICAgZS5yZXR1cm5WYWx1ZSA9IGZhbHNlXG4gICAgfVxuXG4gICAgaWYgKCFlLnByZXZlbnRVcGRhdGUpIHtcbiAgICAgIGVsID0gaXRlbSA/IGdldEltbWVkaWF0ZUN1c3RvbVBhcmVudFRhZyhwdGFnKSA6IHRhZ1xuICAgICAgZWwudXBkYXRlKClcbiAgICB9XG5cbiAgfVxuXG59XG5cbi8vIHVzZWQgYnkgaWYtIGF0dHJpYnV0ZVxuZnVuY3Rpb24gaW5zZXJ0VG8ocm9vdCwgbm9kZSwgYmVmb3JlKSB7XG4gIGlmIChyb290KSB7XG4gICAgcm9vdC5pbnNlcnRCZWZvcmUoYmVmb3JlLCBub2RlKVxuICAgIHJvb3QucmVtb3ZlQ2hpbGQobm9kZSlcbiAgfVxufVxuXG5mdW5jdGlvbiB1cGRhdGUoZXhwcmVzc2lvbnMsIHRhZykge1xuXG4gIGVhY2goZXhwcmVzc2lvbnMsIGZ1bmN0aW9uKGV4cHIsIGkpIHtcblxuICAgIHZhciBkb20gPSBleHByLmRvbSxcbiAgICAgICAgYXR0ck5hbWUgPSBleHByLmF0dHIsXG4gICAgICAgIHZhbHVlID0gdG1wbChleHByLmV4cHIsIHRhZyksXG4gICAgICAgIHBhcmVudCA9IGV4cHIuZG9tLnBhcmVudE5vZGVcblxuICAgIGlmICh2YWx1ZSA9PSBudWxsKSB2YWx1ZSA9ICcnXG5cbiAgICAvLyBsZWF2ZSBvdXQgcmlvdC0gcHJlZml4ZXMgZnJvbSBzdHJpbmdzIGluc2lkZSB0ZXh0YXJlYVxuICAgIGlmIChwYXJlbnQgJiYgcGFyZW50LnRhZ05hbWUgPT0gJ1RFWFRBUkVBJykgdmFsdWUgPSB2YWx1ZS5yZXBsYWNlKC9yaW90LS9nLCAnJylcblxuICAgIC8vIG5vIGNoYW5nZVxuICAgIGlmIChleHByLnZhbHVlID09PSB2YWx1ZSkgcmV0dXJuXG4gICAgZXhwci52YWx1ZSA9IHZhbHVlXG5cbiAgICAvLyB0ZXh0IG5vZGVcbiAgICBpZiAoIWF0dHJOYW1lKSByZXR1cm4gZG9tLm5vZGVWYWx1ZSA9IHZhbHVlLnRvU3RyaW5nKClcblxuICAgIC8vIHJlbW92ZSBvcmlnaW5hbCBhdHRyaWJ1dGVcbiAgICByZW1BdHRyKGRvbSwgYXR0ck5hbWUpXG4gICAgLy8gZXZlbnQgaGFuZGxlclxuICAgIGlmIChpc0Z1bmN0aW9uKHZhbHVlKSkge1xuICAgICAgc2V0RXZlbnRIYW5kbGVyKGF0dHJOYW1lLCB2YWx1ZSwgZG9tLCB0YWcpXG5cbiAgICAvLyBpZi0gY29uZGl0aW9uYWxcbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lID09ICdpZicpIHtcbiAgICAgIHZhciBzdHViID0gZXhwci5zdHViXG5cbiAgICAgIC8vIGFkZCB0byBET01cbiAgICAgIGlmICh2YWx1ZSkge1xuICAgICAgICBpZiAoc3R1Yikge1xuICAgICAgICAgIGluc2VydFRvKHN0dWIucGFyZW50Tm9kZSwgc3R1YiwgZG9tKVxuICAgICAgICAgIGRvbS5pblN0dWIgPSBmYWxzZVxuICAgICAgICAgIC8vIGF2b2lkIHRvIHRyaWdnZXIgdGhlIG1vdW50IGV2ZW50IGlmIHRoZSB0YWdzIGlzIG5vdCB2aXNpYmxlIHlldFxuICAgICAgICAgIC8vIG1heWJlIHdlIGNhbiBvcHRpbWl6ZSB0aGlzIGF2b2lkaW5nIHRvIG1vdW50IHRoZSB0YWcgYXQgYWxsXG4gICAgICAgICAgaWYgKCFpc0luU3R1Yihkb20pKSB7XG4gICAgICAgICAgICB3YWxrKGRvbSwgZnVuY3Rpb24oZWwpIHtcbiAgICAgICAgICAgICAgaWYgKGVsLl90YWcgJiYgIWVsLl90YWcuaXNNb3VudGVkKSBlbC5fdGFnLmlzTW91bnRlZCA9ICEhZWwuX3RhZy50cmlnZ2VyKCdtb3VudCcpXG4gICAgICAgICAgICB9KVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgLy8gcmVtb3ZlIGZyb20gRE9NXG4gICAgICB9IGVsc2Uge1xuICAgICAgICBzdHViID0gZXhwci5zdHViID0gc3R1YiB8fCBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZSgnJylcbiAgICAgICAgaW5zZXJ0VG8oZG9tLnBhcmVudE5vZGUsIGRvbSwgc3R1YilcbiAgICAgICAgZG9tLmluU3R1YiA9IHRydWVcbiAgICAgIH1cbiAgICAvLyBzaG93IC8gaGlkZVxuICAgIH0gZWxzZSBpZiAoL14oc2hvd3xoaWRlKSQvLnRlc3QoYXR0ck5hbWUpKSB7XG4gICAgICBpZiAoYXR0ck5hbWUgPT0gJ2hpZGUnKSB2YWx1ZSA9ICF2YWx1ZVxuICAgICAgZG9tLnN0eWxlLmRpc3BsYXkgPSB2YWx1ZSA/ICcnIDogJ25vbmUnXG5cbiAgICAvLyBmaWVsZCB2YWx1ZVxuICAgIH0gZWxzZSBpZiAoYXR0ck5hbWUgPT0gJ3ZhbHVlJykge1xuICAgICAgZG9tLnZhbHVlID0gdmFsdWVcblxuICAgIC8vIDxpbWcgc3JjPVwieyBleHByIH1cIj5cbiAgICB9IGVsc2UgaWYgKGF0dHJOYW1lLnNsaWNlKDAsIDUpID09ICdyaW90LScgJiYgYXR0ck5hbWUgIT0gJ3Jpb3QtdGFnJykge1xuICAgICAgYXR0ck5hbWUgPSBhdHRyTmFtZS5zbGljZSg1KVxuICAgICAgdmFsdWUgPyBkb20uc2V0QXR0cmlidXRlKGF0dHJOYW1lLCB2YWx1ZSkgOiByZW1BdHRyKGRvbSwgYXR0ck5hbWUpXG5cbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKGV4cHIuYm9vbCkge1xuICAgICAgICBkb21bYXR0ck5hbWVdID0gdmFsdWVcbiAgICAgICAgaWYgKCF2YWx1ZSkgcmV0dXJuXG4gICAgICAgIHZhbHVlID0gYXR0ck5hbWVcbiAgICAgIH1cblxuICAgICAgaWYgKHR5cGVvZiB2YWx1ZSAhPT0gVF9PQkpFQ1QpIGRvbS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIHZhbHVlKVxuXG4gICAgfVxuXG4gIH0pXG5cbn1cbmZ1bmN0aW9uIGVhY2goZWxzLCBmbikge1xuICBmb3IgKHZhciBpID0gMCwgbGVuID0gKGVscyB8fCBbXSkubGVuZ3RoLCBlbDsgaSA8IGxlbjsgaSsrKSB7XG4gICAgZWwgPSBlbHNbaV1cbiAgICAvLyByZXR1cm4gZmFsc2UgLT4gcmVtb3ZlIGN1cnJlbnQgaXRlbSBkdXJpbmcgbG9vcFxuICAgIGlmIChlbCAhPSBudWxsICYmIGZuKGVsLCBpKSA9PT0gZmFsc2UpIGktLVxuICB9XG4gIHJldHVybiBlbHNcbn1cblxuZnVuY3Rpb24gaXNGdW5jdGlvbih2KSB7XG4gIHJldHVybiB0eXBlb2YgdiA9PT0gVF9GVU5DVElPTiB8fCBmYWxzZSAgIC8vIGF2b2lkIElFIHByb2JsZW1zXG59XG5cbmZ1bmN0aW9uIHJlbUF0dHIoZG9tLCBuYW1lKSB7XG4gIGRvbS5yZW1vdmVBdHRyaWJ1dGUobmFtZSlcbn1cblxuZnVuY3Rpb24gZ2V0VGFnKGRvbSkge1xuICByZXR1cm4gdGFnSW1wbFtkb20uZ2V0QXR0cmlidXRlKFJJT1RfVEFHKSB8fCBkb20udGFnTmFtZS50b0xvd2VyQ2FzZSgpXVxufVxuXG5mdW5jdGlvbiBnZXRJbW1lZGlhdGVDdXN0b21QYXJlbnRUYWcodGFnKSB7XG4gIHZhciBwdGFnID0gdGFnXG4gIHdoaWxlICghZ2V0VGFnKHB0YWcucm9vdCkpIHtcbiAgICBpZiAoIXB0YWcucGFyZW50KSBicmVha1xuICAgIHB0YWcgPSBwdGFnLnBhcmVudFxuICB9XG4gIHJldHVybiBwdGFnXG59XG5cbmZ1bmN0aW9uIGdldFRhZ05hbWUoZG9tKSB7XG4gIHZhciBjaGlsZCA9IGdldFRhZyhkb20pLFxuICAgIG5hbWVkVGFnID0gZG9tLmdldEF0dHJpYnV0ZSgnbmFtZScpLFxuICAgIHRhZ05hbWUgPSBuYW1lZFRhZyAmJiBuYW1lZFRhZy5pbmRleE9mKGJyYWNrZXRzKDApKSA8IDAgPyBuYW1lZFRhZyA6IGNoaWxkID8gY2hpbGQubmFtZSA6IGRvbS50YWdOYW1lLnRvTG93ZXJDYXNlKClcblxuICByZXR1cm4gdGFnTmFtZVxufVxuXG5mdW5jdGlvbiBleHRlbmQoc3JjKSB7XG4gIHZhciBvYmosIGFyZ3MgPSBhcmd1bWVudHNcbiAgZm9yICh2YXIgaSA9IDE7IGkgPCBhcmdzLmxlbmd0aDsgKytpKSB7XG4gICAgaWYgKChvYmogPSBhcmdzW2ldKSkge1xuICAgICAgZm9yICh2YXIga2V5IGluIG9iaikgeyAgICAgIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZ3VhcmQtZm9yLWluXG4gICAgICAgIHNyY1trZXldID0gb2JqW2tleV1cbiAgICAgIH1cbiAgICB9XG4gIH1cbiAgcmV0dXJuIHNyY1xufVxuXG4vLyB3aXRoIHRoaXMgZnVuY3Rpb24gd2UgYXZvaWQgdGhhdCB0aGUgY3VycmVudCBUYWcgbWV0aG9kcyBnZXQgb3ZlcnJpZGRlblxuZnVuY3Rpb24gY2xlYW5VcERhdGEoZGF0YSkge1xuICBpZiAoIShkYXRhIGluc3RhbmNlb2YgVGFnKSAmJiAhKGRhdGEgJiYgdHlwZW9mIGRhdGEudHJpZ2dlciA9PSBUX0ZVTkNUSU9OKSkgcmV0dXJuIGRhdGFcblxuICB2YXIgbyA9IHt9XG4gIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgaWYgKCF+UkVTRVJWRURfV09SRFNfQkxBQ0tMSVNULmluZGV4T2Yoa2V5KSlcbiAgICAgIG9ba2V5XSA9IGRhdGFba2V5XVxuICB9XG4gIHJldHVybiBvXG59XG5cbmZ1bmN0aW9uIG1rZG9tKHRlbXBsYXRlKSB7XG4gIHZhciBjaGVja2llID0gaWVWZXJzaW9uICYmIGllVmVyc2lvbiA8IDEwLFxuICAgICAgbWF0Y2hlcyA9IC9eXFxzKjwoW1xcdy1dKykvLmV4ZWModGVtcGxhdGUpLFxuICAgICAgdGFnTmFtZSA9IG1hdGNoZXMgPyBtYXRjaGVzWzFdLnRvTG93ZXJDYXNlKCkgOiAnJyxcbiAgICAgIHJvb3RUYWcgPSAodGFnTmFtZSA9PT0gJ3RoJyB8fCB0YWdOYW1lID09PSAndGQnKSA/ICd0cicgOlxuICAgICAgICAgICAgICAgICh0YWdOYW1lID09PSAndHInID8gJ3Rib2R5JyA6ICdkaXYnKSxcbiAgICAgIGVsID0gbWtFbChyb290VGFnKVxuXG4gIGVsLnN0dWIgPSB0cnVlXG5cbiAgaWYgKGNoZWNraWUpIHtcbiAgICBpZiAodGFnTmFtZSA9PT0gJ29wdGdyb3VwJylcbiAgICAgIG9wdGdyb3VwSW5uZXJIVE1MKGVsLCB0ZW1wbGF0ZSlcbiAgICBlbHNlIGlmICh0YWdOYW1lID09PSAnb3B0aW9uJylcbiAgICAgIG9wdGlvbklubmVySFRNTChlbCwgdGVtcGxhdGUpXG4gICAgZWxzZSBpZiAocm9vdFRhZyAhPT0gJ2RpdicpXG4gICAgICB0Ym9keUlubmVySFRNTChlbCwgdGVtcGxhdGUsIHRhZ05hbWUpXG4gICAgZWxzZVxuICAgICAgY2hlY2tpZSA9IDBcbiAgfVxuICBpZiAoIWNoZWNraWUpIGVsLmlubmVySFRNTCA9IHRlbXBsYXRlXG5cbiAgcmV0dXJuIGVsXG59XG5cbmZ1bmN0aW9uIHdhbGsoZG9tLCBmbikge1xuICBpZiAoZG9tKSB7XG4gICAgaWYgKGZuKGRvbSkgPT09IGZhbHNlKSB3YWxrKGRvbS5uZXh0U2libGluZywgZm4pXG4gICAgZWxzZSB7XG4gICAgICBkb20gPSBkb20uZmlyc3RDaGlsZFxuXG4gICAgICB3aGlsZSAoZG9tKSB7XG4gICAgICAgIHdhbGsoZG9tLCBmbilcbiAgICAgICAgZG9tID0gZG9tLm5leHRTaWJsaW5nXG4gICAgICB9XG4gICAgfVxuICB9XG59XG5cbi8vIG1pbmltaXplIHJpc2s6IG9ubHkgemVybyBvciBvbmUgX3NwYWNlXyBiZXR3ZWVuIGF0dHIgJiB2YWx1ZVxuZnVuY3Rpb24gd2Fsa0F0dHJpYnV0ZXMoaHRtbCwgZm4pIHtcbiAgdmFyIG0sXG4gICAgICByZSA9IC8oWy1cXHddKykgPz0gPyg/OlwiKFteXCJdKil8JyhbXiddKil8KHtbXn1dKn0pKS9nXG5cbiAgd2hpbGUgKChtID0gcmUuZXhlYyhodG1sKSkpIHtcbiAgICBmbihtWzFdLnRvTG93ZXJDYXNlKCksIG1bMl0gfHwgbVszXSB8fCBtWzRdKVxuICB9XG59XG5cbmZ1bmN0aW9uIGlzSW5TdHViKGRvbSkge1xuICB3aGlsZSAoZG9tKSB7XG4gICAgaWYgKGRvbS5pblN0dWIpIHJldHVybiB0cnVlXG4gICAgZG9tID0gZG9tLnBhcmVudE5vZGVcbiAgfVxuICByZXR1cm4gZmFsc2Vcbn1cblxuZnVuY3Rpb24gbWtFbChuYW1lKSB7XG4gIHJldHVybiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KG5hbWUpXG59XG5cbmZ1bmN0aW9uIHJlcGxhY2VZaWVsZCAodG1wbCwgaW5uZXJIVE1MKSB7XG4gIHJldHVybiB0bXBsLnJlcGxhY2UoLzwoeWllbGQpXFwvPz4oPFxcL1xcMT4pPy9naW0sIGlubmVySFRNTCB8fCAnJylcbn1cblxuZnVuY3Rpb24gJCQoc2VsZWN0b3IsIGN0eCkge1xuICByZXR1cm4gKGN0eCB8fCBkb2N1bWVudCkucXVlcnlTZWxlY3RvckFsbChzZWxlY3Rvcilcbn1cblxuZnVuY3Rpb24gJChzZWxlY3RvciwgY3R4KSB7XG4gIHJldHVybiAoY3R4IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yKHNlbGVjdG9yKVxufVxuXG5mdW5jdGlvbiBpbmhlcml0KHBhcmVudCkge1xuICBmdW5jdGlvbiBDaGlsZCgpIHt9XG4gIENoaWxkLnByb3RvdHlwZSA9IHBhcmVudFxuICByZXR1cm4gbmV3IENoaWxkKClcbn1cblxuZnVuY3Rpb24gc2V0TmFtZWQoZG9tLCBwYXJlbnQsIGtleXMpIHtcbiAgaWYgKGRvbS5fdmlzaXRlZCkgcmV0dXJuXG4gIHZhciBwLFxuICAgICAgdiA9IGRvbS5nZXRBdHRyaWJ1dGUoJ2lkJykgfHwgZG9tLmdldEF0dHJpYnV0ZSgnbmFtZScpXG5cbiAgaWYgKHYpIHtcbiAgICBpZiAoa2V5cy5pbmRleE9mKHYpIDwgMCkge1xuICAgICAgcCA9IHBhcmVudFt2XVxuICAgICAgaWYgKCFwKVxuICAgICAgICBwYXJlbnRbdl0gPSBkb21cbiAgICAgIGVsc2VcbiAgICAgICAgaXNBcnJheShwKSA/IHAucHVzaChkb20pIDogKHBhcmVudFt2XSA9IFtwLCBkb21dKVxuICAgIH1cbiAgICBkb20uX3Zpc2l0ZWQgPSB0cnVlXG4gIH1cbn1cbi8qKlxuICpcbiAqIEhhY2tzIG5lZWRlZCBmb3IgdGhlIG9sZCBpbnRlcm5ldCBleHBsb3JlciB2ZXJzaW9ucyBbbG93ZXIgdGhhbiBJRTEwXVxuICpcbiAqL1xuLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbmZ1bmN0aW9uIHRib2R5SW5uZXJIVE1MKGVsLCBodG1sLCB0YWdOYW1lKSB7XG4gIHZhciBkaXYgPSBta0VsKCdkaXYnKSxcbiAgICAgIGxvb3BzID0gL3RkfHRoLy50ZXN0KHRhZ05hbWUpID8gMyA6IDIsXG4gICAgICBjaGlsZFxuXG4gIGRpdi5pbm5lckhUTUwgPSAnPHRhYmxlPicgKyBodG1sICsgJzwvdGFibGU+J1xuICBjaGlsZCA9IGRpdi5maXJzdENoaWxkXG5cbiAgd2hpbGUgKGxvb3BzLS0pIGNoaWxkID0gY2hpbGQuZmlyc3RDaGlsZFxuXG4gIGVsLmFwcGVuZENoaWxkKGNoaWxkKVxuXG59XG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuZnVuY3Rpb24gb3B0aW9uSW5uZXJIVE1MKGVsLCBodG1sKSB7XG4gIHZhciBvcHQgPSBta0VsKCdvcHRpb24nKSxcbiAgICAgIHZhbFJlZ3ggPSAvdmFsdWU9W1xcXCInXSguKz8pW1xcXCInXS8sXG4gICAgICBzZWxSZWd4ID0gL3NlbGVjdGVkPVtcXFwiJ10oLis/KVtcXFwiJ10vLFxuICAgICAgZWFjaFJlZ3ggPSAvZWFjaD1bXFxcIiddKC4rPylbXFxcIiddLyxcbiAgICAgIGlmUmVneCA9IC9pZj1bXFxcIiddKC4rPylbXFxcIiddLyxcbiAgICAgIGlubmVyUmVneCA9IC8+KFtePF0qKTwvLFxuICAgICAgdmFsdWVzTWF0Y2ggPSBodG1sLm1hdGNoKHZhbFJlZ3gpLFxuICAgICAgc2VsZWN0ZWRNYXRjaCA9IGh0bWwubWF0Y2goc2VsUmVneCksXG4gICAgICBpbm5lclZhbHVlID0gaHRtbC5tYXRjaChpbm5lclJlZ3gpLFxuICAgICAgZWFjaE1hdGNoID0gaHRtbC5tYXRjaChlYWNoUmVneCksXG4gICAgICBpZk1hdGNoID0gaHRtbC5tYXRjaChpZlJlZ3gpXG5cbiAgaWYgKGlubmVyVmFsdWUpIG9wdC5pbm5lckhUTUwgPSBpbm5lclZhbHVlWzFdXG4gIGVsc2Ugb3B0LmlubmVySFRNTCA9IGh0bWxcblxuICBpZiAodmFsdWVzTWF0Y2gpIG9wdC52YWx1ZSA9IHZhbHVlc01hdGNoWzFdXG4gIGlmIChzZWxlY3RlZE1hdGNoKSBvcHQuc2V0QXR0cmlidXRlKCdyaW90LXNlbGVjdGVkJywgc2VsZWN0ZWRNYXRjaFsxXSlcbiAgaWYgKGVhY2hNYXRjaCkgb3B0LnNldEF0dHJpYnV0ZSgnZWFjaCcsIGVhY2hNYXRjaFsxXSlcbiAgaWYgKGlmTWF0Y2gpIG9wdC5zZXRBdHRyaWJ1dGUoJ2lmJywgaWZNYXRjaFsxXSlcblxuICBlbC5hcHBlbmRDaGlsZChvcHQpXG59XG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuZnVuY3Rpb24gb3B0Z3JvdXBJbm5lckhUTUwoZWwsIGh0bWwpIHtcbiAgdmFyIG9wdCA9IG1rRWwoJ29wdGdyb3VwJyksXG4gICAgICBsYWJlbFJlZ3ggPSAvbGFiZWw9W1xcXCInXSguKz8pW1xcXCInXS8sXG4gICAgICBlbGVtZW50UmVneCA9IC9ePChbXj5dKik+LyxcbiAgICAgIHRhZ1JlZ3ggPSAvXjwoW14gXFw+XSopLyxcbiAgICAgIGxhYmVsTWF0Y2ggPSBodG1sLm1hdGNoKGxhYmVsUmVneCksXG4gICAgICBlbGVtZW50TWF0Y2ggPSBodG1sLm1hdGNoKGVsZW1lbnRSZWd4KSxcbiAgICAgIHRhZ01hdGNoID0gaHRtbC5tYXRjaCh0YWdSZWd4KSxcbiAgICAgIGlubmVyQ29udGVudCA9IGh0bWxcblxuICBpZiAoZWxlbWVudE1hdGNoKSB7XG4gICAgdmFyIG9wdGlvbnMgPSBodG1sLnNsaWNlKGVsZW1lbnRNYXRjaFsxXS5sZW5ndGgrMiwgLXRhZ01hdGNoWzFdLmxlbmd0aC0zKS50cmltKClcbiAgICBpbm5lckNvbnRlbnQgPSBvcHRpb25zXG4gIH1cblxuICBpZiAobGFiZWxNYXRjaCkgb3B0LnNldEF0dHJpYnV0ZSgncmlvdC1sYWJlbCcsIGxhYmVsTWF0Y2hbMV0pXG5cbiAgaWYgKGlubmVyQ29udGVudCkge1xuICAgIHZhciBpbm5lck9wdCA9IG1rRWwoJ2RpdicpXG5cbiAgICBvcHRpb25Jbm5lckhUTUwoaW5uZXJPcHQsIGlubmVyQ29udGVudClcblxuICAgIG9wdC5hcHBlbmRDaGlsZChpbm5lck9wdC5maXJzdENoaWxkKVxuICB9XG5cbiAgZWwuYXBwZW5kQ2hpbGQob3B0KVxufVxuXG4vKlxuIFZpcnR1YWwgZG9tIGlzIGFuIGFycmF5IG9mIGN1c3RvbSB0YWdzIG9uIHRoZSBkb2N1bWVudC5cbiBVcGRhdGVzIGFuZCB1bm1vdW50cyBwcm9wYWdhdGUgZG93bndhcmRzIGZyb20gcGFyZW50IHRvIGNoaWxkcmVuLlxuKi9cblxudmFyIHZpcnR1YWxEb20gPSBbXSxcbiAgICB0YWdJbXBsID0ge30sXG4gICAgc3R5bGVOb2RlXG5cbnZhciBSSU9UX1RBRyA9ICdyaW90LXRhZydcblxuZnVuY3Rpb24gaW5qZWN0U3R5bGUoY3NzKSB7XG5cbiAgaWYgKHJpb3QucmVuZGVyKSByZXR1cm4gLy8gc2tpcCBpbmplY3Rpb24gb24gdGhlIHNlcnZlclxuXG4gIGlmICghc3R5bGVOb2RlKSB7XG4gICAgc3R5bGVOb2RlID0gbWtFbCgnc3R5bGUnKVxuICAgIHN0eWxlTm9kZS5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAndGV4dC9jc3MnKVxuICB9XG5cbiAgdmFyIGhlYWQgPSBkb2N1bWVudC5oZWFkIHx8IGRvY3VtZW50LmdldEVsZW1lbnRzQnlUYWdOYW1lKCdoZWFkJylbMF1cblxuICBpZiAoc3R5bGVOb2RlLnN0eWxlU2hlZXQpXG4gICAgc3R5bGVOb2RlLnN0eWxlU2hlZXQuY3NzVGV4dCArPSBjc3NcbiAgZWxzZVxuICAgIHN0eWxlTm9kZS5pbm5lckhUTUwgKz0gY3NzXG5cbiAgaWYgKCFzdHlsZU5vZGUuX3JlbmRlcmVkKVxuICAgIGlmIChzdHlsZU5vZGUuc3R5bGVTaGVldCkge1xuICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChzdHlsZU5vZGUpXG4gICAgfSBlbHNlIHtcbiAgICAgIHZhciBycyA9ICQoJ3N0eWxlW3R5cGU9cmlvdF0nKVxuICAgICAgaWYgKHJzKSB7XG4gICAgICAgIHJzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKHN0eWxlTm9kZSwgcnMpXG4gICAgICAgIHJzLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQocnMpXG4gICAgICB9IGVsc2UgaGVhZC5hcHBlbmRDaGlsZChzdHlsZU5vZGUpXG5cbiAgICB9XG5cbiAgc3R5bGVOb2RlLl9yZW5kZXJlZCA9IHRydWVcblxufVxuXG5mdW5jdGlvbiBtb3VudFRvKHJvb3QsIHRhZ05hbWUsIG9wdHMpIHtcbiAgdmFyIHRhZyA9IHRhZ0ltcGxbdGFnTmFtZV0sXG4gICAgICAvLyBjYWNoZSB0aGUgaW5uZXIgSFRNTCB0byBmaXggIzg1NVxuICAgICAgaW5uZXJIVE1MID0gcm9vdC5faW5uZXJIVE1MID0gcm9vdC5faW5uZXJIVE1MIHx8IHJvb3QuaW5uZXJIVE1MXG5cbiAgLy8gY2xlYXIgdGhlIGlubmVyIGh0bWxcbiAgcm9vdC5pbm5lckhUTUwgPSAnJ1xuXG4gIGlmICh0YWcgJiYgcm9vdCkgdGFnID0gbmV3IFRhZyh0YWcsIHsgcm9vdDogcm9vdCwgb3B0czogb3B0cyB9LCBpbm5lckhUTUwpXG5cbiAgaWYgKHRhZyAmJiB0YWcubW91bnQpIHtcbiAgICB0YWcubW91bnQoKVxuICAgIHZpcnR1YWxEb20ucHVzaCh0YWcpXG4gICAgcmV0dXJuIHRhZy5vbigndW5tb3VudCcsIGZ1bmN0aW9uKCkge1xuICAgICAgdmlydHVhbERvbS5zcGxpY2UodmlydHVhbERvbS5pbmRleE9mKHRhZyksIDEpXG4gICAgfSlcbiAgfVxuXG59XG5cbnJpb3QudGFnID0gZnVuY3Rpb24obmFtZSwgaHRtbCwgY3NzLCBhdHRycywgZm4pIHtcbiAgaWYgKGlzRnVuY3Rpb24oYXR0cnMpKSB7XG4gICAgZm4gPSBhdHRyc1xuICAgIGlmICgvXltcXHdcXC1dK1xccz89Ly50ZXN0KGNzcykpIHtcbiAgICAgIGF0dHJzID0gY3NzXG4gICAgICBjc3MgPSAnJ1xuICAgIH0gZWxzZSBhdHRycyA9ICcnXG4gIH1cbiAgaWYgKGNzcykge1xuICAgIGlmIChpc0Z1bmN0aW9uKGNzcykpIGZuID0gY3NzXG4gICAgZWxzZSBpbmplY3RTdHlsZShjc3MpXG4gIH1cbiAgdGFnSW1wbFtuYW1lXSA9IHsgbmFtZTogbmFtZSwgdG1wbDogaHRtbCwgYXR0cnM6IGF0dHJzLCBmbjogZm4gfVxuICByZXR1cm4gbmFtZVxufVxuXG5yaW90Lm1vdW50ID0gZnVuY3Rpb24oc2VsZWN0b3IsIHRhZ05hbWUsIG9wdHMpIHtcblxuICB2YXIgZWxzLFxuICAgICAgYWxsVGFncyxcbiAgICAgIHRhZ3MgPSBbXVxuXG4gIC8vIGhlbHBlciBmdW5jdGlvbnNcblxuICBmdW5jdGlvbiBhZGRSaW90VGFncyhhcnIpIHtcbiAgICB2YXIgbGlzdCA9ICcnXG4gICAgZWFjaChhcnIsIGZ1bmN0aW9uIChlKSB7XG4gICAgICBsaXN0ICs9ICcsICpbcmlvdC10YWc9XCInKyBlLnRyaW0oKSArICdcIl0nXG4gICAgfSlcbiAgICByZXR1cm4gbGlzdFxuICB9XG5cbiAgZnVuY3Rpb24gc2VsZWN0QWxsVGFncygpIHtcbiAgICB2YXIga2V5cyA9IE9iamVjdC5rZXlzKHRhZ0ltcGwpXG4gICAgcmV0dXJuIGtleXMgKyBhZGRSaW90VGFncyhrZXlzKVxuICB9XG5cbiAgZnVuY3Rpb24gcHVzaFRhZ3Mocm9vdCkge1xuICAgIHZhciBsYXN0XG4gICAgaWYgKHJvb3QudGFnTmFtZSkge1xuICAgICAgaWYgKHRhZ05hbWUgJiYgKCEobGFzdCA9IHJvb3QuZ2V0QXR0cmlidXRlKFJJT1RfVEFHKSkgfHwgbGFzdCAhPSB0YWdOYW1lKSlcbiAgICAgICAgcm9vdC5zZXRBdHRyaWJ1dGUoUklPVF9UQUcsIHRhZ05hbWUpXG5cbiAgICAgIHZhciB0YWcgPSBtb3VudFRvKHJvb3QsXG4gICAgICAgIHRhZ05hbWUgfHwgcm9vdC5nZXRBdHRyaWJ1dGUoUklPVF9UQUcpIHx8IHJvb3QudGFnTmFtZS50b0xvd2VyQ2FzZSgpLCBvcHRzKVxuXG4gICAgICBpZiAodGFnKSB0YWdzLnB1c2godGFnKVxuICAgIH1cbiAgICBlbHNlIGlmIChyb290Lmxlbmd0aCkge1xuICAgICAgZWFjaChyb290LCBwdXNoVGFncykgICAvLyBhc3N1bWUgbm9kZUxpc3RcbiAgICB9XG4gIH1cblxuICAvLyAtLS0tLSBtb3VudCBjb2RlIC0tLS0tXG5cbiAgaWYgKHR5cGVvZiB0YWdOYW1lID09PSBUX09CSkVDVCkge1xuICAgIG9wdHMgPSB0YWdOYW1lXG4gICAgdGFnTmFtZSA9IDBcbiAgfVxuXG4gIC8vIGNyYXdsIHRoZSBET00gdG8gZmluZCB0aGUgdGFnXG4gIGlmICh0eXBlb2Ygc2VsZWN0b3IgPT09IFRfU1RSSU5HKSB7XG4gICAgaWYgKHNlbGVjdG9yID09PSAnKicpXG4gICAgICAvLyBzZWxlY3QgYWxsIHRoZSB0YWdzIHJlZ2lzdGVyZWRcbiAgICAgIC8vIGFuZCBhbHNvIHRoZSB0YWdzIGZvdW5kIHdpdGggdGhlIHJpb3QtdGFnIGF0dHJpYnV0ZSBzZXRcbiAgICAgIHNlbGVjdG9yID0gYWxsVGFncyA9IHNlbGVjdEFsbFRhZ3MoKVxuICAgIGVsc2VcbiAgICAgIC8vIG9yIGp1c3QgdGhlIG9uZXMgbmFtZWQgbGlrZSB0aGUgc2VsZWN0b3JcbiAgICAgIHNlbGVjdG9yICs9IGFkZFJpb3RUYWdzKHNlbGVjdG9yLnNwbGl0KCcsJykpXG5cbiAgICBlbHMgPSAkJChzZWxlY3RvcilcbiAgfVxuICBlbHNlXG4gICAgLy8gcHJvYmFibHkgeW91IGhhdmUgcGFzc2VkIGFscmVhZHkgYSB0YWcgb3IgYSBOb2RlTGlzdFxuICAgIGVscyA9IHNlbGVjdG9yXG5cbiAgLy8gc2VsZWN0IGFsbCB0aGUgcmVnaXN0ZXJlZCBhbmQgbW91bnQgdGhlbSBpbnNpZGUgdGhlaXIgcm9vdCBlbGVtZW50c1xuICBpZiAodGFnTmFtZSA9PT0gJyonKSB7XG4gICAgLy8gZ2V0IGFsbCBjdXN0b20gdGFnc1xuICAgIHRhZ05hbWUgPSBhbGxUYWdzIHx8IHNlbGVjdEFsbFRhZ3MoKVxuICAgIC8vIGlmIHRoZSByb290IGVscyBpdCdzIGp1c3QgYSBzaW5nbGUgdGFnXG4gICAgaWYgKGVscy50YWdOYW1lKVxuICAgICAgZWxzID0gJCQodGFnTmFtZSwgZWxzKVxuICAgIGVsc2Uge1xuICAgICAgLy8gc2VsZWN0IGFsbCB0aGUgY2hpbGRyZW4gZm9yIGFsbCB0aGUgZGlmZmVyZW50IHJvb3QgZWxlbWVudHNcbiAgICAgIHZhciBub2RlTGlzdCA9IFtdXG4gICAgICBlYWNoKGVscywgZnVuY3Rpb24gKF9lbCkge1xuICAgICAgICBub2RlTGlzdC5wdXNoKCQkKHRhZ05hbWUsIF9lbCkpXG4gICAgICB9KVxuICAgICAgZWxzID0gbm9kZUxpc3RcbiAgICB9XG4gICAgLy8gZ2V0IHJpZCBvZiB0aGUgdGFnTmFtZVxuICAgIHRhZ05hbWUgPSAwXG4gIH1cblxuICBpZiAoZWxzLnRhZ05hbWUpXG4gICAgcHVzaFRhZ3MoZWxzKVxuICBlbHNlXG4gICAgZWFjaChlbHMsIHB1c2hUYWdzKVxuXG4gIHJldHVybiB0YWdzXG59XG5cbi8vIHVwZGF0ZSBldmVyeXRoaW5nXG5yaW90LnVwZGF0ZSA9IGZ1bmN0aW9uKCkge1xuICByZXR1cm4gZWFjaCh2aXJ0dWFsRG9tLCBmdW5jdGlvbih0YWcpIHtcbiAgICB0YWcudXBkYXRlKClcbiAgfSlcbn1cblxuLy8gQGRlcHJlY2F0ZWRcbnJpb3QubW91bnRUbyA9IHJpb3QubW91bnRcblxuICAvLyBzaGFyZSBtZXRob2RzIGZvciBvdGhlciByaW90IHBhcnRzLCBlLmcuIGNvbXBpbGVyXG4gIHJpb3QudXRpbCA9IHsgYnJhY2tldHM6IGJyYWNrZXRzLCB0bXBsOiB0bXBsIH1cblxuICAvLyBzdXBwb3J0IENvbW1vbkpTLCBBTUQgJiBicm93c2VyXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIGlmICh0eXBlb2YgZXhwb3J0cyA9PT0gVF9PQkpFQ1QpXG4gICAgbW9kdWxlLmV4cG9ydHMgPSByaW90XG4gIGVsc2UgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZClcbiAgICBkZWZpbmUoZnVuY3Rpb24oKSB7IHJldHVybiB3aW5kb3cucmlvdCA9IHJpb3QgfSlcbiAgZWxzZVxuICAgIHdpbmRvdy5yaW90ID0gcmlvdFxuXG59KSh0eXBlb2Ygd2luZG93ICE9ICd1bmRlZmluZWQnID8gd2luZG93IDogdm9pZCAwKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IFJpb3QgZnJvbSAncmlvdCc7XG5pbXBvcnQgJy4uL3RhZ3MvaGVsbG93b3JsZC50YWcnO1xuXG52YXIgcGFyYW1zID0ge1xuICAgIHBlb3BsZTogW1xuICAgICAgICB7IG5hbWU6ICdQZXRlcicgfSxcbiAgICAgICAgeyBuYW1lOiAnSmFtZXMnIH0sXG4gICAgICAgIHsgbmFtZTogJ0pvaG4nIH0sXG4gICAgICAgIHsgbmFtZTogJ0FuZHJldycgfVxuICAgIF1cbn07XG5cblJpb3QubW91bnQoJ2hlbGxvd29ybGQnLCBwYXJhbXMpO1xuIiwidmFyIHJpb3QgPSByZXF1aXJlKCdyaW90Jyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJpb3QudGFnKCdoZWxsb3dvcmxkJywgJzxoMT57IHRpdGxlIH08L2gxPiA8aW5wdXQgaWQ9XCJhZGRJbnB1dFwiIG9ua2V5dXA9XCJ7IGFkZCB9XCI+IDxidXR0b24gaWQ9XCJzdWJ0cmFjdElucHV0XCIgb25jbGljaz1cInsgc3VidHJhY3QgfVwiPlN1YnRyYWN0PC9idXR0b24+IDxkaXY+Q291bnQ6IHsgY291bnQgfTwvZGl2PiA8ZGl2IGVhY2g9XCJ7IG9wdHMucGVvcGxlIH1cIj57IG5hbWUgfTwvZGl2PiA8ZGl2IGVhY2g9XCJ7IGl0ZW0sIGkgaW4gbGlzdCB9XCI+eyBpIH06IHsgaXRlbSB9PC9kaXY+JywgZnVuY3Rpb24ob3B0cykge3ZhciBfdGhpcyA9IHRoaXM7XG5cbmNvdW50ID0gMDtcblxuc3VidHJhY3QgPSBmdW5jdGlvbiAoZSkge1xuICAgIGlmIChjb3VudCA+IDApIHtcbiAgICAgICAgYWRkSW5wdXQudmFsdWUgPSByZW1vdmVMYXN0KGFkZElucHV0LnZhbHVlKTtcbiAgICAgICAgY291bnQtLTtcbiAgICB9XG59O1xuXG5hZGQgPSBmdW5jdGlvbiAoZSkge1xuICAgIGNvdW50Kys7XG4gICAgX3RoaXMudXBkYXRlKCk7XG59O1xuXG5yZW1vdmVMYXN0ID0gZnVuY3Rpb24gKHRleHQpIHtcbiAgICByZXR1cm4gdGV4dC5zdWJzdHIoMCwgdGV4dC5sZW5ndGggLSAxKTtcbn07XG5cbnRoaXMucGVvcGxlID0gW3sgbmFtZTogJ1BldGVyJyB9LCB7IG5hbWU6ICdKYW1lcycgfSwgeyBuYW1lOiAnSm9obicgfSwgeyBuYW1lOiAnQW5kcmV3JyB9XTtcblxudGhpcy5saXN0ID0gWydCYW5hbmEnLCAnQXBwbGUnLCAnT3JhbmdlJywgJ01hbmdvJ107XG5cbi8vIHNldEludGVydmFsKGFkZCwgMTAwMClcblxudGl0bGUgPSBvcHRzLnRpdGxlICsgJyBXb3JsZCEnO1xufSk7XG4iXX0=
