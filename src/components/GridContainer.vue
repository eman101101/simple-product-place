<template>
    <div class="grid-wrapper">
      <!-- Side Controls Left -->
      <div class="side-controls-left">
        <button @click="addColumnLeft">+</button>
        <button :disabled="!canRemoveColumnLeft" @click="removeColumnLeft">-</button>
      </div>
  
      <div>
        <!-- Top Row Controls -->
        <div class="header-controls">
          <button @click="goToHome">About</button>
  
          <button @click="downloadJson">Save</button>
          <button @click="$refs.fileInput.click()">Load</button>
          <input
            v-model="searchQuery"
            class="search-input"
            placeholder="Search item / UPC"
            @keyup.enter="performSearch"
          />
          <button @click="performSearch">⌕</button>
        </div>
  
        <div class="top-row-controls">
          <button @click="addRowTop">+</button>
          <button :disabled="!canRemoveRowTop" @click="removeRowTop">-</button>
        </div>
  
        <div @pointerdown="onGridMouseDown">
          <div class="grid-viewport">
            <div
              class="grid-container-wrapper"
              :style="wrapperTransform"
              @pointerdown="onMouseDown"
              @pointermove.prevent="onMouseMove"
              @pointerup="onMouseUp"
            >
              <div class="grid-container" :style="gridStyle">
                <div
                  v-for="(row, rowIndex) in grid"
                  :key="'row-' + rowIndex"
                  class="grid-row"
                >
                  <div
                    v-for="(cell, colIndex) in row"
                    :key="'cell-' + rowIndex + '-' + colIndex"
                    class="grid-cell"
                    :class="{
                      highlighted:
                        highlightedCube &&
                        highlightedCube.row === rowIndex &&
                        highlightedCube.col === colIndex,
                    }"
                    @dragover.prevent
                    @drop="handleDrop($event, rowIndex, colIndex)"
                  >
                    <div
                      v-if="cell !== null"
                      class="cube"
                      :class="cell.class.toLowerCase()"
                      draggable="true"
                      @dragstart="dragStart($event, rowIndex, colIndex)"
                      @touchstart="dragStart($event, rowIndex, colIndex)"
                      @click="openCubeModal(cell, rowIndex, colIndex)"
                      title="Click to edit cube"
                    >
                      {{ cell.label }}
                      <!-- Entry arrow -->
                      <div
                        v-if="cell.class === 'Custom'"
                        :class="'arrow arrow-' + cell.direction"
                      ></div>
                      <!-- Grocery item count -->
                      <div v-else-if="cell.class === 'Grocery'">
                        <span class="item-count">{{ cell.items.length }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="center-buttons">
            <button @click="centerGrid">Center Grid</button>
            <button
              @pointerdown="startZoomIn"
              @pointerup="stopZoom"
              @pointerleave="stopZoom"
            >
              Zoom In
            </button>
            <button
              @pointerdown="startZoomOut"
              @pointerup="stopZoom"
              @pointerleave="stopZoom"
            >
              Zoom Out
            </button>
          </div>
        </div>
  
        <div class="bottom-row-controls">
          <button @click="addRowBottom">+</button>
          <button :disabled="!canRemoveRowBottom" @click="removeRowBottom">-</button>
        </div>
  
        <!-- Cubes below the grid area -->
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
          <!-- Trash Icon -->
          <div
            class="trash"
            @dragover.prevent
            @touchend="handleDropToTrash($event)"
            @drop="handleDropToTrash($event)"
          >
            <span class="trash-text">Trash🗑️</span>
          </div>
        </div>
      </div>
  
      <!-- Right Column Controls -->
      <div class="side-controls-right">
        <button @click="addColumnRight">+</button>
        <button :disabled="!canRemoveColumnRight" @click="removeColumnRight">-</button>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
  import { useRouter } from 'vue-router'
  
  const router = useRouter()
  function goToHome() {
    router.push('/home')
  }
  
  const gridRows = ref(4)
  const gridCols = ref(4)
  function createGrid(r, c) {
    return Array.from({ length: r }, () => Array.from({ length: c }, () => null))
  }
  const grid = ref(createGrid(gridRows.value, gridCols.value))
  
  const searchQuery = ref('')
  function performSearch() {
    // Stub for the real search; logic is in SearchModal
    console.log('Performing search in grid container', searchQuery.value)
  }
  
  const highlightedCube = ref(null)
  
  // Theming
  const theme = ref('light')
  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
  }
  
  // Dragging and zoom
  const dragging = ref(false)
  const isCubeDragging = ref(false)
  const translateX = ref(0)
  const translateY = ref(0)
  const lastMouseX = ref(0)
  const lastMouseY = ref(0)
  
  function onMouseDown(e) {
    if (isCubeDragging.value) return
    dragging.value = true
    lastMouseX.value = e.clientX
    lastMouseY.value = e.clientY
  }
  function onMouseMove(e) {
    if (!dragging.value || isCubeDragging.value) return
    translateX.value += e.clientX - lastMouseX.value
    translateY.value += e.clientY.value
    lastMouseX.value = e.clientX
    lastMouseY.value = e.clientY
  }
  function onMouseUp() {
    dragging.value = false
  }
  onBeforeUnmount(() => {
    document.removeEventListener('pointermove', onMouseMove)
    document.removeEventListener('pointerup', onMouseUp)
  })
  
  function onGridMouseDown(e) {
    if (e.target.classList.contains('grid-container-wrapper')) {
      if (e.target.classList.contains('cube')) return
      dragging.value = true
      lastMouseX.value = e.clientX
      lastMouseY.value = e.clientY
      document.addEventListener('pointermove', onGridMouseMove)
      document.addEventListener('pointerup', onGridMouseUp)
    }
  }
  function onGridMouseMove(e) {
    if (!dragging.value || isCubeDragging.value) return
    translateX.value += e.clientX - lastMouseX.value
    translateY.value += e.clientY - lastMouseY.value
    lastMouseX.value = e.clientX
    lastMouseY.value = e.clientY
  }
  function onGridMouseUp() {
    dragging.value = false
    document.removeEventListener('pointermove', onGridMouseMove)
    document.removeEventListener('pointerup', onGridMouseUp)
  }
  
  const zoomFactor = ref(1)
  function startZoomIn() {
    stopZoom()
    zoomInterval = setInterval(() => {
      if (zoomFactor.value < MAX_ZOOM) {
        zoomFactor.value += ZOOM_SPEED
      }
    }, 50)
  }
  function startZoomOut() {
    stopZoom()
    zoomInterval = setInterval(() => {
      if (zoomFactor.value > MIN_ZOOM) {
        zoomFactor.value = Math.max(MIN_ZOOM, zoomFactor.value - ZOOM_SPEED)
      }
    }, 50)
  }
  function stopZoom() {
    if (zoomInterval) {
      clearInterval(zoomInterval)
      zoomInterval = null
    }
  }
  let zoomInterval = null
  const ZOOM_SPEED = 0.1
  const MIN_ZOOM = 0.2
  const MAX_ZOOM = 3
  
  function centerGrid() {
    const viewport = document.querySelector('.grid-viewport')
    if (!viewport) return
    const gridWrapper = viewport.querySelector('.grid-container-wrapper')
    if (!gridWrapper) return
  
    zoomFactor.value = 1
    setTimeout(() => {
      const viewportRect = viewport.getBoundingClientRect()
      const gridRect = gridWrapper.getBoundingClientRect()
  
      const centerX = (viewportRect.width - gridRect.width) / 2
      const centerY = (viewportRect.height - gridRect.height) / 2
  
      translateX.value = centerX
      translateY.value = centerY
  
      setTimeout(() => {
        const updatedViewportRect = viewport.getBoundingClientRect()
        const updatedGridRect = gridWrapper.getBoundingClientRect()
  
        const finalCenterX = (updatedViewportRect.width - updatedGridRect.width) / 2
        const finalCenterY = (updatedViewportRect.height - updatedGridRect.height) / 2
  
        translateX.value = finalCenterX
        translateY.value = finalCenterY
      }, 200)
    }, 200)
    dragging.value = false
    isCubeDragging.value = false
  }
  
  onMounted(() => {
    setTimeout(() => {
      centerGrid()
    }, 100)
  })
  
  const wrapperTransform = computed(() => ({
    transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${zoomFactor.value})`,
    cursor: dragging.value ? 'grabbing' : 'grab',
    transition: dragging.value ? 'none' : 'transform 0.3s ease',
    'transition-property': 'transform',
    'will-change': 'transform',
  }))
  
  // Add/Remove rows & columns
  const canRemoveRowTop = computed(() => gridRows.value > 1 && !hasCubeInRow(0))
  const canRemoveRowBottom = computed(
    () => gridRows.value > 1 && !hasCubeInRow(gridRows.value - 1),
  )
  const canRemoveColumnLeft = computed(() => gridCols.value > 1 && !hasCubeInCol(0))
  const canRemoveColumnRight = computed(
    () => gridCols.value > 1 && !hasCubeInCol(gridCols.value - 1),
  )
  
  function hasCubeInRow(rowIndex) {
    return grid.value[rowIndex].some((cell) => cell !== null)
  }
  function hasCubeInCol(colIndex) {
    return grid.value.some((row) => row[colIndex] !== null)
  }
  
  function addRowTop() {
    grid.value.unshift(Array.from({ length: gridCols.value }, () => null))
    gridRows.value++
  }
  function addRowBottom() {
    grid.value.push(Array.from({ length: gridCols.value }, () => null))
    gridRows.value++
  }
  function removeRowTop() {
    if (canRemoveRowTop.value) {
      grid.value.shift()
      gridRows.value--
    }
  }
  function removeRowBottom() {
    if (canRemoveRowBottom.value) {
      grid.value.pop()
      gridRows.value--
    }
  }
  function addColumnLeft() {
    grid.value.forEach((row) => row.unshift(null))
    gridCols.value++
  }
  function addColumnRight() {
    grid.value.forEach((row) => row.push(null))
    gridCols.value++
  }
  function removeColumnLeft() {
    if (canRemoveColumnLeft.value) {
      grid.value.forEach((row) => row.shift())
      gridCols.value--
    }
  }
  function removeColumnRight() {
    if (canRemoveColumnRight.value) {
      grid.value.forEach((row) => row.pop())
      gridCols.value--
    }
  }
  
  // Cubes & dragging
  const cubeTypes = [
    { type: 'Grocery', label: 'Grocery', class: 'Grocery', description: '...' },
    { type: 'Entry', label: 'Entry', class: 'Entry', description: '...' },
    { type: 'Custom', label: 'Custom', class: 'Custom', description: '...' },
    { type: 'Wall', label: 'Wall 🧱', class: 'Wall', description: '...' },
    { type: 'Wall', label: 'Window 🪟', class: 'Wall', description: '...' },
  ]
  const selectedCubeType = ref(null)
  const isPlacementMode = ref(false)
  
  function handleCubeTap(cubeType) {
    selectedCubeType.value = cubeType
    isPlacementMode.value = true
  }
  
  let uniqueId = 1
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
  
  function dragStartFromPool(e, cubeType) {
    const newCube = createCubeInstance(cubeType)
    if (!newCube) return
    e.dataTransfer.setData('cube', JSON.stringify(newCube))
    e.dataTransfer.setData('fromPool', 'true')
  }
  
  function dragStart(e, row, col) {
    const cube = grid.value[row][col]
    if (!cube) return
    isCubeDragging.value = true
    e.dataTransfer.setData('cube', JSON.stringify(cube))
    e.dataTransfer.setData('fromRow', row)
    e.dataTransfer.setData('fromCol', col)
  }
  
  function handleDrop(e, row, col) {
    isCubeDragging.value = false
    const cubeData = JSON.parse(e.dataTransfer.getData('cube') || '{}')
    const fromRow = parseInt(e.dataTransfer.getData('fromRow') || '', 10)
    const fromCol = parseInt(e.dataTransfer.getData('fromCol') || '', 10)
    const fromPool = e.dataTransfer.getData('fromPool') === 'true'
  
    if (grid.value[row][col] !== null) {
      showOccupiedPopup.value = true
      dragging.value = false
      isCubeDragging.value = false
      return
    }
    if (!fromPool && !isNaN(fromRow) && !isNaN(fromCol)) {
      grid.value[fromRow][fromCol] = null
    }
    grid.value[row][col] = cubeData
    dragging.value = false
    isCubeDragging.value = false
  }
  
  function onDragEnd() {
    isCubeDragging.value = false
  }
  
  const appMessage = ref('')
  const showOccupiedPopup = ref(false)
  
  function handleDropToTrash(e) {
    const data = e.dataTransfer.getData('cube') || '{}'
    const cubeData = JSON.parse(data)
    const fromRow = parseInt(e.dataTransfer.getData('fromRow'), 10)
    const fromCol = parseInt(e.dataTransfer.getData('fromCol'), 10)
    if (isNaN(fromRow) || isNaN(fromCol)) return
    cubeToDelete.value = cubeData
    deleteRow.value = fromRow
    deleteCol.value = fromCol
    dragging.value = false
    isCubeDragging.value = false
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
  }
  function cancelDelete() {
    cubeToDelete.value = null
    deleteRow.value = null
    deleteCol.value = null
  }
  
  const deletedCubeMsg = ref('')
  
  const showModal = ref(false)
  const selectedCube = ref(null)
  const selectedPosition = reactive({ row: null, col: null })
  
  function openCubeModal(cube, row, col) {
    selectedCube.value = cube
    selectedPosition.row = row
    selectedPosition.col = col
    showModal.value = true
  }
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
      if (newVal && selectedPosition.row !== null && selectedPosition.col !== null) {
        grid.value[selectedPosition.row][selectedPosition.col] = { ...newVal }
      }
    },
    { deep: true },
  )
  
  function downloadJson() {
    const data = {
      rows: gridRows.value,
      cols: gridCols.value,
      gridData: grid.value,
    }
    const dataStr = JSON.stringify(data, null, 2)
    const blob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'gridData.json'
    link.click()
    URL.revokeObjectURL(url)
  }
  
  function onFileChange(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        if (!parsed.rows || !parsed.cols || !parsed.gridData) {
          appMessage.value = 'Invalid grid data file.'
          return
        }
        gridRows.value = parsed.rows
        gridCols.value = parsed.cols
        grid.value = parsed.gridData
        appMessage.value = 'Grid imported successfully.'
      } catch {
        appMessage.value = 'Error parsing JSON file.'
      }
    }
    reader.readAsText(file)
  }
  
  const gridStyle = computed(() => ({
    gridTemplateRows: `repeat(${gridRows.value}, 100px)`,
    gridTemplateColumns: `repeat(${gridCols.value}, 100px)`,
    position: 'relative',
    width: '100%',
    transformOrigin: '0 0',
    transform: `scale(${zoomFactor.value})`,
    transition: 'transform 0.3s ease',
  }))
  
  watch(
    [gridRows, gridCols],
    ([rows, cols]) => {
      console.group('Grid Dimensions')
      console.log(`Rows: ${rows}`)
      console.log(`Columns: ${cols}`)
      console.log(`Total Cells: ${rows * cols}`)
      console.groupEnd()
    },
    { immediate: true },
  )
  </script>
  