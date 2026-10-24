"""Generate the host board's static props as one compact glTF file.

Run from the repository root:

    blender --background --factory-startup --python apps/web/scripts/blender/build-world.py

Output: apps/web/public/models/world.glb

Every prop is a single low-poly mesh whose colors live in vertex colors, so the host
can render all props with one shared material and draw each prop type as one
InstancedMesh. No textures are exported.

Axes: props are authored in Blender's Z-up space with their front facing -Y. The glTF
exporter converts this to three.js Y-up with the front facing +Z.
"""

import math
import os
import random
import sys

import bmesh
import bpy
from mathutils import Matrix, Vector

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", "..", ".."))
OUTPUT = os.path.join(ROOT, "apps", "web", "public", "models", "world.glb")
SERIF_FONT_CANDIDATES = [
    "/usr/share/fonts/TTF/timesbd.ttf",
    "/usr/share/fonts/liberation/LiberationSerif-Bold.ttf",
    "/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf",
    "C:/Windows/Fonts/timesbd.ttf",
    "/Library/Fonts/Times New Roman Bold.ttf",
]


def srgb_to_linear(channel):
    return channel / 12.92 if channel <= 0.04045 else ((channel + 0.055) / 1.055) ** 2.4


def rgba(hex_color):
    value = hex_color.lstrip("#")
    return tuple(srgb_to_linear(int(value[i : i + 2], 16) / 255) for i in (0, 2, 4)) + (1.0,)


def shade(hex_color, amount):
    """Lighten (positive) or darken (negative) a hex color in sRGB space."""
    value = hex_color.lstrip("#")
    channels = [int(value[i : i + 2], 16) for i in (0, 2, 4)]
    if amount >= 0:
        channels = [round(c + (255 - c) * amount) for c in channels]
    else:
        channels = [round(c * (1 + amount)) for c in channels]
    return "#" + "".join(f"{max(0, min(255, c)):02x}" for c in channels)


class Builder:
    """Accumulates colored primitives into one bmesh."""

    def __init__(self, seed=1):
        self.bm = bmesh.new()
        self.color_layer = self.bm.loops.layers.float_color.new("Color")
        self.random = random.Random(seed)

    def _finish(self, geom, color, matrix, jitter=0.0, variation=0.0):
        verts = [element for element in geom if isinstance(element, bmesh.types.BMVert)]
        if jitter:
            for vert in verts:
                vert.co += Vector(
                    (
                        self.random.uniform(-jitter, jitter),
                        self.random.uniform(-jitter, jitter),
                        self.random.uniform(-jitter, jitter),
                    )
                )
        bmesh.ops.transform(self.bm, matrix=matrix, verts=verts)
        faces = {face for vert in verts for face in vert.link_faces}
        for face in faces:
            face_color = color
            if variation:
                face_color = shade(color, self.random.uniform(-variation, variation))
            linear = rgba(face_color)
            for loop in face.loops:
                loop[self.color_layer] = linear
        return faces

    def cylinder(
        self,
        color,
        radius1,
        radius2,
        depth,
        segments=8,
        location=(0, 0, 0),
        rotation=(0, 0, 0),
        jitter=0.0,
        variation=0.0,
    ):
        geom = bmesh.ops.create_cone(
            self.bm,
            cap_ends=True,
            cap_tris=False,
            segments=segments,
            radius1=radius1,
            radius2=radius2,
            depth=depth,
        )["verts"]
        return self._finish(
            geom, color, _matrix(location, rotation), jitter=jitter, variation=variation
        )

    def blob(
        self,
        color,
        radius=1.0,
        subdivisions=1,
        location=(0, 0, 0),
        rotation=(0, 0, 0),
        scale=(1, 1, 1),
        jitter=0.0,
        variation=0.0,
    ):
        geom = bmesh.ops.create_icosphere(
            self.bm, subdivisions=subdivisions, radius=radius
        )["verts"]
        return self._finish(
            geom, color, _matrix(location, rotation, scale), jitter=jitter, variation=variation
        )

    def sphere(self, color, radius, segments=12, rings=8, location=(0, 0, 0), scale=(1, 1, 1)):
        geom = bmesh.ops.create_uvsphere(
            self.bm, u_segments=segments, v_segments=rings, radius=radius
        )["verts"]
        return self._finish(geom, color, _matrix(location, (0, 0, 0), scale))

    def to_object(self, name, smooth=False):
        mesh = bpy.data.meshes.new(name)
        self.bm.to_mesh(mesh)
        self.bm.free()
        for polygon in mesh.polygons:
            polygon.use_smooth = smooth
        mesh.color_attributes.active_color_name = "Color"
        mesh.materials.append(PALETTE)
        obj = bpy.data.objects.new(name, mesh)
        bpy.context.collection.objects.link(obj)
        return obj


def _matrix(location, rotation, scale=(1, 1, 1)):
    rot = (
        Matrix.Rotation(rotation[2], 4, "Z")
        @ Matrix.Rotation(rotation[1], 4, "Y")
        @ Matrix.Rotation(rotation[0], 4, "X")
    )
    scl = Matrix.Diagonal((scale[0], scale[1], scale[2], 1.0))
    return Matrix.Translation(location) @ rot @ scl


def bevelled_box(builder, color, size, location=(0, 0, 0), rotation=(0, 0, 0), bevel=0.04):
    """A box with chamfered edges; bevel is in world units."""
    before = set(builder.bm.verts)
    bmesh.ops.create_cube(builder.bm, size=1.0)
    verts = [vert for vert in builder.bm.verts if vert not in before]
    bmesh.ops.scale(builder.bm, vec=Vector(size), verts=verts)
    if bevel:
        edges = list({edge for vert in verts for edge in vert.link_edges})
        bmesh.ops.bevel(
            builder.bm,
            geom=edges,
            offset=bevel,
            offset_type="OFFSET",
            segments=2,
            profile=0.5,
            affect="EDGES",
        )
        verts = [vert for vert in builder.bm.verts if vert not in before]
    return builder._finish(verts, color, _matrix(location, rotation))


def merge_object(builder, obj, color, matrix=Matrix.Identity(4)):
    """Copy an existing mesh object's geometry into the builder with one color."""
    before = set(builder.bm.verts)
    temp = bmesh.new()
    temp.from_mesh(obj.data)
    temp.transform(matrix @ obj.matrix_world)
    mesh = bpy.data.meshes.new("temp")
    temp.to_mesh(mesh)
    temp.free()
    builder.bm.from_mesh(mesh)
    bpy.data.meshes.remove(mesh)
    verts = [vert for vert in builder.bm.verts if vert not in before]
    return builder._finish(verts, color, Matrix.Identity(4))


def text_mesh(text, size, depth):
    """Extruded serif text centred on the origin, standing upright and facing -Y."""
    curve = bpy.data.curves.new(f"text-{text}", type="FONT")
    curve.body = text
    font_path = next((path for path in SERIF_FONT_CANDIDATES if os.path.exists(path)), None)
    if font_path:
        curve.font = bpy.data.fonts.load(font_path)
    curve.size = size
    curve.extrude = depth
    curve.align_x = "CENTER"
    curve.align_y = "CENTER"
    curve.resolution_u = 3
    obj = bpy.data.objects.new(f"text-{text}", curve)
    bpy.context.collection.objects.link(obj)
    obj.rotation_euler = (math.pi / 2, 0, 0)
    bpy.context.view_layer.update()
    depsgraph = bpy.context.evaluated_depsgraph_get()
    mesh = bpy.data.meshes.new_from_object(obj.evaluated_get(depsgraph))
    mesh_obj = bpy.data.objects.new(f"text-mesh-{text}", mesh)
    bpy.context.collection.objects.link(mesh_obj)
    mesh_obj.matrix_world = obj.matrix_world.copy()
    bpy.data.objects.remove(obj)
    return mesh_obj


def remove(obj):
    bpy.data.objects.remove(obj, do_unlink=True)


# ---------------------------------------------------------------------------
# Palette
# ---------------------------------------------------------------------------

BARK = "#6e4a31"
BARK_DARK = "#523523"
LEAF = ["#3f7442", "#55854a", "#6f9a4f", "#4a7a3e"]
PINE = ["#2f5e3d", "#3a6c45"]
STONE = "#a7a490"
STONE_DARK = "#7f8574"
TILE_TOP = "#f1e8d2"
TILE_SIDE = "#cdbf9c"
TILE_RIM = "#a99673"
WOOD = "#9a6d43"
WOOD_DARK = "#6d4a2c"
WOOD_LIGHT = "#c8a06a"
CREAM = "#f2e6c4"
SAGE = "#5d7f57"
INK = "#2b231b"
IRON = "#3a443d"
LAMP = "#ffe2a6"


def build_tree_oak(name, seed, canopy_count):
    builder = Builder(seed)
    rnd = builder.random
    builder.cylinder(BARK, 0.24, 0.11, 2.2, segments=7, location=(0, 0, 1.0), variation=0.06)
    for index in range(3):
        angle = index * 2.1 + rnd.uniform(-0.3, 0.3)
        tilt = 0.75
        builder.cylinder(
            BARK,
            0.08,
            0.035,
            0.85,
            segments=5,
            location=(math.cos(angle) * 0.24, math.sin(angle) * 0.24, 1.55 + index * 0.15),
            rotation=(0, tilt, angle),
            variation=0.06,
        )
    # Root flare
    for index in range(4):
        angle = index * math.pi / 2 + 0.4
        builder.cylinder(
            BARK_DARK,
            0.11,
            0.03,
            0.5,
            segments=5,
            location=(math.cos(angle) * 0.18, math.sin(angle) * 0.18, 0.08),
            rotation=(0, 1.2, angle),
        )
    # Canopy: a few large, jittered clumps reads better and costs far less than many puffs.
    for index in range(canopy_count):
        angle = index / canopy_count * math.tau + rnd.uniform(-0.3, 0.3)
        ring = 0.0 if index == 0 else rnd.uniform(0.45, 0.7)
        height = 2.55 if index == 0 else rnd.uniform(2.1, 2.75)
        radius = 0.78 if index == 0 else rnd.uniform(0.5, 0.66)
        builder.blob(
            LEAF[index % len(LEAF)],
            radius=radius,
            subdivisions=1,
            location=(math.cos(angle) * ring, math.sin(angle) * ring, height),
            rotation=(rnd.uniform(0, 3), rnd.uniform(0, 3), rnd.uniform(0, 3)),
            scale=(1, 1, 0.82),
            jitter=0.07,
            variation=0.08,
        )
    builder.blob(
        LEAF[2], radius=0.5, location=(0.1, -0.05, 3.25), scale=(1, 1, 0.8), jitter=0.06,
        variation=0.08,
    )
    return builder.to_object(name)


def build_tree_pine(name, seed):
    builder = Builder(seed)
    builder.cylinder(BARK_DARK, 0.15, 0.08, 1.0, segments=6, location=(0, 0, 0.45))
    for index, (radius, z) in enumerate([(1.0, 1.25), (0.82, 1.85), (0.62, 2.4), (0.4, 2.9)]):
        builder.cylinder(
            PINE[index % 2],
            radius,
            0.0,
            1.05 - index * 0.1,
            segments=8,
            location=(0, 0, z),
            rotation=(0, 0, index * 0.4),
            jitter=0.03,
            variation=0.06,
        )
    return builder.to_object(name)


def build_shrub():
    builder = Builder(7)
    for x, y, z, r, color in [
        (-0.24, 0.02, 0.2, 0.34, LEAF[0]),
        (0.22, 0.05, 0.19, 0.3, LEAF[1]),
        (0.0, -0.06, 0.36, 0.38, LEAF[2]),
        (0.05, 0.2, 0.22, 0.26, LEAF[3]),
    ]:
        builder.blob(color, radius=r, location=(x, y, z), scale=(1, 1, 0.85), jitter=0.04,
                     variation=0.07)
    return builder.to_object("Shrub")


def build_rock():
    builder = Builder(11)
    builder.blob(STONE_DARK, radius=0.5, subdivisions=1, scale=(1.0, 0.85, 0.6),
                 location=(0, 0, 0.18), jitter=0.08, variation=0.08)
    builder.blob(STONE, radius=0.26, subdivisions=0, scale=(1, 0.9, 0.7),
                 location=(0.42, -0.2, 0.08), jitter=0.04, variation=0.08)
    return builder.to_object("Rock")


def build_mushroom():
    builder = Builder(13)
    builder.cylinder("#f1eadb", 0.05, 0.04, 0.22, segments=7, location=(0, 0, 0.11))
    builder.sphere("#d9584c", 0.13, segments=10, rings=6, location=(0, 0, 0.23),
                   scale=(1, 1, 0.55))
    for angle in (0.3, 2.2, 4.1):
        builder.blob("#fff6e8", radius=0.022, subdivisions=0,
                     location=(math.cos(angle) * 0.085, math.sin(angle) * 0.085, 0.28))
    return builder.to_object("Mushroom")


def build_flower():
    """White petals and a gold centre; instance colors tint the petals per plant."""
    builder = Builder(17)
    builder.cylinder("#3f8346", 0.012, 0.016, 0.26, segments=5, location=(0, 0, 0.13))
    for index in range(5):
        angle = index / 5 * math.tau
        builder.blob("#ffffff", radius=0.05, subdivisions=0,
                     location=(math.cos(angle) * 0.045, math.sin(angle) * 0.045, 0.27),
                     scale=(1.3, 0.7, 0.35), rotation=(0, 0, angle))
    builder.blob("#e2b54a", radius=0.03, subdivisions=0, location=(0, 0, 0.285))
    for side in (-1, 1):
        builder.blob("#4f8f4a", radius=0.06, subdivisions=0,
                     location=(side * 0.05, 0, 0.07), scale=(1.4, 0.5, 0.25),
                     rotation=(0, side * 0.5, 0))
    return builder.to_object("Flower")


def build_tile():
    """Octagonal stone plinth. Top is near-white so instance colors can tint it."""
    builder = Builder(19)
    builder.cylinder(TILE_SIDE, 0.82, 0.74, 0.26, segments=8, location=(0, 0, 0.0),
                     rotation=(0, 0, math.pi / 8), variation=0.05)
    builder.cylinder(TILE_RIM, 0.7, 0.68, 0.06, segments=8, location=(0, 0, 0.15),
                     rotation=(0, 0, math.pi / 8))
    builder.cylinder(TILE_TOP, 0.62, 0.62, 0.06, segments=24, location=(0, 0, 0.17))
    return builder.to_object("Tile")


def build_start_gate():
    builder = Builder(23)
    for x in (-1.2, 1.2):
        builder.cylinder(WOOD_DARK, 0.17, 0.13, 2.4, segments=8, location=(x, 0, 1.2),
                         variation=0.05)
        builder.cylinder(WOOD_DARK, 0.24, 0.24, 0.1, segments=8, location=(x, 0, 0.05))
        builder.cylinder(WOOD, 0.2, 0.0, 0.3, segments=8, location=(x, 0, 2.55))
    bevelled_box(builder, WOOD_DARK, (2.9, 0.18, 0.12), location=(0, 0, 2.38), bevel=0.03)
    bevelled_box(builder, CREAM, (2.4, 0.12, 0.56), location=(0, 0, 2.02), bevel=0.04)
    bevelled_box(builder, WOOD, (2.48, 0.08, 0.62), location=(0, 0.05, 2.02), bevel=0.03)
    # Rope ties
    for x in (-0.9, 0.9):
        builder.cylinder(INK, 0.012, 0.012, 0.3, segments=4, location=(x, 0, 2.31))
    label = text_mesh("START", size=0.42, depth=0.018)
    merge_object(builder, label, INK, Matrix.Translation((0, -0.075, 2.0)))
    remove(label)
    return builder.to_object("StartGate")


def build_bench():
    builder = Builder(29)
    for x in (-0.48, 0.48):
        bevelled_box(builder, IRON, (0.07, 0.42, 0.42), location=(x, 0, 0.21), bevel=0.01)
        bevelled_box(builder, IRON, (0.06, 0.06, 0.62), location=(x, 0.21, 0.6),
                     rotation=(-0.12, 0, 0), bevel=0.01)
    for index in range(3):
        bevelled_box(builder, WOOD_LIGHT if index % 2 else WOOD, (1.24, 0.12, 0.05),
                     location=(0, -0.14 + index * 0.14, 0.43), bevel=0.012)
    for z in (0.64, 0.8):
        bevelled_box(builder, WOOD, (1.24, 0.05, 0.11), location=(0, 0.24, z),
                     rotation=(-0.12, 0, 0), bevel=0.012)
    return builder.to_object("Bench")


def build_lantern():
    builder = Builder(31)
    builder.cylinder(IRON, 0.1, 0.1, 0.08, segments=8, location=(0, 0, 0.04))
    builder.cylinder(IRON, 0.04, 0.03, 1.32, segments=6, location=(0, 0, 0.7))
    bevelled_box(builder, IRON, (0.22, 0.22, 0.04), location=(0, 0, 1.36), bevel=0.01)
    bevelled_box(builder, LAMP, (0.16, 0.16, 0.22), location=(0, 0, 1.49), bevel=0.01)
    builder.cylinder(IRON, 0.17, 0.0, 0.15, segments=4, location=(0, 0, 1.67),
                     rotation=(0, 0, math.pi / 4))
    return builder.to_object("Lantern")


def build_market_stall():
    """Wildwood Market stall; front faces -Y (three.js +Z), centred on the origin."""
    builder = Builder(37)
    bevelled_box(builder, "#8a7450", (2.2, 1.45, 0.14), location=(0, 0, 0.07), bevel=0.03)
    for x in (-0.95, 0.95):
        for y in (-0.55, 0.45):
            builder.cylinder(WOOD_DARK, 0.06, 0.05, 2.0, segments=6, location=(x, y, 1.1))
    # Counter with planks
    bevelled_box(builder, WOOD, (1.9, 0.5, 0.62), location=(0, -0.42, 0.45), bevel=0.03)
    bevelled_box(builder, WOOD_LIGHT, (2.02, 0.6, 0.06), location=(0, -0.42, 0.79), bevel=0.02)
    for x in (-0.6, 0.0, 0.6):
        bevelled_box(builder, WOOD_DARK, (0.03, 0.02, 0.56), location=(x, -0.675, 0.45), bevel=0)
    # Striped awning, sloping toward the front
    stripes = 7
    for index in range(stripes):
        x = -0.99 + (index + 0.5) * (1.98 / stripes)
        color = CREAM if index % 2 else SAGE
        bevelled_box(builder, color, (1.98 / stripes, 1.45, 0.04), location=(x, -0.08, 2.08),
                     rotation=(-0.2, 0, 0), bevel=0)
        # Scalloped valance
        builder.cylinder(color, 0.14, 0.14, 0.04, segments=10, location=(x, -0.83, 1.92),
                         rotation=(math.pi / 2, 0, 0))
    # Goods on the counter
    for index, color in enumerate(["#d36b4a", "#e2b54a", "#7aa35a", "#c4573f"]):
        builder.blob(color, radius=0.07, subdivisions=1,
                     location=(-0.6 + index * 0.12, -0.45, 0.88), variation=0.06)
    for index in range(2):
        bevelled_box(builder, WOOD_LIGHT, (0.3, 0.3, 0.24),
                     location=(0.85 + index * 0.05, -0.95 - index * 0.2, 0.26 + index * 0.0),
                     rotation=(0, 0, 0.2 * index), bevel=0.02)
    for index in range(5):
        builder.cylinder("#cfae55", 0.045, 0.045, 0.015, segments=10,
                         location=(0.35 + index * 0.06, -0.45, 0.83 + index * 0.016))
    # Sign board on top
    bevelled_box(builder, WOOD_DARK, (1.36, 0.06, 0.44), location=(0, -0.02, 2.48), bevel=0.02)
    bevelled_box(builder, CREAM, (1.26, 0.05, 0.34), location=(0, -0.045, 2.48), bevel=0.015)
    label = text_mesh("WILDWOOD", size=0.2, depth=0.012)
    merge_object(builder, label, INK, Matrix.Translation((0, -0.08, 2.47)))
    remove(label)
    return builder.to_object("MarketStall")


def build_hill():
    builder = Builder(41)
    builder.sphere("#7a9154", 1.0, segments=20, rings=10)
    return builder.to_object("Hill", smooth=True)


def build_cloud():
    builder = Builder(43)
    for x, z, r in [(-0.75, 0, 0.46), (0, 0.15, 0.66), (0.78, 0, 0.5), (0.1, -0.1, 0.56)]:
        builder.blob("#ffffff", radius=r, subdivisions=2, location=(x, 0, z),
                     scale=(1, 0.8, 0.75))
    return builder.to_object("Cloud", smooth=True)


DIE_FACES = {
    # value: (outward normal in Blender space, in-plane right, in-plane up)
    # three.js +Z == Blender -Y, three.js +Y == Blender +Z.
    1: ((0, -1, 0), (1, 0, 0), (0, 0, 1)),  # three +Z
    2: ((0, 0, 1), (1, 0, 0), (0, 1, 0)),  # three +Y
    3: ((1, 0, 0), (0, 1, 0), (0, 0, 1)),  # three +X
    4: ((-1, 0, 0), (0, -1, 0), (0, 0, 1)),  # three -X
    5: ((0, 0, -1), (1, 0, 0), (0, -1, 0)),  # three -Y
    6: ((0, 1, 0), (-1, 0, 0), (0, 0, 1)),  # three -Z
}
PIP_LAYOUTS = {
    1: [(0, 0)],
    2: [(-1, 1), (1, -1)],
    3: [(-1, 1), (0, 0), (1, -1)],
    4: [(-1, 1), (1, 1), (-1, -1), (1, -1)],
    5: [(-1, 1), (1, 1), (0, 0), (-1, -1), (1, -1)],
    6: [(-1, 1), (-1, 0), (-1, -1), (1, 1), (1, 0), (1, -1)],
}


def build_die():
    """A 1.34-unit die with chamfered edges and inset pips. Opposite faces sum to 7."""
    builder = Builder(47)
    half = 0.67
    bevelled_box(builder, "#f7f1e3", (half * 2, half * 2, half * 2), bevel=0.16)
    spacing = 0.27
    for value, (normal, right, up) in DIE_FACES.items():
        n, r, u = Vector(normal), Vector(right), Vector(up)
        rotation = n.to_track_quat("Z", "Y").to_matrix().to_4x4()
        for px, py in PIP_LAYOUTS[value]:
            centre = n * (half - 0.004) + r * (px * spacing) + u * (py * spacing)
            before = set(builder.bm.verts)
            bmesh.ops.create_cone(builder.bm, cap_ends=True, segments=16, radius1=0.1,
                                  radius2=0.1, depth=0.02)
            verts = [vert for vert in builder.bm.verts if vert not in before]
            builder._finish(verts, "#1f2a22", Matrix.Translation(centre) @ rotation)
    return builder.to_object("Die", smooth=False)


# ---------------------------------------------------------------------------

bpy.ops.wm.read_factory_settings(use_empty=True)

PALETTE = bpy.data.materials.new("Palette")
PALETTE.use_nodes = True
_nodes = PALETTE.node_tree.nodes
_bsdf = _nodes.get("Principled BSDF")
_attribute = _nodes.new("ShaderNodeVertexColor")
_attribute.layer_name = "Color"
PALETTE.node_tree.links.new(_attribute.outputs["Color"], _bsdf.inputs["Base Color"])
_bsdf.inputs["Roughness"].default_value = 0.9

objects = [
    build_tree_oak("TreeOakA", seed=3, canopy_count=6),
    build_tree_oak("TreeOakB", seed=5, canopy_count=5),
    build_tree_pine("TreePine", seed=9),
    build_shrub(),
    build_rock(),
    build_mushroom(),
    build_flower(),
    build_tile(),
    build_start_gate(),
    build_bench(),
    build_lantern(),
    build_market_stall(),
    build_hill(),
    build_cloud(),
    build_die(),
]

total_tris = 0
for obj in objects:
    obj.data.calc_loop_triangles()
    tris = len(obj.data.loop_triangles)
    total_tris += tris
    print(f"{obj.name:>12}: {tris:6d} triangles")
print(f"{'total':>12}: {total_tris:6d} triangles")

os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUTPUT,
    export_format="GLB",
    use_selection=False,
    export_apply=True,
    export_texcoords=False,
    export_normals=True,
    export_vertex_color="NAME",
    export_vertex_color_name="Color",
    export_all_vertex_colors=False,
    export_materials="EXPORT",
    export_yup=True,
    export_extras=False,
    export_cameras=False,
    export_lights=False,
)
print(f"wrote {OUTPUT} ({os.path.getsize(OUTPUT) / 1024:.1f} KiB)")
sys.exit(0)
