<template>
    <div>
      <header class="landing-header">
        <nav>
          <ul>
            <li><a href="#">Home</a></li>
            <li><a href="#">App</a></li>
            <li><a href="#">How To Use</a></li>
            <li><a href="#">Pricing</a></li>
          </ul>
        </nav>
      </header>
  
      <section class="hero-section">
        <h1 class="hero-title">
          <transition-group name="title" tag="div" class="title-words">
            <div v-for="(word, index) in displayedWords" :key="index">{{ word }}</div>
          </transition-group>
        </h1>
        <h2 class="hero-tagline">Simple product mapping</h2>
        <button class="hero-button">How to Use</button>
      </section>
    </div>
  </template>
  
  <script>
  export default {
    data() {
      return {
        fullWords: ['simple', 'product', 'place'],
        displayedWords: []
      }
    },
    mounted() {
      let i = 0
      const timer = setInterval(() => {
        if (i < this.fullWords.length) {
          this.displayedWords.push(this.fullWords[i])
          i++
        } else {
          clearInterval(timer)
        }
      }, 700)
    }
  }
  </script>
  
  <style>
  .landing-header {
    display: flex;
    justify-content: center;
    padding: 1rem;
    background-color: #f2f2f2;
  }
  .landing-header ul {
    list-style-type: none;
    display: flex;
    gap: 1rem;
    margin: 0;
    padding: 0;
  }
  .landing-header a {
    text-decoration: none;
    color: #333;
  }
  .hero-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-top: 4rem;
  }
  .hero-title {
    font-size: 2rem;
    text-transform: uppercase;
    margin-bottom: 1rem;
    text-align: center;
  }
  .title-words > div {
    line-height: 1.2;
  }
  .title-enter-active, .title-leave-active {
    transition: all 0.5s;
  }
  .title-enter {
    opacity: 0;
    transform: translateY(15px);
  }
  .hero-tagline {
    margin: 0.5rem 0;w
    font-size: 1.25rem;
    color: #555;
    text-align: center;
  }
  .hero-button {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    border: none;
    background-color: #2980b9;
    color: #fff;
    cursor: pointer;
    font-size: 1rem;
    transition: background-color 0.3s;
  }
  .hero-button:hover {
    background-color: #1f6692;
  }
  </style>