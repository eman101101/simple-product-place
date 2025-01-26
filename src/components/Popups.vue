<template>
    <div>
      <!-- Invalid Drop Popup -->
      <div v-if="showInvalidDropPopup" class="modal">
        <div class="modal-content">
          <h2>Invalid Drop</h2>
          <p>{{ invalidDropMessage }}</p>
          <button @click="showInvalidDropPopup = false">OK</button>
        </div>
      </div>
  
      <!-- Popup for Deleted Cube -->
      <div
        v-if="deletedCubeMsg"
        class="confirm-overlay"
        @click.self="deletedCubeMsg = ''"
      >
        <div class="deleted-cube-content">
          <h2>{{ deletedCubeMsg }}</h2>
          <button @click="deletedCubeMsg = ''">OK</button>
        </div>
      </div>
  
      <!-- Notifications/Confirmations -->
      <div v-if="appMessage" class="modal">
        {{ appMessage }}
        <button @click="appMessage = ''">OK</button>
      </div>
  
      <!-- Confirm Deletion -->
      <div v-if="cubeToDelete" class="confirm-overlay" @click.self="cancelDelete">
        <div class="confirm-content">
          <h2>Delete {{ cubeToDelete.label }}?</h2>
          <p>This action is permanent. Continue?</p>
          <div class="confirm-buttons">
            <button @click="confirmDelete">Yes</button>
            <button @click="cancelDelete">No</button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const showInvalidDropPopup = ref(false)
  const invalidDropMessage = ref('')
  const deletedCubeMsg = ref('')
  const appMessage = ref('')
  const cubeToDelete = ref(null)
  
  function cancelDelete() {}
  function confirmDelete() {}
  </script>
  