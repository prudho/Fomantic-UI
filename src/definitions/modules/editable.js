/*!
 * # Fomantic-UI - Editable
 * http://github.com/fomantic/Fomantic-UI/
 *
 *
 * Released under the MIT license
 * http://opensource.org/licenses/MIT
 *
 */

(function ($, window, document) {
    'use strict';

    function isFunction(obj) {
        return typeof obj === 'function' && typeof obj.nodeType !== 'number';
    }

    window = window !== undefined && window.Math === Math
        ? window
        : globalThis;

    $.fn.editable = function (...args) {
        const $allModules = $(this);

        let time = Date.now();
        let performance = [];

        const parameters = args[0];
        const methodInvoked = typeof parameters === 'string';
        const queryArguments = args.slice(1);
        let returnedValue;
        $allModules.each(function () {
            const
                settings = $.isPlainObject(parameters)
                    ? $.extend(true, {}, $.fn.editable.settings, parameters)
                    : $.extend({}, $.fn.editable.settings);

            const namespace = settings.namespace;
            const className = settings.className;
            const metadata = settings.metadata;
            const selector = settings.selector;
            const error = settings.error;

            const eventNamespace = '.' + namespace;
            const moduleNamespace = 'module-' + namespace;

            const element = this;
            let instance = $(this).data(moduleNamespace);

            const $module = $(this);
            let $form;
            let $container;
            let $actions;

            let selection;

            let popup;

            const module = {

                initialize: function () {
                    module.verbose('Initializing editable module', settings);

                    if (settings.mode === 'popup' && $.fn.popup === undefined) {
                        module.error(error.popup);

                        return;
                    }

                    if (settings.type === 'calendar' && $.fn.calendar === undefined) {
                        module.error(error.calendar);

                        return;
                    }

                    if (settings.type === 'dropdown' && $.fn.dropdown === undefined) {
                        module.error(error.dropdown);

                        return;
                    }

                    if (module.get.text() === '' && module.get.value() === '') {
                        if ((settings.type === 'checklist' || settings.type === 'radio') && settings.source) {
                            const items = settings.source.filter(function (item) {
                                return item.checked
                                    ? item
                                    : false;
                            });

                            if (items.length === 0) {
                                module.set.empty();
                            } else {
                                $module.html(items.map(function (item) {
                                    return item.text || item.value;
                                }).join(',<br>'));
                            }
                        } else if (settings.type === 'dropdown' && settings.source) {
                            const items = settings.source.filter(function (item) {
                                return item.selected
                                    ? item
                                    : false;
                            });

                            if (items.length === 0) {
                                module.set.empty();
                            } else {
                                $module.html(items.map(function (item) {
                                    return item.name || item.text;
                                }).join(',<br>'));
                            }
                        } else {
                            module.set.empty();
                        }
                    }

                    module.bind.events();

                    module.instantiate();
                },

                instantiate: function () {
                    module.verbose('Instantiating module', settings);
                    instance = module;
                    $module
                        .data(moduleNamespace, module);
                },

                destroy: function () {
                    module.verbose('Destroying previous instance', instance);
                    module.remove.events();
                    $module
                        .removeData(moduleNamespace);
                },

                setup: {
                    layout: function () {
                        const text = module.get.text();
                        const placeholder = module.get.placeholder();
                        const $field = $(settings.templates.field(settings, module.is.required()));
                        let $input = $(settings.templates.text(text, placeholder));

                        switch (settings.type) {
                            case 'text': {
                                $input = $(settings.templates.text(text, placeholder));

                                break;
                            }

                            case 'textarea': {
                                $input = $(settings.templates.textarea(text, placeholder));

                                break;
                            }

                            case 'dropdown': {
                                const source = selection
                                    ? settings.source.map(function (item) {
                                        return { ...item, selected: selection.includes(item.value) };
                                    })
                                    : (module.is.empty()
                                        ? settings.source.map(function (item) {
                                            return { ...item, selected: false };
                                        })
                                        : settings.source);

                                $input = $(settings.templates.dropdown(source, placeholder, settings.variation));

                                break;
                            }

                            case 'calendar': {
                                $input = $(settings.templates.calendar(text, placeholder));

                                break;
                            }

                            case 'checklist': {
                                const source = selection
                                    ? settings.source.map(function (item) {
                                        return { ...item, checked: selection.includes(item.value) };
                                    })
                                    : settings.source;

                                $input = $(settings.templates.checklist(source));

                                break;
                            }

                            case 'radio': {
                                const source = selection
                                    ? settings.source.map(function (item) {
                                        return { ...item, checked: selection.includes(item.value) };
                                    })
                                    : settings.source;

                                $input = $(settings.templates.radio(source));

                                break;
                            }

                            default: {
                                module.error(error.type);

                                return;
                            }
                        }

                        $container = settings.mode === 'inline'
                            ? $(settings.templates.container_inline())
                            : (settings.mode === 'popup'
                                ? $(settings.templates.container_popup())
                                : null); // FIXME

                        $form = $(settings.templates.form());
                        $actions = $(settings.templates.actions());

                        $field.append($input);

                        $form.append($field).append($actions);

                        $container.append($form);
                    },
                    form: function () {
                        if (settings.mode === 'popup') {
                            $form = $(popup).first(selector.form);
                        }

                        $form = $form.form({
                            // debug: true,
                            // verbose: true,
                            keyboardShortcuts: false,
                            autoCheckRequired: true,
                        });
                    },
                },

                bind: {
                    events: function () {
                        module.verbose('Binding events');
                        $module
                            .on('click' + eventNamespace, module.event.click);
                    },
                    actionEvents: function () {
                        $form
                            .on('keydown' + eventNamespace, module.event.keydown);

                        if (settings.mode === 'inline') {
                            $container
                                .on('click' + eventNamespace, selector.approve, module.event.approve)
                                .on('click' + eventNamespace, selector.deny, module.event.deny);
                        } else if (settings.mode === 'popup') {
                            popup
                                .on('click' + eventNamespace, selector.approve, module.event.approve)
                                .on('click' + eventNamespace, selector.deny, module.event.deny);
                        }
                    },
                },

                event: {
                    click: function () {
                        if (!module.is.disabled() && !module.is.active()) {
                            module.show();
                        }
                    },
                    keydown: function (event) {
                        const keyCode = event.which;

                        // esc || tab
                        if (keyCode === 27 || keyCode === 9) {
                            module.hide();
                        } else if (keyCode === 13 && (settings.type !== 'textarea' || event.ctrlKey)) {
                            // enter
                            module.event.approve();
                        }
                    },
                    approve: function () {
                        const result = $form.form('validate form');

                        if (result === true) {
                            const fields = $form.form('get values');
                            let value = fields[`editable_${settings.type}`];
                            let text;

                            switch (settings.type) {
                                case 'text': {
                                    text = value;

                                    break;
                                }

                                case 'textarea': {
                                    text = value;

                                    break;
                                }

                                case 'dropdown': {
                                    if (value === '') {
                                        text = '';
                                    } else {
                                        const values = value.split(',');
                                        const items = values.map(function (item) {
                                            const found = settings.source.find(function (entry) {
                                                return entry.value == item;
                                            });

                                            return found.name || found.text;
                                        });

                                        text = items.join(',\n');
                                    }

                                    // Does not work on multiple dropdown
                                    // text = $(`input[name=editable_${settings.type}]`).parent().dropdown('get text');
                                    break;
                                }

                                case 'calendar': {
                                    text = $(`input[name=editable_${settings.type}]`).parents('.ui.calendar').calendar('get inputDate');

                                    break;
                                }

                                case 'checklist':
                                case 'radio': {
                                    value = value.filter(Boolean);

                                    if (value === '') {
                                        text = '';
                                    } else {
                                        const items = value.map(function (item) {
                                            const found = settings.source.find(function (entry) {
                                                return entry.value == item;
                                            });

                                            return found.name || found.text;
                                        });

                                        text = items.join(',\n');
                                    }

                                    break;
                                }

                                default: {
                                    module.error(error.type);

                                    return;
                                }
                            }

                            module.set.value(value, text);

                            module.hide();
                        }
                    },
                    deny: function () {
                        settings.onCancel.call(element);
                        module.hide();
                    },
                },

                remove: {
                    events: function () {
                        module.verbose('Removing events');
                        $module
                            .off(eventNamespace);
                    },
                },

                enable: function () {
                    module.debug('Setting editable to interactive mode');
                    module.bind.events();
                    $module
                        .removeClass(className.disabled);
                },

                disable: function () {
                    module.debug('Setting editable to read-only mode');
                    module.remove.events();
                    $module
                        .addClass(className.disabled);
                },

                show: function () {
                    module.debug('Showing editable');

                    module.setup.layout();

                    if (settings.exclusive) {
                        module.hideOthers();
                    }

                    if (settings.mode === 'inline') {
                        $module.hide();
                        $module.parent().append($container);

                        module.setup.form();

                        settings.onVisible.call(element);
                    } else if (settings.mode === 'popup') {
                        popup = $module.popup({
                            on: 'manual',
                            html: $container,
                            onHidden: function () {
                                $module.removeClass(className.active);
                            },
                            onVisible: function () {
                                module.setup.form();

                                settings.onVisible.call(element);
                            },
                        }).popup('show').popup('get popup');
                    }

                    module.bind.actionEvents();

                    $module.addClass(className.active);
                },

                hide: function () {
                    if (settings.mode === 'popup') {
                        $module.popup('hide');
                    }

                    $container.remove();
                    $module.removeClass(className.active).show();

                    settings.onHidden.call(element);
                },

                hideOthers: function () {
                    const $others = $(selector.container)
                        .not($container)
                        .siblings(selector.editable);

                    module.verbose('Finding other editables to hide', $others);

                    $others.editable('hide');
                },

                is: {
                    disabled: function () {
                        return $module.hasClass(className.disabled);
                    },
                    active: function () {
                        return $module.hasClass(className.active);
                    },
                    empty: function () {
                        return $module.attr(metadata.empty) || false;
                    },
                    required: function () {
                        return $module.data(metadata.required) || settings.required === true;
                    },
                },

                get: {
                    value: function () {
                        let value;

                        if (module.is.empty()) {
                            value = '';
                        } else {
                            switch (settings.type) {
                                case 'text':
                                case 'textarea': {
                                    value = module.get.text();

                                    break;
                                }

                                case 'dropdown': {
                                    // value = $module.attr(metadata.value) || settings.source.filter(function (item) { return item.selected }).map(function (item) { return item.value }).join(',\n') || '';
                                    value = $module.attr(metadata.value) || '';

                                    break;
                                }

                                case 'calendar': {
                                    value = $module.attr(metadata.value) || module.get.text();

                                    break;
                                }

                                case 'checklist':
                                case 'radio': {
                                    // value = $module.data(metadata.value) || settings.source.filter(function (item) { return item.checked }).map(function (item) { return item.value }).join(',\n') || '';
                                    value = $module.data(metadata.value) || '';

                                    break;
                                }

                                default: {
                                    module.error(error.type);

                                    return;
                                }
                            }
                        }

                        return value;
                    },
                    text: function () {
                        let text;

                        if (module.is.empty()) {
                            text = '';
                        } else {
                            text = settings.type === 'textarea'
                                ? $module.html().replace(/<br>/gi, '\n')
                                : text = $module.text();
                        }

                        return text;
                    },
                    placeholder: function () {
                        return $module.data(metadata.placeholder || settings.placeholder || '');
                    },
                },

                set: {
                    value: function (value, text) {
                        function onBeforeChangeCallback(result) {
                            if (result === false) {
                                return false;
                            }

                            if (value === '') {
                                module.set.empty();
                            } else {
                                $module.removeAttr(metadata.empty);
                                $module.attr(metadata.value, value);
                                if (settings.type === 'textarea' || settings.type === 'checklist') {
                                    $module.html(text.replace(/\n/gi, '<br>'));
                                } else {
                                    $module.text(text);
                                }
                            }

                            selection = value;

                            settings.onChange.call(element, value, text);
                        }

                        if (settings.onBeforeChange.constructor.name === 'AsyncFunction') {
                            settings.onBeforeChange.call(element, value, text).then(function (resolve) {
                                onBeforeChangeCallback(resolve);
                            });
                        } else {
                            onBeforeChangeCallback(settings.onBeforeChange.call(element, value, text));
                        }

                        /// Without async, we keep it in case of a no-go
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
                            case 'calendar': {
                                $module.text(settings.text.empty);

                                break;
                            }

                            case 'dropdown':
                            case 'checklist':
                            case 'radio': {
                                $module.text(settings.text.noselection);

                                break;
                            }

                            default: {
                                module.error(error.type);
                            }
                        }
                    },
                },

                setting: function (name, value) {
                    module.debug('Changing setting', name, value);
                    if ($.isPlainObject(name)) {
                        $.extend(true, settings, name);
                    } else if (value !== undefined) {
                        if ($.isPlainObject(settings[name])) {
                            $.extend(true, settings[name], value);
                        } else {
                            settings[name] = value;
                        }
                    } else {
                        return settings[name];
                    }
                },
                internal: function (name, value) {
                    if ($.isPlainObject(name)) {
                        $.extend(true, module, name);
                    } else if (value !== undefined) {
                        module[name] = value;
                    } else {
                        return module[name];
                    }
                },
                debug: function () {
                    if (!settings.silent && settings.debug) {
                        if (settings.performance) {
                            module.performance.log(args);
                        } else {
                            module.debug = Function.prototype.bind.call(console.info, console, settings.name + ':');
                            module.debug.apply(console, args);
                        }
                    }
                },
                verbose: function () {
                    if (!settings.silent && settings.verbose && settings.debug) {
                        if (settings.performance) {
                            module.performance.log(args);
                        } else {
                            module.verbose = Function.prototype.bind.call(console.info, console, settings.name + ':');
                            module.verbose.apply(console, args);
                        }
                    }
                },
                error: function () {
                    if (!settings.silent) {
                        module.error = Function.prototype.bind.call(console.error, console, settings.name + ':');
                        module.error.apply(console, args);
                    }
                },
                performance: {
                    log: function (message) {
                        let currentTime;
                        let executionTime;
                        let previousTime;
                        if (settings.performance) {
                            currentTime = Date.now();
                            previousTime = time || currentTime;
                            executionTime = currentTime - previousTime;
                            time = currentTime;
                            performance.push({
                                Name: message[0],
                                Arguments: message.slice(1),
                                Element: element,
                                'Execution Time': executionTime,
                            });
                        }
                        clearTimeout(module.performance.timer);
                        module.performance.timer = setTimeout(function () {
                            module.performance.display();
                        }, 500);
                    },
                    display: function () {
                        let title = settings.name + ':';
                        let totalTime = 0;
                        time = false;
                        clearTimeout(module.performance.timer);
                        $.each(performance, function (index, data) {
                            totalTime += data['Execution Time'];
                        });
                        title += ' ' + totalTime + 'ms';
                        if ($allModules.length > 1) {
                            title += ' (' + $allModules.length + ')';
                        }
                        if (performance.length > 0) {
                            console.groupCollapsed(title);
                            console.table(performance);
                            console.groupEnd();
                        }
                        performance = [];
                    },
                },
                invoke: function (query, passedArguments = queryArguments, context = element) {
                    let object = instance;
                    let maxDepth;
                    let found;
                    let response;
                    if (typeof query === 'string' && object !== undefined) {
                        query = query.split(/[ .]/);
                        maxDepth = query.length - 1;
                        $.each(query, function (depth, value) {
                            const camelCaseValue = depth !== maxDepth
                                ? value + query[depth + 1].charAt(0).toUpperCase() + query[depth + 1].slice(1)
                                : query;
                            if ($.isPlainObject(object[camelCaseValue]) && (depth !== maxDepth)) {
                                object = object[camelCaseValue];
                            } else if (object[camelCaseValue] !== undefined) {
                                found = object[camelCaseValue];

                                return false;
                            } else if ($.isPlainObject(object[value]) && (depth !== maxDepth)) {
                                object = object[value];
                            } else if (object[value] !== undefined) {
                                found = object[value];

                                return false;
                            } else {
                                module.error(error.method, query);

                                return false;
                            }
                        });
                    }
                    if (isFunction(found)) {
                        response = found.apply(context, passedArguments);
                    } else if (found !== undefined) {
                        response = found;
                    }
                    if (Array.isArray(returnedValue)) {
                        returnedValue.push(response);
                    } else if (returnedValue !== undefined) {
                        returnedValue = [returnedValue, response];
                    } else if (response !== undefined) {
                        returnedValue = response;
                    }

                    return found;
                },
            };
            if (methodInvoked) {
                if (instance === undefined) {
                    module.initialize();
                }
                module.invoke(parameters);
            } else {
                if (instance !== undefined) {
                    instance.invoke('destroy');
                }
                module.initialize();
            }
        });

        return returnedValue !== undefined
            ? returnedValue
            : this;
    };

    $.fn.editable.settings = {

        name: 'Editable',
        namespace: 'editable',

        silent: false,
        debug: false,
        verbose: false,
        performance: true,

        type: 'text', // 'text' | 'textarea'
        mode: 'popup', // 'popup' | 'inline',
        exclusive: false,
        source: null,
        required: false,

        variation: '',

        /* Callbacks */

        // callback before a value change, return false to cancel the change
        onBeforeChange: function (value, text) {
            return true;
        },

        onChange: function (value, text) {},

        onCancel: function () {},

        onVisible: function () {},

        onHidden: function () {},

        error: {
            method: 'The method you called is not defined',
            type: 'Unknown editable type',
            popup: 'UI Popup, a required component is not included in this page',
            calendar: 'UI Calendar, a required component is not included in this page',
            dropdown: 'UI Dropdown, a required component is not included in this page',
        },

        metadata: {
            type: 'type',
            value: 'value',
            placeholder: 'placeholder',
            title: 'title',
            empty: 'empty',
            required: 'required',
        },

        className: {
            active: 'active',
            visible: 'visible',
            disable: 'disabled',
        },

        selector: {
            editable: '.ui.editable',
            container: '.editable.container',
            form: '.ui.form',
            approve: '.actions .positive, .actions .approve, .actions .ok',
            deny: '.actions .negative, .actions .deny, .actions .cancel',
        },

        text: {
            empty: 'Empty',
            noselection: 'None selected',
        },

        templates: {
            container_inline: function () {
                const html = '<span class="editable inline container"></span>';

                return html;
            },
            container_popup: function () {
                const html = '<span class="editable popup container"></span>';

                return html;
            },
            form: function () {
                const html = '<div class="ui mini form"></div>';

                return html;
            },
            field: function (settings, required = false) {
                let html;

                switch (settings.type) {
                    case 'text':
                    case 'textarea':
                    case 'dropdown':
                    case 'calendar': {
                        html = '<span class="inline field' + (required ? ' required' : '') + ' style="display: inline-block;"></span>';

                        break;
                    }

                    case 'checklist':
                    case 'radio': {
                        html = '<div class="grouped fields' + (required ? ' required' : '') + ' style="display: inline-block;"></div>';

                        break;
                    }

                    default:
                }

                return html;
            },
            text: function (value, placeholder = '') {
                const html = `<input type="text" name="editable_text" value="${value}" placeholder="${placeholder}">`;

                return html;
            },
            textarea: function (value, placeholder = '') {
                const html = `<textarea name="editable_textarea" placeholder="${placeholder}">${value}</textarea>`;

                return html;
            },
            dropdown: function (items, placeholder = '', variation = '') {
                const value = Array.isArray(items)
                    ? items.filter(function (item) {
                        return item.selected;
                    }).map(function (item) {
                        return item.value;
                    }).join(',')
                    : '';

                let html = `
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
            calendar: function (date, placeholder = '') {
                const html = `<div class="ui calendar" data-type="date" data-date="${date}">
                                <div class="ui fluid input left icon">
                                <i class="calendar icon"></i>
                                <input type="text" name="editable_calendar" placeholder="${placeholder}">
                                </div>
                            </div>`;

                return html;
            },
            checklist: function (items) {
                let html = '';

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
            radio: function (items) {
                let html = '';

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
            actions: function () {
                const html = `<span class="editable actions" style="display: inline-block;">
                                <i class="link green approve check icon"></i>&nbsp;<i class="link red deny times icon"></i>
                            </span>`;

                return html;
            },
        },

    };
})(jQuery, window, document);
