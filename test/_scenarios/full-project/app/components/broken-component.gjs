import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  <div class="broken">
    {{svgJar "nonexistent-icon"}}
    {{svgJar "close" class="valid-icon"}}
  </div>
</template>
