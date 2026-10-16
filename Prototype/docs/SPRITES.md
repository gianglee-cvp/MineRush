# Mine Rush – Danh sách sprite và prompt tạo ảnh

## Cách làm
1. Mỗi sprite tạo **một ảnh riêng, một vật thể duy nhất**.
2. Ghép **phần phong cách chung** (bên dưới) vào trước prompt của từng sprite.
3. Tạo ở **gấp đôi kích thước ghi trong bảng** (ví dụ ô 104px thì tạo 208px hoặc lớn hơn, đúng tỉ lệ). Game tự thu nhỏ.
4. **Nền trong suốt** (PNG). Nếu tool không xuất được nền trong suốt, dùng nền phẳng màu `#FF00FF` rồi tách nền (remove.bg, Photoshop...).
5. **Không có chữ hay số trong ảnh.** Dấu "?", số đếm trên thùng gỗ, mũi tên ghi rẽ... game tự vẽ đè lên.
6. Lưu vào `assets/sprites/` **đúng tên file** trong bảng. Thiếu file nào thì game tự dùng ảnh tạm cho file đó.

## Phong cách chung (dán vào đầu mọi prompt)
```
2D mobile puzzle game asset, hand-painted cartoon style like a premium casual mobile game,
soft thick dark-brown outlines, vibrant saturated colors, warm lantern lighting from the top-left,
subtle bevels and highlights, slight front view with a little top-down tilt, clean readable silhouette,
single object centered, isolated on a transparent background, no text, no letters, no numbers, no watermark
```

---

## A. Nền và khung hố mỏ

| # | File | Kích thước | Prompt (sau phần phong cách chung) |
|---|---|---|---|
| 1 | `bg_surface.png` | 1080×520 | `wide landscape background for the top of a mobile game screen: bright blue sky with soft clouds, distant blue low-poly-ish mountains with snow caps, dense pine forest, a flat grassy ground strip along the bottom edge, empty open ground in the middle (no buildings, no characters), full bleed, NOT transparent` |
| 2 | `bg_cave.png` | 1080×1300 | `back wall of an underground mine seen straight on: dark charcoal and brown rocky cave wall made of chunky coal-like boulders, subtle warm orange light spots, darker toward the edges and the bottom, even texture with no focal point, full bleed, NOT transparent` |
| 3 | `cliff_left.png` | 240×1400 | `tall vertical brown layered rock cliff edge, the right side is the inner edge facing a mine pit, chunky angular rock slabs with dark crevices, strata in several brown tones, green grass on top and a few small bushes and hanging vines on the face` (game tự lật ngang để làm vách phải) |
| 4 | `frame_post.png` | 64×640 | `vertical wooden mine support post, thick weathered brown timber with wood grain, dark iron bands with rivets, seamless tileable from top to bottom` |
| 5 | `frame_beam.png` | 640×56 | `horizontal wooden mine support beam, thick weathered brown timber with wood grain and iron nails, seamless tileable left to right` |
| 6 | `frame_brace.png` | 140×140 | `short diagonal wooden corner brace for a mine timber frame, going from bottom-left to top-right, weathered brown wood with iron bolts at both ends` |
| 7 | `grass_edge.png` | 540×70 | `strip of soft overhanging grass and small leaves hanging down over a dirt edge, seamless tileable left to right` |

## B. Ô trên bàn chơi (ô 104px)

| # | File | Kích thước | Prompt |
|---|---|---|---|
| 8 | `cell_tile.png` | 104×104 | `square stone tile slot set into a mine wall, dark charcoal stone with a beveled rim and slightly lighter inner face, empty` |
| 9 | `ore_gold.png` | 96×96 | `chunky faceted gold ore gem, cut like a rounded cube with large flat facets, bright yellow-gold with white sparkle highlights` |
| 10 | `ore_copper.png` | 96×96 | `chunky faceted copper ore gem, cut like a rounded cube with large flat facets, glossy orange-red copper with bright highlights` |
| 11 | `ore_jade.png` | 96×96 | `chunky faceted emerald jade gem, cut like a rounded cube with large flat facets, glossy saturated green with bright highlights` |
| 12 | `ore_iron.png` | 96×96 | `chunky faceted iron ore chunk, metallic silver-grey with cool blue reflections, large flat facets, clearly metal, not stone` |
| 13 | `ore_diamond.png` | 96×96 | `large brilliant cut blue diamond, glowing light blue, sharp facets and sparkles, very precious looking` |
| 14 | `rock.png` | 96×96 | `cluster of three plain grey-brown stones, rough matte rock, no gems, clearly worthless rubble` |
| 15 | `hidden.png` | 96×96 | `dark mysterious rough stone block covered in soot, very dark grey, slightly glowing cracks, unknown contents` |
| 16 | `crate.png` | 96×96 | `square wooden mine crate with an X brace on the front, sturdy brown planks with iron corners` |
| 17 | `bedrock.png` | 104×104 | `solid black coal-like bedrock block filling a grid square, dark and matte, clearly not diggable` |
| 18 | `tunnel.png` | 104×104 | `dark empty mine tunnel interior square, deep shadow with faint rocky texture, seamless on all four sides` |

## C. Ray, giếng, thang máy, xe goòng

| # | File | Kích thước | Prompt |
|---|---|---|---|
| 19 | `rail_v.png` | 104×104 | `straight vertical mine cart rail track, two steel rails on wooden ties, seen from the front, seamless top to bottom` |
| 20 | `rail_h.png` | 104×104 | `straight horizontal mine cart rail track, two steel rails on wooden ties, slight top-down view, seamless left to right` |
| 21 | `rail_ramp.png` | 210×210 | `diagonal mine cart rail ramp going from bottom-left up to top-right, steel rails on wooden ties supported by a wooden trestle` |
| 22 | `shaft_head.png` | 150×120 | `small wooden mine shaft headframe, square timber box with a big X brace, seen from the front` |
| 23 | `switch_plate.png` | 76×76 | `small square wooden sign plate with a gold metal border, blank center (game draws the arrow)` |
| 24 | `elevator.png` | 96×116 | `small mine elevator cage, blue painted metal frame with bars, open front, empty inside` |
| 25 | `cart.png` | 96×66 | `empty steel mine cart, front view, dark grey metal tub with rivets and a lighter rim, four small wheels` |
| 26 | `pile_gold.png` | 80×42 | `heap of gold ore nuggets that fits on top of a mine cart, bright yellow` |
| 27 | `pile_copper.png` | 80×42 | `heap of copper ore chunks that fits on top of a mine cart, orange-red` |
| 28 | `pile_jade.png` | 80×42 | `heap of green jade crystals that fits on top of a mine cart` |
| 29 | `pile_iron.png` | 80×42 | `heap of silver-grey iron ore chunks that fits on top of a mine cart` |
| 30 | `pile_rock.png` | 80×42 | `heap of plain grey rubble that fits on top of a mine cart` |
| 31 | `pile_diamond.png` | 80×42 | `heap of glowing blue diamonds that fits on top of a mine cart` |

## D. Mặt đất

| # | File | Kích thước | Prompt |
|---|---|---|---|
| 32 | `mine_entrance.png` | 300×260 | `wooden mine entrance shack built into a small rocky hill, dark doorway, timber frame and plank roof, small rail track coming out` |
| 33 | `miner.png` | 110×150 | `cute chibi miner character standing, yellow hard hat with head lamp, blue overalls, holding a pickaxe, friendly smile, full body` |
| 34 | `furnace.png` | 230×300 | `compact industrial blast furnace: tall orange tapered stack with a grey ribbed panel band in the middle, four grey pipes curving down from the top, a big orange arcing pipe to a small grey tank, rusty base platform, a dark arched tap hole at the bottom front (empty, game draws the fire)` |
| 35 | `fire.png` | 96×110 | `cartoon fire flame, bright orange outside and yellow core, three tongues of flame, soft glow` |
| 36 | `siding_bay.png` | 150×120 | `empty mine cart parking bay, dark steel frame box with a short rail on the floor, open front, wooden top rim` |
| 37 | `chest.png` | 110×90 | `small wooden treasure chest with gold trim, slightly open, glowing blue light inside` |
| 38 | `lantern.png` | 40×64 | `old iron mine lantern with a hook, warm glowing yellow glass` |

## E. Giao diện

| # | File | Kích thước | Prompt |
|---|---|---|---|
| 39 | `hand.png` | 120×120 | `cartoon white glove hand pointing with the index finger toward the top-left, thick outline, tutorial pointer` |
| 40 | `icon_rail.png` | 120×120 | `game booster icon: short wooden mine rail track with a glowing blue plus sign` |
| 41 | `icon_lift.png` | 120×120 | `game booster icon: small yellow mine elevator cage on a wooden frame with up and down arrows` |
| 42 | `icon_tnt.png` | 120×120 | `game booster icon: bundle of three red dynamite sticks with a lit sparkling fuse` |
| 43 | `icon_lamp.png` | 120×120 | `game booster icon: black flashlight shining a bright yellow beam` |

---

## Thứ tự ưu tiên nếu không làm hết một lúc
1. **Bàn chơi:** 8–18 (ô, quặng, đá, thùng, "?")
2. **Xe và ray:** 19–31
3. **Lò, sân ga, mặt đất:** 32–38
4. **Nền và khung:** 1–7
5. **Giao diện:** 39–43 (đã có icon vẽ bằng code, không bắt buộc)

## Mẹo để các ảnh đồng bộ phong cách
- Dùng **cùng một tool, cùng seed hoặc style reference** cho mọi sprite. Đính kèm ảnh mockup làm ảnh tham chiếu phong cách nếu tool cho phép.
- Tạo cả nhóm quặng (9–13) **trong cùng một phiên** để giữ đúng một kiểu cắt khối và ánh sáng.
- Ánh sáng **luôn từ trên-trái** để bóng các vật khớp nhau.
