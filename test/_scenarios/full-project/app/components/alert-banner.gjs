import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  <div class="alert {{@type}}" role="alert">
    {{svgJar "check-circle" class="alert-icon"}}
    <span class="alert-message">{{yield}}</span>
    {{svgJar "close" class="alert-dismiss" title="Dismiss"}}
  </div>
</template>
