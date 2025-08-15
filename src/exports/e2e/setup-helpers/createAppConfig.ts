import type { PermissionData } from "@lit-protocol/vincent-contracts-sdk";

/**
 * Creates a type-safe app configuration using the new PermissionData structure
 */
export function createAppConfig(
  config: {
    permissionData: PermissionData;
  },
  {
    debug = false,
    cidToNameMap,
  }: { debug?: boolean; cidToNameMap?: Record<string, string> } = {}
) {
  // Extract ability IPFS CIDs from the permission data
  const abilityIpfsCids = Object.keys(config.permissionData);
  
  // Extract policies for each ability
  const abilityPolicies = abilityIpfsCids.map(abilityIpfsCid => 
    Object.keys(config.permissionData[abilityIpfsCid])
  );

  const appConfig = {
    ABILITY_IPFS_CIDS: abilityIpfsCids,
    ABILITY_POLICIES: abilityPolicies,
    PERMISSION_DATA: config.permissionData,
  };

  if (debug) {
    console.log("🔍 Debug Configuration Summary:");
    console.log("────────────────────────────────────────");

    abilityIpfsCids.forEach((cid, index) => {
      const abilityName = cidToNameMap?.[cid] || `Unknown Ability`;
      const shortCid = cid.slice(0, 8);

      console.log(`\n📦 Ability ${index + 1}: ${abilityName} (${shortCid}...)`);

      // Show policies
      const policies = abilityPolicies[index];
      if (policies.length === 0) {
        console.log(`   🛡️  Policies: None`);
      } else {
        console.log(`   🛡️  Policies:`);
        policies.forEach((policyCid) => {
          const policyName = cidToNameMap?.[policyCid] || `Unknown Policy`;
          const shortPolicyCid = policyCid.slice(0, 8);
          console.log(`      • ${policyName} (${shortPolicyCid}...)`);
          
          // Show policy parameters
          const policyParams = config.permissionData[cid][policyCid];
          if (policyParams && Object.keys(policyParams).length > 0) {
            console.log(`      Parameters:`);
            Object.entries(policyParams).forEach(([paramName, paramValue]) => {
              console.log(`        - ${paramName}: ${paramValue}`);
            });
          }
        });
      }
    });

    console.log("\n────────────────────────────────────────");
  }

  return appConfig;
}
