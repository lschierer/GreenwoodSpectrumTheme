---
title: Greenwood Spectrum Theme Pack
imports:
  - /components/logo/logo.js type="module"
---
<style>
  :root {
    --font-primary: system-ui, -apple-system, BlinkMacSystemFont, "Segoe U", Roboto, Oxygen,
      Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
  }
  body {
    font-family: var(--font-primary);
    margin: 0;
    overflow: hidden;
  }
  main {
    max-width: 1280px;
    margin: 0 auto;
    padding: 2rem;
    text-align: center;
  }
  ul {
    list-style-type: none;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
  }
  .card {
    margin: 5px auto;
    padding: 1rem;
    height: 125px;
    vertical-align: text-top;
    border-radius: 1rem;
    color: #edefec;
    background-image: linear-gradient(to top left, #020202, #2e3440);
  }
  a,
  a:visited,
  a:hover {
    color: #edefec;
    text-decoration: underline;
  }
  h2 {
    text-decoration: underline;
  }
  @media (min-width: 768px) {
    .card {
      display: inline-block;
      width: 40%;
    }
  }
  x-logo {
    display: block;
    min-height: 100px;
    margin-bottom: 125px;
  }
</style>
# Welcome to Greenwood!

<x-logo></x-logo>

This is an example landing page.
