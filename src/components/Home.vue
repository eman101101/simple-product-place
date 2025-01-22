<template>
     <div v-if="showModal" class="modal-overlay" @click.self="closeModal">
    <div class="modal-content">
      <span class="close-button" @click="closeModal">&times;</span>
    <div class="homepage">
      <!-- Hero Section -->
      <section class="hero">
        <h1>simple product place</h1>
        <p class="subtitle">No AI bullshit, simple store maps</p>
        <button @click="$router.push('/')" class="cta-button">Test it out</button>
      </section>
  
      <!-- Features Section -->

  <div class="feature-grid">

      <h3>Create your store layout with customizable rows and columns. Drag and drop sections like Grocery, Entry, or Custom areas onto the grid.</h3>
   

      <h3>Place different section types (produce, dairy, walls) and add product details including names and UPCs.</h3>



      <h3>Find any item instantly using the search bar. Results show exact location on your store map.</h3>



      <h3>Export your layout to save your work. Import previously saved maps anytime.</h3>

  </div>
    </div>
</div>
    </div>

  </template>
  <script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  
  const showModal = ref(true)
  const router = useRouter()
  
  function closeModal() {
    showModal.value = false
    router.push('/')
  }
  </script>
  
  <style scoped>
  .homepage {
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
  }
  
  .hero {
    text-align: center;
    padding: 80px 20px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: white;
    border-radius: 20px;
    margin-bottom: 60px;
  }
  
  .hero h1 {
    font-size: 3rem;
    margin-bottom: 20px;
  }
  
  .subtitle {
    font-size: 1.5rem;
    margin-bottom: 40px;
  }

  .modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(5px);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
  animation: fadeIn 0.3s;
}

.modal-content {
  background: #383434;
  border-radius: 20px;
  padding: 20px;
  max-width: 90vw;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
}

.close-button {
  position: absolute;
  top: 20px;
  right: 20px;
  font-size: 30px;
  cursor: pointer;
  color: #666;
  z-index: 1;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
  
  .cta-button {
    padding: 15px 40px;
    font-size: 1.2rem;
    background: white;
    color: #6366f1;
    border: none;
    border-radius: 30px;
    cursor: pointer;
    transition: transform 0.2s;
  }
  
  .feature-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
  padding: 2rem 0;
  max-width: 800px;
  margin: 0 auto;
}

.feature-card:nth-child(1) h3 {
  background: linear-gradient(135deg, #4CAF50, #45a049);
}

.feature-card:nth-child(2) h3 {
  background: linear-gradient(135deg, #2196F3, #1976d2);
}

.feature-card:nth-child(3) h3 {
  background: linear-gradient(135deg, #9C27B0, #7B1FA2);
}

.feature-card:nth-child(4) h3 {
  background: linear-gradient(135deg, #FF9800, #F57C00);
}

.feature-card h3 {
  color: white;
  padding: 1rem;
  border-radius: 8px;
  margin: 0 0 1rem 0;
}
  .feature-card {
    padding: 30px;
    background: white;
    border-radius: 15px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .pricing-cards {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 30px;
    padding: 40px 0;
  }
  
  .price-card {
    padding: 40px;
    background: rgb(67, 118, 228);
    border-radius: 15px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    text-align: center;
  }
  
  .price-card.featured {
    transform: scale(1.05);
    border: 2px solid #6366f1;
  }
  
  .price {
    font-size: 2.5rem;
    font-weight: bold;
    margin: 20px 0;
  }
  
  .price-btn {
    width: 100%;
    padding: 15px;
    border: none;
    border-radius: 30px;
    background: #6366f1;
    color: white;
    font-size: 1.1rem;
    cursor: pointer;
  }
  
  @media (max-width: 768px) {
    .hero h1 {
      font-size: 2rem;
    }
    
    .subtitle {
      font-size: 1.2rem;
    }
    
    .price-card.featured {
      transform: none;
    }
  }
  </style>