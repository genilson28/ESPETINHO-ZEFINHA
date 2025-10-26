<template>
  <div class="header">
    <div class="header-content">
      <div class="header-left">
        <div class="logo-circle">
          <Flame :color="theme.primary" :size="28" />
        </div>
        <div>
          <h1>POINT DA ZEFINHA</h1>
          <p>Sistema de Gestão</p>
        </div>
      </div>
      <Clock :size="24" />
    </div>
  </div>
</template>

<script>
import { Flame, Clock } from 'lucide-vue-next';

export default {
  name: 'Header',
  components: {
    Flame,
    Clock
  },
  data() {
    return {
      theme: {
        primary: '#C41E3A',
        accent: '#FF6B35'
      }
    }
  }
}
</script>

<style scoped>
.header {
  background: linear-gradient(135deg, #C41E3A 0%, #FF6B35 100%);
  padding: 1.5rem;
  color: white;
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.logo-circle {
  width: 50px;
  height: 50px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  box-shadow: 0 2px 8px rgba(0,0,0,0.2);
}

h1 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: bold;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.2);
}

p {
  margin: 0;
  font-size: 0.85rem;
  opacity: 0.95;
}
</style>