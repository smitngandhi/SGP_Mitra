// Performance-optimized SplashCursor component for SGP Mitra
"use client";
import { useEffect, useRef, useCallback } from "react";

function SplashCursor({
  // Adaptive performance settings for all devices
  SIM_RESOLUTION = 64,
  DYE_RESOLUTION = 512,
  DENSITY_DISSIPATION = 4.0,
  VELOCITY_DISSIPATION = 2.5,
  PRESSURE = 0.08,
  PRESSURE_ITERATIONS = 15,
  CURL = 2,
  SPLAT_RADIUS = 0.15,
  SPLAT_FORCE = 4000,
  SHADING = false,
  COLOR_UPDATE_SPEED = 8,
  BACK_COLOR = { r: 0, g: 0, b: 0 },
  TRANSPARENT = true,
}) {
  const canvasRef = useRef(null);
  const animationFrameRef = useRef(null);
  const isInitializedRef = useRef(false);

  const cleanup = useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    isInitializedRef.current = false;
  }, []);

  // Adaptive performance settings based on device capabilities
  const getDeviceSettings = useCallback(() => {
    const cores = navigator.hardwareConcurrency || 2;
    const memory = navigator.deviceMemory || 2;
    const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    
    // Ultra-low settings for very basic devices
    if (cores <= 2 || memory <= 1) {
      return {
        resolution: 32,
        updateInterval: 3, // Update every 3 frames
        opacity: 0.15,
        complexity: 'minimal'
      };
    }
    // Low settings for budget devices
    else if (cores <= 4 || memory <= 2 || isMobile) {
      return {
        resolution: 48,
        updateInterval: 2, // Update every 2 frames
        opacity: 0.2,
        complexity: 'low'
      };
    }
    // Standard settings for decent devices
    else {
      return {
        resolution: 64,
        updateInterval: 1, // Update every frame
        opacity: 0.3,
        complexity: 'standard'
      };
    }
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || isInitializedRef.current) return;

    isInitializedRef.current = true;
    const deviceSettings = getDeviceSettings();

    // Adaptive WebGL setup with fallback
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
    if (!gl) {
      // Canvas 2D fallback for devices without WebGL
      const ctx = canvas.getContext('2d');
      if (ctx) {
        setupCanvas2DFallback(canvas, ctx, deviceSettings);
      }
      return;
    }

    // Adaptive shader complexity based on device
    const getFragmentShader = (complexity) => {
      if (complexity === 'minimal') {
        return `
          precision lowp float;
          uniform vec2 resolution;
          uniform vec2 mouse;
          
          void main() {
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            vec2 center = mouse / resolution.xy;
            float dist = distance(uv, center);
            
            float intensity = 1.0 - smoothstep(0.0, 0.3, dist);
            gl_FragColor = vec4(0.5, 0.3, 0.8, intensity * 0.15);
          }
        `;
      } else if (complexity === 'low') {
        return `
          precision mediump float;
          uniform vec2 resolution;
          uniform float time;
          uniform vec2 mouse;
          
          void main() {
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            vec2 center = mouse / resolution.xy;
            float dist = distance(uv, center);
            
            float wave = sin(time * 2.0 + dist * 5.0) * 0.5 + 0.5;
            vec3 color = vec3(0.5, 0.3, 0.8) * wave;
            float intensity = exp(-dist * 2.0);
            
            gl_FragColor = vec4(color, intensity * 0.2);
          }
        `;
      } else {
        return `
          precision mediump float;
          uniform vec2 resolution;
          uniform float time;
          uniform vec2 mouse;
          
          void main() {
            vec2 uv = gl_FragCoord.xy / resolution.xy;
            vec2 center = mouse / resolution.xy;
            float dist = distance(uv, center);
            
            vec3 color = vec3(0.5 + 0.5 * sin(time + dist * 10.0));
            color *= exp(-dist * 3.0);
            
            gl_FragColor = vec4(color, color.r * 0.3);
          }
        `;
      }
    };

    // Basic shader setup
    const vertexShader = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vertexShader, `
      attribute vec2 position;
      void main() {
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `);
    gl.compileShader(vertexShader);

    const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fragmentShader, getFragmentShader(deviceSettings.complexity));
    gl.compileShader(fragmentShader);

    const program = gl.createProgram();
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Shader program failed to link');
      return;
    }

    gl.useProgram(program);

    // Create buffer
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, 1, 1
    ]), gl.STATIC_DRAW);

    const positionLocation = gl.getAttribLocation(program, 'position');
    gl.enableVertexAttribArray(positionLocation);
    gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

    // Uniforms
    const resolutionLocation = gl.getUniformLocation(program, 'resolution');
    const timeLocation = gl.getUniformLocation(program, 'time');
    const mouseLocation = gl.getUniformLocation(program, 'mouse');

    let mouseX = 0, mouseY = 0;
    let startTime = Date.now();
    let frameCount = 0;

    const handleMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = e.clientX - rect.left;
      mouseY = rect.height - (e.clientY - rect.top);
    };

    const handleTouchMove = (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      mouseX = touch.clientX - rect.left;
      mouseY = rect.height - (touch.clientY - rect.top);
    };

    // Resize canvas with device pixel ratio consideration
    const resizeCanvas = () => {
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2); // Cap at 2x for performance
      const displayWidth = Math.floor(canvas.clientWidth * pixelRatio / deviceSettings.resolution * 64);
      const displayHeight = Math.floor(canvas.clientHeight * pixelRatio / deviceSettings.resolution * 64);
      
      if (canvas.width !== displayWidth || canvas.height !== displayHeight) {
        canvas.width = displayWidth;
        canvas.height = displayHeight;
        gl.viewport(0, 0, displayWidth, displayHeight);
      }
    };

    // Canvas 2D fallback for devices without WebGL
    const setupCanvas2DFallback = (canvas, ctx, settings) => {
      let mouseX = 0, mouseY = 0;
      const particles = [];
      
      const handleMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        mouseX = e.clientX - rect.left;
        mouseY = e.clientY - rect.top;
        
        // Add particle
        particles.push({
          x: mouseX,
          y: mouseY,
          life: 1.0,
          size: Math.random() * 20 + 10
        });
        
        // Limit particles for performance
        if (particles.length > 20) particles.shift();
      };

      const animate2D = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Update and draw particles
        for (let i = particles.length - 1; i >= 0; i--) {
          const p = particles[i];
          p.life -= 0.02;
          
          if (p.life <= 0) {
            particles.splice(i, 1);
            continue;
          }
          
          ctx.globalAlpha = p.life * settings.opacity;
          ctx.fillStyle = '#8A5DD6';
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2);
          ctx.fill();
        }
        
        if (frameCount % settings.updateInterval === 0) {
          animationFrameRef.current = requestAnimationFrame(animate2D);
        } else {
          animationFrameRef.current = requestAnimationFrame(animate2D);
        }
        frameCount++;
      };

      canvas.addEventListener('mousemove', handleMove, { passive: true });
      canvas.addEventListener('touchmove', handleMove, { passive: true });
      animate2D();
    };

    // Animation loop with adaptive frame rate
    const animate = () => {
      frameCount++;
      
      // Skip frames based on device settings
      if (frameCount % deviceSettings.updateInterval !== 0) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      
      resizeCanvas();
      
      const currentTime = (Date.now() - startTime) * 0.001;
      
      gl.uniform2f(resolutionLocation, canvas.width, canvas.height);
      if (timeLocation && deviceSettings.complexity !== 'minimal') {
        gl.uniform1f(timeLocation, currentTime);
      }
      gl.uniform2f(mouseLocation, mouseX, mouseY);
      
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
      
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    // Event listeners
    canvas.addEventListener('mousemove', handleMouseMove, { passive: true });
    canvas.addEventListener('touchmove', handleTouchMove, { passive: true });

    // Start animation
    resizeCanvas();
    animate();

    return () => {
      cleanup();
      canvas.removeEventListener('mousemove', handleMouseMove);
      canvas.removeEventListener('touchmove', handleTouchMove);
      
      // Cleanup WebGL resources
      if (gl) {
        gl.deleteProgram(program);
        gl.deleteShader(vertexShader);
        gl.deleteShader(fragmentShader);
        gl.deleteBuffer(buffer);
      }
    };
  }, [cleanup, SIM_RESOLUTION, DYE_RESOLUTION, DENSITY_DISSIPATION, VELOCITY_DISSIPATION, PRESSURE, PRESSURE_ITERATIONS, CURL, SPLAT_RADIUS, SPLAT_FORCE, SHADING, COLOR_UPDATE_SPEED, BACK_COLOR, TRANSPARENT]);

  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return (
    <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0">
      <canvas 
        ref={canvasRef} 
        className="w-full h-full"
        style={{ 
          opacity: 0.25,
          mixBlendMode: 'screen',
          filter: 'blur(0.5px)'
        }}
      />
    </div>
  );
}

export { SplashCursor };
