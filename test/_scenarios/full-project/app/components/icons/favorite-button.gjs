import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  <button class="favorite-btn" aria-label="Favorite" ...attributes>
    {{svgJar "heart" class="heart-icon"}}
    {{svgJar "#star" class="star-icon"}}
  </button>
</template>
