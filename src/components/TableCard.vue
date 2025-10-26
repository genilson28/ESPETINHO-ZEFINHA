<template>
  <div 
    class="table-card" 
    :class="statusClass"
    @click="$emit('select', table)"
  >
    <span class="status-badge">{{ statusLabel }}</span>

    <div class="table-number">
      {{ table.number }}
    </div>

    <div class="table-info">
      Mesa {{ table.number }}
    </div>

    <div v-if="table.orders && table.orders.length > 0" class="orders-badge">
      {{ table.orders.length }} {{ table.orders.length === 1 ? 'pedido' : 'pedidos' }}
    </div>

    <div v-if="totalAmount > 0" class="total-amount">
      R$ {{ formatPrice(totalAmount) }}
    </div>
  </div>
</template>

<script>
export default {
  name: 'TableCard',
  props: {
    table: {
      type: Object,
      required: true
    }
  },
  computed: {
    statusClass() {
      return `status-${this.table.status}`
    },
    statusLabel() {
      const labels = {
        available: 'Disponível',
        occupied: 'Ocupada',
        reserved: 'Reservada'
      }
      return labels[this.table.status] || 'Disponível'
    },
    totalAmount() {
      if (!this.table.orders || this.table.orders.length === 0) return 0
      return this.table.orders.reduce((total, order) => {
        return total + (order.price * order.qty)
      }, 0)
    }
  },
  methods: {
    formatPrice(price) {
      return price.toFixed(2).replace('.', ',')
    }
  }
}
</script>

<style scoped>
.table-card {
  background: white;
  padding: 1.5rem;
  border-radius: 16px;
  border: 3px solid;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  text-align: center;
}

.table-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
}

.table-card:active {
  transform: translateY(-2px);
}

/* Status: Disponível */
.status-available {
  border-color: var(--success);
}

.status-available .table-number {
  background: linear-gradient(135deg, var(--success), #059669);
  box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
}

.status-available .status-badge {
  background: rgba(16, 185, 129, 0.15);
  color: var(--success);
}

.status-available:hover {
  border-color: #059669;
}

/* Status: Ocupada */
.status-occupied {
  border-color: var(--danger);
}

.status-occupied .table-number {
  background: linear-gradient(135deg, var(--danger), #dc2626);
  box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
}

.status-occupied .status-badge {
  background: rgba(239, 68, 68, 0.15);
  color: var(--danger);
}

.status-occupied:hover {
  border-color: #dc2626;
}

/* Status: Reservada */
.status-reserved {
  border-color: var(--warning);
}

.status-reserved .table-number {
  background: linear-gradient(135deg, var(--warning), #f59e0b);
  box-shadow: 0 4px 12px rgba(245, 158, 11, 0.3);
}

.status-reserved .status-badge {
  background: rgba(245, 158, 11, 0.15);
  color: var(--warning);
}

.status-reserved:hover {
  border-color: #d97706;
}

.status-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.7rem;
  font-weight: bold;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.table-number {
  width: 60px;
  height: 60px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 1rem;
  color: white;
  font-size: 1.5rem;
  font-weight: bold;
}

.table-info {
  font-size: 0.9rem;
  color: #666;
  margin-bottom: 0.5rem;
}

.orders-badge {
  margin-top: 0.75rem;
  padding: 0.5rem;
  border-radius: 8px;
  font-size: 0.75rem;
  font-weight: bold;
}

.status-available .orders-badge {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.status-occupied .orders-badge {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.status-reserved .orders-badge {
  background: rgba(245, 158, 11, 0.1);
  color: var(--warning);
}

.total-amount {
  margin-top: 0.5rem;
  font-size: 1.1rem;
  font-weight: bold;
  color: var(--primary);
  padding: 0.5rem;
  background: rgba(196, 30, 58, 0.05);
  border-radius: 8px;
}

@media (max-width: 768px) {
  .table-card {
    padding: 1.25rem;
  }

  .table-number {
    width: 55px;
    height: 55px;
    font-size: 1.3rem;
  }

  .table-info {
    font-size: 0.85rem;
  }
}
</style>