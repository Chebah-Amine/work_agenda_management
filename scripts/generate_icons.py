"""Génère les icônes de l'app : un calendrier avec une horloge, aux couleurs du thème.

Usage : python scripts/generate_icons.py assets/images [apercu.png]
"""
import sys
from pathlib import Path

from PIL import Image, ImageDraw

OUT = Path(sys.argv[1])
SS = 4  # suréchantillonnage pour des bords lisses

PRIMARY = (59, 91, 219, 255)       # colors.primary  #3B5BDB
PRIMARY_DARK = (44, 70, 180, 255)
HEADER = (30, 45, 125, 255)        # bandeau du calendrier, plus foncé que le fond
LIGHT = (231, 236, 253, 255)       # colors.primaryLight #E7ECFD
WHITE = (255, 255, 255, 255)
ACCENT = (21, 128, 61, 255)        # colors.success #15803D
CELL = (200, 210, 245, 255)


def draw_symbol(d: ImageDraw.ImageDraw, cx: float, cy: float, s: float, mono=False):
    """Dessine le calendrier + horloge, centré en (cx, cy), de largeur s."""
    fg = WHITE if mono else None
    w, h = s, s * 0.92
    x0, y0 = cx - w / 2, cy - h / 2 + s * 0.04
    r = s * 0.12
    # Page du calendrier
    d.rounded_rectangle([x0, y0, x0 + w, y0 + h], r, fill=fg or WHITE)
    # Bandeau du haut
    band = h * 0.26
    if not mono:
        d.rounded_rectangle([x0, y0, x0 + w, y0 + band + r], r, fill=HEADER)
        d.rectangle([x0, y0 + band, x0 + w, y0 + band + r + 2], fill=WHITE)
    # Anneaux
    ring_w, ring_h = s * 0.07, s * 0.2
    for fx in (0.28, 0.72):
        rx = x0 + w * fx
        d.rounded_rectangle(
            [rx - ring_w / 2, y0 - ring_h * 0.45, rx + ring_w / 2, y0 + ring_h * 0.55],
            ring_w / 2,
            fill=fg or PRIMARY_DARK,
            outline=None if mono else WHITE,
            width=int(s * 0.018),
        )
    # Grille de jours (3 x 3), sans le coin bas-droit occupé par l'horloge
    if not mono:
        gx0, gy0 = x0 + w * 0.13, y0 + band + h * 0.1
        cw, ch = w * 0.19, h * 0.15
        gap_x, gap_y = w * 0.075, h * 0.06
        for row in range(3):
            for col in range(3):
                if row >= 1 and col == 2:
                    continue
                cx0 = gx0 + col * (cw + gap_x)
                cy0 = gy0 + row * (ch + gap_y)
                color = PRIMARY if (row, col) == (0, 1) else CELL
                d.rounded_rectangle([cx0, cy0, cx0 + cw, cy0 + ch], s * 0.03, fill=color)
    # Horloge
    cr = s * 0.25
    ccx, ccy = x0 + w * 0.8, y0 + h * 0.8
    if mono:
        d.ellipse([ccx - cr, ccy - cr, ccx + cr, ccy + cr], fill=(0, 0, 0, 0))
        ring = s * 0.05
        d.ellipse([ccx - cr + ring, ccy - cr + ring, ccx + cr - ring, ccy + cr - ring], fill=WHITE)
        hand = (0, 0, 0, 0)
    else:
        d.ellipse([ccx - cr, ccy - cr, ccx + cr, ccy + cr], fill=WHITE)
        inner = s * 0.035
        d.ellipse([ccx - cr + inner, ccy - cr + inner, ccx + cr - inner, ccy + cr - inner], fill=ACCENT)
        hand = WHITE
    lw = int(s * 0.045)
    d.line([ccx, ccy, ccx, ccy - cr * 0.55], fill=hand, width=lw)
    d.line([ccx, ccy, ccx + cr * 0.42, ccy + cr * 0.12], fill=hand, width=lw)
    dot = lw * 0.7
    d.ellipse([ccx - dot, ccy - dot, ccx + dot, ccy + dot], fill=hand)


def render(size, bg, symbol_ratio, mono=False):
    big = size * SS
    img = Image.new("RGBA", (big, big), bg)
    d = ImageDraw.Draw(img)
    draw_symbol(d, big / 2, big / 2, big * symbol_ratio, mono=mono)
    return img.resize((size, size), Image.LANCZOS)


def rounded_bg(size):
    """Fond dégradé bleu pour l'icône iOS / web (iOS arrondit lui-même les coins)."""
    img = Image.new("RGBA", (size, size))
    top, bottom = (84, 116, 235), (44, 70, 180)
    d = ImageDraw.Draw(img)
    for y in range(size):
        t = y / (size - 1)
        d.line([0, y, size, y], fill=tuple(int(a + (b - a) * t) for a, b in zip(top, bottom)) + (255,))
    return img


def main():
    OUT.mkdir(parents=True, exist_ok=True)

    # Icône principale (iOS, web) : fond bleu plein, symbole centré.
    base = rounded_bg(1024 * SS)
    d = ImageDraw.Draw(base)
    draw_symbol(d, 1024 * SS / 2, 1024 * SS / 2, 1024 * SS * 0.62)
    icon = base.resize((1024, 1024), Image.LANCZOS).convert("RGB")
    icon.save(OUT / "icon.png")

    # Android adaptatif : le système recadre ~1/3 des bords, symbole dans la zone sûre (66 %).
    render(1024, (0, 0, 0, 0), 0.5).save(OUT / "android-icon-foreground.png")
    Image.new("RGB", (1024, 1024), PRIMARY[:3]).save(OUT / "android-icon-background.png")
    render(1024, (0, 0, 0, 0), 0.5, mono=True).save(OUT / "android-icon-monochrome.png")

    # Splash : symbole sur fond transparent (la couleur de fond est dans app.json).
    splash = Image.new("RGBA", (1024 * SS, 1024 * SS), (0, 0, 0, 0))
    sd = ImageDraw.Draw(splash)
    sd.rounded_rectangle([0, 0, 1024 * SS, 1024 * SS], 230 * SS, fill=PRIMARY)
    draw_symbol(sd, 1024 * SS / 2, 1024 * SS / 2, 1024 * SS * 0.62)
    splash.resize((1024, 1024), Image.LANCZOS).save(OUT / "splash-icon.png")

    # Favicon web.
    icon.resize((48, 48), Image.LANCZOS).save(OUT / "favicon.png")

    # Planche d'aperçu facultative (non utilisée par l'app).
    if len(sys.argv) < 3:
        return
    sheet = Image.new("RGB", (1240, 420), (243, 245, 250))
    for i, name in enumerate(["icon", "android-icon-foreground", "android-icon-monochrome", "splash-icon"]):
        im = Image.open(OUT / f"{name}.png").convert("RGBA").resize((280, 280), Image.LANCZOS)
        tile = Image.new("RGBA", (280, 280), (59, 91, 219, 255) if "android" in name else (243, 245, 250, 255))
        if name == "android-icon-monochrome":
            tile = Image.new("RGBA", (280, 280), (40, 40, 40, 255))
        tile.alpha_composite(im)
        sheet.paste(tile.convert("RGB"), (20 + i * 305, 70))
    sheet.save(Path(sys.argv[2]))


if __name__ == "__main__":
    main()
