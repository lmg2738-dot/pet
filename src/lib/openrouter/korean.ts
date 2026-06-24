import type { AnalysisResponse, StatusDetail } from "@/types/database";

/** 라틴 문자 비율로 영어 응답 여부 판별 */
export function hasExcessiveEnglish(text: string): boolean {
  if (!text.trim()) return false;
  const latin = text.match(/[a-zA-Z]/g)?.length ?? 0;
  const korean = text.match(/[가-힣]/g)?.length ?? 0;
  if (korean > 0 && latin / (korean + latin) < 0.35) return false;
  return latin > 8 && (korean === 0 || latin > korean);
}

export function isAnalysisMostlyKorean(result: AnalysisResponse): boolean {
  const texts = [
    result.overall_summary,
    ...result.recommendations,
    result.eye_status.status,
    result.eye_status.notes,
    result.skin_status.status,
    result.skin_status.notes,
    result.ear_status.status,
    result.ear_status.notes,
    result.body_status.status,
    result.body_status.notes,
    result.behavior_status.status,
    result.behavior_status.notes,
  ];
  return texts.every((t) => !hasExcessiveEnglish(t));
}

const PHRASE_MAP: [RegExp, string][] = [
  [/\bnormal\b/gi, "정상"],
  [/\bhealthy\b/gi, "건강함"],
  [/\bno (visible )?issues?\b/gi, "특이사항 없음"],
  [/\bnot visible\b/gi, "확인 불가"],
  [/\bcannot (be )?determined\b/gi, "판단 불가"],
  [/\bredness\b/gi, "충혈"],
  [/\bdry(ness)?\b/gi, "건조"],
  [/\bdischarge\b/gi, "분비물"],
  [/\birritation\b/gi, "자극"],
  [/\blethargy\b/gi, "무기력"],
  [/\bstress(ed)?\b/gi, "스트레스"],
  [/\boverweight\b/gi, "과체중"],
  [/\bunderweight\b/gi, "저체중"],
  [/\bclean\b/gi, "깨끗함"],
  [/\bunclear\b/gi, "불명확"],
  [/\brecommend(ed)?\b/gi, "권장"],
  [/\bveterinary\b/gi, "수의사"],
  [/\bvet\b/gi, "수의사"],
  [/\bvisit\b/gi, "방문"],
  [/\bmonitor\b/gi, "관찰"],
  [/\bcheck\b/gi, "확인"],
  [/\beyes?\b/gi, "눈"],
  [/\bskin\b/gi, "피부"],
  [/\bears?\b/gi, "귀"],
  [/\bcoat\b/gi, "털"],
  [/\bposture\b/gi, "자세"],
  [/\bbehavior\b/gi, "행동"],
  [/\blow risk\b/gi, "낮은 위험"],
  [/\bmedium risk\b/gi, "보통 위험"],
  [/\bhigh risk\b/gi, "높은 위험"],
  [/\bno medical diagnosis\b/gi, "수의학적 진단이 아님"],
  [/\bthis is not a medical diagnosis\b/gi, "본 결과는 수의학적 진단이 아닙니다"],
];

function localizeText(text: string): string {
  let result = text;
  for (const [pattern, replacement] of PHRASE_MAP) {
    result = result.replace(pattern, replacement);
  }
  return result.trim();
}

function localizeStatus(detail: StatusDetail): StatusDetail {
  return {
    ...detail,
    status: localizeText(detail.status),
    notes: localizeText(detail.notes),
  };
}

/** AI 응답 후처리: 알려진 영어 표현을 한국어로 치환 */
export function localizeAnalysisResponse(
  result: AnalysisResponse
): AnalysisResponse {
  return {
    ...result,
    overall_summary: localizeText(result.overall_summary),
    recommendations: result.recommendations.map(localizeText),
    eye_status: localizeStatus(result.eye_status),
    skin_status: localizeStatus(result.skin_status),
    ear_status: localizeStatus(result.ear_status),
    body_status: localizeStatus(result.body_status),
    behavior_status: localizeStatus(result.behavior_status),
  };
}

export const KOREAN_RETRY_INSTRUCTION = `
이전 응답에 영어가 포함되어 있습니다.
반드시 아래 JSON의 모든 텍스트 필드(status, notes, overall_summary, recommendations)를
100% 한국어로만 다시 작성하세요. 영어 단어·문장 사용 금지.
JSON 구조와 risk_level(low/medium/high), veterinary_recommended(boolean) 값 형식은 유지하세요.`;

export const DEFAULT_STATUS_KO: StatusDetail = {
  status: "분석 불가",
  confidence: 0,
  notes: "이미지에서 해당 영역을 확인할 수 없습니다.",
};
