import {
  PARSE_USER_DEMAND_SMOKE_SAMPLES,
  parseUserDemand,
  type ParsedDemand,
} from "../apps/web/lib/recommendation/recommendation-engine";

type ComparableField = "userType" | "mindset" | "demandMode" | "city" | "legalDomain";

type CheckResult = {
  name: string;
  pass: boolean;
  details: string[];
};

const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  cyan: "\x1b[36m",
  bold: "\x1b[1m",
};

function compareFields(
  actual: ParsedDemand,
  expected: Partial<Pick<ParsedDemand, ComparableField>>,
): { pass: boolean; details: string[] } {
  const details: string[] = [];
  let pass = true;

  const keys = Object.keys(expected) as ComparableField[];
  for (const key of keys) {
    const expectedValue = expected[key];
    const actualValue = actual[key];
    if (expectedValue !== actualValue) {
      pass = false;
      details.push(`${key} 期望=${String(expectedValue)} 实际=${String(actualValue)}`);
    }
  }

  return { pass, details };
}

function run(): void {
  console.log(
    `\n${colors.bold}${colors.cyan}推荐解析器回归检查${colors.reset}\n样例数: ${PARSE_USER_DEMAND_SMOKE_SAMPLES.length}\n`,
  );

  const results: CheckResult[] = PARSE_USER_DEMAND_SMOKE_SAMPLES.map((sample) => {
    const actual = parseUserDemand(sample.input, sample.answers ?? []);
    const comparison = compareFields(actual, sample.expected);

    const details = [...comparison.details];
    if (comparison.pass) {
      details.push(`输出关键词: ${actual.keywords.join("、")}`);
    }

    return {
      name: sample.name,
      pass: comparison.pass,
      details,
    };
  });

  for (const result of results) {
    if (result.pass) {
      console.log(`${colors.green}✓ PASS${colors.reset} ${result.name}`);
    } else {
      console.log(`${colors.red}✗ FAIL${colors.reset} ${result.name}`);
      for (const line of result.details) {
        console.log(`  - ${line}`);
      }
    }
  }

  const passed = results.filter((item) => item.pass).length;
  const failed = results.length - passed;

  console.log(`\n${colors.bold}统计${colors.reset}`);
  console.log(`${colors.green}通过: ${passed}${colors.reset}`);
  console.log(`${colors.red}失败: ${failed}${colors.reset}`);

  if (failed > 0) {
    process.exit(1);
  }
}

run();
