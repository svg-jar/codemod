import svgJar from 'ember-svg-jar/helpers/svg-jar';
import type { TOC } from '@ember/component/template-only';

export interface TempSignature {
  Args: {};
  Element: HTMLDivElement;
  Blocks: {
    default: [];
  };
}

const Temp: TOC<TempSignature> = <template>
  {{svgJar "icon-name"}}
  {{svgJar "icon-name" class="my-icon"}}
  {{svgJar "#icon-name"}}
  {{svgJar "#icon-name" class="my-icon"}}
</template>

export default Temp;
