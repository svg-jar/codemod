import { pageTitle } from 'ember-page-title';
import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  {{pageTitle "FullProject"}}

  <header class="app-header">
    {{svgJar "arrow-left" class="back-icon"}}
    <h1>Full Project</h1>
  </header>

  {{outlet}}
</template>
