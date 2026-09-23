// Graphics objects are re-drawn shape by shape every frame. For static art with
// many shapes (brick walls, floors, fog, battle scenery) that is the main cost
// on weak devices, so it is drawn once into a texture and shown as one image.
// `g` should be made with scene.make.graphics({ add: false }).
export function bake(scene, g, x, y, w, h, depth = 0) {
  const rt = scene.add.renderTexture(x, y, w, h).setOrigin(0).setDepth(depth);
  rt.draw(g, -x, -y);
  g.destroy();
  return rt;
}
