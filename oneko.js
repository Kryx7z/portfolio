/*
 * Oneko.js integration for Kryx.lol
 * Based on: https://github.com/adryd325/oneko.js
 * Licensed under the MIT License.
 *
 * This copy is intentionally kept local so the behaviour can be customised.
 * The official Oneko sprite is loaded from the upstream repository.
 */
(function oneko() {
  // Always run, including the <3 preload screen and while modals are open.
  // The original script can stop for prefers-reduced-motion; this site wants
  // the cat to remain present, so that early return is intentionally omitted.

  const nekoEl = document.createElement("div");
  const nekoFile = "https://raw.githubusercontent.com/adryd325/oneko.js/14bab15a755d0e35cd4ae19c931d96d306f99f42/oneko.gif";

  let nekoPosX = 32;
  let nekoPosY = 32;
  let mousePosX = 32;
  let mousePosY = 32;
  let frameCount = 0;
  let idleTime = 0;
  let idleAnimation = null;
  let idleAnimationFrame = 0;
  let lastFrameTimestamp;

  const nekoSpeed = 10;
  const spriteSets = {
    idle: [[-3, -3]],
    alert: [[-7, -3]],
    scratchSelf: [[-5, 0], [-6, 0], [-7, 0]],
    scratchWallN: [[0, 0], [0, -1]],
    scratchWallS: [[-7, -1], [-6, -2]],
    scratchWallE: [[-2, -2], [-2, -3]],
    scratchWallW: [[-4, 0], [-4, -1]],
    tired: [[-3, -2]],
    sleeping: [[-2, 0], [-2, -1]],
    N: [[-1, -2], [-1, -3]],
    NE: [[0, -2], [0, -3]],
    E: [[-3, 0], [-3, -1]],
    SE: [[-5, -1], [-5, -2]],
    S: [[-6, -3], [-7, -2]],
    SW: [[-5, -3], [-6, -1]],
    W: [[-4, -2], [-4, -3]],
    NW: [[-1, 0], [-1, -1]],
  };

  function init() {
    const storedNeko = JSON.parse(window.localStorage.getItem("oneko") || "null");
    if (storedNeko) {
      nekoPosX = storedNeko.nekoPosX ?? nekoPosX;
      nekoPosY = storedNeko.nekoPosY ?? nekoPosY;
      mousePosX = storedNeko.mousePosX ?? mousePosX;
      mousePosY = storedNeko.mousePosY ?? mousePosY;
      frameCount = storedNeko.frameCount ?? frameCount;
      idleTime = storedNeko.idleTime ?? idleTime;
      idleAnimation = storedNeko.idleAnimation ?? idleAnimation;
      idleAnimationFrame = storedNeko.idleAnimationFrame ?? idleAnimationFrame;
      nekoEl.style.backgroundPosition = storedNeko.bgPos || "";
    }

    nekoEl.id = "oneko";
    nekoEl.setAttribute("aria-hidden", "true");
    Object.assign(nekoEl.style, {
      width: "32px",
      height: "32px",
      position: "fixed",
      pointerEvents: "none",
      imageRendering: "pixelated",
      left: `${nekoPosX - 16}px`,
      top: `${nekoPosY - 16}px`,
      zIndex: "2147483647",
      backgroundImage: `url(${nekoFile})`,
      backgroundRepeat: "no-repeat",
      display: "block",
      opacity: "0",
      transition: "opacity 4s ease",
    });

    document.body.appendChild(nekoEl);

    // Keep the cat hidden during preload, then fade it in together with #hidden.
    const revealNeko = () => {
      nekoEl.style.display = "block";
      nekoEl.style.opacity = "0";
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          nekoEl.style.opacity = "1";
        });
      });
    };

    const preload = document.getElementById("preload");
    if (preload) {
      // The same mousedown that reveals the main scene also starts Neko's fade.
      document.addEventListener("mousedown", revealNeko, { once: true, passive: true });
    } else {
      revealNeko();
    }

    document.addEventListener("mousemove", (event) => {
      mousePosX = event.clientX;
      mousePosY = event.clientY;
    }, { passive: true });

    window.addEventListener("beforeunload", () => {
      window.localStorage.setItem("oneko", JSON.stringify({
        nekoPosX,
        nekoPosY,
        mousePosX,
        mousePosY,
        frameCount,
        idleTime,
        idleAnimation,
        idleAnimationFrame,
        bgPos: nekoEl.style.backgroundPosition,
      }));
    });

    window.requestAnimationFrame(onAnimationFrame);
  }

  function onAnimationFrame(timestamp) {
    if (!nekoEl.isConnected) return;

    if (!lastFrameTimestamp) lastFrameTimestamp = timestamp;
    if (timestamp - lastFrameTimestamp > 100) {
      lastFrameTimestamp = timestamp;
      frame();
    }

    window.requestAnimationFrame(onAnimationFrame);
  }

  function setSprite(name, frame) {
    const sprite = spriteSets[name][frame % spriteSets[name].length];
    nekoEl.style.backgroundPosition = `${sprite[0] * 32}px ${sprite[1] * 32}px`;
  }

  function resetIdleAnimation() {
    idleAnimation = null;
    idleAnimationFrame = 0;
  }

  function idle() {
    idleTime += 1;

    if (
      idleTime > 10 &&
      Math.floor(Math.random() * 200) === 0 &&
      idleAnimation == null
    ) {
      const availableIdleAnimations = ["sleeping", "scratchSelf"];
      if (nekoPosX < 32) availableIdleAnimations.push("scratchWallW");
      if (nekoPosY < 32) availableIdleAnimations.push("scratchWallN");
      if (nekoPosX > window.innerWidth - 32) availableIdleAnimations.push("scratchWallE");
      if (nekoPosY > window.innerHeight - 32) availableIdleAnimations.push("scratchWallS");

      idleAnimation = availableIdleAnimations[
        Math.floor(Math.random() * availableIdleAnimations.length)
      ];
    }

    switch (idleAnimation) {
      case "sleeping":
        if (idleAnimationFrame < 8) {
          setSprite("tired", 0);
          break;
        }
        setSprite("sleeping", Math.floor(idleAnimationFrame / 4));
        if (idleAnimationFrame > 192) resetIdleAnimation();
        break;
      case "scratchWallN":
      case "scratchWallS":
      case "scratchWallE":
      case "scratchWallW":
      case "scratchSelf":
        setSprite(idleAnimation, idleAnimationFrame);
        if (idleAnimationFrame > 9) resetIdleAnimation();
        break;
      default:
        setSprite("idle", 0);
        return;
    }

    idleAnimationFrame += 1;
  }

  function frame() {
    frameCount += 1;

    const diffX = nekoPosX - mousePosX;
    const diffY = nekoPosY - mousePosY;
    const distance = Math.sqrt(diffX ** 2 + diffY ** 2);

    if (distance < nekoSpeed || distance < 48) {
      idle();
      return;
    }

    idleAnimation = null;
    idleAnimationFrame = 0;

    if (idleTime > 1) {
      setSprite("alert", 0);
      idleTime = Math.min(idleTime, 7);
      idleTime -= 1;
      return;
    }

    let direction = "";
    direction = diffY / distance > 0.5 ? "N" : "";
    direction += diffY / distance < -0.5 ? "S" : "";
    direction += diffX / distance > 0.5 ? "W" : "";
    direction += diffX / distance < -0.5 ? "E" : "";

    setSprite(direction, frameCount);

    nekoPosX -= (diffX / distance) * nekoSpeed;
    nekoPosY -= (diffY / distance) * nekoSpeed;

    nekoPosX = Math.min(Math.max(16, nekoPosX), window.innerWidth - 16);
    nekoPosY = Math.min(Math.max(16, nekoPosY), window.innerHeight - 16);

    nekoEl.style.left = `${nekoPosX - 16}px`;
    nekoEl.style.top = `${nekoPosY - 16}px`;
  }

  init();
})();
