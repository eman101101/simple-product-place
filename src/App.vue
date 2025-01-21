<template>
  <meta name="viewport" />
  <div 
    class="app-container"
    @touchstart.prevent
    @touchmove.prevent
    @touchend.prevent>
  <!-- Invalid Drop Popup -->
<div v-if="showInvalidDropPopup" class="modal">
  <div class="modal-content">
    <h2>Invalid Drop</h2>
    <p>{{ invalidDropMessage }}</p>
    <button @click="showInvalidDropPopup = false">OK</button>
  </div>
</div>


    <!-- Load File -->
  <input
    type="file"
    style="display: none"
    ref="fileInput"
    accept="application/json"
    @change="onFileChange"
  />

  <!-- Popup for Deleted Cube -->
  <div v-if="deletedCubeMsg" class="confirm-overlay" @click.self="deletedCubeMsg = ''">
    <div class="deleted-cube-content">
      <h2>{{ deletedCubeMsg }}</h2>
      <button @click="deletedCubeMsg = ''">OK</button>
    </div>
  </div>

  <!-- Search Results Modal -->
  <div v-if="showSearchModal" class="modal" @click.self="closeSearchModal">
    <div class="modal-content">
      <span class="close-button" @click="closeSearchModal">&times;</span>
      <h2>Search Results</h2>
      <ul v-if="searchResults.length">
        <li v-for="result in searchResults" :key="result.id" @click="selectSearchResult(result)">
          {{ result.name }} (UPC: {{ result.upc }})
        </li>
      </ul>
      <p v-else>No results found.</p>
    </div>
  </div>

  <!-- Notifications/Confirmations -->
  <div v-if="appMessage" class="modal">
    {{ appMessage }}
    <button @click="appMessage = ''">OK</button>
  </div>

  <!-- Highlighted Grid Modal -->

  <div v-if="highlightedGrid" class="modal">
    <div class="highlighted-grid-wrapper"    >
      <div class="grid-viewport">
        <div class="grid-container" :style="gridStyle">
          <div
            v-for="(row, rowIndex) in highlightedGrid"
            :key="'highlighted-row-' + rowIndex"
            class="grid-row"
          >
            <div
              v-for="(cell, colIndex) in row"
              :key="'highlighted-cell-' + rowIndex + '-' + colIndex"
              class="grid-cell"
              :class="{ highlighted: cell && cell.highlight }"
            >
              <div v-if="cell !== null" class="cube" :class="cell.class.toLowerCase()" @dragend="onDragEnd">
                {{ cell.label }}
                <span v-if="cell.step" class="step-number">{{ cell.step }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div class="path-found">
    Found: {{ searchResults[0]?.name }} on Row {{ searchResults[0]?.row }}
  </div>
      <div v-if="searchPath.length === 0" class="no-path-found">No path found</div>
      <div class="highlighted-grid-buttons">
        <button @pointerdown="startZoomIn" @pointerup="stopZoom" @pointerleave="stopZoom">Zoom In</button>
        <button @pointerdown="startZoomOut" @pointerup="stopZoom" @pointerleave="stopZoom">
          Zoom Out
        </button>

        <button @click="exportHighlightedGrid" class="export-button">Export</button>
        <button @click="closeHighlightedGridModal" class="export-button">Close</button>
      </div>
    </div>
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
  <!-- Grid Wrapper -->
  <div class="grid-wrapper">
    <!-- Side Controls Left -->
    <div class="side-controls-left">
      <button @click="addColumnLeft">+</button>
      <button :disabled="!canRemoveColumnLeft" @click="removeColumnLeft">-</button>
    </div>

    <div>
      <!-- Top Row Controls -->

      <div class="header-controls">
        <button @click="downloadJson">Save</button>
        <button @click="$refs.fileInput.click()">Load</button>
        <input
          v-model="searchQuery"
          class="search-input"
          placeholder="Search item or UPC"
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
            @pointerup="onMouseUp">
            <div class="grid-container" :style="gridStyle">
              <div v-for="(row, rowIndex) in grid" :key="'row-' + rowIndex" class="grid-row">
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
          <button @pointerdown="startZoomIn" @pointerup="stopZoom" @pointerleave="stopZoom">
            Zoom In
          </button>
          <button @pointerdown="startZoomOut" @pointerup="stopZoom" @pointerleave="stopZoom">
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
    >
      {{ cubeType.label }}
    </div>
    <!-- Trash Icon -->
    <div class="trash" @dragover.prevent @drop="handleDropToTrash($event)">
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

  <!-- Modal -->
  <div v-if="showModal" class="modal" @click.self="closeModal">
    <div class="modal-content">
      <span class="close-button" @click="closeModal">&times;</span>
      <h2>{{ selectedCube.label }} ({{ selectedCube.class }})</h2>

      <!-- Grocery: rename + editable items -->
      <div v-if="selectedCube.class === 'Grocery'">
        <h3>Grocery Items: {{ selectedCube.items.length }}</h3>
        <ul class="grocery-list">
          <li v-for="(item, idx) in selectedCube.items" :key="idx" class="grocery-item">
            <button @click="removeGroceryItem(idx)" class="remove-item">X</button>
            <div class="item-name">
              <textarea v-model="item.name" placeholder="Item Name" rows="1"></textarea>
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
          <button @click="openCamera" class="camera-button">Open Camera</button>
        </div>
      </div>

      <!-- Custom: rename cube -->
      <div v-else-if="selectedCube.class === 'Custom'">
        <h3>Rename Cube</h3>
        <input
          v-model="selectedCube.label"
          type="text"
          maxlength="20"
          placeholder="Enter new name"
        />
        <h3>Arrow Direction</h3>
        <div class="direction-selector"></div>
        <button
          v-for="dir in [
            '↑', // N
            '↗', // NE
            '→', // E
            '↘', // SE
            '↓', // S
            '↙', // SW
            '←', // W
            '↖', // NW
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
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'


// Unique ID generator
let uniqueId = 1

// Cube Types
const cubeTypes = [
  { type: 'Grocery', label: 'Grocery', class: 'Grocery', description: '...' },
  { type: 'Entry', label: 'Entry', class: 'Entry', description: '...' },
  { type: 'Custom', label: 'Custom', class: 'Custom', description: '...' },
  { type: 'Wall', label: 'Wall 🧱', class: 'Wall', description: '...' },
  { type: 'Wall', label: 'Window 🪟', class: 'Wall', description: '...' },
]

// Grid state
const gridRows = ref(4)
const gridCols = ref(4)
const grid = ref(createGrid(gridRows.value, gridCols.value))
const searchQuery = ref('')
const showSearchModal = ref(false)
const searchResults = ref([])
const highlightedCube = ref(null)
const appMessage = ref('')
const searchPath = ref([]) // store BFS path as array of [row, col]
const highlightedGrid = ref(null)

// Search function
function performSearch() {
  searchResults.value = []
  const query = searchQuery.value.toLowerCase()

  grid.value.forEach((row, rowIndex) => {
    row.forEach((cube, colIndex) => {
      if (cube && cube.class === 'Grocery') {
        cube.items.forEach((item) => {
          if (item.name.toLowerCase().includes(query) || item.upc.toLowerCase().includes(query)) {
            searchResults.value.push({
              ...item,
              cubePosition: { row: rowIndex, col: colIndex },
            })
          }
        })
      }
    })
  })

  showSearchModal.value = true
}

// Select search result w/ path
function selectSearchResult(result) {
  highlightedCube.value = result.cubePosition
  computePathToCube(result.cubePosition)
  closeSearchModal()

  // Create a copy of the current grid
  const gridCopy = JSON.parse(JSON.stringify(grid.value))

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  searchPath.value.forEach(([row, col], index) => {
    if (!gridCopy[row][col]) {
      gridCopy[row][col] = { class: 'empty', label: '' }
    }
    gridCopy[row][col].highlight = true
  })
  // Set the copied grid to a new reactive variable
  highlightedGrid.value = gridCopy
}

// BFS to find path from Entry to target grocery, skipping other groceries as obstacles
function computePathToCube({ row, col }) {
  searchPath.value = []
  const [entryRow, entryCol] = findEntryCoord()
  if (entryRow === null) {
    return
  }
  const path = findPathIgnoringGroceries([entryRow, entryCol], [row, col])
  searchPath.value = path
}

// BFS ignoring all Grocery cubes except the target
function findPathIgnoringGroceries([sr, sc], [tr, tc]) {
  const queue = [[sr, sc, []]]
  const visited = new Set([`${sr},${sc}`])
  while (queue.length) {
    const [r, c, path] = queue.shift()
    if (r === tr && c === tc) {
      return path.concat([[r, c]])
    }
    for (const [nr, nc] of [
      [r + 1, c],
      [r - 1, c],
      [r, c + 1],
      [r, c - 1],
    ]) {
      if (inBounds(nr, nc) && !visited.has(`${nr},${nc}`)) {
        const cell = grid.value[nr][nc]
        // skip if cell is a Grocery or Wall
        if (
          !cell ||
          (cell.class !== 'Grocery' && cell.class !== 'Wall') ||
          (nr === tr && nc === tc)
        ) {
          visited.add(`${nr},${nc}`)
          queue.push([nr, nc, path.concat([[r, c]])])
        }
      }
    }
  }
  return []
}

function inBounds(r, c) {
  return r >= 0 && c >= 0 && r < gridRows.value && c < gridCols.value
}

// Locate single Entry cell
function findEntryCoord() {
  for (let r = 0; r < grid.value.length; r++) {
    for (let c = 0; c < grid.value[r].length; c++) {
      if (grid.value[r][c]?.type === 'Entry') {
        return [r, c]
      }
    }
  }
  return [null, null]
}

// Close search modal
function closeSearchModal() {
  showSearchModal.value = false
}

// Reset highlighted cube when grid changes
watch(
  grid,
  () => {
    highlightedCube.value = null
  },
  { deep: true },
)

function createGrid(r, c) {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => null))
}
const showDeletePopup = ref(false)
const showOccupiedPopup = ref(false)

// Computed style to avoid single-row
const gridStyle = computed(() => ({
  gridTemplateRows: `repeat(${gridRows.value}, 100px)`,
  gridTemplateColumns: `repeat(${gridCols.value}, 100px)`,
  position: 'relative',
  width: '100%',
  transformOrigin: '0 0',
  transform: `scale(${zoomFactor.value})`,
  transition: 'transform 0.3s ease',
}))

const translateX = ref(0)
const translateY = ref(0)
const dragging = ref(false)
const lastMouseX = ref(0)
const lastMouseY = ref(0)
const isCubeDragging = ref(false)
const isMobile = ref(window.innerWidth <= 768)

// -- Draggable and zoomable logic --
const offsetX = ref(0)
const offsetY = ref(0)
const isDragging = ref(false)

const showInvalidDropPopup = ref(false)
const invalidDropMessage = ref('')


function onGridMouseDown(e) {
  // Only start dragging if clicked on an 'empty space' in the grid wrapper
  // (for example, if e.target matches a class 'grid-container-wrapper')
  if (e.target.classList.contains('grid-container-wrapper')) {
    if (e.target.classList.contains('cube')) return
    isDragging.value = true
    startX = e.clientX - offsetX.value
    startY = e.clientY - offsetY.value
    document.addEventListener('pointermove', onGridMouseMove)
    document.addEventListener('pointerup', onGridMouseUp)
  }
}

function onGridMouseMove(e) {
  if (!draggingGrid.value || isCubeDragging.value) return

  translateX.value += e.clientX - lastMouseX.value
  translateY.value += e.clientY - lastMouseY.value
  lastMouseX.value = e.clientX
  lastMouseY.value = e.clientY
}

function onGridMouseUp() {
  draggingGrid.value = false
}

// A zoom factor for the entire grid
const zoomFactor = ref(1)

function centerGrid() {
  const viewport = document.querySelector('.grid-viewport')
  if (!viewport) return

  const gridWrapper = viewport.querySelector('.grid-container-wrapper')
  if (!gridWrapper) return

  // First pass - reset zoom
  zoomFactor.value = 1

  // Wait for zoom transform to complete
  setTimeout(() => {
    const viewportRect = viewport.getBoundingClientRect()
    const gridRect = gridWrapper.getBoundingClientRect()

    // Calculate center with reset zoom
    const centerX = (viewportRect.width - gridRect.width) / 2
    const centerY = (viewportRect.height - gridRect.height) / 2

    // Update translation with smooth transition
    translateX.value = centerX
    translateY.value = centerY

    // Second pass - fine tune position
    setTimeout(() => {
      const updatedViewportRect = viewport.getBoundingClientRect()
      const updatedGridRect = gridWrapper.getBoundingClientRect()

      // Recalculate center with settled dimensions
      const finalCenterX = (updatedViewportRect.width - updatedGridRect.width) / 2
      const finalCenterY = (updatedViewportRect.height - updatedGridRect.height) / 2

      translateX.value = finalCenterX
      translateY.value = finalCenterY
    }, 200) // After first transform completes
  }, 200) // After zoom resets
  dragging.value = false
  isCubeDragging.value = false
}
watch(isCubeDragging, (val) => {
  console.log(`Cube dragging changed: ${val}`)
})

onMounted(() => {
  // Small delay to ensure DOM is ready
  setTimeout(() => {
    centerGrid()
    console.log('Initial grid centering complete')
  }, 100)
  if (window.PointerEvent) {
    document.documentElement.style.touchAction = 'none'
  }
})

const wrapperTransform = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${zoomFactor.value})`,
  cursor: dragging.value ? 'grabbing' : 'grab',
  transition: dragging.value ? 'none' : 'transform 0.3s ease',
  'transition-property': 'transform',
  'will-change': 'transform',
}))
function onMouseDown(e) {
  if (isCubeDragging.value) return
  dragging.value = true
  lastMouseX.value = e.clientX
  lastMouseY.value = e.clientY
}

function onMouseMove(e) {
  // Only move grid if not dragging a cube
  if (!dragging.value || isCubeDragging.value) return
  translateX.value += e.clientX - lastMouseX.value
  translateY.value += e.clientY - lastMouseY.value
  lastMouseX.value = e.clientX
  lastMouseY.value = e.clientY
}

function checkCubeDrag(event) {
  const target = event.target
  const isCube = target.classList.contains('cube') || 
                 target.closest('.cube') !== null
  
  isCubeDragging.value = isCube
  console.log('Cube drag state:', isCubeDragging.value)
  return isCube
}

function onMouseUp() {
  dragging.value = false
}

onBeforeUnmount(() => {
  document.removeEventListener('pointermove', onMouseMove)
  document.removeEventListener('pointerup', onMouseUp)
})
const showHighlightedGridModal = ref(false)
function closeHighlightedGridModal() {
  highlightedGrid.value = null
  showHighlightedGridModal.value = false
}

// Confirm overlay state (cube to delete)
const cubeToDelete = ref(null)
const deleteRow = ref(null)
const deleteCol = ref(null)

// Show/hide modal
const showModal = ref(false)
const selectedCube = ref(null)
const selectedPosition = reactive({ row: null, col: null })

/*
 * Instead of limiting to > 4, allow removing rows/cols if > 1
 * and the row/col has no cubes.
 */
const canRemoveRowTop = computed(() => gridRows.value > 1 && !hasCubeInRow(0))
const canRemoveRowBottom = computed(() => gridRows.value > 1 && !hasCubeInRow(gridRows.value - 1))
const canRemoveColumnLeft = computed(() => gridCols.value > 1 && !hasCubeInCol(0))
const canRemoveColumnRight = computed(() => gridCols.value > 1 && !hasCubeInCol(gridCols.value - 1))

// Add/Remove rows
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

// Add/Remove columns
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

// Check for cubes in row/col
function hasCubeInRow(rowIndex) {
  return grid.value[rowIndex].some((cell) => cell !== null)
}
function hasCubeInCol(colIndex) {
  return grid.value.some((row) => row[colIndex] !== null)
}

// Drag & Drop
function dragStart(e, row, col) {
  const cube = grid.value[row][col]
  if (!cube) return
  isCubeDragging.value = true
  e.dataTransfer.setData('cube', JSON.stringify(cube))
  e.dataTransfer.setData('fromRow', row)
  e.dataTransfer.setData('fromCol', col)
}
function dragStartFromPool(e, cubeType) {
  const newCube = createCubeInstance(cubeType)
  e.dataTransfer.setData('cube', JSON.stringify(newCube))
  e.dataTransfer.setData('fromPool', 'true')
}

function handleDropCancel() {
  isCubeDragging.value = false
  console.log('Drop cancelled - cube drag reset')
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
    if (rowIndex < 0 || rowIndex >= grid.value.length ||
      colIndex < 0 || colIndex >= grid.value[0].length) {
    invalidDropMessage.value = 'Invalid drop location - outside grid'
    showInvalidDropPopup.value = true
    dragging.value = false
    isCubeDragging.value = false
    return
  }
  }
  if (!fromPool && !isNaN(fromRow) && !isNaN(fromCol)) {
    grid.value[fromRow][fromCol] = null
  }
  grid.value[row][col] = cubeData
  dragging.value = false
  isCubeDragging.value = false
}

function exportHighlightedGrid() {
  if (!highlightedGrid.value) {
    appMessage.value = 'No highlighted grid to export.'
    return
  }

  const gridHTML = `
<style>
  body {
    font-family: Arial, sans-serif;
    background-color: #f0f0f0;
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100vh;
    margin: 0;
  }
  .grid-wrapper {
    background-color: white;
    border-radius: 10px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    padding: 20px;
    max-width: 90vw;
  }
  .grid-container {
    display: grid;
    grid-template-columns: repeat(${gridCols.value}, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
  .grid-cell {
    aspect-ratio: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 5px;
    font-weight: bold;
  }
  .cube {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    font-weight: bold;
    position: relative;
    border-radius: 5px;
    color: white;
  }
  .highlighted {
    box-shadow: 0 0 0 3px #ffd700;
  }
  .step-number {
    position: absolute;
    top: 5px;
    right: 5px;
    background-color: rgba(0, 0, 0, 0.7);
    color: white;
    padding: 2px 5px;
    font-size: 0.8em;
    border-radius: 50%;
  }
  .grocery { background-color: #e67e22; }
  .entry { background-color: #2980b9; }
  .custom { background-color: #9b59b6; }
  .wall { background-color: #7f8c8d; }
  .buttons {
    display: flex;
    justify-content: center;
    gap: 10px;
    margin-top: 20px;
  }
  .button {
    padding: 10px 20px;
    background-color: #3498db;
    color: white;
    border: none;
    border-radius: 5px;
    cursor: pointer;
    font-size: 16px;
    transition: background-color 0.3s;
  }
  .button:hover {
    background-color: #2980b9;
  }
  .no-path {
    text-align: center;
    color: #e74c3c;
    font-size: 18px;
    margin-top: 20px;
  }
</style>
<div class="grid-wrapper">
  <div class="grid-container">
    ${highlightedGrid.value
      .map((row) =>
        row
          .map((cell) =>
            cell
              ? `<div class="grid-cell ${cell.highlight ? 'highlighted' : ''}">
                  <div class="cube ${cell.class.toLowerCase()}">
                    ${cell.label}
                    ${cell.step ? `<span class="step-number">${cell.step}</span>` : ''}
                  </div>
                </div>`
              : '<div class="grid-cell"></div>',
          )
          .join(''),
      )
      .join('')}
  </div>
  ${searchPath.value.length === 0 ? '<div class="no-path">No path found</div>' : ''}
  <div class="buttons">
    <button class="button" onclick="window.print()">Print</button>
  </div>
</div>`
const showDebug = ref(true)

function toggleDebug() {
  debugCollapsed.value = !debugCollapsed.value
}
  const blob = new Blob([gridHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'highlighted_grid.html'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

function checkInvalidDrop(rowIndex, colIndex) {
  if (rowIndex < 0 || rowIndex >= grid.value.length ||
      colIndex < 0 || colIndex >= grid.value[0].length) {
    console.log('Invalid drop location - outside grid')
    dragging.value = false
    isCubeDragging.value = false
    return true
  }
  
  if (grid.value[rowIndex][colIndex] !== null) {
    console.log('Invalid drop location - cell already occupied')
    showOccupiedPopup.value = true
    dragging.value = false
    isCubeDragging.value = false
    return true
  }
  
  return false
}
function onDragEnd() {
  isCubeDragging.value = false
}


// Delete confirm
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

// Confirm or cancel deletion
function confirmDelete() {
  grid.value[deleteRow.value][deleteCol.value] = null
  cubeToDelete.value = null
  // Clear the refs:
  deleteRow.value = null
  deleteCol.value = null
}

const showExportConfirm = ref(false)
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
  showExportConfirm.value = true
  showExportConfirm.value = true
}

const isHighlightedDragging = ref(false)
const highlightedStartX = ref(0)
const highlightedStartY = ref(0)
const highlightedOffsetX = ref(0)
const highlightedOffsetY = ref(0)

const highlightedTransform = computed(() => ({
  transform: `translate(${highlightedOffsetX.value}px, ${highlightedOffsetY.value}px)`,
  cursor: isHighlightedDragging.value ? 'grabbing' : 'grab',
  userSelect: 'none'
}))

function startHighlightedDrag(e) {
  isHighlightedDragging.value = true
  highlightedStartX.value = e.clientX - highlightedOffsetX.value
  highlightedStartY.value = e.clientY - highlightedOffsetY.value
}

function handleHighlightedDrag(e) {
  if (!isHighlightedDragging.value) return
  highlightedOffsetX.value = e.clientX - highlightedStartX.value
  highlightedOffsetY.value = e.clientY - highlightedStartY.value
}

function stopHighlightedDrag() {
  isHighlightedDragging.value = false
}

function cancelDelete() {
  cubeToDelete.value = null
  deleteRow.value = null
  deleteCol.value = null
}
// Cube creation
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
    // Check if Entry cube already exists
    const hasEntry = grid.value.some((row) => row.some((cell) => cell?.type === 'Entry'))
    if (hasEntry) {
      appMessage.value = 'Only one Entry cube is allowed'
      return null
    }
    // Return simplified Entry cube
    return {
      type: 'Entry',
      label: 'Entry',
      class: 'Entry',
    }
  }
  return newCube
}

const deletedCubeMsg = ref('')

// Modal
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

// Grocery items
function addGroceryItem() {
  if (selectedCube.value.items.length >= 99) return
  selectedCube.value.items.push({ name: '', upc: '', row: '' })
}
function removeGroceryItem(idx) {
  selectedCube.value.items.splice(idx, 1)
}

// Watch & update
watch(
  selectedCube,
  (newVal) => {
    if (newVal && selectedPosition.row !== null && selectedPosition.col !== null) {
      grid.value[selectedPosition.row][selectedPosition.col] = { ...newVal }
    }
  },
  { deep: true },
)

// Watch for path information
watch(
  [() => findEntryCoord(), highlightedCube, searchPath],
  ([entry, highlight, path]) => {
    console.group('Grid Path Information')
    console.log('Entry Location:', entry)
    console.log('Search Target:', highlight)
    console.log('Path Steps:', path)
    console.groupEnd()
  },
  { immediate: true, deep: true },
)
let zoomInterval = null
const ZOOM_SPEED = 0.1
const MIN_ZOOM = 0.2
const MAX_ZOOM = 3

function startZoomIn() {
  stopZoom() // Clear any existing interval
  zoomInterval = setInterval(() => {
    if (zoomFactor.value < MAX_ZOOM) {
      zoomFactor.value += ZOOM_SPEED
    }
  }, 50)
}

function startZoomOut() {
  stopZoom() // Clear any existing interval
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
// Watch for grid dimensions
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
// Import from JSON file
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
</script>

<style scoped>

.app-container {
  touch-action: none;
  -webkit-touch-callout: none;
  -webkit-tap-highlight-color: transparent;
  user-select: none;
}

* {
  touch-action: none;
}

.app-message {
  background: #ffc107;
  color: #333;
  padding: 1rem;
  margin: 1rem auto;
  max-width: 400px;
  border-radius: 6px;
  text-align: center;
}
.center-buttons {
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  margin: 0 auto;
}

.center-buttons button {
  min-width: 30px;
  padding: 0.5rem 1rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.2s ease;
}

.center-buttons button:hover {
  background: #1976d2;
}
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  animation: fadeIn 0.3s ease-out forwards;
  justify-content: center;
  align-items: center;
  z-index: 999;
}
.confirm-content {
  background: #fff;
  color: #333;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  text-align: center;
}
.grid-viewport {
  width: 50vw;
  height: 60vh;
  border: 2px solid #ccc;
  overflow: hidden;
  margin: 0 auto;
  
}

.confirm-buttons {
  margin-top: 1rem;
  display: flex;
  gap: 1rem;
  justify-content: center;
}
.deleted-cube-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s ease-out forwards;
}
.deleted-cube-content {
  background: #fff;
  padding: 2rem;
  border-radius: 12px;
  max-width: 400px;
  text-align: center;
}

.grid-wrapper {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  margin: 0 auto;
}

.side-controls-left {
  left: -50px;
  top: 50%;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 15px;
  transform: translateY(-50%);
  z-index: 2;
}

.side-controls-right {
  right: -50px;
  top: 50%;
  display: flex;
  transform: translateY(-50%);
  flex-direction: column;
  gap: 0.5rem;
  padding: 15px;
  z-index: 2;
}

/* Top/Bottom row controls */
.top-row-controls,
.bottom-row-controls {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin: 1rem 0;
}

.highlighted-grid-buttons {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  width: 100%;
}

.highlighted-grid-wrapper {
  background-color: rgb(60, 63, 66); /* Light blue with opacity */
  transition: background-color 0.3s ease;
  box-shadow: inset 0 0 0 2px rgba(33, 150, 243, 0.5);
}

.highlighted-grid-buttons button {
  min-width: 80px;
  padding: 8px 16px;
  border-radius: 4px;
  border: none;
  color: white;
  cursor: pointer;
}

.highlighted-grid-buttons button:hover {
  background: #1976d2;
}

/* Fade In Keyframe for overlays */
@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

.import-btn {
  background-color: #2c3e50;
  color: #ecf0f1;
  border-radius: 8px;
  padding: 10px;
  margin-right: 12px;
  cursor: pointer;
  font-size: 1rem;
  transition:
    background-color 0.3s,
    transform 0.2s;
}
.import-btn:hover {
  background-color: #34495e;
  transform: scale(1.05);
}

.io-section {
  margin-bottom: 1rem;
  text-align: center;
}

.io-section {
  margin-bottom: 1rem;
  text-align: center;
}
.app-header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
}

.header-controls {
  display: flex;
  justify-content: center;
  gap: 1rem;
  padding: 10px;
  margin: 0;
  width: 100%;
}

.header-btn {
  width: 200px;
}

.grid-container-wrapper {
  display: grid;
  place-items: center;
}

.header-btn {
  padding: 0.5rem 1rem;
  color: white;
  border: none;
  text-align: center;
  border-radius: 4px;
  cursor: pointer;
  transition: background 0.3s ease;
}

.header-btn:hover {
  background: #1976d2;
}

.search-container {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  width: 300px;
}

.search-input {
  padding: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
  width: 200px;
}

.search-btn {
  padding: 0.5rem;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1.2rem;
}
.grocery-list {
  display: row;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
  padding: 0;
  list-style: none;
  width: 100%;
}

.path-found {
  padding: 12px 24px;
  border-radius: 8px;
  font-size: 2rem;
  font-weight: 500;
  text-align: center;
  animation: slideUp 0.3s ease-out;
  z-index: 1000;
}

.no-path-found {
  background: rgba(231, 76, 60, 0.9);
  color: white;
  border: 1px solid #c0392b;
  padding: 12px 24px;
  font-size: 2rem;
  font-weight: 500;
  text-align: center;
  animation: slideUp 0.3s ease-out;
  z-index: 1000;
}

.grocery-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem;
  background: #f5f5f5;
  border-radius: 4px;
}

@media (max-width: 768px) {
  .grid-viewport {
    width: 95vw;
    height: 60vh;
    margin: 0;
    transform: scale(0.8);
  }
  .mobile-column-controls {
    bottom: 20px;
    right: 20px;
    display: flex;
    gap: 1rem;
    z-index: 1000;
  }

  .left-controls,
  .right-controls {
    display: flex;
    gap: 0.5rem;
  }

  .mobile-column-controls button {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    padding: 0;
    font-size: 1.2rem;
  }
}

.grocery-item {
  display: grid;
  grid-template-rows: auto auto;
  grid-template-columns: 1fr;
  gap: 5px;
  margin-bottom: 10px;
}
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  animation: fadeIn 0.2s ease-out;
}

.modal-content {
  background: white;
  padding: 20px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  text-align: center;
}

.modal-button {
  margin-top: 15px;
  padding: 8px 20px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.modal-button:hover {
  background: #1976d2;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
.item-name {
  grid-row: 1;
  font-weight: bold;
  padding: 5px;
}

.item-details {
  grid-row: 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  padding: 5px;
}

.item-upc,
.item-row {
  font-size: 0.9em;
  color: #666;
}

.item-details {
  display: flex;
  gap: 10px;
}

.item-name textarea {
  width: 300px;
  resize: auto;
  height: 40px;
  line-height: 20px;
}

.grocery-item input {
  width: 80px;
}

.remove-item {
  background-color: #ff4d4d;
  color: rgb(255, 255, 255);
  border: none;
  border-radius: 50%;
  width: 24px;
  height: 24px;
  font-size: 12px;
  cursor: pointer;
  transition: background-color 0.3s;
  margin-left: auto;
}

.remove-item:hover {
  background-color: #0c0c0c;
}

.item-controls {
  display: flex;
  justify-content: flex-start;
  margin-top: 10px;
}

.add-item,
.camera-button {
  background-color: #151815;
  color: white;
  border: none;
  padding: 5px 10px;
  margin-right: 10px;
  cursor: pointer;
  transition: background-color 0.3s;
}

.add-item:hover,
.camera-button:hover {
  background-color: #45a049;
}

.add-item:disabled {
  background-color: #cccccc;
  cursor: not-allowed;
}
.search-btn:hover {
  background: #1976d2;
}

/* Grid Dimensions */
.grid-dimensions {
  font-size: 1.2em;
  margin-bottom: 20px;
  text-align: center;
  color: #34495e;
}
@keyframes slideUp {
  from {
    transform: translate(0, 20px);
    opacity: 0;
  }
  to {
    transform: translate(0, 0);
    opacity: 1;
  }
}
/* Controls Styling */
.controls {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 30px;
  position: relative;
}

.side-controls {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 20px;
}
.debug-panel {
  position: fixed;
  top: 10px;
  right: 10px;
  background: rgba(0, 0, 0, 0.8);
  color: #00ff00;
  padding: 10px;
  border-radius: 5px;
  font-family: monospace;
  z-index: 9999;
  min-width: 200px;
}

.debug-header {
  cursor: pointer;
  user-select: none;
}

.debug-content p {
  margin: 5px 0;
  font-size: 12px;
}
.bottom-pool {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
}

button {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: fit-content;
  padding: 8px 16px;
  white-space: nowrap;
  text-align: center;
}

button:disabled {
  background-color: #95a5a6;
  cursor: not-allowed;
}

button:hover:not(:disabled) {
  background-color: #34495e;
  transform: scale(1.1);
}

/* Grid Styling */
.grid-container {
  display: grid;
  gap: 5px;
  justify-content: center;
  align-content: center;    
  margin: 0 auto;
}

.grid-row {
  display: contents;
}

.grid-cell {
  background-color: #ffffff;
  position: relative;
  border-radius: 1px;
  transition: box-shadow 0.2s ease;
}

.grid-cell:hover {
  box-shadow: inset 0 0 0 2px rgba(41, 128, 185, 0.3);
}

/* Cube Styling */
.cube {
  width: 90px;
  height: 90px;
  border-radius: 8px;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  position: absolute;
  top: 5px;
  left: 5px;
  font-weight: bold;
  overflow: hidden;
  text-align: center;
}

.cube:hover {
  transform: scale(1.05);
}

/* Cube Classes */
.grocery {
  background-color: #e67e22; /* Orange */
}

.entry {
  background-color: #2980b9; /* Blue */
}
.zoom-controls {
  margin-bottom: 0.5rem;
}

.zoom-button {
  background-color: rgba(33, 150, 243, 0.7);
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  font-size: 20px;
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: background-color 0.3s;
}
.zoom-button:hover {
  background-color: #1976d2;
}
.custom {
  background-color: #9b59b6; /* Purple */
}
.search-controls {
  display: flex;
  align-items: center;
  margin-bottom: 1rem;
}

.search-controls input {
  padding: 0.5rem;
  margin-right: 0.5rem;
  border: 1px solid #ccc;
  border-radius: 4px;
}

.search-controls button {
  padding: 0.5rem 1rem;
  background-color: #3498db;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.search-controls button:hover {
  background-color: #2980b9;
}

.modal-content ul {
  list-style-type: none;
  padding: 0;
  color: #333;
}

.modal-content li {
  padding: 0.5rem;
  cursor: pointer;
  transition: background-color 0.3s;
  color: #333;
}

.modal-content li:hover {
  background-color: #f0f0f0;
}

.cube.highlighted {
  outline: 3px solid red;
  z-index: 1;
}

/* Item Count for Grocery Cubes */
.item-count {
  position: absolute;
  bottom: 8px;
  right: 8px;
  background-color: #2c3e50;
  color: white;
  padding: 3px 8px;
  border-radius: 15px;
  font-size: 0.85em;
  font-weight: bold;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.available-cube {
  width: 120px;
  padding: 10px;
  font-size: 1.2rem;
  margin: 10px auto;
  border-radius: 8px;
  color: #fff;
  border: 1px solid #ccc;
  cursor: grab;
  font-weight: bold;
  transition: transform 0.2s;
  position: relative;
  text-align: center;
}

.available-cube:hover {
  transform: scale(1.05);
}

.popup {
  position: absolute;
  background: white;
  border: 1px solid #ccc;
  padding: 1rem;
  z-index: 9999;
}
.bottom-pool {
  display: grid;
  grid-template-rows: repeat(2, auto);
  grid-template-columns: repeat(3, 1fr);
  grid-template-areas:
    'item1 item2 item3'
    '. item4 item5';
  padding: 0.5rem;
  z-index: 1;
}

.highlighted-grid {
  margin-top: 2rem;
  
}

.grid-cell.highlighted {
  background-color: rgba(255, 255, 0, 0.3);
}
.trash {
  width: 120px;
  padding: 10px;
  font-size: 1.2rem;
  margin: 10px auto;
  border-radius: 8px;
  border: 1px solid #ccc;
  cursor: grab;
  font-weight: bold;
  transition: transform 0.2s;
  position: relative;
  text-align: center;
  color: white;
}
.trash-text {
  font-size: 1em;
}

.trash:hover {
  transform: scale(1.05);
}

.path-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none; /* clicks pass through */
}
.zoom-controls {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}
/* Example styling for zoom buttons if needed */
.zoom-button {
  background-color: #2196f3;
  color: #fff;
  border: none;
  padding: 0.5rem;
  cursor: pointer;
  border-radius: 4px;
  font-size: 1rem;
  transition: background 0.3s;
}
.zoom-button:hover {
  background-color: #1976d2;
}
/* Modal Styling */
.modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
}

.modal-content {
  background-color: #fff;
  padding: 30px;
  border-radius: 12px;
  width: 500px;
  max-width: 90%;
  position: relative;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.close-button {
  position: absolute;
  top: 15px;
  right: 20px;
  font-size: 28px;
  font-weight: bold;
  color: #34495e;
  cursor: pointer;
}

.close-button:hover {
  color: #e74c3c;
}

.modal-content h2 {
  margin-bottom: 20px;
  color: #34495e;
}

.modal-content h3 {
  margin-top: 20px;
  color: #2980b9;
}

.modal-content ul {
  list-style-type: none;
  padding: 0;
}

.modal-content li {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #ecf0f1;
  padding: 8px 12px;
  margin-bottom: 8px;
  border-radius: 6px;
}

.modal-content button {
  background-color: #e74c3c;
  color: #fff;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  transition: background-color 0.3s;
}
.highlighted-grid {
  margin-top: 2rem;
}

.grid-cell.highlighted {
  background-color: rgb(211, 24, 24);
}

.step-number {
  position: absolute;
  top: 0;
  right: 0;
  background-color: rgba(0, 0, 0, 0.7);
  color: white;
  padding: 2px 5px;
  font-size: 0.8em;
  border-radius: 50%;
}

.export-button {
  padding: 8px 20px;
  text-align: center;
  min-width: 100px;
  background: #2196f3;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
}

.export-button:hover {
  background-color: #2980b9;
}

.modal-content button:hover {
  background-color: #c0392b;
}

.modal-content input,
.modal-content select {
  width: 100%;
  padding: 8px;
  margin-top: 8px;
  border-radius: 6px;
  border: 1px solid #bdc3c7;
}
.direction-selector {
  display: column;
  gap: 4px;
  max-width: 120px;
}

.direction-selector button {
  padding: 8px;
  border: 1px solid #ccc;
  background: white;
  cursor: pointer;
}

.direction-selector button.active {
  background: #2196f3;
  color: white;
}

/* Position buttons in a compass layout */
.direction-selector button:nth-child(1) {
  grid-column: 2;
} /* N */
.direction-selector button:nth-child(2) {
  grid-column: 3;
} /* NE */
.direction-selector button:nth-child(3) {
  grid-column: 3;
} /* E */
.direction-selector button:nth-child(4) {
  grid-column: 3;
} /* SE */
.direction-selector button:nth-child(5) {
  grid-column: 2;
} /* S */
.direction-selector button:nth-child(6) {
  grid-column: 1;
} /* SW */
.direction-selector button:nth-child(7) {
  grid-column: 1;
} /* W */
.direction-selector button:nth-child(8) {
  grid-column: 1;
}
</style>
