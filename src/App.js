import React, { useState, useRef, useEffect } from "react";
import {
  Calendar,
  Users,
  AlertTriangle,
  CheckCircle,
  TrendingDown,
  TrendingUp,
  Activity,
  HardHat,
  BarChart3,
  ArrowRight,
  MessageSquare,
  Send,
  X,
  Sparkles,
  Mail,
  Maximize2,
  ZoomIn,
  XCircle,
  Layers,
  Ruler,
} from "lucide-react";

// --- 1. IMPORTS NUEVOS PARA 3D ---
import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import {
  useGLTF,
  Stage,
  OrbitControls,
  Environment,
  Loader,
} from "@react-three/drei";

// --- GEMINI API CONFIGURATION ---
// IMPORTANTE: Dejar la clave vacía (""). El entorno de Canvas/Code Sandbox la inyectará automáticamente.
const apiKey = "AIzaSyClFd99H56iMoXleQkArkt3wTO3DmEoGJk";

// --- CONTEXTO DEL PROYECTO PARA LA IA ---
const projectContext = `
Eres un asistente experto en gestión de proyectos de construcción para la constructora Jaramillo Mora.
Estás analizando el "Informe Ejecutivo Trialto" con fecha de corte 29 de Noviembre, 2025.

DATOS DEL PROYECTO:
- Proyecto: Trialto Santa Monica Boulevard
- Unidades: 417 Viviendas No VIS
- Inicio: 08/08/2023
- Fin Programado: 30/11/2026
- Personal en obra: 708 (+31 vs mes anterior)

EQUIPO DE TRABAJO TRIALTO

- Ing. RafaeL Velasco (subgerente) "Cabeza del Proyecto"
- Arq. John Coy (coordinador de construcciones) "Responsable en obra del proyecto y del equipo de trabajo"
- Arq. Lizeth Osorio (residente de acabados) "Torre 1"
- Arq. Rene Martinez (residente de estructura) "Torre 1 y Torre 3"
- Ing. Marcela Lopez (Auxiliar de ingenieria) "Torre 1"
- Arq. Martha Palau  (residente de acabados) "Torre 2"
- Ing. Carlos Guzman (residente de estructura) "Torre 2"
- Ing. Samuel Mayac (Auxiliar de ingenieria) "Torre 2"
- Arq. Maribel Valdes (residente de acabados) "Torre 3"
- Arq. Harold León (residente de acabados) "Amenities y Zonas comunes"
- Ing. Nathalia Varón (residente de estructura) "Plataforma"
- Ing. Fabian Valencia (Auxiliar de ingenieria) "Torre 3"
- Ing. Eduardo Izquierdo (Residente de estructura) "Urbanismo"
- Arq. Adolfo Trullo (Proyectista formaleta)
- Ing. Julian Restrepo (Auxiliar Lean)
- Ing. Sugey Castro (Ingeniera Lean)

ESTADO GENERAL:
- Avance Físico: 55% (PROGRAMADO: 65%, Desviación: -10%)
- SPI: 0.85 (Eficiencia media) 
- Atraso General: 31 días (se recuperaron 2 días vs el periodo anterior)
- Estado: PRECAUCIÓN

AVANCE POR TORRES:
- Plataforma: 99% ejecutado (PROGRAMADO 99%)
- Torre 1 (Etapa I): 71% ejecutado (PROGRAMADO 85%, Atraso 68 días)
- Torre 2 (Etapa II): 45% ejecutado (PROGRAMADO 63%, Atraso 53 días)
- Torre 3 (Etapa III): 23% ejecutado (PROGRAMADO 28%, Atraso 31 días)

ATRASO O ADELANTO POR TORRES: ACTIVIDADES
- Plataforma: 99% ejecutado (PROGRAMADO 99%), ADELANTO de 6 días) - Pendiente losa pozo de reinyección que se funde 27 de noviembre de 2025
- Torre 1 (Etapa I):Atraso en ruta critica, carpinteria en madera en vista que el contratista PLEXO le falta ingresar gente y el avance no va de acuerdo a lo planeado. Ademas la Ventaneria tambien presenta atrasos por falta de liberación de estructura en la actividad de repellos y vanos.
- Torre 2 (Etapa II): 45% ejecutado (PROGRAMADO 63%, Atraso 53 días)
- Torre 3 (Etapa III): 23% ejecutado (PROGRAMADO 28%, Atraso 31 días)

CONSUMOS Y MATERIALES (NUEVO):
- Concreto Real: 29,882 m3 | Teórico Ejecutado: 28,955 m3 | Presupuestado: 30,462 m3 | Teórico total: 30,837 m3
- Desperdicio Concreto: 3.20% (Controlado)
- Acero: Consumo Real: 4.963.440 kg | Consumo Proyectado: 4.967.440 kg |Pendiente por pedir: 4000 kg | Presupestado Total: 5.216.824 kg
- Malla: Consumo Real: 54174 kg | Consumo Proyectado: 55174 kg | Pendiente por pedir: 1000 kg | Presupestado Total: 69732 kg
- Acero: Ahorro proyectado de 249 Toneladas respecto al presupuesto.
- Cuantía de diseño: 79.90 kg/m2
- Cuantía del proyecto: 76.01 kg/m2
- Cuantía Estructural (Losa +Columnas): 57.60 Kg/m2.
- Inventario: Pendiente por pedir 4 Toneladas.

RUTA CRÍTICA Y RIESGOS:
- El mayor riesgo es "Carpinteria en madera" y "Ventaneria" con retrass de 68 dias en Torre 1 y 53 dias en Torre 2.Se crea programa remedial para hacerle seguimiento
- Actividades críticas: Carpinteria en madera Torre 1 y Torre 2, Ventaneria en Torre 1 y Torre 2

OBJETIVO PRÓXIMO MES:
- Terminar fundiciones de muros pescantes Torre 3.
- Nivelar hidraulica Torre 3 en el piso 9.
- Cerrar estructura de plataforma al 100%.
- Terminar mamposteria interna Torre 2
- Finalizar entrega 1 Torre 1
`;

// --- UTILS & HOOKS ---

const fetchWithExponentialBackoff = async (
  url,
  options,
  maxRetries = 5,
  initialDelay = 1000
) => {
  let delay = initialDelay;
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) return response;
      if (response.status === 429 || response.status >= 500)
        throw new Error(`Error reintentable: ${response.status}`);
      const errorBody = await response.text();
      console.error(`Error no reintentable: ${response.status}`, errorBody);
      throw new Error(`Error cliente: ${response.status}`);
    } catch (error) {
      if (i === maxRetries - 1 || !error.message.includes("reintentable"))
        throw error;
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
};

const useIntersectionObserver = (options) => {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.disconnect();
      }
    }, options);

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [options]);

  return [containerRef, isVisible];
};

// --- COMPONENTS ---

const AnimatedCard = ({ children, className = "", onClick }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      onClick={onClick}
      className={`transition-all duration-700 transform ${
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
      } ${
        onClick
          ? "cursor-pointer hover:scale-[1.02] hover:shadow-xl active:scale-95"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
};

const Page = ({ children, pageNumber }) => (
  <div className="w-full max-w-5xl bg-white shadow-2xl mx-auto mb-8 p-8 md:p-12 flex flex-col relative overflow-hidden text-sm rounded-lg transition-all duration-300 print:shadow-none print:p-0 print:m-0 print:w-full">
    {children}
    <div className="mt-12 pt-4 border-t flex justify-between text-gray-400 text-xs">
      <span>Jaramillo Mora Constructora</span>
      <span>Página {pageNumber} | INFORME EJECUTIVO TRIALTO</span>
    </div>
  </div>
);

const Header = ({ title, date }) => (
  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 border-b-2 border-red-600 pb-4 animate-fade-in-down">
    <div className="mb-4 md:mb-0">
      <h1 className="text-3xl font-bold text-gray-800 uppercase tracking-tight">
        {title}
      </h1>
      <p className="text-gray-500 mt-1 flex items-center">
        <Calendar size={14} className="mr-2" /> {date}
      </p>
    </div>
    <div className="text-right hidden md:block">
      <div className="text-2xl font-bold text-gray-800 leading-none">
        jaramillo<span className="font-extrabold">mora</span>
      </div>
      <div className="text-xs tracking-widest text-gray-500 uppercase mt-1">
        Constructora
      </div>
    </div>
  </div>
);

// --- CHARTS LOGIC ---

const useCurveSData = (planned, executed, dataPoints) => {
  // Fechas definidas por el usuario
  const startDate = new Date("2023-08-08"); // 8 de Agosto 2023
  const endDate = new Date("2026-11-15"); // 15 de Noviembre 2026
  const todayDate = new Date("2025-11-29"); // Fecha de corte informe

  const totalTime = endDate.getTime() - startDate.getTime();
  const timePerStep = totalTime / (dataPoints - 1); // Tiempo por semana (punto)

  const getDateFromIndex = (index) => {
    return new Date(startDate.getTime() + index * timePerStep);
  };

  const getIndexFromDate = (date) => {
    const diff = date.getTime() - startDate.getTime();
    // Asegurar que no se salga de los límites
    const idx = Math.round((diff / totalTime) * (dataPoints - 1));
    return Math.max(0, Math.min(idx, dataPoints - 1));
  };

  const milestones = [
    { name: "Etapa 1", date: new Date("2026-05-31"), color: "#3b82f6" },
    { name: "Etapa 2", date: new Date("2026-07-31"), color: "#f59e0b" },
    { name: "Etapa 3", date: new Date("2026-11-30"), color: "#10b981" },
  ];

  const milestoneIndices = milestones.map((m) => ({
    ...m,
    index: getIndexFromDate(m.date),
    value: planned[getIndexFromDate(m.date)] || 100,
    displayDate: m.date.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "2-digit",
    }),
  }));

  // Calcular índice de hoy
  const todayIndex = getIndexFromDate(todayDate);
  const actualExecutedValue = 55;
  const plannedValueAtToday = 65;

  // Ajustar vector ejecutado
  let finalExecuted = [...executed];
  // Rellenar huecos hasta hoy si faltan datos
  if (finalExecuted.length <= todayIndex) {
    const lastVal = finalExecuted[finalExecuted.length - 1] || 0;
    while (finalExecuted.length < todayIndex) {
      finalExecuted.push(
        lastVal +
          (actualExecutedValue - lastVal) / (todayIndex - finalExecuted.length)
      ); // Interpolación simple
    }
    finalExecuted[todayIndex] = actualExecutedValue;
  } else {
    finalExecuted = finalExecuted.slice(0, todayIndex + 1);
  }

  // Generar etiquetas mensuales para el Eje X
  const labels = [];
  let lastMonth = -1;

  for (let i = 0; i < dataPoints; i++) {
    const d = getDateFromIndex(i);
    const currentMonth = d.getMonth();

    // Si cambia el mes, agregamos etiqueta.
    if (currentMonth !== lastMonth) {
      labels.push({
        index: i,
        date: d.toLocaleDateString("es-CO", {
          month: "short",
          year: "2-digit",
        }), // ej: "ago. 23"
      });
      lastMonth = currentMonth;
    }
  }

  const todayPoint = {
    index: todayIndex,
    value: actualExecutedValue,
    plannedValue: plannedValueAtToday,
    date: todayDate.toLocaleDateString("es-CO", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  };

  return { finalExecuted, todayPoint, milestoneIndices, labels };
};

const SCurveChart = () => {
  const dataPoints = 176;
  // Datos vector planeado semanal
  const planned = [
    0.08, 0.17, 0.25, 0.33, 0.42, 0.5, 0.58, 0.67, 0.75, 0.83, 0.92, 1.0, 1.03,
    1.07, 1.1, 1.14, 1.17, 1.21, 1.24, 1.28, 1.31, 1.34, 1.38, 1.41, 1.45, 1.48,
    1.52, 1.55, 1.59, 1.62, 1.66, 1.69, 1.72, 1.76, 1.79, 1.83, 1.86, 1.9, 1.93,
    1.97, 2.0, 2.22, 2.33, 2.44, 2.55, 2.66, 2.77, 3.02, 3.2, 3.5, 3.69, 3.8,
    4.0, 4.15, 4.3, 4.64, 5.0, 5.2, 5.6, 6.0, 6.4, 6.8, 7.2, 7.6, 8.0, 8.6, 9.0,
    9.5, 10.0, 10.4, 10.6, 11.0, 11.2, 11.4, 11.8, 12.13, 12.45, 12.76, 13.2,
    13.6, 14.1, 14.55, 15.2, 16.1, 16.6, 17.1, 17.6, 18.2, 19.0, 19.5, 20.0,
    21.0, 22.0, 23.0, 24.0, 25.0, 26.0, 28.0, 29.0, 30.0, 32.0, 33.0, 35.0,
    36.0, 38.0, 38.4, 38.9, 40.7, 43.0, 44.4, 46.0, 47.6, 49.5, 50.5, 52.5,
    54.6, 56.3, 57.5, 59.3, 61.6, 63.0, 65.0, 68.0, 70.0, 70.5, 70.9, 71.2,
    72.0, 73.5, 75.0, 77.0, 78.0, 80.0, 81.0, 83.0, 84.0, 85.0, 86.0, 86.8,
    87.6, 88.3, 89.1, 89.8, 90.7, 91.8, 92.6, 93.2, 94.1, 94.8, 95.6, 96.1,
    96.7, 97.1, 97.8, 98.0, 98.2, 98.6, 98.9, 99.1, 99.2, 99.3, 99.4, 99.5,
    99.55, 99.6, 99.65, 99.7, 99.72, 99.75, 99.8, 99.84, 99.89, 99.91, 99.4,
    100.0,
  ];
  const executed = [
    0.083, 0.167, 0.25, 0.33333, 0.417, 0.5, 0.583, 0.667, 0.75, 0.833, 0.917,
    1.0, 1.034, 1.069, 1.103, 1.138, 1.172, 1.207, 1.241, 1.276, 1.31, 1.345,
    1.379, 1.414, 1.448, 1.483, 1.517, 1.552, 1.586, 1.621, 1.655, 1.69, 1.724,
    1.759, 1.793, 1.828, 1.862, 1.897, 1.931, 1.966, 2.0, 2.222, 2.33, 2.44,
    2.55, 1.8, 1.84, 1.89, 2.2, 2.4, 2.8, 3.0, 3.04, 3.9, 3.95, 4.0, 4.1, 4.4,
    5.0, 5.2, 5.4, 6.0, 6.2, 6.3, 7.0, 7.4, 7.5, 7.7, 8.4, 8.65, 8.8, 9.4, 9.9,
    9.98, 9.98, 10.4, 11.3, 11.5, 11.7, 11.99, 12.2, 12.6, 13.2, 13.7, 14.3,
    15.0, 15.5, 16.0, 16.5, 17.7, 18.2, 18.9, 19.7, 19.95, 20.6, 20.9, 21.6,
    22.1, 23.2, 24.4, 24.9, 26.4, 28.0, 28.7, 30.4, 32.0, 33.0, 33.9, 35.4,
    36.4, 37.4, 38.6, 39.8, 41.5, 42.8, 44.4, 46.2, 47.5, 49.4, 51.4, 52.0,
    55.0,
  ];

  const { finalExecuted, todayPoint, milestoneIndices, labels } = useCurveSData(
    planned,
    executed,
    dataPoints
  );
  const width = 600;
  const height = 300;
  const padding = 50; // Aumentado para etiquetas rotadas
  const totalPoints = dataPoints;

  const getX = (index) =>
    padding + index * ((width - padding * 2) / (totalPoints - 1));
  const getY = (value) =>
    height - padding - value * ((height - padding * 2) / 100);
  const makePath = (data) =>
    data
      .map((val, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(val)}`)
      .join(" ");

  return (
    <div className="w-full h-full flex flex-col items-center">
      <h3 className="text-xl font-bold text-gray-800 mb-2">
        Curva S - Avance Físico Acumulado
      </h3>
      <div className="relative bg-gray-50 rounded-lg p-4 border border-gray-200 shadow-inner w-full">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="overflow-visible w-full h-auto"
        >
          {/* GRID & AXIS */}
          {/* Eje Y (Ticks de Porcentaje) */}
          {[0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map((tick) => (
            <g key={tick}>
              <line
                x1={padding}
                y1={getY(tick)}
                x2={width - padding}
                y2={getY(tick)}
                stroke="#e5e7eb"
                strokeDasharray="4"
              />
              <text
                x={padding - 10}
                y={getY(tick) + 4}
                textAnchor="end"
                fontSize="10"
                fill="#6b7280"
              >
                {tick}%
              </text>
            </g>
          ))}

          {/* Eje X (Línea base) */}
          <line
            x1={padding}
            y1={height - padding}
            x2={width - padding}
            y2={height - padding}
            stroke="#9ca3af"
            strokeWidth="1"
          />

          {/* Eje Y (Línea vertical) */}
          <line
            x1={padding}
            y1={padding}
            x2={padding}
            y2={height - padding}
            stroke="#9ca3af"
            strokeWidth="1"
          />

          {/* Etiquetas de Ejes */}
          <text
            x={width / 2}
            y={height - 1}
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#374151"
          >
            FECHA
          </text>
          <text
            x={15}
            y={height / 2}
            textAnchor="middle"
            fontSize="11"
            fontWeight="bold"
            fill="#374151"
            transform={`rotate(-90, 15, ${height / 2})`}
          >
            AVANCE ACUMULADO (%)
          </text>

          {/* Etiquetas de Fecha en Eje X (Mensuales) */}
          {labels.map(({ index, date }, i) => (
            <g key={index}>
              <line
                x1={getX(index)}
                y1={getY(0)}
                x2={getX(index)}
                y2={getY(-2)}
                stroke="#d1d5db"
              />
              {/* Renderizar texto rotado para que quepan todos los meses */}
              <text
                x={getX(index)}
                y={height - padding + 12}
                textAnchor="end"
                fontSize="8"
                fill="#6b7280"
                transform={`rotate(-45, ${getX(index)}, ${
                  height - padding + 12
                })`}
              >
                {date}
              </text>
            </g>
          ))}

          {/* HITOS DE ENTREGA (MODIFICADO PARA SER VERTICAL) */}
          {milestoneIndices.map((m, i) => (
            <g key={m.name} className="group">
              {/* Línea vertical del hito */}
              <line
                x1={getX(m.index)}
                y1={getY(0)}
                x2={getX(m.index)}
                y2={getY(100)}
                stroke={m.color}
                strokeWidth="1.5"
                strokeDasharray="3,3"
              />
              {/* Círculo indicador */}
              <circle
                cx={getX(m.index)}
                cy={getY(m.value)}
                r="3"
                fill={m.color}
                stroke="white"
                strokeWidth="1"
              />
              {/* Texto Vertical */}
              <text
                x={getX(m.index)}
                y={height - padding - 25}
                transform={`rotate(-90, ${getX(m.index)}, ${
                  height - padding - 20
                })`}
                textAnchor="start"
                fontSize="9"
                fill={m.color}
                fontWeight="bold"
                dy="3"
              >
                {m.name} - {m.displayDate}
              </text>
            </g>
          ))}

          {/* CURVAS */}
          <path
            d={makePath(planned)}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="3"
            strokeDasharray="5,5"
          />
          <path
            d={makePath(finalExecuted)}
            fill="none"
            stroke="#dc2626"
            strokeWidth="4"
          />

          {/* PUNTO ACTUAL */}
          <g
            transform={`translate(${getX(todayPoint.index)}, ${getY(
              todayPoint.value
            )})`}
          >
            <circle r="5" fill="#dc2626" className="animate-ping opacity-75" />
            <circle r="5" fill="#dc2626" />
            <text
              x="+14"
              y="+20"
              textAnchor="middle"
              fill="#dc2626"
              fontSize="10"
              fontWeight="bold"
            >
              CORTE (55%)
            </text>
          </g>

          {/* LEYENDA */}
          <g transform={`translate(${padding + 20}, ${padding})`}>
            <rect
              width="145"
              height="55"
              fill="white"
              fillOpacity="0.95"
              rx="4"
              stroke="#e5e7eb"
              className="shadow-sm"
            />
            <line
              x1="15"
              y1="20"
              x2="45"
              y2="20"
              stroke="#9ca3af"
              strokeWidth="2"
              strokeDasharray="4"
            />
            <text x="55" y="24" fontSize="10" fill="#374151" fontWeight="bold">
              Programado ({todayPoint.plannedValue.toFixed(0)}%)
            </text>
            <line
              x1="15"
              y1="40"
              x2="45"
              y2="40"
              stroke="#dc2626"
              strokeWidth="2"
            />
            <text x="55" y="44" fontSize="10" fill="#374151" fontWeight="bold">
              Ejecutado ({todayPoint.value.toFixed(0)}%)
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};

// --- CONCRETE CURVE CHART ---
const ConcreteCurveChart = () => {
  // --- CONFIGURACIÓN DE DIMENSIONES ---
  const width = 1000; // Inner SVG width (high resolution)
  const height = 500; // Inner SVG height
  const padding = 60; // Top margin
  const bottomPadding = 100; // Large bottom margin for rotated dates
  const leftPadding = 80; // Left margin for Y-axis title

  // --- DATOS (Vectores Completos) ---

  // Planned Volume Vector (Ends at ~30,274)
  const plannedVol = [
    1.3, 31.2, 31.2, 41.2, 41.2, 41.2, 48.2, 73, 84.9, 84.9, 98.9, 98.9, 118.4,
    145.9, 165.9, 200.9, 258.3, 294.4, 294.4, 330.1, 364.4, 402.6, 443.6, 479.5,
    514.2, 514.2, 552, 593.5, 642.75, 687.25, 733.75, 769.45, 769.45, 803.75,
    842.95, 880.05, 949.05, 968.65, 1014.75, 1014.75, 1051.25, 1095.65, 1133.45,
    1160.05, 1196.45, 1230.35, 1230.35, 1230.35, 1253.45, 1288.75, 1366.45,
    1402.05, 1446.85, 1446.85, 1482.55, 1554.45, 1625.15, 1668.55, 1709.15,
    1754.65, 1754.65, 1773.55, 1812.75, 1883.45, 1929.45, 1947.35, 1986.95,
    1986.95, 1986.95, 2025.15, 2062.35, 2137.35, 2175.45, 2210.45, 2210.45,
    2210.45, 2250.05, 2286.45, 2361.05, 2403.75, 2441.95, 2441.95, 2485.65,
    2536.3, 2579.7, 2652.2, 2687.2, 2728.9, 2728.9, 2765.6, 2765.6, 2799.9,
    2834.1, 2870.1, 2928.9, 2928.9, 2963.2, 2980.7, 3026.2, 3061.5, 3061.5,
    3061.5, 3061.5, 3072, 3072, 3079, 3079, 3086, 3086, 3086, 3086, 3086, 3086,
    3096.5, 3096.5, 3096.5, 3096.5, 3096.5, 3096.5, 3103.5, 3103.5, 3123.8,
    3123.8, 3123.8, 3123.8, 3123.8, 3132.2, 3157.4, 3192.4, 3226.7, 3226.7,
    3226.7, 3261.7, 3307.7, 3353.7, 3363.1, 3363.1, 3363.1, 3363.1, 3363.1,
    3363.1, 3373.6, 3373.6, 3373.6, 3373.6, 3373.6, 3382.7, 3382.7, 3382.7,
    3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7,
    3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7,
    3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7,
    3392.2, 3392.2, 3392.2, 3392.2, 3392.2, 3392.2, 3392.2, 3399.2, 3399.2,
    3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2,
    3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2,
    3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2,
    3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6,
    3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6,
    3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6,
    3429.6, 3429.6, 3444.6, 3444.6, 3444.6, 3444.6, 3459.6, 3459.6, 3459.6,
    3459.6, 3459.6, 3550.3335, 3565.3335, 3565.3335, 3565.3335, 3565.3335,
    3565.3335, 3565.3335, 3565.3335, 3565.3335, 3656.067, 3656.067, 3656.067,
    3656.067, 3656.067, 3656.067, 3656.067, 3723.6879, 3723.6879, 3776.135333,
    3776.135333, 3776.135333, 3776.135333, 3776.135333, 3828.582767,
    3828.582767, 3828.582767, 3828.582767, 3828.582767, 3896.203667, 3948.6511,
    3948.6511, 3948.6511, 3962.5911, 4014.7488, 4014.7488, 4045.2258, 4045.2258,
    4094.07794, 4165.698348, 4165.698348, 4165.698348, 4205.966348, 4286.128988,
    4338.286688, 4357.749397, 4357.749397, 4357.749397, 4439.180897,
    4540.190737, 4569.371445, 4569.371445, 4581.171445, 4595.111445,
    4616.703945, 4633.406445, 4647.346445, 4647.346445, 4677.883945,
    4769.442205, 4769.442205, 4769.442205, 4769.442205, 4853.031605,
    4938.953155, 4938.953155, 4938.953155, 4938.953155, 4991.992555,
    5114.100815, 5204.924865, 5219.663865, 5240.608865, 5240.608865,
    5240.608865, 5325.053865, 5376.533865, 5405.673865, 5427.266365,
    5490.766365, 5490.766365, 5490.766365, 5563.227765, 5680.094865,
    5697.264865, 5697.264865, 5738.423965, 5896.942715, 5896.942715,
    5971.595865, 5992.540865, 6067.470215, 6130.970215, 6205.623365,
    6255.070865, 6298.018465, 6316.340665, 6316.340665, 6334.662865,
    6408.147965, 6451.469365, 6531.648465, 6531.648465, 6613.001965,
    6613.001965, 6762.585015, 6826.936265, 6826.936265, 6920.514965,
    6941.459965, 6975.502465, 7058.927215, 7079.872215, 7138.586915,
    7202.086915, 7291.341915, 7291.341915, 7332.501015, 7332.501015,
    7410.260015, 7410.260015, 7475.769115, 7506.306615, 7549.254215,
    7723.294965, 7728.197465, 7855.528115, 7871.588315, 7988.742165,
    8121.992915, 8186.687915, 8212.603115, 8292.003115, 8424.163865,
    8449.158865, 8513.281565, 8534.874065, 8534.874065, 8691.706482,
    8731.653148, 8811.987898, 8905.480598, 8905.480598, 9039.273932,
    9039.273932, 9159.308682, 9222.808682, 9235.766182, 9321.041248,
    9588.166765, 9812.252765, 9847.782765, 9847.782765, 9924.766165,
    10073.88602, 10115.96852, 10158.50119, 10158.50119, 10158.50119,
    10246.36227, 10267.04494, 10287.72762, 10369.31762, 10369.31762,
    10495.50975, 10495.50975, 10495.50975, 10604.10975, 10717.43975,
    10764.23522, 10788.58522, 10788.58522, 10788.58522, 10788.58522,
    10945.64818, 11073.49943, 11128.75711, 11192.25711, 11212.93978,
    11212.93978, 11343.68996, 11462.60263, 11623.5893, 11693.8331, 11891.46227,
    11896.36477, 11963.64477, 12006.24477, 12006.24477, 12147.88477,
    12147.88477, 12324.14657, 12324.14657, 12324.14657, 12351.34045,
    12435.33045, 12435.33045, 12672.26851, 12733.96476, 12926.6881, 12926.6881,
    12991.06198, 13131.47948, 13158.67337, 13297.38462, 13509.75462,
    13700.52862, 13700.52862, 13700.52862, 13700.52862, 13836.09862,
    13836.09862, 14060.77112, 14060.77112, 14060.77112, 14227.38612,
    14227.38612, 14227.38612, 14227.38612, 14227.38612, 14227.38612,
    14227.38612, 14227.38612, 14227.38612, 14227.38612, 14227.38612,
    14227.38612, 14227.38612, 14227.38612, 14227.38612, 14227.38612,
    14300.52362, 14310.33362, 14384.69362, 14480.46612, 14480.46612,
    14808.72156, 14808.72156, 14808.72156, 14974.82906, 15011.20906,
    15169.68823, 15169.68823, 15169.68823, 15429.69156, 15429.69156,
    15600.14281, 15667.42281, 15741.78281, 15741.78281, 15820.86531,
    15885.31925, 15885.31925, 16185.56398, 16321.13398, 16368.73398,
    16368.73398, 16527.21315, 16549.02315, 16741.74648, 16741.74648,
    16823.49648, 16860.67648, 16860.67648, 16897.85648, 16996.38648,
    17122.86733, 17122.86733, 17180.88201, 17379.95201, 17379.95201,
    17379.95201, 17603.13634, 17711.133, 17876.65634, 17956.053, 18037.803,
    18037.803, 18122.583, 18185.013, 18340.64217, 18402.03217, 18402.03217,
    18466.38916, 18466.38916, 18601.95916, 18601.95916, 18776.90676,
    18908.50009, 19072.00814, 19151.4048, 19151.4048, 19309.54337, 19346.72337,
    19383.90337, 19511.03337, 19544.07337, 19644.84097, 19644.84097,
    19649.74347, 19848.81347, 19848.81347, 19922.99347, 20066.74138,
    20180.06805, 20180.06805, 20180.06805, 20259.46472, 20335.73188,
    20372.91188, 20469.26076, 20567.79076, 20567.79076, 20567.79076,
    20627.79076, 20627.79076, 20763.36076, 20763.36076, 20837.54076,
    20837.54076, 21014.32868, 21127.65535, 21207.05201, 21225.30201,
    21262.48201, 21299.66201, 21299.66201, 21398.19201, 21462.54326,
    21462.54326, 21462.54326, 21462.54326, 21462.54326, 21462.54326,
    21462.54326, 21598.11326, 21598.11326, 21729.03582, 21808.43249,
    21921.75915, 21921.75915, 22001.15582, 22019.40582, 22034.40582,
    22034.40582, 22108.76582, 22207.29582, 22207.29582, 22268.68582,
    22268.68582, 22268.68582, 22342.86582, 22404.25582, 22478.43582,
    22478.43582, 22478.43582, 22591.76249, 22750.55582, 22768.80582,
    22818.80582, 22818.80582, 22818.80582, 22893.16582, 22967.34582,
    22967.34582, 22967.34582, 23041.52582, 23102.91582, 23102.91582,
    23223.16582, 23257.09582, 23257.09582, 23336.49249, 23434.13915,
    23469.99915, 23494.99915, 23519.99915, 23603.07915, 23633.07915,
    23744.43915, 23789.43915, 23863.61915, 23863.61915, 23899.47915,
    23989.94365, 24122.49365, 24122.49365, 24122.49365, 24222.49365,
    24222.49365, 24320.14032, 24356.00032, 24444.37032, 24444.37032,
    24518.55032, 24592.73032, 24592.73032, 24592.73032, 24628.59032,
    24628.59032, 24723.91032, 24844.16032, 24844.16032, 24844.16032,
    25044.16032, 25044.16032, 25044.16032, 25062.41032, 25098.27032,
    25178.44032, 25178.44032, 25178.44032, 25326.80032, 25326.80032,
    25326.80032, 25420.80932, 25482.19932, 25482.19932, 25602.44932,
    25602.44932, 25702.44932, 25702.44932, 25720.69932, 25756.55932,
    25756.55932, 25836.72932, 25836.72932, 25910.90932, 26110.90932,
    26110.90932, 26146.76932, 26146.76932, 26208.15932, 26328.40932,
    26328.40932, 26528.40932, 26528.40932, 26528.40932, 26564.26932,
    26564.26932, 26644.43932, 26644.43932, 26644.43932, 26718.61932,
    26758.61932, 26758.61932, 26758.61932, 26794.47932, 26855.86932,
    26976.11932, 26976.11932, 26981.92432, 26981.92432, 27021.92432,
    27021.92432, 27071.92432, 27107.78432, 27187.95432, 27187.95432,
    27187.95432, 27262.13432, 27262.13432, 27302.13432, 27337.99432,
    27337.99432, 27458.24432, 27458.24432, 27458.24432, 27458.24432,
    27458.24432, 27458.24432, 27494.10432, 27574.27432, 27574.27432,
    27574.27432, 27580.07932, 27580.07932, 27580.07932, 27615.93932,
    27615.93932, 27615.93932, 27736.18932, 27736.18932, 27736.18932,
    27776.18932, 27776.18932, 27807.74932, 27807.74932, 27887.91932,
    27887.91932, 27887.91932, 27887.91932, 27887.91932, 27919.47932,
    27919.47932, 27919.47932, 28039.73932, 28039.73932, 28039.73932,
    28079.73932, 28079.73932, 28079.73932, 28111.29932, 28191.46932,
    28191.46932, 28191.46932, 28191.46932, 28231.46932, 28231.46932,
    28231.46932, 28263.02932, 28263.02932, 28383.28932, 28383.28932,
    28383.28932, 28583.28932, 28583.28932, 28583.28932, 28614.84932,
    28695.01932, 28695.01932, 28695.01932, 28715.01932, 28715.01932,
    28715.01932, 28746.57932, 28746.57932, 28866.83932, 28866.83932,
    28866.83932, 28891.83932, 28891.83932, 28891.83932, 28891.83932,
    28923.39932, 29003.56932, 29003.56932, 29023.56932, 29023.56932,
    29043.56932, 29043.56932, 29075.12932, 29075.12932, 29275.12932,
    29275.12932, 29395.38932, 29395.38932, 29395.38932, 29435.38932,
    29435.38932, 29435.38932, 29466.94932, 29547.11932, 29547.11932,
    29547.11932, 29577.11932, 29577.11932, 29577.11932, 29577.11932,
    29608.67932, 29728.93932, 29728.93932, 29728.93932, 29753.93932,
    29753.93932, 29783.93932, 29783.93932, 29815.49932, 29895.66932,
    29895.66932, 29895.66932, 29925.66932, 29925.66932, 29925.66932,
    29957.22932, 29957.22932, 30074.70932, 30174.70932, 30174.70932,
    30274.70932, 30274.70932, 30274.70932, 30274.70932, 30374.70932,
    30374.70932, 30374.70932, 30374.70932, 30462.29, 30462.29,
  ];

  // Executed Volume Vector (Ends at ~30,604)
  const executedVol = [
    1.3, 31.2, 31.2, 41.2, 41.2, 41.2, 48.2, 73, 84.9, 84.9, 98.9, 98.9, 118.4,
    145.9, 165.9, 200.9, 258.3, 294.4, 294.4, 330.1, 364.4, 402.6, 443.6, 479.5,
    514.2, 514.2, 552, 593.5, 642.75, 687.25, 733.75, 769.45, 769.45, 803.75,
    842.95, 880.05, 949.05, 968.65, 1014.75, 1014.75, 1051.25, 1095.65, 1133.45,
    1160.05, 1196.45, 1230.35, 1230.35, 1230.35, 1253.45, 1288.75, 1366.45,
    1402.05, 1446.85, 1446.85, 1482.55, 1554.45, 1625.15, 1668.55, 1709.15,
    1754.65, 1754.65, 1773.55, 1812.75, 1883.45, 1929.45, 1947.35, 1986.95,
    1986.95, 1986.95, 2025.15, 2062.35, 2137.35, 2175.45, 2210.45, 2210.45,
    2210.45, 2250.05, 2286.45, 2361.05, 2403.75, 2441.95, 2441.95, 2485.65,
    2536.3, 2579.7, 2652.2, 2687.2, 2728.9, 2728.9, 2765.6, 2765.6, 2799.9,
    2834.1, 2870.1, 2928.9, 2928.9, 2963.2, 2980.7, 3026.2, 3061.5, 3061.5,
    3061.5, 3061.5, 3072, 3072, 3079, 3079, 3086, 3086, 3086, 3086, 3086, 3086,
    3096.5, 3096.5, 3096.5, 3096.5, 3096.5, 3096.5, 3103.5, 3103.5, 3123.8,
    3123.8, 3123.8, 3123.8, 3123.8, 3132.2, 3157.4, 3192.4, 3226.7, 3226.7,
    3226.7, 3261.7, 3307.7, 3353.7, 3363.1, 3363.1, 3363.1, 3363.1, 3363.1,
    3363.1, 3373.6, 3373.6, 3373.6, 3373.6, 3373.6, 3382.7, 3382.7, 3382.7,
    3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7,
    3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7,
    3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7, 3382.7,
    3392.2, 3392.2, 3392.2, 3392.2, 3392.2, 3392.2, 3392.2, 3399.2, 3399.2,
    3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2,
    3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2,
    3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2, 3399.2,
    3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6,
    3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6,
    3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6, 3429.6,
    3429.6, 3429.6, 3444.6, 3444.6, 3444.6, 3444.6, 3459.6, 3459.6, 3459.6,
    3459.6, 3459.6, 3550.3335, 3565.3335, 3565.3335, 3565.3335, 3565.3335,
    3565.3335, 3565.3335, 3565.3335, 3565.3335, 3571, 3572.5, 3581.4, 3581.4,
    3688.7, 3688.7, 3688.7, 3742.8, 3746.2, 3784.7, 3786.4, 3797.6, 3797.6,
    3798.8, 3860.6, 3918, 3978.4, 4024.9, 4056.4, 4056.4, 4142.1, 4195.7,
    4206.7, 4289.4, 4356.6, 4380.7, 4380.7, 4380.7, 4380.7, 4429.4, 4436.2,
    4505.5, 4524.3, 4524.3, 4585.5, 4599.9, 4614.3, 4725.1, 4728.3, 4767.5,
    4767.5, 4803.2, 4902.2, 4917.5, 4947.3, 4968.2, 4968.2, 4968.2, 5040.8,
    5076.7, 5087.6, 5190.8, 5303.6, 5340, 5340, 5360.8, 5376.5, 5381.8, 5492,
    5511.8, 5608.9, 5608.9, 5690.3, 5695.2, 5695.2, 5714.5, 5724.5, 5798, 5798,
    5927.6, 5953.8, 6046.7, 6061.6, 6132.4, 6218.9, 6218.9, 6218.9, 6244.4,
    6336.1, 6345.65, 6448.7, 6552.1, 6552.1, 6562.7, 6674, 6779.8, 6838.8,
    6855.4, 6883.9, 6883.9, 6896.3, 7096.2, 7115.25, 7119.55, 7225.25, 7278.15,
    7278.15, 7279.75, 7438.35, 7441.15, 7518.85, 7601.45, 7607.85, 7607.85,
    7695.15, 7733.55, 7825.15, 7825.15, 7892.65, 7896.45, 7896.45, 7991.85,
    8132.71, 8170.51, 8224.36, 8463.86, 8534.36, 8534.36, 8584.91, 8635.71,
    8656.51, 8727.21, 8734.61, 8834.11, 8834.11, 8887.01, 8946.71, 8975.76,
    8998.21, 9011.51, 9058.01, 9058.01, 9058.01, 9151.11, 9233.41, 9297.51,
    9369.76, 9414.36, 9414.36, 9486.16, 9488.46, 9511.96, 9573.86, 9711.56,
    9755.06, 9755.06, 9801.36, 9909.51, 9913.71, 9921.81, 10017.71, 10046.91,
    10046.91, 10046.91, 10127.86, 10206.16, 10283.46, 10311.91, 10412.66,
    10412.66, 10513.41, 10521.81, 10639.06, 10681.56, 10694.31, 10770.81,
    10770.81, 10793.81, 10831.86, 10863.86, 10938.86, 10969.26, 11052.06,
    11052.06, 11099.94, 11184.24, 11269.54, 11448.84, 11457.74, 11517.74,
    11517.74, 11523.14, 11551.14, 11631.44, 11828.84, 11896.94, 11896.94,
    11896.94, 11928.54, 11946.09, 11954.69, 11959.79, 12145.64, 12145.64,
    12145.64, 12145.64, 12213.74, 12214.04, 12341.49, 12504.19, 12571.99,
    12571.99, 12592.89, 12592.89, 12592.89, 12617.14, 12661.69, 12839.49,
    12839.49, 12839.49, 12839.49, 13239.49, 13239.49, 13239.49, 13239.49,
    13239.49, 13239.49, 13249.19, 13277.94, 13290.09, 13313.94, 13388.54,
    13388.54, 13399.09, 13419.09, 13514.14, 13531.39, 13535.69, 13687.79,
    13687.79, 13701.89, 13792.29, 13796.64, 13820.74, 14093.89, 14196.44,
    14196.44, 14326.74, 14375.61, 14461.21, 14594.31, 14622.41, 14779.41,
    14779.41, 14791.36, 14908.76, 14953.46, 15166.06, 15173.06, 15357.96,
    15357.96, 15368.36, 15390.76, 15567.96, 15671.41, 15736.21, 15736.21,
    15736.21, 15745.66, 15937.66, 16012.01, 16103.51, 16207.16, 16383.16,
    16383.16, 16463.66, 16475.66, 16558.11, 16583.51, 16658.56, 16754.66,
    16754.66, 16919.96, 17027.56, 17132.01, 17245.24, 17281.89, 17372.79,
    17372.79, 17451.69, 17613.94, 17645.44, 17733.09, 17874.95, 17900.05,
    17900.05, 18058.25, 18089.85, 18181.65, 18345.49, 18421.92, 18629.22,
    18629.22, 18629.22, 18669.37, 18691.87, 18727.42, 18751.52, 18865.77,
    18865.77, 18898.37, 18915.02, 18941.22, 19170.92, 19244.62, 19329.72,
    19329.72, 19351.62, 19369.97, 19473.77, 19574.97, 19617.97, 19638.07,
    19638.07, 19715.47, 19896.42, 19910.82, 19910.82, 19910.82, 19910.82,
    19910.82, 20008.17, 20018.87, 20050.67, 20080.82, 20163.92, 20273.12,
    20273.12, 20379.32, 20408.42, 20422.42, 20422.42, 20458.52, 20563.32,
    20563.32, 20591.72, 20683.72, 20757.82, 20781.82, 20922.82, 21028.22,
    21028.22, 21046.82, 21064.72, 21145.72, 21165.57, 21352.82, 21454.52,
    21454.52, 21469.02, 21580.47, 21687.47, 21769.22, 21790.17, 21939.52,
    21939.52, 21989.62, 22110.72, 22159.42, 22205.82, 22361.17, 22367.07,
    22367.07, 22367.07, 22543.42, 22567.42, 22733.12, 22815.12, 22859.62,
    22859.62, 22877.32, 22879.12, 23126.32, 23228.92, 23241.82, 23316.22,
    23316.22, 23346.42, 23436.52, 23536.12, 23552.32, 23604.06, 23675.76,
    23675.76, 23675.76, 23735.71, 23851.21, 23901.91, 24114.71, 24134.92,
    24134.92, 24134.92, 24229.12, 24337.42, 24342.42, 24408.72, 24553.12,
    24553.12, 24632.27, 24641.87, 24747.42, 24767.22, 24880.92, 24992.82,
    24992.82, 25033.5, 25142.05, 25158.9, 25322.9, 25357.8, 25373.5, 25373.5,
    25395, 25503.4, 25574.7, 25774.7, 25792.13, 25830.13, 25830.13, 25872.93,
    26080.78, 26110.28, 26137.43, 26334.23, 26341.08, 26341.08, 26356.78,
    26449.38, 26509.58, 26509.58, 26636.58, 26654.48, 26654.48, 26702.48,
    26807.81, 26823.26, 26926.61, 27015.61, 27076.86, 27076.86, 27076.86,
    27076.86, 27182.46, 27340.76, 27397.16, 27451.01, 27451.01, 27479.46,
    27526.91, 27549.41, 27646.06, 27661.51, 27722.56, 27722.56, 27735.16,
    27830.76, 27929.46, 27975.01, 28041.66, 28041.66, 28041.66, 28145.36,
    28222.16, 28290.56, 28397.41, 28413.66, 28435.16, 28435.16, 28476.31,
    28498.71, 28588.26, 28689.41, 28743.31, 28759.01, 28759.01, 28828.71,
    28919.01, 28944.31, 29010.11, 29030.91, 29033.31, 29033.31, 29146.71,
    29146.71, 29219.71, 29242.91, 29341.71, 29428.86, 29428.86, 29434.76,
    29496.26, 29504.36, 29595.56, 29636.51, 29682.51, 29682.51, 29728.51,
    29742.71, 29766.26, 29774.21, 29876.86, 29878.86, 29878.86, 29890.04,
    29913.94, 30003.19, 30028.64, 30053.99, 30093.89, 30093.89, 30099.59,
    30111.49, 30198.39, 30210.29, 30239.99, 30245.49, 30245.49, 30245.49,
    30257.29, 30343.29, 30347.94, 30404.09, 30420.69, 30420.69, 30437.09,
    30476.84, 30528.99, 30550.99, 30553.14, 30556.84, 30556.84, 30556.84,
    30576.64, 30582.04, 30584.84, 30604.34,
  ];

  // Scale settings
  const maxVol = 32000;

  // Date configuration
  const startDate = new Date(2023, 7, 1); // August 1, 2023
  // The data vectors have 365 points, so we use that length for mapping X positions
  const totalPoints = plannedVol.length;
  const totalMonths = 29; // Aug 2023 - Dec 2025

  // Define the end date for the time scale to align milestones (Dec 31, 2025)
  const endDate = new Date(2025, 11, 31);
  const totalDurationInMs = endDate.getTime() - startDate.getTime();

  // Milestones array with required dates and unique colors
  const milestones = [
    { name: "Torre 1: 06/8/25", date: new Date(2025, 7, 6), color: "#3b82f6" }, // Red
    { name: "Torre 2: 09/10/25", date: new Date(2025, 9, 9), color: "#f59e0b" }, // Orange
    {
      name: "Torre 3: 28/11/25",
      date: new Date(2025, 10, 28),
      color: "#10b981",
    }, // Yellow
  ];

  // Coordinate helpers
  const getX = (index) => {
    // Maps data index (up to 365) to the width of the chart
    return (
      leftPadding +
      index * ((width - leftPadding - padding) / (totalPoints - 1))
    );
  };

  // Helper to get X position for a specific date (Milestone) by linearly mapping time to plot width
  const getXForDate = (date) => {
    const elapsedDurationMs = date.getTime() - startDate.getTime();

    // Calculate the ratio of elapsed time to total time span
    const xRatio = elapsedDurationMs / totalDurationInMs;

    // Map the ratio to the available plotting width
    const availableWidth = width - leftPadding - padding;
    return leftPadding + xRatio * availableWidth;
  };

  // Helper to interpolate the value of the executed curve for a given date.
  const getInterpolatedValueForDate = (data, date) => {
    const targetTime = date.getTime();

    // Calculate the total duration in milliseconds from startDate to the end of the data.
    const dataEndTime = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate() + data.length - 1
    ).getTime();
    const dataDurationMs = dataEndTime - startDate.getTime();

    // If the date is outside the data range, return the nearest known value
    if (targetTime <= startDate.getTime()) return data[0];
    if (targetTime >= dataEndTime) return data[data.length - 1];

    // Calculate the fractional index corresponding to the target date
    const fractionalIndex =
      ((targetTime - startDate.getTime()) / dataDurationMs) * (data.length - 1);

    // Find the indices surrounding the fractional index
    const idx0 = Math.floor(fractionalIndex);
    const idx1 = Math.min(idx0 + 1, data.length - 1); // Clamp to max index

    // Get the values and position for interpolation
    const value0 = data[idx0];
    const value1 = data[idx1];

    if (idx0 === idx1) return value0; // Should only happen at the end

    // Perform linear interpolation
    const fraction = fractionalIndex - idx0;
    return value0 + (value1 - value0) * fraction;
  };

  const getY = (value) => {
    const availableHeight = height - padding - bottomPadding;
    return height - bottomPadding - (value / maxVol) * availableHeight;
  };

  const makePath = (data) =>
    data
      .map((val, i) => `${i === 0 ? "M" : "L"} ${getX(i)} ${getY(val)}`)
      .join(" ");

  // Generate month labels for the X-axis
  const getMonthLabels = () => {
    const labels = [];
    const monthNames = [
      "Ene",
      "Feb",
      "Mar",
      "Abr",
      "May",
      "Jun",
      "Jul",
      "Ago",
      "Sep",
      "Oct",
      "Nov",
      "Dic",
    ];

    // We want to generate a label for each month (29 months total)
    const totalDaysInScale = totalDurationInMs / (1000 * 60 * 60 * 24);

    for (let i = 0; i < totalMonths; i++) {
      // Calculate the date for the 1st of the current month
      const currentMonthDate = new Date(
        startDate.getFullYear(),
        startDate.getMonth() + i,
        1
      );

      // Stop generating labels if the date exceeds the defined scale end date
      if (currentMonthDate > endDate) break;

      const name = `${
        monthNames[currentMonthDate.getMonth()]
      }-${currentMonthDate.getFullYear().toString().slice(-2)}`;

      // Calculate X position using the time-based mapping
      const xPos = getXForDate(currentMonthDate);

      labels.push(
        <g
          key={i}
          transform={`translate(${xPos}, ${height - bottomPadding + 15})`}
        >
          <text
            transform="rotate(-90)"
            textAnchor="end"
            fontSize="10"
            fill="#6b7280"
            dy="3"
          >
            {name}
          </text>
        </g>
      );
    }
    return labels;
  };

  const formatNumber = (num) =>
    new Intl.NumberFormat("es-CO", { maximumFractionDigits: 0 }).format(num);

  const lastPlannedValue = plannedVol[plannedVol.length - 1];
  const lastExecutedValue = executedVol[executedVol.length - 1];

  return (
    <div className="w-full h-full flex flex-col items-center p-4 bg-white">
      <h3 className="text-2xl font-bold text-gray-800 mb-2">
        Curva de Consumo de Concreto Acumulado
      </h3>

      {/* Leyenda Superior (sin Hitos) */}
      <div className="flex gap-6 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-2">
          <div className="w-8 h-0.5 bg-gray-400 border-dashed"></div>
          <span className="font-medium">
            Presupuestado: {formatNumber(lastPlannedValue)} m³
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-1 bg-red-600 rounded"></div>
          <span className="font-medium">
            Ejecutado Total: {formatNumber(lastExecutedValue)} m³
          </span>
        </div>
      </div>

      <div className="relative rounded-lg p-2 w-full overflow-x-auto border border-gray-100 shadow-sm">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible"
          style={{ minWidth: "800px" }}
        >
          {/* Título del Eje Y Rotado (Concreto Acumulado) */}
          <text
            x={20}
            y={height / 2}
            textAnchor="middle"
            transform={`rotate(-90, 20, ${height / 2})`}
            className="text-sm font-bold fill-gray-600"
          >
            Concreto Acumulado (m³)
          </text>

          {/* Líneas de cuadrícula Y */}
          {[0, 4000, 8000, 12000, 16000, 20000, 24000, 28000, 32000].map(
            (tick) => (
              <g key={tick}>
                <line
                  x1={leftPadding}
                  y1={getY(tick)}
                  x2={width - padding}
                  y2={getY(tick)}
                  stroke="#e5e7eb"
                  strokeDasharray="4"
                />
                <text
                  x={leftPadding - 10}
                  y={getY(tick) + 4}
                  textAnchor="end"
                  fontSize="11"
                  fill="#6b7280"
                >
                  {formatNumber(tick)}
                </text>
              </g>
            )
          )}

          {/* Hitos Verticales */}
          {milestones.map((milestone) => {
            const xPos = getXForDate(milestone.date);

            // 1. Calcular el valor de Y en el hito (interpolando en executedVol)
            const milestoneValue = getInterpolatedValueForDate(
              executedVol,
              milestone.date
            );
            const yPos = getY(milestoneValue);

            // Check if the position is within the defined plotting area
            if (xPos < leftPadding || xPos > width - padding) return null;

            return (
              <g key={milestone.name}>
                {/* Línea vertical para el hito (llega hasta la curva ejecutada) */}
                <line
                  x1={xPos}
                  y1={height - bottomPadding} // Starts at the X-axis line
                  x2={xPos}
                  y2={yPos} // Ends at the executed curve (interpolated Y position)
                  stroke={milestone.color}
                  strokeWidth="2"
                  strokeDasharray="4,2"
                  strokeLinecap="round"
                />
                {/* Círculo en la intersección */}
                <circle
                  cx={xPos}
                  cy={yPos}
                  r="6"
                  fill={milestone.color}
                  opacity="0.8"
                />
                {/* Etiqueta del hito sobre la línea */}
                <text
                  x={xPos}
                  y={yPos - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fill={milestone.color}
                  fontWeight="bold"
                  className="drop-shadow-sm"
                >
                  {milestone.name.split(":")[0]}
                </text>
              </g>
            );
          })}

          {/* Etiquetas Eje X (Mes a Mes) */}
          {getMonthLabels()}

          {/* Eje X Line */}
          <line
            x1={leftPadding}
            y1={height - bottomPadding}
            x2={width - padding}
            y2={height - bottomPadding}
            stroke="#d1d5db"
          />

          {/* Curva Planeada (Gris Punteada) */}
          <path
            d={makePath(plannedVol)}
            fill="none"
            stroke="#9ca3af"
            strokeWidth="2"
            strokeDasharray="5,5"
          />

          {/* Punto Final Planeado + Etiqueta */}
          <g
            transform={`translate(${getX(plannedVol.length - 1)}, ${getY(
              lastPlannedValue
            )})`}
          >
            <circle r="4" fill="#9ca3af" />
            <text x="-30" y="20" fill="#6b7280" fontSize="12" fontWeight="bold">
              Presu.: {formatNumber(lastPlannedValue)} m³
            </text>
          </g>

          {/* Curva Ejecutada (Roja Sólida) */}
          <path
            d={makePath(executedVol)}
            fill="none"
            stroke="#dc2626"
            strokeWidth="3"
          />

          {/* Tooltip Ejecutado */}
          <g
            transform={`translate(${getX(executedVol.length - 1)}, ${getY(
              lastExecutedValue
            )})`}
          >
            <circle r="5" fill="#dc2626" className="animate-ping opacity-75" />
            <circle r="5" fill="#dc2626" />

            {/* Caja de texto flotante */}
            <rect
              x="-10"
              y="-40"
              width="85"
              height="24"
              rx="4"
              fill="#dc2626"
              opacity="0.9"
            />
            <text
              x="30"
              y="-24"
              textAnchor="middle"
              fill="white"
              fontSize="11"
              fontWeight="bold"
            >
              {formatNumber(lastExecutedValue)} m³
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
const ConcreteChart = () => {
  const data = [
    { label: "Real", value: 29882, color: "#dc2626" },
    { label: "Teórico Ejec.", value: 28955, color: "#fbbf24" },
    { label: "Presupuestado", value: 30462, color: "#4b5563" },
    { label: "Teórico Total", value: 30837, color: "#9ca3af" },
  ];
  const maxValue = 32000;
  const height = 200;
  const barWidth = 40;
  const gap = 40;
  const chartWidth = (barWidth + gap) * data.length + gap;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex justify-between items-end mb-4">
        <h4 className="font-bold text-gray-700">
          Comparativa Volumétrica (m³)
        </h4>
        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded font-bold">
          Desperdicio: 3.20%
        </span>
      </div>
      <svg
        viewBox={`0 0 ${chartWidth} ${height + 30}`}
        className="w-full h-48 overflow-visible"
      >
        <line
          x1="0"
          y1={height}
          x2={chartWidth}
          y2={height}
          stroke="#e5e7eb"
          strokeWidth="2"
        />
        {data.map((d, i) => {
          const barHeight = (d.value / maxValue) * height;
          const x = gap + i * (barWidth + gap);
          const y = height - barHeight;
          return (
            <g key={i} className="group">
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill={d.color}
                rx="4"
                className="transition-all duration-500 hover:opacity-80"
              />
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#374151"
              >
                {(d.value / 1000).toFixed(1)}k
              </text>
              <text
                x={x + barWidth / 2}
                y={height + 15}
                textAnchor="middle"
                fontSize="9"
                fill="#6b7280"
                className="uppercase font-medium"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

const SteelTable = () => {
  return (
    <div className="overflow-hidden rounded-lg border border-gray-200 shadow-sm bg-white">
      <table className="min-w-full text-xs">
        <thead className="bg-gray-50 text-gray-700 font-bold uppercase">
          <tr>
            <th className="px-3 py-3 text-left">Concepto</th>
            <th className="px-3 py-3 text-right">Acero (kg)</th>
            <th className="px-3 py-3 text-right">Malla (kg)</th>
            <th className="px-3 py-3 text-center">Estado</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          <tr>
            <td className="px-3 py-2 font-medium text-gray-600">
              Consumo Real
            </td>
            <td className="px-3 py-2 text-right font-bold">4,963,440</td>
            <td className="px-3 py-2 text-right font-bold">54,174</td>
            <td className="px-3 py-2 text-center">
              <CheckCircle size={14} className="text-green-500 inline" />
            </td>
          </tr>
          <tr>
            <td className="px-3 py-2 text-gray-500">Consumo proyectado</td>
            <td className="px-3 py-2 text-right">4,967,440</td>
            <td className="px-3 py-2 text-right">55,174</td>
            <td className="px-3 py-2 text-center">-</td>
          </tr>
          <tr>
            <td className="px-3 py-2 text-gray-500">Pendiente por pedir</td>
            <td className="px-3 py-2 text-right">4,000</td>
            <td className="px-3 py-2 text-right">1,000</td>
            <td className="px-3 py-2 text-center">-</td>
          </tr>
          <tr>
            <td className="px-3 py-2 text-gray-500">Presupuestado Total</td>
            <td className="px-3 py-2 text-right">5,216,824</td>
            <td className="px-3 py-2 text-right">69,732</td>
            <td className="px-3 py-2 text-center">-</td>
          </tr>
          <tr className="bg-blue-50">
            <td className="px-3 py-2 font-bold text-blue-800">
              Proyección Final
            </td>
            <td
              className="px-3 py-2 text-right font-bold text-blue-800"
              colSpan="4"
            >
              Ahorro Proyectado: 249 Toneladas
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
};

const KPI = ({ title, value, subtext, icon: Icon, status, onClick }) => {
  const statusColor =
    status === "good"
      ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
      : status === "warning"
      ? "bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100"
      : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100";
  return (
    <AnimatedCard
      onClick={onClick}
      className={`p-5 rounded-xl border ${statusColor} flex items-start justify-between group relative overflow-hidden`}
    >
      <div className="z-10">
        <div className="flex items-center space-x-2 mb-1">
          <p className="text-xs font-bold uppercase opacity-80">{title}</p>
          {onClick && (
            <ZoomIn
              size={12}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            />
          )}
        </div>
        <div className="text-3xl font-extrabold tracking-tight">{value}</div>
        {subtext && (
          <p className="text-xs mt-2 font-medium opacity-90 bg-white/50 inline-block px-2 py-0.5 rounded">
            {subtext}
          </p>
        )}
      </div>
      {Icon && (
        <Icon
          size={24}
          className="opacity-70 group-hover:scale-110 transition-transform duration-300"
        />
      )}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 rounded-full bg-current opacity-5"></div>
    </AnimatedCard>
  );
};

const ProgressBar = ({ label, value, target, delayDays, onClick }) => {
  // <--- AÑADE onClick
  // 1. Lógica para determinar el texto y el color de la etiqueta
  let statusText = "";
  let statusColor = "";

  // Determinamos si es Rojo (atraso) o Verde (adelanto/a tiempo) para la barra y el texto
  const isBehind =
    (delayDays !== undefined && delayDays > 0) ||
    (delayDays === undefined && value < target);

  if (delayDays !== undefined) {
    if (delayDays > 0) {
      statusText = `${delayDays} Días Atraso`;
      statusColor = "bg-red-100 text-red-700";
    } else if (delayDays < 0) {
      statusText = `${Math.abs(delayDays)} Días Adelanto`; // Math.abs quita el signo menos visualmente
      statusColor = "bg-green-100 text-green-700";
    } else {
      statusText = "A Tiempo";
      statusColor = "bg-green-100 text-green-700";
    }
  } else {
    // Fallback si no mandan delayDays, se calcula por porcentaje
    statusText = isBehind ? "Atrasado" : "A Tiempo";
    statusColor = isBehind
      ? "bg-red-100 text-red-700"
      : "bg-green-100 text-green-700";
  }

  // Animación de la barra
  const [animatedValue, setAnimatedValue] = useState(0);
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.5 });

  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setAnimatedValue(value), 200);
      return () => clearTimeout(timer);
    }
  }, [isVisible, value]);

  return (
    // CAMBIA el <div> externo por AnimatedCard, y añade onClick
    <AnimatedCard
      onClick={onClick} // <--- MANEJADOR DE CLIC AÑADIDO
      className="mb-5 group hover:bg-gray-50 p-2 rounded-lg transition-colors cursor-pointer" // <--- CAMBIA EL CLASSNAME
    >
      <div
        ref={ref}
        className="group" // <--- QUITA EL MARGIN DEL DIV PRINCIPAL, AHORA LO TIENE AnimatedCard
      >
        <div className="flex justify-between text-xs mb-2 font-bold tracking-wide">
          <span className="uppercase text-gray-700 flex items-center">
            {label}
            <Maximize2
              size={12}
              className="ml-2 text-gray-400 group-hover:text-red-600 transition-colors"
            />{" "}
            {/* Icono de "maximizar" */}
          </span>
          <span className={`px-2 py-0.5 rounded ${statusColor}`}>
            {statusText}
          </span>
        </div>
        <div className="h-4 w-full bg-gray-200 rounded-full overflow-hidden relative shadow-inner">
          {/* Línea de meta (Target) */}
          <div
            className="absolute top-0 bottom-0 w-0.5 bg-gray-800/50 z-20"
            style={{ left: `${target}%` }}
          ></div>

          {/* Barra de progreso */}
          <div
            className={`h-full rounded-full shadow transition-all duration-1000 ease-out ${
              isBehind
                ? "bg-gradient-to-r from-red-400 to-red-600"
                : "bg-gradient-to-r from-green-400 to-green-600"
            }`}
            style={{ width: `${animatedValue}%` }}
          ></div>
        </div>
        <div className="flex justify-between text-[10px] mt-1 text-gray-400 font-medium uppercase">
          <span>Ejecutado: {value}%</span>
          <span>PROGRAMADO: {target}%</span>
        </div>
      </div>
    </AnimatedCard> // <--- CIERRA AnimatedCard
  );
};

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto border border-gray-200 animate-scale-up">
        <div className="sticky top-0 bg-white z-10 px-6 py-4 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">{title}</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <XCircle size={24} className="text-gray-500" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
};

const AIChatWidget = ({ context }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "¡Hola! Soy tu asistente inteligente de Jaramillo Mora. ¿En qué puedo ayudarte hoy con la información del proyecto TRIALTO?",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSendMessage = async (text) => {
    if (!text.trim() || isLoading) return;
    setMessages((prev) => [...prev, { role: "user", text }]);
    setInputValue("");
    setIsLoading(true);
    const model = "gemini-2.5-flash-preview-09-2025";
    const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
    const payload = {
      contents: [
        { parts: [{ text: `Contexto:\n${context}\n\nUser: ${text}\nAI:` }] },
      ],
      systemInstruction: {
        parts: [
          {
            text: "Actúa como un analista de proyectos de construcción de Jaramillo Mora. Responde en español basándote estrictamente en el contexto proporcionado. Sé profesional y directo.",
          },
        ],
      },
    };
    try {
      const response = await fetchWithExponentialBackoff(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json();
      const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (aiResponse)
        setMessages((prev) => [
          ...prev,
          { role: "assistant", text: aiResponse },
        ]);
      else throw new Error("Estructura de respuesta inválida.");
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", text: `Error: ${error.message}.` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-40 font-sans print:hidden">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-gradient-to-r from-red-600 to-red-700 text-white rounded-full p-4 shadow-2xl flex items-center transition-all transform hover:scale-110 hover:rotate-3"
        >
          <Sparkles className="mr-2 animate-pulse" size={20} />
          <span className="font-bold">Asistente IA</span>
        </button>
      )}
      {isOpen && (
        <div className="bg-white rounded-2xl shadow-2xl w-80 md:w-96 flex flex-col h-[500px] border border-gray-200 overflow-hidden animate-slide-in-right">
          <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 flex justify-between items-center text-white">
            <div className="flex items-center">
              <Sparkles className="mr-2" size={18} />
              <h3 className="font-bold text-sm">Asistente Trialto</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 p-1 rounded transition-colors"
            >
              <X size={18} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex ${
                  msg.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] p-3 rounded-2xl text-xs ${
                    msg.role === "user"
                      ? "bg-red-600 text-white rounded-br-none"
                      : "bg-white border border-gray-200 text-gray-800 rounded-bl-none shadow-sm"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="text-xs text-gray-400 italic ml-4">
                Escribiendo...
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="p-3 bg-white border-t border-gray-200 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && handleSendMessage(inputValue)
              }
              placeholder="Pregunta algo..."
              className="flex-1 border border-gray-300 rounded-full px-4 py-2 text-xs focus:outline-none focus:border-red-500"
            />
            <button
              onClick={() => handleSendMessage(inputValue)}
              disabled={!inputValue.trim() || isLoading}
              className="bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
            >
              <Send size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// 👇 --- PEGA TODO ESTO JUSTO ENCIMA DE "export default function InformeTrialto" --- 👇

const EXTERNAL_URL = "/edificio-v3.glb";

const Model = () => {
  const { scene } = useGLTF(EXTERNAL_URL);
  return <primitive object={scene} />;
};

const Project3DViewer = () => {
  return (
    <div className="w-full h-[400px] bg-gray-100 rounded-2xl overflow-hidden shadow-inner border border-gray-200 relative mb-8">
      <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-gray-600 border border-gray-200 shadow-sm">
        Vista 3D Interactiva
      </div>
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 50 }}>
        <Environment preset="city" />
        <Suspense fallback={null}>
          <Stage environment="city" intensity={0.6} contactShadow={false}>
            <Model />
          </Stage>
        </Suspense>
        <OrbitControls autoRotate autoRotateSpeed={0.5} makeDefault />
      </Canvas>
      <Loader
        containerStyles={{ background: "rgba(255, 255, 255, 0.8)" }}
        innerStyles={{ background: "#dc2626", height: "4px" }}
        barStyles={{ background: "#dc2626" }}
        dataStyles={{ color: "#dc2626", fontWeight: "bold" }}
        dataInterpolation={(p) => `Cargando Modelo ${p.toFixed(0)}%`}
      />
    </div>
  );
};

useGLTF.preload(EXTERNAL_URL);

// --- CONFIGURACIÓN DE IMÁGENES DE LAS TORRES ---
const TOWER_IMAGES_URLS = {
  // Asignamos los IDs de las imágenes subidas a cada etiqueta.
  "Plataforma (Etapa I)": "Torre 1.jpg", // Usando la misma imagen que Torre 1
  "Torre 1 (Etapa I)": "Torre 1.jpg",
  "Torre 2 (Etapa II)": "Torre 2.jpg",
  "Torre 3 (Etapa III)": "Torre 3.jpg",
};

export default function InformeTrialto() {
  const [activeModal, setActiveModal] = useState(null);
  // Nuevo estado para la imagen de la torre
  const [towerModalImage, setTowerModalImage] = useState({
    url: "",
    title: "",
  });

  const openTowerModal = (label) => {
    setTowerModalImage({
      url: TOWER_IMAGES_URLS[label] || "",
      title: label,
    });
    setActiveModal("towerImage");
  };

  // --- CONFIGURACIÓN SPI ---
  const spiValue = 0.85; // <--- CAMBIA ESTE VALOR PARA PROBAR LOS COLORES

  const getSpiConfig = (val) => {
    if (val < 0.85)
      return {
        status: "critical",
        label: "Eficiencia Baja",
        icon: TrendingDown,
      };
    if (val < 0.95)
      return { status: "warning", label: "Eficiencia Media", icon: Activity };
    return { status: "good", label: "Eficiencia Alta", icon: TrendingUp };
  };

  const spiData = getSpiConfig(spiValue);
  // -------------------------
  return (
    <div className="bg-gray-100 min-h-screen py-8 font-sans text-gray-800">
      <Modal
        isOpen={activeModal === "spi"}
        onClose={() => setActiveModal(null)}
        title="Detalle de Indicador SPI (Curva S)"
      >
        <SCurveChart />
        <div className="mt-6 grid grid-cols-2 gap-4 text-xs text-gray-700">
          <div className="bg-red-50 p-4 rounded-lg">
            <h4 className="font-bold text-red-800 mb-2">Causas</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Falta de liberación entrega 1, por cambios de diseño. </li>
              <li>Reprocesos por falta de coordinación en diseño.</li>
            </ul>
          </div>
          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-bold text-blue-800 mb-2">Estrategia</h4>
            <ul className="list-disc list-inside space-y-1">
              <li>Seguimiento a planes remediales.</li>
              <li>Trabajo extra por personal de entrega 1.</li>
            </ul>
          </div>
        </div>
      </Modal>
      <Modal
        isOpen={activeModal === "towerImage"}
        onClose={() => setActiveModal(null)}
        title={towerModalImage.title}
      >
        <div className="flex justify-center bg-gray-50 p-4 rounded-lg">
          {towerModalImage.url ? (
            <img
              src={towerModalImage.url}
              alt={towerModalImage.title}
              className="max-w-full h-auto max-h-[70vh] rounded-lg shadow-lg object-contain"
            />
          ) : (
            <div className="text-gray-500 py-10">
              <XCircle size={32} className="mx-auto text-red-500 mb-2" />
              <p>No se encontró una imagen para esta torre.</p>
            </div>
          )}
        </div>
      </Modal>
      <Modal
        isOpen={activeModal === "concrete"}
        onClose={() => setActiveModal(null)}
        title="Análisis de Consumo de Concreto"
      >
        <ConcreteCurveChart />
        <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-700">
          <h4 className="font-bold text-gray-800 mb-2">
            Observaciones de Control y proyecciones
          </h4>
          <p>
            El consumo real ejecutado en el periodo fue de 704 m³ frente a los
            662 m³ planeados, manteniéndose alineado con el adelanto en la
            estructura de la torre 3. Se presenta una variación en la producción
            de 285 m³ respecto al mes anterior, lo cual es congruente con el
            cierre de las fundiciones en la torre 2. Para el siguiente periodo
            se proyecta fundir 259.5 m³.
          </p>
        </div>
      </Modal>
      <Page pageNumber={1}>
        <Header title="Resumen Ejecutivo" date="Corte: 29 de Noviembre, 2025" />
        {/* --- ZONA 3: AQUÍ SE MUESTRA EL 3D --- */}
        <Project3DViewer />
        {/* ------------------------------------- */}
        <AnimatedCard className="bg-gradient-to-br from-gray-50 to-white p-8 rounded-2xl border border-gray-200 mb-10 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-red-50 rounded-full filter blur-3xl opacity-50 -z-10"></div>
          <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center">
            <Activity className="mr-2 text-red-600" /> Estado General
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="relative">
              <div className="mb-2 flex justify-between items-end">
                <span className="text-sm font-medium text-gray-600">
                  Avance Físico
                </span>
                <span className="text-4xl font-black text-gray-900">55%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-6 mb-2 shadow-inner overflow-hidden">
                <div
                  className="bg-gradient-to-r from-red-600 to-red-500 h-6 rounded-full flex items-center justify-end pr-2 animate-pulse"
                  style={{ width: "55%" }}
                >
                  <span className="text-[10px] text-white font-bold">
                    EJECUTADO
                  </span>
                </div>
              </div>
              <div
                className="absolute top-[3.0rem] w-1 h-6 bg-gray-800/50 z - 6 border border-dashed border-gray-800"
                style={{ left: "65%" }}
              ></div>
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Inicio: Ago 8 2023</span>
                <span className="text-bg-gray-800/50"> ▼ PROGRAMADO: 65%</span>
                <span>Fin: Nov 30 2026</span>
              </div>
            </div>
            <div className="flex flex-col justify-center border-l-2 border-gray-100 pl-8">
              <div className="flex items-center space-x-3 mb-3">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-yellow-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-yellow-500"></span>
                </span>
                <span className="text-sm font-bold uppercase text-yellow-700 tracking-wider">
                  Precaución
                </span>
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Se han identificado retrasos moderados en frentes críticos como{" "}
                <strong>Urbanismo Externo y Sótanos</strong>.Se están
                implementando programas remediales específicos para el monitoreo
                y control de dichos{" "}
                <span className="font-bold text-red-600">frentes</span>.
              </p>
            </div>
          </div>
        </AnimatedCard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <KPI
            title="SPI (Click para Curva S)"
            value={spiValue.toFixed(2)}
            subtext={spiData.label}
            status={spiData.status}
            icon={spiData.icon}
            onClick={() => setActiveModal("spi")}
          />
          <KPI
            title="Personal en Obra"
            value="708"
            subtext="+31 pax vs mes anterior"
            status="good"
            icon={Users}
          />
          <KPI
            title="Atraso General"
            value="31 Días"
            subtext="Ruta Crítica Afectada"
            status="warning"
            icon={AlertTriangle}
          />
        </div>
        <AnimatedCard className="mb-6 bg-white rounded-lg border border-gray-100 shadow-sm p-4">
          <h3 className="text-md font-bold text-gray-800 mb-4 uppercase border-l-4 border-red-600 pl-3">
            Datos Clave
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded">
              <span className="block text-gray-500 text-xs uppercase">
                Proyecto
              </span>
              <span className="font-semibold">Trialto Santa Monica</span>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <span className="block text-gray-500 text-xs uppercase">
                Unidades
              </span>
              <span className="font-semibold">417 Viviendas</span>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <span className="block text-gray-500 text-xs uppercase">
                Inicio
              </span>
              <span className="font-semibold">08/08/2023</span>
            </div>
            <div className="p-3 bg-gray-50 rounded">
              <span className="block text-gray-500 text-xs uppercase">
                Fin{" "}
              </span>
              <span className="font-semibold">30/11/2026</span>
            </div>
          </div>
        </AnimatedCard>
      </Page>
      <Page pageNumber={2}>
        <Header title="Detalle de Avance" date="Corte: 29 de Noviembre, 2025" />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <HardHat className="mr-2 text-gray-600" /> Edificación
            </h3>
            <div className="space-y-2">
              <ProgressBar
                label="Plataforma (Etapa I)"
                value={99}
                target={99}
                delayDays={-6}
                onClick={() => openTowerModal("Plataforma (Etapa I)")} // <--- AÑADIDO
              />
              <ProgressBar
                label="Torre 1 (Etapa I)"
                value={71}
                target={85}
                delayDays={68}
                onClick={() => openTowerModal("Torre 1 (Etapa I)")} // <--- AÑADIDO
              />
              <ProgressBar
                label="Torre 2 (Etapa II)"
                value={45}
                target={63}
                delayDays={53}
                onClick={() => openTowerModal("Torre 2 (Etapa II)")} // <--- AÑADIDO
              />
              <ProgressBar
                label="Torre 3 (Etapa III)"
                value={23}
                target={28}
                delayDays={31}
                onClick={() => openTowerModal("Torre 3 (Etapa III)")} // <--- AÑADIDO
              />
            </div>
          </div>
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-6 flex items-center">
              <AlertTriangle className="mr-2 text-red-600" /> Frentes Críticos
            </h3>
            <AnimatedCard className="bg-red-50 border border-red-100 rounded-xl p-6 mb-6 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                <AlertTriangle size={64} className="text-red-500" />
              </div>
              <h4 className="font-bold text-red-800 mb-2 text-lg">
                Urbanismo Externo
              </h4>
              <div className="flex items-end space-x-4 mb-3">
                <div className="text-4xl font-black text-red-700">55%</div>
                <div className="text-sm text-red-600 pb-2 font-medium">
                  Ejecutado (vs 73% Prog.)
                </div>
              </div>
              <p className="text-sm text-gray-700 mb-4">
                Mayor impacto en ruta crítica:{" "}
                <span className="bg-red-200 px-1 rounded font-bold text-red-900">
                  46 días de atraso
                </span>
                .
              </p>
              <div className="bg-white/60 rounded p-3">
                <p className="text-xs font-bold text-red-800 mb-1 uppercase">
                  Actividades Afectadas:
                </p>
                <ul className="list-disc list-inside text-xs text-gray-700 space-y-1">
                  <li>Reposición red acueducto</li>
                  <li>Colector principal</li>
                  <li>Subterranización eléctrica</li>
                </ul>
              </div>
            </AnimatedCard>
          </div>
        </div>
      </Page>
      <Page pageNumber={3}>
        <Header
          title="Análisis Técnico y Materiales"
          date="Corte: 22 de Noviembre, 2025"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
          <AnimatedCard
            onClick={() => setActiveModal("concrete")}
            className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-lg transition-all cursor-pointer group relative"
          >
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ZoomIn size={20} className="text-blue-500" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
              <BarChart3 className="mr-2 text-blue-600" /> Consumo de Concreto
            </h3>
            <ConcreteChart />
            <div className="mt-2 text-center text-xs text-blue-600 font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
              Click para ver Curva de Consumo
            </div>
          </AnimatedCard>
          <AnimatedCard className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center border-b pb-2">
              <Ruler className="mr-2 text-gray-600" /> Resumen de Aceros
            </h3>
            <div className="mb-4 flex justify-between items-center bg-blue-50 p-3 rounded-lg">
              <div>
                <p className="text-xs font-bold text-blue-800 uppercase">
                  Cuantía Estructural
                </p>
                <p className="text-xs text-blue-600">Losa + Columnas</p>
              </div>
              <div className="text-2xl font-bold text-blue-900">
                57.60 <span className="text-sm font-normal">Kg/m²</span>
              </div>
            </div>
            <SteelTable />
            <div className="mt-4 p-3 bg-yellow-50 border border-yellow-100 rounded-lg flex items-center justify-between">
              <span className="text-xs font-bold text-yellow-800 uppercase">
                Pendiente por Pedir
              </span>
              <span className="font-bold text-yellow-900">4 Toneladas</span>
            </div>
          </AnimatedCard>
        </div>
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-4 border-b border-gray-200 pb-2">
            Seguimiento Mampostería
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <AnimatedCard className="bg-white p-5 rounded-xl shadow-md border-l-4 border-green-500">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-800 text-lg">Torre 1</h4>
                <CheckCircle className="text-green-500" size={20} />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Finalizó el 10 de Octubre (16 días después de lo planificado).
              </p>
              <div className="text-xs bg-green-50 p-2 rounded text-green-800 font-medium">
                Hito completado.
              </div>
            </AnimatedCard>
            <AnimatedCard className="bg-white p-5 rounded-xl shadow-md border-l-4 border-yellow-500">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-800 text-lg">Torre 2</h4>
                <TrendingUp className="text-yellow-500" size={20} />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Ritmo de ejecución según programa. Atraso de solo 1 día,
                equivalente a 38.09 m².
              </p>
              <div className="text-xs bg-yellow-50 p-2 rounded text-yellow-800 font-medium">
                Se mantiene el refuerzo de mamposteros provenientes de torre 1.
              </div>
            </AnimatedCard>
            <AnimatedCard className="bg-white p-5 rounded-xl shadow-md border-l-4 border-yellow-500">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-bold text-gray-800 text-lg">Torre 3</h4>
                <Activity className="text-yellow-500" size={20} />
              </div>
              <p className="text-sm text-gray-600 mb-3">
                Se nivela la pega de mamposteria interna en piso 9. Atrasado de
                66.49 m² equivalntes a 1 día de atraso.
              </p>
              <div className="text-xs bg-yellow-50 p-2 rounded text-yellow-800 font-medium">
                Objetivo: Nivelar dinteles en piso 9.
              </div>
            </AnimatedCard>
          </div>
        </div>
      </Page>
      <Page pageNumber={4}>
        <Header title="Conclusiones" date="Corte: 29 de Noviembre, 2025" />
        <div className="flex flex-col h-full">
          <AnimatedCard className="bg-white border-l-4 border-red-600 p-6 shadow-lg mb-8 transform hover:-translate-y-1 transition-transform">
            <h3 className="text-xl font-bold text-gray-800 mb-4 flex items-center">
              <AlertTriangle className="mr-2 text-red-600" /> Riesgo Crítico
            </h3>
            <p className="text-gray-700 mb-4 leading-relaxed text-base">
              El retraso de 68 días en la Torre 1 y 53 días en la Torre 2,
              correspondiente a las actividades de carpintería en madera y
              ventanería, representa el principal riesgo del proyecto. Se
              recomienda priorizar las actividades predecesoras de las entregas
              1 y 2, ya que impactan directamente la ruta crítica
            </p>
            <button className="bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition-colors text-sm font-bold flex items-center w-fit">
              Ver Plan Remedial <ArrowRight size={16} className="ml-2" />
            </button>
          </AnimatedCard>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <AnimatedCard className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                <CheckCircle className="mr-2 text-green-600" size={20} /> Logros
              </h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start bg-white p-3 rounded shadow-sm">
                  <span className="mr-2 font-bold text-green-600">✓</span>
                  Entrega de fosos ascensores Torre 1.
                </li>
                <li className="flex items-start bg-white p-3 rounded shadow-sm">
                  <span className="mr-2 font-bold text-green-600">✓</span>
                  Muros pescantes cubierta Torre 2 completos.
                </li>
                <li className="flex items-start bg-white p-3 rounded shadow-sm">
                  <span className="mr-2 font-bold text-green-600">✓</span>
                  Cierre de fundiciones de losa Torre 3.
                </li>
              </ul>
            </AnimatedCard>
            <AnimatedCard className="bg-gray-50 p-6 rounded-xl">
              <h4 className="font-bold text-gray-800 mb-4 flex items-center text-lg">
                <TrendingUp className="mr-2 text-blue-600" size={20} />{" "}
                Proyecciones
              </h4>
              <ul className="space-y-4 text-sm text-gray-600">
                <li className="flex items-start bg-white p-3 rounded shadow-sm">
                  <span className="mr-2 text-blue-600">➜</span>Torre 1:
                  Finalizar entrega 1
                </li>
                <li className="flex items-start bg-white p-3 rounded shadow-sm">
                  <span className="mr-2 text-blue-600">➜</span>Torre 2: Terminar
                  mamposteria interna
                </li>
                <li className="flex items-start bg-white p-3 rounded shadow-sm">
                  <span className="mr-2 text-blue-600">➜</span>Torre 3:
                  Fundición muros pescantes piso 16
                </li>
                <li className="flex items-start bg-white p-3 rounded shadow-sm">
                  <span className="mr-2 text-blue-600">➜</span>Torre 3: Nivelar
                  hidraulica en piso 9
                </li>
                <li className="flex items-start bg-white p-3 rounded shadow-sm">
                  <span className="mr-2 text-blue-600">➜</span>Plataforma:
                  Cierre 100% estructura.
                </li>
              </ul>
            </AnimatedCard>
          </div>
          <div className="mt-auto pt-8 border-t border-gray-200 flex justify-between items-center text-gray-500 text-sm">
            <div>
              <p className="uppercase text-xs font-bold tracking-wider mb-1">
                Elaborado Por
              </p>
              <p>Ing. Fabian Valencia - Aux. Ing & Equipo TRIALTO</p>

              {/* ESPACIO ENTRE SECCIONES */}
              <div className="mt-4"></div>

              <p className="uppercase text-xs font-bold tracking-wider mb-1">
                Aprobado por
              </p>
              <p>Ing. Rafael Velasco - Subgerente</p>
              <p>Arq. John Coy - Coordinador</p>
            </div>

            <div className="text-right">
              <p className="uppercase text-xs font-bold tracking-wider mb-1">
                Próximo Corte
              </p>
              <p className="text-lg font-bold text-gray-800">
                20 de Diciembre, 2025
              </p>
            </div>
          </div>
        </div>
      </Page>
      <AIChatWidget context={projectContext} />
    </div>
  );
}
