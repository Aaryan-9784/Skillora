/**
 * Utility to generate a dynamic, animated fallback video stream via HTML5 Canvas.
 * Used when a physical webcam is locked by another browser tab or process (e.g. multi-tab testing on Windows).
 */
export const createVirtualVideoStream = (userName = "User") => {
  const canvas = document.createElement("canvas");
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext("2d");

  let frame = 0;
  let active = true;

  const stream = canvas.captureStream(30);
  const track = stream.getVideoTracks()[0];

  const draw = () => {
    if (!active) return;
    frame++;

    // Sleek dark gradient background
    const grad = ctx.createRadialGradient(640, 360, 50, 640, 360, 720);
    grad.addColorStop(0, "#1e1b4b");
    grad.addColorStop(0.6, "#0f172a");
    grad.addColorStop(1, "#020617");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1280, 720);

    // Animated glowing orb / ring
    ctx.save();
    ctx.beginPath();
    const ringRadius = 140 + Math.sin(frame * 0.05) * 8;
    ctx.arc(640, 290, ringRadius, 0, Math.PI * 2);
    ctx.strokeStyle = `hsl(${(frame * 1.5) % 360}, 80%, 65%)`;
    ctx.lineWidth = 8;
    ctx.shadowBlur = 30;
    ctx.shadowColor = `hsl(${(frame * 1.5) % 360}, 80%, 65%)`;
    ctx.stroke();
    ctx.restore();

    // Center avatar circle
    ctx.save();
    ctx.beginPath();
    ctx.arc(640, 290, 130, 0, Math.PI * 2);
    ctx.fillStyle = "#4338ca";
    ctx.fill();

    // Avatar initials
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 80px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    const initials = userName
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || "U";
    ctx.fillText(initials, 640, 295);
    ctx.restore();

    // Participant Name
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 36px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(userName, 640, 480);

    // Live Badge pill
    ctx.save();
    ctx.fillStyle = "rgba(34, 197, 94, 0.2)";
    ctx.strokeStyle = "rgba(34, 197, 94, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (typeof ctx.roundRect === "function") {
      ctx.roundRect(500, 515, 280, 42, 21);
    } else {
      ctx.rect(500, 515, 280, 42);
    }
    ctx.fill();
    ctx.stroke();

    // Pulsing green dot
    ctx.fillStyle = "#22c55e";
    ctx.beginPath();
    ctx.arc(525, 536, 6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#86efac";
    ctx.font = "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "left";
    ctx.fillText("LIVE VIDEO STREAM", 540, 542);
    ctx.restore();

    // Animated sound equalizer bars at bottom
    ctx.save();
    const barCount = 15;
    const totalWidth = 300;
    const startX = 640 - totalWidth / 2;
    for (let i = 0; i < barCount; i++) {
      const h = 15 + Math.abs(Math.sin(frame * 0.1 + i * 0.4)) * 35;
      const x = startX + i * 20;
      ctx.fillStyle = "rgba(129, 140, 248, 0.85)";
      ctx.fillRect(x, 615 - h / 2, 8, h);
    }
    ctx.restore();

    if (track && typeof track.requestFrame === "function") {
      try {
        track.requestFrame();
      } catch (err) {}
    }
  };

  draw();

  let worker = null;
  let fallbackTimer = null;

  try {
    const workerBlob = new Blob([
      `let intervalId;
      self.onmessage = function(e) {
        if (e.data === 'start') {
          intervalId = setInterval(() => self.postMessage('tick'), 1000 / 30);
        } else if (e.data === 'stop') {
          if (intervalId) clearInterval(intervalId);
        }
      };`
    ], { type: "application/javascript" });
    const workerUrl = URL.createObjectURL(workerBlob);
    worker = new Worker(workerUrl);
    worker.onmessage = () => {
      draw();
    };
    worker.postMessage("start");
  } catch (e) {
    fallbackTimer = setInterval(draw, 1000 / 30);
  }

  if (track) {
    const originalStop = track.stop.bind(track);
    track.stop = () => {
      active = false;
      if (worker) {
        try {
          worker.postMessage("stop");
          worker.terminate();
        } catch (err) {}
      }
      if (fallbackTimer) clearInterval(fallbackTimer);
      originalStop();
    };
  }

  return stream;
};
