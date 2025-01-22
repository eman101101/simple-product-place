# Grocery Store Map Application

## Overview
This application provides an interactive map interface for managing product locations in a grocery store. It allows store owners or managers to visualize a grid-based layout, add different product sections (cubes), and enable users to quickly search for items by name or UPC code.

## Key Features
- **Grid Layout and Editing:** Add and remove rows/columns, drag items around the grid, and create a custom floor plan of your store.  
- **Item Search:** Enter a search keyword (e.g., product name or UPC), and see a filtered view of matching items or their locations on the map.  
- **Modals and Alerts:** Invalid drop zones or confirmation prompts appear in modals, ensuring user-friendly error handling.  
- **JSON Import/Export:** Save your store layout and product info to a JSON file for backup or load it back later.

## How It Works
1. **Grid Setup:**  
   - The main grocery map is displayed as a grid. You can add rows and columns to match your store layout.  
   - Drag-and-drop functionality allows you to place cubes (e.g., "Grocery," "Entry," "Custom," etc.) onto the grid squares.

2. **Cube Types:**  
   - Each “cube” type represents a specific store section (e.g., produce, dairy, entry points, custom areas, or walls).  
   - When you drop a cube, you can also input details like item rows or UPCs.  

3. **Searching for Products:**  
   - A search bar is available to quickly find any item.  
   - Matching results appear in a modal or message, highlighting their location.  

4. **Import/Export:**  
   - Click “Save” to export your map as a JSON file which includes all row/column info and product placements.  
   - Click “Load” to import a previously saved JSON map.  

5. **Modals and Warnings:**  
   - If you drop a cube in an invalid spot or exceed certain constraints, a modal will appear with a warning or confirmation step.  
   - This ensures accuracy in mapping and helps avoid accidental changes.


 **Create or Modify Your Map:**  
   - Use the “+” or “-” buttons to add/remove rows or columns.  
   - Drag cubes from the “bottom pool” (or whichever designated area) onto the grid.

 **Manage Products:**  
   - For Grocery cubes, you can edit item names, UPCs, or other details.  
   - Remove items or entire cubes as your store layout changes.

 **Search:**  
   - Enter a keyword or UPC into the search bar.  
   - Press Enter to view matching items in a modal, including quick navigation to their location.

**Import/Export:**  
   - Click “Save” to download a JSON representation of your entire layout.  
   - Click “Load” to use a saved store map.

## Technologies Used
- **Vue 3**:
- **Vite**:

## How to Deploy yourself
1. Build the project:
   ```
   pnpm run build
   ```
2. Deploy the contents of the `dist` folder to your preferred static hosting service.
