import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  {{svgJar "icon-name"}}
  {{svgJar "icon-name" class="my-icon"}}
  {{svgJar "#icon-name"}}
  {{svgJar "#icon-name" class="my-icon"}}
</template>
