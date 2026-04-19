import Component from '@glimmer/component';
import svgJar from 'ember-svg-jar/helpers/svg-jar';

export interface ClassNameSignature {
  Args: {};
  Element: HTMLDivElement;
  Blocks: {
    default: [];
  };
}

export default class ClassName extends Component<ClassNameSignature> {
  @service declare something: any;

  <template>
    {{svgJar "icon-name"}}
    {{svgJar "icon-name" class="my-icon"}}
    {{svgJar "#icon-name"}}
    {{svgJar "#icon-name" class="my-icon"}}
  </template>
}
