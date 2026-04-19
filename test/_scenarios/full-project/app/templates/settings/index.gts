import svgJar from 'ember-svg-jar/helpers/svg-jar';

<template>
  <div class="settings-page">
    <h2>{{svgJar "settings" class="page-icon"}} Settings</h2>

    <section class="settings-section">
      <h3>Account</h3>
      {{svgJar "user" class="section-icon"}}

      <div class="settings-actions">
        {{svgJar "actions/edit" class="edit-btn" title="Edit profile"}}
      </div>
    </section>
  </div>
</template>
