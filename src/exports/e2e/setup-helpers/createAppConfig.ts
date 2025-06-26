import { PARAMETER_TYPE } from "../constants";

// Type alias for cleaner parameter type definitions
type ParameterType = (typeof PARAMETER_TYPE)[keyof typeof PARAMETER_TYPE];

// Helper function to convert PARAMETER_TYPE values back to their readable names
function getParameterTypeName(value: ParameterType): string {
  const entry = Object.entries(PARAMETER_TYPE).find(([_, v]) => v === value);
  return entry ? entry[0] : `Unknown(${value})`;
}

/**
 * Creates a type-safe app configuration where all arrays must have the same length
 */
export function createAppConfig<const T extends readonly string[]>(
  config: {
    toolIpfsCids: T;
    toolPolicies: { readonly [K in keyof T]: string[] };
    toolPolicyParameterNames: { readonly [K in keyof T]: string[] };
    toolPolicyParameterTypes: { readonly [K in keyof T]: ParameterType[] };
    toolPolicyParameterValues: { readonly [K in keyof T]: string[] };
  },
  {
    debug = false,
    cidToNameMap,
  }: { debug?: boolean; cidToNameMap?: Record<string, string> } = {}
) {
  const appConfig = {
    TOOL_IPFS_CIDS: [...config.toolIpfsCids],
    TOOL_POLICIES: config.toolPolicies.map((policies) => [...policies]),
    TOOL_POLICY_PARAMETER_NAMES: config.toolPolicyParameterNames.map(
      (names) => [...names]
    ),
    TOOL_POLICY_PARAMETER_TYPES: config.toolPolicyParameterTypes.map(
      (types) => [...types]
    ),
    TOOL_POLICY_PARAMETER_VALUES: config.toolPolicyParameterValues.map(
      (values) => [...values]
    ),
  };

  if (debug) {
    console.log("🔍 Debug Configuration Summary:");
    console.log("────────────────────────────────────────");

    config.toolIpfsCids.forEach((cid, index) => {
      const toolName = cidToNameMap?.[cid] || `Unknown Tool`;
      const shortCid = cid.slice(0, 8);

      console.log(`\n📦 Tool ${index + 1}: ${toolName} (${shortCid}...)`);

      // Show policies
      const policies = config.toolPolicies[index];
      if (policies.length === 0) {
        console.log(`   🛡️  Policies: None`);
      } else {
        console.log(`   🛡️  Policies:`);
        policies.forEach((policyCid) => {
          const policyName = cidToNameMap?.[policyCid] || `Unknown Policy`;
          const shortPolicyCid = policyCid.slice(0, 8);
          console.log(`      • ${policyName} (${shortPolicyCid}...)`);
        });
      }

      // Show parameters
      const paramNames = config.toolPolicyParameterNames[index];
      if (paramNames.length === 0) {
        console.log(`   ⚙️  Parameters: None`);
      } else {
        console.log(`   ⚙️  Parameters:`);
        paramNames.forEach((name, paramIndex) => {
          const type = config.toolPolicyParameterTypes[index][paramIndex];
          const value = config.toolPolicyParameterValues[index][paramIndex];
          const typeName = getParameterTypeName(type);
          console.log(`      • ${name}: ${value} (${typeName})`);
        });
      }
    });

    console.log("\n────────────────────────────────────────");
  }

  return appConfig;
}
