import Component from '@glimmer/component';
import svgJar from 'ember-svg-jar/helpers/svg-jar';

interface SidebarSignature {
  Args: {
    collapsed: boolean;
  };
}

export default class Sidebar extends Component<SidebarSignature> {
  <template>
    <aside class="sidebar {{if @collapsed 'collapsed'}}">
      <ul class="sidebar-nav">
        <li>{{svgJar "nav/chevron-right" class="nav-icon"}} Dashboard</li>
        <li>{{svgJar "nav/chevron-right" class="nav-icon"}} Reports</li>
        <li>{{svgJar "settings" class="nav-icon"}} Settings</li>
      </ul>
      <div class="sidebar-footer">
        {{svgJar "nav/chevron-left" class="collapse-icon"}}
      </div>
    </aside>
  </template>
}
