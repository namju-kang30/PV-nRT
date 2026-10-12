import React, { useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Beaker,
  BookOpen,
  Check,
  ChevronDown,
  Download,
  FlaskConical,
  Info,
  Maximize2,
  Pause,
  Play,
  Plus,
  RotateCcw,
  Snowflake,
  Thermometer,
  X,
  LockKeyhole,
  Wind,
} from "lucide-react";
import { processes, R, stateAt } from "./physics.js";

const icons = {
  isothermal: Thermometer,
  isobaric: Wind,
  isochoric: LockKeyhole,
  adiabatic: Snowflake,
};
const fmt = (number, decimals = 1) =>
  number.toLocaleString("ko-KR", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
const energy = (number) =>
  `${number > 0.005 ? "+" : ""}${fmt(Math.abs(number) < 0.005 ? 0 : number / 1000, 2)}`;
const defaultParams = {
  n: 1,
  temperature: 300,
  volume: 20,
  gamma: 5 / 3,
  ratio: 2,
};
const questions = [
  {
    title: "등온 과정에서 열은 어디로 갈까요?",
    text: "등온 과정으로 20 L에서 40 L까지 팽창시켜 보세요. ΔU, Q, W를 비교하고, 온도가 일정할 때 내부 에너지가 변하지 않는 이유를 설명해 보세요.",
    hint: "이상기체의 내부 에너지는 온도에만 의존해요. ΔU = 0을 제1법칙에 대입하면 Q = W입니다.",
  },
  {
    title: "같은 팽창, 다른 일의 양",
    text: "같은 초기 상태에서 부피를 두 배로 늘려 보세요. 등압, 등온, 단열 과정의 P–V 그래프 아래 면적과 기체가 한 일을 비교해 보세요.",
    hint: "같은 부피 변화에서 등압 > 등온 > 단열 순으로 일이 커요. 팽창 중 압력이 더 높으면 기체가 하는 일도 더 큽니다.",
  },
  {
    title: "단열 압축을 하면 왜 뜨거워질까요?",
    text: "단열 과정을 선택하고 최종 부피 비율을 0.5배로 설정해 보세요. 열이 들어오지 않아도 온도가 올라가는 이유를 제1법칙으로 설명해 보세요.",
    hint: "압축할 때 기체가 한 일 W는 음수입니다. Q = 0이므로 ΔU = −W > 0이고, 내부 에너지와 온도가 함께 올라갑니다.",
  },
];

function Range({ label, value, min, max, step, unit, onChange, marks }) {
  return (
    <div className="range-field">
      <div className="field-label">
        <label>{label}</label>
        <span>
          {fmt(value, step < 1 ? 1 : 0)} <small>{unit}</small>
        </span>
      </div>
      <input
        aria-label={label}
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ "--fill": `${((value - min) / (max - min)) * 100}%` }}
      />
      <div className="range-marks">
        <span>{marks?.[0] || `${min} ${unit}`}</span>
        <span>{marks?.[1] || `${max} ${unit}`}</span>
      </div>
    </div>
  );
}

function Piston({ state, params, process, running }) {
  const canvas = useRef(null);
  const data = useRef({ state, params, running });
  data.current = { state, params, running };
  useEffect(() => {
    const el = canvas.current;
    const ctx = el.getContext("2d");
    let frame;
    let last = 0;
    const particles = Array.from({ length: 48 }, (_, i) => ({
      x: ((i * 37) % 101) / 101,
      y: ((i * 59) % 103) / 103,
      vx: Math.cos(i * 2.4),
      vy: Math.sin(i * 2.4),
    }));
    const render = (time) => {
      const { state: s, params: p } = data.current;
      const w = el.clientWidth,
        h = el.clientHeight;
      const dpr = window.devicePixelRatio || 1;
      if (el.width !== w * dpr || el.height !== h * dpr) {
        el.width = w * dpr;
        el.height = h * dpr;
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const dt = Math.min((time - last) / 1000, 0.04);
      last = time;
      const left = w * 0.2,
        width = w * 0.58,
        bottom = h - 30;
      const top = bottom - (h - 65) * (0.3 + (0.7 * (s.V / s.V0)) / 2.5);
      ctx.fillStyle = "#fff3e8";
      ctx.fillRect(left, top + 8, width, bottom - top - 8);
      ctx.strokeStyle = "#c5c6c7";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(left, 36);
      ctx.lineTo(left, bottom);
      ctx.lineTo(left + width, bottom);
      ctx.lineTo(left + width, 36);
      ctx.stroke();
      for (let i = 0; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo(left + width + 9, bottom - i * 26);
        ctx.lineTo(left + width + 18, bottom - i * 26);
        ctx.strokeStyle = "#d9d9d9";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.fillStyle = "#ededed";
      ctx.fillRect(left + 1, top, width - 2, 9);
      ctx.strokeStyle = "#8b8d8e";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(left + 1, top, width - 2, 9);
      ctx.fillStyle = "#c4c6c7";
      ctx.fillRect(left + width / 2 - 4, 16, 8, top - 16);
      ctx.fillStyle = "#ededed";
      ctx.fillRect(left + width / 2 - 25, 13, 50, 7);
      ctx.strokeStyle = "#c4c6c7";
      ctx.strokeRect(left + width / 2 - 25, 13, 50, 7);
      const speed = 0.24 * Math.sqrt(s.T / 300);
      const count = Math.round(18 + p.n * 12);
      for (const particle of particles.slice(0, count)) {
        particle.x += particle.vx * dt * speed;
        particle.y += particle.vy * dt * speed;
        if (particle.x < 0 || particle.x > 1) {
          particle.x = Math.max(0, Math.min(1, particle.x));
          particle.vx *= -1;
        }
        if (particle.y < 0 || particle.y > 1) {
          particle.y = Math.max(0, Math.min(1, particle.y));
          particle.vy *= -1;
        }
        ctx.beginPath();
        ctx.arc(
          left + 9 + particle.x * (width - 18),
          top + 18 + particle.y * (bottom - top - 27),
          3,
          0,
          Math.PI * 2,
        );
        ctx.fillStyle = "#ff9654";
        ctx.fill();
      }
      ctx.fillStyle = "#757575";
      ctx.font = "11px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`${fmt(s.V * 1000)} L`, left + width / 2, bottom + 22);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, []);
  return (
    <div
      className={`piston-view ${process === "adiabatic" ? "insulated" : ""}`}
    >
      <div className="piston-label">
        <span className="tiny-dot" />
        {process === "adiabatic"
          ? "단열 용기"
          : process === "isochoric"
            ? "피스톤 고정"
            : "마찰 없는 피스톤"}
      </div>
      <canvas
        ref={canvas}
        role="img"
        aria-label={`기체 피스톤: 부피 ${fmt(state.V * 1000)} L, 온도 ${fmt(state.T)} K. 분자 움직임은 정성적 표현입니다.`}
      />
      <span className="piston-footnote">
        분자의 속도 ∝ √T <span>정성적 모형</span>
      </span>
    </div>
  );
}

function PVChart({ params, process, progress, enlarged = false }) {
  const points = Array.from({ length: 101 }, (_, i) =>
    stateAt({ ...params, process }, i / 100),
  );
  const current = stateAt({ ...params, process }, progress);
  const initial = points[0],
    final = points[100];
  const width = 520,
    height = 264,
    left = 57,
    right = 24,
    top = 29,
    bottom = 42;
  const maxV = Math.max(initial.V, final.V) * 1000 * 1.23;
  const maxP = (Math.max(initial.P, final.P) / 1000) * 1.24;
  const x = (V) => left + ((V * 1000) / maxV) * (width - left - right);
  const y = (P) =>
    height - bottom - (P / 1000 / maxP) * (height - top - bottom);
  const path = (arr) =>
    arr.map((s, i) => `${i ? "L" : "M"} ${x(s.V)} ${y(s.P)}`).join(" ");
  const active = points.filter((_, i) => i / 100 <= progress);
  active.push(current);
  const area = `${path(active)} L ${x(current.V)} ${height - bottom} L ${x(initial.V)} ${height - bottom} Z`;
  return (
    <svg
      className={`pv-chart ${enlarged ? "enlarged" : ""}`}
      viewBox={`0 0 ${width} ${height}`}
      role="img"
      aria-label={`압력 부피 그래프. 초기 ${fmt(initial.V * 1000)} L, ${fmt(initial.P / 1000)} kPa. 현재 ${fmt(current.V * 1000)} L, ${fmt(current.P / 1000)} kPa. 주황 영역은 진행한 구간의 일입니다.`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <g key={i}>
          <line
            x1={left}
            x2={width - right}
            y1={top + (i * (height - top - bottom)) / 4}
            y2={top + (i * (height - top - bottom)) / 4}
            stroke="#ebebeb"
          />
          <text
            x={left - 12}
            y={top + (i * (height - top - bottom)) / 4 + 4}
            textAnchor="end"
          >
            {fmt((maxP * (4 - i)) / 4, 0)}
          </text>
          <text
            x={left + (i * (width - left - right)) / 4}
            y={height - bottom + 22}
            textAnchor="middle"
          >
            {fmt((maxV * i) / 4, 0)}
          </text>
        </g>
      ))}
      <line
        x1={left}
        x2={left}
        y1={top - 7}
        y2={height - bottom}
        stroke="#bdbdbd"
      />
      <line
        x1={left}
        x2={width - right + 5}
        y1={height - bottom}
        y2={height - bottom}
        stroke="#bdbdbd"
      />
      <text x="15" y="15" className="axis-title">
        P (kPa)
      </text>
      <text
        x={width - right}
        y={height - 2}
        textAnchor="end"
        className="axis-title"
      >
        V (L)
      </text>
      {process !== "isochoric" && (
        <path d={area} fill="#ff8c45" opacity=".17" />
      )}
      <path
        d={path(points)}
        fill="none"
        stroke="#ffc6a2"
        strokeWidth="2"
        strokeDasharray="5 5"
      />
      <path d={path(active)} fill="none" stroke="#ff8c45" strokeWidth="2.5" />
      <circle
        cx={x(initial.V)}
        cy={y(initial.P)}
        r="4.5"
        fill="white"
        stroke="#999"
        strokeWidth="1.5"
      />
      <text
        x={x(initial.V) - 8}
        y={y(initial.P) - 13}
        textAnchor="end"
        className="point-label"
      >
        초기
      </text>
      <circle
        cx={x(final.V)}
        cy={y(final.P)}
        r="4.5"
        fill="white"
        stroke="#ff8c45"
        strokeWidth="1.5"
      />
      <text x={x(final.V) + 8} y={y(final.P) - 12} className="point-label">
        최종
      </text>
      <circle
        cx={x(current.V)}
        cy={y(current.P)}
        r="7"
        fill="#ff8c45"
        fillOpacity=".17"
      />
      <circle cx={x(current.V)} cy={y(current.P)} r="4" fill="#ff8c45" />
    </svg>
  );
}

export default function App() {
  const [process, setProcess] = useState("isothermal");
  const [params, setParams] = useState(defaultParams);
  const [progress, setProgress] = useState(0);
  const [running, setRunning] = useState(false);
  const [modal, setModal] = useState(null);
  const [records, setRecords] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("thermo-records") || "[]").slice(
        0,
        8,
      );
    } catch {
      return [];
    }
  });
  const [note, setNote] = useState(() => {
    try {
      return localStorage.getItem("thermo-note") || "";
    } catch {
      return "";
    }
  });
  const [expanded, setExpanded] = useState(0);
  const [saved, setSaved] = useState(false);
  const [activeNav, setActiveNav] = useState("simulation");
  const state = stateAt({ ...params, process }, progress);
  const meta = processes[process];
  useEffect(() => {
    if (!running) return;
    let frame, previous;
    const tick = (now) => {
      if (previous)
        setProgress((p) => Math.min(1, p + (now - previous) / 6000));
      previous = now;
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [running]);
  useEffect(() => {
    if (progress >= 1) setRunning(false);
  }, [progress]);
  useEffect(() => {
    try {
      localStorage.setItem("thermo-records", JSON.stringify(records));
    } catch {}
  }, [records]);
  useEffect(() => {
    try {
      localStorage.setItem("thermo-note", note);
    } catch {}
  }, [note]);
  useEffect(() => {
    const close = (e) => {
      if (e.key === "Escape") setModal(null);
    };
    window.addEventListener("keydown", close);
    return () => window.removeEventListener("keydown", close);
  }, []);
  const update = (name, value) => {
    setParams((p) => ({ ...p, [name]: value }));
    setProgress(0);
    setRunning(false);
    setSaved(false);
  };
  const choose = (key) => {
    setProcess(key);
    setProgress(0);
    setRunning(false);
    setSaved(false);
  };
  const reset = () => {
    setRunning(false);
    setProgress(0);
    setParams(defaultParams);
    setSaved(false);
  };
  const toggleRun = () => {
    if (progress >= 1) setProgress(0);
    setRunning((r) => !r);
  };
  const record = () => {
    const result = {
      id: Date.now(),
      process,
      params: { ...params },
      progress,
      ...state,
    };
    setRecords((r) => [...r.slice(-7), result]);
    setSaved(true);
    setTimeout(() => setSaved(false), 2200);
  };
  const download = () => {
    const rows = [
      [
        "과정",
        "진행률(%)",
        "몰수(mol)",
        "초기온도(K)",
        "초기부피(L)",
        "비열비",
        "현재온도(K)",
        "현재부피(L)",
        "현재압력(kPa)",
        "열(J)",
        "일(J)",
        "내부에너지변화(J)",
      ],
      ...records.map((r) => [
        processes[r.process].name,
        (r.progress * 100).toFixed(0),
        r.params.n,
        r.params.temperature,
        r.params.volume,
        r.params.gamma,
        r.T,
        r.V * 1000,
        r.P / 1000,
        r.Q,
        r.W,
        r.dU,
      ]),
    ];
    const url = URL.createObjectURL(
      new Blob(["\ufeff" + rows.map((r) => r.join(",")).join("\r\n")], {
        type: "text/csv;charset=utf-8",
      }),
    );
    const a = document.createElement("a");
    a.href = url;
    a.download = "thermo-lab-results.csv";
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const navigate = (target) => {
    setActiveNav(target);
    document
      .getElementById(target)
      .scrollIntoView({ behavior: "smooth", block: "start" });
  };
  return (
    <>
      <header className="site-header">
        <div className="header-inner">
          <a
            className="brand"
            href="#simulation"
            onClick={() => setActiveNav("simulation")}
          >
            <span className="brand-icon">
              <FlaskConical size={21} strokeWidth={1.7} />
            </span>
            <span>
              THERMO<span className="brand-light"> LAB</span>
            </span>
            <span className="brand-divider" />
            <span className="brand-sub">열역학 탐구 실험실</span>
          </a>
          <nav aria-label="주 메뉴">
            <button
              className={activeNav === "simulation" ? "active" : ""}
              onClick={() => navigate("simulation")}
            >
              시뮬레이션
            </button>
            <button
              className={activeNav === "exploration" ? "active" : ""}
              onClick={() => navigate("exploration")}
            >
              탐구 노트
            </button>
            <button className="guide-button" onClick={() => setModal("guide")}>
              <BookOpen size={15} /> 이용 가이드 <ArrowUpRight size={13} />
            </button>
          </nav>
        </div>
      </header>
      <main>
        <section className="intro" id="simulation">
          <div>
            <div className="eyebrow">
              <span /> INTERACTIVE PHYSICS LAB
            </div>
            <h1>
              변화를 관찰하고, <span>법칙을 발견하다.</span>
            </h1>
            <p>
              기체의 네 가지 변화를 직접 실험하며 열역학의 원리를 탐구해 보세요.
            </p>
          </div>
          <div className="intro-formula">
            PV <span>=</span> nRT<small>작은 변화에서 시작하는 큰 발견</small>
          </div>
        </section>
        <div className="section-kicker">
          <span>
            <b>01</b> 열역학 과정 선택
          </span>
          <span className="kicker-note">어떤 조건을 일정하게 유지할까요?</span>
        </div>
        <div
          className="process-grid"
          role="group"
          aria-label="열역학 과정 선택"
        >
          {Object.entries(processes).map(([key, item], i) => {
            const Icon = icons[key];
            return (
              <button
                key={key}
                className={`process-card ${process === key ? "selected" : ""}`}
                aria-pressed={process === key}
                onClick={() => choose(key)}
              >
                <div className="process-top">
                  <Icon size={22} strokeWidth={1.5} />
                  <span>0{i + 1}</span>
                </div>
                <div className="process-name">
                  <strong>{item.name}</strong>
                  <span className="selection-circle">
                    {process === key && <Check size={11} />}
                  </span>
                </div>
                <div className="process-bottom">
                  <span>{item.constant}</span>
                  <span>
                    {item.symbol} {key === "adiabatic" ? "= 0" : "= const."}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
        <div className="lab-layout">
          <aside className="controls panel">
            <div className="panel-heading">
              <h2>
                <span>02</span> 실험 조건
              </h2>
              <button
                className="icon-button"
                aria-label="모든 실험 조건 초기화"
                title="초기화"
                onClick={reset}
              >
                <RotateCcw size={16} />
              </button>
            </div>
            <div className="control-section">
              <div className="small-heading">
                초기 상태 <span>INITIAL STATE</span>
              </div>
              <Range
                label="기체의 양"
                value={params.n}
                min={0.5}
                max={2.5}
                step={0.1}
                unit="mol"
                onChange={(v) => update("n", v)}
              />
              <Range
                label="초기 온도"
                value={params.temperature}
                min={200}
                max={600}
                step={10}
                unit="K"
                onChange={(v) => update("temperature", v)}
              />
              <Range
                label="초기 부피"
                value={params.volume}
                min={10}
                max={40}
                step={1}
                unit="L"
                onChange={(v) => update("volume", v)}
              />
              <div className="select-field">
                <label htmlFor="gas-type">기체 종류</label>
                <div>
                  <select
                    id="gas-type"
                    value={params.gamma}
                    onChange={(e) => update("gamma", Number(e.target.value))}
                  >
                    <option value={5 / 3}>단원자 이상기체</option>
                    <option value={1.4}>이원자 이상기체</option>
                  </select>
                  <ChevronDown size={14} />
                </div>
                <small>
                  비열비 γ = {fmt(params.gamma, 2)} · 일정한 비열 가정
                </small>
              </div>
            </div>
            <div className="control-section target-section">
              <div className="small-heading">
                최종 상태 <span>TARGET STATE</span>
              </div>
              <Range
                label={
                  process === "isochoric" ? "최종 온도 비율" : "최종 부피 비율"
                }
                value={params.ratio}
                min={0.5}
                max={2.5}
                step={0.1}
                unit="배"
                onChange={(v) => update("ratio", v)}
                marks={
                  process === "isochoric" ? ["냉각", "가열"] : ["압축", "팽창"]
                }
              />
              <div className="target-value">
                <span>
                  {process === "isochoric" ? "목표 온도" : "목표 부피"}
                </span>
                <b>
                  {fmt(
                    (process === "isochoric"
                      ? params.temperature
                      : params.volume) * params.ratio,
                  )}{" "}
                  <small>{process === "isochoric" ? "K" : "L"}</small>
                </b>
              </div>
            </div>
            <div className="condition-note">
              <Info size={15} />
              <p>
                {meta.description}
                <br />
                <strong>{meta.relation}</strong>
              </p>
            </div>
          </aside>
          <div className="experiment-area">
            <div className="panel experiment-panel">
              <div className="panel-heading">
                <h2>
                  <span>03</span> 시뮬레이션
                </h2>
                <span className="live-badge">
                  <span />
                  {running
                    ? "실험 진행 중"
                    : progress === 1
                      ? "실험 완료"
                      : progress > 0
                        ? "일시 정지"
                        : "실험 준비"}
                </span>
              </div>
              <div className="state-grid">
                {[
                  {
                    label: "압력",
                    english: "PRESSURE",
                    value: state.P / 1000,
                    unit: "kPa",
                    fixed: process === "isobaric",
                  },
                  {
                    label: "부피",
                    english: "VOLUME",
                    value: state.V * 1000,
                    unit: "L",
                    fixed: process === "isochoric",
                  },
                  {
                    label: "온도",
                    english: "TEMPERATURE",
                    value: state.T,
                    unit: "K",
                    fixed: process === "isothermal",
                  },
                ].map((s) => (
                  <div className="state-card" key={s.label}>
                    <div>
                      <span>{s.label}</span>
                      <small>
                        {s.fixed ? (
                          <span className="fixed-tag">일정</span>
                        ) : (
                          s.english
                        )}
                      </small>
                    </div>
                    <strong>
                      {fmt(s.value)} <small>{s.unit}</small>
                    </strong>
                  </div>
                ))}
              </div>
              <div className="visualizations">
                <Piston
                  state={state}
                  params={params}
                  process={process}
                  running={running}
                />
                <div className="graph-view">
                  <div className="graph-heading">
                    <h3>압력–부피 그래프</h3>
                    <button
                      className="icon-button"
                      aria-label="압력 부피 그래프 확대"
                      onClick={() => setModal("chart")}
                    >
                      <Maximize2 size={14} />
                    </button>
                  </div>
                  <PVChart
                    params={params}
                    process={process}
                    progress={progress}
                  />
                  <div className="graph-legend">
                    <span>
                      <i />
                      실험 경로
                    </span>
                    <span>
                      <i className="area" />
                      기체가 한 일 W
                    </span>
                    <span className="graph-note">
                      {process === "isochoric"
                        ? "ΔV = 0 → W = 0"
                        : "W = ∫ P dV"}
                    </span>
                  </div>
                </div>
              </div>
              <div className="playback">
                <button
                  className={`play-button ${running ? "playing" : ""}`}
                  onClick={toggleRun}
                >
                  {running ? (
                    <Pause size={15} fill="currentColor" />
                  ) : (
                    <Play size={15} fill="currentColor" />
                  )}
                  {running
                    ? "일시 정지"
                    : progress === 1
                      ? "다시 실험"
                      : progress > 0
                        ? "계속하기"
                        : "실험 시작"}
                </button>
                <button
                  className="icon-button restart"
                  aria-label="진행률 초기화"
                  onClick={() => {
                    setProgress(0);
                    setRunning(false);
                  }}
                >
                  <RotateCcw size={16} />
                </button>
                <div className="progress-control">
                  <input
                    type="range"
                    aria-label="실험 진행률"
                    min="0"
                    max="100"
                    step="1"
                    value={Math.round(progress * 100)}
                    onChange={(e) => {
                      setProgress(Number(e.target.value) / 100);
                      setRunning(false);
                    }}
                    style={{ "--fill": `${progress * 100}%` }}
                  />
                  <div>
                    <span>초기 상태</span>
                    <span>최종 상태</span>
                  </div>
                </div>
                <span className="progress-number">
                  {Math.round(progress * 100)}
                  <small>%</small>
                </span>
                <button className="record-button" onClick={record}>
                  {saved ? <Check size={15} /> : <Plus size={15} />}
                  {saved ? "기록 완료" : "결과 기록"}
                </button>
              </div>
            </div>
            <div className="energy-panel panel">
              <div className="energy-heading">
                <h2>에너지의 흐름</h2>
                <span>
                  열역학 제1법칙 <b>ΔU = Q − W</b>
                </span>
              </div>
              <div className="energy-equation">
                <div className="energy-item">
                  <span>
                    <i className="energy-dot orange" />
                    흡수한 열 <b>Q</b>
                  </span>
                  <strong>
                    {energy(state.Q)} <small>kJ</small>
                  </strong>
                </div>
                <span className="equation-sign">−</span>
                <div className="energy-item">
                  <span>
                    <i className="energy-dot gray" />
                    기체가 한 일 <b>W</b>
                  </span>
                  <strong>
                    {energy(state.W)} <small>kJ</small>
                  </strong>
                </div>
                <span className="equation-sign">=</span>
                <div className="energy-item energy-result">
                  <span>
                    <i className="energy-dot dark" />
                    내부 에너지 변화 <b>ΔU</b>
                  </span>
                  <strong>
                    {energy(state.dU)} <small>kJ</small>
                  </strong>
                </div>
              </div>
              <div className="energy-insight">
                <span className="insight-icon">
                  <Info size={14} />
                </span>
                <p>{meta.note}</p>
              </div>
            </div>
          </div>
        </div>
        <div className="law-strip">
          <span className="law-icon">
            <Beaker size={21} strokeWidth={1.5} />
          </span>
          <div>
            <strong>모든 순간, 하나의 법칙</strong>
            <span>이상기체 상태 방정식</span>
          </div>
          <div className="law-calculation">
            <b>PV</b>
            <span>{fmt((state.P * state.V) / 1000, 3)} kJ</span>
            <i>=</i>
            <b>nRT</b>
            <span>{fmt((params.n * R * state.T) / 1000, 3)} kJ</span>
            <span className="law-check">
              <Check size={12} /> 성립
            </span>
          </div>
          <button onClick={() => setModal("laws")}>
            법칙 알아보기 <ArrowUpRight size={15} />
          </button>
        </div>
        <section className="exploration" id="exploration">
          <div className="section-kicker">
            <span>
              <b>04</b> 관찰에서 탐구로
            </span>
            <span className="kicker-note">
              직접 비교하고, 나만의 결론을 남겨보세요.
            </span>
          </div>
          <div className="explore-grid">
            <div className="panel question-panel">
              <div className="panel-heading">
                <h2>
                  <BookOpen size={17} /> 탐구 질문
                </h2>
                <span className="mini-tag">THINK & EXPLORE</span>
              </div>
              {questions.map((q, i) => (
                <div
                  className={`question ${expanded === i ? "open" : ""}`}
                  key={q.title}
                >
                  <button
                    aria-expanded={expanded === i}
                    onClick={() => setExpanded(expanded === i ? null : i)}
                  >
                    <span>0{i + 1}</span>
                    <strong>{q.title}</strong>
                    <ChevronDown size={16} />
                  </button>
                  {expanded === i && (
                    <div className="question-body">
                      <p>{q.text}</p>
                      <details>
                        <summary>생각의 실마리</summary>
                        <p>{q.hint}</p>
                      </details>
                    </div>
                  )}
                </div>
              ))}
            </div>
            <div className="panel notebook">
              <div className="panel-heading">
                <h2>나의 탐구 노트</h2>
                <span className="mini-tag">
                  <span className="tiny-dot" /> 이 브라우저에 자동 저장
                </span>
              </div>
              <textarea
                aria-label="나의 탐구 노트"
                placeholder="무엇을 관찰했나요? 열, 일, 내부 에너지의 관계를 나만의 말로 설명해 보세요."
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="notebook-footer">
                <span>예측 → 실험 → 관찰 → 설명</span>
                <span>{note.length} 자</span>
              </div>
            </div>
          </div>
          <div className="panel results-panel">
            <div className="panel-heading">
              <h2>
                실험 기록 <span className="record-count">{records.length}</span>
              </h2>
              <button
                className="export-button"
                disabled={!records.length}
                onClick={download}
              >
                <Download size={14} /> CSV 내보내기
              </button>
            </div>
            {records.length ? (
              <div className="table-scroll">
                <table>
                  <thead>
                    <tr>
                      <th>열역학 과정</th>
                      <th>진행</th>
                      <th>온도 (K)</th>
                      <th>부피 (L)</th>
                      <th>압력 (kPa)</th>
                      <th>Q (kJ)</th>
                      <th>W (kJ)</th>
                      <th>ΔU (kJ)</th>
                      <th>
                        <span className="sr-only">삭제</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.map((r) => (
                      <tr key={r.id}>
                        <td>
                          <span className="table-dot" />
                          {processes[r.process].name}
                          <small>
                            n = {r.params.n} mol · γ = {fmt(r.params.gamma, 2)}
                          </small>
                        </td>
                        <td>{Math.round(r.progress * 100)}%</td>
                        <td>{fmt(r.T)}</td>
                        <td>{fmt(r.V * 1000)}</td>
                        <td>{fmt(r.P / 1000)}</td>
                        <td>{energy(r.Q)}</td>
                        <td>{energy(r.W)}</td>
                        <td>{energy(r.dU)}</td>
                        <td>
                          <button
                            className="icon-button"
                            aria-label={`${processes[r.process].name} 기록 삭제`}
                            onClick={() =>
                              setRecords((prev) =>
                                prev.filter((item) => item.id !== r.id),
                              )
                            }
                          >
                            <X size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="empty-records">
                <span>
                  <FlaskConical size={24} strokeWidth={1.3} />
                </span>
                <p>첫 번째 발견을 기록해 보세요.</p>
                <small>
                  시뮬레이션의 ‘결과 기록’을 누르면 현재 상태가 여기에
                  저장됩니다.
                </small>
              </div>
            )}
            <div className="results-footer">
              최근 8개 기록 · 노트와 기록은 이 브라우저에 저장됩니다.
            </div>
          </div>
        </section>
        <footer>
          <span>
            THERMO LAB <i>·</i> 눈으로 보는 물리, 스스로 발견하는 법칙
          </span>
          <span>
            준정적 이상기체 모형 <i>·</i> Q &gt; 0: 열 흡수 / W &gt; 0: 기체가
            한 일
          </span>
        </footer>
      </main>
      {modal && (
        <Modal onClose={() => setModal(null)}>
          {modal === "chart" ? (
            <>
              <div className="eyebrow">PRESSURE–VOLUME DIAGRAM</div>
              <h2>{meta.name}의 P–V 그래프</h2>
              <PVChart
                params={params}
                process={process}
                progress={progress}
                enlarged
              />
              <p className="modal-copy">
                주황색 영역은 진행한 구간의 ∫ P dV입니다. 팽창에서는 양의 일,
                압축에서는 음의 일이 됩니다. 등적 과정에서는 부피 변화가 없어
                일이 0입니다.
              </p>
            </>
          ) : modal === "laws" ? (
            <>
              <div className="eyebrow">THE LAWS BEHIND THE EXPERIMENT</div>
              <h2>두 법칙으로 연결되는 기체의 변화</h2>
              <div className="law-explanation">
                <h3>PV = nRT</h3>
                <p>
                  P는 압력(Pa), V는 부피(m³), n은 기체의 양(mol), T는 절대
                  온도(K)입니다. R = 8.314 J/(mol·K)이며, 이 앱에서는 1 L =
                  0.001 m³, 1 kPa = 1,000 Pa로 변환해 계산합니다.
                </p>
                <h3>ΔU = Q − W</h3>
                <p>
                  Q는 기체가 흡수한 열, W는 기체가 외부에 한 일입니다. 열을
                  내보내면 Q &lt; 0, 압축을 당하면 W &lt; 0입니다. 내부 에너지
                  변화는 ΔU = nCᵥΔT, Cᵥ = R/(γ − 1)로 계산합니다.
                </p>
                <h3>실험 모형의 가정</h3>
                <p>
                  과정은 마찰 없는 준정적 과정이며 기체는 이상기체입니다. 단원자
                  γ = 5/3, 이원자 γ = 7/5를 사용하고 비열은 일정하다고
                  가정합니다. 분자 애니메이션은 실제 개수·크기를 나타내지 않는
                  정성적 모형입니다.
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="eyebrow">WELCOME TO THERMO LAB</div>
              <h2>나만의 열역학 실험, 이렇게 시작하세요.</h2>
              <ol className="guide-steps">
                <li>
                  <span>01</span>
                  <div>
                    <h3>과정을 선택하세요</h3>
                    <p>
                      등온·등압·등적·단열 중 하나를 고르고 어떤 물리량이
                      일정한지 확인하세요.
                    </p>
                  </div>
                </li>
                <li>
                  <span>02</span>
                  <div>
                    <h3>조건을 정하고 예측하세요</h3>
                    <p>
                      기체의 양, 초기 온도와 부피를 조절하세요. 최종 비율이
                      1보다 작으면 압축(등적에서는 냉각), 크면 팽창(가열)입니다.
                    </p>
                  </div>
                </li>
                <li>
                  <span>03</span>
                  <div>
                    <h3>실험하며 변화를 관찰하세요</h3>
                    <p>
                      ‘실험 시작’을 누르거나 진행률을 직접 움직여 보세요. 조건을
                      바꾸면 새 실험을 위해 진행률이 초기화됩니다.
                    </p>
                  </div>
                </li>
                <li>
                  <span>04</span>
                  <div>
                    <h3>결과를 비교하고 설명하세요</h3>
                    <p>
                      ‘결과 기록’으로 현재 상태를 저장하고 탐구 질문에 답해
                      보세요. 최대 8개 기록을 비교하거나 CSV로 내려받을 수
                      있습니다.
                    </p>
                  </div>
                </li>
              </ol>
              <button
                className="play-button guide-start"
                onClick={() => setModal(null)}
              >
                탐구 시작하기 <ArrowRight size={16} />
              </button>
            </>
          )}
        </Modal>
      )}
    </>
  );
}

function Modal({ children, onClose }) {
  const container = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    container.current.focus();
    const trap = (e) => {
      if (e.key !== "Tab") return;
      const items = [
        ...container.current.querySelectorAll(
          'button, input, select, textarea, a[href], [tabindex="0"]',
        ),
      ];
      if (
        e.shiftKey &&
        (document.activeElement === items[0] ||
          document.activeElement === container.current)
      ) {
        e.preventDefault();
        items.at(-1)?.focus();
      } else if (!e.shiftKey && document.activeElement === items.at(-1)) {
        e.preventDefault();
        items[0]?.focus();
      }
    };
    const el = container.current;
    el.addEventListener("keydown", trap);
    return () => {
      document.body.style.overflow = previousOverflow;
      el.removeEventListener("keydown", trap);
      previous?.focus();
    };
  }, []);
  return (
    <div
      className="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal"
        ref={container}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="열역학 탐구 안내"
      >
        <button
          className="modal-close icon-button"
          aria-label="닫기"
          onClick={onClose}
        >
          <X size={21} />
        </button>
        {children}
      </div>
    </div>
  );
}
