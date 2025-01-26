<template>
    <div class="bottom-pool">
      <div
        v-for="cubeType in cubeTypes"
        :key="cubeType.type"
        draggable="true"
        class="available-cube"
        @dragstart="dragStartFromPool($event, cubeType)"
        @touchstart="handleCubeTap($event, cubeType)"
      >
        {{ cubeType.label }}
      </div>
      <div
        class="trash"
        @dragover.prevent
        @touchend="handleDropToTrash($event)"
        @drop="handleDropToTrash($event)"
      >
        <span class="trash-text">Trash🗑️</span>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref } from 'vue'
  
  const cubeTypes = [
    { type: 'Grocery', label: 'Grocery', class: 'Grocery', description: '...' },
    { type: 'Entry', label: 'Entry', class: 'Entry', description: '...' },
    { type: 'Custom', label: 'Custom', class: 'Custom', description: '...' },
    { type: 'Wall', label: 'Wall 🧱', class: 'Wall', description: '...' },
    { type: 'Wall', label: 'Window 🪟', class: 'Wall', description: '...' },
  ]
  
  const dragData = ref({
    isCubeDragging: false,
  })
  
  const appMessage = ref('')
  
  let uniqueId = 1
  const grid = ref([])
  const dragStartFromPool = (e, cubeType) => {
    const newCube = createCubeInstance(cubeType)
    if (!newCube) return
    e.dataTransfer.setData('cube', JSON.stringify(newCube))
    e.dataTransfer.setData('fromPool', 'true')
  }
  
  function handleCubeTap(e, cubeType) {
    // Placeholder for mobile/touch
    console.log('Cube tapped:', cubeType)
  }
  
  function handleDropToTrash(e) {
    const data = e.dataTransfer.getData('cube') || '{}'
    const cubeData = JSON.parse(data)
    const fromRow = parseInt(e.dataTransfer.getData('fromRow'), 10)
    const fromCol = parseInt(e.dataTransfer.getData('fromCol'), 10)
    if (isNaN(fromRow) || isNaN(fromCol)) return
  
    // Show a popup or confirm
    cubeToDelete.value = cubeData
    deleteRow.value = fromRow
    deleteCol.value = fromCol
    dragData.value.isCubeDragging = false
    showDeletePopup.value = true
  }
  
  const showDeletePopup = ref(false)
  const cubeToDelete = ref(null)
  const deleteRow = ref(null)
  const deleteCol = ref(null)
  function confirmDelete() {
    grid.value[deleteRow.value][deleteCol.value] = null
    cubeToDelete.value = null
    deleteRow.value = null
    deleteCol.value = null
    showDeletePopup.value = false
  }
  function cancelDelete() {
    cubeToDelete.value = null
    deleteRow.value = null
    deleteCol.value = null
    showDeletePopup.value = false
  }
  
  function createCubeInstance(cubeType) {
    const newCube = {
      id: uniqueId++,
      label: `${cubeType.label}`,
      class: cubeType.class,
      description: cubeType.description,
    }
    if (cubeType.class === 'Grocery') {
      newCube.items = []
    }
    if (cubeType.type === 'Entry') {
      const hasEntry = grid.value.some((row) => row.some((cell) => cell?.type === 'Entry'))
      if (hasEntry) {
        appMessage.value = 'Only one Entry cube is allowed'
        return null
      }
      return {
        type: 'Entry',
        label: 'Entry',
        class: 'Entry',
      }
    }
    return newCube
  }
  </script>
  