<image_edit_prompt id="P005" name="Bauhaus Interior Transformation" version="1.0">
  <task>
    Edit the provided input image into a photorealistic post-renovation interior visualization.
    First understand the existing spatial layout, room function, furniture positions, circulation, lighting condition, and visible material state.
    Then transform the interior styling into a refined Bauhaus-inspired home design while keeping the original architecture and spatial structure intact.
  </task>

  <source_image_interpretation>
    Use the input image as the fixed visual base.
    Preserve the camera angle, perspective, room proportions, object scale, and the recognizable identity of the space.
    The output should look like the same room after a realistic interior makeover, not a different room.
  </source_image_interpretation>

  <must_preserve>
    <item>Do not change wall positions, wall openings, room boundaries, or ceiling height.</item>
    <item>Do not add, remove, resize, or relocate windows.</item>
    <item>Do not add, remove, resize, or relocate doors.</item>
    <item>Do not change the ceiling structure, floor plan, floor level, or structural columns.</item>
    <item>Do not expand the room, create impossible extra space, or alter the original perspective.</item>
    <item>Keep the major furniture layout and circulation logic close to the original unless small styling adjustments are necessary.</item>
  </must_preserve>

  <style_direction>
    Transform the visible home interior into a Bauhaus-inspired design:
    clean geometric composition, functional simplicity, balanced asymmetry, modular forms, honest materials, and a calm modernist atmosphere.
    Use a restrained palette based on warm white, soft gray, black accents, natural wood, and controlled Bauhaus primary color accents such as red, blue, or yellow.
    Introduce Bauhaus-style furniture and decor only where it naturally fits the existing layout: tubular steel details, simple wood planes, geometric shelving, clean task lighting, flat woven textiles, and minimal graphic accents.
  </style_direction>

  <renovation_scope>
    Improve visual order, storage clarity, lighting warmth, and material coherence.
    Replace cluttered or visually noisy styling with cleaner Bauhaus-inspired organization.
    Keep the room livable, warm, and realistic rather than making it look like a showroom or museum set.
    Preserve signs of everyday use where appropriate, but make the space feel intentional and composed.
  </renovation_scope>

  <rendering_requirements>
    <item>Photorealistic interior design render.</item>
    <item>Natural daylight or believable indoor lighting consistent with the original image.</item>
    <item>High fidelity to the input image geometry and viewpoint.</item>
    <item>Realistic materials, shadows, reflections, and scale.</item>
    <item>No visible text labels, captions, watermarks, UI elements, diagrams, or before/after split view.</item>
    <item>Output only the transformed after-image.</item>
  </rendering_requirements>

  <negative_constraints>
    Do not create a new floor plan.
    Do not move structural elements.
    Do not add extra windows, doors, stairs, skylights, balconies, or architectural openings.
    Do not change the room into a luxury hotel, futuristic sci-fi room, industrial loft, Scandinavian-only style, or generic showroom.
    Do not overdecorate.
    Do not use excessive primary colors.
    Do not distort furniture scale.
    Do not add people, pets, logos, brand names, readable text, or watermarks.
  </negative_constraints>

  <final_instruction>
    Edit the input image directly. Keep the original spatial structure fixed, and generate a realistic Bauhaus-style home interior makeover of the same space.
  </final_instruction>
</image_edit_prompt>
