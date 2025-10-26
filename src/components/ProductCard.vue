<template>
  <div class="product-card" :class="{ 'low-stock': isLowStock }">
    <div class="product-image">
      {{ product.image }}
    </div>
    
    <div class="product-info">
      <h3 class="product-name">{{ product.name }}</h3>
      
      <div class="product-details">
        <span class="product-price">R$ {{ formatPrice(product.price) }}</span>
        
        <span 
          v-if="showStock" 
          class="product-stock"
          :class="{ 'low': isLowStock, 'ok': !isLowStock }"
        >
          <svg v-if="isLowStock" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
          {{ product.stock }} unid
        </span>
      </div>

      <span v-if="product.category" class="product-category">
        {{ getCategoryLabel(product.category) }}
      </span>
    </div>

    <button 
      class="add-btn" 
      @click="handleAdd"
      :disabled="product.stock === 0"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="12" y1="5" x2="12" y2="19"/>
        <line x1="5" y1="12" x2="19" y2="12"/>
      </svg>
    </button>
  </div>
</template>

<script>
export default {
  name: 'ProductCard',
  props: {
    product: {
      type: Object,
      required: true
    },
    showStock: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    isLowStock() {
      return this.product.stock < 20
    }
  },
  methods: {
    formatPrice(price) {
      return price.toFixed(2).replace('.', ',')
    },
    getCategoryLabel(category) {
      const labels = {
        'espetinhos': '🔥 Espetinho',
        'bebidas': '🥤 Bebida',
        'porcoes': '🍟 Porção',
        'sobremesas': '🍰 Sobremesa'
      }
      return labels[category] || category
    },
    handleAdd() {
      if (this.product.stock > 0) {
        this.$emit('add-to-cart', this.product)
      }
    }
  }
}
</script>

<style scoped>
.product-card {
  background: white;
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  gap: 1rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  border: 2px solid rgba(196, 30, 58, 0.1);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.product-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
  border-color: var(--primary);
}

.product-card.low-stock {
  border-color: var(--danger);
}

.product-card.low-stock::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  width: 4px;
  height: 100%;
  background: var(--danger);
}

.product-image {
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, rgba(196, 30, 58, 0.1), rgba(255, 107, 53, 0.1));
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2rem;
  flex-shrink: 0;
}

.product-info {
  flex: 1;
  min-width: 0;
}

.product-name {
  font-size: 1rem;
  font-weight: bold;
  color: var(--dark);
  margin: 0 0 0.5rem 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.product-details {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.product-price {
  color: var(--primary);
  font-weight: bold;
  font-size: 1.1rem;
}

.product-stock {
  font-size: 0.8rem;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-weight: bold;
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
}

.product-stock.low {
  background: rgba(239, 68, 68, 0.1);
  color: var(--danger);
}

.product-stock.ok {
  background: rgba(16, 185, 129, 0.1);
  color: var(--success);
}

.product-stock svg {
  width: 14px;
  height: 14px;
}

.product-category {
  font-size: 0.75rem;
  color: #666;
  display: inline-block;
  background: rgba(196, 30, 58, 0.05);
  padding: 0.25rem 0.5rem;
  border-radius: 6px;
}

.add-btn {
  background: linear-gradient(135deg, var(--primary), var(--accent));
  color: white;
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(196, 30, 58, 0.3);
  transition: all 0.3s ease;
  flex-shrink: 0;
}

.add-btn:hover:not(:disabled) {
  transform: scale(1.1) rotate(90deg);
  box-shadow: 0 6px 16px rgba(196, 30, 58, 0.4);
}

.add-btn:active:not(:disabled) {
  transform: scale(0.95) rotate(90deg);
}

.add-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  background: #ccc;
}

.add-btn svg {
  width: 20px;
  height: 20px;
}

@media (max-width: 768px) {
  .product-card {
    padding: 0.75rem;
  }

  .product-image {
    width: 50px;
    height: 50px;
    font-size: 1.5rem;
  }

  .product-name {
    font-size: 0.9rem;
  }

  .product-price {
    font-size: 1rem;
  }

  .add-btn {
    width: 36px;
    height: 36px;
  }
}
</style>