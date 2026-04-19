import Component from '@glimmer/component';
import svgJar from 'ember-svg-jar/helpers/svg-jar';

export default class ClassName extends Component {
  <template>
    {{svgJar "one-icon"}}
    <div>
      {{svgJar "two" class="my-icon"}}
    </div>
    {{svgJar "#sprite-icon" class="my-icon" title="My Icon"}}
    {{someHelper "not-an-icon-name"}}
    {{svgJar (helper "some-other-icon") class=(classHelper "icon-class" "another-class")}}
  </template>
}
