export const vincentUserViewFacetSignatures = {
  "address": "0xa3a602f399e9663279cdf63a290101cb6560a87e",
  "methods": {
    "AGENT_PAGE_SIZE": {
      "type": "function",
      "name": "AGENT_PAGE_SIZE",
      "inputs": [],
      "outputs": [
        {
          "name": "",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "stateMutability": "view"
    },
    "getAllAbilitiesAndPoliciesForApp": {
      "type": "function",
      "name": "getAllAbilitiesAndPoliciesForApp",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "appId",
          "type": "uint40",
          "internalType": "uint40"
        }
      ],
      "outputs": [
        {
          "name": "abilities",
          "type": "tuple[]",
          "internalType": "struct VincentUserViewFacet.AbilityWithPolicies[]",
          "components": [
            {
              "name": "abilityIpfsCid",
              "type": "string",
              "internalType": "string"
            },
            {
              "name": "policies",
              "type": "tuple[]",
              "internalType": "struct VincentUserViewFacet.PolicyWithParameters[]",
              "components": [
                {
                  "name": "policyIpfsCid",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "policyParameterValues",
                  "type": "bytes",
                  "internalType": "bytes"
                }
              ]
            }
          ]
        }
      ],
      "stateMutability": "view"
    },
    "getAllPermittedAppIdsForPkp": {
      "type": "function",
      "name": "getAllPermittedAppIdsForPkp",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "offset",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint40[]",
          "internalType": "uint40[]"
        }
      ],
      "stateMutability": "view"
    },
    "getAllRegisteredAgentPkps": {
      "type": "function",
      "name": "getAllRegisteredAgentPkps",
      "inputs": [
        {
          "name": "userAddress",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "offset",
          "type": "uint256",
          "internalType": "uint256"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint256[]",
          "internalType": "uint256[]"
        }
      ],
      "stateMutability": "view"
    },
    "getPermittedAppVersionForPkp": {
      "type": "function",
      "name": "getPermittedAppVersionForPkp",
      "inputs": [
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "appId",
          "type": "uint40",
          "internalType": "uint40"
        }
      ],
      "outputs": [
        {
          "name": "",
          "type": "uint24",
          "internalType": "uint24"
        }
      ],
      "stateMutability": "view"
    },
    "validateAbilityExecutionAndGetPolicies": {
      "type": "function",
      "name": "validateAbilityExecutionAndGetPolicies",
      "inputs": [
        {
          "name": "delegatee",
          "type": "address",
          "internalType": "address"
        },
        {
          "name": "pkpTokenId",
          "type": "uint256",
          "internalType": "uint256"
        },
        {
          "name": "abilityIpfsCid",
          "type": "string",
          "internalType": "string"
        }
      ],
      "outputs": [
        {
          "name": "validation",
          "type": "tuple",
          "internalType": "struct VincentUserViewFacet.AbilityExecutionValidation",
          "components": [
            {
              "name": "isPermitted",
              "type": "bool",
              "internalType": "bool"
            },
            {
              "name": "appId",
              "type": "uint40",
              "internalType": "uint40"
            },
            {
              "name": "appVersion",
              "type": "uint24",
              "internalType": "uint24"
            },
            {
              "name": "policies",
              "type": "tuple[]",
              "internalType": "struct VincentUserViewFacet.PolicyWithParameters[]",
              "components": [
                {
                  "name": "policyIpfsCid",
                  "type": "string",
                  "internalType": "string"
                },
                {
                  "name": "policyParameterValues",
                  "type": "bytes",
                  "internalType": "bytes"
                }
              ]
            }
          ]
        }
      ],
      "stateMutability": "view"
    }
  },
  "events": []
} as const;

export type VincentUserViewFacetSignatures = typeof vincentUserViewFacetSignatures;
