import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  <nav class="navbar">
    <div class="navbar-brand">
      {{svgJar "menu" class="navbar-toggle"}}
    </div>
    <div class="navbar-search">
      {{svgJar "search" class="search-icon" title="Search"}}
    </div>
    <div class="navbar-actions">
      {{svgJar "user" class="user-avatar"}}
    </div>
  </nav>
</template>
