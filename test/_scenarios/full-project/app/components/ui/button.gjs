import Component from '@glimmer/component';
import svgJar from 'ember-svg-jar/helpers/svg-jar';

export default class UiButton extends Component {
  <template>
    <button class="btn {{@variant}}" type="button" ...attributes>
      {{#if @icon}}
        {{svgJar "arrow-right" class="btn-icon"}}
      {{/if}}
      {{yield}}
    </button>
  </template>
}
