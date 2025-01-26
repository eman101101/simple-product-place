import { Ref } from 'vue'

export function useGrid(grid) {
    function createGrid(initialRows, initialCols) {
      grid.length = 0
      for (let r = 0; r < initialRows; r++) {
        const row = []
        for (let c = 0; c < initialCols; c++) {
          row.push(null)
        }
        grid.push(row)
      }
    }
  
    function hasCubeInRow(rowIndex, cubeClass) {
      return grid[rowIndex].some(cell => cell && cell.class === cubeClass)
    }
  
    function hasCubeInCol(colIndex, cubeClass) {
      return grid.some(row => row[colIndex] && row[colIndex].class === cubeClass)
    }
  
    function addRowTop() {
      const newRow = grid[0].map(() => null)
      grid.unshift(newRow)
    }
  
    function addRowBottom() {
      const newRow = grid[grid.length - 1].map(() => null)
      grid.push(newRow)
    }
  
    function removeRowTop() {
      if (grid.length > 1) {
        grid.shift()
      }
    }
  
    function removeRowBottom() {
      if (grid.length > 1) {
        grid.pop()
      }
    }
  
    function addColumnLeft() {
      grid.forEach(row => row.unshift(null))
    }
  
    function addColumnRight() {
      grid.forEach(row => row.push(null))
    }
  
    function removeColumnLeft() {
      grid.forEach(row => {
        if (row.length > 1) {
          row.shift()
        }
      })
    }
  
    function removeColumnRight() {
      grid.forEach(row => {
        if (row.length > 1) {
          row.pop()
        }
      })
    }
  
    function findPathIgnoringGroceries(tr, tc, r, c) {
      const visited = new Set()
      const queue = [[tr, tc, []]]
  
      while (queue.length) {
        const [row, col, path] = queue.shift()
  
        if (row === r && col === c) {
          return path.concat([[r, c]])
        }
  
        const directions = [
          [0, 1], [0, -1], [1, 0], [-1, 0]
        ]
  
        for (const [dr, dc] of directions) {
          const nr = row + dr
          const nc = col + dc
          const inBounds = nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length
  
          if (inBounds && !visited.has(`${nr},${nc}`)) {
            const cell = grid[nr][nc]
            if (
              !cell ||
              (cell.class !== 'Grocery' && cell.class !== 'Wall') ||
              (nr === tr && nc === tc)
            ) {
              visited.add(`${nr},${nc}`)
              queue.push([nr, nc, path.concat([[row, col]])])
            }
          }
        }
      }
      return []
    }
  
    return {
      createGrid,
      hasCubeInRow,
      hasCubeInCol,
      addRowTop,
      addRowBottom,
      removeRowTop,
      removeRowBottom,
      addColumnLeft,
      addColumnRight,
      removeColumnLeft,
      removeColumnRight,
      findPathIgnoringGroceries
    }
  }