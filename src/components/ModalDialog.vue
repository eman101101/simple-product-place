<template>
    <div v-if="showModal" class="modal" @click.self="closeModal">
      <div class="modal-content">
        <span class="close-button" @click="closeModal">&times;</span>
        <h2>{{ selectedCube.label }} ({{ selectedCube.class }})</h2>
  
        <!-- Grocery: rename + editable items -->
        <div v-if="selectedCube.class === 'Grocery'">
          <h3>Grocery Items: {{ selectedCube.items.length }}</h3>
          <ul class="grocery-list">
            <li
              v-for="(item, idx) in selectedCube.items"
              :key="idx"
              class="grocery-item"
            >
              <button
                @click="removeGroceryItem(idx)"
                class="remove-item"
              >
                X
              </button>
              <div class="item-name">
                <textarea
                  v-model="item.name"
                  placeholder="Item Name"
                  rows="1"
                ></textarea>
              </div>
              <div class="item-details">
                <input v-model="item.upc" placeholder="UPC" />
                <input v-model="item.row" placeholder="Row" />
              </div>
            </li>
          </ul>
          <div class="item-controls">
            <button
              @click="addGroceryItem"
              :disabled="selectedCube.items.length >= 99"
              class="add-item"
            >
              +
            </button>
          </div>
        </div>
  
        <!-- Custom: rename cube + arrows -->
        <div v-else-if="selectedCube.class === 'Custom'">
          <h3>Rename Cube</h3>
          <input
            v-model="selectedCube.label"
            type="text"
            maxlength="20"
            placeholder="Enter new name"
          />
          <h3>Arrow Direction</h3>
          <div class="direction-buttons">
            <button
              v-for="dir in [
                '↑', '↗', '→', '↘',
                '↓', '↙', '←', '↖'
              ]"
              :key="dir"
              :class="{ active: selectedCube.label === dir }"
              @click="selectedCube.label = dir"
            >
              {{ dir }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, watch } from 'vue'
  
  const showModal = ref(false)
  const selectedCube = ref(null)
  const selectedPosition = reactive({ row: null, col: null })
  const grid = ref([])
  
  function closeModal() {
    showModal.value = false
    selectedCube.value = null
    selectedPosition.row = null
    selectedPosition.col = null
  }
  
  function addGroceryItem() {
    if (selectedCube.value.items.length >= 99) return
    selectedCube.value.items.push({ name: '', upc: '', row: '' })
  }
  
  function removeGroceryItem(idx) {
    selectedCube.value.items.splice(idx, 1)
  }
  
  watch(
    selectedCube,
    (newVal) => {
      if (
        newVal &&
        selectedPosition.row !== null &&
        selectedPosition.col !== null
      ) {
        grid.value[selectedPosition.row][selectedPosition.col] = { ...newVal }
      }
    },
    { deep: true },
  )
  </script>
  