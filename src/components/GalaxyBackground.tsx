import React, { useEffect, useRef } from 'react';

export const GalaxyBackground: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl =
      canvas.getContext('webgl', {
        antialias: false,
        alpha: false,
        powerPreference: 'high-performance',
      }) ||
      (canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      console.warn('WebGL is not available on this device.');
      return;
    }

    const webgl = gl as WebGLRenderingContext;

    const reducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)'
    ).matches;

    // ---------------------------------------------------------
    // VERTEX SHADER
    // ---------------------------------------------------------
    const vertexShaderSource = `
      attribute vec2 aPosition;
      void main() {
        gl_Position = vec4(aPosition, 0.0, 1.0);
      }
    `;

    // ---------------------------------------------------------
    // FRAGMENT SHADER
    // ---------------------------------------------------------
    const fragmentShaderSource = `
      precision highp float;

      uniform float uTime;
      uniform vec2 uResolution;
      uniform vec2 uMouse;
      uniform float uClickPulse;
      uniform vec2 uClickPos;

      // -------------------------------------------------------
      // HASH FUNCTIONS
      // -------------------------------------------------------
      float hash21(vec2 p) {
        p = fract(p * vec2(123.34, 456.21));
        p += dot(p, p + 45.32);
        return fract(p.x * p.y);
      }

      float hash12(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
      }

      // -------------------------------------------------------
      // NOISE & FBM
      // -------------------------------------------------------
      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);

        float a = hash12(i);
        float b = hash12(i + vec2(1.0, 0.0));
        float c = hash12(i + vec2(0.0, 1.0));
        float d = hash12(i + vec2(1.0, 1.0));

        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;

        value += noise(p) * amplitude;
        p *= 2.02;
        amplitude *= 0.5;

        value += noise(p) * amplitude;
        p *= 2.03;
        amplitude *= 0.5;

        value += noise(p) * amplitude;
        p *= 2.01;
        amplitude *= 0.5;

        value += noise(p) * amplitude;
        return value;
      }

      // -------------------------------------------------------
      // STAR FIELD (Multi-Depth with Twinkle)
      // -------------------------------------------------------
      float starField(
        vec2 uv,
        float density,
        float threshold,
        float brightness,
        float timeOffset,
        float speedMult
      ) {
        vec2 grid = floor(uv * density);
        vec2 cell = fract(uv * density);

        float random = hash21(grid);
        float star = step(threshold, random);

        vec2 starPosition = vec2(
          hash21(grid + 13.7),
          hash21(grid + 71.3)
        );

        float d = length(cell - starPosition);
        float size = 0.022 + hash21(grid + 41.2) * 0.075;

        float glow = 1.0 - smoothstep(0.0, size, d);

        // Independent organic twinkle
        float twinkle = 0.70 + 0.30 * sin(timeOffset * 2.8 * speedMult + random * 35.0);

        return star * glow * twinkle * brightness;
      }

      // -------------------------------------------------------
      // PROCEDURAL GALAXY SHAPE
      // -------------------------------------------------------
      float galaxyShape(vec2 p, float rotation) {
        float angle = atan(p.y, p.x);
        float radius = length(p);

        // Dynamic multi-arm logarithmic spiral
        float spiral1 = sin(angle * 4.0 - radius * 7.0 + rotation);
        float spiral2 = sin(angle * 7.0 + radius * 10.5 - rotation * 0.75);
        float spiral3 = sin(angle * 2.0 - radius * 4.2 + rotation * 1.2);

        float arms = smoothstep(-0.20, 0.85, spiral1);
        float secondaryArms = smoothstep(0.18, 0.90, spiral2);
        float minorArms = smoothstep(0.30, 0.95, spiral3);

        float disk = exp(-radius * 1.45);
        float core = exp(-radius * 6.5);

        return (arms * disk * 0.75) +
               (secondaryArms * disk * 0.22) +
               (minorArms * disk * 0.12) +
               core;
      }

      // -------------------------------------------------------
      // MAIN SHADER
      // -------------------------------------------------------
      void main() {
        // Correct aspect ratio
        vec2 uv = (gl_FragCoord.xy * 2.0 - uResolution.xy) / min(uResolution.x, uResolution.y);
        vec2 p = uv;

        // Mouse Parallax (smooth depth offset)
        vec2 mouse = uMouse * 0.16;
        p += mouse;

        float time = uTime * 0.055;
        float rotation = time * 0.9;

        // Spatial Cosmic Palette
        vec3 deepCosmos = vec3(0.008, 0.001, 0.020);
        vec3 cosmicPurple = vec3(0.065, 0.012, 0.145);
        vec3 violetGlow   = vec3(0.380, 0.090, 0.780);
        vec3 electricMagenta = vec3(0.720, 0.160, 0.980);
        vec3 solarPink    = vec3(0.950, 0.140, 0.650);
        vec3 plasmaBlue   = vec3(0.090, 0.240, 0.980);
        vec3 coreWhite    = vec3(0.960, 0.920, 1.000);

        vec3 color = deepCosmos;

        // -----------------------------------------------------
        // DEEP SPACE GRADIENT
        // -----------------------------------------------------
        float distFromCenter = length(p);
        float spaceGradient = 1.0 - smoothstep(0.0, 2.2, distFromCenter);
        color += cosmicPurple * spaceGradient * 0.75;

        // -----------------------------------------------------
        // DEEP COSMIC NEBULA (Multi-layer FBM)
        // -----------------------------------------------------
        vec2 nebulaUV = p * 1.25;
        nebulaUV.x += time * 0.022;
        nebulaUV.y -= time * 0.014;

        float n1 = fbm(nebulaUV);
        float n2 = fbm(nebulaUV * 2.1 + vec2(4.7, -2.3));
        float n3 = fbm(nebulaUV * 4.0 - vec2(-1.5, 3.2) + time * 0.01);
        float nebula = n1 * n2 + n3 * 0.25;

        float nebulaMask = exp(-distFromCenter * 0.65);
        vec3 nebulaTint = mix(violetGlow, electricMagenta, n1);
        nebulaTint = mix(nebulaTint, plasmaBlue, n2 * 0.4);

        color += nebulaTint * nebula * nebulaMask * 0.85;

        // -----------------------------------------------------
        // PROCEDURAL SPIRAL GALAXY
        // -----------------------------------------------------
        float galaxy = galaxyShape(p, rotation);
        float galaxyNoise = fbm(p * 3.4 + time * 0.075);
        galaxy *= (0.75 + galaxyNoise * 0.50);

        float colorMix = smoothstep(-0.85, 0.95, p.y);
        vec3 galaxyColor = mix(plasmaBlue, violetGlow, colorMix);
        galaxyColor = mix(galaxyColor, solarPink, galaxyNoise * 0.28);

        color += galaxyColor * galaxy * 0.82;

        // -----------------------------------------------------
        // DUST LANES & DARK FILAMENTS
        // -----------------------------------------------------
        float dust = fbm(p * 5.2 - time * 0.030);
        float dustMask = smoothstep(0.32, 0.74, dust) * exp(-distFromCenter * 1.10);
        color += electricMagenta * dustMask * 0.20;

        // -----------------------------------------------------
        // GALACTIC CORE GLOW
        // -----------------------------------------------------
        float core = exp(-distFromCenter * 5.6);
        float coreGlow = exp(-distFromCenter * 2.2);
        color += violetGlow * coreGlow * 0.75;
        color += coreWhite * core * 1.95;

        // -----------------------------------------------------
        // MOUSE FOLLOWER LIGHT & INTERACTION
        // -----------------------------------------------------
        float mouseDist = distance(uv, uMouse * 1.55);
        float mouseAura = exp(-mouseDist * 2.4);
        color += electricMagenta * mouseAura * 0.12;
        color += plasmaBlue * exp(-mouseDist * 4.8) * 0.08;

        // -----------------------------------------------------
        // CLICK SHOCKWAVE PULSE
        // -----------------------------------------------------
        if (uClickPulse > 0.001) {
          float clickDist = distance(uv, uClickPos);
          float ringDist = abs(clickDist - (1.0 - uClickPulse) * 1.8);
          float ringGlow = exp(-ringDist * 18.0) * uClickPulse;
          color += mix(electricMagenta, coreWhite, 0.6) * ringGlow * 0.65;
        }

        // -----------------------------------------------------
        // MULTI-LAYER STAR FIELD WITH TWINKLE & PARALLAX
        // -----------------------------------------------------
        float stars1 = starField(uv + time * 0.003 + mouse * 0.05, 80.0,  0.970, 0.80, uTime, 1.0);
        float stars2 = starField(uv - time * 0.006 + mouse * 0.10, 140.0, 0.981, 0.60, uTime, 1.4);
        float stars3 = starField(uv + time * 0.011 + mouse * 0.15, 220.0, 0.988, 0.45, uTime, 1.8);
        float stars4 = starField(uv - time * 0.016 + mouse * 0.22, 340.0, 0.993, 0.30, uTime, 2.2);

        float allStars = stars1 + stars2 + stars3 + stars4;
        vec3 starTint = mix(vec3(0.70, 0.80, 1.0), vec3(1.0, 0.75, 0.95), n1);
        color += starTint * allStars;

        // -----------------------------------------------------
        // DISTANT PROMINENT CELESTIAL BODIES
        // -----------------------------------------------------
        vec2 starPosA = vec2(-0.72, 0.58);
        float distStarA = length(uv - starPosA);
        color += vec3(0.75, 0.55, 1.0) * exp(-distStarA * 5.5) * 0.10;
        color += vec3(0.98, 0.90, 1.0) * exp(-distStarA * 32.0) * 0.80;

        vec2 starPosB = vec2(0.85, -0.45);
        float distStarB = length(uv - starPosB);
        color += plasmaBlue * exp(-distStarB * 4.5) * 0.08;
        color += coreWhite * exp(-distStarB * 28.0) * 0.65;

        // -----------------------------------------------------
        // CINEMATOGRAPHIC VIGNETTE
        // -----------------------------------------------------
        float vignette = smoothstep(2.1, 0.30, distFromCenter);
        color *= (0.42 + vignette * 0.76);

        // -----------------------------------------------------
        // ULTRA-PREMIUM VIOLET/MAGENTA COLOR GRADING
        // -----------------------------------------------------
        float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
        color = mix(vec3(luminance), color, 1.32);

        // Soft cinematic HDR tone mapping
        color = color / (color + vec3(0.92));

        // Gamma adjustment for deep rich cosmic contrast
        color = pow(color, vec3(0.86));

        gl_FragColor = vec4(color, 1.0);
      }
    `;

    // ---------------------------------------------------------
    // SHADER CREATION
    // ---------------------------------------------------------
    const createShader = (type: number, source: string) => {
      const shader = webgl.createShader(type);
      if (!shader) throw new Error('Could not create shader');
      webgl.shaderSource(shader, source);
      webgl.compileShader(shader);
      if (!webgl.getShaderParameter(shader, webgl.COMPILE_STATUS)) {
        const info = webgl.getShaderInfoLog(shader);
        webgl.deleteShader(shader);
        throw new Error(info || 'Error compiling shader');
      }
      return shader;
    };

    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;

    try {
      const vertexShader = createShader(webgl.VERTEX_SHADER, vertexShaderSource);
      const fragmentShader = createShader(webgl.FRAGMENT_SHADER, fragmentShaderSource);

      program = webgl.createProgram();
      if (!program) throw new Error('Could not create WebGL program');

      webgl.attachShader(program, vertexShader);
      webgl.attachShader(program, fragmentShader);
      webgl.linkProgram(program);

      if (!webgl.getProgramParameter(program, webgl.LINK_STATUS)) {
        throw new Error(webgl.getProgramInfoLog(program) || 'Error linking WebGL');
      }

      webgl.useProgram(program);

      // Fullscreen Triangle
      buffer = webgl.createBuffer();
      if (!buffer) throw new Error('Could not create buffer');
      webgl.bindBuffer(webgl.ARRAY_BUFFER, buffer);
      webgl.bufferData(
        webgl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        webgl.STATIC_DRAW
      );

      const positionLocation = webgl.getAttribLocation(program, 'aPosition');
      webgl.enableVertexAttribArray(positionLocation);
      webgl.vertexAttribPointer(positionLocation, 2, webgl.FLOAT, false, 0, 0);

      // Uniforms
      const timeLocation = webgl.getUniformLocation(program, 'uTime');
      const resolutionLocation = webgl.getUniformLocation(program, 'uResolution');
      const mouseLocation = webgl.getUniformLocation(program, 'uMouse');
      const clickPulseLocation = webgl.getUniformLocation(program, 'uClickPulse');
      const clickPosLocation = webgl.getUniformLocation(program, 'uClickPos');

      // Resize handler
      const resize = () => {
        const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
        const width = Math.max(1, Math.floor(window.innerWidth * dpr));
        const height = Math.max(1, Math.floor(window.innerHeight * dpr));

        canvas.width = width;
        canvas.height = height;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;

        webgl.viewport(0, 0, width, height);
      };

      resize();
      window.addEventListener('resize', resize);

      // Pointer / Mouse Parallax
      let targetMouseX = 0;
      let targetMouseY = 0;
      let mouseX = 0;
      let mouseY = 0;

      // Click pulse
      let clickPulse = 0.0;
      let clickPosX = 0.0;
      let clickPosY = 0.0;

      const updatePointer = (clientX: number, clientY: number) => {
        targetMouseX = (clientX / window.innerWidth) * 2 - 1;
        targetMouseY = -((clientY / window.innerHeight) * 2 - 1);
      };

      const onPointerMove = (e: PointerEvent) => {
        updatePointer(e.clientX, e.clientY);
      };

      const onPointerDown = (e: PointerEvent) => {
        clickPulse = 1.0;
        const rect = canvas.getBoundingClientRect();
        clickPosX = ((e.clientX - rect.left) * 2.0 - canvas.width) / Math.min(canvas.width, canvas.height);
        clickPosY = -(((e.clientY - rect.top) * 2.0 - canvas.height) / Math.min(canvas.width, canvas.height));
      };

      window.addEventListener('pointermove', onPointerMove, { passive: true });
      window.addEventListener('pointerdown', onPointerDown, { passive: true });

      // Render Loop
      const startTime = performance.now();
      let animationFrame = 0;

      const render = (currentTime: number) => {
        if (!program) return;

        const elapsed = (currentTime - startTime) / 1000;

        // Smooth mouse lerping
        mouseX += (targetMouseX - mouseX) * 0.038;
        mouseY += (targetMouseY - mouseY) * 0.038;

        // Decay click pulse smoothly
        if (clickPulse > 0.001) {
          clickPulse *= 0.94;
        } else {
          clickPulse = 0.0;
        }

        webgl.useProgram(program);

        webgl.uniform1f(timeLocation, reducedMotion ? 0 : elapsed);
        webgl.uniform2f(resolutionLocation, canvas.width, canvas.height);
        webgl.uniform2f(mouseLocation, mouseX, mouseY);
        webgl.uniform1f(clickPulseLocation, clickPulse);
        webgl.uniform2f(clickPosLocation, clickPosX, clickPosY);

        webgl.drawArrays(webgl.TRIANGLES, 0, 3);

        if (!reducedMotion) {
          animationFrame = requestAnimationFrame(render);
        }
      };

      render(performance.now());

      return () => {
        cancelAnimationFrame(animationFrame);
        window.removeEventListener('resize', resize);
        window.removeEventListener('pointermove', onPointerMove);
        window.removeEventListener('pointerdown', onPointerDown);

        if (program) webgl.deleteProgram(program);
        if (buffer) webgl.deleteBuffer(buffer);
        webgl.deleteShader(vertexShader);
        webgl.deleteShader(fragmentShader);
      };
    } catch (error) {
      console.error('GalaxyBackground WebGL initialization error:', error);
      const ctx2d = canvas.getContext('2d');
      if (ctx2d) {
        ctx2d.fillStyle = '#020005';
        ctx2d.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 w-screen h-screen -z-10 pointer-events-none block"
      style={{
        background: '#020005',
        filter: 'saturate(1.15) contrast(1.08)',
      }}
    />
  );
};

export default GalaxyBackground;
