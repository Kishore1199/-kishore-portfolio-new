import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  OnDestroy,
  effect,
  inject,
  input,
  signal,
  viewChild,
} from '@angular/core';
import { prefersReducedMotion } from '../../core/theme.service';
import { ScrollService } from '../../core/scroll.service';

type ThreeModule = typeof import('three');

/**
 * Interactive WebGL scene for the hero: a faceted glowing core inside a wireframe shell,
 * two orbit rings with tech "satellites", and a drifting particle field.
 * three.js is loaded lazily so it never blocks the first paint.
 */
@Component({
  selector: 'app-hero-scene',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<canvas #canvas [class.ready]="ready()" aria-hidden="true"></canvas>`,
  styles: `
    :host { position: absolute; inset: 0; display: block; pointer-events: none; }
    canvas { width: 100%; height: 100%; display: block; opacity: 0; transition: opacity 1.4s ease; }
    canvas.ready { opacity: 1; }
  `,
})
export class HeroScene implements AfterViewInit, OnDestroy {
  readonly dark = input(true);
  readonly ready = signal(false);

  private canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private scroll = inject(ScrollService);
  private teardown: (() => void) | null = null;
  private applyTheme: ((dark: boolean) => void) | null = null;
  private destroyed = false;

  constructor() {
    effect(() => {
      const d = this.dark();
      this.applyTheme?.(d);
    });
  }

  async ngAfterViewInit() {
    let THREE: ThreeModule;
    try {
      THREE = await import('three');
    } catch {
      return; // network/script failure: CSS glow behind the hero still looks fine
    }
    if (this.destroyed) return;
    try {
      this.build(THREE);
    } catch {
      // WebGL unavailable — leave the canvas transparent.
    }
  }

  ngOnDestroy() {
    this.destroyed = true;
    this.teardown?.();
  }

  private build(THREE: ThreeModule) {
    const canvas = this.canvas().nativeElement;
    const hostEl = this.host.nativeElement;
    const reduced = prefersReducedMotion();

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
    camera.position.set(0, 0, 11);

    // ---------- lights ----------
    const ambient = new THREE.AmbientLight(0xffffff, 0.55);
    const key = new THREE.DirectionalLight(0xffe2c4, 2.4);
    key.position.set(5, 6, 6);
    const rim = new THREE.DirectionalLight(0x8b5cf6, 2.2);
    rim.position.set(-6, -3, -2);
    const fill = new THREE.DirectionalLight(0x22d3ee, 0.8);
    fill.position.set(-4, 5, 4);
    scene.add(ambient, key, rim, fill);

    // ---------- core object ----------
    const world = new THREE.Group();
    scene.add(world);
    const rig = new THREE.Group(); // receives mouse parallax
    world.add(rig);

    const coreGeo = new THREE.IcosahedronGeometry(1.55, 1);
    const coreMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0x7c2d12,
      emissiveIntensity: 0.55,
      metalness: 0.35,
      roughness: 0.22,
      flatShading: true,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    rig.add(core);

    const shellGeo = new THREE.IcosahedronGeometry(2.35, 1);
    const shellEdges = new THREE.EdgesGeometry(shellGeo);
    const shellMat = new THREE.LineBasicMaterial({ color: 0xfdba74, transparent: true, opacity: 0.38 });
    const shell = new THREE.LineSegments(shellEdges, shellMat);
    rig.add(shell);

    // vertex "nodes" on the shell
    const nodeGeo = new THREE.SphereGeometry(0.045, 10, 10);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24 });
    const shellPos = shellGeo.getAttribute('position');
    const seen = new Set<string>();
    for (let i = 0; i < shellPos.count; i++) {
      const v = new THREE.Vector3().fromBufferAttribute(shellPos, i);
      const k = `${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)}`;
      if (seen.has(k)) continue;
      seen.add(k);
      const n = new THREE.Mesh(nodeGeo, nodeMat);
      n.position.copy(v);
      shell.add(n);
    }

    // ---------- orbit rings + satellites ----------
    const ringMatA = new THREE.MeshBasicMaterial({ color: 0xf97316, transparent: true, opacity: 0.55 });
    const ringMatB = new THREE.MeshBasicMaterial({ color: 0x8b5cf6, transparent: true, opacity: 0.45 });
    const ringGeoA = new THREE.TorusGeometry(3.3, 0.012, 8, 220);
    const ringGeoB = new THREE.TorusGeometry(3.9, 0.01, 8, 220);
    const orbitA = new THREE.Group();
    const orbitB = new THREE.Group();
    orbitA.rotation.set(Math.PI / 2.3, 0.2, 0);
    orbitB.rotation.set(Math.PI / 1.7, -0.5, 0.4);
    orbitA.add(new THREE.Mesh(ringGeoA, ringMatA));
    orbitB.add(new THREE.Mesh(ringGeoB, ringMatB));
    rig.add(orbitA, orbitB);

    const satGeo = new THREE.BoxGeometry(0.26, 0.26, 0.26);
    const satGeo2 = new THREE.OctahedronGeometry(0.2);
    const satMats = [0xf97316, 0xfbbf24, 0x8b5cf6, 0x22d3ee].map(
      c => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.35, metalness: 0.4, roughness: 0.3 }),
    );
    const satellites: { mesh: InstanceType<ThreeModule['Mesh']>; spin: number }[] = [];
    const placeSats = (group: InstanceType<ThreeModule['Group']>, radius: number, count: number, geo: typeof satGeo | typeof satGeo2) => {
      for (let i = 0; i < count; i++) {
        const a = (i / count) * Math.PI * 2;
        const m = new THREE.Mesh(geo, satMats[i % satMats.length]);
        m.position.set(Math.cos(a) * radius, Math.sin(a) * radius, 0);
        group.add(m);
        satellites.push({ mesh: m, spin: 0.6 + Math.random() * 1.2 });
      }
    };
    placeSats(orbitA, 3.3, 5, satGeo);
    placeSats(orbitB, 3.9, 4, satGeo2);

    // ---------- particle field ----------
    const COUNT = window.innerWidth < 768 ? 700 : 1400;
    const positions = new Float32Array(COUNT * 3);
    for (let i = 0; i < COUNT; i++) {
      const r = 5 + Math.random() * 14;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta) * 0.7;
      positions[i * 3 + 2] = r * Math.cos(phi) - 4;
    }
    const starGeo = new THREE.BufferGeometry();
    starGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMat = new THREE.PointsMaterial({ size: 0.04, color: 0xfdba74, transparent: true, opacity: 0.75, sizeAttenuation: true, depthWrite: false });
    const stars = new THREE.Points(starGeo, starMat);
    scene.add(stars);

    // ---------- theme ----------
    // Dark = ember orange; light = indigo / sky / pink (matches the light-mode palette).
    const lightSats = [0x4f46e5, 0x0ea5e9, 0xf97316, 0x8b5cf6];
    const darkSats = [0xf97316, 0xfbbf24, 0x8b5cf6, 0x22d3ee];
    this.applyTheme = (dark: boolean) => {
      coreMat.color.set(dark ? 0xf97316 : 0x6366f1);
      coreMat.emissive.set(dark ? 0x7c2d12 : 0x1e1b4b);
      coreMat.emissiveIntensity = dark ? 0.55 : 0.35;
      starMat.color.set(dark ? 0xfdba74 : 0xea580c);
      starMat.opacity = dark ? 0.75 : 0.6;
      shellMat.color.set(dark ? 0xfdba74 : 0x0ea5e9);
      shellMat.opacity = dark ? 0.38 : 0.55;
      nodeMat.color.set(dark ? 0xfbbf24 : 0x4f46e5);
      ambient.intensity = dark ? 0.55 : 1.0;
      ringMatA.color.set(dark ? 0xf97316 : 0x6366f1);
      ringMatA.opacity = dark ? 0.55 : 0.7;
      ringMatB.color.set(dark ? 0x8b5cf6 : 0xf97316);
      ringMatB.opacity = dark ? 0.45 : 0.55;
      satMats.forEach((m, i) => {
        const c = (dark ? darkSats : lightSats)[i % 4];
        m.color.set(c);
        m.emissive.set(c);
      });
      if (!running) renderer.render(scene, camera);
    };

    // ---------- sizing ----------
    let isWide = true;
    const resize = () => {
      const w = hostEl.clientWidth || window.innerWidth;
      const h = hostEl.clientHeight || window.innerHeight;
      hostHeight = h || 800;
      renderer.setSize(w, h, false);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      isWide = w >= 1024;
      // Desktop: object sits to the right of the headline. Mobile: centered, smaller, behind text.
      // Visible half-width at z=0, so the object stays clear of the headline on any aspect ratio.
      const halfW = Math.tan((camera.fov * Math.PI) / 360) * 11 * camera.aspect;
      world.position.set(isWide ? halfW * 0.6 : 0, 0, 0);
      const s = isWide ? Math.min(0.72, halfW * 0.1) : Math.min(0.8, halfW * 0.21);
      world.scale.setScalar(s);
      if (!running) renderer.render(scene, camera);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(hostEl);

    // ---------- interaction ----------
    const pointer = { x: 0, y: 0 };
    const onPointer = (e: PointerEvent) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
    };
    window.addEventListener('pointermove', onPointer, { passive: true });

    let scrollFade = 0;
    let hostHeight = 800; // cached in resize() so scrolling never forces a layout
    const offScroll = this.scroll.onFrame(y => {
      scrollFade = Math.min(y / hostHeight, 1);
    });

    // ---------- loop ----------
    let last = performance.now();
    let elapsed = 0;
    let running = false;
    let visible = true;
    let raf = 0;

    const tick = () => {
      raf = requestAnimationFrame(tick);
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt;
      const t = elapsed;

      core.rotation.x += dt * 0.25;
      core.rotation.y += dt * 0.35;
      const pulse = 1 + Math.sin(t * 1.6) * 0.035;
      core.scale.setScalar(pulse);
      shell.rotation.y -= dt * 0.12;
      shell.rotation.z += dt * 0.05;
      orbitA.rotation.z += dt * 0.35;
      orbitB.rotation.z -= dt * 0.22;
      for (const s of satellites) {
        s.mesh.rotation.x += dt * s.spin;
        s.mesh.rotation.y += dt * s.spin;
      }
      stars.rotation.y += dt * 0.012;
      stars.rotation.x = Math.sin(t * 0.05) * 0.05;

      // parallax + gentle float
      rig.rotation.y += (pointer.x * 0.45 - rig.rotation.y) * 0.05;
      rig.rotation.x += (pointer.y * 0.3 - rig.rotation.x) * 0.05;
      rig.position.y = Math.sin(t * 0.8) * 0.15;
      camera.position.x += (pointer.x * 0.6 - camera.position.x) * 0.03;
      camera.position.y += (-pointer.y * 0.4 - camera.position.y) * 0.03;
      camera.position.z = 11 + scrollFade * 4;
      camera.lookAt(0, 0, 0);

      renderer.render(scene, camera);
    };

    const start = () => {
      if (running || reduced || !visible || document.hidden) return;
      running = true;
      last = performance.now();
      tick();
    };
    const stop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      visible ? start() : stop();
    });
    io.observe(hostEl);
    const onVisibility = () => (document.hidden ? stop() : start());
    document.addEventListener('visibilitychange', onVisibility);

    resize();
    this.applyTheme(this.dark());
    // Reduced motion: a single still frame with a pleasant angle.
    rig.rotation.set(0.25, -0.4, 0);
    renderer.render(scene, camera);
    start();
    this.ready.set(true);

    this.teardown = () => {
      stop();
      io.disconnect();
      ro.disconnect();
      window.removeEventListener('pointermove', onPointer);
      offScroll();
      document.removeEventListener('visibilitychange', onVisibility);
      scene.traverse(obj => {
        const m = obj as InstanceType<ThreeModule['Mesh']>;
        m.geometry?.dispose();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach(x => x.dispose());
        else mat?.dispose();
      });
      renderer.dispose();
      this.applyTheme = null;
    };
  }
}
