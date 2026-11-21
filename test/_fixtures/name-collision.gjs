import svgJar from 'ember-svg-jar/helpers/svg-jar';
import OneIcon from './one-icon-component';
import OneIconIcon from './other-component';

<template>
  <OneIcon />
  <OneIconIcon />
  {{svgJar "one-icon"}}
  {{svgJar "two"}}
</template>
