/**
 * Full-screen end-of-run screen (DESIGN.md Section 19's Phase 3 ask): shown
 * either on death (which floor the run ended on) or on clearing Floor 5 (a
 * stand-in "run complete" until Phase 6's real boss/ending), then an
 * auto-reset back to Floor 1.
 */
export function createDeathScreen() {
  const root = document.createElement('div')
  root.id = 'death-screen'
  root.className = 'hidden'
  root.innerHTML = `
    <h1 class="death-title"></h1>
    <p class="death-floor"></p>
    <p class="death-hint"></p>
  `
  document.body.appendChild(root)
  const titleEl = root.querySelector('.death-title')
  const floorEl = root.querySelector('.death-floor')
  const hintEl = root.querySelector('.death-hint')

  function showDeath(floorReached) {
    root.classList.remove('victory')
    titleEl.textContent = 'YOU DIED'
    floorEl.textContent = `REACHED FLOOR ${floorReached}`
    hintEl.textContent = "the vault keeps what's left of you"
    root.classList.remove('hidden')
  }

  function showVictory() {
    root.classList.add('victory')
    titleEl.textContent = 'RUN COMPLETE'
    floorEl.textContent = 'ALL 5 FLOORS CLEARED'
    hintEl.textContent = 'the real ending waits for Phase 6'
    root.classList.remove('hidden')
  }

  function hide() {
    root.classList.add('hidden')
  }

  return { showDeath, showVictory, hide }
}
