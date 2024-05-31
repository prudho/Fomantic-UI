declare namespace FomanticUI {
  interface Editable {
    settings: EditableSettings;
  }

  /**
   * @see {@link https://fomantic-ui.com/modules/editable.html#/settings}
   */
  interface EditableSettings {
    // region Editable Settings

    /**
     * Type of editable item to display.
     * @default 'text'
     */
    type: 'text' | 'textarea' | 'calendar' | 'dropdown' | 'checklist' | 'radio';

    /**
     * Define how to display the editable item.
     * @default 'popup'
     */
    mode: 'popup' | 'inline';

    /**
     * Only allow one editable item at a time.
     * @default false
     */
    exclusive: boolean;

    /**
     * Array of choices for `dropdown`, `checklist` or `radio`.
     * @default null
     */
    source: Partial<{value: string, text: string, checked: boolean, selected: boolean}> | null;

    /**
     * Define if editable item value cannot be an empty value or no selection.
     * @default false
     */
    required: boolean;

    /**
     * Allow to add CSS classes to the underlying component.
     * @default ''
     */
    variation: string;
    
    // endregion

    // region Callbacks

    /**
     * Is called before the editable value is changed.
     * If the function returns 'false', the value and text will not be updated.
     */
    onBeforeChange(this: JQuery, value: string, text: string): boolean | Promise<boolean>;

    /**
     * Is called when the editable value is changed.
     */
    onChange(this: JQuery, value: string, text: string): void;

    /**
     * Is called when user chose to cancel edition mode.
     */
    onCancel(this: JQuery): void;

    /**
     * Is called when edition mode is visible.
     */
    onVisible(this: JQuery): void;

    /**
     * Is called when edition mode is hidden.
     */
    onHidden(this: JQuery): void;

    // endregion

    // region DOM Settings

    /**
     * Class names used to determine element state.
     */
    metadata: Editable.MetadataSettings;

    /**
     * Class names used to determine element state.
     */
    className: Editable.ClassNameSettings;

    /**
     * DOM Selectors used internally.
     * Selectors used to find parts of a module.
     */
    selector: Editable.SelectorSettings;

    /**
     * Templates used to generate editable content.
     */
    template: Editable.TemplateSettings;

    // endregion

    // region Editable Texts

    text: Editable.TextSettings;

    // endregion

    // region Debug Settings

    /**
     * Name used in log statements
     * @default 'Editable'
     */
    name: string;

    /**
     * Event namespace. Makes sure module teardown does not effect other events attached to an element.
     * @default 'editable'
     */
    namespace: string;

    /**
     * Silences all console output including error messages, regardless of other debug settings.
     * @default false
     */
    silent: boolean;

    /**
     * Debug output to console
     * @default false
     */
    debug: boolean;

    /**
     * Show console.table output with performance metrics
     * @default true
     */
    performance: boolean;

    /**
     * Debug output includes all internal behaviors
     * @default false
     */
    verbose: boolean;

    error: Editable.ErrorSettings;

    // endregion
  }

  namespace Editable {
    type MetadataSettings = Partial<Pick<Settings.Metadatas, keyof Settings.Metadatas>>;
    type ClassNameSettings = Partial<Pick<Settings.ClassNames, keyof Settings.ClassNames>>;
    type SelectorSettings = Partial<Pick<Settings.Selectors, keyof Settings.Selectors>>;
    type TemplateSettings = Partial<Pick<Settings.Templates, keyof Settings.Templates>>;
    type TextSettings = Partial<Pick<Settings.Texts, keyof Settings.Texts>>;
    type ErrorSettings = Partial<Pick<Settings.Errors, keyof Settings.Errors>>;

    namespace Settings {
      interface Metadatas {
        /**
         * @default 'type'
         */
        type: string;

        /**
         * @default 'value'
         */
        value: string;

        /**
         * @default 'placeholder'
         */
        placeholder: string;

        /**
         * @default 'title'
         */
        title: string;

        /**
         * @default 'empty'
         */
        empty: string;

        /**
         * @default 'required'
         */
        required: string;
      }

      interface ClassNames {
        /**
         * @default 'active'
         */
        active: string;

        /**
         * @default 'visible'
         */
        visible: string;

        /**
         * @default 'disabled'
         */
        disabled: string;
      }

      interface Selectors {
        /**
         * @default '.ui.editable'
         */
        editable: string;

        /**
         * @default '.editable.container'
         */
        container: string;

        /**
         * @default '.ui.form'
         */
        form: string;

        /**
         * @default '.actions .positive, .actions .approve, .actions .ok'
         */
        approve: string;

        /**
         * @default '.actions .negative, .actions .deny, .actions .cancel'
         */
        deny: string;
      }

      interface Templates {
        /**
         * HTML Template for the inline editable container
         * @default function
         */
        container_inline(): string;

        /**
         * HTML Template for the popup editable container
         * @default function
         */
        container_popup(): string;

        /**
         * HTML Template for the underlying form of the editable module
         * @default function
         */
        form(): string;

        /**
         * HTML Template for the underlying form item of the editable module
         * @default function
         */
        field(settings: EditableSettings, required: boolean): string;

        /**
         * HTML Template for the `text` type of the editable module
         * @default function
         */
        text(value: string, placeholder: string): string;

        /**
         * HTML Template for the `textarea` type of the editable module
         * @default function
         */
        textarea(value: string, placeholder: string): string;

        /**
         * HTML Template for the `dropdown` type of the editable module
         * @default function
         */
        dropdown(items: Array<{value: string, text: string, checked: boolean, selected: boolean}> | '', placeholder: string, variation: string): string;

        /**
         * HTML Template for the `calendar` type of the editable module
         * @default function
         */
        calendar(date: string, placeholder: string): string;

        /**
         * HTML Template for the `checklist` type of the editable module
         * @default function
         */
        checklist(items: Array<{value: string, text: string, checked: boolean, selected: boolean}>): string;

        /**
         * HTML Template for the `radio` type of the editable module
         * @default function
         */
        radio(items: Array<{value: string, text: string, checked: boolean, selected: boolean}>): string;

        /**
         * HTML Template for the action container of the editable module
         * @default function
         */
        actions(): string;
      }

      interface Texts {
        /**
         * @default 'Empty'
         */
        empty: string;

        /**
         * @default 'None selected'
         */
        noselection: string;
      }

      interface Errors {
        /**
         * @default 'The method you called is not defined.'
         */
        method: string;

        /**
         * @default 'Unknown editable type'
         */
        type: string;

        /**
         * @default 'UI Popup, a required component is not included in this page'
         */
        popup: string;

        /**
         * @default 'UI Calendar, a required component is not included in this page'
         */
        calendar: string;

        /**
         * @default 'UI Dropdown, a required component is not included in this page'
         */
        dropdown: string;
    }
    }
  }
}
