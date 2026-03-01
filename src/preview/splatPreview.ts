export const buildSplatViewerHtml = async (contentUrl: string): Promise<string> => {
  const { html, css, js } = await import('@playcanvas/supersplat-viewer');

  // Start from the full HTML template (contains all required UI DOM elements
  // that initUI() expects, like #ui, #loadingWrap, etc.).
  let page = html;

  // 1. Inline the CSS — replace the external stylesheet link with a <style> block.
  page = page.replace(
    '<link rel="stylesheet" href="./index.css">',
    `<style>${css}</style>`,
  );

  // 2. Replace the <head> config script (reads URL params) with one that
  //    directly injects the signed content URL and disables the viewer UI.
  const configStart = page.indexOf('<script type="module">');
  const configEnd = page.indexOf('</script>', configStart) + '</script>'.length;

  page =
    page.slice(0, configStart) +
    `<script type="module">
      window.sse = {
        config: {
          contentUrl: ${JSON.stringify(contentUrl)},
          contents: fetch(${JSON.stringify(contentUrl)}),
          noui: true
        },
        settings: Promise.resolve({
          version: 2,
          tonemapping: 'none',
          highPrecisionRendering: false,
          background: { color: [0, 0, 0] },
          postEffectSettings: {
            sharpness: { enabled: false, amount: 0 },
            bloom: { enabled: false, intensity: 1, blurLevel: 2 },
            grading: { enabled: false, brightness: 0, contrast: 1, saturation: 1, tint: [1, 1, 1] },
            vignette: { enabled: false, intensity: 0.5, inner: 0.3, outer: 0.75, curvature: 1 },
            fringing: { enabled: false, intensity: 0.5 }
          },
          animTracks: [],
          cameras: [{ initial: { position: [0, 0, 5], target: [0, 0, 0], fov: 75 } }],
          annotations: [],
          startMode: 'default',
          hasStartPose: false
        })
      };
    </script>` +
    page.slice(configEnd);

  // 3. Inline the JS — replace the ES module import in the body script with
  //    the full bundle. The bundle ends with `export { main };` which is
  //    harmless in an inline module (main stays in scope for the call below).
  page = page.replace(
    "import { main } from './index.js';",
    js,
  );

  return page;
};
