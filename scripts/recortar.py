"""Quita el fondo de imágenes (fotos, renders 3D, stickers) y las deja listas para los estilos monocromo y cine:
PNG transparente, recortado al objeto y con un poco de aire alrededor. Usa rembg (código abierto, local).

Uso:
  python recortar.py imagen.jpg [otra.png ...] [--salida assets] [--modelo isnet-general-use] [--arriba 0.04]

  --modelo   isnet-general-use (por defecto, bordes finos) · u2net · birefnet-general (más lento, el mejor)
  --arriba   recorta primero esa fracción de arriba (por ejemplo, un pie de foto o una marca de agua)
  --abajo    lo mismo, abajo
  --tinta    para luces sobre fondo negro (tableros, neones, pantallas): la luz se vuelve tinta oscura
             sobre transparente, como una ilustración impresa. Ideal para el estilo monocromo.

Primera vez: descarga el modelo (~180 MB) a ~/.rembg/models. Si la imagen ya es transparente, solo se recorta.
Las imágenes con el cuadriculado de "transparente" pintado encima (típico de sitios de stickers) también
funcionan: el modelo separa el objeto del cuadriculado.
"""
import argparse
import sys
from pathlib import Path

from PIL import Image


def sin_migajas(im):
    """Borra manchitas sueltas (restos del fondo) que no tocan al objeto: quedan las piezas grandes."""
    try:
        import numpy as np
        from scipy import ndimage
    except ImportError:
        return im
    a = np.asarray(im).copy()
    piezas, n = ndimage.label(a[..., 3] > 12)
    if n < 2:
        return im
    areas = ndimage.sum(np.ones_like(piezas), piezas, index=range(1, n + 1))
    chicas = [k + 1 for k, ar in enumerate(areas) if ar < areas.max() * 0.02]
    a[np.isin(piezas, chicas), 3] = 0
    return Image.fromarray(a, "RGBA")


def main():
    sys.stdout.reconfigure(encoding="utf-8")
    ap = argparse.ArgumentParser()
    ap.add_argument("imagenes", nargs="+")
    ap.add_argument("--salida", default="assets")
    ap.add_argument("--modelo", default="isnet-general-use")
    ap.add_argument("--arriba", type=float, default=0.0)
    ap.add_argument("--abajo", type=float, default=0.0)
    ap.add_argument("--tinta", action="store_true", help="luz sobre negro → tinta oscura sobre transparente")
    ap.add_argument("--aire", type=float, default=0.03, help="margen alrededor del objeto (fracción del lado mayor)")
    a = ap.parse_args()

    from rembg import new_session, remove
    sesion = None
    destino = Path(a.salida)
    destino.mkdir(parents=True, exist_ok=True)
    for ruta in a.imagenes:
        im = Image.open(ruta).convert("RGBA")
        w, h = im.size
        if a.arriba or a.abajo:
            im = im.crop((0, int(h * a.arriba), w, int(h * (1 - a.abajo))))
        alfa = im.getchannel("A").getextrema()
        if a.tinta:
            import numpy as np
            px = np.asarray(im.convert("RGB")).astype(float)
            lum = 0.3 * px[..., 0] + 0.59 * px[..., 1] + 0.11 * px[..., 2]
            capa = np.zeros(px.shape[:2] + (4,), np.uint8)
            capa[..., :3] = 22
            capa[..., 3] = np.clip((lum - 18) * 1.6, 0, 255).astype(np.uint8)
            im = Image.fromarray(capa, "RGBA")
        elif alfa[0] == 255:   # sin transparencia: hay que quitar el fondo
            if sesion is None:
                sesion = new_session(a.modelo)
            im = remove(im, session=sesion, post_process_mask=True)
        im = sin_migajas(im)
        caja = im.getchannel("A").point(lambda v: 255 if v > 12 else 0).getbbox()
        if not caja:
            print(f"✖ {ruta}: no encontré ningún objeto")
            continue
        im = im.crop(caja)
        m = int(max(im.size) * a.aire)
        lienzo = Image.new("RGBA", (im.width + 2 * m, im.height + 2 * m), (0, 0, 0, 0))
        lienzo.paste(im, (m, m))
        salida = destino / (Path(ruta).stem + ".png")
        lienzo.save(salida)
        print(f"✔ {salida} · {lienzo.width}×{lienzo.height}")


if __name__ == "__main__":
    main()
