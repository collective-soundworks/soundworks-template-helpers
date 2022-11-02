import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import './sw-app-header.js';

class SwPluginError extends LitElement {
  static get properties() {
    return {
      title: {
        type: String,
        reflect: true,
      },
      subtitle: {
        type: String,
        reflect: true,
      },
    }
  }

  static get styles() {
    return css`
      :host {
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        justify-content: space-around;
        align-content: stretch;
        flex-wrap: wrap;
      }

      ul {
        list-style-type: none;
        padding-right: 20px;
      }

      li, ::slotted(li) {
        font-size: 1.4rem;
        line-height: 2rem;
        opacity: 0.9;
      }

      li:first-child {
        font-style: italic;
        color: #a94442;
      }

    `;
  }

  constructor() {
    super();

    this.title = '';
    this.subtitle = '';
  }

  render() {
    return html`
      <sw-app-header title="${this.title}" subtitle="${this.subtitle}"></sw-app-header>
      <ul>
        <li>Sorry,</li>
        <slot name="message"></slot>
        <slot name="description"></slot>
      </ul>
    `;
  }
}

customElements.define('sw-plugin-error', SwPluginError);
