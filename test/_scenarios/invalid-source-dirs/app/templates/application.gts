import { pageTitle } from 'ember-page-title';
import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  {{pageTitle "WithNodeModules"}}
  <h2 id="title">Welcome to Ember</h2>

  {{svgJar "circle"}} --- from node_modules
  {{svgJar "simple"}} --- from public/images/icons

  {{outlet}}
</template>
