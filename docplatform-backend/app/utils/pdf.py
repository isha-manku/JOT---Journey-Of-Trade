"""
On-the-fly PDF generation via Jinja2-templated LaTeX -> pdflatex.
PDFs are NEVER stored on disk permanently; we compile in a temp dir and
return the bytes buffer, then clean up.
"""
import os
import shutil
import subprocess
import tempfile
from jinja2 import Environment, BaseLoader, StrictUndefined

# Dynamically add user-local MiKTeX path to PATH environment variable if xelatex is not found
miktex_path = os.path.expandvars(r"%USERPROFILE%\AppData\Local\Programs\MiKTeX\miktex\bin\x64")
if shutil.which("xelatex") is None and os.path.exists(miktex_path):
    os.environ["PATH"] += os.pathsep + miktex_path

# Custom Jinja2 delimiters that don't collide with LaTeX's {} and %.
LATEX_JINJA_ENV = Environment(
    block_start_string=r"\BLOCK{",
    block_end_string="}",
    variable_start_string=r"\VAR{",
    variable_end_string="}",
    comment_start_string=r"\#{",
    comment_end_string="}",
    line_statement_prefix="%%",
    line_comment_prefix="%#",
    trim_blocks=True,
    autoescape=False,
    undefined=StrictUndefined,
    loader=BaseLoader(),
)

_LATEX_SPECIALS = {
    "&": r"\&", "%": r"\%", "$": r"\$", "#": r"\#", "_": r"\_",
    "{": r"\{", "}": r"\}", "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}", "\\": r"\textbackslash{}",
}


def latex_escape(value) -> str:
    if value is None:
        return ""
    s = str(value)
    return "".join(_LATEX_SPECIALS.get(ch, ch) for ch in s)


LATEX_JINJA_ENV.filters["e"] = latex_escape


class PdfGenerationError(RuntimeError):
    pass


def render_latex(latex_source: str, context: dict) -> str:
    """Render the Jinja2+LaTeX template string with escaped form values."""
    safe_ctx = {k: latex_escape(v) if isinstance(v, (str, int, float)) else v
                for k, v in context.items()}
    template = LATEX_JINJA_ENV.from_string(latex_source)
    return template.render(**safe_ctx)


def compile_pdf(latex_source: str, context: dict) -> bytes:
    """Render + compile to PDF, return bytes. Cleans up all temp artifacts."""
    if shutil.which("xelatex") is None:
        # Fallback to pre-compiled PDFs if TeX distribution is missing
        lang = context.get("_lang", "en").upper()
        doctype = context.get("_doctype", "en").upper()
        
        backend_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
        
        # Try specific PDF like FCO_ZH.pdf or LOI_EN.pdf
        fallback_filename = f"{doctype}_{lang}.pdf"
        fallback_path = os.path.join(backend_dir, fallback_filename)
        
        # Fallback to general en_doc.pdf or zh_doc.pdf
        if not os.path.exists(fallback_path):
            fallback_filename = f"{lang.lower()}_doc.pdf"
            fallback_path = os.path.join(backend_dir, fallback_filename)
            
        if os.path.exists(fallback_path):
            try:
                with open(fallback_path, "rb") as f:
                    return f.read()
            except Exception:
                pass
                
        raise PdfGenerationError("xelatex not found on PATH. Install a TeX distribution.")

    rendered = render_latex(latex_source, context)
    tmpdir = tempfile.mkdtemp(prefix="docgen_")
    try:
        tex_path = os.path.join(tmpdir, "doc.tex")
        with open(tex_path, "w", encoding="utf-8") as f:
            f.write(rendered)

        # Copy all static template images (.png, .jpg, .jpeg) if they exist
        for f in os.listdir(os.getcwd()):
            if f.lower().endswith(('.png', '.jpg', '.jpeg')):
                shutil.copy(os.path.join(os.getcwd(), f), tmpdir)

        # Run once (no cross-references requiring multiple passes in this template).
        proc = subprocess.run(
            ["xelatex", "-synctex=0", "-interaction=nonstopmode", "-halt-on-error", "doc.tex"],
            cwd=tmpdir, capture_output=True, text=True, timeout=60,
        )
        pdf_path = os.path.join(tmpdir, "doc.pdf")
        if not os.path.exists(pdf_path):
            raise PdfGenerationError(
                f"xelatex failed:\n{proc.stdout[-2000:]}\n{proc.stderr[-1000:]}"
            )
        with open(pdf_path, "rb") as f:
            return f.read()
    finally:
        shutil.rmtree(tmpdir, ignore_errors=True)
