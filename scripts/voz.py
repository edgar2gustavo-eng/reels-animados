"""Voz IA local en español (Kokoro), sin internet y gratis.

Uso:
  python voz.py "Texto del guion..." --voz alex --salida assets/voz.wav
  python voz.py guion.txt --voz dora --velocidad 0.95 --pausa 0.3

Voces en español: dora (femenina), alex (masculina), santa (masculina, más grave).
Genera frase por frase y las une con una pausa corta: suena más natural que todo de corrido
y deja respirar los subtítulos.
"""
import argparse
import re
import sys
from pathlib import Path

VOCES = {"dora": "ef_dora", "alex": "em_alex", "santa": "em_santa"}
CACHE = Path.home() / ".cache" / "hyperframes" / "tts"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("texto", help="el guion, o la ruta a un .txt")
    ap.add_argument("--voz", default="alex", choices=list(VOCES))
    ap.add_argument("--velocidad", type=float, default=1.0, help="0.8 = más lenta, 1.2 = más rápida")
    ap.add_argument("--pausa", type=float, default=0.25, help="segundos de silencio entre frases")
    ap.add_argument("--salida", default="assets/voz.wav")
    a = ap.parse_args()

    try:
        import numpy as np
        import soundfile as sf
        from kokoro_onnx import Kokoro
    except ImportError:
        sys.exit("Falta la voz local. Corre: node <skill>/scripts/preparar.mjs --voz")

    modelo, voces = CACHE / "models" / "kokoro-v1.0.onnx", CACHE / "voices" / "voices-v1.0.bin"
    if not modelo.exists() or not voces.exists():
        sys.exit("Falta el modelo de voz. Corre: node <skill>/scripts/preparar.mjs --voz")

    texto = Path(a.texto).read_text(encoding="utf-8") if a.texto.endswith(".txt") and Path(a.texto).exists() else a.texto
    texto = re.sub(r"\s+", " ", texto.replace("*", "")).strip()
    # Frases: corta en . ? ! … conservando los signos de apertura del español.
    frases = [f.strip() for f in re.split(r"(?<=[.?!…])\s+", texto) if f.strip()]

    k = Kokoro(str(modelo), str(voces))
    partes, sr = [], 24000
    for i, frase in enumerate(frases):
        audio, sr = k.create(frase, voice=VOCES[a.voz], speed=a.velocidad, lang="es")
        partes.append(audio)
        if i < len(frases) - 1:
            partes.append(np.zeros(int(sr * a.pausa), dtype=audio.dtype))
    salida = Path(a.salida)
    salida.parent.mkdir(parents=True, exist_ok=True)
    total = np.concatenate(partes)
    sf.write(str(salida), total, sr)
    palabras = len(texto.split())
    dur = len(total) / sr
    print(f"{salida} · voz {a.voz} · {len(frases)} frases · {palabras} palabras · {dur:.1f} s ({palabras / dur:.1f} palabras/s)")


if __name__ == "__main__":
    main()
