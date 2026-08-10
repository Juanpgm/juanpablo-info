// Real, byte-faithful excerpts from the author's own public GitHub repos
// (hand-verified against the live repo source at fast-follow apply time —
// only whitespace/line-wrap trimming applied, no rewriting). Powers the
// About page "Código, no solo discurso" carousel (CodeCarousel.astro).
// Replaces the single fabricated "illustrative, not runnable" placeholder
// that shipped at MVP launch.
import type { Locale } from '../i18n';

type Localized = Record<Locale, string>;

export interface CodeSample {
  id: string;
  repoUrl: string;
  projectName: string;
  // Narrowed to what's actually used (all 4 excerpts are Python) so it
  // satisfies astro:components <Code>'s `CodeLanguage` prop without
  // reaching into Astro's internal type paths — widen if a non-Python
  // sample is ever added.
  language: 'python';
  caption: Localized;
  code: string;
}

export const codeSamples: CodeSample[] = [
  {
    id: 'dagma-360-api',
    repoUrl: 'https://github.com/Juanpgm/api-artefacto-360-dagma',
    projectName: 'API Artefacto 360 DAGMA',
    language: 'python',
    caption: {
      es: 'Arranque de la API de DAGMA-360: FastAPI con limitador de tasa y una pila de middleware ordenada a propósito.',
      en: 'DAGMA-360 API bootstrap: FastAPI with rate limiting and a deliberately ordered middleware stack.',
      de: 'DAGMA-360-API-Start: FastAPI mit Rate-Limiting und einem bewusst geordneten Middleware-Stack.',
    },
    code: `app = FastAPI(
    title="API Artefacto 360 DAGMA",
    description="API para gestión de artefacto de captura 360 con Firebase/Firestore",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# Wire the shared limiter into the app state so SlowAPIMiddleware can find it
# and @limiter.limit() decorators in routers work correctly.
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Middleware stack — Starlette processes add_middleware in LIFO order,
# so register from innermost to outermost:
#   1. Timing (innermost — closest to the handler)
#   2. SlowAPI rate limiting
#   3. GZip compression
#   4. CORS (outermost — must wrap everything, including error responses)`,
  },
  {
    id: 'automl-rain-estimation',
    repoUrl: 'https://github.com/Juanpgm/AutoML4RainEstimation',
    projectName: 'AutoML4RainEstimation',
    language: 'python',
    caption: {
      es: 'Configuración de un modelo NeuralProphet para pronóstico de lluvia con bandas de incertidumbre (cuantiles) y puntos de cambio.',
      en: 'Configuring a NeuralProphet model for rainfall forecasting with uncertainty bands (quantiles) and changepoints.',
      de: 'Konfiguration eines NeuralProphet-Modells zur Regenvorhersage mit Unsicherheitsbändern (Quantilen) und Changepoints.',
    },
    code: `set_random_seed(42)
quantiles = [0.05, 0.95]
params = {
    'quantiles': quantiles,
    'growth': 'discontinuous',
    'n_forecasts': 10,
    'optimizer': 'AdamW',
    'loss_func': nn.HuberLoss,
    'yearly_seasonality': True,
    'n_changepoints': 366,
    'changepoints_range': 0.9,
    'epochs': 300,
}
m = NeuralProphet(**params)
train, val = m.split_df(df_train_NP, freq='D', valid_p=0.2)
metricas = m.fit(train, freq="D", validation_df=val, early_stopping=True, checkpointing=True)`,
  },
  {
    id: 'dagma-emergency-bot',
    repoUrl: 'https://github.com/Juanpgm/emergencias-chatbot-dagma',
    projectName: 'DAGMA Emergencias Bot',
    language: 'python',
    caption: {
      es: 'Extracción de ubicación desde texto informal en español con LangChain + Groq (Llama 3.3), usando salida estructurada tipada.',
      en: 'Extracting location from informal Spanish text with LangChain + Groq (Llama 3.3), using typed structured output.',
      de: 'Standortextraktion aus informellem spanischem Text mit LangChain + Groq (Llama 3.3) und typisierter strukturierter Ausgabe.',
    },
    code: `_prompt_ubicacion = ChatPromptTemplate.from_messages([
    ("system", _SYSTEM_UBICACION),
    ("human", "{contexto}{texto}"),
])

_chain_ubicacion = _prompt_ubicacion | _llm.with_structured_output(DatosUbicacion)


async def extraer_ubicacion(texto: str, contexto_reporte: str | None = None) -> DatosUbicacion:
    """Extrae dirección y ubicación inferida de un mensaje de seguimiento.

    contexto_reporte: descripción original del reporte (ayuda al LLM a inferir
    ubicación si el ciudadano da una respuesta corta como "aquí en el Limonar").
    """
    logger.info("Extrayendo ubicación (%d caracteres)", len(texto))
    prefijo = f"[Contexto: {contexto_reporte}]\\n\\nRespuesta: " if contexto_reporte else ""
    return await _chain_ubicacion.ainvoke({"contexto": prefijo, "texto": texto})`,
  },
  {
    id: 'civil-budget-pdf-extractor',
    repoUrl: 'https://github.com/Juanpgm/pdf_pptos_civil',
    projectName: 'PDF Presupuestos Civil',
    language: 'python',
    caption: {
      es: 'Extracción de Análisis de Precios Unitarios (APU) desde PDFs de presupuestos de obra civil, con expresiones regulares sobre el texto extraído.',
      en: 'Extracting Unit Price Analyses (APU) from civil-works budget PDFs, using regular expressions over the extracted text.',
      de: 'Extraktion von Einheitspreisanalysen (APU) aus PDF-Bauprojektbudgets mittels regulärer Ausdrücke über den extrahierten Text.',
    },
    code: `class APUExtractor:
    def __init__(self, context_folder="context"):
        self.context_folder = context_folder
        self.pdf_files = [
            "APUS_CONSTRUCCIÓN GUADUAS.pdf",
            "APUS_URBANISMO GUADUAS.pdf",
            "APUS_VIAS GUADUAS.pdf",
        ]
        self.all_apus = []

    def extract_apu_from_text(self, text, page_num):
        """Extrae un Análisis de Precio Unitario (APU) del texto de una página."""
        item_match = re.search(r'ITEM:\\s*(\\d+\\.\\d+)\\.\\s*([^\\n]+)', text)
        if not item_match:
            return None

        apu_data = {
            'item_number': item_match.group(1),
            'item_description': item_match.group(2).strip(),
            'page': page_num,
        }`,
  },
];
