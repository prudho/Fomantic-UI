/*!
 * # Fomantic-UI - Editable
 * http://github.com/fomantic/Fomantic-UI/
 *
 *
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */

;(function ($, window, document, undefined) {

  'use strict';
  
  $.isFunction = $.isFunction || function(obj) {
    return typeof obj === "function" && typeof obj.nodeType !== "number";
  };
  
  window = (typeof window != 'undefined' && window.Math == Math)
    ? window
    : (typeof self != 'undefined' && self.Math == Math)
      ? self
      : Function('return this')()
  ;
  
  $.fn.editable = function(parameters) {
    var
      $allModules     = $(this),
      moduleSelector  = $allModules.selector || '',
  
      time            = new Date().getTime(),
      performance     = [],
  
      query           = arguments[0],
      methodInvoked   = (typeof query == 'string'),
      queryArguments  = [].slice.call(arguments, 1),
      returnedValue
    ;
    $allModules
      .each(function() {
        var
          settings        = ( $.isPlainObject(parameters) )
            ? $.extend(true, {}, $.fn.editable.settings, parameters)
            : $.extend({}, $.fn.editable.settings),
  
          namespace       = settings.namespace,
          className       = settings.className,
          metadata        = settings.metadata,
          selector        = settings.selector,
          error           = settings.error,
  
          eventNamespace  = '.' + namespace,
          moduleNamespace = 'module-' + namespace,
  
          element         = this,
          instance        = $(this).data(moduleNamespace),
  
          $module         = $(this),
          $form,
          $container,
          $actions,

          selection,

          popup,
  
          module
        ;
  
        module = {
  
          initialize: function() {
            module.verbose('Initializing editable module', settings);

            if (settings.mode == 'popup' && $.fn.popup === undefined) {
              module.error(error.popup);
              return;
            }

            if (settings.type == 'calendar' && $.fn.calendar === undefined) {
              module.error(error.calendar);
              return;
            } else if (settings.type == 'dropdown' && $.fn.dropdown === undefined) {
              module.error(error.dropdown);
              return;
            }

            if (module.get.text() == '' && module.get.value() == '') {
              if ((settings.type == 'checklist' || settings.type == 'radio') && settings.source) {
                var items = settings.source.filter(function(item) {
                  if (item.checked) {
                    return item;
                  } else {
                    return false;
                  }
                });
  
                if (items.length == 0) {
                  module.set.empty();
                } else {
                  $module.html(items.map(function(item) { return item.text || item.value }).join(',<br>'));
                }
              } else if (settings.type == 'dropdown' && settings.source) {
                var items = settings.source.filter(function(item) {
                  if (item.selected) {
                    return item;
                  } else {
                    return false;
                  }
                });
  
                if (items.length == 0) {
                  module.set.empty();
                } else {
                  $module.html(items.map(function(item) { return item.name || item.text }).join(',<br>'));
                }
              } else {
                module.set.empty();
              }
            }
            
            module.bind.events();

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
  
          setup: {
            layout: function() {
              var
                text = module.get.text(),
                placeholder = module.get.placeholder(),
                $field = $(settings.templates.field(settings, module.is.required())),
                $input = $(settings.templates.text(text, placeholder))
              ;

              switch (settings.type) {
                case 'text':
                  $input = $(settings.templates.text(text, placeholder));
                  break;

                case 'textarea':
                  $input = $(settings.templates.textarea(text, placeholder));
                  break;

                case 'dropdown':
                  var source = selection
                    ? settings.source.map(function (item) {
                        return { ...item, selected: selection.includes(item.value) }
                      })
                    : module.is.empty()
                      ? settings.source.map(function (item) {
                        return { ...item, selected: false }
                      })
                      : settings.source
                  ;

                  $input = $(settings.templates.dropdown(source, placeholder, settings.variation));
                  break;

                case 'calendar':
                  $input = $(settings.templates.calendar(text, placeholder));
                  break;

                case 'checklist':
                  var source = selection
                    ? settings.source.map(function (item) {
                      return { ...item, checked: selection.includes(item.value) }
                    })
                    : settings.source
                  ;

                  $input = $(settings.templates.checklist(source));
                  break;

                case 'radio':
                  var source = selection
                    ? settings.source.map(function (item) {
                      return { ...item, checked: selection.includes(item.value) }
                    })
                    : settings.source
                  ;

                  $input = $(settings.templates.radio(source));
                  break;

                default:
                  module.error(error.type);
                  return;
              }

              $container = settings.mode == 'inline'
                  ? $(settings.templates.container_inline())
                  : settings.mode == 'popup'
                    ? $(settings.templates.container_popup())
                    : null // FIXME

              $form = $(settings.templates.form());
              $actions = $(settings.templates.actions());

              $field.append($input);

              $form.append($field).append($actions);

              $container.append($form);
            },
            form: function() {
              if (settings.mode == 'popup') {
                $form = $(popup).first(selector.form);
              }

              $form = $form.form({
                // debug: true,
                // verbose: true,
                keyboardShortcuts: false,
                autoCheckRequired: true,
                onApprove: function () {
                  console.log('approve');
                },
                onFailure: function (formErrors, fields) {
                  console.log(formErrors, fields);
                }
              });
            }
          },
  
          bind: {
            events: function() {
              module.verbose('Binding events');
              $module
                .on('click' + eventNamespace, module.event.click)
              ;
            },
            actionEvents: function() {
              $form
                .on('keydown' + eventNamespace, module.event.keydown)
              ;

              if (settings.mode == 'inline') {
                $container
                  .on('click' + eventNamespace, selector.approve, module.event.approve)
                  .on('click' + eventNamespace, selector.deny, module.event.deny)
                ;
              } else if (settings.mode == 'popup') {
                popup
                  .on('click' + eventNamespace, selector.approve, module.event.approve)
                  .on('click' + eventNamespace, selector.deny, module.event.deny)
                ;
              }
            },
          },

          event: {
            click: function() {
              if (!module.is.disabled() && !module.is.active()) {
                module.show();
              }
            },
            keydown: function(event) {
              var keyCode = event.which;
              
              if (keyCode === 27 || keyCode === 9) {
                //esc || tab
                module.hide();
              } else if (keyCode === 13 && (settings.type != 'textarea' || event.ctrlKey )) {
                //enter
                module.event.approve();
              }
              
            },
            approve: function() {
              var result = $form.form('validate form');

              if (result === true) {
                var
                  fields = $form.form('get values'),
                  value = fields[`editable_${settings.type}`],
                  text
                ;

                switch (settings.type) {
                  case 'text':
                    text = value;
                    break;

                  case 'textarea':
                    text = value;
                    break;
  
                  case 'dropdown':
                    if (value == '') {
                      text = ''
                    } else {
                      var
                        values = value.split(','),
                        items = values.map(function (item) {
                          var found = settings.source.find(function (entry) { return entry.value == item });
                          
                          return found.name || found.text;
                        })
                      ;

                      text = items.join(',\n');
                    }
                    
                    // Does not work on multiple dropdown
                    // text = $(`input[name=editable_${settings.type}]`).parent().dropdown('get text');
                    break;

                  case 'calendar':
                    text = $(`input[name=editable_${settings.type}]`).parents('.ui.calendar').calendar('get inputDate');
                    break;

                  case 'checklist':
                  case 'radio':
                    value = value.filter(function (item) { return item; });
                    
                    if (value == '') {
                      text = ''
                    } else {
                      var
                        items = value.map(function (item) {
                          var found = settings.source.find(function (entry) { return entry.value == item });
                          
                          return found.name || found.text;
                        })
                      ;

                      text = items.join(',\n');
                    }
                    
                    // text = value.join(',\n');
                    break;
  
                  default:
                    module.error(error.type);
                    return;
                }

                module.set.value(value, text);

                module.hide();
              }
            },
            deny: function() {
              module.hide();
            },
          },
  
          remove: {
            events: function() {
              module.verbose('Removing events');
              $module
                .off(eventNamespace)
              ;
            }
          },
  
          enable: function() {
            module.debug('Setting editable to interactive mode');
            module.bind.events();
            $module
              .removeClass(className.disabled)
            ;
          },
  
          disable: function() {
            module.debug('Setting editable to read-only mode');
            module.remove.events();
            $module
              .addClass(className.disabled)
            ;
          },

          show: function() {
            module.debug('Showing editable');

            module.setup.layout();

            if (settings.exclusive) {
              module.hideOthers();
            }

            if (settings.mode == 'inline') {
              $module.hide();
              $module.parent().append($container);

              module.setup.form();

              settings.onVisible.call(element);
            } else if (settings.mode == 'popup') {
              popup = $module.popup({
                on: 'manual',
                html : $container,
                onHidden: function () {
                  $module.removeClass(className.active);
                },
                onVisible: function() {
                  module.setup.form();

                  settings.onVisible.call(element);
                },
              }).popup('show').popup('get popup');
            }

            module.bind.actionEvents();

            $module.addClass(className.active);
          },

          hide: function() {
            if (settings.mode == 'popup') {
              $module.popup('hide');
            }

            $container.remove();
            $module.removeClass(className.active).show();

            settings.onHidden.call(element);
          },

          hideOthers: function() {
            var $others = $(selector.container)
              .not($container)
              .siblings(selector.editable)
            ;

            module.verbose('Finding other editables to hide', $others);
            
            $others.editable('hide');
          },
  
          is: {
            disabled: function() {
              return $module.hasClass(className.disabled);
            },
            active: function() {
              return $module.hasClass(className.active);
            },
            empty: function() {
              return $module.attr(metadata.empty) || false;
            },
            required: function() {
              return $module.data(metadata.required) || settings.required == true;
            },
          },
  
          get: {
            value: function() {
              var value;

              if (module.is.empty()) {
                value = ''
              } else {
                switch (settings.type) {
                  case 'text':
                  case 'textarea':
                    value = module.get.text();
                    break;
  
                  case 'dropdown':
                    // value = $module.attr(metadata.value) || settings.source.filter(function (item) { return item.selected }).map(function (item) { return item.value }).join(',\n') || '';
                    value = $module.attr(metadata.value) || '';
                    break;

                  case 'calendar':
                    value = $module.attr(metadata.value) || module.get.text();
                    break;

                  case 'checklist':
                  case 'radio':
                    // value = $module.data(metadata.value) || settings.source.filter(function (item) { return item.checked }).map(function (item) { return item.value }).join(',\n') || '';
                    value = $module.data(metadata.value) || '';
                    break;
  
                  default:
                    module.error(error.type);
                    return;
                }
              }

              return value;
            },
            text: function() {
              var text;

              if (module.is.empty()) {
                text = '';
              } else {
                if (settings.type == 'textarea') {
                  text = $module.html().replace(/<br>/gi, '\n');
                } else {
                  text = $module.text();
                }
              }

              return text;
            },
            placeholder: function() {
              return $module.data(metadata.placeholder || settings.placeholder || '');
            }
          },
  
          set: {
            value: function(value, text) {
              function onBeforeChangeCallback(result) {
                console.log('onBeforeChangeCallback', result);
                if (result === false) {
                  return false;
                }

                if (value == '') {
                  module.set.empty();
                } else {
                  $module.removeAttr(metadata.empty);
                  $module.attr(metadata.value, value);
                  if (settings.type == 'textarea' || settings.type == 'checklist') {
                    $module.html(text.replace(/\n/gi, '<br>'));
                  } else {
                    $module.text(text);
                  }
                }
  
                selection = value;
  
                settings.onChange.call(element, value, text);
              }

              if (settings.onBeforeChange.constructor.name == 'AsyncFunction') {
                settings.onBeforeChange.call(element, value, text).then(function (resolve) { onBeforeChangeCallback(resolve); })
              } else {
                onBeforeChangeCallback(settings.onBeforeChange.call(element, value, text))
              }

              // if (settings.onBeforeChange.call(element, value, text) === false) {
              //   return false;
              // }

              // if (value == '') {
              //   module.set.empty();
              // } else {
              //   $module.removeAttr(metadata.empty);
              //   $module.attr(metadata.value, value);
              //   if (settings.type == 'textarea' || settings.type == 'checklist') {
              //     $module.html(text.replace(/\n/gi, '<br>'));
              //   } else {
              //     $module.text(text);
              //   }
              // }

              // selection = value;

              // settings.onChange.call(element, value, text);
            },
            empty: function () {
              $module.attr(metadata.empty, true);

              switch (settings.type) {
                case 'text':
                case 'textarea':
                case 'calendar':
                  $module.text(settings.text.empty);
                  break;

                case 'dropdown':
                case 'checklist':
                case 'radio':
                  $module.text(settings.text.noselection);
                  break;

                default:
                  module.error(error.type);
                  return;
              }
            },
          },
  
          setting: function(name, value) {
            module.debug('Changing setting', name, value);
            if( $.isPlainObject(name) ) {
              $.extend(true, settings, name);
            }
            else if(value !== undefined) {
              if($.isPlainObject(settings[name])) {
                $.extend(true, settings[name], value);
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
            if( $.isPlainObject(name) ) {
              $.extend(true, module, name);
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
              $.each(performance, function(index, data) {
                totalTime += data['Execution Time'];
              });
              title += ' ' + totalTime + 'ms';
              if(moduleSelector) {
                title += ' \'' + moduleSelector + '\'';
              }
              if($allModules.length > 1) {
                title += ' ' + '(' + $allModules.length + ')';
              }
              if( (console.group !== undefined || console.table !== undefined) && performance.length > 0) {
                console.groupCollapsed(title);
                if(console.table) {
                  console.table(performance);
                }
                else {
                  $.each(performance, function(index, data) {
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
              $.each(query, function(depth, value) {
                var camelCaseValue = (depth != maxDepth)
                  ? value + query[depth + 1].charAt(0).toUpperCase() + query[depth + 1].slice(1)
                  : query
                ;
                if( $.isPlainObject( object[camelCaseValue] ) && (depth != maxDepth) ) {
                  object = object[camelCaseValue];
                }
                else if( object[camelCaseValue] !== undefined ) {
                  found = object[camelCaseValue];
                  return false;
                }
                else if( $.isPlainObject( object[value] ) && (depth != maxDepth) ) {
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
            if ( $.isFunction( found ) ) {
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
  
  $.fn.editable.settings = {
  
    name          : 'Editable',
    namespace     : 'editable',
  
    silent        : false,
    debug         : false,
    verbose       : false,
    performance   : true,
  
    type          : 'text',  // 'text' | 'textarea'
    mode          : 'popup', // 'popup' | 'inline',
    exclusive     : false,
    source        : null,
    required      : false,

    variation     : '',
  
    /* Callbacks */
    
    // callback before a value change, return false to cancel the change
    onBeforeChange: function (value, text) {
      return true;
    },
    
    onChange      : function(value, text){},

    onVisible     : function() {},

    onHidden      : function() {},
  
    error         : {
      method    : 'The method you called is not defined',
      type      : 'Unknown editable type',
      popup     : 'UI Popup, a required component is not included in this page',
      calendar  : 'UI Calendar, a required component is not included in this page',
      dropdown  : 'UI Dropdown, a required component is not included in this page'
    },
  
  
    metadata: {
      type        : 'type',
      value       : 'value',
      placeholder : 'placeholder',
      title       : 'title',
      empty       : 'empty',
      required    : 'required',
    },
  
    className : {
      active   : 'active',
      visible  : 'visible',
      disabled : 'disabled',
    },
  
    selector  : {
      editable  : '.ui.editable',
      container : '.editable.container',
      form      : '.ui.form',
      approve   : '.actions .positive, .actions .approve, .actions .ok',
      deny      : '.actions .negative, .actions .deny, .actions .cancel'
    },

    text      : {
      empty       : 'Empty',
      noselection : 'None selected'
    },
  
    templates: {
      container_inline: function() {
        var html = `<span class="editable inline container"></span>`;
        
        return html;
      },
      container_popup: function() {
        var html = `<span class="editable popup container"></span>`;
        
        return html;
      },
      form: function() {
        var html = `<div class="ui mini form"></div>`;
        
        return html;
      },
      field: function(settings, required = false) {
        var html;

        switch (settings.type) {
          case 'text':
          case 'textarea':
          case 'dropdown':
          case 'calendar':
            html = `<div class="inline field${required ? " required" : ""}" style="display: inline-block;"></div>`;
            break;

          case 'checklist':
          case 'radio':
            html = `<div class="grouped fields${required ? " required" : ""}" style="display: inline-block;"></div>`;
            break;

        }
        
        return html;
      },
      text: function(value, placeholder = '') {
        var html = `<input type="text" name="editable_text" value="${value}" placeholder="${placeholder}">`;
        
        return html;
      },
      textarea: function(value, placeholder = '') {
        var html = `<textarea name="editable_textarea" placeholder="${placeholder}">${value}</textarea>`;
        
        return html;
      },
      dropdown: function(items, placeholder = '', variation = '') {
        var 
          value= Array.isArray(items)
            ? items.filter(function (item) { return item.selected }).map(function (item) { return item.value }).join(',')
            : '',
          html = `
          <div class="ui selection dropdown${variation ? ' ' + variation : ''}">
            <input type="hidden" name="editable_dropdown"${value ? ' value="' + value + '"' : ''}>
            <i class="dropdown icon"></i>
            <div class="default text">${placeholder}</div>
            <div class="menu">`;

        if (Array.isArray(items)) {
          items.forEach(function (item) {
            html += `<div class="item${item.selected !== undefined && item.selected ? ' selected' : ''}" data-value="${item.value}">${item.name || item.text}</div>`;
          });
        } else {
          // TODO
        }
        html += `
            </div>
          </div>`;
        
        return html;
      },
      calendar: function(date, placeholder = '') {
        var html = `<div class="ui calendar" data-type="date" data-date="${date}">
                      <div class="ui fluid input left icon">
                        <i class="calendar icon"></i>
                        <input type="text" name="editable_calendar" placeholder="${placeholder}">
                      </div>
                    </div>`;
        
        return html;
      },
      checklist: function(items) {
        var html = '';

        if (Array.isArray(items)) {
          items.forEach(function (item) {
            html += `<div class="field">
                      <div class="ui checkbox">
                        <input type="checkbox" name="editable_checklist[]" value="${item.value}"${item.checked !== undefined && item.checked ? ' checked=""' : ''}>
                        <label>${item.text}</label>
                      </div>
                    </div>`;
          });
        } else {
          // TODO
        }

        return html;
      },
      radio: function(items) {
        var html = '';

        if (Array.isArray(items)) {
          items.forEach(function (item) {
            html += `<div class="field">
                      <div class="ui radio checkbox">
                        <input type="radio" name="editable_radio[]" value="${item.value}"${item.checked !== undefined && item.checked ? ' checked=""' : ''}>
                        <label>${item.text}</label>
                      </div>
                    </div>`;
          });
        } else {
          // TODO
        }

        return html;
      },
      actions: function() {
        var html = `<span class="editable actions" style="display: inline-block;">
                      <i class="link green approve check icon" />&nbsp;<i class="link red deny times icon" />
                    </span>`;
        
        return html;
      }
    }
  
  };
  
  })( jQuery, window, document );
  