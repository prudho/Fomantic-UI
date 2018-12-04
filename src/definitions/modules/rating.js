/*!
 * # Semantic UI - Rating
 * http://github.com/semantic-org/semantic-ui/
 *
 *
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */

;(function ($, window, document, undefined) {

'use strict';

window = (typeof window != 'undefined' && window.Math == Math)
  ? window
  : (typeof self != 'undefined' && self.Math == Math)
    ? self
    : Function('return this')()
;

var isFunction = function(obj) {
  return typeof obj === "function" && typeof obj.nodeType !== "number";
};
var isPlainObject = function(obj) {
  return Object.prototype.toString.call(obj) === '[object Object]';
};
var extend = function(out) {
  out = out || {};

  for (var i = 1; i < arguments.length; i++) {
    if (!arguments[i])
      continue;

    for (var key in arguments[i]) {
      if (arguments[i].hasOwnProperty(key))
        out[key] = arguments[i][key];
    }
  }

  return out;
};
var deepExtend = function(out) {
  out = out || {};

  for (var i = 1; i < arguments.length; i++) {
    var obj = arguments[i];

    if (!obj)
      continue;

    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        if (typeof obj[key] === 'object')
          out[key] = deepExtend(out[key], obj[key]);
        else
          out[key] = obj[key];
      }
    }
  }

  return out;
};

$.fn.rating = function(parameters) {
  var
    allModules      = this,
    moduleSelector  = allModules.selector || '',

    time            = new Date().getTime(),
    performance     = [],

    query           = arguments[0],
    methodInvoked   = (typeof query == 'string'),
    queryArguments  = [].slice.call(arguments, 1),
    returnedValue
  ;
  Array.from(allModules)
    .forEach(function(element) {
      var
        settings        = ( isPlainObject(parameters) )
          ? deepExtend({}, $.fn.rating.settings, parameters)
          : extend({}, $.fn.rating.settings),

        namespace       = settings.namespace,
        className       = settings.className,
        metadata        = settings.metadata,
        selector        = settings.selector,
        error           = settings.error,

        moduleNamespace = 'module-' + namespace,

        instance        = $(this).data(moduleNamespace),

        $module         = $(this),
        icons = element.querySelectorAll(selector.icon),

        initialLoad,
        module
      ;

      module = {

        initialize: function() {
          module.verbose('Initializing rating module', settings);

          if(icons.length === 0) {
            module.setup.layout();
          }

          if(settings.interactive && !module.is.disabled()) {
            module.enable();
          }
          else {
            module.disable();
          }
          module.set.initialLoad();
          module.set.rating( module.get.initialRating() );
          module.remove.initialLoad();
          module.instantiate();
        },

        instantiate: function() {
          module.verbose('Instantiating module', settings);
          instance = module;
          $module
            .data(moduleNamespace, module)
          ;
        },

        destroy: function() {
          module.verbose('Destroying previous instance', instance);
          module.remove.events();
          $module
            .removeData(moduleNamespace)
          ;
        },

        refresh: function() {
          icons = element.querySelectorAll(selector.icon);
        },

        setup: {
          layout: function() {
            var
              maxRating = module.get.maxRating(),
              html      = $.fn.rating.settings.templates.icon(maxRating)
            ;
            module.debug('Generating icon html dynamically');
            element.innerHTML = html
            module.refresh();
          }
        },

        event: {
          mouseenter: function() {
            var 
              nextIcon = this
            ;
            while(nextIcon = nextIcon.nextSibling) {
              nextIcon.classList.remove(className.selected)
            }
            element.classList.add(className.selected)
            this.classList.add(className.selected)
              var prevIcon = this
              while(prevIcon = prevIcon.previousSibling) {
                prevIcon.classList.add(className.selected)
              }
          },
          mouseleave: function() {
            element.classList.remove(className.selected)
            icons.forEach(
              function(currentValue) { 
                currentValue.classList.remove(className.selected); 
              }
            )
          },
          click: function() {
            var
              currentRating = module.get.rating(),
              rating        = Array.prototype.indexOf.call(icons, this) + 1,
              canClear      = (settings.clearable == 'auto')
               ? (icons.length === 1)
               : settings.clearable
            ;
            if(canClear && currentRating == rating) {
              module.clearRating();
            }
            else {
              module.set.rating( rating );
            }
          }
        },

        clearRating: function() {
          module.debug('Clearing current rating');
          module.set.rating(0);
        },

        bind: {
          events: function() {
            module.verbose('Binding events');
            element.querySelectorAll(selector.icon).forEach(function (el) {
              el.addEventListener('mouseenter', module.event.mouseenter);
              el.addEventListener('mouseleave', module.event.mouseleave);
              el.addEventListener('click', module.event.click);
            })
          }
        },

        remove: {
          events: function() {
            module.verbose('Removing events');
            element.querySelectorAll(selector.icon).forEach(function (el) {
              el.removeEventListener('mouseenter', module.event.mouseenter);
              el.removeEventListener('mouseleave', module.event.mouseleave);
              el.removeEventListener('click', module.event.click);
            })
          },
          initialLoad: function() {
            initialLoad = false;
          }
        },

        enable: function() {
          module.debug('Setting rating to interactive mode');
          module.bind.events();
          element.classList.remove(className.disabled);
        },

        disable: function() {
          module.debug('Setting rating to read-only mode');
          module.remove.events();
          element.classList.add(className.disabled)
        },

        is: {
          initialLoad: function() {
            return initialLoad;
          },
          disabled: function() {
            return element.classList.contains(className.disabled);
          }
        },

        get: {
          initialRating: function() {
            if(element.dataset[metadata.rating] !== undefined) {
              // delete element.dataset[metadata.rating]
              // Gné ?
              //$module.removeData(metadata.rating);
              return element.dataset[metadata.rating];
            }
            return settings.initialRating;
          },
          maxRating: function() {
            if(element.dataset[metadata.maxRating] !== undefined) {
              // delete element.dataset[metadata.maxRating]
              // Gné ?
              //$module.removeData(metadata.maxRating);
              return element.dataset[metadata.maxRating];
            }
            return settings.maxRating;
          },
          rating: function() {
            var
              currentRating = Array.from(icons).filter(function (icon) {
                return icon.classList.contains(className.active)
              }).length
            ;
            module.verbose('Current rating retrieved', currentRating);
            return currentRating;
          }
        },

        set: {
          rating: function(rating) {
            var
              ratingIndex = (rating - 1 >= 0)
                ? (rating - 1)
                : 0,
              activeIcon = icons[ratingIndex]
            ;
            element.classList.remove(className.selected);
            icons.forEach(
              function(currentValue) { 
                currentValue.classList.remove(className.selected, className.active); 
              }
            )
            if(rating > 0) {
              module.verbose('Setting current rating to', rating);
              activeIcon.classList.add(className.active)
              var prevIcon = activeIcon
              while(prevIcon = prevIcon.previousSibling) {
                prevIcon.classList.add(className.active)
              }
            }
            if(!module.is.initialLoad()) {
              settings.onRate.call(element, rating);
            }
          },
          initialLoad: function() {
            initialLoad = true;
          }
        },

        /*isFunction: function(obj) {
          return typeof obj === "function" && typeof obj.nodeType !== "number";
        },
        isPlainObject: function(obj) {
          return Object.prototype.toString.call(obj) === '[object Object]';
        },*/

        setting: function(name, value) {
          module.debug('Changing setting', name, value);
          if( isPlainObject(name) ) {
            deepExtend(settings, name);
          }
          else if(value !== undefined) {
            if(isPlainObject(settings[name])) {
              deepExtend(settings[name], value);
            }
            else {
              settings[name] = value;
            }
          }
          else {
            return settings[name];
          }
        },
        internal: function(name, value) {
          if( isPlainObject(name) ) {
            deepExtend(module, name);
          }
          else if(value !== undefined) {
            module[name] = value;
          }
          else {
            return module[name];
          }
        },
        debug: function() {
          if(!settings.silent && settings.debug) {
            if(settings.performance) {
              module.performance.log(arguments);
            }
            else {
              module.debug = Function.prototype.bind.call(console.info, console, settings.name + ':');
              module.debug.apply(console, arguments);
            }
          }
        },
        verbose: function() {
          if(!settings.silent && settings.verbose && settings.debug) {
            if(settings.performance) {
              module.performance.log(arguments);
            }
            else {
              module.verbose = Function.prototype.bind.call(console.info, console, settings.name + ':');
              module.verbose.apply(console, arguments);
            }
          }
        },
        error: function() {
          if(!settings.silent) {
            module.error = Function.prototype.bind.call(console.error, console, settings.name + ':');
            module.error.apply(console, arguments);
          }
        },
        performance: {
          log: function(message) {
            var
              currentTime,
              executionTime,
              previousTime
            ;
            if(settings.performance) {
              currentTime   = new Date().getTime();
              previousTime  = time || currentTime;
              executionTime = currentTime - previousTime;
              time          = currentTime;
              performance.push({
                'Name'           : message[0],
                'Arguments'      : [].slice.call(message, 1) || '',
                'Element'        : element,
                'Execution Time' : executionTime
              });
            }
            clearTimeout(module.performance.timer);
            module.performance.timer = setTimeout(module.performance.display, 500);
          },
          display: function() {
            var
              title = settings.name + ':',
              totalTime = 0
            ;
            time = false;
            clearTimeout(module.performance.timer);
            performance.forEach(function(data) {
              totalTime += data['Execution Time'];
            });
            title += ' ' + totalTime + 'ms';
            if(moduleSelector) {
              title += ' \'' + moduleSelector + '\'';
            }
            if(allModules.length > 1) {
              title += ' ' + '(' + allModules.length + ')';
            }
            if( (console.group !== undefined || console.table !== undefined) && performance.length > 0) {
              console.groupCollapsed(title);
              if(console.table) {
                console.table(performance);
              }
              else {
                performance.forEach(function(data) {
                  console.log(data['Name'] + ': ' + data['Execution Time']+'ms');
                });
              }
              console.groupEnd();
            }
            performance = [];
          }
        },
        invoke: function(query, passedArguments, context) {
          var
            object = instance,
            maxDepth,
            found,
            response
          ;
          passedArguments = passedArguments || queryArguments;
          context         = element         || context;
          if(typeof query == 'string' && object !== undefined) {
            query    = query.split(/[\. ]/);
            maxDepth = query.length - 1;
            query.forEach(function(value, depth) {
              var camelCaseValue = (depth != maxDepth)
                ? value + query[depth + 1].charAt(0).toUpperCase() + query[depth + 1].slice(1)
                : query
              ;
              if( isPlainObject( object[camelCaseValue] ) && (depth != maxDepth) ) {
                object = object[camelCaseValue];
              }
              else if( object[camelCaseValue] !== undefined ) {
                found = object[camelCaseValue];
                return false;
              }
              else if( isPlainObject( object[value] ) && (depth != maxDepth) ) {
                object = object[value];
              }
              else if( object[value] !== undefined ) {
                found = object[value];
                return false;
              }
              else {
                return false;
              }
            });
          }
          if ( isFunction( found ) ) {
            response = found.apply(context, passedArguments);
          }
          else if(found !== undefined) {
            response = found;
          }
          if(Array.isArray(returnedValue)) {
            returnedValue.push(response);
          }
          else if(returnedValue !== undefined) {
            returnedValue = [returnedValue, response];
          }
          else if(response !== undefined) {
            returnedValue = response;
          }
          return found;
        }
      };
      if(methodInvoked) {
        if(instance === undefined) {
          module.initialize();
        }
        module.invoke(query);
      }
      else {
        if(instance !== undefined) {
          instance.invoke('destroy');
        }
        module.initialize();
      }
    })
  ;

  return (returnedValue !== undefined)
    ? returnedValue
    : this
  ;
};

$.fn.rating.settings = {

  name          : 'Rating',
  namespace     : 'rating',

  slent         : false,
  debug         : false,
  verbose       : false,
  performance   : true,

  initialRating : 0,
  interactive   : true,
  maxRating     : 4,
  clearable     : 'auto',

  fireOnInit    : false,

  onRate        : function(rating){},

  error         : {
    method    : 'The method you called is not defined',
    noMaximum : 'No maximum rating specified. Cannot generate HTML automatically'
  },


  metadata: {
    rating    : 'rating',
    maxRating : 'maxRating'
  },

  className : {
    active   : 'active',
    disabled : 'disabled',
    selected : 'selected',
    loading  : 'loading'
  },

  selector  : {
    icon : '.icon'
  },

  templates: {
    icon: function(maxRating) {
      var
        icon = 1,
        html = ''
      ;
      while(icon <= maxRating) {
        html += '<i class="icon"></i>';
        icon++;
      }
      return html;
    }
  }

};

})( jQuery, window, document );
