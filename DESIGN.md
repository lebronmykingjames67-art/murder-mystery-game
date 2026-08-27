# AFTERIMAGE
### A first-person game design document and build prompt
---
## How to use this document
Save this file as `DESIGN.md` in an empty folder. Open Claude Code in that folder and tell it to read the file. Then ask for **Phase 1 only** (see Section 19).
Play it, say what feels wrong, then move to Phase 2.
Do not ask for the whole game in one go. It will be too big and the result will be mushy. One phase at a time gives you something playable within minutes, and each phase adds a layer on top.
Keep `DESIGN.md` in the folder the whole time. Claude Code re-reads it, so it stays on spec instead of drifting as the project grows.
---
## 1. The pitch
You are alone in a machine that stores dead people's memories. Every time you die, the machine keeps a copy of you. On your next run, that copy is standing in your way, using your guns, moving the way you move.
The longer you play, the more the game is made out of you.
---
## 2. Why this one won't get boring
Most games get boring because the enemies never change. This one fixes that in four ways:
1. **Runs are short.** 8 to 15 minutes start to finish. You always have time for "one more".
2. **The enemies are built from your own play.** Every death creates a ghost that copies your route, your favourite gun, and your habits. If you play like a coward who hides in corners, floor 3 fills up with cowards hiding in corners. If you play aggressive, they come at you fast. The game gets harder in exactly the way you are weak to.
3. **Every run rolls a random Anomaly** that changes the physics or the rules (see Section 12).
4. **Every room gives you a choice of upgrades**, so no two runs have the same build.
---
## 3. Setting and story
The Vault was built to store human memories after death. Something went wrong. The system started making copies of everyone who went inside, and it never stopped.
You are a Diver. You go in to pull out one specific memory before the Vault finishes overwriting it. Five floors down, then out.
You will not make it on your first try. That is the point. Each failed attempt leaves a copy of you behind, and the Vault puts that copy to work as security.
**The ending:** the final boss on Floor 5 is called **The First Self**. It is a ghost of your very first run, the clumsy one where you didn't know the controls. It has grown. Beating it lets you leave with the memory. The Vault keeps your copy anyway.
Keep the story light. Show it in short text fragments on walls and in quiet rooms. Nobody wants a cutscene in a 10 minute run.
---
## 4. Core loop
```
Enter floor
  → clear a room of enemies (about 30-60 seconds each)
  → pick 1 of 3 upgrades
  → walk to the next room
  → repeat 4-6 times
  → floor exit
Repeat for 5 floors
  → die, or beat The First Self
On death:
  → your run is recorded as a ghost
  → you keep Fragments (currency) for permanent unlocks
  → start again
```
---
## 5. Controls
| Input | Action |
|---|---|
| W A S D | Move |
| Mouse | Look |
| Left click | Fire |
| Right click | Alt fire / aim |
| Shift | Sprint |
| Ctrl (hold while sprinting) | Slide |
| Space | Jump |
| Q or E | Dash (direction based on movement keys) |
| 1 2 3 | Swap weapon |
| R | Reload / vent heat |
| Esc | Pause, release mouse |
| F | Interact |
Mouse look uses pointer lock. Include a sensitivity slider and an invert-Y toggle in the pause menu. This matters more than it sounds.
---
## 6. Movement feel (use these exact numbers to start)
Movement is the most important part of the whole game. If running around an empty room is fun, the game is fun. Tune this first.
- Walk speed: **8 units/sec**
- Sprint speed: **12 units/sec**
- Air control: 40% of ground control (you can steer in the air, but not fully)
- Gravity: **22 units/sec²** (heavier than real life, feels snappier)
- Jump velocity: **7.5 units/sec**
- Coyote time: **0.1 sec** (you can still jump for a moment after walking off an edge)
- Jump buffer: **0.12 sec** (pressing jump slightly early still works)
- Dash: **18 units/sec for 0.15 sec**, cooldown 2 sec, gives 0.15 sec of invulnerability
- Slide: keeps your sprint speed, decays over 1.2 sec, camera drops to 0.8 height, you can shoot while sliding
- Bunny-hop: if you jump within 0.15 sec of landing, keep 100% of your speed. Let players go fast if they're good.
Camera:
- FOV **90**, kicks to **100** while sprinting, eases back over 0.2 sec
- Slight camera roll (2 degrees) when strafing
- Head bob at low amplitude, disable option in settings
- Screen shake on hits, but keep it under 0.15 sec or people get sick
---
## 7. Weapons
You carry two at a time. Instead of ammo pickups, every gun uses **Charge**. Charge refills when you damage enemies. If you hide, you run dry. This forces you to keep moving forward.
**1. SPLITTER** (starter)
Semi-auto pistol. Bullets ricochet once off walls and split into two smaller bullets on the bounce. Rewards players who learn the geometry of a room.
Damage 18, fire rate 4/sec, charge cost low.
**2. STATIC**
Shotgun. Massive knockback on the *shooter*. Fire it at the floor to rocket-jump. This turns a weapon into a movement tool, which is where the fun is.
Damage 60 close, drops off hard past 8 units. Fire rate 1/sec.
**3. RAIL**
Hold to charge, release to fire a piercing beam through everything in a line. Full charge takes 1.2 sec. Punishes standing still, rewards a good read.
Damage 40 minimum, 130 at full charge.
**4. SEVER**
A blade. No charge cost, ever. Swinging at the right moment reflects incoming projectiles back at whoever fired them. Your always-available fallback.
Damage 45, swing 0.4 sec.
**5. HEX**
Grenade launcher. The blast doesn't do much damage but slows everything inside it to 30% speed for 3 seconds. A crowd-control tool that also makes for great escapes.
**6. CHORUS** (unlockable)
Fires a slow orb. Press fire again to teleport to the orb. High skill ceiling, very satisfying.
---
## 8. The Ghost System (this is the whole game — build it carefully)
### What gets recorded
During every run, sample the player **10 times per second** and store:
- position (x, y, z), rounded to 2 decimals
- yaw and pitch, rounded to 1 decimal
- an event flag when they fire, dash, jump, or swap weapon
Also track summary stats across the whole run:
- favourite weapon (most shots fired)
- average distance kept from enemies
- dashes per minute
- accuracy percentage
- percentage of time spent airborne
- percentage of time spent standing still
### How the ghost plays
A ghost is not a dumb replay. It works in two modes:
**Anchor mode.** The ghost follows your old recorded path exactly, in the room where the recording happened. This is eerie in a good way. You watch a version of yourself run your old route.
**Break mode.** The moment you get within 10 units, or you move somewhere the recording never went, the ghost drops the tape and switches to live AI. That AI is configured by the summary stats above:
- High "average distance kept" → the ghost snipes and backs away from you.
- High "dashes per minute" → the ghost dashes constantly and is hard to hit.
- High "time airborne" → the ghost jumps around and fights from above.
- High "time standing still" → the ghost holds position and lays down suppressing fire.
- Its weapon is your favourite weapon from that run.
- Its accuracy is your accuracy from that run, minus 15% so it stays fair.
This means players who spam one strategy get punished by a mirror of that exact strategy. Players who mix it up face varied ghosts. Both are interesting.
### Presentation
- Ghosts are translucent white with a visible trail of 5 fading copies behind them.
- Each ghost is labelled in small text: **AFTERIMAGE — RUN 07**, and how long that run survived.
- When a ghost is within 20 units, the screen edges glow faintly in its direction.
- A ghost dying plays a distorted version of your own death sound.
### Storage
Keep a maximum of **10 ghosts**. When there are more, drop the one with the lowest score (score = floors reached × 100 + enemies killed).
Save them to `localStorage` under two keys:
```js
localStorage.setItem('afterimage:ghosts', JSON.stringify(ghostArray));
localStorage.setItem('afterimage:meta', JSON.stringify(metaProgress));
```
localStorage caps out around 5MB, which is plenty for 10 trimmed ghosts. If it ever fills up, drop the lowest-scoring ghost and retry the write.
Keep every ghost recording under about 60 seconds of samples (trim to the most interesting stretch) or the save will get bloated. Quantised, 60 seconds at 10Hz is roughly 600 small entries, which is fine.
---
## 9. Regular enemies
You need normal enemies too, or the ghosts stop feeling special.
**MOTE** — small, floats, drifts toward you slowly, dies in one hit. Comes in groups of 6-10. Free charge refills.
**WARDEN** — heavy, has a glowing shield covering its front 120 degrees. Bullets that hit the shield bounce back at you. You have to flank it or bait it into turning.
**WEAVER** — teleports every 3 seconds and drops a small turret each time. Ignore it and the room fills with turrets. Forces you to prioritise.
**HOLLOW** — copies *your* movement inputs on a 1.5 second delay. If you strafe left, it strafes left a moment later. Fun to fight because you can trick it.
**SIREN** — does no damage at all. It screams, and the scream pulls every ghost in the level toward your position. Kill it fast or the run becomes a nightmare.
**COLLECTOR** — runs away from you and eats the upgrade drop at the end of the room if it survives. Creates urgency.
---
## 10. Level generation
Do not generate rooms from pure noise. It always looks like garbage. Use **hand-made chunks stitched together**.
Build a library of about 14 room shapes. Each is a small hand-placed arrangement of boxes, ramps, pillars and gaps, roughly 40×40 units, with door sockets tagged North, South, East and West.
Floor generation:
1. Place a start room.
2. Random walk 4 to 6 rooms, matching door sockets.
3. Guarantee one **Silence** room and one **Archive** room per floor.
4. Place the exit at the end.
Room types:
- **Combat** — a wave of enemies, doors lock until clear.
- **Gauntlet** — no enemies, a movement challenge with gaps and moving platforms. Gives breathing room.
- **Silence** — empty, dim, a wall fragment of story, a small heal. Pacing matters.
- **Archive** — choose 1 of 3 upgrades.
- **Collapse** — the floor falls away behind you and you have 20 seconds to reach the exit. One per floor at most.
Floor 5 is a single hand-built arena for the boss.
---
## 11. Upgrades ("Echoes")
Pick 1 of 3 in every Archive room. Aim for 24 of them. They should change how you play, not just add 10% damage.
Examples:
- **Fracture** — your bullets split into 3 after travelling 15 units.
- **Vampire** — killing an enemy within 3 units heals 8 HP.
- **Momentum** — damage scales with your current speed, up to +80%.
- **Second Wind** — the first time you would die each floor, you survive on 1 HP and time slows for 2 seconds.
- **Loud** — +40% damage but enemies always know where you are.
- **Silent Step** — enemies only notice you within 15 units, but your damage drops 20%.
- **Echo Chamber** — every 5th shot fires a free duplicate.
- **Debt** — instantly gain 3 random upgrades, but your max HP is halved.
- **Recursion** — when you kill a ghost, you take that ghost's weapon.
- **Kinetic** — dashing through an enemy deals 40 damage and refills your dash.
- **Cold Start** — you deal double damage for the first 10 seconds of every room.
- **Overclock** — your charge refills over time, but your max charge is 40% lower.
Tag each one with a synergy word (SPEED, BLOOD, RISK, PRECISION) and make combinations feel good. If a player picks three SPEED echoes, they should feel obviously and stupidly fast.
---
## 12. Anomalies (rolled once at the start of each run)
Shown on screen as a short line of text before you enter. This is what makes run 40 feel different from run 4.
- **LOW TIDE** — gravity halved, everything floats, fights become aerial.
- **STARVED** — ghosts move 30% faster but have 60% health.
- **BLACKOUT** — you can only see 12 units ahead. Muzzle flashes briefly light the room.
- **MIRROR** — the entire level is flipped left to right. Your muscle memory is useless.
- **QUIET** — no sound at all. Enemies flash white a moment before attacking instead.
- **SWARM** — twice as many enemies, all with half health.
- **BOUNTY** — double Fragments, but you have one life and no revives.
- **CROWDED** — every ghost you have ever made is in the level at once. Rare. Terrifying. Great.
---
## 13. Meta progression
Currency is **Fragments**, earned per run whether you win or lose. Between runs, spend them on:
- New starting weapons (unlock CHORUS, etc.)
- Starting perks (begin with +20 max HP, or begin with 1 random Echo)
- **Purge a ghost.** Costs a lot. Deletes one specific ghost from the Vault forever. Give the player a way to erase the version of themselves that keeps killing them. This is the best button in the game and it should feel expensive.
- Cosmetic colours for your trail
Keep the total unlock list to about 15 things so it can actually be finished.
---
## 14. Art direction
This look is deliberately cheap to build and still looks sharp.
- Pure black background with fog.
- All geometry is untextured boxes and planes with **glowing edge lines** (wireframe overlays on solid dark surfaces).
- One accent colour per floor: Floor 1 cyan, Floor 2 amber, Floor 3 magenta, Floor 4 acid green, Floor 5 white with red.
- Enemies are simple shapes with emissive outlines. Motes are small octahedrons, Wardens are wide slabs, Weavers are spinning tetrahedrons.
- Ghosts are white, translucent, with a trailing afterimage.
- Add a subtle scanline and chromatic aberration on damage.
- No textures needed anywhere. This is a style, not a shortcut, and it will look intentional.
---
## 15. Audio
Generate everything with the Web Audio API. No sound files.
- Shots: short filtered noise burst with a fast lowpass sweep down.
- Rail charge: rising sine, held, then a sharp click on release.
- Ghost nearby: a low sine that rises in pitch as it gets closer. This is your radar.
- Low health: slow heartbeat, muffles the rest of the mix.
- Ambient: a very quiet drone that shifts key on each floor.
- Ghost death: your own death sound, pitched down and reversed.
---
## 16. HUD
Keep it almost empty.
- Health as a thin ring around the crosshair. It drains clockwise.
- Charge as a small arc under the crosshair.
- Current weapon name in small text, bottom right, fades out after 2 seconds.
- Ghost proximity as a soft glow at the screen edge, in the direction of the nearest ghost.
- Floor and room number top left, tiny.
- No minimap. Getting slightly lost is fine in rooms this small.
---
## 17. Pacing and difficulty
- Floor 1: 3 rooms, no ghosts, very easy. Teach the movement.
- Floor 2: 4 rooms, 1 ghost, introduce Wardens.
- Floor 3: 5 rooms, 2 ghosts, introduce Weavers and the first Collapse room.
- Floor 4: 5 rooms, 3 ghosts, Sirens appear. This is where most runs end.
- Floor 5: boss arena.
The boss, **The First Self**, has three phases. Phase 1 it uses your first run's weapon. Phase 2 it splits into three weaker copies from three different runs. Phase 3 it uses your *best* run's stats and moves like your best self. Fighting your own peak is the whole point of the game.
---
## 18. Technical build spec
- **Vite + vanilla JavaScript.** `npm create vite@latest`. No framework. A game loop does not need React.
- **Latest three.js** from npm (`npm install three`). Use ES module imports.
- **Split into modules** from the start, not one giant file:
```
src/
  main.js          entry point, game loop, fixed timestep
  config.js        every tuning number from Section 6
  player/
    controller.js  movement, dash, slide, bunny-hop
    camera.js      FOV kick, roll, bob, shake
    collision.js   capsule vs AABB sweep
  weapons/
  enemies/
  ghosts/
    recorder.js
    replayer.js
    behaviour.js
  level/
    chunks.js      the hand-made room library
    generator.js
  audio/
  ui/
```
- **Pointer Lock API** for mouse look, with a click-to-start overlay.
- **Fixed timestep physics at 60Hz**, with rendering decoupled. Accumulate delta time so movement is consistent on any monitor.
- **Collision:** treat the player as a capsule (a cylinder with a sphere on each end) and the world as axis-aligned boxes. Write the sweep test manually. Resolve on each axis separately. This avoids getting stuck on corners.
- **Object pooling** for bullets, particles and enemies. Never allocate during gameplay.
- **Persistence:** `localStorage`, wrapped in try/catch. Version the save data (`{version: 1, ...}`) so a later change to the ghost format does not crash on old saves.
- **Performance target:** 60fps with 40 enemies, 200 bullets and 3 ghosts on screen. Cap total scene objects around 800.
- Include a **reset progress** button in the settings menu.
- Every tuning number from Section 6 lives in `config.js` so it can be changed in one place.
- Add a **dev overlay** toggled with backtick: FPS, draw calls, entity counts, player speed, and live sliders bound to the config values. Being able to tune movement without restarting saves hours.
- Commit after each phase so you can roll back a change that ruins the feel.
---
## 19. Build phases — ask for these one at a time
**Phase 1 — Movement.** One grey test room with ramps, gaps and pillars. Full movement from Section 6. No enemies, no shooting. Play it for five minutes and tell Claude what feels off.
**Phase 2 — Combat.** The Splitter and the Static. Motes and Wardens. Health, charge, damage numbers, screen shake.
**Phase 3 — Rooms.** The chunk library and floor generation. Doors that lock during combat. Floor progression and a death screen.
**Phase 4 — Ghosts.** Recording, saving to `window.storage`, replay, the anchor/break AI. This is the big one. Give it a whole conversation.
**Phase 5 — Variety.** Echoes, Archive rooms, Anomalies, remaining weapons and enemies.
**Phase 6 — Polish.** Meta progression, the boss, audio, HUD, settings, story fragments.
---
## 20. The exact message to send for Phase 1
Copy this after pasting the document:
> Read DESIGN.md, then build **Phase 1** of AFTERIMAGE. Set up a Vite project with three.js from npm, using the module layout in Section 18. Pointer lock first-person controls.
>
> Include only: walking, sprinting, jumping with coyote time and jump buffering, dashing, sliding, bunny-hop speed retention, and the camera behaviour from Section 6. Use the exact numbers given. Put every tuning value in `config.js`.
>
> Build one grey test room about 80×80 units with: a set of stairs, three gaps of increasing width to jump across, a low tunnel that requires sliding, four pillars to strafe around, and a raised platform reachable only by dashing mid-jump.
>
> Use the art direction from Section 14 — black background, fog, dark surfaces with glowing cyan edge lines.
>
> Add the dev overlay (backtick to toggle) with current speed, grounded state, dash cooldown, and live sliders for the movement values in config.js. No enemies, no shooting, no UI beyond that.
>
> Write the collision by hand: capsule against axis-aligned boxes, resolved one axis at a time, running on a fixed 60Hz timestep.
---
## 21. If you get bored later, add these
- **Daily run.** Same seed and same anomaly for everyone that day.
- **Ghost sharing.** Export a ghost as a short code string and paste a friend's ghost into your Vault. Fighting a stranger's play style is a great feature.
- **Endless mode.** Floors keep going after 5, difficulty keeps climbing.
- **Speedrun timer** with splits per floor.
- **A curse system.** Take a permanent debuff at the start for a large Fragment bonus.
---
## 22. Three other directions, if this one isn't your thing
- **Echo** — first person with no visuals at all except sound made visible. You see the world only where sound bounces. Every footstep lights up the walls near you, but noise also draws the things hunting you.
- **Nightshift** — first-person job simulator in a building where one small thing is wrong every night. Your only job is to spot what changed and report it. Wrong answers have consequences. Cheap to build, deeply unsettling.
- **Ninety Seconds** — first-person heist where each attempt lasts 90 seconds and your previous attempt plays back alongside you, so a five-person robbery is really you, five times over, cooperating with yourself.
