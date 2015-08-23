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

require('../tags/peoplelist.tag');

var params = {
    people: [{ name: 'Peter', age: 20 }, { name: 'James', age: 30 }, { name: 'John', age: 40 }, { name: 'Andrew', age: 50 }, { name: 'Judas', age: 61 }]
};

_riot2['default'].mount('peoplelist', params);

},{"../tags/peoplelist.tag":3,"riot":1}],3:[function(require,module,exports){
var riot = require('riot');
module.exports = riot.tag('peoplelist', '<input type="text" id="nameInput" placeholder="Name" onkeyup="{ edit }"> <input type="text" id="ageInput" placeholder="Age" onkeyup="{ edit }"> <button type="button" name="button" __disabled="{ disabled }" onclick="{ add }">Add Person</button> <person each="{ opts.people }" data="{ this }"></person>', function(opts) {var _this = this;

this.disabled = true;

this.edit = function (e) {
    _this.disabled = nameInput.value == '' || ageInput.value == '';
};

this.add = function (e) {
    opts.people.push({
        name: nameInput.value,
        age: ageInput.value
    });

    _this.nameInput.value = '';
    _this.ageInput.value = '';
    _this.disabled = true;
};

this.remove = function (e) {
    var person = e.item;
    var index = opts.people.indexOf(person);
    opts.people.splice(index, 1);
};

this.oldFarts = function (age) {
    return age >= 60;
};

this.whipperSnappers = function (age) {
    return age <= 20;
};
});

riot.tag('person', '<h1><a href onclick="{ parent.remove }">X</a> - { opts.data.name } - <small class="{ red: oldFarts(opts.data.age), blue: whipperSnappers(opts.data.age) }">{ opts.data.age }</small></h1>', function(opts) {

});

},{"riot":1}]},{},[2])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvcmlvdC9yaW90LmpzIiwiL1VzZXJzL2FuZHJld2RlbHByZXRlL1dvcmsvQ29kZSBUZXN0aW5nL2JvaWxlcnBsYXRlL3Jpb3Rqcy1ndWxwLWJyb3dzZXJpZnktZXM2LWJvaWxlcnBsYXRlL3NyYy9zY3JpcHRzL2FwcC5qcyIsInNyYy90YWdzL3Blb3BsZWxpc3QudGFnIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDMTJDQSxZQUFZLENBQUM7Ozs7b0JBRUksTUFBTTs7OztRQUNoQix3QkFBd0I7O0FBRS9CLElBQUksTUFBTSxHQUFHO0FBQ1QsVUFBTSxFQUFFLENBQ0osRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFDMUIsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFDMUIsRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFDekIsRUFBRSxJQUFJLEVBQUUsUUFBUSxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsRUFDM0IsRUFBRSxJQUFJLEVBQUUsT0FBTyxFQUFFLEdBQUcsRUFBRSxFQUFFLEVBQUUsQ0FDN0I7Q0FDSixDQUFDOztBQUVGLGtCQUFLLEtBQUssQ0FBQyxZQUFZLEVBQUUsTUFBTSxDQUFDLENBQUM7OztBQ2ZqQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLyogUmlvdCB2Mi4yLjMsIEBsaWNlbnNlIE1JVCwgKGMpIDIwMTUgTXV1dCBJbmMuICsgY29udHJpYnV0b3JzICovXG5cbjsoZnVuY3Rpb24od2luZG93LCB1bmRlZmluZWQpIHtcbiAgJ3VzZSBzdHJpY3QnXG4gIHZhciByaW90ID0geyB2ZXJzaW9uOiAndjIuMi4zJywgc2V0dGluZ3M6IHt9IH0sXG4gICAgICAvLyBjb3VudGVyIHRvIGdpdmUgYSB1bmlxdWUgaWQgdG8gYWxsIHRoZSBUYWcgaW5zdGFuY2VzXG4gICAgICBfX3VpZCA9IDBcblxuICAvLyBUaGlzIGdsb2JhbHMgJ2NvbnN0JyBoZWxwcyBjb2RlIHNpemUgcmVkdWN0aW9uXG5cbiAgLy8gZm9yIHR5cGVvZiA9PSAnJyBjb21wYXJpc29uc1xuICB2YXIgVF9TVFJJTkcgPSAnc3RyaW5nJyxcbiAgICAgIFRfT0JKRUNUID0gJ29iamVjdCcsXG4gICAgICBUX1VOREVGICA9ICd1bmRlZmluZWQnLFxuICAgICAgVF9GVU5DVElPTiAgPSAnZnVuY3Rpb24nLFxuICAgICAgUkVTRVJWRURfV09SRFNfQkxBQ0tMSVNUID0gWyd1cGRhdGUnLCAncm9vdCcsICdtb3VudCcsICd1bm1vdW50JywgJ21peGluJywgJ2lzTW91bnRlZCcsICdpc0xvb3AnLCAndGFncycsICdwYXJlbnQnLCAnb3B0cycsICd0cmlnZ2VyJywgJ29uJywgJ29mZicsICdvbmUnXVxuXG4gIC8vIGZvciBJRTggYW5kIHJlc3Qgb2YgdGhlIHdvcmxkXG4gIC8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG4gIHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCAoZnVuY3Rpb24gKCkge1xuICAgIHZhciBfdHMgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nXG4gICAgcmV0dXJuIGZ1bmN0aW9uICh2KSB7IHJldHVybiBfdHMuY2FsbCh2KSA9PT0gJ1tvYmplY3QgQXJyYXldJyB9XG4gIH0pKClcblxuICAvLyBWZXJzaW9uIyBmb3IgSUUgOC0xMSwgMCBmb3Igb3RoZXJzXG4gIHZhciBpZVZlcnNpb24gPSAoZnVuY3Rpb24gKHdpbikge1xuICAgIHJldHVybiAod2luZG93ICYmIHdpbmRvdy5kb2N1bWVudCB8fCB7fSkuZG9jdW1lbnRNb2RlIHwgMFxuICB9KSgpXG5cbnJpb3Qub2JzZXJ2YWJsZSA9IGZ1bmN0aW9uKGVsKSB7XG5cbiAgZWwgPSBlbCB8fCB7fVxuXG4gIHZhciBjYWxsYmFja3MgPSB7fSxcbiAgICAgIF9pZCA9IDBcblxuICBlbC5vbiA9IGZ1bmN0aW9uKGV2ZW50cywgZm4pIHtcbiAgICBpZiAoaXNGdW5jdGlvbihmbikpIHtcbiAgICAgIGlmICh0eXBlb2YgZm4uaWQgPT09IFRfVU5ERUYpIGZuLl9pZCA9IF9pZCsrXG5cbiAgICAgIGV2ZW50cy5yZXBsYWNlKC9cXFMrL2csIGZ1bmN0aW9uKG5hbWUsIHBvcykge1xuICAgICAgICAoY2FsbGJhY2tzW25hbWVdID0gY2FsbGJhY2tzW25hbWVdIHx8IFtdKS5wdXNoKGZuKVxuICAgICAgICBmbi50eXBlZCA9IHBvcyA+IDBcbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiBlbFxuICB9XG5cbiAgZWwub2ZmID0gZnVuY3Rpb24oZXZlbnRzLCBmbikge1xuICAgIGlmIChldmVudHMgPT0gJyonKSBjYWxsYmFja3MgPSB7fVxuICAgIGVsc2Uge1xuICAgICAgZXZlbnRzLnJlcGxhY2UoL1xcUysvZywgZnVuY3Rpb24obmFtZSkge1xuICAgICAgICBpZiAoZm4pIHtcbiAgICAgICAgICB2YXIgYXJyID0gY2FsbGJhY2tzW25hbWVdXG4gICAgICAgICAgZm9yICh2YXIgaSA9IDAsIGNiOyAoY2IgPSBhcnIgJiYgYXJyW2ldKTsgKytpKSB7XG4gICAgICAgICAgICBpZiAoY2IuX2lkID09IGZuLl9pZCkgYXJyLnNwbGljZShpLS0sIDEpXG4gICAgICAgICAgfVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgIGNhbGxiYWNrc1tuYW1lXSA9IFtdXG4gICAgICAgIH1cbiAgICAgIH0pXG4gICAgfVxuICAgIHJldHVybiBlbFxuICB9XG5cbiAgLy8gb25seSBzaW5nbGUgZXZlbnQgc3VwcG9ydGVkXG4gIGVsLm9uZSA9IGZ1bmN0aW9uKG5hbWUsIGZuKSB7XG4gICAgZnVuY3Rpb24gb24oKSB7XG4gICAgICBlbC5vZmYobmFtZSwgb24pXG4gICAgICBmbi5hcHBseShlbCwgYXJndW1lbnRzKVxuICAgIH1cbiAgICByZXR1cm4gZWwub24obmFtZSwgb24pXG4gIH1cblxuICBlbC50cmlnZ2VyID0gZnVuY3Rpb24obmFtZSkge1xuICAgIHZhciBhcmdzID0gW10uc2xpY2UuY2FsbChhcmd1bWVudHMsIDEpLFxuICAgICAgICBmbnMgPSBjYWxsYmFja3NbbmFtZV0gfHwgW11cblxuICAgIGZvciAodmFyIGkgPSAwLCBmbjsgKGZuID0gZm5zW2ldKTsgKytpKSB7XG4gICAgICBpZiAoIWZuLmJ1c3kpIHtcbiAgICAgICAgZm4uYnVzeSA9IDFcbiAgICAgICAgZm4uYXBwbHkoZWwsIGZuLnR5cGVkID8gW25hbWVdLmNvbmNhdChhcmdzKSA6IGFyZ3MpXG4gICAgICAgIGlmIChmbnNbaV0gIT09IGZuKSB7IGktLSB9XG4gICAgICAgIGZuLmJ1c3kgPSAwXG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKGNhbGxiYWNrcy5hbGwgJiYgbmFtZSAhPSAnYWxsJykge1xuICAgICAgZWwudHJpZ2dlci5hcHBseShlbCwgWydhbGwnLCBuYW1lXS5jb25jYXQoYXJncykpXG4gICAgfVxuXG4gICAgcmV0dXJuIGVsXG4gIH1cblxuICByZXR1cm4gZWxcblxufVxucmlvdC5taXhpbiA9IChmdW5jdGlvbigpIHtcbiAgdmFyIG1peGlucyA9IHt9XG5cbiAgcmV0dXJuIGZ1bmN0aW9uKG5hbWUsIG1peGluKSB7XG4gICAgaWYgKCFtaXhpbikgcmV0dXJuIG1peGluc1tuYW1lXVxuICAgIG1peGluc1tuYW1lXSA9IG1peGluXG4gIH1cblxufSkoKVxuXG47KGZ1bmN0aW9uKHJpb3QsIGV2dCwgd2luKSB7XG5cbiAgLy8gYnJvd3NlcnMgb25seVxuICBpZiAoIXdpbikgcmV0dXJuXG5cbiAgdmFyIGxvYyA9IHdpbi5sb2NhdGlvbixcbiAgICAgIGZucyA9IHJpb3Qub2JzZXJ2YWJsZSgpLFxuICAgICAgc3RhcnRlZCA9IGZhbHNlLFxuICAgICAgY3VycmVudFxuXG4gIGZ1bmN0aW9uIGhhc2goKSB7XG4gICAgcmV0dXJuIGxvYy5ocmVmLnNwbGl0KCcjJylbMV0gfHwgJydcbiAgfVxuXG4gIGZ1bmN0aW9uIHBhcnNlcihwYXRoKSB7XG4gICAgcmV0dXJuIHBhdGguc3BsaXQoJy8nKVxuICB9XG5cbiAgZnVuY3Rpb24gZW1pdChwYXRoKSB7XG4gICAgaWYgKHBhdGgudHlwZSkgcGF0aCA9IGhhc2goKVxuXG4gICAgaWYgKHBhdGggIT0gY3VycmVudCkge1xuICAgICAgZm5zLnRyaWdnZXIuYXBwbHkobnVsbCwgWydIJ10uY29uY2F0KHBhcnNlcihwYXRoKSkpXG4gICAgICBjdXJyZW50ID0gcGF0aFxuICAgIH1cbiAgfVxuXG4gIHZhciByID0gcmlvdC5yb3V0ZSA9IGZ1bmN0aW9uKGFyZykge1xuICAgIC8vIHN0cmluZ1xuICAgIGlmIChhcmdbMF0pIHtcbiAgICAgIGxvYy5oYXNoID0gYXJnXG4gICAgICBlbWl0KGFyZylcblxuICAgIC8vIGZ1bmN0aW9uXG4gICAgfSBlbHNlIHtcbiAgICAgIGZucy5vbignSCcsIGFyZylcbiAgICB9XG4gIH1cblxuICByLmV4ZWMgPSBmdW5jdGlvbihmbikge1xuICAgIGZuLmFwcGx5KG51bGwsIHBhcnNlcihoYXNoKCkpKVxuICB9XG5cbiAgci5wYXJzZXIgPSBmdW5jdGlvbihmbikge1xuICAgIHBhcnNlciA9IGZuXG4gIH1cblxuICByLnN0b3AgPSBmdW5jdGlvbiAoKSB7XG4gICAgaWYgKCFzdGFydGVkKSByZXR1cm5cbiAgICB3aW4ucmVtb3ZlRXZlbnRMaXN0ZW5lciA/IHdpbi5yZW1vdmVFdmVudExpc3RlbmVyKGV2dCwgZW1pdCwgZmFsc2UpIDogd2luLmRldGFjaEV2ZW50KCdvbicgKyBldnQsIGVtaXQpXG4gICAgZm5zLm9mZignKicpXG4gICAgc3RhcnRlZCA9IGZhbHNlXG4gIH1cblxuICByLnN0YXJ0ID0gZnVuY3Rpb24gKCkge1xuICAgIGlmIChzdGFydGVkKSByZXR1cm5cbiAgICB3aW4uYWRkRXZlbnRMaXN0ZW5lciA/IHdpbi5hZGRFdmVudExpc3RlbmVyKGV2dCwgZW1pdCwgZmFsc2UpIDogd2luLmF0dGFjaEV2ZW50KCdvbicgKyBldnQsIGVtaXQpXG4gICAgc3RhcnRlZCA9IHRydWVcbiAgfVxuXG4gIC8vIGF1dG9zdGFydCB0aGUgcm91dGVyXG4gIHIuc3RhcnQoKVxuXG59KShyaW90LCAnaGFzaGNoYW5nZScsIHdpbmRvdylcbi8qXG5cbi8vLy8gSG93IGl0IHdvcmtzP1xuXG5cblRocmVlIHdheXM6XG5cbjEuIEV4cHJlc3Npb25zOiB0bXBsKCd7IHZhbHVlIH0nLCBkYXRhKS5cbiAgIFJldHVybnMgdGhlIHJlc3VsdCBvZiBldmFsdWF0ZWQgZXhwcmVzc2lvbiBhcyBhIHJhdyBvYmplY3QuXG5cbjIuIFRlbXBsYXRlczogdG1wbCgnSGkgeyBuYW1lIH0geyBzdXJuYW1lIH0nLCBkYXRhKS5cbiAgIFJldHVybnMgYSBzdHJpbmcgd2l0aCBldmFsdWF0ZWQgZXhwcmVzc2lvbnMuXG5cbjMuIEZpbHRlcnM6IHRtcGwoJ3sgc2hvdzogIWRvbmUsIGhpZ2hsaWdodDogYWN0aXZlIH0nLCBkYXRhKS5cbiAgIFJldHVybnMgYSBzcGFjZSBzZXBhcmF0ZWQgbGlzdCBvZiB0cnVlaXNoIGtleXMgKG1haW5seVxuICAgdXNlZCBmb3Igc2V0dGluZyBodG1sIGNsYXNzZXMpLCBlLmcuIFwic2hvdyBoaWdobGlnaHRcIi5cblxuXG4vLyBUZW1wbGF0ZSBleGFtcGxlc1xuXG50bXBsKCd7IHRpdGxlIHx8IFwiVW50aXRsZWRcIiB9JywgZGF0YSlcbnRtcGwoJ1Jlc3VsdHMgYXJlIHsgcmVzdWx0cyA/IFwicmVhZHlcIiA6IFwibG9hZGluZ1wiIH0nLCBkYXRhKVxudG1wbCgnVG9kYXkgaXMgeyBuZXcgRGF0ZSgpIH0nLCBkYXRhKVxudG1wbCgneyBtZXNzYWdlLmxlbmd0aCA+IDE0MCAmJiBcIk1lc3NhZ2UgaXMgdG9vIGxvbmdcIiB9JywgZGF0YSlcbnRtcGwoJ1RoaXMgaXRlbSBnb3QgeyBNYXRoLnJvdW5kKHJhdGluZykgfSBzdGFycycsIGRhdGEpXG50bXBsKCc8aDE+eyB0aXRsZSB9PC9oMT57IGJvZHkgfScsIGRhdGEpXG5cblxuLy8gRmFsc3kgZXhwcmVzc2lvbnMgaW4gdGVtcGxhdGVzXG5cbkluIHRlbXBsYXRlcyAoYXMgb3Bwb3NlZCB0byBzaW5nbGUgZXhwcmVzc2lvbnMpIGFsbCBmYWxzeSB2YWx1ZXNcbmV4Y2VwdCB6ZXJvICh1bmRlZmluZWQvbnVsbC9mYWxzZSkgd2lsbCBkZWZhdWx0IHRvIGVtcHR5IHN0cmluZzpcblxudG1wbCgneyB1bmRlZmluZWQgfSAtIHsgZmFsc2UgfSAtIHsgbnVsbCB9IC0geyAwIH0nLCB7fSlcbi8vIHdpbGwgcmV0dXJuOiBcIiAtIC0gLSAwXCJcblxuKi9cblxuXG52YXIgYnJhY2tldHMgPSAoZnVuY3Rpb24ob3JpZykge1xuXG4gIHZhciBjYWNoZWRCcmFja2V0cyxcbiAgICAgIHIsXG4gICAgICBiLFxuICAgICAgcmUgPSAvW3t9XS9nXG5cbiAgcmV0dXJuIGZ1bmN0aW9uKHgpIHtcblxuICAgIC8vIG1ha2Ugc3VyZSB3ZSB1c2UgdGhlIGN1cnJlbnQgc2V0dGluZ1xuICAgIHZhciBzID0gcmlvdC5zZXR0aW5ncy5icmFja2V0cyB8fCBvcmlnXG5cbiAgICAvLyByZWNyZWF0ZSBjYWNoZWQgdmFycyBpZiBuZWVkZWRcbiAgICBpZiAoY2FjaGVkQnJhY2tldHMgIT09IHMpIHtcbiAgICAgIGNhY2hlZEJyYWNrZXRzID0gc1xuICAgICAgYiA9IHMuc3BsaXQoJyAnKVxuICAgICAgciA9IGIubWFwKGZ1bmN0aW9uIChlKSB7IHJldHVybiBlLnJlcGxhY2UoLyg/PS4pL2csICdcXFxcJykgfSlcbiAgICB9XG5cbiAgICAvLyBpZiByZWdleHAgZ2l2ZW4sIHJld3JpdGUgaXQgd2l0aCBjdXJyZW50IGJyYWNrZXRzIChvbmx5IGlmIGRpZmZlciBmcm9tIGRlZmF1bHQpXG4gICAgcmV0dXJuIHggaW5zdGFuY2VvZiBSZWdFeHAgPyAoXG4gICAgICAgIHMgPT09IG9yaWcgPyB4IDpcbiAgICAgICAgbmV3IFJlZ0V4cCh4LnNvdXJjZS5yZXBsYWNlKHJlLCBmdW5jdGlvbihiKSB7IHJldHVybiByW35+KGIgPT09ICd9JyldIH0pLCB4Lmdsb2JhbCA/ICdnJyA6ICcnKVxuICAgICAgKSA6XG4gICAgICAvLyBlbHNlLCBnZXQgc3BlY2lmaWMgYnJhY2tldFxuICAgICAgYlt4XVxuICB9XG59KSgneyB9JylcblxuXG52YXIgdG1wbCA9IChmdW5jdGlvbigpIHtcblxuICB2YXIgY2FjaGUgPSB7fSxcbiAgICAgIHJlVmFycyA9IC8oWydcIlxcL10pLio/W15cXFxcXVxcMXxcXC5cXHcqfFxcdyo6fFxcYig/Oig/Om5ld3x0eXBlb2Z8aW58aW5zdGFuY2VvZikgfCg/OnRoaXN8dHJ1ZXxmYWxzZXxudWxsfHVuZGVmaW5lZClcXGJ8ZnVuY3Rpb24gKlxcKCl8KFthLXpfJF1cXHcqKS9naVxuICAgICAgICAgICAgICAvLyBbIDEgICAgICAgICAgICAgICBdWyAyICBdWyAzIF1bIDQgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgXVsgNSAgICAgICBdXG4gICAgICAgICAgICAgIC8vIGZpbmQgdmFyaWFibGUgbmFtZXM6XG4gICAgICAgICAgICAgIC8vIDEuIHNraXAgcXVvdGVkIHN0cmluZ3MgYW5kIHJlZ2V4cHM6IFwiYSBiXCIsICdhIGInLCAnYSBcXCdiXFwnJywgL2EgYi9cbiAgICAgICAgICAgICAgLy8gMi4gc2tpcCBvYmplY3QgcHJvcGVydGllczogLm5hbWVcbiAgICAgICAgICAgICAgLy8gMy4gc2tpcCBvYmplY3QgbGl0ZXJhbHM6IG5hbWU6XG4gICAgICAgICAgICAgIC8vIDQuIHNraXAgamF2YXNjcmlwdCBrZXl3b3Jkc1xuICAgICAgICAgICAgICAvLyA1LiBtYXRjaCB2YXIgbmFtZVxuXG4gIC8vIGJ1aWxkIGEgdGVtcGxhdGUgKG9yIGdldCBpdCBmcm9tIGNhY2hlKSwgcmVuZGVyIHdpdGggZGF0YVxuICByZXR1cm4gZnVuY3Rpb24oc3RyLCBkYXRhKSB7XG4gICAgcmV0dXJuIHN0ciAmJiAoY2FjaGVbc3RyXSA9IGNhY2hlW3N0cl0gfHwgdG1wbChzdHIpKShkYXRhKVxuICB9XG5cblxuICAvLyBjcmVhdGUgYSB0ZW1wbGF0ZSBpbnN0YW5jZVxuXG4gIGZ1bmN0aW9uIHRtcGwocywgcCkge1xuXG4gICAgLy8gZGVmYXVsdCB0ZW1wbGF0ZSBzdHJpbmcgdG8ge31cbiAgICBzID0gKHMgfHwgKGJyYWNrZXRzKDApICsgYnJhY2tldHMoMSkpKVxuXG4gICAgICAvLyB0ZW1wb3JhcmlseSBjb252ZXJ0IFxceyBhbmQgXFx9IHRvIGEgbm9uLWNoYXJhY3RlclxuICAgICAgLnJlcGxhY2UoYnJhY2tldHMoL1xcXFx7L2cpLCAnXFx1RkZGMCcpXG4gICAgICAucmVwbGFjZShicmFja2V0cygvXFxcXH0vZyksICdcXHVGRkYxJylcblxuICAgIC8vIHNwbGl0IHN0cmluZyB0byBleHByZXNzaW9uIGFuZCBub24tZXhwcmVzaW9uIHBhcnRzXG4gICAgcCA9IHNwbGl0KHMsIGV4dHJhY3QocywgYnJhY2tldHMoL3svKSwgYnJhY2tldHMoL30vKSkpXG5cbiAgICByZXR1cm4gbmV3IEZ1bmN0aW9uKCdkJywgJ3JldHVybiAnICsgKFxuXG4gICAgICAvLyBpcyBpdCBhIHNpbmdsZSBleHByZXNzaW9uIG9yIGEgdGVtcGxhdGU/IGkuZS4ge3h9IG9yIDxiPnt4fTwvYj5cbiAgICAgICFwWzBdICYmICFwWzJdICYmICFwWzNdXG5cbiAgICAgICAgLy8gaWYgZXhwcmVzc2lvbiwgZXZhbHVhdGUgaXRcbiAgICAgICAgPyBleHByKHBbMV0pXG5cbiAgICAgICAgLy8gaWYgdGVtcGxhdGUsIGV2YWx1YXRlIGFsbCBleHByZXNzaW9ucyBpbiBpdFxuICAgICAgICA6ICdbJyArIHAubWFwKGZ1bmN0aW9uKHMsIGkpIHtcblxuICAgICAgICAgICAgLy8gaXMgaXQgYW4gZXhwcmVzc2lvbiBvciBhIHN0cmluZyAoZXZlcnkgc2Vjb25kIHBhcnQgaXMgYW4gZXhwcmVzc2lvbilcbiAgICAgICAgICByZXR1cm4gaSAlIDJcblxuICAgICAgICAgICAgICAvLyBldmFsdWF0ZSB0aGUgZXhwcmVzc2lvbnNcbiAgICAgICAgICAgICAgPyBleHByKHMsIHRydWUpXG5cbiAgICAgICAgICAgICAgLy8gcHJvY2VzcyBzdHJpbmcgcGFydHMgb2YgdGhlIHRlbXBsYXRlOlxuICAgICAgICAgICAgICA6ICdcIicgKyBzXG5cbiAgICAgICAgICAgICAgICAgIC8vIHByZXNlcnZlIG5ldyBsaW5lc1xuICAgICAgICAgICAgICAgICAgLnJlcGxhY2UoL1xcbi9nLCAnXFxcXG4nKVxuXG4gICAgICAgICAgICAgICAgICAvLyBlc2NhcGUgcXVvdGVzXG4gICAgICAgICAgICAgICAgICAucmVwbGFjZSgvXCIvZywgJ1xcXFxcIicpXG5cbiAgICAgICAgICAgICAgICArICdcIidcblxuICAgICAgICB9KS5qb2luKCcsJykgKyAnXS5qb2luKFwiXCIpJ1xuICAgICAgKVxuXG4gICAgICAvLyBicmluZyBlc2NhcGVkIHsgYW5kIH0gYmFja1xuICAgICAgLnJlcGxhY2UoL1xcdUZGRjAvZywgYnJhY2tldHMoMCkpXG4gICAgICAucmVwbGFjZSgvXFx1RkZGMS9nLCBicmFja2V0cygxKSlcblxuICAgICsgJzsnKVxuXG4gIH1cblxuXG4gIC8vIHBhcnNlIHsgLi4uIH0gZXhwcmVzc2lvblxuXG4gIGZ1bmN0aW9uIGV4cHIocywgbikge1xuICAgIHMgPSBzXG5cbiAgICAgIC8vIGNvbnZlcnQgbmV3IGxpbmVzIHRvIHNwYWNlc1xuICAgICAgLnJlcGxhY2UoL1xcbi9nLCAnICcpXG5cbiAgICAgIC8vIHRyaW0gd2hpdGVzcGFjZSwgYnJhY2tldHMsIHN0cmlwIGNvbW1lbnRzXG4gICAgICAucmVwbGFjZShicmFja2V0cygvXlt7IF0rfFsgfV0rJHxcXC9cXCouKz9cXCpcXC8vZyksICcnKVxuXG4gICAgLy8gaXMgaXQgYW4gb2JqZWN0IGxpdGVyYWw/IGkuZS4geyBrZXkgOiB2YWx1ZSB9XG4gICAgcmV0dXJuIC9eXFxzKltcXHctIFwiJ10rICo6Ly50ZXN0KHMpXG5cbiAgICAgIC8vIGlmIG9iamVjdCBsaXRlcmFsLCByZXR1cm4gdHJ1ZWlzaCBrZXlzXG4gICAgICAvLyBlLmcuOiB7IHNob3c6IGlzT3BlbigpLCBkb25lOiBpdGVtLmRvbmUgfSAtPiBcInNob3cgZG9uZVwiXG4gICAgICA/ICdbJyArXG5cbiAgICAgICAgICAvLyBleHRyYWN0IGtleTp2YWwgcGFpcnMsIGlnbm9yaW5nIGFueSBuZXN0ZWQgb2JqZWN0c1xuICAgICAgICAgIGV4dHJhY3QocyxcblxuICAgICAgICAgICAgICAvLyBuYW1lIHBhcnQ6IG5hbWU6LCBcIm5hbWVcIjosICduYW1lJzosIG5hbWUgOlxuICAgICAgICAgICAgICAvW1wiJyBdKltcXHctIF0rW1wiJyBdKjovLFxuXG4gICAgICAgICAgICAgIC8vIGV4cHJlc3Npb24gcGFydDogZXZlcnl0aGluZyB1cHRvIGEgY29tbWEgZm9sbG93ZWQgYnkgYSBuYW1lIChzZWUgYWJvdmUpIG9yIGVuZCBvZiBsaW5lXG4gICAgICAgICAgICAgIC8sKD89W1wiJyBdKltcXHctIF0rW1wiJyBdKjopfH18JC9cbiAgICAgICAgICAgICAgKS5tYXAoZnVuY3Rpb24ocGFpcikge1xuXG4gICAgICAgICAgICAgICAgLy8gZ2V0IGtleSwgdmFsIHBhcnRzXG4gICAgICAgICAgICAgICAgcmV0dXJuIHBhaXIucmVwbGFjZSgvXlsgXCInXSooLis/KVsgXCInXSo6ICooLis/KSw/ICokLywgZnVuY3Rpb24oXywgaywgdikge1xuXG4gICAgICAgICAgICAgICAgICAvLyB3cmFwIGFsbCBjb25kaXRpb25hbCBwYXJ0cyB0byBpZ25vcmUgZXJyb3JzXG4gICAgICAgICAgICAgICAgICByZXR1cm4gdi5yZXBsYWNlKC9bXiZ8PSE+PF0rL2csIHdyYXApICsgJz9cIicgKyBrICsgJ1wiOlwiXCIsJ1xuXG4gICAgICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgICB9KS5qb2luKCcnKVxuXG4gICAgICAgICsgJ10uam9pbihcIiBcIikudHJpbSgpJ1xuXG4gICAgICAvLyBpZiBqcyBleHByZXNzaW9uLCBldmFsdWF0ZSBhcyBqYXZhc2NyaXB0XG4gICAgICA6IHdyYXAocywgbilcblxuICB9XG5cblxuICAvLyBleGVjdXRlIGpzIHcvbyBicmVha2luZyBvbiBlcnJvcnMgb3IgdW5kZWZpbmVkIHZhcnNcblxuICBmdW5jdGlvbiB3cmFwKHMsIG5vbnVsbCkge1xuICAgIHMgPSBzLnRyaW0oKVxuICAgIHJldHVybiAhcyA/ICcnIDogJyhmdW5jdGlvbih2KXt0cnl7dj0nXG5cbiAgICAgICAgLy8gcHJlZml4IHZhcnMgKG5hbWUgPT4gZGF0YS5uYW1lKVxuICAgICAgICArIChzLnJlcGxhY2UocmVWYXJzLCBmdW5jdGlvbihzLCBfLCB2KSB7IHJldHVybiB2ID8gJyhkLicrdisnPT09dW5kZWZpbmVkPycrKHR5cGVvZiB3aW5kb3cgPT0gJ3VuZGVmaW5lZCcgPyAnZ2xvYmFsLicgOiAnd2luZG93LicpK3YrJzpkLicrdisnKScgOiBzIH0pXG5cbiAgICAgICAgICAvLyBicmVhayB0aGUgZXhwcmVzc2lvbiBpZiBpdHMgZW1wdHkgKHJlc3VsdGluZyBpbiB1bmRlZmluZWQgdmFsdWUpXG4gICAgICAgICAgfHwgJ3gnKVxuICAgICAgKyAnfWNhdGNoKGUpeydcbiAgICAgICsgJ31maW5hbGx5e3JldHVybiAnXG5cbiAgICAgICAgLy8gZGVmYXVsdCB0byBlbXB0eSBzdHJpbmcgZm9yIGZhbHN5IHZhbHVlcyBleGNlcHQgemVyb1xuICAgICAgICArIChub251bGwgPT09IHRydWUgPyAnIXYmJnYhPT0wP1wiXCI6dicgOiAndicpXG5cbiAgICAgICsgJ319KS5jYWxsKGQpJ1xuICB9XG5cblxuICAvLyBzcGxpdCBzdHJpbmcgYnkgYW4gYXJyYXkgb2Ygc3Vic3RyaW5nc1xuXG4gIGZ1bmN0aW9uIHNwbGl0KHN0ciwgc3Vic3RyaW5ncykge1xuICAgIHZhciBwYXJ0cyA9IFtdXG4gICAgc3Vic3RyaW5ncy5tYXAoZnVuY3Rpb24oc3ViLCBpKSB7XG5cbiAgICAgIC8vIHB1c2ggbWF0Y2hlZCBleHByZXNzaW9uIGFuZCBwYXJ0IGJlZm9yZSBpdFxuICAgICAgaSA9IHN0ci5pbmRleE9mKHN1YilcbiAgICAgIHBhcnRzLnB1c2goc3RyLnNsaWNlKDAsIGkpLCBzdWIpXG4gICAgICBzdHIgPSBzdHIuc2xpY2UoaSArIHN1Yi5sZW5ndGgpXG4gICAgfSlcblxuICAgIC8vIHB1c2ggdGhlIHJlbWFpbmluZyBwYXJ0XG4gICAgcmV0dXJuIHBhcnRzLmNvbmNhdChzdHIpXG4gIH1cblxuXG4gIC8vIG1hdGNoIHN0cmluZ3MgYmV0d2VlbiBvcGVuaW5nIGFuZCBjbG9zaW5nIHJlZ2V4cCwgc2tpcHBpbmcgYW55IGlubmVyL25lc3RlZCBtYXRjaGVzXG5cbiAgZnVuY3Rpb24gZXh0cmFjdChzdHIsIG9wZW4sIGNsb3NlKSB7XG5cbiAgICB2YXIgc3RhcnQsXG4gICAgICAgIGxldmVsID0gMCxcbiAgICAgICAgbWF0Y2hlcyA9IFtdLFxuICAgICAgICByZSA9IG5ldyBSZWdFeHAoJygnK29wZW4uc291cmNlKycpfCgnK2Nsb3NlLnNvdXJjZSsnKScsICdnJylcblxuICAgIHN0ci5yZXBsYWNlKHJlLCBmdW5jdGlvbihfLCBvcGVuLCBjbG9zZSwgcG9zKSB7XG5cbiAgICAgIC8vIGlmIG91dGVyIGlubmVyIGJyYWNrZXQsIG1hcmsgcG9zaXRpb25cbiAgICAgIGlmICghbGV2ZWwgJiYgb3Blbikgc3RhcnQgPSBwb3NcblxuICAgICAgLy8gaW4oZGUpY3JlYXNlIGJyYWNrZXQgbGV2ZWxcbiAgICAgIGxldmVsICs9IG9wZW4gPyAxIDogLTFcblxuICAgICAgLy8gaWYgb3V0ZXIgY2xvc2luZyBicmFja2V0LCBncmFiIHRoZSBtYXRjaFxuICAgICAgaWYgKCFsZXZlbCAmJiBjbG9zZSAhPSBudWxsKSBtYXRjaGVzLnB1c2goc3RyLnNsaWNlKHN0YXJ0LCBwb3MrY2xvc2UubGVuZ3RoKSlcblxuICAgIH0pXG5cbiAgICByZXR1cm4gbWF0Y2hlc1xuICB9XG5cbn0pKClcblxuLy8geyBrZXksIGkgaW4gaXRlbXN9IC0+IHsga2V5LCBpLCBpdGVtcyB9XG5mdW5jdGlvbiBsb29wS2V5cyhleHByKSB7XG4gIHZhciBiMCA9IGJyYWNrZXRzKDApLFxuICAgICAgZWxzID0gZXhwci50cmltKCkuc2xpY2UoYjAubGVuZ3RoKS5tYXRjaCgvXlxccyooXFxTKz8pXFxzKig/OixcXHMqKFxcUyspKT9cXHMraW5cXHMrKC4rKSQvKVxuICByZXR1cm4gZWxzID8geyBrZXk6IGVsc1sxXSwgcG9zOiBlbHNbMl0sIHZhbDogYjAgKyBlbHNbM10gfSA6IHsgdmFsOiBleHByIH1cbn1cblxuZnVuY3Rpb24gbWtpdGVtKGV4cHIsIGtleSwgdmFsKSB7XG4gIHZhciBpdGVtID0ge31cbiAgaXRlbVtleHByLmtleV0gPSBrZXlcbiAgaWYgKGV4cHIucG9zKSBpdGVtW2V4cHIucG9zXSA9IHZhbFxuICByZXR1cm4gaXRlbVxufVxuXG5cbi8qIEJld2FyZTogaGVhdnkgc3R1ZmYgKi9cbmZ1bmN0aW9uIF9lYWNoKGRvbSwgcGFyZW50LCBleHByKSB7XG5cbiAgcmVtQXR0cihkb20sICdlYWNoJylcblxuICB2YXIgdGFnTmFtZSA9IGdldFRhZ05hbWUoZG9tKSxcbiAgICAgIHRlbXBsYXRlID0gZG9tLm91dGVySFRNTCxcbiAgICAgIGhhc0ltcGwgPSAhIXRhZ0ltcGxbdGFnTmFtZV0sXG4gICAgICBpbXBsID0gdGFnSW1wbFt0YWdOYW1lXSB8fCB7XG4gICAgICAgIHRtcGw6IHRlbXBsYXRlXG4gICAgICB9LFxuICAgICAgcm9vdCA9IGRvbS5wYXJlbnROb2RlLFxuICAgICAgcGxhY2Vob2xkZXIgPSBkb2N1bWVudC5jcmVhdGVDb21tZW50KCdyaW90IHBsYWNlaG9sZGVyJyksXG4gICAgICB0YWdzID0gW10sXG4gICAgICBjaGlsZCA9IGdldFRhZyhkb20pLFxuICAgICAgY2hlY2tzdW1cblxuICByb290Lmluc2VydEJlZm9yZShwbGFjZWhvbGRlciwgZG9tKVxuXG4gIGV4cHIgPSBsb29wS2V5cyhleHByKVxuXG4gIC8vIGNsZWFuIHRlbXBsYXRlIGNvZGVcbiAgcGFyZW50XG4gICAgLm9uZSgncHJlbW91bnQnLCBmdW5jdGlvbiAoKSB7XG4gICAgICBpZiAocm9vdC5zdHViKSByb290ID0gcGFyZW50LnJvb3RcbiAgICAgIC8vIHJlbW92ZSB0aGUgb3JpZ2luYWwgRE9NIG5vZGVcbiAgICAgIGRvbS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGRvbSlcbiAgICB9KVxuICAgIC5vbigndXBkYXRlJywgZnVuY3Rpb24gKCkge1xuICAgICAgdmFyIGl0ZW1zID0gdG1wbChleHByLnZhbCwgcGFyZW50KVxuXG4gICAgICAvLyBvYmplY3QgbG9vcC4gYW55IGNoYW5nZXMgY2F1c2UgZnVsbCByZWRyYXdcbiAgICAgIGlmICghaXNBcnJheShpdGVtcykpIHtcblxuICAgICAgICBjaGVja3N1bSA9IGl0ZW1zID8gSlNPTi5zdHJpbmdpZnkoaXRlbXMpIDogJydcblxuICAgICAgICBpdGVtcyA9ICFpdGVtcyA/IFtdIDpcbiAgICAgICAgICBPYmplY3Qua2V5cyhpdGVtcykubWFwKGZ1bmN0aW9uIChrZXkpIHtcbiAgICAgICAgICAgIHJldHVybiBta2l0ZW0oZXhwciwga2V5LCBpdGVtc1trZXldKVxuICAgICAgICAgIH0pXG4gICAgICB9XG5cbiAgICAgIHZhciBmcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpLFxuICAgICAgICAgIGkgPSB0YWdzLmxlbmd0aCxcbiAgICAgICAgICBqID0gaXRlbXMubGVuZ3RoXG5cbiAgICAgIC8vIHVubW91bnQgbGVmdG92ZXIgaXRlbXNcbiAgICAgIHdoaWxlIChpID4gaikge1xuICAgICAgICB0YWdzWy0taV0udW5tb3VudCgpXG4gICAgICAgIHRhZ3Muc3BsaWNlKGksIDEpXG4gICAgICB9XG5cbiAgICAgIGZvciAoaSA9IDA7IGkgPCBqOyArK2kpIHtcbiAgICAgICAgdmFyIF9pdGVtID0gIWNoZWNrc3VtICYmICEhZXhwci5rZXkgPyBta2l0ZW0oZXhwciwgaXRlbXNbaV0sIGkpIDogaXRlbXNbaV1cblxuICAgICAgICBpZiAoIXRhZ3NbaV0pIHtcbiAgICAgICAgICAvLyBtb3VudCBuZXdcbiAgICAgICAgICAodGFnc1tpXSA9IG5ldyBUYWcoaW1wbCwge1xuICAgICAgICAgICAgICBwYXJlbnQ6IHBhcmVudCxcbiAgICAgICAgICAgICAgaXNMb29wOiB0cnVlLFxuICAgICAgICAgICAgICBoYXNJbXBsOiBoYXNJbXBsLFxuICAgICAgICAgICAgICByb290OiBoYXNJbXBsID8gZG9tLmNsb25lTm9kZSgpIDogcm9vdCxcbiAgICAgICAgICAgICAgaXRlbTogX2l0ZW1cbiAgICAgICAgICAgIH0sIGRvbS5pbm5lckhUTUwpXG4gICAgICAgICAgKS5tb3VudCgpXG5cbiAgICAgICAgICBmcmFnLmFwcGVuZENoaWxkKHRhZ3NbaV0ucm9vdClcbiAgICAgICAgfSBlbHNlXG4gICAgICAgICAgdGFnc1tpXS51cGRhdGUoX2l0ZW0pXG5cbiAgICAgICAgdGFnc1tpXS5faXRlbSA9IF9pdGVtXG5cbiAgICAgIH1cblxuICAgICAgcm9vdC5pbnNlcnRCZWZvcmUoZnJhZywgcGxhY2Vob2xkZXIpXG5cbiAgICAgIGlmIChjaGlsZCkgcGFyZW50LnRhZ3NbdGFnTmFtZV0gPSB0YWdzXG5cbiAgICB9KS5vbmUoJ3VwZGF0ZWQnLCBmdW5jdGlvbigpIHtcbiAgICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXMocGFyZW50KS8vIG9ubHkgc2V0IG5ldyB2YWx1ZXNcbiAgICAgIHdhbGsocm9vdCwgZnVuY3Rpb24obm9kZSkge1xuICAgICAgICAvLyBvbmx5IHNldCBlbGVtZW50IG5vZGUgYW5kIG5vdCBpc0xvb3BcbiAgICAgICAgaWYgKG5vZGUubm9kZVR5cGUgPT0gMSAmJiAhbm9kZS5pc0xvb3AgJiYgIW5vZGUuX2xvb3BlZCkge1xuICAgICAgICAgIG5vZGUuX3Zpc2l0ZWQgPSBmYWxzZSAvLyByZXNldCBfdmlzaXRlZCBmb3IgbG9vcCBub2RlXG4gICAgICAgICAgbm9kZS5fbG9vcGVkID0gdHJ1ZSAvLyBhdm9pZCBzZXQgbXVsdGlwbGUgZWFjaFxuICAgICAgICAgIHNldE5hbWVkKG5vZGUsIHBhcmVudCwga2V5cylcbiAgICAgICAgfVxuICAgICAgfSlcbiAgICB9KVxuXG59XG5cblxuZnVuY3Rpb24gcGFyc2VOYW1lZEVsZW1lbnRzKHJvb3QsIHBhcmVudCwgY2hpbGRUYWdzKSB7XG5cbiAgd2Fsayhyb290LCBmdW5jdGlvbihkb20pIHtcbiAgICBpZiAoZG9tLm5vZGVUeXBlID09IDEpIHtcbiAgICAgIGRvbS5pc0xvb3AgPSBkb20uaXNMb29wIHx8IChkb20ucGFyZW50Tm9kZSAmJiBkb20ucGFyZW50Tm9kZS5pc0xvb3AgfHwgZG9tLmdldEF0dHJpYnV0ZSgnZWFjaCcpKSA/IDEgOiAwXG5cbiAgICAgIC8vIGN1c3RvbSBjaGlsZCB0YWdcbiAgICAgIHZhciBjaGlsZCA9IGdldFRhZyhkb20pXG5cbiAgICAgIGlmIChjaGlsZCAmJiAhZG9tLmlzTG9vcCkge1xuICAgICAgICB2YXIgdGFnID0gbmV3IFRhZyhjaGlsZCwgeyByb290OiBkb20sIHBhcmVudDogcGFyZW50IH0sIGRvbS5pbm5lckhUTUwpLFxuICAgICAgICAgICAgdGFnTmFtZSA9IGdldFRhZ05hbWUoZG9tKSxcbiAgICAgICAgICAgIHB0YWcgPSBnZXRJbW1lZGlhdGVDdXN0b21QYXJlbnRUYWcocGFyZW50KSxcbiAgICAgICAgICAgIGNhY2hlZFRhZ1xuXG4gICAgICAgIC8vIGZpeCBmb3IgdGhlIHBhcmVudCBhdHRyaWJ1dGUgaW4gdGhlIGxvb3BlZCBlbGVtZW50c1xuICAgICAgICB0YWcucGFyZW50ID0gcHRhZ1xuXG4gICAgICAgIGNhY2hlZFRhZyA9IHB0YWcudGFnc1t0YWdOYW1lXVxuXG4gICAgICAgIC8vIGlmIHRoZXJlIGFyZSBtdWx0aXBsZSBjaGlsZHJlbiB0YWdzIGhhdmluZyB0aGUgc2FtZSBuYW1lXG4gICAgICAgIGlmIChjYWNoZWRUYWcpIHtcbiAgICAgICAgICAvLyBpZiB0aGUgcGFyZW50IHRhZ3MgcHJvcGVydHkgaXMgbm90IHlldCBhbiBhcnJheVxuICAgICAgICAgIC8vIGNyZWF0ZSBpdCBhZGRpbmcgdGhlIGZpcnN0IGNhY2hlZCB0YWdcbiAgICAgICAgICBpZiAoIWlzQXJyYXkoY2FjaGVkVGFnKSlcbiAgICAgICAgICAgIHB0YWcudGFnc1t0YWdOYW1lXSA9IFtjYWNoZWRUYWddXG4gICAgICAgICAgLy8gYWRkIHRoZSBuZXcgbmVzdGVkIHRhZyB0byB0aGUgYXJyYXlcbiAgICAgICAgICBwdGFnLnRhZ3NbdGFnTmFtZV0ucHVzaCh0YWcpXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgcHRhZy50YWdzW3RhZ05hbWVdID0gdGFnXG4gICAgICAgIH1cblxuICAgICAgICAvLyBlbXB0eSB0aGUgY2hpbGQgbm9kZSBvbmNlIHdlIGdvdCBpdHMgdGVtcGxhdGVcbiAgICAgICAgLy8gdG8gYXZvaWQgdGhhdCBpdHMgY2hpbGRyZW4gZ2V0IGNvbXBpbGVkIG11bHRpcGxlIHRpbWVzXG4gICAgICAgIGRvbS5pbm5lckhUTUwgPSAnJ1xuICAgICAgICBjaGlsZFRhZ3MucHVzaCh0YWcpXG4gICAgICB9XG5cbiAgICAgIGlmICghZG9tLmlzTG9vcClcbiAgICAgICAgc2V0TmFtZWQoZG9tLCBwYXJlbnQsIFtdKVxuICAgIH1cblxuICB9KVxuXG59XG5cbmZ1bmN0aW9uIHBhcnNlRXhwcmVzc2lvbnMocm9vdCwgdGFnLCBleHByZXNzaW9ucykge1xuXG4gIGZ1bmN0aW9uIGFkZEV4cHIoZG9tLCB2YWwsIGV4dHJhKSB7XG4gICAgaWYgKHZhbC5pbmRleE9mKGJyYWNrZXRzKDApKSA+PSAwKSB7XG4gICAgICB2YXIgZXhwciA9IHsgZG9tOiBkb20sIGV4cHI6IHZhbCB9XG4gICAgICBleHByZXNzaW9ucy5wdXNoKGV4dGVuZChleHByLCBleHRyYSkpXG4gICAgfVxuICB9XG5cbiAgd2Fsayhyb290LCBmdW5jdGlvbihkb20pIHtcbiAgICB2YXIgdHlwZSA9IGRvbS5ub2RlVHlwZVxuXG4gICAgLy8gdGV4dCBub2RlXG4gICAgaWYgKHR5cGUgPT0gMyAmJiBkb20ucGFyZW50Tm9kZS50YWdOYW1lICE9ICdTVFlMRScpIGFkZEV4cHIoZG9tLCBkb20ubm9kZVZhbHVlKVxuICAgIGlmICh0eXBlICE9IDEpIHJldHVyblxuXG4gICAgLyogZWxlbWVudCAqL1xuXG4gICAgLy8gbG9vcFxuICAgIHZhciBhdHRyID0gZG9tLmdldEF0dHJpYnV0ZSgnZWFjaCcpXG5cbiAgICBpZiAoYXR0cikgeyBfZWFjaChkb20sIHRhZywgYXR0cik7IHJldHVybiBmYWxzZSB9XG5cbiAgICAvLyBhdHRyaWJ1dGUgZXhwcmVzc2lvbnNcbiAgICBlYWNoKGRvbS5hdHRyaWJ1dGVzLCBmdW5jdGlvbihhdHRyKSB7XG4gICAgICB2YXIgbmFtZSA9IGF0dHIubmFtZSxcbiAgICAgICAgYm9vbCA9IG5hbWUuc3BsaXQoJ19fJylbMV1cblxuICAgICAgYWRkRXhwcihkb20sIGF0dHIudmFsdWUsIHsgYXR0cjogYm9vbCB8fCBuYW1lLCBib29sOiBib29sIH0pXG4gICAgICBpZiAoYm9vbCkgeyByZW1BdHRyKGRvbSwgbmFtZSk7IHJldHVybiBmYWxzZSB9XG5cbiAgICB9KVxuXG4gICAgLy8gc2tpcCBjdXN0b20gdGFnc1xuICAgIGlmIChnZXRUYWcoZG9tKSkgcmV0dXJuIGZhbHNlXG5cbiAgfSlcblxufVxuZnVuY3Rpb24gVGFnKGltcGwsIGNvbmYsIGlubmVySFRNTCkge1xuXG4gIHZhciBzZWxmID0gcmlvdC5vYnNlcnZhYmxlKHRoaXMpLFxuICAgICAgb3B0cyA9IGluaGVyaXQoY29uZi5vcHRzKSB8fCB7fSxcbiAgICAgIGRvbSA9IG1rZG9tKGltcGwudG1wbCksXG4gICAgICBwYXJlbnQgPSBjb25mLnBhcmVudCxcbiAgICAgIGlzTG9vcCA9IGNvbmYuaXNMb29wLFxuICAgICAgaGFzSW1wbCA9IGNvbmYuaGFzSW1wbCxcbiAgICAgIGl0ZW0gPSBjbGVhblVwRGF0YShjb25mLml0ZW0pLFxuICAgICAgZXhwcmVzc2lvbnMgPSBbXSxcbiAgICAgIGNoaWxkVGFncyA9IFtdLFxuICAgICAgcm9vdCA9IGNvbmYucm9vdCxcbiAgICAgIGZuID0gaW1wbC5mbixcbiAgICAgIHRhZ05hbWUgPSByb290LnRhZ05hbWUudG9Mb3dlckNhc2UoKSxcbiAgICAgIGF0dHIgPSB7fSxcbiAgICAgIHByb3BzSW5TeW5jV2l0aFBhcmVudCA9IFtdLFxuICAgICAgbG9vcERvbVxuXG5cbiAgaWYgKGZuICYmIHJvb3QuX3RhZykge1xuICAgIHJvb3QuX3RhZy51bm1vdW50KHRydWUpXG4gIH1cblxuICAvLyBub3QgeWV0IG1vdW50ZWRcbiAgdGhpcy5pc01vdW50ZWQgPSBmYWxzZVxuICByb290LmlzTG9vcCA9IGlzTG9vcFxuXG4gIC8vIGtlZXAgYSByZWZlcmVuY2UgdG8gdGhlIHRhZyBqdXN0IGNyZWF0ZWRcbiAgLy8gc28gd2Ugd2lsbCBiZSBhYmxlIHRvIG1vdW50IHRoaXMgdGFnIG11bHRpcGxlIHRpbWVzXG4gIHJvb3QuX3RhZyA9IHRoaXNcblxuICAvLyBjcmVhdGUgYSB1bmlxdWUgaWQgdG8gdGhpcyB0YWdcbiAgLy8gaXQgY291bGQgYmUgaGFuZHkgdG8gdXNlIGl0IGFsc28gdG8gaW1wcm92ZSB0aGUgdmlydHVhbCBkb20gcmVuZGVyaW5nIHNwZWVkXG4gIHRoaXMuX2lkID0gX191aWQrK1xuXG4gIGV4dGVuZCh0aGlzLCB7IHBhcmVudDogcGFyZW50LCByb290OiByb290LCBvcHRzOiBvcHRzLCB0YWdzOiB7fSB9LCBpdGVtKVxuXG4gIC8vIGdyYWIgYXR0cmlidXRlc1xuICBlYWNoKHJvb3QuYXR0cmlidXRlcywgZnVuY3Rpb24oZWwpIHtcbiAgICB2YXIgdmFsID0gZWwudmFsdWVcbiAgICAvLyByZW1lbWJlciBhdHRyaWJ1dGVzIHdpdGggZXhwcmVzc2lvbnMgb25seVxuICAgIGlmIChicmFja2V0cygvXFx7LipcXH0vKS50ZXN0KHZhbCkpIGF0dHJbZWwubmFtZV0gPSB2YWxcbiAgfSlcblxuICBpZiAoZG9tLmlubmVySFRNTCAmJiAhL3NlbGVjdHxvcHRncm91cHx0Ym9keXx0ci8udGVzdCh0YWdOYW1lKSlcbiAgICAvLyByZXBsYWNlIGFsbCB0aGUgeWllbGQgdGFncyB3aXRoIHRoZSB0YWcgaW5uZXIgaHRtbFxuICAgIGRvbS5pbm5lckhUTUwgPSByZXBsYWNlWWllbGQoZG9tLmlubmVySFRNTCwgaW5uZXJIVE1MKVxuXG4gIC8vIG9wdGlvbnNcbiAgZnVuY3Rpb24gdXBkYXRlT3B0cygpIHtcbiAgICB2YXIgY3R4ID0gaGFzSW1wbCAmJiBpc0xvb3AgPyBzZWxmIDogcGFyZW50IHx8IHNlbGZcblxuICAgIC8vIHVwZGF0ZSBvcHRzIGZyb20gY3VycmVudCBET00gYXR0cmlidXRlc1xuICAgIGVhY2gocm9vdC5hdHRyaWJ1dGVzLCBmdW5jdGlvbihlbCkge1xuICAgICAgb3B0c1tlbC5uYW1lXSA9IHRtcGwoZWwudmFsdWUsIGN0eClcbiAgICB9KVxuICAgIC8vIHJlY292ZXIgdGhvc2Ugd2l0aCBleHByZXNzaW9uc1xuICAgIGVhY2goT2JqZWN0LmtleXMoYXR0ciksIGZ1bmN0aW9uKG5hbWUpIHtcbiAgICAgIG9wdHNbbmFtZV0gPSBjbGVhblVwRGF0YSh0bXBsKGF0dHJbbmFtZV0sIGN0eCkpXG4gICAgfSlcbiAgfVxuXG4gIGZ1bmN0aW9uIG5vcm1hbGl6ZURhdGEoZGF0YSkge1xuICAgIGZvciAodmFyIGtleSBpbiBpdGVtKSB7XG4gICAgICBpZiAodHlwZW9mIHNlbGZba2V5XSAhPT0gVF9VTkRFRilcbiAgICAgICAgc2VsZltrZXldID0gZGF0YVtrZXldXG4gICAgfVxuICB9XG5cbiAgZnVuY3Rpb24gaW5oZXJpdEZyb21QYXJlbnQgKCkge1xuICAgIGlmICghc2VsZi5wYXJlbnQgfHwgIWlzTG9vcCkgcmV0dXJuXG4gICAgZWFjaChPYmplY3Qua2V5cyhzZWxmLnBhcmVudCksIGZ1bmN0aW9uKGspIHtcbiAgICAgIC8vIHNvbWUgcHJvcGVydGllcyBtdXN0IGJlIGFsd2F5cyBpbiBzeW5jIHdpdGggdGhlIHBhcmVudCB0YWdcbiAgICAgIHZhciBtdXN0U3luYyA9IH5wcm9wc0luU3luY1dpdGhQYXJlbnQuaW5kZXhPZihrKVxuICAgICAgaWYgKHR5cGVvZiBzZWxmW2tdID09PSBUX1VOREVGIHx8IG11c3RTeW5jKSB7XG4gICAgICAgIC8vIHRyYWNrIHRoZSBwcm9wZXJ0eSB0byBrZWVwIGluIHN5bmNcbiAgICAgICAgLy8gc28gd2UgY2FuIGtlZXAgaXQgdXBkYXRlZFxuICAgICAgICBpZiAoIW11c3RTeW5jKSBwcm9wc0luU3luY1dpdGhQYXJlbnQucHVzaChrKVxuICAgICAgICBzZWxmW2tdID0gc2VsZi5wYXJlbnRba11cbiAgICAgIH1cbiAgICB9KVxuICB9XG5cbiAgdGhpcy51cGRhdGUgPSBmdW5jdGlvbihkYXRhKSB7XG4gICAgLy8gbWFrZSBzdXJlIHRoZSBkYXRhIHBhc3NlZCB3aWxsIG5vdCBvdmVycmlkZVxuICAgIC8vIHRoZSBjb21wb25lbnQgY29yZSBtZXRob2RzXG4gICAgZGF0YSA9IGNsZWFuVXBEYXRhKGRhdGEpXG4gICAgLy8gaW5oZXJpdCBwcm9wZXJ0aWVzIGZyb20gdGhlIHBhcmVudFxuICAgIGluaGVyaXRGcm9tUGFyZW50KClcbiAgICAvLyBub3JtYWxpemUgdGhlIHRhZyBwcm9wZXJ0aWVzIGluIGNhc2UgYW4gaXRlbSBvYmplY3Qgd2FzIGluaXRpYWxseSBwYXNzZWRcbiAgICBpZiAodHlwZW9mIGl0ZW0gPT09IFRfT0JKRUNUKSB7XG4gICAgICBub3JtYWxpemVEYXRhKGRhdGEgfHwge30pXG4gICAgICBpdGVtID0gZGF0YVxuICAgIH1cbiAgICBleHRlbmQoc2VsZiwgZGF0YSlcbiAgICB1cGRhdGVPcHRzKClcbiAgICBzZWxmLnRyaWdnZXIoJ3VwZGF0ZScsIGRhdGEpXG4gICAgdXBkYXRlKGV4cHJlc3Npb25zLCBzZWxmKVxuICAgIHNlbGYudHJpZ2dlcigndXBkYXRlZCcpXG4gIH1cblxuICB0aGlzLm1peGluID0gZnVuY3Rpb24oKSB7XG4gICAgZWFjaChhcmd1bWVudHMsIGZ1bmN0aW9uKG1peCkge1xuICAgICAgbWl4ID0gdHlwZW9mIG1peCA9PT0gVF9TVFJJTkcgPyByaW90Lm1peGluKG1peCkgOiBtaXhcbiAgICAgIGVhY2goT2JqZWN0LmtleXMobWl4KSwgZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgIC8vIGJpbmQgbWV0aG9kcyB0byBzZWxmXG4gICAgICAgIGlmIChrZXkgIT0gJ2luaXQnKVxuICAgICAgICAgIHNlbGZba2V5XSA9IGlzRnVuY3Rpb24obWl4W2tleV0pID8gbWl4W2tleV0uYmluZChzZWxmKSA6IG1peFtrZXldXG4gICAgICB9KVxuICAgICAgLy8gaW5pdCBtZXRob2Qgd2lsbCBiZSBjYWxsZWQgYXV0b21hdGljYWxseVxuICAgICAgaWYgKG1peC5pbml0KSBtaXguaW5pdC5iaW5kKHNlbGYpKClcbiAgICB9KVxuICB9XG5cbiAgdGhpcy5tb3VudCA9IGZ1bmN0aW9uKCkge1xuXG4gICAgdXBkYXRlT3B0cygpXG5cbiAgICAvLyBpbml0aWFsaWF0aW9uXG4gICAgZm4gJiYgZm4uY2FsbChzZWxmLCBvcHRzKVxuXG4gICAgLy8gcGFyc2UgbGF5b3V0IGFmdGVyIGluaXQuIGZuIG1heSBjYWxjdWxhdGUgYXJncyBmb3IgbmVzdGVkIGN1c3RvbSB0YWdzXG4gICAgcGFyc2VFeHByZXNzaW9ucyhkb20sIHNlbGYsIGV4cHJlc3Npb25zKVxuXG4gICAgLy8gbW91bnQgdGhlIGNoaWxkIHRhZ3NcbiAgICB0b2dnbGUodHJ1ZSlcblxuICAgIC8vIHVwZGF0ZSB0aGUgcm9vdCBhZGRpbmcgY3VzdG9tIGF0dHJpYnV0ZXMgY29taW5nIGZyb20gdGhlIGNvbXBpbGVyXG4gICAgaWYgKGltcGwuYXR0cnMpIHtcbiAgICAgIHdhbGtBdHRyaWJ1dGVzKGltcGwuYXR0cnMsIGZ1bmN0aW9uIChrLCB2KSB7IHJvb3Quc2V0QXR0cmlidXRlKGssIHYpIH0pXG4gICAgICBwYXJzZUV4cHJlc3Npb25zKHNlbGYucm9vdCwgc2VsZiwgZXhwcmVzc2lvbnMpXG4gICAgfVxuXG4gICAgaWYgKCFzZWxmLnBhcmVudCB8fCBpc0xvb3ApIHNlbGYudXBkYXRlKGl0ZW0pXG5cbiAgICAvLyBpbnRlcm5hbCB1c2Ugb25seSwgZml4ZXMgIzQwM1xuICAgIHNlbGYudHJpZ2dlcigncHJlbW91bnQnKVxuXG4gICAgaWYgKGlzTG9vcCAmJiAhaGFzSW1wbCkge1xuICAgICAgLy8gdXBkYXRlIHRoZSByb290IGF0dHJpYnV0ZSBmb3IgdGhlIGxvb3BlZCBlbGVtZW50c1xuICAgICAgc2VsZi5yb290ID0gcm9vdCA9IGxvb3BEb20gPSBkb20uZmlyc3RDaGlsZFxuXG4gICAgfSBlbHNlIHtcbiAgICAgIHdoaWxlIChkb20uZmlyc3RDaGlsZCkgcm9vdC5hcHBlbmRDaGlsZChkb20uZmlyc3RDaGlsZClcbiAgICAgIGlmIChyb290LnN0dWIpIHNlbGYucm9vdCA9IHJvb3QgPSBwYXJlbnQucm9vdFxuICAgIH1cbiAgICAvLyBpZiBpdCdzIG5vdCBhIGNoaWxkIHRhZyB3ZSBjYW4gdHJpZ2dlciBpdHMgbW91bnQgZXZlbnRcbiAgICBpZiAoIXNlbGYucGFyZW50IHx8IHNlbGYucGFyZW50LmlzTW91bnRlZCkge1xuICAgICAgc2VsZi5pc01vdW50ZWQgPSB0cnVlXG4gICAgICBzZWxmLnRyaWdnZXIoJ21vdW50JylcbiAgICB9XG4gICAgLy8gb3RoZXJ3aXNlIHdlIG5lZWQgdG8gd2FpdCB0aGF0IHRoZSBwYXJlbnQgZXZlbnQgZ2V0cyB0cmlnZ2VyZWRcbiAgICBlbHNlIHNlbGYucGFyZW50Lm9uZSgnbW91bnQnLCBmdW5jdGlvbigpIHtcbiAgICAgIC8vIGF2b2lkIHRvIHRyaWdnZXIgdGhlIGBtb3VudGAgZXZlbnQgZm9yIHRoZSB0YWdzXG4gICAgICAvLyBub3QgdmlzaWJsZSBpbmNsdWRlZCBpbiBhbiBpZiBzdGF0ZW1lbnRcbiAgICAgIGlmICghaXNJblN0dWIoc2VsZi5yb290KSkge1xuICAgICAgICBzZWxmLnBhcmVudC5pc01vdW50ZWQgPSBzZWxmLmlzTW91bnRlZCA9IHRydWVcbiAgICAgICAgc2VsZi50cmlnZ2VyKCdtb3VudCcpXG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG5cbiAgdGhpcy51bm1vdW50ID0gZnVuY3Rpb24oa2VlcFJvb3RUYWcpIHtcbiAgICB2YXIgZWwgPSBsb29wRG9tIHx8IHJvb3QsXG4gICAgICAgIHAgPSBlbC5wYXJlbnROb2RlLFxuICAgICAgICBwdGFnXG5cbiAgICBpZiAocCkge1xuXG4gICAgICBpZiAocGFyZW50KSB7XG4gICAgICAgIHB0YWcgPSBnZXRJbW1lZGlhdGVDdXN0b21QYXJlbnRUYWcocGFyZW50KVxuICAgICAgICAvLyByZW1vdmUgdGhpcyB0YWcgZnJvbSB0aGUgcGFyZW50IHRhZ3Mgb2JqZWN0XG4gICAgICAgIC8vIGlmIHRoZXJlIGFyZSBtdWx0aXBsZSBuZXN0ZWQgdGFncyB3aXRoIHNhbWUgbmFtZS4uXG4gICAgICAgIC8vIHJlbW92ZSB0aGlzIGVsZW1lbnQgZm9ybSB0aGUgYXJyYXlcbiAgICAgICAgaWYgKGlzQXJyYXkocHRhZy50YWdzW3RhZ05hbWVdKSlcbiAgICAgICAgICBlYWNoKHB0YWcudGFnc1t0YWdOYW1lXSwgZnVuY3Rpb24odGFnLCBpKSB7XG4gICAgICAgICAgICBpZiAodGFnLl9pZCA9PSBzZWxmLl9pZClcbiAgICAgICAgICAgICAgcHRhZy50YWdzW3RhZ05hbWVdLnNwbGljZShpLCAxKVxuICAgICAgICAgIH0pXG4gICAgICAgIGVsc2VcbiAgICAgICAgICAvLyBvdGhlcndpc2UganVzdCBkZWxldGUgdGhlIHRhZyBpbnN0YW5jZVxuICAgICAgICAgIHB0YWcudGFnc1t0YWdOYW1lXSA9IHVuZGVmaW5lZFxuICAgICAgfVxuXG4gICAgICBlbHNlXG4gICAgICAgIHdoaWxlIChlbC5maXJzdENoaWxkKSBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKVxuXG4gICAgICBpZiAoIWtlZXBSb290VGFnKVxuICAgICAgICBwLnJlbW92ZUNoaWxkKGVsKVxuXG4gICAgfVxuXG5cbiAgICBzZWxmLnRyaWdnZXIoJ3VubW91bnQnKVxuICAgIHRvZ2dsZSgpXG4gICAgc2VsZi5vZmYoJyonKVxuICAgIC8vIHNvbWVob3cgaWU4IGRvZXMgbm90IGxpa2UgYGRlbGV0ZSByb290Ll90YWdgXG4gICAgcm9vdC5fdGFnID0gbnVsbFxuXG4gIH1cblxuICBmdW5jdGlvbiB0b2dnbGUoaXNNb3VudCkge1xuXG4gICAgLy8gbW91bnQvdW5tb3VudCBjaGlsZHJlblxuICAgIGVhY2goY2hpbGRUYWdzLCBmdW5jdGlvbihjaGlsZCkgeyBjaGlsZFtpc01vdW50ID8gJ21vdW50JyA6ICd1bm1vdW50J10oKSB9KVxuXG4gICAgLy8gbGlzdGVuL3VubGlzdGVuIHBhcmVudCAoZXZlbnRzIGZsb3cgb25lIHdheSBmcm9tIHBhcmVudCB0byBjaGlsZHJlbilcbiAgICBpZiAocGFyZW50KSB7XG4gICAgICB2YXIgZXZ0ID0gaXNNb3VudCA/ICdvbicgOiAnb2ZmJ1xuXG4gICAgICAvLyB0aGUgbG9vcCB0YWdzIHdpbGwgYmUgYWx3YXlzIGluIHN5bmMgd2l0aCB0aGUgcGFyZW50IGF1dG9tYXRpY2FsbHlcbiAgICAgIGlmIChpc0xvb3ApXG4gICAgICAgIHBhcmVudFtldnRdKCd1bm1vdW50Jywgc2VsZi51bm1vdW50KVxuICAgICAgZWxzZVxuICAgICAgICBwYXJlbnRbZXZ0XSgndXBkYXRlJywgc2VsZi51cGRhdGUpW2V2dF0oJ3VubW91bnQnLCBzZWxmLnVubW91bnQpXG4gICAgfVxuICB9XG5cbiAgLy8gbmFtZWQgZWxlbWVudHMgYXZhaWxhYmxlIGZvciBmblxuICBwYXJzZU5hbWVkRWxlbWVudHMoZG9tLCB0aGlzLCBjaGlsZFRhZ3MpXG5cblxufVxuXG5mdW5jdGlvbiBzZXRFdmVudEhhbmRsZXIobmFtZSwgaGFuZGxlciwgZG9tLCB0YWcpIHtcblxuICBkb21bbmFtZV0gPSBmdW5jdGlvbihlKSB7XG5cbiAgICB2YXIgaXRlbSA9IHRhZy5faXRlbSxcbiAgICAgICAgcHRhZyA9IHRhZy5wYXJlbnQsXG4gICAgICAgIGVsXG5cbiAgICBpZiAoIWl0ZW0pXG4gICAgICB3aGlsZSAocHRhZykge1xuICAgICAgICBpdGVtID0gcHRhZy5faXRlbVxuICAgICAgICBwdGFnID0gaXRlbSA/IGZhbHNlIDogcHRhZy5wYXJlbnRcbiAgICAgIH1cblxuICAgIC8vIGNyb3NzIGJyb3dzZXIgZXZlbnQgZml4XG4gICAgZSA9IGUgfHwgd2luZG93LmV2ZW50XG5cbiAgICAvLyBpZ25vcmUgZXJyb3Igb24gc29tZSBicm93c2Vyc1xuICAgIHRyeSB7XG4gICAgICBlLmN1cnJlbnRUYXJnZXQgPSBkb21cbiAgICAgIGlmICghZS50YXJnZXQpIGUudGFyZ2V0ID0gZS5zcmNFbGVtZW50XG4gICAgICBpZiAoIWUud2hpY2gpIGUud2hpY2ggPSBlLmNoYXJDb2RlIHx8IGUua2V5Q29kZVxuICAgIH0gY2F0Y2ggKGlnbm9yZWQpIHsgJycgfVxuXG4gICAgZS5pdGVtID0gaXRlbVxuXG4gICAgLy8gcHJldmVudCBkZWZhdWx0IGJlaGF2aW91ciAoYnkgZGVmYXVsdClcbiAgICBpZiAoaGFuZGxlci5jYWxsKHRhZywgZSkgIT09IHRydWUgJiYgIS9yYWRpb3xjaGVjay8udGVzdChkb20udHlwZSkpIHtcbiAgICAgIGUucHJldmVudERlZmF1bHQgJiYgZS5wcmV2ZW50RGVmYXVsdCgpXG4gICAgICBlLnJldHVyblZhbHVlID0gZmFsc2VcbiAgICB9XG5cbiAgICBpZiAoIWUucHJldmVudFVwZGF0ZSkge1xuICAgICAgZWwgPSBpdGVtID8gZ2V0SW1tZWRpYXRlQ3VzdG9tUGFyZW50VGFnKHB0YWcpIDogdGFnXG4gICAgICBlbC51cGRhdGUoKVxuICAgIH1cblxuICB9XG5cbn1cblxuLy8gdXNlZCBieSBpZi0gYXR0cmlidXRlXG5mdW5jdGlvbiBpbnNlcnRUbyhyb290LCBub2RlLCBiZWZvcmUpIHtcbiAgaWYgKHJvb3QpIHtcbiAgICByb290Lmluc2VydEJlZm9yZShiZWZvcmUsIG5vZGUpXG4gICAgcm9vdC5yZW1vdmVDaGlsZChub2RlKVxuICB9XG59XG5cbmZ1bmN0aW9uIHVwZGF0ZShleHByZXNzaW9ucywgdGFnKSB7XG5cbiAgZWFjaChleHByZXNzaW9ucywgZnVuY3Rpb24oZXhwciwgaSkge1xuXG4gICAgdmFyIGRvbSA9IGV4cHIuZG9tLFxuICAgICAgICBhdHRyTmFtZSA9IGV4cHIuYXR0cixcbiAgICAgICAgdmFsdWUgPSB0bXBsKGV4cHIuZXhwciwgdGFnKSxcbiAgICAgICAgcGFyZW50ID0gZXhwci5kb20ucGFyZW50Tm9kZVxuXG4gICAgaWYgKHZhbHVlID09IG51bGwpIHZhbHVlID0gJydcblxuICAgIC8vIGxlYXZlIG91dCByaW90LSBwcmVmaXhlcyBmcm9tIHN0cmluZ3MgaW5zaWRlIHRleHRhcmVhXG4gICAgaWYgKHBhcmVudCAmJiBwYXJlbnQudGFnTmFtZSA9PSAnVEVYVEFSRUEnKSB2YWx1ZSA9IHZhbHVlLnJlcGxhY2UoL3Jpb3QtL2csICcnKVxuXG4gICAgLy8gbm8gY2hhbmdlXG4gICAgaWYgKGV4cHIudmFsdWUgPT09IHZhbHVlKSByZXR1cm5cbiAgICBleHByLnZhbHVlID0gdmFsdWVcblxuICAgIC8vIHRleHQgbm9kZVxuICAgIGlmICghYXR0ck5hbWUpIHJldHVybiBkb20ubm9kZVZhbHVlID0gdmFsdWUudG9TdHJpbmcoKVxuXG4gICAgLy8gcmVtb3ZlIG9yaWdpbmFsIGF0dHJpYnV0ZVxuICAgIHJlbUF0dHIoZG9tLCBhdHRyTmFtZSlcbiAgICAvLyBldmVudCBoYW5kbGVyXG4gICAgaWYgKGlzRnVuY3Rpb24odmFsdWUpKSB7XG4gICAgICBzZXRFdmVudEhhbmRsZXIoYXR0ck5hbWUsIHZhbHVlLCBkb20sIHRhZylcblxuICAgIC8vIGlmLSBjb25kaXRpb25hbFxuICAgIH0gZWxzZSBpZiAoYXR0ck5hbWUgPT0gJ2lmJykge1xuICAgICAgdmFyIHN0dWIgPSBleHByLnN0dWJcblxuICAgICAgLy8gYWRkIHRvIERPTVxuICAgICAgaWYgKHZhbHVlKSB7XG4gICAgICAgIGlmIChzdHViKSB7XG4gICAgICAgICAgaW5zZXJ0VG8oc3R1Yi5wYXJlbnROb2RlLCBzdHViLCBkb20pXG4gICAgICAgICAgZG9tLmluU3R1YiA9IGZhbHNlXG4gICAgICAgICAgLy8gYXZvaWQgdG8gdHJpZ2dlciB0aGUgbW91bnQgZXZlbnQgaWYgdGhlIHRhZ3MgaXMgbm90IHZpc2libGUgeWV0XG4gICAgICAgICAgLy8gbWF5YmUgd2UgY2FuIG9wdGltaXplIHRoaXMgYXZvaWRpbmcgdG8gbW91bnQgdGhlIHRhZyBhdCBhbGxcbiAgICAgICAgICBpZiAoIWlzSW5TdHViKGRvbSkpIHtcbiAgICAgICAgICAgIHdhbGsoZG9tLCBmdW5jdGlvbihlbCkge1xuICAgICAgICAgICAgICBpZiAoZWwuX3RhZyAmJiAhZWwuX3RhZy5pc01vdW50ZWQpIGVsLl90YWcuaXNNb3VudGVkID0gISFlbC5fdGFnLnRyaWdnZXIoJ21vdW50JylcbiAgICAgICAgICAgIH0pXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAvLyByZW1vdmUgZnJvbSBET01cbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIHN0dWIgPSBleHByLnN0dWIgPSBzdHViIHx8IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKCcnKVxuICAgICAgICBpbnNlcnRUbyhkb20ucGFyZW50Tm9kZSwgZG9tLCBzdHViKVxuICAgICAgICBkb20uaW5TdHViID0gdHJ1ZVxuICAgICAgfVxuICAgIC8vIHNob3cgLyBoaWRlXG4gICAgfSBlbHNlIGlmICgvXihzaG93fGhpZGUpJC8udGVzdChhdHRyTmFtZSkpIHtcbiAgICAgIGlmIChhdHRyTmFtZSA9PSAnaGlkZScpIHZhbHVlID0gIXZhbHVlXG4gICAgICBkb20uc3R5bGUuZGlzcGxheSA9IHZhbHVlID8gJycgOiAnbm9uZSdcblxuICAgIC8vIGZpZWxkIHZhbHVlXG4gICAgfSBlbHNlIGlmIChhdHRyTmFtZSA9PSAndmFsdWUnKSB7XG4gICAgICBkb20udmFsdWUgPSB2YWx1ZVxuXG4gICAgLy8gPGltZyBzcmM9XCJ7IGV4cHIgfVwiPlxuICAgIH0gZWxzZSBpZiAoYXR0ck5hbWUuc2xpY2UoMCwgNSkgPT0gJ3Jpb3QtJyAmJiBhdHRyTmFtZSAhPSAncmlvdC10YWcnKSB7XG4gICAgICBhdHRyTmFtZSA9IGF0dHJOYW1lLnNsaWNlKDUpXG4gICAgICB2YWx1ZSA/IGRvbS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIHZhbHVlKSA6IHJlbUF0dHIoZG9tLCBhdHRyTmFtZSlcblxuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoZXhwci5ib29sKSB7XG4gICAgICAgIGRvbVthdHRyTmFtZV0gPSB2YWx1ZVxuICAgICAgICBpZiAoIXZhbHVlKSByZXR1cm5cbiAgICAgICAgdmFsdWUgPSBhdHRyTmFtZVxuICAgICAgfVxuXG4gICAgICBpZiAodHlwZW9mIHZhbHVlICE9PSBUX09CSkVDVCkgZG9tLnNldEF0dHJpYnV0ZShhdHRyTmFtZSwgdmFsdWUpXG5cbiAgICB9XG5cbiAgfSlcblxufVxuZnVuY3Rpb24gZWFjaChlbHMsIGZuKSB7XG4gIGZvciAodmFyIGkgPSAwLCBsZW4gPSAoZWxzIHx8IFtdKS5sZW5ndGgsIGVsOyBpIDwgbGVuOyBpKyspIHtcbiAgICBlbCA9IGVsc1tpXVxuICAgIC8vIHJldHVybiBmYWxzZSAtPiByZW1vdmUgY3VycmVudCBpdGVtIGR1cmluZyBsb29wXG4gICAgaWYgKGVsICE9IG51bGwgJiYgZm4oZWwsIGkpID09PSBmYWxzZSkgaS0tXG4gIH1cbiAgcmV0dXJuIGVsc1xufVxuXG5mdW5jdGlvbiBpc0Z1bmN0aW9uKHYpIHtcbiAgcmV0dXJuIHR5cGVvZiB2ID09PSBUX0ZVTkNUSU9OIHx8IGZhbHNlICAgLy8gYXZvaWQgSUUgcHJvYmxlbXNcbn1cblxuZnVuY3Rpb24gcmVtQXR0cihkb20sIG5hbWUpIHtcbiAgZG9tLnJlbW92ZUF0dHJpYnV0ZShuYW1lKVxufVxuXG5mdW5jdGlvbiBnZXRUYWcoZG9tKSB7XG4gIHJldHVybiB0YWdJbXBsW2RvbS5nZXRBdHRyaWJ1dGUoUklPVF9UQUcpIHx8IGRvbS50YWdOYW1lLnRvTG93ZXJDYXNlKCldXG59XG5cbmZ1bmN0aW9uIGdldEltbWVkaWF0ZUN1c3RvbVBhcmVudFRhZyh0YWcpIHtcbiAgdmFyIHB0YWcgPSB0YWdcbiAgd2hpbGUgKCFnZXRUYWcocHRhZy5yb290KSkge1xuICAgIGlmICghcHRhZy5wYXJlbnQpIGJyZWFrXG4gICAgcHRhZyA9IHB0YWcucGFyZW50XG4gIH1cbiAgcmV0dXJuIHB0YWdcbn1cblxuZnVuY3Rpb24gZ2V0VGFnTmFtZShkb20pIHtcbiAgdmFyIGNoaWxkID0gZ2V0VGFnKGRvbSksXG4gICAgbmFtZWRUYWcgPSBkb20uZ2V0QXR0cmlidXRlKCduYW1lJyksXG4gICAgdGFnTmFtZSA9IG5hbWVkVGFnICYmIG5hbWVkVGFnLmluZGV4T2YoYnJhY2tldHMoMCkpIDwgMCA/IG5hbWVkVGFnIDogY2hpbGQgPyBjaGlsZC5uYW1lIDogZG9tLnRhZ05hbWUudG9Mb3dlckNhc2UoKVxuXG4gIHJldHVybiB0YWdOYW1lXG59XG5cbmZ1bmN0aW9uIGV4dGVuZChzcmMpIHtcbiAgdmFyIG9iaiwgYXJncyA9IGFyZ3VtZW50c1xuICBmb3IgKHZhciBpID0gMTsgaSA8IGFyZ3MubGVuZ3RoOyArK2kpIHtcbiAgICBpZiAoKG9iaiA9IGFyZ3NbaV0pKSB7XG4gICAgICBmb3IgKHZhciBrZXkgaW4gb2JqKSB7ICAgICAgLy8gZXNsaW50LWRpc2FibGUtbGluZSBndWFyZC1mb3ItaW5cbiAgICAgICAgc3JjW2tleV0gPSBvYmpba2V5XVxuICAgICAgfVxuICAgIH1cbiAgfVxuICByZXR1cm4gc3JjXG59XG5cbi8vIHdpdGggdGhpcyBmdW5jdGlvbiB3ZSBhdm9pZCB0aGF0IHRoZSBjdXJyZW50IFRhZyBtZXRob2RzIGdldCBvdmVycmlkZGVuXG5mdW5jdGlvbiBjbGVhblVwRGF0YShkYXRhKSB7XG4gIGlmICghKGRhdGEgaW5zdGFuY2VvZiBUYWcpICYmICEoZGF0YSAmJiB0eXBlb2YgZGF0YS50cmlnZ2VyID09IFRfRlVOQ1RJT04pKSByZXR1cm4gZGF0YVxuXG4gIHZhciBvID0ge31cbiAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICBpZiAoIX5SRVNFUlZFRF9XT1JEU19CTEFDS0xJU1QuaW5kZXhPZihrZXkpKVxuICAgICAgb1trZXldID0gZGF0YVtrZXldXG4gIH1cbiAgcmV0dXJuIG9cbn1cblxuZnVuY3Rpb24gbWtkb20odGVtcGxhdGUpIHtcbiAgdmFyIGNoZWNraWUgPSBpZVZlcnNpb24gJiYgaWVWZXJzaW9uIDwgMTAsXG4gICAgICBtYXRjaGVzID0gL15cXHMqPChbXFx3LV0rKS8uZXhlYyh0ZW1wbGF0ZSksXG4gICAgICB0YWdOYW1lID0gbWF0Y2hlcyA/IG1hdGNoZXNbMV0udG9Mb3dlckNhc2UoKSA6ICcnLFxuICAgICAgcm9vdFRhZyA9ICh0YWdOYW1lID09PSAndGgnIHx8IHRhZ05hbWUgPT09ICd0ZCcpID8gJ3RyJyA6XG4gICAgICAgICAgICAgICAgKHRhZ05hbWUgPT09ICd0cicgPyAndGJvZHknIDogJ2RpdicpLFxuICAgICAgZWwgPSBta0VsKHJvb3RUYWcpXG5cbiAgZWwuc3R1YiA9IHRydWVcblxuICBpZiAoY2hlY2tpZSkge1xuICAgIGlmICh0YWdOYW1lID09PSAnb3B0Z3JvdXAnKVxuICAgICAgb3B0Z3JvdXBJbm5lckhUTUwoZWwsIHRlbXBsYXRlKVxuICAgIGVsc2UgaWYgKHRhZ05hbWUgPT09ICdvcHRpb24nKVxuICAgICAgb3B0aW9uSW5uZXJIVE1MKGVsLCB0ZW1wbGF0ZSlcbiAgICBlbHNlIGlmIChyb290VGFnICE9PSAnZGl2JylcbiAgICAgIHRib2R5SW5uZXJIVE1MKGVsLCB0ZW1wbGF0ZSwgdGFnTmFtZSlcbiAgICBlbHNlXG4gICAgICBjaGVja2llID0gMFxuICB9XG4gIGlmICghY2hlY2tpZSkgZWwuaW5uZXJIVE1MID0gdGVtcGxhdGVcblxuICByZXR1cm4gZWxcbn1cblxuZnVuY3Rpb24gd2Fsayhkb20sIGZuKSB7XG4gIGlmIChkb20pIHtcbiAgICBpZiAoZm4oZG9tKSA9PT0gZmFsc2UpIHdhbGsoZG9tLm5leHRTaWJsaW5nLCBmbilcbiAgICBlbHNlIHtcbiAgICAgIGRvbSA9IGRvbS5maXJzdENoaWxkXG5cbiAgICAgIHdoaWxlIChkb20pIHtcbiAgICAgICAgd2Fsayhkb20sIGZuKVxuICAgICAgICBkb20gPSBkb20ubmV4dFNpYmxpbmdcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cblxuLy8gbWluaW1pemUgcmlzazogb25seSB6ZXJvIG9yIG9uZSBfc3BhY2VfIGJldHdlZW4gYXR0ciAmIHZhbHVlXG5mdW5jdGlvbiB3YWxrQXR0cmlidXRlcyhodG1sLCBmbikge1xuICB2YXIgbSxcbiAgICAgIHJlID0gLyhbLVxcd10rKSA/PSA/KD86XCIoW15cIl0qKXwnKFteJ10qKXwoe1tefV0qfSkpL2dcblxuICB3aGlsZSAoKG0gPSByZS5leGVjKGh0bWwpKSkge1xuICAgIGZuKG1bMV0udG9Mb3dlckNhc2UoKSwgbVsyXSB8fCBtWzNdIHx8IG1bNF0pXG4gIH1cbn1cblxuZnVuY3Rpb24gaXNJblN0dWIoZG9tKSB7XG4gIHdoaWxlIChkb20pIHtcbiAgICBpZiAoZG9tLmluU3R1YikgcmV0dXJuIHRydWVcbiAgICBkb20gPSBkb20ucGFyZW50Tm9kZVxuICB9XG4gIHJldHVybiBmYWxzZVxufVxuXG5mdW5jdGlvbiBta0VsKG5hbWUpIHtcbiAgcmV0dXJuIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQobmFtZSlcbn1cblxuZnVuY3Rpb24gcmVwbGFjZVlpZWxkICh0bXBsLCBpbm5lckhUTUwpIHtcbiAgcmV0dXJuIHRtcGwucmVwbGFjZSgvPCh5aWVsZClcXC8/Pig8XFwvXFwxPik/L2dpbSwgaW5uZXJIVE1MIHx8ICcnKVxufVxuXG5mdW5jdGlvbiAkJChzZWxlY3RvciwgY3R4KSB7XG4gIHJldHVybiAoY3R4IHx8IGRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKVxufVxuXG5mdW5jdGlvbiAkKHNlbGVjdG9yLCBjdHgpIHtcbiAgcmV0dXJuIChjdHggfHwgZG9jdW1lbnQpLnF1ZXJ5U2VsZWN0b3Ioc2VsZWN0b3IpXG59XG5cbmZ1bmN0aW9uIGluaGVyaXQocGFyZW50KSB7XG4gIGZ1bmN0aW9uIENoaWxkKCkge31cbiAgQ2hpbGQucHJvdG90eXBlID0gcGFyZW50XG4gIHJldHVybiBuZXcgQ2hpbGQoKVxufVxuXG5mdW5jdGlvbiBzZXROYW1lZChkb20sIHBhcmVudCwga2V5cykge1xuICBpZiAoZG9tLl92aXNpdGVkKSByZXR1cm5cbiAgdmFyIHAsXG4gICAgICB2ID0gZG9tLmdldEF0dHJpYnV0ZSgnaWQnKSB8fCBkb20uZ2V0QXR0cmlidXRlKCduYW1lJylcblxuICBpZiAodikge1xuICAgIGlmIChrZXlzLmluZGV4T2YodikgPCAwKSB7XG4gICAgICBwID0gcGFyZW50W3ZdXG4gICAgICBpZiAoIXApXG4gICAgICAgIHBhcmVudFt2XSA9IGRvbVxuICAgICAgZWxzZVxuICAgICAgICBpc0FycmF5KHApID8gcC5wdXNoKGRvbSkgOiAocGFyZW50W3ZdID0gW3AsIGRvbV0pXG4gICAgfVxuICAgIGRvbS5fdmlzaXRlZCA9IHRydWVcbiAgfVxufVxuLyoqXG4gKlxuICogSGFja3MgbmVlZGVkIGZvciB0aGUgb2xkIGludGVybmV0IGV4cGxvcmVyIHZlcnNpb25zIFtsb3dlciB0aGFuIElFMTBdXG4gKlxuICovXG4vKiBpc3RhbmJ1bCBpZ25vcmUgbmV4dCAqL1xuZnVuY3Rpb24gdGJvZHlJbm5lckhUTUwoZWwsIGh0bWwsIHRhZ05hbWUpIHtcbiAgdmFyIGRpdiA9IG1rRWwoJ2RpdicpLFxuICAgICAgbG9vcHMgPSAvdGR8dGgvLnRlc3QodGFnTmFtZSkgPyAzIDogMixcbiAgICAgIGNoaWxkXG5cbiAgZGl2LmlubmVySFRNTCA9ICc8dGFibGU+JyArIGh0bWwgKyAnPC90YWJsZT4nXG4gIGNoaWxkID0gZGl2LmZpcnN0Q2hpbGRcblxuICB3aGlsZSAobG9vcHMtLSkgY2hpbGQgPSBjaGlsZC5maXJzdENoaWxkXG5cbiAgZWwuYXBwZW5kQ2hpbGQoY2hpbGQpXG5cbn1cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5mdW5jdGlvbiBvcHRpb25Jbm5lckhUTUwoZWwsIGh0bWwpIHtcbiAgdmFyIG9wdCA9IG1rRWwoJ29wdGlvbicpLFxuICAgICAgdmFsUmVneCA9IC92YWx1ZT1bXFxcIiddKC4rPylbXFxcIiddLyxcbiAgICAgIHNlbFJlZ3ggPSAvc2VsZWN0ZWQ9W1xcXCInXSguKz8pW1xcXCInXS8sXG4gICAgICBlYWNoUmVneCA9IC9lYWNoPVtcXFwiJ10oLis/KVtcXFwiJ10vLFxuICAgICAgaWZSZWd4ID0gL2lmPVtcXFwiJ10oLis/KVtcXFwiJ10vLFxuICAgICAgaW5uZXJSZWd4ID0gLz4oW148XSopPC8sXG4gICAgICB2YWx1ZXNNYXRjaCA9IGh0bWwubWF0Y2godmFsUmVneCksXG4gICAgICBzZWxlY3RlZE1hdGNoID0gaHRtbC5tYXRjaChzZWxSZWd4KSxcbiAgICAgIGlubmVyVmFsdWUgPSBodG1sLm1hdGNoKGlubmVyUmVneCksXG4gICAgICBlYWNoTWF0Y2ggPSBodG1sLm1hdGNoKGVhY2hSZWd4KSxcbiAgICAgIGlmTWF0Y2ggPSBodG1sLm1hdGNoKGlmUmVneClcblxuICBpZiAoaW5uZXJWYWx1ZSkgb3B0LmlubmVySFRNTCA9IGlubmVyVmFsdWVbMV1cbiAgZWxzZSBvcHQuaW5uZXJIVE1MID0gaHRtbFxuXG4gIGlmICh2YWx1ZXNNYXRjaCkgb3B0LnZhbHVlID0gdmFsdWVzTWF0Y2hbMV1cbiAgaWYgKHNlbGVjdGVkTWF0Y2gpIG9wdC5zZXRBdHRyaWJ1dGUoJ3Jpb3Qtc2VsZWN0ZWQnLCBzZWxlY3RlZE1hdGNoWzFdKVxuICBpZiAoZWFjaE1hdGNoKSBvcHQuc2V0QXR0cmlidXRlKCdlYWNoJywgZWFjaE1hdGNoWzFdKVxuICBpZiAoaWZNYXRjaCkgb3B0LnNldEF0dHJpYnV0ZSgnaWYnLCBpZk1hdGNoWzFdKVxuXG4gIGVsLmFwcGVuZENoaWxkKG9wdClcbn1cbi8qIGlzdGFuYnVsIGlnbm9yZSBuZXh0ICovXG5mdW5jdGlvbiBvcHRncm91cElubmVySFRNTChlbCwgaHRtbCkge1xuICB2YXIgb3B0ID0gbWtFbCgnb3B0Z3JvdXAnKSxcbiAgICAgIGxhYmVsUmVneCA9IC9sYWJlbD1bXFxcIiddKC4rPylbXFxcIiddLyxcbiAgICAgIGVsZW1lbnRSZWd4ID0gL148KFtePl0qKT4vLFxuICAgICAgdGFnUmVneCA9IC9ePChbXiBcXD5dKikvLFxuICAgICAgbGFiZWxNYXRjaCA9IGh0bWwubWF0Y2gobGFiZWxSZWd4KSxcbiAgICAgIGVsZW1lbnRNYXRjaCA9IGh0bWwubWF0Y2goZWxlbWVudFJlZ3gpLFxuICAgICAgdGFnTWF0Y2ggPSBodG1sLm1hdGNoKHRhZ1JlZ3gpLFxuICAgICAgaW5uZXJDb250ZW50ID0gaHRtbFxuXG4gIGlmIChlbGVtZW50TWF0Y2gpIHtcbiAgICB2YXIgb3B0aW9ucyA9IGh0bWwuc2xpY2UoZWxlbWVudE1hdGNoWzFdLmxlbmd0aCsyLCAtdGFnTWF0Y2hbMV0ubGVuZ3RoLTMpLnRyaW0oKVxuICAgIGlubmVyQ29udGVudCA9IG9wdGlvbnNcbiAgfVxuXG4gIGlmIChsYWJlbE1hdGNoKSBvcHQuc2V0QXR0cmlidXRlKCdyaW90LWxhYmVsJywgbGFiZWxNYXRjaFsxXSlcblxuICBpZiAoaW5uZXJDb250ZW50KSB7XG4gICAgdmFyIGlubmVyT3B0ID0gbWtFbCgnZGl2JylcblxuICAgIG9wdGlvbklubmVySFRNTChpbm5lck9wdCwgaW5uZXJDb250ZW50KVxuXG4gICAgb3B0LmFwcGVuZENoaWxkKGlubmVyT3B0LmZpcnN0Q2hpbGQpXG4gIH1cblxuICBlbC5hcHBlbmRDaGlsZChvcHQpXG59XG5cbi8qXG4gVmlydHVhbCBkb20gaXMgYW4gYXJyYXkgb2YgY3VzdG9tIHRhZ3Mgb24gdGhlIGRvY3VtZW50LlxuIFVwZGF0ZXMgYW5kIHVubW91bnRzIHByb3BhZ2F0ZSBkb3dud2FyZHMgZnJvbSBwYXJlbnQgdG8gY2hpbGRyZW4uXG4qL1xuXG52YXIgdmlydHVhbERvbSA9IFtdLFxuICAgIHRhZ0ltcGwgPSB7fSxcbiAgICBzdHlsZU5vZGVcblxudmFyIFJJT1RfVEFHID0gJ3Jpb3QtdGFnJ1xuXG5mdW5jdGlvbiBpbmplY3RTdHlsZShjc3MpIHtcblxuICBpZiAocmlvdC5yZW5kZXIpIHJldHVybiAvLyBza2lwIGluamVjdGlvbiBvbiB0aGUgc2VydmVyXG5cbiAgaWYgKCFzdHlsZU5vZGUpIHtcbiAgICBzdHlsZU5vZGUgPSBta0VsKCdzdHlsZScpXG4gICAgc3R5bGVOb2RlLnNldEF0dHJpYnV0ZSgndHlwZScsICd0ZXh0L2NzcycpXG4gIH1cblxuICB2YXIgaGVhZCA9IGRvY3VtZW50LmhlYWQgfHwgZG9jdW1lbnQuZ2V0RWxlbWVudHNCeVRhZ05hbWUoJ2hlYWQnKVswXVxuXG4gIGlmIChzdHlsZU5vZGUuc3R5bGVTaGVldClcbiAgICBzdHlsZU5vZGUuc3R5bGVTaGVldC5jc3NUZXh0ICs9IGNzc1xuICBlbHNlXG4gICAgc3R5bGVOb2RlLmlubmVySFRNTCArPSBjc3NcblxuICBpZiAoIXN0eWxlTm9kZS5fcmVuZGVyZWQpXG4gICAgaWYgKHN0eWxlTm9kZS5zdHlsZVNoZWV0KSB7XG4gICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKHN0eWxlTm9kZSlcbiAgICB9IGVsc2Uge1xuICAgICAgdmFyIHJzID0gJCgnc3R5bGVbdHlwZT1yaW90XScpXG4gICAgICBpZiAocnMpIHtcbiAgICAgICAgcnMucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoc3R5bGVOb2RlLCBycylcbiAgICAgICAgcnMucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChycylcbiAgICAgIH0gZWxzZSBoZWFkLmFwcGVuZENoaWxkKHN0eWxlTm9kZSlcblxuICAgIH1cblxuICBzdHlsZU5vZGUuX3JlbmRlcmVkID0gdHJ1ZVxuXG59XG5cbmZ1bmN0aW9uIG1vdW50VG8ocm9vdCwgdGFnTmFtZSwgb3B0cykge1xuICB2YXIgdGFnID0gdGFnSW1wbFt0YWdOYW1lXSxcbiAgICAgIC8vIGNhY2hlIHRoZSBpbm5lciBIVE1MIHRvIGZpeCAjODU1XG4gICAgICBpbm5lckhUTUwgPSByb290Ll9pbm5lckhUTUwgPSByb290Ll9pbm5lckhUTUwgfHwgcm9vdC5pbm5lckhUTUxcblxuICAvLyBjbGVhciB0aGUgaW5uZXIgaHRtbFxuICByb290LmlubmVySFRNTCA9ICcnXG5cbiAgaWYgKHRhZyAmJiByb290KSB0YWcgPSBuZXcgVGFnKHRhZywgeyByb290OiByb290LCBvcHRzOiBvcHRzIH0sIGlubmVySFRNTClcblxuICBpZiAodGFnICYmIHRhZy5tb3VudCkge1xuICAgIHRhZy5tb3VudCgpXG4gICAgdmlydHVhbERvbS5wdXNoKHRhZylcbiAgICByZXR1cm4gdGFnLm9uKCd1bm1vdW50JywgZnVuY3Rpb24oKSB7XG4gICAgICB2aXJ0dWFsRG9tLnNwbGljZSh2aXJ0dWFsRG9tLmluZGV4T2YodGFnKSwgMSlcbiAgICB9KVxuICB9XG5cbn1cblxucmlvdC50YWcgPSBmdW5jdGlvbihuYW1lLCBodG1sLCBjc3MsIGF0dHJzLCBmbikge1xuICBpZiAoaXNGdW5jdGlvbihhdHRycykpIHtcbiAgICBmbiA9IGF0dHJzXG4gICAgaWYgKC9eW1xcd1xcLV0rXFxzPz0vLnRlc3QoY3NzKSkge1xuICAgICAgYXR0cnMgPSBjc3NcbiAgICAgIGNzcyA9ICcnXG4gICAgfSBlbHNlIGF0dHJzID0gJydcbiAgfVxuICBpZiAoY3NzKSB7XG4gICAgaWYgKGlzRnVuY3Rpb24oY3NzKSkgZm4gPSBjc3NcbiAgICBlbHNlIGluamVjdFN0eWxlKGNzcylcbiAgfVxuICB0YWdJbXBsW25hbWVdID0geyBuYW1lOiBuYW1lLCB0bXBsOiBodG1sLCBhdHRyczogYXR0cnMsIGZuOiBmbiB9XG4gIHJldHVybiBuYW1lXG59XG5cbnJpb3QubW91bnQgPSBmdW5jdGlvbihzZWxlY3RvciwgdGFnTmFtZSwgb3B0cykge1xuXG4gIHZhciBlbHMsXG4gICAgICBhbGxUYWdzLFxuICAgICAgdGFncyA9IFtdXG5cbiAgLy8gaGVscGVyIGZ1bmN0aW9uc1xuXG4gIGZ1bmN0aW9uIGFkZFJpb3RUYWdzKGFycikge1xuICAgIHZhciBsaXN0ID0gJydcbiAgICBlYWNoKGFyciwgZnVuY3Rpb24gKGUpIHtcbiAgICAgIGxpc3QgKz0gJywgKltyaW90LXRhZz1cIicrIGUudHJpbSgpICsgJ1wiXSdcbiAgICB9KVxuICAgIHJldHVybiBsaXN0XG4gIH1cblxuICBmdW5jdGlvbiBzZWxlY3RBbGxUYWdzKCkge1xuICAgIHZhciBrZXlzID0gT2JqZWN0LmtleXModGFnSW1wbClcbiAgICByZXR1cm4ga2V5cyArIGFkZFJpb3RUYWdzKGtleXMpXG4gIH1cblxuICBmdW5jdGlvbiBwdXNoVGFncyhyb290KSB7XG4gICAgdmFyIGxhc3RcbiAgICBpZiAocm9vdC50YWdOYW1lKSB7XG4gICAgICBpZiAodGFnTmFtZSAmJiAoIShsYXN0ID0gcm9vdC5nZXRBdHRyaWJ1dGUoUklPVF9UQUcpKSB8fCBsYXN0ICE9IHRhZ05hbWUpKVxuICAgICAgICByb290LnNldEF0dHJpYnV0ZShSSU9UX1RBRywgdGFnTmFtZSlcblxuICAgICAgdmFyIHRhZyA9IG1vdW50VG8ocm9vdCxcbiAgICAgICAgdGFnTmFtZSB8fCByb290LmdldEF0dHJpYnV0ZShSSU9UX1RBRykgfHwgcm9vdC50YWdOYW1lLnRvTG93ZXJDYXNlKCksIG9wdHMpXG5cbiAgICAgIGlmICh0YWcpIHRhZ3MucHVzaCh0YWcpXG4gICAgfVxuICAgIGVsc2UgaWYgKHJvb3QubGVuZ3RoKSB7XG4gICAgICBlYWNoKHJvb3QsIHB1c2hUYWdzKSAgIC8vIGFzc3VtZSBub2RlTGlzdFxuICAgIH1cbiAgfVxuXG4gIC8vIC0tLS0tIG1vdW50IGNvZGUgLS0tLS1cblxuICBpZiAodHlwZW9mIHRhZ05hbWUgPT09IFRfT0JKRUNUKSB7XG4gICAgb3B0cyA9IHRhZ05hbWVcbiAgICB0YWdOYW1lID0gMFxuICB9XG5cbiAgLy8gY3Jhd2wgdGhlIERPTSB0byBmaW5kIHRoZSB0YWdcbiAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gVF9TVFJJTkcpIHtcbiAgICBpZiAoc2VsZWN0b3IgPT09ICcqJylcbiAgICAgIC8vIHNlbGVjdCBhbGwgdGhlIHRhZ3MgcmVnaXN0ZXJlZFxuICAgICAgLy8gYW5kIGFsc28gdGhlIHRhZ3MgZm91bmQgd2l0aCB0aGUgcmlvdC10YWcgYXR0cmlidXRlIHNldFxuICAgICAgc2VsZWN0b3IgPSBhbGxUYWdzID0gc2VsZWN0QWxsVGFncygpXG4gICAgZWxzZVxuICAgICAgLy8gb3IganVzdCB0aGUgb25lcyBuYW1lZCBsaWtlIHRoZSBzZWxlY3RvclxuICAgICAgc2VsZWN0b3IgKz0gYWRkUmlvdFRhZ3Moc2VsZWN0b3Iuc3BsaXQoJywnKSlcblxuICAgIGVscyA9ICQkKHNlbGVjdG9yKVxuICB9XG4gIGVsc2VcbiAgICAvLyBwcm9iYWJseSB5b3UgaGF2ZSBwYXNzZWQgYWxyZWFkeSBhIHRhZyBvciBhIE5vZGVMaXN0XG4gICAgZWxzID0gc2VsZWN0b3JcblxuICAvLyBzZWxlY3QgYWxsIHRoZSByZWdpc3RlcmVkIGFuZCBtb3VudCB0aGVtIGluc2lkZSB0aGVpciByb290IGVsZW1lbnRzXG4gIGlmICh0YWdOYW1lID09PSAnKicpIHtcbiAgICAvLyBnZXQgYWxsIGN1c3RvbSB0YWdzXG4gICAgdGFnTmFtZSA9IGFsbFRhZ3MgfHwgc2VsZWN0QWxsVGFncygpXG4gICAgLy8gaWYgdGhlIHJvb3QgZWxzIGl0J3MganVzdCBhIHNpbmdsZSB0YWdcbiAgICBpZiAoZWxzLnRhZ05hbWUpXG4gICAgICBlbHMgPSAkJCh0YWdOYW1lLCBlbHMpXG4gICAgZWxzZSB7XG4gICAgICAvLyBzZWxlY3QgYWxsIHRoZSBjaGlsZHJlbiBmb3IgYWxsIHRoZSBkaWZmZXJlbnQgcm9vdCBlbGVtZW50c1xuICAgICAgdmFyIG5vZGVMaXN0ID0gW11cbiAgICAgIGVhY2goZWxzLCBmdW5jdGlvbiAoX2VsKSB7XG4gICAgICAgIG5vZGVMaXN0LnB1c2goJCQodGFnTmFtZSwgX2VsKSlcbiAgICAgIH0pXG4gICAgICBlbHMgPSBub2RlTGlzdFxuICAgIH1cbiAgICAvLyBnZXQgcmlkIG9mIHRoZSB0YWdOYW1lXG4gICAgdGFnTmFtZSA9IDBcbiAgfVxuXG4gIGlmIChlbHMudGFnTmFtZSlcbiAgICBwdXNoVGFncyhlbHMpXG4gIGVsc2VcbiAgICBlYWNoKGVscywgcHVzaFRhZ3MpXG5cbiAgcmV0dXJuIHRhZ3Ncbn1cblxuLy8gdXBkYXRlIGV2ZXJ5dGhpbmdcbnJpb3QudXBkYXRlID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBlYWNoKHZpcnR1YWxEb20sIGZ1bmN0aW9uKHRhZykge1xuICAgIHRhZy51cGRhdGUoKVxuICB9KVxufVxuXG4vLyBAZGVwcmVjYXRlZFxucmlvdC5tb3VudFRvID0gcmlvdC5tb3VudFxuXG4gIC8vIHNoYXJlIG1ldGhvZHMgZm9yIG90aGVyIHJpb3QgcGFydHMsIGUuZy4gY29tcGlsZXJcbiAgcmlvdC51dGlsID0geyBicmFja2V0czogYnJhY2tldHMsIHRtcGw6IHRtcGwgfVxuXG4gIC8vIHN1cHBvcnQgQ29tbW9uSlMsIEFNRCAmIGJyb3dzZXJcbiAgLyogaXN0YW5idWwgaWdub3JlIG5leHQgKi9cbiAgaWYgKHR5cGVvZiBleHBvcnRzID09PSBUX09CSkVDVClcbiAgICBtb2R1bGUuZXhwb3J0cyA9IHJpb3RcbiAgZWxzZSBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKVxuICAgIGRlZmluZShmdW5jdGlvbigpIHsgcmV0dXJuIHdpbmRvdy5yaW90ID0gcmlvdCB9KVxuICBlbHNlXG4gICAgd2luZG93LnJpb3QgPSByaW90XG5cbn0pKHR5cGVvZiB3aW5kb3cgIT0gJ3VuZGVmaW5lZCcgPyB3aW5kb3cgOiB2b2lkIDApO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgUmlvdCBmcm9tICdyaW90JztcbmltcG9ydCAnLi4vdGFncy9wZW9wbGVsaXN0LnRhZyc7XG5cbnZhciBwYXJhbXMgPSB7XG4gICAgcGVvcGxlOiBbXG4gICAgICAgIHsgbmFtZTogJ1BldGVyJywgYWdlOiAyMCB9LFxuICAgICAgICB7IG5hbWU6ICdKYW1lcycsIGFnZTogMzAgfSxcbiAgICAgICAgeyBuYW1lOiAnSm9obicsIGFnZTogNDAgfSxcbiAgICAgICAgeyBuYW1lOiAnQW5kcmV3JywgYWdlOiA1MCB9LFxuICAgICAgICB7IG5hbWU6ICdKdWRhcycsIGFnZTogNjEgfVxuICAgIF1cbn07XG5cblJpb3QubW91bnQoJ3Blb3BsZWxpc3QnLCBwYXJhbXMpO1xuIiwidmFyIHJpb3QgPSByZXF1aXJlKCdyaW90Jyk7XG5tb2R1bGUuZXhwb3J0cyA9IHJpb3QudGFnKCdwZW9wbGVsaXN0JywgJzxpbnB1dCB0eXBlPVwidGV4dFwiIGlkPVwibmFtZUlucHV0XCIgcGxhY2Vob2xkZXI9XCJOYW1lXCIgb25rZXl1cD1cInsgZWRpdCB9XCI+IDxpbnB1dCB0eXBlPVwidGV4dFwiIGlkPVwiYWdlSW5wdXRcIiBwbGFjZWhvbGRlcj1cIkFnZVwiIG9ua2V5dXA9XCJ7IGVkaXQgfVwiPiA8YnV0dG9uIHR5cGU9XCJidXR0b25cIiBuYW1lPVwiYnV0dG9uXCIgX19kaXNhYmxlZD1cInsgZGlzYWJsZWQgfVwiIG9uY2xpY2s9XCJ7IGFkZCB9XCI+QWRkIFBlcnNvbjwvYnV0dG9uPiA8cGVyc29uIGVhY2g9XCJ7IG9wdHMucGVvcGxlIH1cIiBkYXRhPVwieyB0aGlzIH1cIj48L3BlcnNvbj4nLCBmdW5jdGlvbihvcHRzKSB7dmFyIF90aGlzID0gdGhpcztcblxudGhpcy5kaXNhYmxlZCA9IHRydWU7XG5cbnRoaXMuZWRpdCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgX3RoaXMuZGlzYWJsZWQgPSBuYW1lSW5wdXQudmFsdWUgPT0gJycgfHwgYWdlSW5wdXQudmFsdWUgPT0gJyc7XG59O1xuXG50aGlzLmFkZCA9IGZ1bmN0aW9uIChlKSB7XG4gICAgb3B0cy5wZW9wbGUucHVzaCh7XG4gICAgICAgIG5hbWU6IG5hbWVJbnB1dC52YWx1ZSxcbiAgICAgICAgYWdlOiBhZ2VJbnB1dC52YWx1ZVxuICAgIH0pO1xuXG4gICAgX3RoaXMubmFtZUlucHV0LnZhbHVlID0gJyc7XG4gICAgX3RoaXMuYWdlSW5wdXQudmFsdWUgPSAnJztcbiAgICBfdGhpcy5kaXNhYmxlZCA9IHRydWU7XG59O1xuXG50aGlzLnJlbW92ZSA9IGZ1bmN0aW9uIChlKSB7XG4gICAgdmFyIHBlcnNvbiA9IGUuaXRlbTtcbiAgICB2YXIgaW5kZXggPSBvcHRzLnBlb3BsZS5pbmRleE9mKHBlcnNvbik7XG4gICAgb3B0cy5wZW9wbGUuc3BsaWNlKGluZGV4LCAxKTtcbn07XG5cbnRoaXMub2xkRmFydHMgPSBmdW5jdGlvbiAoYWdlKSB7XG4gICAgcmV0dXJuIGFnZSA+PSA2MDtcbn07XG5cbnRoaXMud2hpcHBlclNuYXBwZXJzID0gZnVuY3Rpb24gKGFnZSkge1xuICAgIHJldHVybiBhZ2UgPD0gMjA7XG59O1xufSk7XG5cbnJpb3QudGFnKCdwZXJzb24nLCAnPGgxPjxhIGhyZWYgb25jbGljaz1cInsgcGFyZW50LnJlbW92ZSB9XCI+WDwvYT4gLSB7IG9wdHMuZGF0YS5uYW1lIH0gLSA8c21hbGwgY2xhc3M9XCJ7IHJlZDogb2xkRmFydHMob3B0cy5kYXRhLmFnZSksIGJsdWU6IHdoaXBwZXJTbmFwcGVycyhvcHRzLmRhdGEuYWdlKSB9XCI+eyBvcHRzLmRhdGEuYWdlIH08L3NtYWxsPjwvaDE+JywgZnVuY3Rpb24ob3B0cykge1xuXG59KTtcbiJdfQ==
