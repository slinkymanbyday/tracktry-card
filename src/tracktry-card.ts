import { LitElement, html, customElement, property, TemplateResult, css, CSSResult, PropertyValues } from 'lit-element';
import { repeat } from 'lit-html/directives/repeat';
import { HomeAssistant, forwardHaptic, fireEvent } from 'custom-card-helpers';

import { TracktryCardConfig, Tracking } from './types';
import { actionHandler } from './action-handler-directive';
import { CARD_VERSION } from './const';

/* eslint no-console: 0 */
console.info(
  `%c  TRACKTRY-CARD  \n%c  Version ${CARD_VERSION}   `,
  'color: orange; font-weight: bold; background: black',
  'color: white; font-weight: bold; background: dimgray',
);

@customElement('tracktry-card')
export class TracktryCard extends LitElement {
  @property() public hass?: HomeAssistant;
  @property() private _config?: TracktryCardConfig;

  public setConfig(config: TracktryCardConfig): void {
    if (!config || !config.entity) {
      throw new Error('Invalid configuration');
    }

    this._config = { title: 'Tracktry', ...config };
  }

  public getCardSize(): number {
    return 6;
  }

  protected shouldUpdate(changedProps: PropertyValues): boolean {
    if (changedProps.has('_config')) {
      return true;
    }

    if (this.hass && this._config) {
      const oldHass = changedProps.get('hass') as HomeAssistant | undefined;

      if (oldHass) {
        return oldHass.states[this._config.entity] !== this.hass.states[this._config.entity];
      }
    }

    return true;
  }

  protected render(): TemplateResult | void {
    if (!this._config || !this.hass) {
      return html``;
    }

    const stateObj = this.hass.states[this._config.entity];

    if (!stateObj) {
      return html`
        <ha-card>
          <div class="warning">
            Entity not available: ${this._config.entity}
          </div>
        </ha-card>
      `;
    }

    const delivered: Tracking[] = stateObj.attributes['trackings'].filter(function(tracking) {
      return tracking.status.toLowerCase() === 'delivered';
    });

    const intransit: Tracking[] = stateObj.attributes['trackings'].filter(function(tracking) {
      return tracking.status.toLowerCase() !== 'delivered';
    });

    return html`
      <ha-card>
        <div class="header" @click=${this._moreInfo}>
          ${this._config.title}
        </div>
        ${repeat(
          intransit,
          item => item.tracking_number,
          (item, index) =>
            html`
              <paper-item>
                <paper-item-body class="icon">
                  <ha-icon
                    icon="mdi:truck-delivery"
                    .index=${index}
                    .item=${item}
                    @action=${this._handleAction}
                    .actionHandler=${actionHandler({ hasHold: true })}
                  ></ha-icon>
                </paper-item-body>
                <paper-item-body>
                  <div>
                    ${item.name}
                  </div>
                  <div class="secondary">
                    ${item.status_description ? item.status_description : item.tracking_number}
                    (${item.location ? item.location : 'Location N/A'})
                  </div>
                </paper-item-body>
                <paper-item-body class="last">
                  <div style="text-transform: capitalize">
                    ${item.status}
                  </div>
                  <div class="secondary">
                    ${new Date(item.last_update).toDateString()}
                  </div>
                </paper-item-body>
              </paper-item>
            `,
        )}
        ${repeat(
          delivered,
          item => item.tracking_number,
          (item, index) =>
            html`
              <paper-item>
                <paper-item-body class="icon">
                  <ha-icon
                    icon="mdi:package"
                    .index=${index}
                    .item=${item}
                    @action=${this._handleAction}
                    .actionHandler=${actionHandler({ hasHold: true })}
                  ></ha-icon>
                </paper-item-body>
                <paper-item-body>
                  <div>
                    ${item.name}
                  </div>
                  <div class="secondary">
                    ${item.status_description ? item.status_description : item.tracking_number}
                    (${item.location ? item.location : 'Location N/A'})
                  </div>
                </paper-item-body>
                <paper-item-body class="last">
                  <div style="text-transform: capitalize">
                    ${item.status}
                  </div>
                  <div class="secondary">
                    ${new Date(item.last_update).toDateString()}
                  </div>
                </paper-item-body>
              </paper-item>
            `,
        )}
        ${this._config.show_add === false
          ? delivered.length === 0 && intransit.length === 0
            ? html`
                <paper-item>
                  Not tracking any packages right now
                </paper-item>
              `
            : null
          : html`
              <paper-item>
                <paper-item-body class="icon">
                  <ha-icon class="addButton" @click=${this._addItem} icon="hass:plus" title="Add Tracking"> </ha-icon>
                </paper-item-body>
                <paper-item-body>
                  <paper-input
                    no-label-float
                    placeholder="Title"
                    @keydown=${this._addKeyPress}
                    id="title"
                  ></paper-input>
                </paper-item-body>
                <paper-item-body>
                  <paper-input
                    no-label-float
                    placeholder="Tracking"
                    @keydown=${this._addKeyPress}
                    id="tracking"
                    required
                  ></paper-input>
                </paper-item-body>
                <paper-item-body>
                  <paper-input
                    no-label-float
                    placeholder="Slug"
                    @keydown=${this._addKeyPress}
                    id="slug"
                    required
                  ></paper-input>
                </paper-item-body>
              </paper-item>
            `}
      </ha-card>
    `;
  }

  private _daysUntilDelivery(expected: string): string {
    const daysUntil = Math.floor((Date.parse(expected) - new Date().getMilliseconds()) / 86400000);

    return daysUntil + daysUntil > 1 ? 'days' : 'day';
  }

  private get _title(): HTMLElement | null {
    if (this.shadowRoot) {
      return this.shadowRoot.querySelector('#title');
    }

    return null;
  }

  private get _tracking(): HTMLElement | null {
    if (this.shadowRoot) {
      return this.shadowRoot.querySelector('#tracking');
    }

    return null;
  }
  private get _slug(): HTMLElement | null {
    if (this.shadowRoot) {
      return this.shadowRoot.querySelector('#slug');
    }

    return null;
  }

  private _addItem(ev): void {
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const title = this._title as any;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const tracking = this._tracking as any;
    /* eslint-disable @typescript-eslint/no-explicit-any */
    const slug = this._slug as any;

    if (this.hass && title && tracking && tracking.value && tracking.value.length > 0) {
      this.hass.callService('tracktry', 'add_tracking', {
        tracking_number: tracking.value,
        title: title.value,
        slug: slug.value,
      });

      title.value = '';
      tracking.value = '';
      slug.value = '';

      if (ev) {
        title.focus();
      }
    }
  }

  private _addKeyPress(ev): void {
    if (ev.keyCode === 13) {
      this._addItem(null);
    }
  }

  private _removeItem(ev): void {
    const item = ev.target.item;
    if (!window.confirm('Are you sure you want to remove this tracking?')) {
      return;
    }

    if (this.hass) {
      this.hass.callService('tracktry', 'remove_tracking', {
        tracking_number: item.tracking_number,
        slug: item.slug,
      });
      forwardHaptic('success');
    }

    forwardHaptic('failure');
  }

  private _moreInfo(): void {
    if (this._config) {
      fireEvent(this, 'hass-more-info', {
        entityId: this._config.entity,
      });
    }
  }

  private _handleAction(ev): void {
    switch (ev.detail.action) {
      case 'tap':
        this._openLink(ev);
        break;
      case 'hold':
        this._removeItem(ev);
        break;
      default:
        break;
    }
  }

  private _openLink(ev): void {
    const item = ev.target.item;
    window.open(item.link, 'mywindow');
  }

  static get styles(): CSSResult {
    return css`
      ha-card {
        padding: 16px;
      }

      .warning {
        display: block;
        color: black;
        background-color: #fce588;
        padding: 8px;
      }

      .header {
        /* start paper-font-headline style */
        font-family: 'Roboto', 'Noto', sans-serif;
        -webkit-font-smoothing: antialiased; /* OS X subpixel AA bleed bug */
        text-rendering: optimizeLegibility;
        font-size: 24px;
        font-weight: 400;
        letter-spacing: -0.012em;
        /* end paper-font-headline style */

        line-height: 40px;
        cursor: pointer;
      }

      paper-input {
        --paper-input-container-underline: {
          display: none;
        }
        --paper-input-container-underline-focus: {
          display: none;
        }
        --paper-input-container-underline-disabled: {
          display: none;
        }
        position: relative;
        top: 1px;
      }

      ha-icon {
        padding: 9px 15px 11px 15px;
        cursor: pointer;
        color: var(--primary-color);
      }

      .side-by-side {
        display: flex;
      }

      .side-by-side > * {
        flex: 1;
        padding-right: 4px;
      }

      paper-item {
        padding: 0;
      }

      paper-item-body {
        padding-right: 16px;
        margin-top: 16px;
        display: flex;
        flex-direction: column;
        justify-content: normal;
        flex: auto;
        flex-basis: auto;
        white-space: nowrap;
        overflow: hidden;
      }

      paper-item-body > * {
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      paper-item-body.icon {
        flex-direction: row;
        max-width: 54px;
        min-width: 54px;
      }

      table {
        width: 100%;
      }

      .last {
        text-align: right;
        min-width: 80px;
      }

      .secondary {
        display: block;
        color: var(--secondary-text-color);
        margin-top: -10px;
        font-size: 10px;
        white-space: nowrap;
      }

      table {
        margin-top: -16px;
      }

      #tracking {
        text-align: right;
      }

      .divider {
        height: 1px;
        background-color: var(--divider-color);
        margin: 6px 40px 6px 0px;
      }
    `;
  }
}
