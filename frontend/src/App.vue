<template>
  <div class="app">
    <AppNavbar />
    <main class="main">
      <router-view />
    </main>
    <AppFooter />
  </div>
</template>

<script setup lang="ts">
import AppNavbar from '@/layout/AppNavbar.vue'
import AppFooter from '@/layout/AppFooter.vue'
</script>

<style scoped>
.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
.main {
  flex: 1;
}
</style>
