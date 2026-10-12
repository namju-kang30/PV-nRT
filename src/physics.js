export const R = 8.314462618;
export const processes = {
  isothermal: {
    name: "등온 과정",
    english: "ISOTHERMAL",
    constant: "온도 일정",
    symbol: "T",
    relation: "PV = 일정",
    description: "온도를 유지하며 기체를 팽창·압축합니다.",
    note: "온도가 일정하면 내부 에너지는 변하지 않아요. 공급한 열은 모두 기체가 한 일이 됩니다.",
  },
  isobaric: {
    name: "등압 과정",
    english: "ISOBARIC",
    constant: "압력 일정",
    symbol: "P",
    relation: "V / T = 일정",
    description: "압력을 유지하며 기체를 팽창·압축합니다.",
    note: "기체가 팽창하려면 온도가 올라가야 해요. 공급한 열은 내부 에너지 증가와 일에 함께 쓰입니다.",
  },
  isochoric: {
    name: "등적 과정",
    english: "ISOCHORIC",
    constant: "부피 일정",
    symbol: "V",
    relation: "P / T = 일정",
    description: "피스톤을 고정하고 기체를 가열·냉각합니다.",
    note: "부피가 변하지 않으므로 기체가 한 일은 0이에요. 전달된 열은 내부 에너지 변화와 같습니다.",
  },
  adiabatic: {
    name: "단열 과정",
    english: "ADIABATIC",
    constant: "열 교환 없음",
    symbol: "Q",
    relation: "PVᵞ = 일정",
    description: "열의 출입 없이 기체를 팽창·압축합니다.",
    note: "외부와 열을 주고받지 않아요. 팽창할 때 내부 에너지로 일을 하기 때문에 온도가 내려갑니다.",
  },
};
// SI internally: volume m³, pressure Pa, temperature K, energy J.
export function stateAt(
  { process, n, temperature, volume, gamma, ratio },
  progress = 1,
) {
  const V0 = volume / 1000;
  const T0 = temperature;
  const P0 = (n * R * T0) / V0;
  const change = 1 + (ratio - 1) * Math.max(0, Math.min(1, progress));
  const V = process === "isochoric" ? V0 : V0 * change;
  let T = T0;
  if (process === "isobaric" || process === "isochoric") T = T0 * change;
  if (process === "adiabatic") T = T0 * Math.pow(V0 / V, gamma - 1);
  const P = (n * R * T) / V;
  const dU = ((n * R) / (gamma - 1)) * (T - T0);
  let W = 0;
  if (process === "isothermal") W = n * R * T0 * Math.log(V / V0);
  if (process === "isobaric") W = P0 * (V - V0);
  if (process === "adiabatic") W = -dU;
  const Q = process === "adiabatic" ? 0 : dU + W;
  return { V, T, P, P0, V0, T0, dU, W, Q };
}
