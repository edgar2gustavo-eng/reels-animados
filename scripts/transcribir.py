"""Transcribe una grabación a palabras con marca de tiempo (formato HyperFrames).

Uso:
  python transcribir.py <audio-o-video> [--salida palabras.json] [--modelo small]
                        [--idioma es] [--marca ~/.reels-animados/marca.json]

Salida: una lista [{ "id": "w0", "text": "Hola", "start": 0.0, "end": 0.42 }, ...]

El glosario de la marca (nombres propios, tu marca, tu @usuario) se usa dos veces:
como pista para el reconocedor y para corregir la transcripción al final.
"""
import argparse
import json
import os
import re
import sys
import unicodedata
from pathlib import Path


def sin_tildes(s):
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def clave(s):
    """Forma comparable de una palabra: minúsculas, sin tildes, sin puntuación."""
    return re.sub(r"[^\w]", "", sin_tildes(s).lower())


def cargar_glosario(ruta):
    if not ruta or not Path(ruta).expanduser().exists():
        return {}
    marca = json.loads(Path(ruta).expanduser().read_text(encoding="utf-8"))
    return marca.get("glosario", {}) or {}


def aplicar_glosario(palabras, glosario):
    """Reemplaza secuencias de 1-3 palabras que coinciden con una entrada del glosario.

    Compara sin tildes ni puntuación, así "chat gpt" encuentra "Chat, GPT."
    y lo convierte en "ChatGPT" conservando la puntuación final.
    """
    if not glosario:
        return palabras
    reglas = sorted(((clave_frase(k), v) for k, v in glosario.items()), key=lambda r: -len(r[0]))
    salida, i = [], 0
    while i < len(palabras):
        hecho = False
        for claves, reemplazo in reglas:
            n = len(claves)
            trozo = palabras[i:i + n]
            if len(trozo) == n and [clave(p["text"]) for p in trozo] == claves:
                final = re.search(r"[.,;:!?…]+$", trozo[-1]["text"])
                salida.append({"text": reemplazo + (final.group(0) if final else ""),
                               "start": trozo[0]["start"], "end": trozo[-1]["end"]})
                i += n
                hecho = True
                break
        if not hecho:
            salida.append(palabras[i])
            i += 1
    return salida


def unir_simbolos(palabras):
    """Whisper separa "90 %" o "$ 50": pega el símbolo a su número para que se lea como una cifra."""
    salida = []
    for p in palabras:
        if re.fullmatch(r"[%°]+[.,;:!?]*", p["text"]) and salida:
            salida[-1] = {**salida[-1], "text": salida[-1]["text"] + p["text"], "end": p["end"]}
        elif salida and re.fullmatch(r"[$€£]", salida[-1]["text"]):
            salida[-1] = {**p, "text": salida[-1]["text"] + p["text"], "start": salida[-1]["start"]}
        else:
            salida.append(p)
    return salida


def clave_frase(frase):
    return [clave(p) for p in frase.split() if clave(p)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("entrada")
    ap.add_argument("--salida", default="palabras.json")
    ap.add_argument("--modelo", default="small", help="tiny, base, small, medium, large-v3")
    ap.add_argument("--idioma", default="es")
    ap.add_argument("--marca", default=str(Path.home() / ".reels-animados" / "marca.json"))
    args = ap.parse_args()

    try:
        from faster_whisper import WhisperModel
    except ImportError:
        sys.exit("Falta faster-whisper. Corre: <venv>/pip install faster-whisper")

    glosario = cargar_glosario(args.marca)
    pista = ", ".join(glosario.values()) or None

    modelo = WhisperModel(args.modelo, device="cpu", compute_type="int8")
    # vad_filter=False: el filtro de voz a veces se come palabras cortas ("y", "yo").
    segmentos, info = modelo.transcribe(args.entrada, language=args.idioma, word_timestamps=True,
                                        vad_filter=False, initial_prompt=pista)
    palabras = []
    for seg in segmentos:
        for w in seg.words or []:
            texto = w.word.strip()
            if texto:
                palabras.append({"text": texto, "start": round(w.start, 3), "end": round(w.end, 3)})

    palabras = unir_simbolos(palabras)
    # Whisper a veces deja en minúscula el inicio de una frase ("publicas todos los días…").
    # Va antes del glosario, para que una marca como "ChatGPT" o "iPhone" conserve su forma.
    for i, p in enumerate(palabras):
        if i == 0 or re.search(r"[.?!…]$", palabras[i - 1]["text"]):
            t = p["text"]
            j = 1 if t[:1] in "¿¡" else 0
            p["text"] = t[:j] + t[j:j + 1].upper() + t[j + 1:]
    palabras = aplicar_glosario(palabras, glosario)
    for i, p in enumerate(palabras):
        # Whisper a veces devuelve palabras de duración cero; dales un mínimo visible.
        if p["end"] <= p["start"]:
            p["end"] = round(p["start"] + 0.12, 3)
        p["id"] = f"w{i}"
        palabras[i] = {"id": p["id"], "text": p["text"], "start": p["start"], "end": p["end"]}

    Path(args.salida).write_text(json.dumps(palabras, ensure_ascii=False, indent=1), encoding="utf-8")
    dur = palabras[-1]["end"] if palabras else 0
    print(f"{len(palabras)} palabras, {dur:.1f} s de voz → {args.salida}")
    print("Texto:", " ".join(p["text"] for p in palabras))


if __name__ == "__main__":
    main()
