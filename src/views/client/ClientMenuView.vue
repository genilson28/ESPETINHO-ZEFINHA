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
    <div v-else class="app-main-modern">
      <!-- HEADER MODERNO -->
      <header class="modern-header">
        <div class="header-user">
          <img v-if="user.photoURL" :src="user.photoURL" :alt="user.name" class="user-photo">
          <div v-else class="user-photo-default">{{ userInitial }}</div>
        </div>
        <button class="btn-notifications">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        </button>
      </header>

      <!-- CONTEÚDO PRINCIPAL -->
      <div class="modern-content">
        <div v-show="currentTab === 'home'" class="tab-home-modern">
          <!-- Título Principal -->
          <div class="main-title-section">
            <h1 class="main-title">Escolha</h1>
            <h1 class="main-title">Sua Comida Favorita</h1>
          </div>

          <!-- Busca com Filtro -->
          <div class="search-filter-container">
            <div class="search-box-modern">
              <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
              <input 
                v-model="searchQuery" 
                type="text" 
                placeholder="Buscar" 
                class="search-input-modern"
              >
            </div>
            <button class="btn-filter">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5">
                <line x1="4" y1="21" x2="4" y2="14"/>
                <line x1="4" y1="10" x2="4" y2="3"/>
                <line x1="12" y1="21" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12" y2="3"/>
                <line x1="20" y1="21" x2="20" y2="16"/>
                <line x1="20" y1="12" x2="20" y2="3"/>
                <line x1="1" y1="14" x2="7" y2="14"/>
                <line x1="9" y1="8" x2="15" y2="8"/>
                <line x1="17" y1="16" x2="23" y2="16"/>
              </svg>
            </button>
          </div>

          <!-- Categorias Horizontais -->
          <div class="categories-scroll">
            <button 
              v-for="cat in categories" 
              :key="cat.id"
              @click="selectedCategory = cat.id"
              class="category-chip"
              :class="{ 'active': selectedCategory === cat.id }">
              {{ cat.name }}
            </button>
          </div>

          <!-- Produtos Populares -->
          <section class="section-modern">
            <div class="section-header">
              <h2 class="section-title-modern">Mais Pedidos</h2>
              <button class="btn-see-all" @click="currentTab = 'browse'">Ver Todos</button>
            </div>
            
            <div class="products-scroll">
              <div 
                v-for="product in filteredPopularProducts" 
                :key="product.id" 
                class="product-card-modern"
                @click="viewProduct(product)">
                <button class="btn-favorite" @click.stop="toggleFavorite(product.id)">
                  <svg width="20" height="20" viewBox="0 0 24 24" :fill="isFavorite(product.id) ? '#EF4444' : 'none'" stroke="#EF4444" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                <div class="product-image-modern">
                  <img 
                    v-if="product.imagem_url" 
                    :src="product.imagem_url" 
                    :alt="product.nome"
                  >
                  <div v-else class="product-placeholder-modern">
                    {{ product.categoria?.includes('espetinho') ? '🍢' : product.categoria?.includes('bebida') ? '🥤' : '🍟' }}
                  </div>
                </div>
                <div class="product-info-modern">
                  <h3 class="product-name-modern">{{ product.nome }}</h3>
                  <p class="product-subtitle-modern">{{ product.descricao }}</p>
                  <div class="product-footer-modern">
                    <span class="product-price-modern">Rs. {{ formatPrice(product.preco) }}</span>
                    <button 
                      class="btn-add-modern" 
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

          <!-- Produtos Mais Próximos / Em Destaque -->
          <section class="section-modern">
            <div class="section-header">
              <h2 class="section-title-modern">Disponíveis Agora</h2>
              <button class="btn-see-all" @click="currentTab = 'browse'">Ver Todos</button>
            </div>
            
            <div class="products-scroll">
              <div 
                v-for="product in filteredNearProducts" 
                :key="product.id" 
                class="product-card-modern"
                @click="viewProduct(product)">
                <button class="btn-favorite" @click.stop="toggleFavorite(product.id)">
                  <svg width="20" height="20" viewBox="0 0 24 24" :fill="isFavorite(product.id) ? '#EF4444' : 'none'" stroke="#EF4444" stroke-width="2">
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                </button>
                <div class="product-image-modern">
                  <img 
                    v-if="product.imagem_url" 
                    :src="product.imagem_url" 
                    :alt="product.nome"
                  >
                  <div v-else class="product-placeholder-modern">
                    {{ product.categoria?.includes('espetinho') ? '🍢' : product.categoria?.includes('bebida') ? '🥤' : '🍟' }}
                  </div>
                </div>
                <div class="product-info-modern">
                  <h3 class="product-name-modern">{{ product.nome }}</h3>
                  <p class="product-subtitle-modern">{{ product.descricao }}</p>
                  <div class="product-footer-modern">
                    <span class="product-price-modern">Rs. {{ formatPrice(product.preco) }}</span>
                    <button 
                      class="btn-add-modern" 
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

        <!-- TAB: FAVORITOS -->
        <div v-show="currentTab === 'favorites'" class="tab-favorites">
          <h1 class="page-title-modern">Meus Favoritos</h1>
          
          <div v-if="favoriteProducts.length === 0" class="empty-state">
            <div class="empty-icon-modern">❤️</div>
            <h3>Nenhum favorito ainda</h3>
            <p>Adicione produtos aos favoritos para vê-los aqui</p>
          </div>

          <div v-else class="products-grid-modern">
            <div 
              v-for="product in favoriteProducts" 
              :key="product.id" 
              class="product-card-modern"
              @click="viewProduct(product)">
              <button class="btn-favorite" @click.stop="toggleFavorite(product.id)">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="#EF4444" stroke="#EF4444" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
              <div class="product-image-modern">
                <img 
                  v-if="product.imagem_url" 
                  :src="product.imagem_url" 
                  :alt="product.nome"
                >
                <div v-else class="product-placeholder-modern">
                  {{ product.categoria?.includes('espetinho') ? '🍢' : product.categoria?.includes('bebida') ? '🥤' : '🍟' }}
                </div>
              </div>
              <div class="product-info-modern">
                <h3 class="product-name-modern">{{ product.nome }}</h3>
                <p class="product-subtitle-modern">{{ product.descricao }}</p>
                <div class="product-footer-modern">
                  <span class="product-price-modern">Rs. {{ formatPrice(product.preco) }}</span>
                  <button 
                    class="btn-add-modern" 
                    @click.stop="addToCart(product)">
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

        <!-- TAB: CARRINHO -->
        <div v-show="currentTab === 'cart'" class="tab-cart-modern">
          <h1 class="page-title-modern">Seu Pedido</h1>
          
          <div v-if="cart.length === 0" class="empty-state">
            <div class="empty-icon-modern">🛒</div>
            <h3>Seu carrinho está vazio</h3>
            <p>Adicione itens do cardápio para começar</p>
            <button @click="currentTab = 'home'" class="btn-back-modern">Ver Cardápio</button>
          </div>

          <div v-else class="cart-content-modern">
            <div class="cart-items-modern">
              <div v-for="(item, index) in cart" :key="index" class="cart-item-modern">
                <div class="cart-item-image-modern">
                  <img v-if="item.imagem_url" :src="item.imagem_url" :alt="item.nome">
                  <div v-else class="cart-placeholder-modern">
                    {{ item.categoria?.includes('espetinho') ? '🍢' : item.categoria?.includes('bebida') ? '🥤' : '🍟' }}
                  </div>
                </div>
                <div class="cart-item-details">
                  <h4 class="cart-item-name-modern">{{ item.nome }}</h4>
                  <p class="cart-item-price-modern">R$ {{ formatPrice(item.preco) }}</p>
                  <div class="quantity-control-modern">
                    <button @click="decreaseQuantity(index)" class="qty-btn-modern">-</button>
                    <span class="qty-number-modern">{{ item.quantity }}</span>
                    <button @click="increaseQuantity(index)" class="qty-btn-modern">+</button>
                  </div>
                </div>
                <button @click="removeFromCart(index)" class="btn-remove-modern">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>

            <div class="cart-summary-modern">
              <div class="summary-row-modern">
                <span>Subtotal</span>
                <span>R$ {{ formatPrice(totalPrice) }}</span>
              </div>
              <div class="summary-row-modern summary-total-modern">
                <span>Total</span>
                <span>R$ {{ formatPrice(totalPrice) }}</span>
              </div>
            </div>

            <button @click="confirmOrder" class="btn-confirm-modern">
              Confirmar Pedido
            </button>
          </div>
        </div>

        <!-- TAB: BUSCAR -->
        <div v-show="currentTab === 'browse'" class="tab-browse-modern">
          <h1 class="page-title-modern">Todos os Produtos</h1>
          
          <div class="search-box-modern" style="margin-bottom: 1.5rem;">
            <svg class="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#999" stroke-width="2">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
            <input 
              v-model="searchQuery" 
              type="text" 
              placeholder="Buscar produtos..." 
              class="search-input-modern"
            >
          </div>

          <div v-if="allFilteredProducts.length > 0" class="products-grid-modern">
            <div 
              v-for="product in allFilteredProducts" 
              :key="product.id" 
              class="product-card-modern"
              @click="viewProduct(product)">
              <button class="btn-favorite" @click.stop="toggleFavorite(product.id)">
                <svg width="20" height="20" viewBox="0 0 24 24" :fill="isFavorite(product.id) ? '#EF4444' : 'none'" stroke="#EF4444" stroke-width="2">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
              </button>
              <div class="product-image-modern">
                <img 
                  v-if="product.imagem_url" 
                  :src="product.imagem_url" 
                  :alt="product.nome"
                >
                <div v-else class="product-placeholder-modern">
                  {{ product.categoria?.includes('espetinho') ? '🍢' : product.categoria?.includes('bebida') ? '🥤' : '🍟' }}
                </div>
              </div>
              <div class="product-info-modern">
                <h3 class="product-name-modern">{{ product.nome }}</h3>
                <p class="product-subtitle-modern">{{ product.descricao }}</p>
                <div class="product-footer-modern">
                  <span class="product-price-modern">Rs. {{ formatPrice(product.preco) }}</span>
                  <button 
                    class="btn-add-modern" 
                    @click.stop="addToCart(product)">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
                      <line x1="12" y1="5" x2="12" y2="19"/>
                      <line x1="5" y1="12" x2="19" y2="12"/>
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div v-else class="empty-state">
            <div class="empty-icon-modern">🔍</div>
            <h3>Nenhum produto encontrado</h3>
            <p>Tente buscar por outro termo</p>
          </div>
        </div>

        <!-- TAB: PERFIL -->
        <div v-show="currentTab === 'profile'" class="tab-profile-modern">
          <h1 class="page-title-modern">Minha Conta</h1>
          
          <div class="profile-card">
            <img v-if="user.photoURL" :src="user.photoURL" :alt="user.name" class="profile-avatar">
            <div v-else class="profile-avatar-default">{{ userInitial }}</div>
            <h2 class="profile-name">{{ user.name }}</h2>
            <p class="profile-email">{{ user.email }}</p>
            
            <div class="profile-info">
              <div class="info-row">
                <span>Mesa</span>
                <span class="info-value">Mesa {{ tableId }}</span>
              </div>
              <div class="info-row">
                <span>Status</span>
                <span class="info-value status-active">Ativo</span>
              </div>
            </div>

            <button @click="logout" class="btn-logout-modern">
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

      <!-- BOTTOM NAVIGATION MODERNA -->
      <nav class="bottom-nav-modern">
        <button 
          class="nav-item-modern" 
          :class="{ 'active': currentTab === 'home' }"
          @click="currentTab = 'home'">
          <svg width="24" height="24" viewBox="0 0 24 24" :fill="currentTab === 'home' ? 'white' : 'none'" :stroke="currentTab === 'home' ? 'white' : '#999'" stroke-width="2">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
          </svg>
          <span>Home</span>
        </button>

        <button 
          class="nav-item-modern" 
          :class="{ 'active': currentTab === 'favorites' }"
          @click="currentTab = 'favorites'">
          <svg width="24" height="24" viewBox="0 0 24 24" :fill="currentTab === 'favorites' ? 'white' : 'none'" :stroke="currentTab === 'favorites' ? 'white' : '#999'" stroke-width="2">
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
          <span>Favoritos</span>
        </button>

        <button 
          class="nav-item-modern" 
          :class="{ 'active': currentTab === 'cart' }"
          @click="currentTab = 'cart'">
          <div class="nav-icon-wrapper-modern">
            <svg width="24" height="24" viewBox="0 0 24 24" :fill="currentTab === 'cart' ? 'white' : 'none'" :stroke="currentTab === 'cart' ? 'white' : '#999'" stroke-width="2">
              <circle cx="9" cy="21" r="1"/>
              <circle cx="20" cy="21" r="1"/>
              <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
            </svg>
            <span v-if="cartItemCount > 0" class="cart-badge-modern">{{ cartItemCount }}</span>
          </div>
          <span>Carrinho</span>
        </button>

        <button 
          class="nav-item-modern" 
          :class="{ 'active': currentTab === 'profile' }"
          @click="currentTab = 'profile'">
          <svg width="24" height="24" viewBox="0 0 24 24" :fill="currentTab === 'profile' ? 'white' : 'none'" :stroke="currentTab === 'profile' ? 'white' : '#999'" stroke-width="2">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
            <circle cx="12" cy="7" r="4"/>
          </svg>
          <span>Perfil</span>
        </button>
      </nav>
    </div>

    <!-- Toast Notification -->
    <Transition name="toast">
      <div v-if="showToast" class="toast-modern">
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
// ✨ NOVO: Import do Firebase para login com Google REAL
import { auth, googleProvider, signInWithPopup } from '@/services/firebase';

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
    
    // Estados
    const products = ref([]);
    const cart = ref([]);
    const favorites = ref([]);
    const currentTab = ref('home');
    const selectedCategory = ref('all');
    const searchQuery = ref('');
    const showToast = ref(false);
    const toastMessage = ref('');
    const isLoading = ref(true);

    // Categorias
    const categories = ref([
      { id: 'all', name: 'Todos' },
      { id: 'espetinho', name: 'Espetinhos' },
      { id: 'bebida', name: 'Bebidas' },
      { id: 'acompanhamento', name: 'Acompanhamentos' }
    ]);

    // Dados mockados
    const loadMockData = () => {
      console.log('Carregando dados mockados...');
      products.value = [
        {
          id: 1,
          nome: 'Espetinho de Carne',
          descricao: 'Carne bovina temperada',
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
          descricao: 'Frango suculento',
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
          descricao: 'Linguiça artesanal',
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
          descricao: 'Coração de frango',
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
          descricao: 'Refrigerante 350ml',
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
          descricao: 'Refrigerante 350ml',
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
          descricao: 'Porção de batata frita',
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
          descricao: 'Porção de mandioca',
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
          descricao: 'Farofa caseira',
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
          descricao: 'Molho vinagrete',
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
    const filteredProductsByCategory = computed(() => {
      if (selectedCategory.value === 'all') {
        return products.value;
      }
      return products.value.filter(p => 
        p.categoria?.toLowerCase().includes(selectedCategory.value.toLowerCase())
      );
    });

    const filteredPopularProducts = computed(() => {
      let filtered = filteredProductsByCategory.value;
      
      if (searchQuery.value) {
        filtered = filtered.filter(p => 
          p.nome.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          p.descricao?.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
      }
      
      return filtered.slice(0, 6);
    });

    const filteredNearProducts = computed(() => {
      let filtered = filteredProductsByCategory.value;
      
      if (searchQuery.value) {
        filtered = filtered.filter(p => 
          p.nome.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          p.descricao?.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
      }
      
      return filtered.filter(p => p.estoque_atual > 0).slice(0, 6);
    });

    const allFilteredProducts = computed(() => {
      let filtered = products.value;
      
      if (searchQuery.value) {
        filtered = filtered.filter(p => 
          p.nome.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          p.descricao?.toLowerCase().includes(searchQuery.value.toLowerCase()) ||
          p.categoria?.toLowerCase().includes(searchQuery.value.toLowerCase())
        );
      }
      
      return filtered;
    });

    const favoriteProducts = computed(() => 
      products.value.filter(p => favorites.value.includes(p.id))
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

    // ========================================
    // 🔥 LOGIN COM GOOGLE - REAL (Firebase)
    // ========================================
    const loginWithGoogle = async () => {
      console.log('🔐 Iniciando login com Google...');
      
      try {
        // Abre popup do Google para login
        const result = await signInWithPopup(auth, googleProvider);
        
        // Dados do usuário autenticado
        const googleUser = result.user;
        
        console.log('✅ Login realizado com sucesso!');
        console.log('👤 Usuário:', googleUser.displayName);
        console.log('📧 Email:', googleUser.email);
        
        // Salva os dados do usuário
        user.value = {
          name: googleUser.displayName || 'Usuário',
          email: googleUser.email,
          photoURL: googleUser.photoURL,
          uid: googleUser.uid
        };
        
        isAuthenticated.value = true;
        
        // Carrega os produtos
        loadData();
        
        // Mostra mensagem de sucesso
        showToastMessage(`Bem-vindo, ${user.value.name}!`);
        
      } catch (error) {
        console.error('❌ Erro no login:', error);
        
        // Tratamento de erros
        let errorMessage = 'Erro ao fazer login';
        
        if (error.code === 'auth/popup-closed-by-user') {
          errorMessage = 'Login cancelado';
        } else if (error.code === 'auth/popup-blocked') {
          errorMessage = 'Popup bloqueado pelo navegador. Permita popups para fazer login.';
        } else if (error.code === 'auth/cancelled-popup-request') {
          errorMessage = 'Outro popup de login já está aberto';
        } else if (error.code === 'auth/network-request-failed') {
          errorMessage = 'Sem conexão com a internet';
        }
        
        showToastMessage(errorMessage);
      }
    };

    // ========================================
    // 🚪 LOGOUT - REAL (Firebase)
    // ========================================
    const logout = async () => {
      try {
        console.log('👋 Fazendo logout...');
        
        // Desloga do Firebase
        await auth.signOut();
        
        // Limpa os dados locais
        user.value = { name: '', email: '', photoURL: '', uid: '' };
        isAuthenticated.value = false;
        cart.value = [];
        favorites.value = [];
        
        showToastMessage('Você saiu da conta');
        console.log('✅ Logout realizado com sucesso');
        
      } catch (error) {
        console.error('❌ Erro no logout:', error);
        
        // Mesmo com erro, limpa tudo localmente
        user.value = { name: '', email: '', photoURL: '', uid: '' };
        isAuthenticated.value = false;
        cart.value = [];
        favorites.value = [];
        
        showToastMessage('Sessão encerrada');
      }
    };

    const toggleFavorite = (productId) => {
      const index = favorites.value.indexOf(productId);
      if (index > -1) {
        favorites.value.splice(index, 1);
        showToastMessage('Removido dos favoritos');
      } else {
        favorites.value.push(productId);
        showToastMessage('Adicionado aos favoritos');
      }
    };

    const isFavorite = (productId) => {
      return favorites.value.includes(productId);
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

    // ========================================
    // 🔄 VERIFICAR SESSÃO AO CARREGAR
    // ========================================
    onMounted(() => {
      console.log('📱 Componente montado');
      
      // Verifica se já existe sessão ativa no Firebase
      auth.onAuthStateChanged((firebaseUser) => {
        if (firebaseUser) {
          console.log('✅ Sessão ativa encontrada:', firebaseUser.displayName);
          
          // Restaura os dados do usuário
          user.value = {
            name: firebaseUser.displayName || 'Usuário',
            email: firebaseUser.email,
            photoURL: firebaseUser.photoURL,
            uid: firebaseUser.uid
          };
          
          isAuthenticated.value = true;
          
          // Carrega os produtos
          loadData();
        } else {
          console.log('⚠️ Nenhuma sessão ativa - mostrando tela de login');
          isAuthenticated.value = false;
        }
      });
    });

    return {
      tableId,
      isAuthenticated,
      user,
      products,
      cart,
      favorites,
      currentTab,
      selectedCategory,
      searchQuery,
      showToast,
      toastMessage,
      categories,
      filteredPopularProducts,
      filteredNearProducts,
      allFilteredProducts,
      favoriteProducts,
      cartItemCount,
      totalPrice,
      userInitial,
      formatPrice,
      loginWithGoogle,
      logout,
      toggleFavorite,
      isFavorite,
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
  width: 100%;
  max-width: 100%;
  background: #f8f9fa;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  overflow-x: hidden;
}

/* Reset de margens e padding do body */
body {
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

/* ===== LOGIN SCREEN ===== */
.login-screen {
  min-height: 100vh;
  background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-container {
  width: 100%;
  max-width: 400px;
}

.login-logo {
  text-align: center;
  margin-bottom: 3rem;
}

.logo-circle {
  width: 80px;
  height: 80px;
  background: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 2.5rem;
  margin: 0 auto 1rem;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
}

.logo-title {
  font-size: 2rem;
  font-weight: 800;
  color: white;
  margin-bottom: 0.5rem;
}

.logo-subtitle {
  color: rgba(255, 255, 255, 0.9);
  font-size: 1rem;
}

.login-card {
  background: white;
  border-radius: 24px;
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
}

.btn-google {
  width: 100%;
  background: white;
  border: 2px solid #e0e0e0;
  padding: 1rem;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-google:hover {
  border-color: #E74C3C;
  background: #fff5f5;
}

.login-benefits {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.login-benefits p {
  color: #666;
  margin: 0.5rem 0;
  font-size: 0.9rem;
}

/* ===== APP PRINCIPAL MODERNO ===== */
.app-main-modern {
  min-height: 100vh;
  width: 100%;
  max-width: 100%;
  background: #f8f9fa;
  padding-bottom: 80px;
}

.modern-header {
  background: white;
  padding: 1rem 1.5rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.header-user {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.user-photo,
.user-photo-default {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  object-fit: cover;
}

.user-photo-default {
  background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 1.25rem;
}

.btn-notifications {
  width: 48px;
  height: 48px;
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-notifications:hover {
  background: #f8f9fa;
  border-color: #E74C3C;
}

/* ===== CONTEÚDO MODERNO ===== */
.modern-content {
  padding: 1.5rem;
}

.main-title-section {
  margin-bottom: 1.5rem;
}

.main-title {
  font-size: 1.875rem;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.2;
  margin: 0;
}

/* ===== BUSCA COM FILTRO ===== */
.search-filter-container {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.search-box-modern {
  flex: 1;
  position: relative;
  display: flex;
  align-items: center;
}

.search-icon {
  position: absolute;
  left: 1rem;
  pointer-events: none;
}

.search-input-modern {
  width: 100%;
  padding: 0.875rem 1rem 0.875rem 3rem;
  border: 2px solid #f0f0f0;
  border-radius: 12px;
  font-size: 1rem;
  transition: all 0.2s;
  background: white;
}

.search-input-modern:focus {
  outline: none;
  border-color: #E74C3C;
}

.btn-filter {
  width: 52px;
  height: 52px;
  background: #E74C3C;
  border: none;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-filter:hover {
  background: #C0392B;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

/* ===== CATEGORIAS HORIZONTAIS ===== */
.categories-scroll {
  display: flex;
  gap: 0.75rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  margin-bottom: 1.5rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.categories-scroll::-webkit-scrollbar {
  display: none;
}

.category-chip {
  padding: 0.75rem 1.5rem;
  background: white;
  border: 2px solid #f0f0f0;
  border-radius: 24px;
  font-weight: 700;
  font-size: 0.95rem;
  color: #666;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
  flex-shrink: 0;
}

.category-chip:hover {
  border-color: #E74C3C;
  color: #E74C3C;
}

.category-chip.active {
  background: #E74C3C;
  border-color: #E74C3C;
  color: white;
}

/* ===== SEÇÕES MODERNAS ===== */
.section-modern {
  margin-bottom: 2rem;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.section-title-modern {
  font-size: 1.375rem;
  font-weight: 800;
  color: #1a1a1a;
}

.btn-see-all {
  background: none;
  border: none;
  color: #E74C3C;
  font-weight: 700;
  font-size: 0.95rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-see-all:hover {
  transform: translateX(4px);
}

/* ===== CARROSSEL DE PRODUTOS ===== */
.products-scroll {
  display: flex;
  gap: 1rem;
  overflow-x: auto;
  padding-bottom: 1rem;
  scrollbar-width: none;
  -ms-overflow-style: none;
}

.products-scroll::-webkit-scrollbar {
  display: none;
}

.product-card-modern {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  min-width: 170px;
  max-width: 170px;
  cursor: pointer;
  transition: all 0.2s;
  position: relative;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  flex-shrink: 0;
}

.product-card-modern:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.btn-favorite {
  position: absolute;
  top: 0.75rem;
  left: 0.75rem;
  width: 36px;
  height: 36px;
  background: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: all 0.2s;
}

.btn-favorite:hover {
  transform: scale(1.1);
}

.product-image-modern {
  width: 100%;
  height: 130px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 0.75rem;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
}

.product-image-modern img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-placeholder-modern {
  font-size: 3rem;
}

.product-info-modern {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.product-name-modern {
  font-size: 1rem;
  font-weight: 800;
  color: #1a1a1a;
  line-height: 1.3;
}

.product-subtitle-modern {
  font-size: 0.8rem;
  color: #999;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.product-footer-modern {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 0.5rem;
}

.product-price-modern {
  font-size: 1.125rem;
  font-weight: 800;
  color: #E74C3C;
}

.btn-add-modern {
  width: 32px;
  height: 32px;
  background: #E74C3C;
  border: none;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  color: white;
  flex-shrink: 0;
}

.btn-add-modern:hover:not(:disabled) {
  background: #C0392B;
  transform: scale(1.05);
}

.btn-add-modern:disabled {
  background: #ccc;
  cursor: not-allowed;
}

/* ===== GRID DE PRODUTOS (para browse e favoritos) ===== */
.products-grid-modern {
  display: grid;
  grid-template-columns: repeat(2, 1fr); /* 2 colunas fixas */
  gap: 1rem;
  padding: 0;
}

/* Cards dentro do grid devem ocupar 100% da coluna */
.products-grid-modern .product-card-modern {
  min-width: 100%;
  max-width: 100%;
  width: 100%;
}

/* ===== CARRINHO MODERNO ===== */
.tab-cart-modern,
.tab-browse-modern,
.tab-profile-modern,
.tab-favorites {
  padding: 0;
}

.page-title-modern {
  font-size: 1.75rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 1.5rem;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
}

.empty-icon-modern {
  font-size: 4rem;
  margin-bottom: 1rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.empty-state p {
  color: #999;
  margin-bottom: 2rem;
}

.btn-back-modern {
  background: #E74C3C;
  color: white;
  border: none;
  padding: 0.875rem 2rem;
  border-radius: 12px;
  font-weight: 700;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-back-modern:hover {
  background: #C0392B;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.cart-content-modern {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.cart-items-modern {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.cart-item-modern {
  background: white;
  border-radius: 16px;
  padding: 1rem;
  display: flex;
  gap: 1rem;
  align-items: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.cart-item-image-modern {
  width: 80px;
  height: 80px;
  border-radius: 12px;
  overflow: hidden;
  background: #f8f9fa;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.cart-item-image-modern img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.cart-placeholder-modern {
  font-size: 2rem;
}

.cart-item-details {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.cart-item-name-modern {
  font-size: 1.125rem;
  font-weight: 800;
  color: #1a1a1a;
}

.cart-item-price-modern {
  font-size: 1rem;
  font-weight: 700;
  color: #E74C3C;
}

.quantity-control-modern {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-top: 0.5rem;
}

.qty-btn-modern {
  width: 32px;
  height: 32px;
  background: #f8f9fa;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  font-weight: 800;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.2s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.qty-btn-modern:hover {
  background: #E74C3C;
  border-color: #E74C3C;
  color: white;
}

.qty-number-modern {
  font-weight: 700;
  font-size: 1rem;
  min-width: 24px;
  text-align: center;
}

.btn-remove-modern {
  width: 40px;
  height: 40px;
  background: #fee2e2;
  border: none;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #ef4444;
  transition: all 0.2s;
  flex-shrink: 0;
}

.btn-remove-modern:hover {
  background: #fecaca;
  transform: scale(1.05);
}

.cart-summary-modern {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.summary-row-modern {
  display: flex;
  justify-content: space-between;
  padding: 0.75rem 0;
  color: #666;
  font-weight: 600;
}

.summary-total-modern {
  border-top: 2px solid #f0f0f0;
  margin-top: 0.5rem;
  padding-top: 1rem;
  font-size: 1.25rem;
  font-weight: 800;
  color: #1a1a1a;
}

.btn-confirm-modern {
  width: 100%;
  background: #E74C3C;
  color: white;
  border: none;
  padding: 1.125rem;
  border-radius: 12px;
  font-weight: 800;
  font-size: 1.125rem;
  cursor: pointer;
  transition: all 0.2s;
  box-shadow: 0 4px 12px rgba(231, 76, 60, 0.3);
}

.btn-confirm-modern:hover {
  background: #C0392B;
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(231, 76, 60, 0.4);
}

/* ===== PERFIL MODERNO ===== */
.profile-card {
  background: white;
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.profile-avatar,
.profile-avatar-default {
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 1rem;
  border: 4px solid #f0f0f0;
}

.profile-avatar-default {
  background: linear-gradient(135deg, #E74C3C 0%, #C0392B 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 2.5rem;
}

.profile-name {
  font-size: 1.5rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
}

.profile-email {
  color: #999;
  margin-bottom: 2rem;
}

.profile-info {
  margin-bottom: 2rem;
}

.info-row {
  display: flex;
  justify-content: space-between;
  padding: 1rem 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-value {
  font-weight: 700;
  color: #1a1a1a;
}

.status-active {
  color: #10b981;
}

.btn-logout-modern {
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

.btn-logout-modern:hover {
  background: #fecaca;
}

/* ===== BOTTOM NAV MODERNA ===== */
.bottom-nav-modern {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: #E74C3C;
  display: flex;
  justify-content: space-around;
  padding: 0.75rem 0;
  z-index: 100;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.1);
}

.nav-item-modern {
  flex: 1;
  background: none;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  color: rgba(255, 255, 255, 0.6);
  transition: all 0.2s;
  font-size: 0.75rem;
  font-weight: 600;
}

.nav-item-modern.active {
  color: white;
}

.nav-icon-wrapper-modern {
  position: relative;
}

.cart-badge-modern {
  position: absolute;
  top: -8px;
  right: -8px;
  background: white;
  color: #E74C3C;
  font-size: 0.7rem;
  font-weight: 800;
  min-width: 18px;
  height: 18px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ===== TOAST MODERNO ===== */
.toast-modern {
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

/* ===== RESPONSIVE ===== */
@media (max-width: 768px) {
  .main-title {
    font-size: 1.5rem;
  }
  
  .section-title-modern {
    font-size: 1.125rem;
  }
  
  .modern-content {
    padding: 1rem;
  }
}

@media (min-width: 769px) {
  .app-main-modern {
    max-width: 100%;
    margin: 0;
  }
}
</style>
