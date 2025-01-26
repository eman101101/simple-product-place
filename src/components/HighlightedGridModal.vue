<template>
    <div v-if="highlightedGrid" class="modal">
      <div class="highlighted-grid-wrapper">
        <div
          class="highlighted-grid-container"
          @pointerdown="startHighlightedGridDrag"
          @pointermove="onHighlightedGridMouseMove"
          @pointereup="stopHighlightedGridDrag"
          @pointerleave="stopHighlightedGridDrag"
          :style="{
            cursor: isHighlightedGridDragging ? 'grabbing' : 'grab',
            transform: 'translate(' + highlightedGridX + 'px, ' + highlightedGridY + 'px)',
          }"
        >
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
                  <div
                    v-if="cell !== null"
                    class="cube"
                    :class="cell.class.toLowerCase()"
                    draggable="true"
                    @dragstart="dragStart($event, rowIndex, colIndex)"
                    @touchstart="dragStart($event, rowIndex, colIndex)"
                    @click="openCubeModal(cell, rowIndex, colIndex)"
                    @touchend="handleDrop($event, rowIndex, colIndex)"
                    @dragend="onDragEnd"
                  >
                    {{ cell.label }}
                    <span v-if="cell.step" class="step-number">{{ cell.step }}</span>
                  </div>
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
          <button @pointerdown="startZoomIn" @pointerup="stopZoom" @pointerleave="stopZoom">
            Zoom In
          </button>
          <button @pointerdown="startZoomOut" @pointerup="stopZoom" @pointerleave="stopZoom">
            Zoom Out
          </button>
          <button @click="exportHighlightedGrid" class="export-button">Export</button>
          <button @click="closeHighlightedGridModal" class="export-button">Close</button>
        </div>
      </div>
    </div>
  </template>
  
  <script setup>
  import { ref, computed } from 'vue'
  
  const highlightedGrid = ref(null)
  const searchResults = ref([])
  const searchPath = ref([])
  const highlightedGridX = ref(0)
  const highlightedGridY = ref(0)
  const isHighlightedGridDragging = ref(false)
  const gridStyle = ref({})
  // Reuse existing drag-based logic as needed
  function startHighlightedGridDrag(e) {
    isHighlightedGridDragging.value = true
    highlightedStartX.value = e.clientX - highlightedGridX.value
    highlightedStartY.value = e.clientY - highlightedGridY.value
  }
  function onHighlightedGridMouseMove(e) {
    if (!isHighlightedGridDragging.value) return
    highlightedGridX.value = e.clientX - highlightedStartX.value
    highlightedGridY.value = e.clientY - highlightedStartY.value
  }
  function stopHighlightedGridDrag() {
    isHighlightedGridDragging.value = false
  }
  const highlightedStartX = ref(0)
  const highlightedStartY = ref(0)
  
  // Zoom
  const zoomFactor = ref(1)
  function startZoomIn() {}
  function startZoomOut() {}
  function stopZoom() {}
  
  // Export
  function exportHighlightedGrid() {}
  function closeHighlightedGridModal() {
    highlightedGrid.value = null
  }
  
  // Stubs for existing drop logic
  function dragStart() {}
  function onDragEnd() {}
  function handleDrop() {}
  function openCubeModal() {}
  </script>
  