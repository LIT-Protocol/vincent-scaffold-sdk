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
    abilityIpfsCids: T;
    abilityPolicies: { readonly [K in keyof T]: string[] };
    abilityPolicyParameterNames: { readonly [K in keyof T]: string[] };
    abilityPolicyParameterTypes: { readonly [K in keyof T]: ParameterType[] };
    abilityPolicyParameterValues: { readonly [K in keyof T]: string[] };
  },
  {
    debug = false,
    cidToNameMap,
  }: { debug?: boolean; cidToNameMap?: Record<string, string> } = {}
) {
  const appConfig = {
    ABILITY_IPFS_CIDS: [...config.abilityIpfsCids],
    ABILITY_POLICIES: config.abilityPolicies.map((policies) => [...policies]),
    ABILITY_POLICY_PARAMETER_NAMES: config.abilityPolicyParameterNames.map(
      (names) => [...names]
    ),
    ABILITY_POLICY_PARAMETER_TYPES: config.abilityPolicyParameterTypes.map(
      (types) => [...types]
    ),
    ABILITY_POLICY_PARAMETER_VALUES: config.abilityPolicyParameterValues.map(
      (values) => [...values]
    ),
  };

  if (debug) {
    console.log("🔍 Debug Configuration Summary:");
    console.log("────────────────────────────────────────");

    config.abilityIpfsCids.forEach((cid, index) => {
      const abilityName = cidToNameMap?.[cid] || `Unknown Ability`;
      const shortCid = cid.slice(0, 8);

      console.log(`\n📦 Ability ${index + 1}: ${abilityName} (${shortCid}...)`);

      // Show policies
      const policies = config.abilityPolicies[index];
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
      const paramNames = config.abilityPolicyParameterNames[index];
      if (paramNames.length === 0) {
        console.log(`   ⚙️  Parameters: None`);
      } else {
        console.log(`   ⚙️  Parameters:`);
        paramNames.forEach((name, paramIndex) => {
          const type = config.abilityPolicyParameterTypes[index][paramIndex];
          const value = config.abilityPolicyParameterValues[index][paramIndex];
          const typeName = getParameterTypeName(type);
          console.log(`      • ${name}: ${value} (${typeName})`);
        });
      }
    });

    console.log("\n────────────────────────────────────────");
  }

  return appConfig;
}
