<template>
  <div class="app-wrapper">
    <!-- TELA DE LOGIN COM GOOGLE -->
    <div v-if="!isAuthenticated" class="login-screen">
      <div class="login-container">
        <div class="login-logo">
          <div class="logo-circle">🍢</div>
          <h1 class="logo-title">Point da Zefinha</h1>
          <p class="logo-subtitle">Cardápio Digital</p>
        </div>

        <div class="login-card">
          <h2 class="login-title">Bem-vindo!</h2>
          <p class="login-text">Entre com sua conta Google para fazer seu pedido</p>
          
          <button @click="loginWithGoogle" class="btn-google">
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            <span>Entrar com Google</span>
          </button>

          <div class="login-benefits">
            <p>✓ Login rápido e seguro</p>
            <p>✓ Seus dados protegidos</p>
          </div>
        </div>
      </div>
    </div>

    <!-- APP PRINCIPAL -->
    <div v-else class="app-main">
      <!-- HEADER FIXO -->
      <header class="header">
        <div class="header-inner">
          <div class="table-info">
            <span class="table-icon">🪑</span>
            <span class="table-text">Mesa {{ tableId }}</span>
          </div>
          <div class="user-badge" @click="toggleUserMenu">
            <img v-if="user.photoURL" :src="user.photoURL" :alt="user.name" class="user-avatar">
            <div v-else class="user-avatar-default">{{ userInitial }}</div>
          </div>
        </div>

        <!-- Menu do Usuário -->
        <div v-if="showUserMenu" class="user-dropdown" @click.stop>
          <div class="dropdown-header">
            <img v-if="user.photoURL" :src="user.photoURL" :alt="user.name" class="dropdown-avatar">
            <div class="dropdown-info">
              <div class="dropdown-name">{{ user.name }}</div>
              <div class="dropdown-email">{{ user.email }}</div>
            </div>
          </div>
          <button @click="logout" class="dropdown-logout">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sair da conta
          </button>
        </div>
      </header>

      <!-- CONTEÚDO -->
      <div class="content">
        <!-- TAB: HOME (CARDÁPIO) -->
        <div v-show="currentTab === 'home'" class="tab-home">
          <!-- Barra de Busca na Home -->
          <div class="search-box">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="O que você está procurando?" 
              class="search-input"
            >
          </div>

          <!-- ESPETINHOS -->
          <section v-if="filteredEspetinhos.length > 0" class="section">
            <h2 class="section-title">Espetinhos</h2>
            <div class="products-grid">
              <div 
                v-for="product in filteredEspetinhos" 
                :key="product.id" 
                class="product-card"
                @click="viewProduct(product)">
                <div class="product-image-wrapper">
                  <img 
                    v-if="product.imagem_url" 
                    :src="product.imagem_url" 
                    :alt="product.nome"
                    class="product-img"
                  >
                  <div v-else class="product-img-placeholder">
                    <span class="placeholder-icon">🍢</span>
                  </div>
                  <div v-if="product.estoque_atual <= 5 && product.estoque_atual > 0" class="badge-limited">
                    Últimas unidades
                  </div>
                  <div v-if="product.estoque_atual <= 0" class="badge-sold">Esgotado</div>
                </div>
                <div class="product-details">
                  <h3 class="product-title">{{ product.nome }}</h3>
                  <p class="product-description">{{ product.descricao }}</p>
                  <div class="product-bottom">
                    <span class="product-price">R$ {{ formatPrice(product.preco) }}</span>
                    <button 
                      class="btn-add" 
                      @click.stop="addToCart(product)"
                      :disabled="product.estoque_atual <= 0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- BEBIDAS -->
          <section v-if="filteredBebidas.length > 0" class="section">
            <h2 class="section-title">Bebidas</h2>
            <div class="products-grid">
              <div 
                v-for="product in filteredBebidas" 
                :key="product.id" 
                class="product-card"
                @click="viewProduct(product)">
                <div class="product-image-wrapper">
                  <img 
                    v-if="product.imagem_url" 
                    :src="product.imagem_url" 
                    :alt="product.nome"
                    class="product-img"
                  >
                  <div v-else class="product-img-placeholder">
                    <span class="placeholder-icon">🥤</span>
                  </div>
                </div>
                <div class="product-details">
                  <h3 class="product-title">{{ product.nome }}</h3>
                  <p class="product-description">{{ product.descricao }}</p>
                  <div class="product-bottom">
                    <span class="product-price">R$ {{ formatPrice(product.preco) }}</span>
                    <button 
                      class="btn-add" 
                      @click.stop="addToCart(product)"
                      :disabled="product.estoque_atual <= 0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <!-- ACOMPANHAMENTOS -->
          <section v-if="filteredAcompanhamentos.length > 0" class="section">
            <h2 class="section-title">Acompanhamentos</h2>
            <div class="products-grid">
              <div 
                v-for="product in filteredAcompanhamentos" 
                :key="product.id" 
                class="product-card"
                @click="viewProduct(product)">
                <div class="product-image-wrapper">
                  <img 
                    v-if="product.imagem_url" 
                    :src="product.imagem_url" 
                    :alt="product.nome"
                    class="product-img"
                  >
                  <div v-else class="product-img-placeholder">
                    <span class="placeholder-icon">🍟</span>
                  </div>
                </div>
                <div class="product-details">
                  <h3 class="product-title">{{ product.nome }}</h3>
                  <p class="product-description">{{ product.descricao }}</p>
                  <div class="product-bottom">
                    <span class="product-price">R$ {{ formatPrice(product.preco) }}</span>
                    <button 
                      class="btn-add" 
                      @click.stop="addToCart(product)"
                      :disabled="product.estoque_atual <= 0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <!-- TAB: CARRINHO -->
        <div v-show="currentTab === 'cart'" class="tab-cart">
          <h1 class="page-title">Seu Pedido</h1>
          
          <div v-if="cart.length === 0" class="empty-cart">
            <div class="empty-icon">🛒</div>
            <h3>Seu carrinho está vazio</h3>
            <p>Adicione itens do cardápio para começar</p>
            <button @click="currentTab = 'home'" class="btn-back-menu">Ver Cardápio</button>
          </div>

          <div v-else class="cart-content">
            <div class="cart-items">
              <div v-for="(item, index) in cart" :key="index" class="cart-item">
                <div class="cart-item-image">
                  <img v-if="item.imagem_url" :src="item.imagem_url" :alt="item.nome">
                  <div v-else class="cart-placeholder">
                    {{ item.categoria?.includes('espetinho') ? '🍢' : item.categoria?.includes('bebida') ? '🥤' : '🍟' }}
                  </div>
                </div>
                <div class="cart-item-info">
                  <h4 class="cart-item-name">{{ item.nome }}</h4>
                  <p class="cart-item-price">R$ {{ formatPrice(item.preco) }}</p>
                </div>
                <div class="cart-item-actions">
                  <div class="quantity-control">
                    <button @click="decreaseQuantity(index)" class="qty-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                    <span class="qty-number">{{ item.quantity }}</span>
                    <button @click="increaseQuantity(index)" class="qty-btn">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                  <button @click="removeFromCart(index)" class="btn-remove">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div class="cart-summary">
              <div class="summary-row">
                <span>Subtotal</span>
                <span>R$ {{ formatPrice(totalPrice) }}</span>
              </div>
              <div class="summary-row summary-total">
                <span>Total</span>
                <span>R$ {{ formatPrice(totalPrice) }}</span>
              </div>
            </div>

            <button @click="confirmOrder" class="btn-confirm">
              Confirmar Pedido
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- TAB: BUSCAR -->
        <div v-show="currentTab === 'browse'" class="tab-browse">
          <h1 class="page-title">Buscar</h1>
          
          <div class="search-box-large">
            <svg class="search-icon" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar produtos, categorias..." 
              class="search-input-large"
              autofocus
            >
          </div>

          <div v-if="searchQuery && allFilteredProducts.length > 0" class="search-results">
            <p class="results-count">{{ allFilteredProducts.length }} resultados encontrados</p>
            <div class="products-grid">
              <div 
                v-for="product in allFilteredProducts" 
                :key="product.id" 
                class="product-card"
                @click="viewProduct(product)">
                <div class="product-image-wrapper">
                  <img 
                    v-if="product.imagem_url" 
                    :src="product.imagem_url" 
                    :alt="product.nome"
                    class="product-img"
                  >
                  <div v-else class="product-img-placeholder">
                    <span class="placeholder-icon">
                      {{ product.categoria?.includes('espetinho') ? '🍢' : product.categoria?.includes('bebida') ? '🥤' : '🍟' }}
                    </span>
                  </div>
                </div>
                <div class="product-details">
                  <h3 class="product-title">{{ product.nome }}</h3>
                  <p class="product-description">{{ product.descricao }}</p>
                  <div class="product-bottom">
                    <span class="product-price">R$ {{ formatPrice(product.preco) }}</span>
                    <button 
                      class="btn-add" 
                      @click.stop="addToCart(product)"
                      :disabled="product.estoque_atual <= 0">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                        <line x1="12" y1="5" x2="12" y2="19"/>
                        <line x1="5" y1="12" x2="19" y2="12"/>
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div v-else-if="searchQuery && allFilteredProducts.length === 0" class="no-results">
            <div class="no-results-icon">🔍</div>
            <h3>Nenhum resultado encontrado</h3>
            <p>Tente buscar por outro produto</p>
          </div>

          <div v-else class="search-placeholder">
            <div class="search-placeholder-icon">🔍</div>
            <h3>Busque por produtos</h3>
            <p>Digite o nome do produto que você procura</p>
          </div>
        </div>

        <!-- TAB: CONTA -->
        <div v-show="currentTab === 'account'" class="tab-account">
          <h1 class="page-title">Minha Conta</h1>
          
          <div class="account-card">
            <div class="account-header">
              <img v-if="user.photoURL" :src="user.photoURL" :alt="user.name" class="account-avatar">
              <div v-else class="account-avatar-default">{{ userInitial }}</div>
              <div class="account-info">
                <h2 class="account-name">{{ user.name }}</h2>
                <p class="account-email">{{ user.email }}</p>
              </div>
            </div>

            <div class="account-section">
              <h3 class="section-subtitle">Informações</h3>
              <div class="info-item">
                <span class="info-label">Mesa</span>
                <span class="info-value">Mesa {{ tableId }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status</span>
                <span class="info-value status-active">Ativo</span>
              </div>
            </div>

            <button @click="logout" class="btn-logout-full">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              Sair da Conta
            </button>
          </div>
        </div>
      </div>

      <!-- BOTTOM NAVIGATION -->
      <nav class="bottom-nav">
        <button 
          class="nav-item" 
          :class="{ active: currentTab === 'home' }"
          @click="currentTab = 'home'">
          <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
            <polyline points="9 22 9 12 15 12 15 22"/>
          </svg>
          <span class="nav-label">Home</span>
        </button>

        <button 
          class="nav-item" 
          :class="{ active: currentTab === 'cart' }"
          @click="currentTab = 'cart'">
          <div class="nav-icon-wrapper">
            <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span v-if="cartItemCount > 0" class="cart-badge">{{ cartItemCount }}</span>
          </div>
          <span class="nav-label">Carrinho</span>
        </button>

        <button 
          class="nav-item" 
          :class="{ active: currentTab === 'browse' }"
          @click="currentTab = 'browse'">
          <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <span class="nav-label">Buscar</span>
        </button>

        <button 
          class="nav-item" 
          :class="{ active: currentTab === 'account' }"
          @click="currentTab = 'account'">
          <svg class="nav-icon" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span class="nav-label">Conta</span>
        </button>
      </nav>
    </div>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="showToast" class="toast">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
        <span>{{ toastMessage }}</span>
      </div>
    </Transition>
  </div>
</template>

<script>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { supabase } from '@/services/supabase';

export default {
  name: 'CardapioDigital',
  
  setup() {
    const route = useRoute();
    const tableId = ref(route.params.id || '1');
    
    // Autenticação
    const isAuthenticated = ref(false);
    const user = ref({
      name: '',
      email: '',
      photoURL: '',
      uid: ''
    });
    const showUserMenu = ref(false);
    
    // Estados
    const products = ref([]);
    const cart = ref([]);
    const currentTab = ref('home');
    const searchQuery = ref('');
    const showToast = ref(false);
    const toastMessage = ref('');
    const isLoading = ref(true);

    // Dados mockados
    const loadMockData = () => {
      console.log('Carregando dados mockados...');
      products.value = [
        {
          id: 1,
          nome: 'Espetinho de Carne',
          descricao: 'Carne bovina temperada e grelhada na hora',
          preco: 8.00,
          categoria: 'espetinho',
          estoque_atual: 50,
          estoque_minimo: 10,
          disponivel: true,
          ativo: true,
          imagem_url: null
        },
        {
          id: 2,
          nome: 'Espetinho de Frango',
          descricao: 'Frango suculento com temperos especiais',
          preco: 7.00,
          categoria: 'espetinho',
          estoque_atual: 45,
          estoque_minimo: 10,
          disponivel: true,
          ativo: true,
          imagem_url: null
        },
        {
          id: 3,
          nome: 'Espetinho de Linguiça',
          descricao: 'Linguiça artesanal defumada',
          preco: 9.00,
          categoria: 'espetinho',
          estoque_atual: 4,
          estoque_minimo: 10,
          disponivel: true,
          ativo: true,
          imagem_url: null
        },
        {
          id: 4,
          nome: 'Espetinho de Coração',
          descricao: 'Coração de frango bem temperado',
          preco: 6.50,
          categoria: 'espetinho',
          estoque_atual: 30,
          estoque_minimo: 10,
          disponivel: true,
          ativo: true,
          imagem_url: null
        },
        {
          id: 5,
          nome: 'Coca-Cola Lata',
          descricao: 'Refrigerante 350ml gelado',
          preco: 5.00,
          categoria: 'bebida',
          estoque_atual: 30,
          estoque_minimo: 10,
          disponivel: true,
          ativo: true,
          imagem_url: null
        },
        {
          id: 6,
          nome: 'Guaraná Antarctica',
          descricao: 'Refrigerante 350ml gelado',
          preco: 5.00,
          categoria: 'bebida',
          estoque_atual: 25,
          estoque_minimo: 10,
          disponivel: true,
          ativo: true,
          imagem_url: null
        },
        {
          id: 7,
          nome: 'Água Mineral',
          descricao: 'Água mineral 500ml',
          preco: 3.00,
          categoria: 'bebida',
          estoque_atual: 40,
          estoque_minimo: 10,
          disponivel: true,
          ativo: true,
          imagem_url: null
        },
        {
          id: 8,
          nome: 'Cerveja Heineken',
          descricao: 'Long neck 330ml',
          preco: 8.00,
          categoria: 'bebida',
          estoque_atual: 20,
          estoque_minimo: 10,
          disponivel: true,
          ativo: true,
          imagem_url: null
        },
        {
          id: 9,
          nome: 'Batata Frita',
          descricao: 'Porção de batata frita crocante',
          preco: 12.00,
          categoria: 'acompanhamento',
          estoque_atual: 20,
          estoque_minimo: 5,
          disponivel: true,
          ativo: true,
          imagem_url: null
        },
        {
          id: 10,
          nome: 'Mandioca Frita',
          descricao: 'Porção de mandioca crocante',
          preco: 10.00,
          categoria: 'acompanhamento',
          estoque_atual: 15,
          estoque_minimo: 5,
          disponivel: true,
          ativo: true,
          imagem_url: null
        },
        {
          id: 11,
          nome: 'Farofa',
          descricao: 'Farofa caseira temperada',
          preco: 8.00,
          categoria: 'acompanhamento',
          estoque_atual: 18,
          estoque_minimo: 5,
          disponivel: true,
          ativo: true,
          imagem_url: null
        },
        {
          id: 12,
          nome: 'Vinagrete',
          descricao: 'Molho vinagrete caseiro',
          preco: 5.00,
          categoria: 'acompanhamento',
          estoque_atual: 25,
          estoque_minimo: 5,
          disponivel: true,
          ativo: true,
          imagem_url: null
        }
      ];
      isLoading.value = false;
      console.log('Produtos carregados:', products.value.length);
    };

    // Carregar produtos do Supabase
    const loadData = async () => {
      try {
        console.log('Tentando carregar do Supabase...');
        isLoading.value = true;
        
        const { data, error } = await supabase
          .from('pwa_produtos')
          .select('*')
          .eq('ativo', true)
          .order('categoria')
          .order('nome');

        if (error) {
          console.error('Erro no Supabase:', error);
          throw error;
        }

        if (data && data.length > 0) {
          products.value = data;
          console.log('Produtos do Supabase:', products.value.length);
        } else {
          console.log('Nenhum produto no Supabase, usando dados mockados');
          loadMockData();
          return;
        }
        
        isLoading.value = false;
      } catch (error) {
        console.error('Erro ao carregar produtos:', error);
        loadMockData();
      }
    };

    // Computed
    const filteredEspetinhos = computed(() => {
      const result = products.value.filter(p => 
        p.categoria?.toLowerCase().includes('espetinho') &&
        (!searchQuery.value || 
         p.nome.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
         p.descricao?.toLowerCase().includes(searchQuery.value.toLowerCase()))
      );
      return result;
    });
    
    const filteredBebidas = computed(() => {
      const result = products.value.filter(p => 
        p.categoria?.toLowerCase().includes('bebida') &&
        (!searchQuery.value || 
         p.nome.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
         p.descricao?.toLowerCase().includes(searchQuery.value.toLowerCase()))
      );
      return result;
    });
    
    const filteredAcompanhamentos = computed(() => {
      const result = products.value.filter(p => 
        p.categoria?.toLowerCase().includes('acompanhamento') &&
        (!searchQuery.value || 
         p.nome.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
         p.descricao?.toLowerCase().includes(searchQuery.value.toLowerCase()))
      );
      return result;
    });

    const allFilteredProducts = computed(() => 
      products.value.filter(p => 
        p.nome.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        p.descricao?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
        p.categoria?.toLowerCase().includes(searchQuery.value.toLowerCase())
      )
    );

    const cartItemCount = computed(() => 
      cart.value.reduce((sum, item) => sum + item.quantity, 0)
    );

    const totalPrice = computed(() => 
      cart.value.reduce((sum, item) => sum + (item.preco * item.quantity), 0)
    );

    const userInitial = computed(() => 
      user.value.name ? user.value.name.charAt(0).toUpperCase() : 'U'
    );

    // Funções
    const formatPrice = (value) => {
      const num = parseFloat(value || 0);
      return num.toFixed(2).replace('.', ',');
    };

    const loginWithGoogle = async () => {
      console.log('Iniciando login...');
      setTimeout(() => {
        user.value = {
          name: 'João Silva',
          email: 'joao.silva@gmail.com',
          photoURL: 'https://i.pravatar.cc/150?img=12',
          uid: 'mock-uid-123'
        };
        isAuthenticated.value = true;
        
        sendUserDataToBackend(user.value);
        loadData();
        
        showToastMessage('Login realizado com sucesso!');
      }, 1000);
    };

    const sendUserDataToBackend = async (userData) => {
      console.log('Enviando dados do cliente:', {
        mesa_id: tableId.value,
        nome: userData.name,
        email: userData.email,
        foto: userData.photoURL,
        uid: userData.uid,
        data_acesso: new Date().toISOString()
      });
    };

    const logout = () => {
      user.value = { name: '', email: '', photoURL: '', uid: '' };
      isAuthenticated.value = false;
      cart.value = [];
      showUserMenu.value = false;
      showToastMessage('Você saiu da conta');
    };

    const toggleUserMenu = () => {
      showUserMenu.value = !showUserMenu.value;
    };

    const addToCart = (product) => {
      if (product.estoque_atual <= 0) return;

      const existingItem = cart.value.find(item => item.id === product.id);
      
      if (existingItem) {
        existingItem.quantity++;
      } else {
        cart.value.push({ ...product, quantity: 1 });
      }

      showToastMessage(`${product.nome} adicionado!`);
    };

    const increaseQuantity = (index) => {
      cart.value[index].quantity++;
    };

    const decreaseQuantity = (index) => {
      if (cart.value[index].quantity > 1) {
        cart.value[index].quantity--;
      } else {
        removeFromCart(index);
      }
    };

    const removeFromCart = (index) => {
      cart.value.splice(index, 1);
      showToastMessage('Item removido');
    };

    const viewProduct = (product) => {
      console.log('Ver produto:', product);
    };

    const confirmOrder = () => {
      if (cart.value.length === 0) return;

      const orderData = {
        mesa_id: tableId.value,
        cliente: {
          nome: user.value.name,
          email: user.value.email,
          uid: user.value.uid
        },
        itens: cart.value.map(item => ({
          produto_id: item.id,
          nome: item.nome,
          quantidade: item.quantity,
          preco_unitario: item.preco
        })),
        total: totalPrice.value,
        data_pedido: new Date().toISOString()
      };

      console.log('Pedido confirmado:', orderData);

      cart.value = [];
      currentTab.value = 'home';
      showToastMessage('Pedido enviado com sucesso!');
    };

    const showToastMessage = (message) => {
      toastMessage.value = message;
      showToast.value = true;
      setTimeout(() => {
        showToast.value = false;
      }, 3000);
    };

    onMounted(() => {
      console.log('Componente montado, carregando dados...');
      loadData();
    });

    return {
      tableId,
      isAuthenticated,
      user,
      showUserMenu,
      products,
      cart,
      currentTab,
      searchQuery,
      showToast,
      toastMessage,
      isLoading,
      filteredEspetinhos,
      filteredBebidas,
      filteredAcompanhamentos,
      allFilteredProducts,
      cartItemCount,
      totalPrice,
      userInitial,
      formatPrice,
      loginWithGoogle,
      logout,
      toggleUserMenu,
      addToCart,
      increaseQuantity,
      decreaseQuantity,
      removeFromCart,
      viewProduct,
      confirmOrder
    };
  }
};
</script>

<style scoped>
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

.app-wrapper {
  min-height: 100vh;
  background: #ffffff;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
}

.login-screen {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 2rem;
}

.login-container {
  max-width: 400px;
  width: 100%;
}

.login-logo {
  text-align: center;
  margin-bottom: 2rem;
}

.logo-circle {
  width: 80px;
  height: 80px;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 1rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
}

.logo-title {
  color: white;
  font-size: 2rem;
  font-weight: 800;
  margin-bottom: 0.5rem;
}

.logo-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1.1rem;
}

.login-card {
  background: white;
  border-radius: 20px;
  padding: 2rem;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.login-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.login-text {
  color: #666;
  margin-bottom: 2rem;
  line-height: 1.5;
}

.btn-google {
  width: 100%;
  background: white;
  border: 2px solid #e0e0e0;
  padding: 1rem;
  border-radius: 12px;
  font-size: 1rem;
  font-weight: 700;
  color: #1a1a1a;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  transition: all 0.3s ease;
}

.btn-google:hover {
  border-color: #4285F4;
  box-shadow: 0 4px 12px rgba(66, 133, 244, 0.2);
  transform: translateY(-2px);
}

.btn-google:active {
  transform: translateY(0);
}

.login-benefits {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.login-benefits p {
  color: #666;
  font-size: 0.9rem;
  margin: 0.5rem 0;
}

.header {
  background: white;
  border-bottom: 1px solid #e0e0e0;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-inner {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.table-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f5f5f5;
  padding: 0.5rem 1rem;
  border-radius: 50px;
}

.table-icon {
  font-size: 1.2rem;
}

.table-text {
  font-weight: 700;
  color: #1a1a1a;
  font-size: 0.95rem;
}

.user-badge {
  cursor: pointer;
  position: relative;
}

.user-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #e0e0e0;
}

.user-avatar-default {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.1rem;
  border: 2px solid #e0e0e0;
}

.user-dropdown {
  position: absolute;
  top: 70px;
  right: 1rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  padding: 1rem;
  min-width: 250px;
  z-index: 200;
}

.dropdown-header {
  display: flex;
  gap: 1rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 1rem;
}

.dropdown-avatar {
  width: 50px;
  height: 50px;
  border-radius: 50%;
  object-fit: cover;
}

.dropdown-info {
  flex: 1;
}

.dropdown-name {
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
}

.dropdown-email {
  font-size: 0.85rem;
  color: #666;
}

.dropdown-logout {
  width: 100%;
  background: #f5f5f5;
  border: none;
  padding: 0.75rem;
  border-radius: 8px;
  font-weight: 600;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.dropdown-logout:hover {
  background: #fee2e2;
}

.content {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1rem 100px 1rem;
}

.page-title {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
}

.search-box {
  margin-bottom: 1.5rem;
  position: relative;
}

.search-icon {
  position: absolute;
  left: 1rem;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
}

.search-input {
  width: 100%;
  padding: 1rem 1rem 1rem 3rem;
  border: 2px solid #e0e0e0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
}

.search-input:focus {
  outline: none;
  border-color: #667eea;
}

.search-box-large {
  margin-bottom: 2rem;
  position: relative;
}

.search-input-large {
  width: 100%;
  padding: 1.2rem 1.2rem 1.2rem 3.5rem;
  border: 2px solid #e0e0e0;
  border-radius: 15px;
  font-size: 1.1rem;
  transition: all 0.2s;
}

.search-input-large:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
}

.section {
  margin-bottom: 2.5rem;
}

.section-title {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

.section-subtitle {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 1rem;
}

.products-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.product-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  transition: all 0.3s ease;
  cursor: pointer;
}

.product-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.product-image-wrapper {
  position: relative;
  width: 100%;
  height: 240px; /* Altura fixa mais alta */
  background: #f5f5f5;
  overflow: hidden;
  border-radius: 12px 12px 0 0;
}

.product-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  object-position: center;
}

.product-img-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%);
}

.placeholder-icon {
  font-size: 4rem;
}

.badge-limited {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: #f59e0b;
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.badge-sold {
  position: absolute;
  top: 0.75rem;
  right: 0.75rem;
  background: #ef4444;
  color: white;
  padding: 0.375rem 0.75rem;
  border-radius: 50px;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
}

.product-details {
  padding: 1rem;
}

.product-title {
  font-size: 1.1rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
  line-height: 1.3;
}

.product-description {
  font-size: 0.9rem;
  color: #666;
  line-height: 1.4;
  margin-bottom: 1rem;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.product-price {
  font-size: 1.5rem;
  font-weight: 800;
  color: #10b981;
}

.btn-add {
  width: 40px;
  height: 40px;
  background: #10b981;
  border: none;
  border-radius: 50%;
  color: white;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.btn-add:hover {
  background: #059669;
  transform: scale(1.1);
}

.btn-add:active {
  transform: scale(0.95);
}

.btn-add:disabled {
  background: #e0e0e0;
  cursor: not-allowed;
}

.empty-cart {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.empty-cart h3 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.empty-cart p {
  color: #666;
  margin-bottom: 2rem;
}

.btn-back-menu {
  background: #667eea;
  color: white;
  border: none;
  padding: 1rem 2rem;
  border-radius: 50px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-back-menu:hover {
  background: #5568d3;
  transform: translateY(-2px);
}

.cart-content {
  max-width: 600px;
  margin: 0 auto;
}

.cart-items {
  margin-bottom: 2rem;
}

.cart-item {
  background: white;
  border-radius: 12px;
  padding: 1rem;
  margin-bottom: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.cart-item-image {
  width: 70px;
  height: 70px;
  border-radius: 8px;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  flex-shrink: 0;
}

.cart-item-image img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-placeholder {
  font-size: 2rem;
}

.cart-item-info {
  flex: 1;
}

.cart-item-name {
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.25rem;
}

.cart-item-price {
  color: #666;
  font-size: 0.9rem;
}

.cart-item-actions {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.5rem;
}

.quantity-control {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background: #f5f5f5;
  border-radius: 50px;
  padding: 0.25rem;
}

.qty-btn {
  width: 30px;
  height: 30px;
  background: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.qty-btn:active {
  transform: scale(0.9);
}

.qty-number {
  min-width: 2rem;
  text-align: center;
  font-weight: 700;
}

.btn-remove {
  width: 36px;
  height: 36px;
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-remove:hover {
  background: #fecaca;
}

.cart-summary {
  background: white;
  border-radius: 12px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.summary-row {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  color: #666;
  font-size: 1rem;
}

.summary-total {
  border-top: 2px solid #e0e0e0;
  padding-top: 1rem;
  margin-top: 0.5rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a1a1a;
}

.btn-confirm {
  width: 100%;
  background: #10b981;
  color: white;
  border: none;
  padding: 1.25rem;
  border-radius: 12px;
  font-weight: 800;
  font-size: 1.1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.3s;
}

.btn-confirm:hover {
  background: #059669;
  transform: translateY(-2px);
}

.btn-confirm:active {
  transform: translateY(0);
}

.search-results {
  margin-top: 2rem;
}

.results-count {
  color: #666;
  margin-bottom: 1rem;
  font-weight: 600;
}

.no-results,
.search-placeholder {
  text-align: center;
  padding: 4rem 2rem;
}

.no-results-icon,
.search-placeholder-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
}

.no-results h3,
.search-placeholder h3 {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.no-results p,
.search-placeholder p {
  color: #666;
}

.account-card {
  max-width: 600px;
  margin: 0 auto;
  background: white;
  border-radius: 16px;
  padding: 2rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
}

.account-header {
  display: flex;
  gap: 1.5rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e0e0e0;
  margin-bottom: 2rem;
}

.account-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e0e0e0;
}

.account-avatar-default {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 2rem;
  border: 3px solid #e0e0e0;
}

.account-info {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.account-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.account-email {
  color: #666;
  font-size: 1rem;
}

.account-section {
  margin-bottom: 2rem;
}

.info-item {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #f5f5f5;
}

.info-label {
  color: #666;
  font-weight: 600;
}

.info-value {
  color: #1a1a1a;
  font-weight: 700;
}

.status-active {
  color: #10b981;
}

.btn-logout-full {
  width: 100%;
  background: #fee2e2;
  color: #ef4444;
  border: none;
  padding: 1rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.btn-logout-full:hover {
  background: #fecaca;
}

.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: white;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-around;
  padding: 0.5rem 0;
  z-index: 100;
}

.nav-item {
  flex: 1;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: #999;
  transition: all 0.2s;
}

.nav-item.active {
  color: #667eea;
}

.nav-icon-wrapper {
  position: relative;
}

.nav-icon {
  transition: all 0.2s;
}

.nav-item.active .nav-icon {
  stroke: #667eea;
}

.cart-badge {
  position: absolute;
  top: -8px;
  right: -8px;
  background: #ef4444;
  color: white;
  font-size: 0.7rem;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
}

.nav-label {
  font-size: 0.75rem;
  font-weight: 600;
}

.toast {
  position: fixed;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  background: #10b981;
  color: white;
  padding: 1rem 1.5rem;
  border-radius: 50px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 700;
  box-shadow: 0 8px 24px rgba(16, 185, 129, 0.3);
  z-index: 1000;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.toast-enter-active {
  animation: toastIn 0.3s ease;
}

.toast-leave-active {
  animation: toastOut 0.3s ease;
}

@keyframes toastIn {
  from {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
  to {
    transform: translate(-50%, 0);
    opacity: 1;
  }
}

@keyframes toastOut {
  from {
    transform: translate(-50%, 0);
    opacity: 1;
  }
  to {
    transform: translate(-50%, 20px);
    opacity: 0;
  }
}

@media (max-width: 768px) {
  .products-grid {
    grid-template-columns: 1fr;
  }

  .content {
    padding: 1rem 1rem 100px 1rem;
  }

  .page-title {
    font-size: 1.5rem;
  }
}

@media (min-width: 769px) {
  .products-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  }
}
</style>
