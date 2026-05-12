export interface IdeaAnalysisData {
  oneLineConclusion?: string;
  overallScore: number;
  verdict: 'GO' | 'PIVOT' | 'STOP';
  scores: Scores;
  failureReasons: string[];
  userCompatibility: string;
  firstActionSteps: string[];
  hookAnalysis?: {
    trigger: string;
    action: string;
    variableReward: string;
    investment: string;
  };
  conversionStrategy?: {
    anchoring: string;
    charmPricing: string;
    scarcity: string;
  };
}

export interface Scores {
  marketDemand: { score: number; explanation: string };
  executionFeasibility: { score: number; explanation: string };
  firstRevenuePotential: { level: string; explanation: string };
  operationalRisk: { level: string; explanation: string };
  competitionLevel: { level: string; explanation: string };
  differentiationPotential: { score: number; explanation: string };
  scalability: { score: number; explanation: string };
  retentionPotential: { score: number; explanation: string };
}

export function generateTemplateActions(idea: string, scores: Scores): { actions: string[], risks: string[], compatibility: string } {
  const normalizedIdea = idea.toLowerCase();
  let actions: string[] = [];
  let risks: string[] = [];
  let compatibility = "솔로 창업자/인디 메이커가 검증하기 적절한 아이디어입니다.";

  // Strategies & Actions
  if (normalizedIdea.match(/플랫폼|마켓플레이스|매칭/)) {
    actions = [
      "초기 타겟팅 좁히기: 공급자와 수요자 중 '더 아쉬운 쪽' 10명을 카카오톡 오픈채팅/커뮤니티에서 직접 모으세요.",
      "개발 없이 수동(노코드/구글폼)으로 첫 매칭 성사시키고 수수료를 받아보세요.",
      "초기 사용자 5명 만족도 조사 후 MVP 개발 여부를 결정하세요."
    ];
    risks = [
      "닭과 달걀의 문제(공급/수요 불균형)로 인한 초기 이탈",
      "트래픽 확보 전 서버/앱 유지보수 비용 소진"
    ];
    compatibility = "양면 시장은 솔로 메이커가 초기에 다루기 어렵습니다. 극도로 좁은 니치 단일 기능으로 시작하는 것을 추천합니다.";
  } else if (normalizedIdea.match(/saas|b2b/)) {
    actions = [
      "페르소나 정의: 이 솔루션으로 당장 매월 10만원 이상을 아낄 수 있는 실무자 직군을 1개만 특정하세요.",
      "제품 없이 랜딩페이지(Framer/Carrd)만 만들어 사전 예약 결제를 시도하세요.",
      "예약자 3명과 커피챗을 통해 진짜 문제인지 검증하세요."
    ];
    risks = [
      "실무자의 니즈와 결제권자(대표)의 니즈 불일치",
      "복잡한 레거시 시스템 연동 요구로 인한 개발 기간 장기화"
    ];
  } else if (normalizedIdea.match(/커뮤니티|템플릿|콘텐츠|뉴스레터/)) {
    actions = [
      "무료 도구(디스코드, 인스타그램, 블로그)로 당장 오늘 콘텐츠 발행을 시작하세요.",
      "초기 구독자/멤버 100명을 위해 첫 번째 유료 다운로드/멤버십 상품을 제안해보세요.",
      "바이럴이 일어날 수 있는 무료 미끼 상품을 제작해 단톡방에 배포하세요."
    ];
    risks = [
      "낮은 진입장벽으로 인한 즉각적인 카피캣 출현",
      "일회성 소비로 끝나 지속적인 리텐션 및 평생가치(LTV) 확보 실패"
    ];
  } else {
    actions = [
      "가장 핵심이 되는 가설 1가지를 문장으로 작성하세요.",
      "주변 지인이 아닌 모르는 사람 10명에게 이 가설을 설명하고 $5 라도 결제할 의향이 있는지 확인하세요.",
      "결제가 일어나지 않는다면 제품을 만들지 말고 피벗하세요."
    ];
    risks = [
      "명확한 타겟 고객 부재로 인한 마케팅 비용 낭비",
      "문제의 크기가 작아 유료 결제 전환 실패"
    ];
  }

  // Inject additional risks based on operational/competition scores
  if (scores.operationalRisk.level === "높음" || scores.operationalRisk.level === "매우 높음") {
    risks.push("운영, 법적 책임 및 폭발적인 CS 요구로 인해 개발보다 운영 로드가 더 큼");
  }
  if (scores.competitionLevel.level === "심함" || scores.competitionLevel.level === "매우심함") {
    risks.push("레드오션 시장으로, 압도적인 마케팅 비용이나 극단적인 나만의 엣지 없이는 묻힐 확률 큼");
  }

  if (scores.executionFeasibility.score <= 40) {
    compatibility = "필요한 하드웨어 생산 혹은 고난이도 AI/머신러닝 개발로 인해 솔로 창업자에게는 매우 리스키하며, 자본이나 팀원이 필요합니다.";
  }

  return { actions, risks, compatibility };
}

export function calculateScores(idea: string): Scores {
  const normalizedIdea = idea.toLowerCase();

  // Basic keyword matching to determine scores based on internal rules.
  // This avoids using LLMs for numerical evaluations as strictly requested.

  // 1. Market Demand
  let marketDemandScore = 60;
  let marketDemandExplanation = "일반적인 아이디어로, 구체적인 수요 조사가 필요합니다.";
  if (normalizedIdea.match(/플랫폼|마켓플레이스|양면시장|매칭/)) {
    marketDemandScore = 75;
    marketDemandExplanation = "플랫폼 모델은 트래픽만 모인다면 광고/거래 수수료의 시장성은 크지만 초기 수요 창출이 가장 어렵습니다.";
  } else if (normalizedIdea.match(/앱|게임|서비스/)) {
    marketDemandScore = 65;
    marketDemandExplanation = "앱/서비스는 포화시장이나 확실한 니치 수요를 잡으면 기회가 있습니다.";
  } else if (normalizedIdea.match(/saas|b2b|기업용|자동화/)) {
    marketDemandScore = 85;
    marketDemandExplanation = "B2B SaaS 모델은 기업의 비용절감/매출증대와 직결되어 시장에서의 수요가 매우 강하고 지불 여력도 높습니다.";
  }

  // 2. Execution Feasibility
  let execScore = 70;
  let execExplanation = "어느 정도의 기술력과 시간이 필요할 것으로 보입니다.";
  if (normalizedIdea.match(/ai|인공지능|머신러닝/)) {
    execScore = 40;
    execExplanation = "AI/ML 모델링을 포함하면 난이도가 급상승하며, 단순 API 연동이라면 70점 수준입니다.";
  } else if (normalizedIdea.match(/하드웨어|iot|기기|센서/)) {
    execScore = 20;
    execExplanation = "하드웨어가 포함되면 생산, 재고, 인증 등 개인 창업자로서 실행 난이도가 매우 높습니다.";
  } else if (normalizedIdea.match(/커뮤니티|뉴스레터|블로그|콘텐츠|디지털|템플릿/)) {
    execScore = 90;
    execExplanation = "노코드 툴이나 기본 솔루션으로 즉각 실행할 수 있어 실행 가능성이 매우 높습니다.";
  }

  // 3. First Revenue Potential
  let revLevel = "보통";
  let revExplanation = "서비스 안정화 및 유저 확보 후 광고나 부분 유료화를 통한 수익 창출이 예상됩니다.";
  if (normalizedIdea.match(/구독|saas|멤버십|프리미엄/)) {
    revLevel = "보통";
    revExplanation = "구독 유도까지 시간이 걸리지만 일단 확보되면 안정적입니다.";
  } else if (normalizedIdea.match(/광고|커뮤니티/)) {
    revLevel = "느림";
    revExplanation = "충분한 트래픽이나 유저를 모아야 하므로 첫 수익까지 오랜 시간이 걸립니다.";
  } else if (normalizedIdea.match(/커머스|판매|강의|전자책|템플릿/)) {
    revLevel = "빠름";
    revExplanation = "완성 후 즉시 판매가 가능하며 마케팅에 따라 첫날부터 수익 발생이 가능합니다.";
  }

  // 4. Operational Risk
  let opLevel = "보통";
  let opExplanation = "일반적인 수준의 유지보수 및 CS가 발생합니다.";
  if (normalizedIdea.match(/플랫폼|매칭|커머스|배달/)) {
    opLevel = "높음";
    opExplanation = "이용자 간 분쟁, 결제/환불, 퀄리티 컨트롤 등 CS 폭발 리스크가 매크로적으로 매우 높습니다.";
  } else if (normalizedIdea.match(/의료|법률|금융/)) {
    opLevel = "매우 높음";
    opExplanation = "특수 규제 산업으로, 법적/운영적 책임 소재와 라이센스 등의 치명적 리스크가 존재합니다.";
  } else if (normalizedIdea.match(/유틸리티|콘텐츠|툴/)) {
    opLevel = "낮음";
    opExplanation = "핵심 가치만 전달하면 되며 별도의 복잡한 CS나 운영 리스크가 적습니다.";
  }

  // 5. Competition Level
  let compLevel = "심함";
  let compExplanation = "대부분의 시장에는 이미 유사한 대안재들이 존재합니다.";
  if (normalizedIdea.match(/앱|게임|다이어트|피트니스|투두|메모/)) {
    compLevel = "매우심함";
    compExplanation = "이미 글로벌 강자부터 수많은 개인까지 피터지게 싸우는 레드오션의 전형입니다.";
  } else if (normalizedIdea.match(/플랫폼|커뮤니티|sns/)) {
    compLevel = "심함";
    compExplanation = "네트워크 효과를 가진 선점자들과 경쟁해야 합니다.";
  } else if (normalizedIdea.match(/특정|전문가|ai|니치/)) {
    compLevel = "보통";
    compExplanation = "타겟을 극도로 좁히면 해당 니치에서는 경쟁이 덜할 수 있습니다.";
  }

  // 6. Differentiation Potential
  let diffScore = 50;
  let diffExplanation = "실행력이나 마케팅 능력으로 승부해야 하며 아이디어 자체의 독창성은 적습니다.";
  if (normalizedIdea.match(/ai|인공지능|자동화/)) {
    diffScore = 75;
    diffExplanation = "AI를 도입하여 기존 프로세스를 압도적으로 줄일 수 있다면 강력한 차별화가 가능합니다.";
  } else if (normalizedIdea.match(/니치|특화|특정/)) {
    diffScore = 80;
    diffExplanation = "구체적인 버티컬 타겟 시 기능적/맥락적으로 매우 날카로운 차별성을 가질 수 있습니다.";
  }

  // 7. Scalability
  let scaleScore = 60;
  let scaleExplanation = "일정 수준 이상의 성장 시 인프라/인력의 비례 성장이 요구됩니다.";
  if (normalizedIdea.match(/오프라인|배송|물류|하드웨어/)) {
    scaleScore = 30;
    scaleExplanation = "물리적 요소가 개입되어 규모 확장에 막대한 자본과 변동비(설비/물류)가 듭니다.";
  } else if (normalizedIdea.match(/saas|앱|소프트웨어|플랫폼|디지털/)) {
    scaleScore = 90;
    scaleExplanation = "소프트웨어의 특성상 재생산 한계비용이 0에 수렴하므로 폭발적인 글로벌 확장이 가능합니다.";
  }

  // 8. Retention Potential
  let retScore = 50;
  let retExplanation = "일회성 해결에 그칠 확률이 높으며 매일 돌아올 당위성을 찾기 어렵습니다.";
  if (normalizedIdea.match(/투두|다이어리|습관|메모|saas|채팅/)) {
    retScore = 85;
    retExplanation = "사용자의 데일리 루틴/업무에 편입되는 도구는 락인 효과가 강력해 리텐션이 높습니다.";
  } else if (normalizedIdea.match(/플랫폼|sns|커뮤니티/)) {
    retScore = 75;
    retExplanation = "이용자들 간의 교류와 콘텐츠 누적이 지속적인 재방문을 이끌어냅니다.";
  } else if (normalizedIdea.match(/템플릿|강의|컨설팅/)) {
    retScore = 30;
    retExplanation = "일회성 구매 성격이 강하여 1인당 반복 구매율이나 앱 재방문율은 극히 낮을 수밖에 없습니다.";
  }

  return {
    marketDemand: { score: marketDemandScore, explanation: marketDemandExplanation },
    executionFeasibility: { score: execScore, explanation: execExplanation },
    firstRevenuePotential: { level: revLevel, explanation: revExplanation },
    operationalRisk: { level: opLevel, explanation: opExplanation },
    competitionLevel: { level: compLevel, explanation: compExplanation },
    differentiationPotential: { score: diffScore, explanation: diffExplanation },
    scalability: { score: scaleScore, explanation: scaleExplanation },
    retentionPotential: { score: retScore, explanation: retExplanation },
  };
}
