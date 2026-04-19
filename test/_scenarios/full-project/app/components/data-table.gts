import Component from '@glimmer/component';
import svgJar from 'ember-svg-jar/helpers/svg-jar';

interface DataTableSignature {
  Args: {
    rows: unknown[];
    sortable: boolean;
  };
}

export default class DataTable extends Component<DataTableSignature> {
  <template>
    <table class="data-table">
      <thead>
        <tr>
          <th>Name {{svgJar "nav/chevron-up" class="sort-icon"}}</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {{#each @rows as |row|}}
          <tr>
            <td>{{row}}</td>
            <td>
              {{svgJar "actions/edit" class="action-icon" title="Edit"}}
              {{svgJar "actions/delete" class="action-icon delete" title="Delete"}}
            </td>
          </tr>
        {{/each}}
      </tbody>
    </table>
  </template>
}
