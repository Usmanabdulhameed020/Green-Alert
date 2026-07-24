/**
 * AOShadowLayer — Combined ground AO (SDF / JFA) + directional building
 * shadows in a single MapLibre CustomLayerInterface.
 * Compatible with MapLibre GL JS v5.x.
 *
 * Pipeline: shadow stencil → seed → JFA → combined composite (with blur).
 */

// ── Shadow shaders ──────────────────────────────────────────────────
const SHAD_VS = `
  uniform mat4 u_matrix;
  uniform vec2 u_shadowOff;
  uniform float u_heightScale;
  attribute vec2 a_pos;
  attribute vec4 a_normal_ed;
  attribute float a_height;
  void main() {
    float t = mod(a_normal_ed.x, 2.0);
    float h = max(10.0, a_height) * u_heightScale;
    gl_Position = u_matrix * vec4(a_pos + u_shadowOff * h * t, 0.0, 1.0);
  }`;
const SHAD_FS = `
  precision highp float;
  void main() { gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0); }`;

// ── AO seed: rasterise footprints → store screen coords ─────────────
const SEED_VS = `
  uniform mat4 u_matrix;
  attribute vec2 a_pos;
  void main() { gl_Position = u_matrix * vec4(a_pos, 0.0, 1.0); }`;
const SEED_FS = `
  precision highp float;
  uniform vec2 u_res;
  void main() { gl_FragColor = vec4(gl_FragCoord.xy / u_res, 0.0, 1.0); }`;

// ── JFA: Jump Flood Algorithm ───────────────────────────────────────
const JFA_VS = `
  attribute vec2 a_pos;
  varying vec2 v_uv;
  void main() { v_uv = a_pos * 0.5 + 0.5; gl_Position = vec4(a_pos, 0.0, 1.0); }`;
const JFA_FS = `
  precision highp float;
  uniform sampler2D u_tex;
  uniform float u_stride;
  uniform vec2 u_texel;
  varying vec2 v_uv;
  void main() {
    vec2 best = vec2(0.0);
    float bestD = 1e10, found = 0.0;
    for (int dy = -1; dy <= 1; dy++)
      for (int dx = -1; dx <= 1; dx++) {
        vec2 uv = v_uv + vec2(float(dx), float(dy)) * u_stride * u_texel;
        if (uv.x >= 0.0 && uv.x <= 1.0 && uv.y >= 0.0 && uv.y <= 1.0) {
          vec4 s = texture2D(u_tex, uv);
          if (s.a > 0.5) {
            float d = distance(v_uv, s.rg);
            if (d < bestD) { bestD = d; best = s.rg; found = 1.0; }
          }
        }
      }
    gl_FragColor = found > 0.5 ? vec4(best, 0.0, 1.0) : vec4(0.0);
  }`;

// ── Combined composite: blurred shadow mask + AO from SDF ───────────
const COMP_FS = `
  precision highp float;
  uniform sampler2D u_sdf, u_shadow;
  uniform float u_radius, u_intensity, u_shadowAlpha;
  uniform vec2 u_offset, u_blurStep;
  varying vec2 v_uv;
  void main() {
    float sh = 0.0, sw = 0.0;
    for (int dy = -2; dy <= 2; dy++)
      for (int dx = -2; dx <= 2; dx++) {
        float d2 = float(dx * dx + dy * dy);
        float w = exp(-0.5 * d2);
        sh += texture2D(u_shadow, v_uv + vec2(float(dx), float(dy)) * u_blurStep).a * w;
        sw += w;
      }
    float shadow = (sh / sw) * u_shadowAlpha;

    vec2 uv = v_uv - u_offset;
    vec4 s = texture2D(u_sdf, uv);
    float ao = 0.0;
    if (s.a > 0.5) {
      float d = distance(uv, s.rg);
      if (d < u_radius)
        ao = exp(-3.0 * d / u_radius) * u_intensity;
    }
    float combined = 1.0 - (1.0 - shadow) * (1.0 - ao);
    if (combined < 0.001) discard;
    gl_FragColor = vec4(0.0, 0.0, 0.0, combined);
  }`;

// ── GL helpers ──────────────────────────────────────────────────────
const LAYOUT_STRIDE = 12; // bytes per vertex in MapLibre fill-extrusion layout

function compileShader(gl, type, src) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, src);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
    console.error('[ao-shadow]', gl.getShaderInfoLog(shader));
  return shader;
}

function linkProgram(gl, vSrc, fSrc) {
  const prog = gl.createProgram();
  gl.attachShader(prog, compileShader(gl, gl.VERTEX_SHADER, vSrc));
  gl.attachShader(prog, compileShader(gl, gl.FRAGMENT_SHADER, fSrc));
  gl.linkProgram(prog);
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
    console.error('[ao-shadow] link:', gl.getProgramInfoLog(prog));
  return prog;
}

function uniformLocs(gl, prog, names) {
  return Object.fromEntries(names.map(n => [n, gl.getUniformLocation(prog, n)]));
}

function attribLocs(gl, prog, names) {
  return Object.fromEntries(names.map(n => [n, gl.getAttribLocation(prog, n)]));
}

function setTexParams(gl, wrap, filter) {
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, wrap);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, filter);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, filter);
}

function createTexture(gl, size, useFloat) {
  const tex = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, tex);
  const [ifmt, fmt, type] = useFloat
    ? [gl.RGBA32F, gl.RGBA, gl.FLOAT]
    : [gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE];
  gl.texImage2D(gl.TEXTURE_2D, 0, ifmt, size, size, 0, fmt, type, null);
  setTexParams(gl, gl.CLAMP_TO_EDGE, gl.NEAREST);
  return tex;
}

function toggleAttribs(gl, enable, ...ids) {
  const method = enable ? 'enableVertexAttribArray' : 'disableVertexAttribArray';
  for (const id of ids) if (id >= 0) gl[method](id);
}

function beginPass(gl, fbo, size, { stencil = false } = {}) {
  gl.viewport(0, 0, size, size);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.disable(gl.DEPTH_TEST);
  gl.depthMask(false);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);
  if (stencil) {
    gl.enable(gl.STENCIL_TEST);
    gl.stencilMask(0xFF);
    gl.clearStencil(0);
    gl.clear(gl.COLOR_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
  } else {
    gl.clear(gl.COLOR_BUFFER_BIT);
  }
}

function drawQuad(gl, quadBuf, posAttrib) {
  gl.bindBuffer(gl.ARRAY_BUFFER, quadBuf);
  gl.enableVertexAttribArray(posAttrib);
  gl.vertexAttribPointer(posAttrib, 2, gl.FLOAT, false, 0, 0);
  gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
}

function saveGlState(gl) {
  return {
    fbo:     gl.getParameter(gl.FRAMEBUFFER_BINDING),
    vp:      gl.getParameter(gl.VIEWPORT),
    depth:   gl.isEnabled(gl.DEPTH_TEST),
    depthW:  gl.getParameter(gl.DEPTH_WRITEMASK),
    blend:   gl.isEnabled(gl.BLEND),
    stencil: gl.isEnabled(gl.STENCIL_TEST),
  };
}

function restoreGlState(gl, s) {
  gl.bindFramebuffer(gl.FRAMEBUFFER, s.fbo);
  gl.viewport(s.vp[0], s.vp[1], s.vp[2], s.vp[3]);
  gl.depthMask(s.depthW);
  gl[s.depth   ? 'enable' : 'disable'](gl.DEPTH_TEST);
  gl[s.blend   ? 'enable' : 'disable'](gl.BLEND);
  gl[s.stencil ? 'enable' : 'disable'](gl.STENCIL_TEST);
}

// ── Layer ───────────────────────────────────────────────────────────
export class AOShadowLayer {
  constructor(opts = {}) {
    this.id = opts.id || 'ao-shadow';
    this.type = 'custom';
    this.renderingMode = '2d';
    this._layerId = opts.buildingsLayerId;
    this._sourceId = opts.sourceId || null;
    this._minZoom = opts.minZoom ?? 15;

    // shadow
    this.shadowColor = opts.shadowColor ?? [0, 0, 0, 0.35];
    this._height = opts.height ?? 40;
    this._heightScale = opts.heightScale ?? 0.38;
    this.shadowOffset = opts.shadowOffset ?? [-0.5, 0.5];
    this.shadowBlur = opts.shadowBlur ?? 2.0;

    // ao
    this._sdfRes = opts.sdfResolution ?? 1024;
    this.aoRadiusMin = opts.aoRadiusMin ?? 30;
    this.aoRadiusMax = opts.aoRadiusMax ?? 120;
    this._maxZoom = opts.maxZoom ?? 20;
    this.aoIntensity = opts.aoIntensity ?? 0.80;
    this.aoOffset = opts.aoOffset ?? [0, -2, -4];
  }

  onAdd(map, gl) {
    this._map = map;
    const N = this._sdfRes;

    this._shadowProg     = linkProgram(gl, SHAD_VS, SHAD_FS);
    this._shadowUniforms = uniformLocs(gl, this._shadowProg, ['u_matrix', 'u_shadowOff', 'u_heightScale']);
    this._shadowAttribs  = attribLocs(gl, this._shadowProg, ['a_pos', 'a_normal_ed', 'a_height']);

    this._seedProg     = linkProgram(gl, SEED_VS, SEED_FS);
    this._seedUniforms = uniformLocs(gl, this._seedProg, ['u_matrix', 'u_res']);
    this._seedAttribs  = attribLocs(gl, this._seedProg, ['a_pos']);

    this._jfaProg     = linkProgram(gl, JFA_VS, JFA_FS);
    this._jfaUniforms = uniformLocs(gl, this._jfaProg, ['u_tex', 'u_stride', 'u_texel']);
    this._jfaAttribs  = attribLocs(gl, this._jfaProg, ['a_pos']);

    this._compProg     = linkProgram(gl, JFA_VS, COMP_FS);
    this._compUniforms = uniformLocs(gl, this._compProg, ['u_sdf', 'u_shadow', 'u_radius', 'u_intensity', 'u_shadowAlpha', 'u_offset', 'u_blurStep']);
    this._compAttribs  = attribLocs(gl, this._compProg, ['a_pos']);

    // textures: [0],[1] for JFA ping-pong, [2] for shadow mask
    this._useFloat = !!gl.getExtension('EXT_color_buffer_float');
    this._tex = [createTexture(gl, N, this._useFloat), createTexture(gl, N, this._useFloat), createTexture(gl, N, false)];
    gl.bindTexture(gl.TEXTURE_2D, this._tex[2]);
    setTexParams(gl, gl.CLAMP_TO_EDGE, gl.LINEAR);

    // FBOs: [0],[1] for JFA, [2] for shadow mask + stencil
    this._fbo = Array.from({ length: 3 }, () => gl.createFramebuffer());
    for (let i = 0; i < 3; i++) {
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo[i]);
      gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this._tex[i], 0);
    }

    this._stencilRB = gl.createRenderbuffer();
    gl.bindRenderbuffer(gl.RENDERBUFFER, this._stencilRB);
    gl.renderbufferStorage(gl.RENDERBUFFER, gl.DEPTH24_STENCIL8, N, N);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo[2]);
    gl.framebufferRenderbuffer(gl.FRAMEBUFFER, gl.DEPTH_STENCIL_ATTACHMENT, gl.RENDERBUFFER, this._stencilRB);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);

    this._quadBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this._quadBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, 1,1]), gl.STATIC_DRAW);
  }

  /* ── tile data access ── */

  _resolveSource() {
    if (!this._sourceId) {
      const layer = this._map.getLayer(this._layerId);
      if (layer) this._sourceId = layer.source || layer.sourceLayer;
    }
    const style = this._map.style;
    return style.tileManagers?.[this._sourceId] || style.sourceCaches?.[this._sourceId] || null;
  }

  _tileMatrix(coord) {
    const xf = this._map.transform;
    try { return xf.calculatePosMatrix(coord); } catch { /* v5 path below */ }
    try { return xf.getProjectionData({ overscaledTileID: coord, applyTerrainMatrix: true })?.mainMatrix; }
    catch { return null; }
  }

  _heightBuffer(bucket) {
    const cfg = bucket.programConfigurations?.programConfigurations?.[this._layerId];
    if (!cfg?._buffers) return null;
    return cfg._buffers.find(b => b.attributes?.some(a => a.name === 'a_height')) ?? null;
  }

  _collectTiles(source, layer, coords) {
    const tiles = [];
    for (const coord of coords) {
      let tile, bucket;
      try { tile = source.getTile(coord); bucket = tile?.getBucket(layer); } catch { continue; }
      if (!bucket) continue;
      const m = this._tileMatrix(coord);
      if (!m) continue;
      tiles.push({ coord, tile, bucket, matrix: m instanceof Float32Array ? m : new Float32Array(m) });
    }
    return tiles;
  }

  /* ── render orchestrator ── */

  render(gl) {
    if (this._map.getZoom() < this._minZoom) return;
    const source = this._resolveSource();
    const layer = this._map.getLayer(this._layerId);
    if (!source || !layer) return;

    let coords;
    try { coords = source.getVisibleCoordinates().reverse(); } catch { return; }
    if (!coords.length) return;

    const saved = saveGlState(gl);
    gl.disable(gl.RASTERIZER_DISCARD);

    const tiles = this._collectTiles(source, layer, coords);
    this._shadowPass(gl, tiles);
    this._seedPass(gl, tiles);
    this._jfaPass(gl);
    this._compPass(gl, saved);
    restoreGlState(gl, saved);
  }

  /* ── 1. shadow mask → FBO[2] with stencil (no overlap) ── */

  _shadowPass(gl, tiles) {
    const sa = this._shadowAttribs;
    const su = this._shadowUniforms;

    beginPass(gl, this._fbo[2], this._sdfRes, { stencil: true });
    gl.stencilFunc(gl.EQUAL, 0, 0xFF);
    gl.stencilOp(gl.KEEP, gl.KEEP, gl.INCR);

    gl.useProgram(this._shadowProg);
    gl.uniform1f(su.u_heightScale, this._heightScale);

    for (const { coord, tile, bucket, matrix } of tiles) {
      gl.uniformMatrix4fv(su.u_matrix, false, matrix);
      const zf = Math.pow(2, coord.overscaledZ) / tile.tileSize / 8;
      gl.uniform2f(su.u_shadowOff, this.shadowOffset[0] * zf, -this.shadowOffset[1] * zf);

      const hb = this._heightBuffer(bucket);
      if (!hb) { gl.disableVertexAttribArray(sa.a_height); gl.vertexAttrib1f(sa.a_height, this._height); }
      else gl.enableVertexAttribArray(sa.a_height);
      toggleAttribs(gl, true, sa.a_pos, sa.a_normal_ed);

      bucket.indexBuffer.bind();
      for (const seg of bucket.segments.get()) {
        const byteOff = seg.vertexOffset * LAYOUT_STRIDE;
        gl.bindBuffer(gl.ARRAY_BUFFER, bucket.layoutVertexBuffer.buffer);
        gl.vertexAttribPointer(sa.a_pos, 2, gl.SHORT, false, LAYOUT_STRIDE, byteOff);
        gl.vertexAttribPointer(sa.a_normal_ed, 4, gl.SHORT, false, LAYOUT_STRIDE, byteOff + 4);
        if (hb) { hb.bind(); gl.vertexAttribPointer(sa.a_height, 1, gl.FLOAT, false, 4, seg.vertexOffset * 4); }
        gl.drawElements(gl.TRIANGLES, seg.primitiveLength * 3, gl.UNSIGNED_SHORT, seg.primitiveOffset * 6);

      }
    }
    toggleAttribs(gl, false, sa.a_height, sa.a_normal_ed, sa.a_pos);
    gl.disable(gl.STENCIL_TEST);
  }

  /* ── 2. seed footprints → FBO[0] ── */

  _seedPass(gl, tiles) {
    const su = this._seedUniforms;
    const posAttr = this._seedAttribs.a_pos;

    beginPass(gl, this._fbo[0], this._sdfRes);
    gl.useProgram(this._seedProg);
    gl.uniform2f(su.u_res, this._sdfRes, this._sdfRes);

    for (const { bucket, matrix } of tiles) {
      gl.uniformMatrix4fv(su.u_matrix, false, matrix);
      gl.enableVertexAttribArray(posAttr);
      gl.bindBuffer(gl.ARRAY_BUFFER, bucket.layoutVertexBuffer.buffer);
      bucket.indexBuffer.bind();
      for (const seg of bucket.segments.get()) {
        gl.vertexAttribPointer(posAttr, 2, gl.SHORT, false, LAYOUT_STRIDE, seg.vertexOffset * LAYOUT_STRIDE);
        gl.drawElements(gl.TRIANGLES, seg.primitiveLength * 3, gl.UNSIGNED_SHORT, seg.primitiveOffset * 6);

      }
    }
    this._readIdx = 0;
  }

  /* ── 3. JFA passes → FBO ping-pong ── */

  _jfaPass(gl) {
    const N = this._sdfRes;
    const ju = this._jfaUniforms;
    const posAttr = this._jfaAttribs.a_pos;

    gl.useProgram(this._jfaProg);
    gl.uniform2f(ju.u_texel, 1 / N, 1 / N);
    gl.uniform1i(ju.u_tex, 0);

    let read = 0;
    for (let stride = N >> 1; stride >= 1; stride >>= 1) {
      const write = 1 - read;
      gl.bindFramebuffer(gl.FRAMEBUFFER, this._fbo[write]);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this._tex[read]);
      gl.uniform1f(ju.u_stride, stride);
      drawQuad(gl, this._quadBuf, posAttr);
      read = write;
    }
    this._readIdx = read;
  }

  /* ── 4. combined shadow + AO composite → screen ── */

  _compPass(gl, saved) {
    const cu = this._compUniforms;
    const vp = saved.vp;

    gl.viewport(vp[0], vp[1], vp[2], vp[3]);
    gl.bindFramebuffer(gl.FRAMEBUFFER, saved.fbo);
    gl.useProgram(this._compProg);

    const vw = vp[2], vh = vp[3];
    const zoom = this._map.getZoom();
    const t = Math.min(Math.max((zoom - this._minZoom) / (this._maxZoom - this._minZoom), 0), 1);
    const radiusPx = this.aoRadiusMin + t * (this.aoRadiusMax - this.aoRadiusMin);
    gl.uniform1f(cu.u_radius, Math.min(radiusPx / Math.max(vw, vh), 0.2));
    gl.uniform1f(cu.u_intensity, this.aoIntensity);
    gl.uniform1f(cu.u_shadowAlpha, this.shadowColor[3]);

    const blurStep = this.shadowBlur / this._sdfRes;
    gl.uniform2f(cu.u_blurStep, blurStep, blurStep);

    const bearing = this._map.getBearing() * Math.PI / 180;
    const c = Math.cos(bearing), s = Math.sin(bearing);
    const [ox, oy, oz] = this.aoOffset;
    gl.uniform2f(cu.u_offset, (ox * c - oy * s) / vw, ((ox * s + oy * c) + (oz ?? 0)) / vh);

    gl.uniform1i(cu.u_sdf, 0);
    gl.uniform1i(cu.u_shadow, 1);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this._tex[this._readIdx]);
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, this._tex[2]);

    gl.disable(gl.DEPTH_TEST);
    gl.depthMask(false);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    drawQuad(gl, this._quadBuf, this._compAttribs.a_pos);
  }

  onRemove(_map, gl) {
    [this._shadowProg, this._seedProg, this._jfaProg, this._compProg].forEach(p => gl.deleteProgram(p));
    this._fbo.forEach(f => gl.deleteFramebuffer(f));
    this._tex.forEach(t => gl.deleteTexture(t));
    gl.deleteRenderbuffer(this._stencilRB);
    gl.deleteBuffer(this._quadBuf);
  }
}
