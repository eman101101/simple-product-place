<template>
  <div :class="theme + ' min-h-screen bg-gray-100 dark:bg-gray-900'">
    <!-- Header / About Button -->
    <div class="p-4 flex justify-center items-center gap-4 bg-white dark:bg-gray-800 shadow">
      <button
        @click="goToHome"
        class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        About
      </button>
      <button
        @click="toggleTheme"
        class="px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
      >
        Switch Theme
      </button>
    </div>

    <!-- Main Container -->
    <div class="flex flex-col items-center justify-center mt-4">
      <!-- File Input for JSON -->
      <input
        type="file"
        ref="fileInput"
        @change="onFileChange"
        accept="application/json"
        class="hidden"
      />

      <div class="mb-2 flex items-center gap-2">
        <button
          @click="downloadJson"
          class="px-3 py-2 bg-green-500 text-white rounded shadow hover:bg-green-600"
        >
          Save
        </button>
        <button
          @click="$refs.fileInput.click()"
          class="px-3 py-2 bg-yellow-500 text-white rounded shadow hover:bg-yellow-600"
        >
          Load
        </button>
        <div class="relative">
          <input
            v-model="searchQuery"
            class="rounded border border-gray-300 px-2 py-1"
            placeholder="Search item / UPC"
            @keyup.enter="performSearch"
          />
        </div>
        <button
          @click="performSearch"
          class="px-3 py-2 bg-indigo-500 text-white rounded shadow hover:bg-indigo-600"
        >
          ⌕
        </button>
      </div>

      <!-- Popups / Notifications -->
      <div v-if="showInvalidDropPopup" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white p-6 rounded shadow-xl">
          <h2 class="text-xl font-bold mb-2">Invalid Drop</h2>
          <p class="mb-4">{{ invalidDropMessage }}</p>
          <button
            @click="showInvalidDropPopup = false"
            class="px-4 py-2 bg-blue-500 text-white rounded"
          >
            OK
          </button>
        </div>
      </div>

      <div v-if="deletedCubeMsg" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white p-6 rounded shadow-xl">
          <h2 class="text-lg font-bold mb-2">{{ deletedCubeMsg }}</h2>
          <button
            @click="deletedCubeMsg = ''"
            class="px-4 py-2 bg-green-500 text-white rounded"
          >
            OK
          </button>
        </div>
      </div>

      <div v-if="showSearchModal" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white p-6 rounded shadow-xl relative w-96 max-w-full">
          <span
            class="absolute top-2 right-2 text-2xl cursor-pointer text-gray-600 hover:text-red-600"
            @click="closeSearchModal"
          >
            &times;
          </span>
          <h2 class="text-xl font-bold mb-2">Search Results</h2>
          <ul v-if="searchResults.length" class="list-none pl-0 space-y-1">
            <li
              v-for="result in searchResults"
              :key="result.id"
              class="p-2 hover:bg-gray-200 cursor-pointer rounded"
              @click="selectSearchResult(result)"
            >
              {{ result.name }} (UPC: {{ result.upc }})
            </li>
          </ul>
          <p v-else class="mt-4">No results found.</p>
        </div>
      </div>

      <div v-if="appMessage" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white p-6 rounded shadow-xl">
          <p class="mb-4">{{ appMessage }}</p>
          <button
            @click="appMessage = ''"
            class="px-4 py-2 bg-blue-500 text-white rounded"
          >
            OK
          </button>
        </div>
      </div>

      <!-- Highlighted Grid Modal -->
      <div v-if="highlightedGrid" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-60 p-4">
        <div
          class="bg-gray-800 p-4 rounded w-full md:w-4/5 lg:w-3/4 relative"
          @pointerdown="startHighlightedGridDrag"
          @pointermove="onHighlightedGridMouseMove"
          @pointerup="stopHighlightedGridDrag"
          @pointerleave="stopHighlightedGridDrag"
          :style="{
            cursor: isHighlightedGridDragging ? 'grabbing' : 'grab',
            transform: 'translate(' + highlightedGridX + 'px, ' + highlightedGridY + 'px)',
          }"
        >
          <div class="grid-viewport border border-gray-500 mx-auto overflow-hidden">
            <div
              class="grid-container"
              :style="gridStyle"
            >
              <div
                v-for="(row, rowIndex) in highlightedGrid"
                :key="'highlighted-row-' + rowIndex"
                class="contents"
              >
                <div
                  v-for="(cell, colIndex) in row"
                  :key="'highlighted-cell-' + rowIndex + '-' + colIndex"
                  class="relative border border-gray-300"
                  :class="cell && cell.highlight ? 'bg-yellow-200' : 'bg-white'"
                >
                  <div
                    v-if="cell !== null"
                    class="cube absolute w-[90px] h-[90px] flex items-center justify-center text-white font-bold"
                    :class="cell.class.toLowerCase()"
                    draggable="true"
                    @dragstart="dragStart($event, rowIndex, colIndex)"
                    @touchstart="dragStart($event, rowIndex, colIndex)"
                    @click="openCubeModal(cell, rowIndex, colIndex)"
                    @touchend="handleDrop($event, rowIndex, colIndex)"
                    @dragend="onDragEnd"
                  >
                    {{ cell.label }}
                    <span
                      v-if="cell.step"
                      class="step-number absolute top-0 right-0 bg-black bg-opacity-70 text-xs rounded-full px-1"
                    >
                      {{ cell.step }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="mt-3 text-center text-white">
            <p>
              Found: {{ searchResults[0]?.name }} on Row
              {{ searchResults[0]?.row }}
            </p>
            <div v-if="searchPath.length === 0" class="mt-2 text-red-300">
              No path found
            </div>
          </div>

          <!-- Highlighted Grid Buttons -->
          <div class="flex justify-center gap-3 mt-4">
            <button
              @pointerdown="startZoomIn"
              @pointerup="stopZoom"
              @pointerleave="stopZoom"
              class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Zoom In
            </button>
            <button
              @pointerdown="startZoomOut"
              @pointerup="stopZoom"
              @pointerleave="stopZoom"
              class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Zoom Out
            </button>
            <button
              @click="exportHighlightedGrid"
              class="px-3 py-2 bg-green-500 text-white rounded hover:bg-green-600"
            >
              Export
            </button>
            <button
              @click="closeHighlightedGridModal"
              class="px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      <!-- Confirm Delete -->
      <div v-if="cubeToDelete" class="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
        <div class="bg-white p-6 rounded shadow-xl w-80 relative text-center">
          <h2 class="text-xl font-bold">Delete {{ cubeToDelete.label }}?</h2>
          <p class="mt-2">This action is permanent. Continue?</p>
          <div class="mt-4 flex justify-center gap-4">
            <button
              @click="confirmDelete"
              class="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Yes
            </button>
            <button
              @click="cancelDelete"
              class="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
            >
              No
            </button>
          </div>
        </div>
      </div>

      <!-- Grid Wrapper -->
      <div class="grid grid-cols-[auto_1fr_auto] items-center mt-4 gap-2">
        <!-- Side Controls Left -->
        <div class="flex flex-col justify-center items-center gap-1">
          <button
            @click="addColumnLeft"
            class="bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600"
          >
            +
          </button>
          <button
            :disabled="!canRemoveColumnLeft"
            @click="removeColumnLeft"
            class="bg-red-500 text-white py-1 px-2 rounded enabled:hover:bg-red-600 disabled:bg-gray-400"
          >
            -
          </button>
        </div>

        <!-- Main Content -->
        <div>
          <!-- Top Row Controls -->
          <div class="flex justify-center items-center gap-2 mb-2">
            <button
              @click="addRowTop"
              class="bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600"
            >
              +
            </button>
            <button
              :disabled="!canRemoveRowTop"
              @click="removeRowTop"
              class="bg-red-500 text-white py-1 px-2 rounded enabled:hover:bg-red-600 disabled:bg-gray-400"
            >
              -
            </button>
          </div>

          <!-- Grid Area -->
          <div @pointerdown="onGridMouseDown">
            <div class="grid-viewport border border-gray-300 w-[45vw] h-[60vh] overflow-hidden mx-auto">
              <div
                class="grid-container-wrapper grid place-items-center"
                :style="wrapperTransform"
                @pointerdown="onMouseDown"
                @pointermove.prevent="onMouseMove"
                @pointerup="onMouseUp"
              >
                <div
                  class="grid-container"
                  :style="gridStyle"
                >
                  <div
                    v-for="(row, rowIndex) in grid"
                    :key="'row-' + rowIndex"
                    class="contents"
                  >
                    <div
                      v-for="(cell, colIndex) in row"
                      :key="'cell-' + rowIndex + '-' + colIndex"
                      class="relative border border-gray-200"
                      :class="{
                        'bg-white': !(
                          highlightedCube &&
                          highlightedCube.row === rowIndex &&
                          highlightedCube.col === colIndex
                        ),
                        'bg-yellow-200':
                          highlightedCube &&
                          highlightedCube.row === rowIndex &&
                          highlightedCube.col === colIndex,
                      }"
                      @dragover.prevent
                      @drop="handleDrop($event, rowIndex, colIndex)"
                    >
                      <div
                        v-if="cell !== null"
                        class="cube absolute w-[90px] h-[90px] flex items-center justify-center text-white font-bold"
                        :class="cell.class.toLowerCase()"
                        draggable="true"
                        @dragstart="dragStart($event, rowIndex, colIndex)"
                        @touchstart="dragStart($event, rowIndex, colIndex)"
                        @click="openCubeModal(cell, rowIndex, colIndex)"
                        :title="'Click to edit cube'"
                      >
                        {{ cell.label }}
                        <!-- Entry arrow -->
                        <div
                          v-if="cell.class === 'Custom'"
                          :class="'arrow arrow-' + cell.direction"
                        ></div>
                        <!-- Grocery item count -->
                        <div v-else-if="cell.class === 'Grocery'">
                          <span
                            class="absolute bottom-2 right-2 bg-black bg-opacity-70 text-xs text-white px-2 py-0.5 rounded-full"
                          >
                            {{ cell.items.length }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Center & Zoom Controls -->
            <div class="mt-3 flex justify-center gap-2">
              <button
                @click="centerGrid"
                class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Center Grid
              </button>
              <button
                @pointerdown="startZoomIn"
                @pointerup="stopZoom"
                @pointerleave="stopZoom"
                class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Zoom In
              </button>
              <button
                @pointerdown="startZoomOut"
                @pointerup="stopZoom"
                @pointerleave="stopZoom"
                class="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Zoom Out
              </button>
            </div>
          </div>

          <!-- Bottom Row Controls -->
          <div class="flex justify-center items-center gap-2 mt-2 mb-2">
            <button
              @click="addRowBottom"
              class="bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600"
            >
              +
            </button>
            <button
              :disabled="!canRemoveRowBottom"
              @click="removeRowBottom"
              class="bg-red-500 text-white py-1 px-2 rounded enabled:hover:bg-red-600 disabled:bg-gray-400"
            >
              -
            </button>
          </div>

          <!-- Bottom Pool (imported separately in a real project) -->
          <div class="grid grid-rows-2 grid-cols-3 gap-3 place-items-center">
            <div
              v-for="cubeType in cubeTypes"
              :key="cubeType.type"
              draggable="true"
              class="available-cube bg-blue-700 text-white rounded p-2 w-[120px] text-center cursor-pointer"
              @dragstart="dragStartFromPool($event, cubeType)"
              @touchstart="handleCubeTap($event, cubeType)"
            >
              {{ cubeType.label }}
            </div>
            <div
              class="trash bg-red-600 text-white rounded p-2 w-[120px] text-center cursor-pointer"
              @dragover.prevent
              @touchend="handleDropToTrash($event)"
              @drop="handleDropToTrash($event)"
            >
              <span>Trash🗑️</span>
            </div>
          </div>
        </div>

        <!-- Side Controls Right -->
        <div class="flex flex-col justify-center items-center gap-1">
          <button
            @click="addColumnRight"
            class="bg-blue-500 text-white py-1 px-2 rounded hover:bg-blue-600"
          >
            +
          </button>
          <button
            :disabled="!canRemoveColumnRight"
            @click="removeColumnRight"
            class="bg-red-500 text-white py-1 px-2 rounded enabled:hover:bg-red-600 disabled:bg-gray-400"
          >
            -
          </button>
        </div>
      </div>
    </div>

    <!-- Modal Dialog (imported separately in a real project) -->
    <ModalDialog />

  </div>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import { useRouter } from 'vue-router'
import ModalDialog from './components/ModalDialog.vue'

/* 
  If using the extracted composables/useGrid.ts, you'd import it here 
  and pass in the relevant refs to destructure the grid manipulation 
  methods. For brevity, the code below includes them inline.
*/
// import { useGrid } from './composables/useGrid'

const router = useRouter()
function goToHome() {
  router.push('/home')
}


//--------------------------------------------------------------------
// Grid State
//--------------------------------------------------------------------
const gridRows = ref(4)
const gridCols = ref(4)
function createGrid(r, c) {
  return Array.from({ length: r }, () => Array.from({ length: c }, () => null))
}
const grid = ref(createGrid(gridRows.value, gridCols.value))

const searchQuery = ref('')
const searchResults = ref([])
const showSearchModal = ref(false)
const appMessage = ref('')

//--------------------------------------------------------------------
// BFS, Pathfinding
//--------------------------------------------------------------------
const searchPath = ref([])
const highlightedGrid = ref(null)
const highlightedCube = ref(null)
function performSearch() {
  searchResults.value = []
  const q = searchQuery.value.toLowerCase()
  grid.value.forEach((row, rowIndex) => {
    row.forEach((cell, colIndex) => {
      if (cell && cell.class === 'Grocery') {
        cell.items.forEach((item) => {
          if (item.name.toLowerCase().includes(q) || item.upc.toLowerCase().includes(q)) {
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
function closeSearchModal() {
  showSearchModal.value = false
}
function selectSearchResult(result) {
  highlightedCube.value = result.cubePosition
  computePathToCube(result.cubePosition)
  closeSearchModal()
  const gridCopy = JSON.parse(JSON.stringify(grid.value))
  searchPath.value.forEach(([r, c]) => {
    if (!gridCopy[r][c]) {
      gridCopy[r][c] = { class: 'empty', label: '' }
    }
    gridCopy[r][c].highlight = true
  })
  highlightedGrid.value = gridCopy
}
function computePathToCube({ row, col }) {
  searchPath.value = []
  const [entryRow, entryCol] = findEntryCoord()
  if (entryRow === null) {
    return
  }
  const path = findPathIgnoringGroceries([entryRow, entryCol], [row, col])
  searchPath.value = path
}
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

//--------------------------------------------------------------------
// Highlighted Grid
//--------------------------------------------------------------------
const isHighlightedGridDragging = ref(false)
const highlightedGridX = ref(0)
const highlightedGridY = ref(0)
let highlightedStartX = 0
let highlightedStartY = 0
function startHighlightedGridDrag(e) {
  isHighlightedGridDragging.value = true
  highlightedStartX = e.clientX - highlightedGridX.value
  highlightedStartY = e.clientY - highlightedGridY.value
}
function onHighlightedGridMouseMove(e) {
  if (!isHighlightedGridDragging.value) return
  highlightedGridX.value = e.clientX - highlightedStartX
  highlightedGridY.value = e.clientY - highlightedStartY
}
function stopHighlightedGridDrag() {
  isHighlightedGridDragging.value = false
}

function closeHighlightedGridModal() {
  highlightedGrid.value = null
}

//--------------------------------------------------------------------
// Export
//--------------------------------------------------------------------
function exportHighlightedGrid() {
  if (!highlightedGrid.value) {
    appMessage.value = 'No highlighted grid to export.'
    return
  }
  const gridHTML = `
<style>
  /* Basic inline example styling */
  body {
    font-family: sans-serif;
    background-color: #eee;
  }
  .grid-container {
    display: grid;
    grid-template-columns: repeat(${gridCols.value}, 1fr);
    gap: 5px;
  }
  .grid-cell {
    position: relative;
    min-height: 90px;
    border: 1px solid #ccc;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .highlighted {
    background: yellow;
  }
</style>
<div class="grid-container">
${highlightedGrid.value
  .map((row) =>
    row
      .map((cell) =>
        cell
          ? `<div class="grid-cell ${cell.highlight ? 'highlighted' : ''}">
              <div>${cell.label || ''}</div>
            </div>`
          : `<div class="grid-cell"></div>`,
      )
      .join(''),
  )
  .join('')}
</div>`
  const blob = new Blob([gridHTML], { type: 'text/html' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'highlighted-grid.html'
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

//--------------------------------------------------------------------
// Deletion
//--------------------------------------------------------------------
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

//--------------------------------------------------------------------
// Row/Column Add/Remove
//--------------------------------------------------------------------
function hasCubeInRow(rowIndex) {
  return grid.value[rowIndex].some((cell) => cell !== null)
}
function hasCubeInCol(colIndex) {
  return grid.value.some((row) => row[colIndex] !== null)
}
const canRemoveRowTop = computed(() => gridRows.value > 1 && !hasCubeInRow(0))
const canRemoveRowBottom = computed(() => gridRows.value > 1 && !hasCubeInRow(gridRows.value - 1))
const canRemoveColumnLeft = computed(() => gridCols.value > 1 && !hasCubeInCol(0))
const canRemoveColumnRight = computed(() => gridCols.value > 1 && !hasCubeInCol(gridCols.value - 1))

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

//--------------------------------------------------------------------
// Drag & Zoom
//--------------------------------------------------------------------
let uniqueId = 1
const isCubeDragging = ref(false)
const dragging = ref(false)
const lastMouseX = ref(0)
const lastMouseY = ref(0)
const translateX = ref(0)
const translateY = ref(0)
function onMouseDown(e) {
  if (isCubeDragging.value) return
  dragging.value = true
  lastMouseX.value = e.clientX
  lastMouseY.value = e.clientY
}
function onMouseMove(e) {
  if (!dragging.value || isCubeDragging.value) return
  translateX.value += e.clientX - lastMouseX.value
  translateY.value += e.clientY - lastMouseY.value
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
let zoomInterval = null
const ZOOM_SPEED = 0.1
const MIN_ZOOM = 0.2
const MAX_ZOOM = 3
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
function onDragEnd() {
  isCubeDragging.value = false
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

const showInvalidDropPopup = ref(false)
const invalidDropMessage = ref('')
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
const deletedCubeMsg = ref('')

//--------------------------------------------------------------------
// Download / Load JSON
//--------------------------------------------------------------------
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

//--------------------------------------------------------------------
// Computed Styles
//--------------------------------------------------------------------
const gridStyle = computed(() => ({
  gridTemplateRows: `repeat(${gridRows.value}, 100px)`,
  gridTemplateColumns: `repeat(${gridCols.value}, 100px)`,
  position: 'relative',
  width: '100%',
  transformOrigin: '0 0',
  transform: `scale(${zoomFactor.value})`,
  transition: 'transform 0.3s ease',
}))
const wrapperTransform = computed(() => ({
  transform: `translate(${translateX.value}px, ${translateY.value}px) scale(${zoomFactor.value})`,
  cursor: dragging.value ? 'grabbing' : 'grab',
  transition: dragging.value ? 'none' : 'transform 0.3s ease',
  willChange: 'transform',
}))

//--------------------------------------------------------------------
// Modal (imported from components/ModalDialog.vue) references
//--------------------------------------------------------------------
</script>

<!-- Tailwind in main.css or your setup:
@tailwind base;
@tailwind components;
@tailwind utilities;
-->
