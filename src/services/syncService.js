// src/services/syncService.js
import { supabase } from './supabase'

class SyncService {
  constructor() {
    this.pendingOperations = this.loadPendingOperations()
    this.isOnline = navigator.onLine
    this.setupListeners()
  }

  setupListeners() {
    // Detecta quando fica online
    window.addEventListener('online', () => {
      console.log('✅ Conexão restaurada! Sincronizando...')
      this.isOnline = true
      this.syncPendingOperations()
    })

    // Detecta quando fica offline
    window.addEventListener('offline', () => {
      console.log('⚠️ Sem conexão! Operações serão salvas localmente.')
      this.isOnline = false
    })
  }

  // Salva operação pendente no localStorage
  addPendingOperation(operation) {
    this.pendingOperations.push({
      id: Date.now(),
      ...operation,
      timestamp: new Date().toISOString()
    })
    this.savePendingOperations()
    console.log('💾 Operação salva para sincronização:', operation)
  }

  // Carrega operações pendentes do localStorage
  loadPendingOperations() {
    try {
      const stored = localStorage.getItem('pendingOperations')
      return stored ? JSON.parse(stored) : []
    } catch (error) {
      console.error('Erro ao carregar operações pendentes:', error)
      return []
    }
  }

  // Salva operações pendentes no localStorage
  savePendingOperations() {
    try {
      localStorage.setItem('pendingOperations', JSON.stringify(this.pendingOperations))
    } catch (error) {
      console.error('Erro ao salvar operações pendentes:', error)
    }
  }

  // Sincroniza operações pendentes quando ficar online
  async syncPendingOperations() {
    if (!this.isOnline || this.pendingOperations.length === 0) {
      return
    }

    console.log(`🔄 Sincronizando ${this.pendingOperations.length} operações...`)

    const operations = [...this.pendingOperations]
    this.pendingOperations = []
    this.savePendingOperations()

    for (const operation of operations) {
      try {
        await this.executeOperation(operation)
        console.log('✅ Operação sincronizada:', operation)
      } catch (error) {
        console.error('❌ Erro ao sincronizar operação:', error)
        // Se falhar, adiciona de volta na fila
        this.addPendingOperation(operation)
      }
    }

    console.log('✅ Sincronização concluída!')
  }

  // Executa uma operação no Supabase
  async executeOperation(operation) {
    const { type, table, data, id } = operation

    switch (type) {
      case 'INSERT':
        return await supabase.from(table).insert(data)
      
      case 'UPDATE':
        return await supabase.from(table).update(data).eq('id', id)
      
      case 'DELETE':
        return await supabase.from(table).delete().eq('id', id)
      
      default:
        throw new Error(`Tipo de operação desconhecido: ${type}`)
    }
  }

  // Métodos auxiliares para operações offline
  async insert(table, data) {
    if (this.isOnline) {
      return await supabase.from(table).insert(data)
    } else {
      this.addPendingOperation({ type: 'INSERT', table, data })
      return { data, error: null, offline: true }
    }
  }

  async update(table, id, data) {
    if (this.isOnline) {
      return await supabase.from(table).update(data).eq('id', id)
    } else {
      this.addPendingOperation({ type: 'UPDATE', table, id, data })
      return { data, error: null, offline: true }
    }
  }

  async delete(table, id) {
    if (this.isOnline) {
      return await supabase.from(table).delete().eq('id', id)
    } else {
      this.addPendingOperation({ type: 'DELETE', table, id })
      return { error: null, offline: true }
    }
  }

  // Verifica se está online
  checkOnlineStatus() {
    return this.isOnline
  }

  // Retorna número de operações pendentes
  getPendingCount() {
    return this.pendingOperations.length
  }
}

export const syncService = new SyncService()